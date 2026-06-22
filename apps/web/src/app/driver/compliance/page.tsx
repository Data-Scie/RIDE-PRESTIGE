'use client';

import { useEffect, useState } from 'react';
import { Car, FileCheck2, Plus } from 'lucide-react';
import { driverApi } from '@/lib/api-client';

type DocumentRecord = {
  id: string;
  label: string;
  status: string;
  expiryDate?: string;
  fileUrl?: string;
  rejectionReason?: string;
};

type Vehicle = {
  id: string;
  make: string;
  model: string;
  registration: string;
  vehicleCategory: string;
  passengerCapacity: number;
  approvalStatus: string;
  rejectionReason?: string;
  documents?: DocumentRecord[];
};

type DriverProfile = {
  driverType: 'affiliateDriver' | 'independentDriver';
  isApproved: boolean;
  applicationStatus: string;
};

const emptyVehicle = {
  make: '', model: '', year: new Date().getFullYear(), registration: '',
  vehicleType: 'Executive', vehicleCategory: 'prestige', colour: '',
  passengerCapacity: 4, luggageCapacity: 2,
  motExpiry: '', insuranceExpiry: '', phvLicenceExpiry: '',
};

export default function DriverCompliancePage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [vehicle, setVehicle] = useState(emptyVehicle);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [profileResult, docs, fleet] = await Promise.all([
      driverApi.get<{ data: DriverProfile }>('/api/driver/profile'),
      driverApi.get<{ data: DocumentRecord[] }>('/api/driver/documents'),
      driverApi.get<{ data: Vehicle[] }>('/api/driver/vehicles').catch(() => ({ data: [] })),
    ]);
    setProfile(profileResult.data);
    setDocuments(docs.data);
    setVehicles(fleet.data);
  };

  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  const submitDocument = async (document: DocumentRecord, fileUrl: string, expiryDate: string) => {
    setError('');
    await driverApi.put(`/api/driver/documents/${document.id}`, { fileUrl, expiryDate });
    setMessage(`${document.label} submitted for review.`);
    await load();
  };

  const uploadDocument = async (document: DocumentRecord, file: File, expiryDate: string) => {
    setError('');
    const form = new FormData();
    form.append('document', file);
    form.append('expiryDate', expiryDate);
    const response = await fetch(`/api/backend/driver/documents/${document.id}/upload`, {
      method: 'POST',
      body: form,
    });
    const payload = await response.json().catch(() => ({ message: 'Upload failed' }));
    if (!response.ok) throw new Error(payload.message || 'Upload failed');
    setMessage(`${document.label} uploaded for review.`);
    await load();
  };

  const submitVehicleDocument = async (vehicleId: string, document: DocumentRecord, fileUrl: string, expiryDate: string) => {
    setError('');
    await driverApi.put(`/api/driver/vehicles/${vehicleId}/documents/${document.id}`, { fileUrl, expiryDate });
    setMessage(`${document.label} submitted for vehicle review.`);
    await load();
  };

  const uploadVehicleDocument = async (vehicleId: string, document: DocumentRecord, file: File, expiryDate: string) => {
    setError('');
    const form = new FormData();
    form.append('document', file);
    form.append('expiryDate', expiryDate);
    const response = await fetch(`/api/backend/driver/vehicles/${vehicleId}/documents/${document.id}/upload`, {
      method: 'POST',
      body: form,
    });
    const payload = await response.json().catch(() => ({ message: 'Upload failed' }));
    if (!response.ok) throw new Error(payload.message || 'Upload failed');
    setMessage(`${document.label} uploaded for vehicle review.`);
    await load();
  };

  const submitVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await driverApi.post('/api/driver/vehicles', vehicle);
      setVehicle(emptyVehicle);
      setMessage('Vehicle submitted to Operations for approval.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const isIndependent = profile?.driverType === 'independentDriver';
  const canRegisterVehicle = Boolean(isIndependent && profile?.isApproved && profile?.applicationStatus === 'approved');

  return (
    <div className="max-w-5xl space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Compliance & Vehicle</h1><p className="text-sm text-slate-500">Submit driver documents first. Approved independent drivers can then register a vehicle for Operations approval.</p></div>
      {message && <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">{message}</div>}
      {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

      <section className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><FileCheck2 size={17} /> Driver Documents</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {documents.map(document => <DocumentForm key={document.id} document={document} onSubmit={submitDocument} onUpload={uploadDocument} onError={setError} />)}
        </div>
      </section>

      {isIndependent && !canRegisterVehicle && (
        <section className="bg-white rounded-2xl border border-amber-100 p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-2"><Car size={17} /> Vehicle registration unlocks after approval</h2>
          <p className="text-sm text-slate-500">
            Your independent driver application must be approved before you can register your car. Once approved, return here to add vehicle details, upload MOT/insurance/PHV documents, and send it to Operations for approval.
          </p>
        </section>
      )}

      {!isIndependent && profile && (
        <section className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-2"><Car size={17} /> Vehicle allocation</h2>
          <p className="text-sm text-slate-500">
            Affiliate drivers do not register personal vehicles here. Your affiliate assigns an approved fleet vehicle when allocating rides.
          </p>
        </section>
      )}

      {canRegisterVehicle && (
      <section className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><Car size={17} /> Registered Vehicles</h2>
        <div className="grid md:grid-cols-2 gap-3 mb-6">
          {vehicles.map(item => (
            <div key={item.id} className="p-4 rounded-xl bg-slate-50">
              <p className="font-semibold">{item.make} {item.model}</p>
              <p className="text-sm text-slate-500">{item.registration} · {item.vehicleCategory} · {item.passengerCapacity} passengers</p>
              <span className="inline-block mt-2 text-xs font-semibold capitalize">{item.approvalStatus}</span>
              {item.rejectionReason && <p className="text-xs text-red-600 mt-1">{item.rejectionReason}</p>}
              {!!item.documents?.length && (
                <div className="mt-4 grid gap-3">
                  {item.documents.map(document => (
                    <DocumentForm
                      key={document.id}
                      document={document}
                      onSubmit={(doc, fileUrl, expiryDate) => submitVehicleDocument(item.id, doc, fileUrl, expiryDate)}
                      onUpload={(doc, file, expiryDate) => uploadVehicleDocument(item.id, doc, file, expiryDate)}
                      onError={setError}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {!vehicles.length && <p className="text-sm text-slate-400">No independent vehicle registered.</p>}
        </div>

        <form onSubmit={submitVehicle} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {([
            ['make', 'Make'], ['model', 'Model'], ['registration', 'Registration'], ['colour', 'Colour'],
            ['year', 'Year'], ['passengerCapacity', 'Passenger capacity'], ['luggageCapacity', 'Luggage capacity'],
            ['motExpiry', 'MOT expiry'], ['insuranceExpiry', 'Insurance expiry'], ['phvLicenceExpiry', 'PHV licence expiry'],
          ] as const).map(([key, label]) => (
            <label key={key} className="text-xs font-semibold text-slate-500">{label}
              <input required type={key.includes('Expiry') ? 'date' : ['year','passengerCapacity','luggageCapacity'].includes(key) ? 'number' : 'text'} value={vehicle[key]} onChange={e => setVehicle(current => ({ ...current, [key]: ['year','passengerCapacity','luggageCapacity'].includes(key) ? Number(e.target.value) : e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </label>
          ))}
          <label className="text-xs font-semibold text-slate-500">Vehicle type
            <select value={vehicle.vehicleType} onChange={e => setVehicle(current => ({ ...current, vehicleType: e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              {['Saloon','Estate','MPV','Executive','Minibus','Coach','Luxury'].map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">Booking category
            <select value={vehicle.vehicleCategory} onChange={e => setVehicle(current => ({ ...current, vehicleCategory: e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              {['prestige','minibus','coaches','taxi'].map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
          <button className="self-end py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2"><Plus size={15} /> Submit vehicle</button>
        </form>
      </section>
      )}
    </div>
  );
}

function DocumentForm({
  document,
  onSubmit,
  onUpload,
  onError,
}: {
  document: DocumentRecord;
  onSubmit: (document: DocumentRecord, fileUrl: string, expiryDate: string) => Promise<void>;
  onUpload: (document: DocumentRecord, file: File, expiryDate: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [fileUrl, setFileUrl] = useState(document.fileUrl || '');
  const [expiryDate, setExpiryDate] = useState(document.expiryDate || '');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    setSubmitting(true);
    onError('');
    try {
      if (file) await onUpload(document, file, expiryDate);
      else await onSubmit(document, fileUrl, expiryDate);
      setFile(null);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Document submission failed');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="p-4 rounded-xl bg-slate-50">
      <div className="flex justify-between gap-3"><p className="font-semibold text-sm">{document.label}</p><span className="text-xs capitalize">{document.status}</span></div>
      {document.rejectionReason && <p className="text-xs text-red-600 mt-1">{document.rejectionReason}</p>}
      {document.fileUrl && <a href={document.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-600">View uploaded document</a>}
      <input type="file" accept=".pdf,image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mt-3 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white" />
      <p className="mt-2 text-[11px] text-slate-400">Or paste a hosted document URL.</p>
      <input type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="Secure document URL" className="mt-3 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
      <input required type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
      <button onClick={submit} disabled={submitting || !expiryDate || (!file && !fileUrl)} className="mt-2 px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit for review'}</button>
    </div>
  );
}
