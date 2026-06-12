'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, CalendarDays, Clock, MapPin, ArrowRight, AlertCircle } from 'lucide-react';

type Mode = 'now' | 'schedule';

const GOLD = '#c9a84c';

function personLabel(n: number): string {
  return n === 1 ? '1 person' : `${n} persons`;
}

export default function BookingWidget() {
  const [mode, setMode] = useState<Mode>('now');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [passengers, setPassengers] = useState(2);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [minDate, setMinDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0]);
  }, []);

  const clearErr = (k: string) =>
    setErrors(prev => { const e = { ...prev }; delete e[k]; return e; });

  const switchMode = useCallback((v: Mode) => {
    setMode(v);
    setErrors({});
    setDate('');
    setTime('');
  }, []);

  const handleSee = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!pickup.trim()) errs.pickup = 'Enter your pickup postcode';
    if (!dropoff.trim()) errs.dropoff = 'Enter your drop-off postcode';
    if (mode === 'schedule') {
      if (!date) errs.date = 'Choose a date';
      if (!time) errs.time = 'Choose a time';
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const qs = new URLSearchParams({
      pickup: pickup.trim().toUpperCase(),
      dropoff: dropoff.trim().toUpperCase(),
      passengers: String(passengers),
      bookingType: mode === 'now' ? 'current' : 'scheduled',
    });
    if (date) qs.set('date', date);
    if (time) qs.set('time', time);

    window.location.href = '/prices?' + qs.toString();
  }, [pickup, dropoff, passengers, mode, date, time]);

  const inputStyle = (hasErr: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '1.1rem 2.75rem 1.1rem 2.75rem',
    border: 'none',
    outline: 'none',
    fontSize: '0.9rem',
    color: '#111827',
    background: hasErr ? '#fff8f8' : '#ffffff',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
  });

  return (
    <section style={{ background: '#ffffff', paddingTop: '80px', paddingBottom: '3.5rem' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 1rem' }}>

        {/* Card */}
        <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.08)' }}>

          {/* Now / Schedule toggle */}
          <div style={{ display: 'flex', borderBottom: '1.5px solid #e5e7eb', background: '#f9fafb' }}>
            {([
              { value: 'now' as Mode, label: 'Now', Icon: Zap },
              { value: 'schedule' as Mode, label: 'Schedule', Icon: CalendarDays },
            ] as const).map(({ value, label, Icon }) => {
              const active = mode === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchMode(value)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    padding: '0.95rem 1rem',
                    fontSize: '0.875rem', fontWeight: active ? 700 : 400,
                    color: active ? '#000000' : '#9ca3af',
                    background: active ? '#ffffff' : 'transparent',
                    borderBottom: `2.5px solid ${active ? '#000000' : 'transparent'}`,
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} /> {label}
                </button>
              );
            })}
          </div>

          {/* Pickup postcode */}
          <div style={{ position: 'relative', borderBottom: '1px solid #f0f0f0', background: errors.pickup ? '#fff8f8' : '#fff' }}>
            <MapPin size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#000000', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Pickup postcode (e.g. S1 1AX)"
              value={pickup}
              maxLength={8}
              onChange={e => { setPickup(e.target.value); clearErr('pickup'); }}
              style={inputStyle(!!errors.pickup)}
            />
            {errors.pickup && (
              <span style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                <AlertCircle size={12} /> {errors.pickup}
              </span>
            )}
          </div>

          {/* Connector */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', height: '22px', background: '#fafafa' }}>
            <div style={{ width: '1px', height: '22px', background: '#e5e7eb', marginLeft: '6.5px' }} />
          </div>

          {/* Dropoff postcode */}
          <div style={{ position: 'relative', borderBottom: '1px solid #f0f0f0', background: errors.dropoff ? '#fff8f8' : '#fff' }}>
            <MapPin size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: GOLD, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Drop-off postcode (e.g. M1 1AB)"
              value={dropoff}
              maxLength={8}
              onChange={e => { setDropoff(e.target.value); clearErr('dropoff'); }}
              style={inputStyle(!!errors.dropoff)}
            />
            {errors.dropoff && (
              <span style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                <AlertCircle size={12} /> {errors.dropoff}
              </span>
            )}
          </div>

          {/* Schedule: date + time */}
          {mode === 'schedule' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ position: 'relative', borderRight: '1px solid #f0f0f0', background: errors.date ? '#fff8f8' : '#fff' }}>
                <CalendarDays size={15} style={{ position: 'absolute', left: '1rem', top: '1rem', color: GOLD, pointerEvents: 'none', zIndex: 1 }} />
                <label style={{ position: 'absolute', left: '2.6rem', top: '0.45rem', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', pointerEvents: 'none' }}>Date</label>
                <input
                  type="date"
                  value={date}
                  min={minDate}
                  onChange={e => { setDate(e.target.value); clearErr('date'); }}
                  style={{ width: '100%', padding: '1.65rem 1rem 0.5rem 2.6rem', border: 'none', outline: 'none', fontSize: '0.88rem', color: date ? '#111827' : '#9ca3af', background: 'transparent', fontFamily: 'inherit', cursor: 'pointer', WebkitAppearance: 'none' }}
                />
                {errors.date && <p style={{ color: '#ef4444', fontSize: '0.7rem', padding: '0 1rem 0.5rem', margin: 0 }}>{errors.date}</p>}
              </div>
              <div style={{ position: 'relative', background: errors.time ? '#fff8f8' : '#fff' }}>
                <Clock size={15} style={{ position: 'absolute', left: '1rem', top: '1rem', color: GOLD, pointerEvents: 'none', zIndex: 1 }} />
                <label style={{ position: 'absolute', left: '2.6rem', top: '0.45rem', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', pointerEvents: 'none' }}>Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => { setTime(e.target.value); clearErr('time'); }}
                  style={{ width: '100%', padding: '1.65rem 1rem 0.5rem 2.6rem', border: 'none', outline: 'none', fontSize: '0.88rem', color: time ? '#111827' : '#9ca3af', background: 'transparent', fontFamily: 'inherit', cursor: 'pointer', WebkitAppearance: 'none' }}
                />
                {errors.time && <p style={{ color: '#ef4444', fontSize: '0.7rem', padding: '0 1rem 0.5rem', margin: 0 }}>{errors.time}</p>}
              </div>
            </div>
          )}

          {/* Passengers + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem', background: '#f9fafb' }}>
            <select
              value={passengers}
              onChange={e => setPassengers(parseInt(e.target.value))}
              style={{ padding: '0.65rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '0.82rem', color: '#374151', background: '#ffffff', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
            >
              {Array.from({ length: 70 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{personLabel(n)}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSee}
              disabled={loading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.72rem 1.25rem', background: loading ? '#333' : '#000000', color: '#ffffff', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'wait' : 'pointer', border: 'none', outline: 'none', fontFamily: 'inherit', transition: 'background 0.15s' }}
            >
              {loading ? 'Finding prices…' : <><span>See Prices</span> <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#d1d5db', fontSize: '0.7rem', marginTop: '0.875rem' }}>
          No payment required &mdash; instant fare estimate
        </p>
      </div>
    </section>
  );
}
