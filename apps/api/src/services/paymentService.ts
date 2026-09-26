import Stripe from 'stripe';
import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/db';

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY as string;
    // L6: a live key in a non-prod environment risks real charges from test traffic; a test
    // key in prod means payments silently never actually charge anyone. Neither crashes — just warn.
    if (process.env.NODE_ENV === 'production' && key.startsWith('sk_test_')) {
      console.warn('⚠  STRIPE_SECRET_KEY is a TEST key in a production environment — no real payments will be taken.');
    } else if (process.env.NODE_ENV !== 'production' && key.startsWith('sk_live_')) {
      console.warn('⚠  STRIPE_SECRET_KEY is a LIVE key in a non-production environment — real cards will be charged.');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function webOrigin(): string {
  return process.env.WEB_ORIGIN || 'https://ride-prestige-sigma.vercel.app';
}

export async function createCheckoutSession(input: {
  bookingId: string;
  jobId: string;
  bookingRef: string;
  amount: number;
  customerEmail: string;
  customerName: string;
}): Promise<{ url: string; sessionId: string } | null> {
  if (!isStripeConfigured()) return null;

  const stripe = getStripe();
  const origin = webOrigin();
  // Idempotency key means a network retry or double-submit returns the same session rather
  // than creating a second charge for the same booking.
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: input.customerEmail,
    line_items: [{
      price_data: {
        currency: 'gbp',
        unit_amount: Math.round(input.amount * 100),
        product_data: {
          name: `Ride Prestige booking ${input.bookingRef}`,
          description: `${input.customerName} — estimated fare`,
        },
      },
      quantity: 1,
    }],
    metadata: { bookingId: input.bookingId, jobId: input.jobId, bookingRef: input.bookingRef },
    success_url: `${origin}/thank-you?status=accepted&ref=${encodeURIComponent(input.bookingRef)}&payment=paid`,
    cancel_url: `${origin}/thank-you?status=accepted&ref=${encodeURIComponent(input.bookingRef)}&payment=cancelled`,
  }, { idempotencyKey: `booking-checkout-${input.bookingId}` });

  if (!session.url) return null;

  await prisma.payment.create({
    data: {
      id: `pay-${uuid()}`,
      bookingId: input.bookingId,
      jobId: input.jobId,
      bookingRef: input.bookingRef,
      customerName: input.customerName,
      amount: input.amount,
      method: 'card',
      status: 'pending',
      transactionRef: session.id,
    },
  });

  return { url: session.url, sessionId: session.id };
}

export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  return getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const payment = await prisma.payment.findFirst({ where: { transactionRef: session.id } });
  if (!payment) return;
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'paid',
      paidAt: new Date(),
      transactionRef: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
    },
  });
}

export async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session): Promise<void> {
  const payment = await prisma.payment.findFirst({ where: { transactionRef: session.id } });
  if (!payment) return;
  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
}

// Called when a booking is cancelled — expires the open Stripe session so the customer
// cannot complete payment after the ride has been cancelled, and updates the Payment row.
export async function cancelCheckoutSession(bookingId: string): Promise<void> {
  if (!isStripeConfigured()) return;
  const payment = await prisma.payment.findFirst({ where: { bookingId, status: 'pending' } });
  if (!payment) return;
  try {
    if (payment.transactionRef) {
      await getStripe().checkout.sessions.expire(payment.transactionRef);
    }
  } catch {
    // Session already expired or completed — still update the DB record below
  }
  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'cancelled' } });
}
