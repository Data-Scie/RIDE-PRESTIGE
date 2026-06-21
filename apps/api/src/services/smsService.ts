const SMS_TIMEOUT_MS = 8000;

export function isSmsConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

export async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS disabled] ${body} -> ${to}`);
    }
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SMS_TIMEOUT_MS);
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: controller.signal,
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    });
    return response.ok;
  } catch (error) {
    console.error('SMS send failed:', error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function bookingConfirmationSms(details: { reference: string; pickup: string; dropoff: string; fare: number }): string {
  const formattedFare = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(details.fare);
  return `Ride Prestige: booking ${details.reference} received, ${details.pickup} to ${details.dropoff}, est. fare ${formattedFare}. We'll text you when a driver is assigned.`;
}
