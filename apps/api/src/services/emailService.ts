interface EmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendTransactionalEmail(input: EmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'Ride Prestige <bookings@rideprestige.co.uk>';
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Email disabled] ${input.subject} -> ${input.to}`);
    }
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Transactional email failed:', error);
    return false;
  }
}

export function bookingConfirmationEmail(details: {
  reference: string;
  customerName: string;
  pickup: string;
  dropoff: string;
  fare: number;
  dateTime: Date;
}) {
  const formattedFare = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(details.fare);
  const formattedDate = details.dateTime.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const text = [
    `Hello ${details.customerName},`,
    '',
    `Your Ride Prestige booking request has been received.`,
    `Reference: ${details.reference}`,
    `Pickup: ${details.pickup}`,
    `Drop-off: ${details.dropoff}`,
    `Scheduled time: ${formattedDate}`,
    `Estimated fare: ${formattedFare}`,
    '',
    'Our operations team will manage dispatch and driver details.',
    'Thank you for choosing Ride Prestige.',
  ].join('\n');
  return {
    subject: `Ride Prestige booking received: ${details.reference}`,
    text,
    html: `<p>Hello ${details.customerName},</p><p>Your Ride Prestige booking request has been received.</p><ul><li><strong>Reference:</strong> ${details.reference}</li><li><strong>Pickup:</strong> ${details.pickup}</li><li><strong>Drop-off:</strong> ${details.dropoff}</li><li><strong>Scheduled time:</strong> ${formattedDate}</li><li><strong>Estimated fare:</strong> ${formattedFare}</li></ul><p>Our operations team will manage dispatch and driver details.</p><p>Thank you for choosing Ride Prestige.</p>`,
  };
}
