import type { Metadata } from 'next';
import PublicLayout from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Ride Prestige privacy policy. How we collect, use and protect your personal data.',
};

const sections = [
  {
    title: '1. Information we collect',
    content: `We collect information you provide directly to us when you make a booking or enquiry, including your name, email address, phone number, and journey details. We also collect technical information about your use of our website, including IP address, browser type, and pages visited.`,
  },
  {
    title: '2. How we use your information',
    content: `We use your personal information to process and manage your bookings, communicate with you about your journeys, send booking confirmations and driver details, respond to your enquiries and complaints, improve our services and website, and comply with our legal obligations.`,
  },
  {
    title: '3. Data sharing',
    content: `We do not sell your personal data. We may share your information with our drivers to fulfil your journey, payment processors to handle transactions, and technology service providers who support our operations. All third parties are bound by strict data protection agreements.`,
  },
  {
    title: '4. Data retention',
    content: `We retain your booking data for up to 7 years for legal and accounting purposes. Contact and support records are retained for 3 years. You may request deletion of your data at any time, subject to our legal retention obligations.`,
  },
  {
    title: '5. Your rights',
    content: `Under UK GDPR, you have the right to access, correct, or delete your personal data. You may also object to certain processing, request restriction of processing, and request data portability. To exercise any of these rights, contact us at the details below.`,
  },
  {
    title: '6. Cookies',
    content: `We use essential cookies to ensure our website functions correctly. We do not use tracking or advertising cookies without your consent. You can control cookie settings through your browser preferences.`,
  },
  {
    title: '7. Security',
    content: `We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. All data is transmitted over encrypted connections (HTTPS).`,
  },
  {
    title: '8. Contact us',
    content: `If you have questions about this policy or wish to exercise your rights, contact our Data Controller at: bookings@rideprestige.co.uk or write to Ride Prestige Ltd, 12 Prestige House, Mayfair, London W1K 4DH.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <div className="bg-brand-black pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-3">Privacy Policy</h1>
          <p className="text-white/50 text-sm">Last updated: 1 January 2025</p>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-grey leading-relaxed mb-10">
            Ride Prestige Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting and respecting your privacy. This policy explains how we collect, use and protect your personal data when you use our services.
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

