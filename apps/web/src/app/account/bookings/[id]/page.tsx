'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Star, X } from 'lucide-react';
import { customerApi } from '@/lib/api-client';

const GOLD = '#c9a84c';
const BRAND_BLACK = '#0a0f1e';

interface Booking {
  id: string;
  reference: string;
  status: string;
  createdAt: string;
  customer: { fullName: string; phone: string; email: string };
  journey: { pickupPostcode: string; dropoffPostcode: string; bookingType: string; date?: string; time?: string; passengers: number; notes?: string };
  vehicleCategory: string;
  estimatedMiles: number | null;
  estimatedFare: number | null;
  jobId: string | null;
}

interface JobSummary { status: string; driverAssigned: boolean; vehicleAssigned: boolean; }

export default function AccountBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [jobSummary, setJobSummary] = useState<JobSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [rateMessage, setRateMessage] = useState('');

  const load = () => customerApi.get<{ success: boolean; data: Booking; jobSummary: JobSummary | null }>(`/api/customer/bookings/${id}`)
    .then(result => { setBooking(result.data); setJobSummary(result.jobSummary); })
    .catch(e => setError(e instanceof Error ? e.message : 'Could not load this booking'))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const cancelBooking = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    setActing(true);
    setError('');
    try {
      await customerApi.put(`/api/customer/bookings/${id}/cancel`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel this booking');
    } finally {
      setActing(false);
    }
  };

  const submitRating = async () => {
    if (!rating) return;
    setActing(true);
    setRateMessage('');
    try {
      await customerApi.post(`/api/customer/bookings/${id}/rate`, { rating, feedback });
      setRateMessage('Thank you for rating your ride!');
    } catch (e) {
      setRateMessage(e instanceof Error ? e.message : 'Could not submit your rating');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading booking...</div>;
  if (error && !booking) return <div className="p-6 text-red-500">{error}</div>;
  if (!booking) return null;

  const cancellable = !['completed', 'cancelled'].includes(booking.status);
  const canTrack = jobSummary && !['completed', 'cancelled'].includes(jobSummary.status);
  const canRate = jobSummary?.status === 'completed';

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => router.push('/account/bookings')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back to bookings
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold" style={{ color: GOLD }}>{booking.reference}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize bg-slate-50 text-slate-600">{booking.status}</span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: BRAND_BLACK }}>{booking.journey.pickupPostcode} &rarr; {booking.journey.dropoffPostcode}</h1>
            <p className="text-sm text-slate-500 mt-1 capitalize">{booking.vehicleCategory} &middot; {booking.journey.passengers} passengers</p>
            {booking.journey.date && <p className="text-sm text-slate-500">{booking.journey.date} {booking.journey.time}</p>}
            {booking.journey.notes && <p className="text-sm text-slate-400 mt-2">Notes: {booking.journey.notes}</p>}
          </div>
          {booking.estimatedFare !== null && (
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: BRAND_BLACK }}>£{booking.estimatedFare}</p>
              {booking.estimatedMiles !== null && <p className="text-xs text-slate-400">{booking.estimatedMiles} miles</p>}
            </div>
          )}
        </div>

        {error && <div className="mt-4 px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

        <div className="flex gap-3 mt-5 flex-wrap">
          {canTrack && (
            <Link href={`/track/${booking.reference}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm" style={{ background: GOLD, color: BRAND_BLACK }}>
              <Navigation size={15} /> Track this ride
            </Link>
          )}
          {cancellable && (
            <button disabled={acting} onClick={cancelBooking} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-600 bg-red-50 disabled:opacity-50">
              <X size={15} /> Cancel booking
            </button>
          )}
        </div>
      </div>

      {jobSummary && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold mb-3" style={{ color: BRAND_BLACK }}>Journey Status</h2>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} />
            <span className="capitalize">{jobSummary.status.replace(/_/g, ' ')}</span>
            {jobSummary.driverAssigned && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Driver assigned</span>}
          </div>
        </div>
      )}

      {canRate && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold mb-3" style={{ color: BRAND_BLACK }}>Rate Your Ride</h2>
          {rateMessage ? (
            <p className="text-sm" style={{ color: GOLD }}>{rateMessage}</p>
          ) : (
            <>
              <div className="flex gap-1.5 mb-4">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star size={26} className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                  </button>
                ))}
              </div>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Tell us about your ride (optional)" className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 mb-3" rows={3} />
              <button disabled={!rating || acting} onClick={submitRating} className="px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50" style={{ background: GOLD, color: BRAND_BLACK }}>
                Submit Rating
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
