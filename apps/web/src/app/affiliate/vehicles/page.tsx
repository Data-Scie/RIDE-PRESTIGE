'use client';

import { useEffect, useState } from 'react';
import { Car, Plus, Save, Trash2, X } from 'lucide-react';
import { affiliateApi } from '@/lib/api-client';

interface VehicleDocument {
  id: string;
  label: string;
  type: string;
  status: string;
  expiryDate?: string;
  fileUrl?: string;
  rejectionReason?: string;
}

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
  approvalStatus?: string;
  rejectionReason?: string;
  motExpiry: string;
  insuranceExpiry: string;
  phvLicenceExpiry: string;
  documents?: VehicleDocument[];
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
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const openAddModal = () => {
    setError('');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setError('');
    setEditingId(vehicle.id);
    setForm({
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year),
      registration: vehicle.registration,
      colour: vehicle.colour,
      vehicleType: vehicle.vehicleType,
      vehicleCategory: vehicle.vehicleCategory,
      passengerCapacity: String(vehicle.passengerCapacity),
      luggageCapacity: String(vehicle.luggageCapacity),
      motExpiry: vehicle.motExpiry,
      insuranceExpiry: vehicle.insuranceExpiry,
      phvLicenceExpiry: vehicle.phvLicenceExpiry,
    });
    setModal(true);
  };

  const saveVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        passengerCapacity: Number(form.passengerCapacity),
        luggageCapacity: Number(form.luggageCapacity),
      };
      if (editingId) {
        await affiliateApi.put(`/api/affiliate/vehicles/${editingId}`, payload);
      } else {
        await affiliateApi.post('/api/affiliate/vehicles', payload);
      }
      await loadVehicles();
      setForm(EMPTY_FORM);
      setEditingId(null);
      setModal(false);
    } catch (e) {
      setError((e as Error).message || 'Could not save vehicle');
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

  const submitVehicleDocument = async (vehicleId: string, document: VehicleDocument, fileUrl: string, expiryDate: string) => {
    try {
      await affiliateApi.put(`/api/affiliate/vehicles/${vehicleId}/documents/${document.id}`, { fileUrl, expiryDate });
      await loadVehicles();
    } catch (e) {
      setError((e as Error).message || 'Could not submit vehicle document');
    }
  };

  const uploadVehicleDocument = async (vehicleId: string, document: VehicleDocument, file: File, expiryDate: string) => {
    try {
      const form = new FormData();
      form.append('document', file);
      form.append('expiryDate', expiryDate);
      const response = await fetch(`/api/backend/affiliate/vehicles/${vehicleId}/documents/${document.id}/upload`, {
        method: 'POST',
        body: form,
      });
      const payload = await response.json().catch(() => ({ message: 'Upload failed' }));
      if (!response.ok) throw new Error(payload.message || 'Upload failed');
      await loadVehicles();
    } catch (e) {
      setError((e as Error).message || 'Could not upload vehicle document');
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
        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-green-600">
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
              <div className="mt-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                  vehicle.approvalStatus === 'approved' ? 'bg-green-50 text-green-700' :
                  vehicle.approvalStatus === 'rejected' ? 'bg-red-50 text-red-600' :
                  'bg-amber-50 text-amber-700'
                }`}>{vehicle.approvalStatus ?? 'pending approval'}</span>
                {vehicle.rejectionReason && <p className="mt-2 text-xs text-red-600">{vehicle.rejectionReason}</p>}
              </div>
              {!!vehicle.documents?.length && (
                <div className="mt-4 grid gap-3">
                  {vehicle.documents.map(document => (
                    <VehicleDocumentForm
                      key={document.id}
                      document={document}
                      onSubmit={(doc, fileUrl, expiryDate) => submitVehicleDocument(vehicle.id, doc, fileUrl, expiryDate)}
                      onUpload={(doc, file, expiryDate) => uploadVehicleDocument(vehicle.id, doc, file, expiryDate)}
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => openEditModal(vehicle)} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50">Edit</button>
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
              <div><h3 className="font-bold text-slate-800 text-lg">{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</h3><p className="text-xs text-slate-500">Vehicle and compliance details are required before it can receive rides.</p></div>
              <button onClick={() => { setModal(false); setEditingId(null); }}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={saveVehicle} className="space-y-5">
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
                <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-green-600 disabled:opacity-60"><Save size={14} /> {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Vehicle'}</button>
                <button type="button" onClick={() => { setModal(false); setEditingId(null); }} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-slate-100 text-slate-600">Cancel</button>
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

function VehicleDocumentForm({
  document,
  onSubmit,
  onUpload,
}: {
  document: VehicleDocument;
  onSubmit: (document: VehicleDocument, fileUrl: string, expiryDate: string) => Promise<void>;
  onUpload: (document: VehicleDocument, file: File, expiryDate: string) => Promise<void>;
}) {
  const [fileUrl, setFileUrl] = useState(document.fileUrl || '');
  const [expiryDate, setExpiryDate] = useState(document.expiryDate || '');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      if (file) await onUpload(document, file, expiryDate);
      else await onSubmit(document, fileUrl, expiryDate);
      setFile(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">{document.label}</p>
        <span className="text-[11px] font-semibold capitalize text-slate-500">{document.status}</span>
      </div>
      {document.rejectionReason && <p className="mt-1 text-[11px] text-red-600">{document.rejectionReason}</p>}
      {document.fileUrl && <a href={document.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] text-blue-600">View uploaded document</a>}
      <input type="file" accept=".pdf,image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs" />
      <input type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="Or paste hosted document URL" className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs" />
      <input required type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs" />
      <button onClick={submit} disabled={submitting || !expiryDate || (!file && !fileUrl)} className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit document'}
      </button>
    </div>
  );
}
