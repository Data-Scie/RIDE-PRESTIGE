'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, MessageSquareText, Star } from 'lucide-react';

export default function RateRideClient() {
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function submitRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!rating) {
      setError('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/backend/public/booking/${encodeURIComponent(reference.trim())}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), rating, feedback: feedback.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Unable to submit your rating');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your rating');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="min-h-[72vh] bg-slate-50 px-4 py-20">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <MessageSquareText size={28} />
          </div>
          <h1 className="font-display text-4xl font-semibold text-slate-900">Rate your ride</h1>
          <p className="mt-3 text-slate-600">Your feedback helps us recognise excellent drivers and improve every journey.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto text-emerald-500" size={52} />
              <h2 className="mt-5 text-2xl font-semibold text-slate-900">Thank you</h2>
              <p className="mt-2 text-slate-600">Your rating has been shared with Ride Prestige and the driver.</p>
            </div>
          ) : (
            <form onSubmit={submitRating} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="booking-reference">Booking reference</label>
                <input id="booking-reference" required value={reference} onChange={event => setReference(event.target.value)}
                  placeholder="e.g. RP-2026-ABC123" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="booking-email">Booking email</label>
                <input id="booking-email" type="email" required value={email} onChange={event => setEmail(event.target.value)}
                  placeholder="The email used for your booking" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100" />
              </div>
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-slate-700">How was your driver and ride?</legend>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" aria-label={`${star} star${star === 1 ? '' : 's'}`}
                      onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)} className="rounded-lg p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400">
                      <Star size={38} className={star <= (hoveredRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="ride-feedback">Comments <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea id="ride-feedback" rows={4} maxLength={1000} value={feedback} onChange={event => setFeedback(event.target.value)}
                  placeholder="Tell us what went well or what we can improve" className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100" />
              </div>
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={submitting}
                className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? 'Submitting...' : 'Submit feedback'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
