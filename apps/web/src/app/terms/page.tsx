import type { Metadata } from 'next';
import PublicLayout from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Ride Prestige terms and conditions for transport booking and hire services.',
};

const sections = [
  { title: '1. Definitions', content: `"Ride Prestige", "we", "us" refers to Ride Prestige Ltd. "Customer", "you" refers to the individual or organisation making a booking. "Journey" refers to the transport service booked through our platform.` },
  { title: '2. Booking and confirmation', content: `All bookings are subject to vehicle availability and confirmation by Ride Prestige. A booking is confirmed only when you receive a written confirmation from us. Quote estimates are indicative only; final fares are confirmed at booking stage.` },
  { title: '3. Payment terms', content: `Payment is due at the time of booking unless a corporate account with invoicing terms has been agreed. We accept all major credit and debit cards processed securely via Stripe. Invoiced accounts are payable within 30 days of invoice date.` },
  { title: '4. Cancellation policy', content: `Cancellations made more than 24 hours before the scheduled departure time will receive a full refund. Cancellations within 24 hours of departure may incur a charge of up to 50% of the total fare. No-shows are non-refundable. Cancellations must be confirmed in writing.` },
  { title: '5. Waiting time', content: `15 minutes of complimentary waiting time is included on all bookings. Additional waiting time is charged at the current published rate per 15-minute block. For airport pickups, we monitor your flight and adjust waiting time accordingly without additional charge for flight delays.` },
  { title: '6. Passenger conduct', content: `Passengers are expected to conduct themselves appropriately during all journeys. Ride Prestige reserves the right to refuse transport or terminate a journey if passenger conduct is deemed unsafe, abusive, or in violation of applicable laws. No refund will be provided in such circumstances.` },
  { title: '7. Luggage and property', content: `Customers are responsible for their own luggage and personal property. Ride Prestige accepts no liability for loss or damage to luggage unless caused by the proven negligence of our driver. Excess luggage must be declared at the time of booking.` },
  { title: '8. Liability', content: `Ride Prestige carries full public liability insurance and employer's liability insurance as required by UK law. Our liability to you shall not exceed the total fare paid for the relevant journey. We are not liable for consequential losses including missed flights or appointments.` },
  { title: '9. Force majeure', content: `We shall not be liable for failure to perform our obligations due to circumstances beyond our reasonable control, including severe weather, traffic incidents, road closures, or civil emergencies. In such cases, we will endeavour to notify you promptly.` },
  { title: '10. Governing law', content: `These terms are governed by the laws of England and Wales. Any disputes arising from these terms or from a booking shall be subject to the exclusive jurisdiction of the English courts.` },
];

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="bg-brand-black pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-3">Terms & Conditions</h1>
          <p className="text-white/50 text-sm">Last updated: 1 January 2025</p>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-grey leading-relaxed mb-10">
            Please read these terms and conditions carefully before making a booking with Ride Prestige. By completing a booking, you agree to be bound by these terms.
          </p>
          <div className="space-y-10">
            {sections.map(({ title, content }) => (
              <div key={title}>
                <h2 className="font-display text-xl font-semibold text-brand-black mb-3">{title}</h2>
                <p className="text-brand-grey leading-relaxed text-sm">{content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

