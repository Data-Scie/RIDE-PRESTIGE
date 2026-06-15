'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

const CATEGORIES = ['prestige', 'minibus', 'coaches', 'taxi'];

export default function NewRidePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', customerEmail: '',
    pickupAddress: '', dropoffAddress: '',
    dateTime: '', passengerCount: '1', luggageCount: '0',
    vehicleCategory: 'prestige', fareAmount: '',
    specialInstructions: '', flightNumber: '',
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body = {
        ...form,
        passengerCount: parseInt(form.passengerCount) || 1,
        luggageCount: parseInt(form.luggageCount) || 0,
        fareAmount: parseFloat(form.fareAmount),
      };
      await opsApi.post('/api/ops/rides', body);
      router.push('/ops/rides');
    } catch (e) {
      setError((e as Error).message || 'Failed to create ride');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label: string, key: string, type = 'text', required = true, placeholder = '') => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input
        type={type} required={required} placeholder={placeholder}
        value={form[key as keyof typeof form] as string}
        onChange={e => set(key, e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/ops/rides" className="flex items-center gap-1.5 text-slate-500 text-sm"><ArrowLeft size={15} /> Back to Rides</Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Create New Ride</h1>
        <p className="text-slate-500 text-sm mt-1">Manually add a booking and dispatch to affiliates and drivers.</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <form onSubmit={submit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Customer Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Full Name', 'customerName', 'text', true, 'John Smith')}
            {field('Phone Number', 'customerPhone', 'tel', true, '+44 7700 000000')}
            {field('Email (optional)', 'customerEmail', 'email', false, 'john@example.com')}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Journey Details</h2>
          <div className="grid grid-cols-1 gap-4">
            {field('Pickup Address', 'pickupAddress', 'text', true, '123 High Street, Sheffield')}
            {field('Drop-off Address', 'dropoffAddress', 'text', true, 'Manchester Airport, Terminal 1')}
            {field('Date & Time', 'dateTime', 'datetime-local', true)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {field('Passengers', 'passengerCount', 'number')}
            {field('Luggage', 'luggageCount', 'number')}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vehicle Category<span className="text-red-500 ml-0.5">*</span></label>
              <select value={form.vehicleCategory} onChange={e => set('vehicleCategory', e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-blue-400 capitalize">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          {field('Fare Amount (£)', 'fareAmount', 'number', true, '85.00')}
          {field('Flight Number (optional)', 'flightNumber', 'text', false, 'BA1234')}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Special Instructions</label>
            <textarea
              value={form.specialInstructions}
              onChange={e => set('specialInstructions', e.target.value)}
              rows={3} placeholder="Any special requirements for this booking…"
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-blue-400 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity" style={{ background: '#3b82f6' }}>
            {submitting ? 'Creating ride…' : 'Create Ride & Dispatch'}
          </button>
          <Link href="/ops/rides" className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
