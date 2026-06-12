'use client';

import { useState } from 'react';
import { Search, Filter, Eye, ChevronDown, MapPin, Users, Calendar } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { mockBookings } from '@/lib/data';
import { getCategoryLabel } from '@/lib/fare';
import type { Booking, BookingStatus, VehicleCategory } from '@/types';

const STATUS_OPTIONS: (BookingStatus | 'all')[] = ['all', 'pending', 'quoted', 'accepted', 'rejected', 'completed', 'cancelled'];
const VEHICLE_OPTIONS: (VehicleCategory | 'all')[] = ['all', 'prestige', 'minibus', 'coaches', 'taxi'];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const filtered = bookings.filter(b => {
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchVehicle = filterVehicle === 'all' || b.vehicleCategory === filterVehicle;
    const matchSearch = !search || [b.customer.fullName, b.reference, b.customer.email].some(v =>
      v.toLowerCase().includes(search.toLowerCase())
    );
    return matchStatus && matchVehicle && matchSearch;
  });

  const updateStatus = (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const saveNote = () => {
    if (!selected) return;
    setBookings(prev => prev.map(b => b.id === selected.id ? { ...b, adminNotes: adminNote } : b));
    setSelected(prev => prev ? { ...prev, adminNotes: adminNote } : null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-brand-grey-pale border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search size={14} className="text-brand-grey" />
            <input
              type="text" placeholder="Search bookings..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-brand-black placeholder-brand-grey focus:outline-none w-full"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="input-field w-auto text-sm py-2">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}
            className="input-field w-auto text-sm py-2">
            {VEHICLE_OPTIONS.map(v => <option key={v} value={v}>{v === 'all' ? 'All vehicles' : getCategoryLabel(v as VehicleCategory)}</option>)}
          </select>
          <div className="text-xs text-brand-grey ml-auto">{filtered.length} results</div>
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
        {/* Table */}
        <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${selected ? 'lg:col-span-2' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Reference', 'Customer', 'Journey', 'Vehicle', 'Date', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(b => (
                  <tr key={b.id} onClick={() => { setSelected(b); setAdminNote(b.adminNotes || ''); }}
                    className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selected?.id === b.id ? 'bg-brand-gold/4' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-brand-grey whitespace-nowrap">{b.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-black">{b.customer.fullName}</p>
                      <p className="text-xs text-brand-grey">{b.customer.email}</p>
                    </td>
                    <td className="px-4 py-3 max-w-40">
                      <p className="text-xs truncate text-brand-black font-mono">{b.journey.pickupPostcode}</p>
                      <p className="text-xs truncate text-brand-grey font-mono">→ {b.journey.dropoffPostcode}</p>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize whitespace-nowrap">{getCategoryLabel(b.vehicleCategory)}</td>
                    <td className="px-4 py-3 text-xs text-brand-grey whitespace-nowrap">{b.journey.date || 'ASAP'}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Eye size={14} className="text-brand-grey" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-brand-grey text-sm">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 h-fit">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-brand-grey">{selected.reference}</p>
                <h3 className="font-display text-lg font-semibold text-brand-black mt-0.5">{selected.customer.fullName}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-brand-grey hover:text-brand-black text-xl leading-none">×</button>
            </div>

            {/* Customer */}
            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">Customer</p>
              <p className="text-brand-black">{selected.customer.email}</p>
              <p className="text-brand-black">{selected.customer.phone}</p>
            </div>

            {/* Journey */}
            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">Journey</p>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-brand-gold mt-0.5 shrink-0" />
                <span className="text-brand-black font-mono">{selected.journey.pickupPostcode}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-brand-charcoal/40 mt-0.5 shrink-0" />
                <span className="text-brand-black font-mono">{selected.journey.dropoffPostcode}</span>
              </div>
              {selected.journey.date && (
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-brand-grey" />
                  <span className="text-brand-grey">{selected.journey.date} at {selected.journey.time}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users size={13} className="text-brand-grey" />
                <span className="text-brand-grey">{selected.journey.passengers} passengers</span>
              </div>
            </div>

            {/* Status update */}
            <div>
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-2">Update status</p>
              <div className="grid grid-cols-2 gap-2">
                {(['pending', 'quoted', 'accepted', 'completed', 'rejected', 'cancelled'] as BookingStatus[]).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 capitalize ${
                      selected.status === s
                        ? 'bg-brand-black text-white border-brand-black'
                        : 'border-gray-200 text-brand-grey hover:border-gray-300 hover:text-brand-black'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin notes */}
            <div>
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-2">Admin notes</p>
              <textarea
                value={adminNote} onChange={e => setAdminNote(e.target.value)}
                rows={3} placeholder="Add internal notes..."
                className="input-field resize-none text-xs"
              />
              <button onClick={saveNote} className="mt-2 btn-gold w-full py-2 text-xs">Save notes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
