import Stripe from 'stripe';
import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/db';

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string);
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
  });

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
