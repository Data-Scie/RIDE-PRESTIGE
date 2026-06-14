'use client';

import { useEffect, useState } from 'react';
import { Car, Plus, Save, Trash2, X } from 'lucide-react';
import { affiliateApi } from '@/lib/api-client';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  colour: string;
  vehicleType: string;
  vehicleCategory: string;
  passengerCapacity: number;
  luggageCapacity: number;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  motExpiry: string;
  insuranceExpiry: string;
  phvLicenceExpiry: string;
}

const EMPTY_FORM = {
  make: '',
  model: '',
  year: String(new Date().getFullYear()),
  registration: '',
  colour: '',
  vehicleType: 'Saloon',
  vehicleCategory: 'taxi',
  passengerCapacity: '4',
  luggageCapacity: '2',
  motExpiry: '',
  insuranceExpiry: '',
  phvLicenceExpiry: '',
};

const inputClass = 'w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400';

export default function AffiliateVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (key: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [key]: value }));

  const loadVehicles = async () => {
    const result = await affiliateApi.get<{ success: boolean; data: Vehicle[] }>('/api/affiliate/vehicles');
    setVehicles(result.data);
  };

  useEffect(() => {
    loadVehicles().catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const addVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await affiliateApi.post('/api/affiliate/vehicles', {
        ...form,
        year: Number(form.year),
        passengerCapacity: Number(form.passengerCapacity),
        luggageCapacity: Number(form.luggageCapacity),
      });
      await loadVehicles();
      setForm(EMPTY_FORM);
      setModal(false);
    } catch (e) {
      setError((e as Error).message || 'Could not add vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const removeVehicle = async (id: string) => {
    try {
      await affiliateApi.put(`/api/affiliate/vehicles/${id}/remove`, {});
      setVehicles(previous => previous.filter(vehicle => vehicle.id !== id));
    } catch (e) {
      setError((e as Error).message || 'Could not remove vehicle');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading vehicles...</div>;

  const availableCount = vehicles.filter(vehicle => vehicle.status === 'available').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Vehicles</h1>
          <p className="text-slate-500 text-sm">{availableCount} available · {vehicles.length} total</p>
        </div>
        <button onClick={() => { setError(''); setModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-green-600">
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map(vehicle => {
          const available = vehicle.status === 'available';
          return (
            <div key={vehicle.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${available ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}><Car size={22} /></div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${available ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{vehicle.status.replace('_', ' ')}</span>
              </div>
              <h3 className="font-bold text-slate-800">{vehicle.make} {vehicle.model} ({vehicle.year})</h3>
              <p className="text-sm text-slate-500 mt-1">{vehicle.registration} · {vehicle.colour} · {vehicle.vehicleType}</p>
              <p className="text-xs text-slate-400 mt-1">{vehicle.passengerCapacity} passengers · {vehicle.luggageCapacity} luggage · {vehicle.vehicleCategory}</p>
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => removeVehicle(vehicle.id)} className="ml-auto p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50" aria-label={`Remove ${vehicle.registration}`}><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
        {!vehicles.length && <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-400 text-sm">No vehicles added yet</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 my-6">
            <div className="flex items-center justify-between mb-5">
              <div><h3 className="font-bold text-slate-800 text-lg">Add Vehicle</h3><p className="text-xs text-slate-500">Vehicle and compliance details are required before it can receive rides.</p></div>
              <button onClick={() => setModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={addVehicle} className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Make *"><input required value={form.make} onChange={e => set('make', e.target.value)} className={inputClass} placeholder="Mercedes" /></Field>
                <Field label="Model *"><input required value={form.model} onChange={e => set('model', e.target.value)} className={inputClass} placeholder="E-Class" /></Field>
                <Field label="Year *"><input required type="number" min="1980" max={new Date().getFullYear() + 1} value={form.year} onChange={e => set('year', e.target.value)} className={inputClass} /></Field>
                <Field label="Registration *"><input required value={form.registration} onChange={e => set('registration', e.target.value.toUpperCase())} className={inputClass} placeholder="SH21 ABC" /></Field>
                <Field label="Colour *"><input required value={form.colour} onChange={e => set('colour', e.target.value)} className={inputClass} placeholder="Black" /></Field>
                <Field label="Vehicle Type *"><select required value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className={inputClass}>{['Saloon', 'Estate', 'MPV', 'Executive', 'Minibus', 'Coach', 'Luxury'].map(type => <option key={type}>{type}</option>)}</select></Field>
                <Field label="Service Category *"><select required value={form.vehicleCategory} onChange={e => set('vehicleCategory', e.target.value)} className={inputClass}><option value="taxi">Taxi</option><option value="prestige">Prestige</option><option value="minibus">Minibus</option><option value="coaches">Coaches</option></select></Field>
                <Field label="Passenger Capacity *"><input required type="number" min="1" max="70" value={form.passengerCapacity} onChange={e => set('passengerCapacity', e.target.value)} className={inputClass} /></Field>
                <Field label="Luggage Capacity *"><input required type="number" min="0" max="70" value={form.luggageCapacity} onChange={e => set('luggageCapacity', e.target.value)} className={inputClass} /></Field>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-green-700 mb-3">Compliance Expiry Dates</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="MOT Expiry *"><input required type="date" value={form.motExpiry} onChange={e => set('motExpiry', e.target.value)} className={inputClass} /></Field>
                  <Field label="Insurance Expiry *"><input required type="date" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} className={inputClass} /></Field>
                  <Field label="PHV Licence Expiry *"><input required type="date" value={form.phvLicenceExpiry} onChange={e => set('phvLicenceExpiry', e.target.value)} className={inputClass} /></Field>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-green-600 disabled:opacity-60"><Save size={14} /> {submitting ? 'Adding...' : 'Add Vehicle'}</button>
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-slate-100 text-slate-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">{label}</span>{children}</label>;
}
