'use client';
import { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';

export default function OpsSettingsPage() {
  const [radius, setRadius] = useState(20);
  const [dispatchTimeout, setDispatchTimeout] = useState(30);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>System Settings</h1>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-slate-800">Dispatch Settings</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Driver Search Radius (miles)</label>
            <input type="number" value={radius} onChange={e => setRadius(+e.target.value)} min={1} max={100} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400" />
            <p className="text-xs text-slate-400 mt-1">Ride requests sent to all drivers within this radius of pickup</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Accept Timeout (seconds)</label>
            <input type="number" value={dispatchTimeout} onChange={e => setDispatchTimeout(+e.target.value)} min={10} max={120} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400" />
            <p className="text-xs text-slate-400 mt-1">Time driver has to accept before ride goes to next available</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={save} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ background: '#3b82f6' }}>
          {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
