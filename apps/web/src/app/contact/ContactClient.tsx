'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, AlertCircle, Send, CheckCircle } from 'lucide-react';
import type { ContactSettings } from '@/lib/cms';

export default function ContactClient({ contact }: { contact: ContactSettings }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', bookingRef: '',
    type: 'enquiry', message: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/backend/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          subject: form.type.replace(/_/g, ' '),
          message: form.message,
          bookingReference: form.bookingRef || undefined,
          type: form.type,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to send your message');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-brand-black pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-brand-gold text-sm font-semibold uppercase tracking-widest mb-3">Get in touch</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-4">
            Contact & support
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Have a question, need assistance, or want to discuss a large booking? We&apos;re here.
          </p>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-5">
              <h2 className="font-display text-2xl font-semibold text-brand-black mb-6">Our details</h2>

              {[
                { icon: Phone, label: 'Phone', value: contact.phoneNumber, href: `tel:${contact.phoneNumber}` },
                { icon: Mail, label: 'Email', value: contact.contactEmail, href: `mailto:${contact.contactEmail}` },
                { icon: MapPin, label: 'Address', value: contact.address },
                { icon: Clock, label: 'Hours', value: '24/7 support available' },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-4 p-5 bg-brand-grey-pale rounded-2xl">
                  <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-brand-grey uppercase tracking-wider mb-1">{label}</p>
                    {href ? (
                      <a href={href} className="text-brand-black font-medium text-sm hover:text-brand-gold transition-colors">{value}</a>
                    ) : (
                      <p className="text-brand-black font-medium text-sm">{value}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
                <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">Urgent booking?</p>
                  <p className="text-xs text-amber-700 leading-relaxed">For same-day or emergency bookings, call us directly for the fastest response.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="card p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-brand-black mb-3">Message received</h3>
                    <p className="text-brand-grey">
                      Thank you for contacting us. We&apos;ll respond within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <h2 className="font-display text-xl font-semibold text-brand-black mb-6">Send a message</h2>

                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="label">Full Name *</label>
                        <input required type="text" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">Email Address *</label>
                        <input required type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">Phone</label>
                        <input type="tel" placeholder="+44 7700 900100" value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">Booking Reference</label>
                        <input type="text" placeholder="e.g. RP-2025-001" value={form.bookingRef} onChange={e => set('bookingRef', e.target.value)} className="input-field" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="label">Enquiry Type</label>
                      <select value={form.type} onChange={e => set('type', e.target.value)} className="input-field">
                        <option value="enquiry">General Enquiry</option>
                        <option value="booking_support">Booking Support</option>
                        <option value="complaint">Complaint</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="mb-6">
                      <label className="label">Message *</label>
                      <textarea required placeholder="Please describe your enquiry in detail..." value={form.message} onChange={e => set('message', e.target.value)} rows={5} className="input-field resize-none" />
                    </div>

                    {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={submitting} className="btn-gold w-full flex items-center justify-center gap-2 py-4 disabled:opacity-60">
                      <Send size={16} />
                      {submitting ? 'Sending...' : 'Send message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
