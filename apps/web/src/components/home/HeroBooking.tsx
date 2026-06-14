'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Users, Zap, CalendarDays, ArrowRight } from 'lucide-react';

type BookingMode = 'now' | 'schedule';

const GOLD = '#c9a84c';
const BLACK = '#0a0f1e';

export default function HeroBooking() {
  const router = useRouter();
  const [mode, setMode] = useState<BookingMode>('now');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [passengers, setPassengers] = useState(4);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) =>
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!pickup.trim()) e.pickup = 'Enter a pickup location';
    if (!dropoff.trim()) e.dropoff = 'Enter a drop-off location';
    if (mode === 'schedule') {
      if (!date) e.date = 'Pick a date';
      if (!time) e.time = 'Pick a time';
    }
    return e;
  };

  const handleSeePrices = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const params = new URLSearchParams({
      pickup,
      dropoff,
      passengers: String(passengers),
      bookingType: mode === 'now' ? 'current' : 'scheduled',
      ...(date && { date }),
      ...(time && { time }),
    });
    router.push('/prices?' + params.toString());
  };

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center"
      style={{ background: BLACK }}
    >
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      {/* Warm glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Booking card */}
      <div
        className="relative w-full mx-4 rounded-3xl overflow-hidden"
        style={{
          maxWidth: '460px',
          background: 'white',
          boxShadow: '0 32px 100px rgba(0,0,0,0.55)',
        }}
      >
        {/* Gold top stripe */}
        <div
          className="h-1"
          style={{ background: 'linear-gradient(90deg,#c9a84c,#e8c96d,#a07c30)' }}
        />

        <div className="p-8 sm:p-10">
          {/* Heading */}
          <h1
            className="mb-6"
            style={{
              fontFamily: 'Playfair Display,Georgia,serif',
              fontSize: '1.7rem',
              fontWeight: 600,
              color: BLACK,
              lineHeight: 1.2,
            }}
          >
            Where are you going?
          </h1>

          {/* Mode toggle */}
          <div
            className="flex gap-1.5 mb-7 p-1 rounded-2xl"
            style={{ background: '#f0f1f5' }}
          >
            {[
              { value: 'now' as BookingMode, label: 'Now', Icon: Zap },
              { value: 'schedule' as BookingMode, label: 'Schedule', Icon: CalendarDays },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: mode === value ? 'white' : 'transparent',
                  color: mode === value ? BLACK : '#9ca3af',
                  boxShadow: mode === value ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Pickup */}
          <div className="mb-4">
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: GOLD }}
              />
              <input
                type="text"
                placeholder="Pickup location"
                value={pickup}
                onChange={e => { setPickup(e.target.value); clearError('pickup'); }}
                className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm outline-none transition-all"
                style={{
                  background: '#f8f9fb',
                  border: `1.5px solid ${errors.pickup ? '#f87171' : '#e8eaef'}`,
                  color: BLACK,
                  fontFamily: 'inherit',
                }}
                onFocus={e => { if (!errors.pickup) e.target.style.borderColor = GOLD; }}
                onBlur={e => { if (!errors.pickup) e.target.style.borderColor = '#e8eaef'; }}
              />
            </div>
            {errors.pickup && <p className="text-red-500 text-xs mt-1.5 pl-1">{errors.pickup}</p>}
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="flex-1 h-px" style={{ background: '#ebedf2' }} />
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: '#f0f1f5' }}
            >
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                <path d="M5 1v10M1 7l4 4 4-4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 h-px" style={{ background: '#ebedf2' }} />
          </div>

          {/* Dropoff */}
          <div className="mb-5">
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(139,143,168,0.6)' }}
              />
              <input
                type="text"
                placeholder="Drop-off location"
                value={dropoff}
                onChange={e => { setDropoff(e.target.value); clearError('dropoff'); }}
                className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm outline-none transition-all"
                style={{
                  background: '#f8f9fb',
                  border: `1.5px solid ${errors.dropoff ? '#f87171' : '#e8eaef'}`,
                  color: BLACK,
                  fontFamily: 'inherit',
                }}
                onFocus={e => { if (!errors.dropoff) e.target.style.borderColor = GOLD; }}
                onBlur={e => { if (!errors.dropoff) e.target.style.borderColor = '#e8eaef'; }}
              />
            </div>
            {errors.dropoff && <p className="text-red-500 text-xs mt-1.5 pl-1">{errors.dropoff}</p>}
          </div>

          {/* Passengers */}
          <div className="mb-5">
            <div className="relative">
              <Users
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: '#9ca3af' }}
              />
              <select
                value={passengers}
                onChange={e => setPassengers(parseInt(e.target.value))}
                className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm outline-none transition-all appearance-none cursor-pointer"
                style={{
                  background: '#f8f9fb',
                  border: '1.5px solid #e8eaef',
                  color: BLACK,
                  fontFamily: 'inherit',
                }}
                onFocus={e => { e.target.style.borderColor = GOLD; }}
                onBlur={e => { e.target.style.borderColor = '#e8eaef'; }}
              >
                {Array.from({ length: 70 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>
                    {n} passenger{n !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Date + Time (schedule only) */}
          {mode === 'schedule' && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setDate(e.target.value); clearError('date'); }}
                  className="w-full px-4 py-4 rounded-2xl text-sm outline-none transition-all"
                  style={{
                    background: '#f8f9fb',
                    border: `1.5px solid ${errors.date ? '#f87171' : '#e8eaef'}`,
                    color: BLACK,
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => { if (!errors.date) e.target.style.borderColor = GOLD; }}
                  onBlur={e => { if (!errors.date) e.target.style.borderColor = '#e8eaef'; }}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <input
                  type="time"
                  value={time}
                  onChange={e => { setTime(e.target.value); clearError('time'); }}
                  className="w-full px-4 py-4 rounded-2xl text-sm outline-none transition-all"
                  style={{
                    background: '#f8f9fb',
                    border: `1.5px solid ${errors.time ? '#f87171' : '#e8eaef'}`,
                    color: BLACK,
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => { if (!errors.time) e.target.style.borderColor = GOLD; }}
                  onBlur={e => { if (!errors.time) e.target.style.borderColor = '#e8eaef'; }}
                />
                {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSeePrices}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg,#c9a84c,#e8c96d,#a07c30)',
              color: BLACK,
              boxShadow: '0 8px 32px rgba(201,168,76,0.35)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(201,168,76,0.45)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(201,168,76,0.35)'; }}
          >
            See Prices <ArrowRight size={18} />
          </button>

          <p className="text-center text-xs mt-4" style={{ color: '#b0b4c4' }}>
            No payment required &mdash; instant fare estimate
          </p>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Scroll to explore
        </p>
        <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, rgba(201,168,76,0.4), transparent)' }} />
      </div>
    </section>
  );
}
