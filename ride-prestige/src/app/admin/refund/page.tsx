'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { cancellationPolicy } from '@/lib/data';
import type { CancellationPolicy } from '@/types';
import Link from 'next/link';

export default function AdminRefundPage() {
  const [policy, setPolicy] = useState<CancellationPolicy>(cancellationPolicy);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/data/cancellation').then(r => r.json()).then(({ data }) => { if (data) setPolicy(data); }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/data/cancellation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(policy) }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-black mb-1">Refund &amp; Cancellation Policy</h1>
        <p className="text-sm text-brand-grey">Edit the cancellation rules shown to customers at booking.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-7 space-y-5">
        <div>
          <label className="label">Minimum cancellation notice (hours)</label>
          <input type="number" step="1" min="0" value={policy.minHoursBeforeRide}
            onChange={e => setPolicy(p => ({ ...p, minHoursBeforeRide: parseInt(e.target.value) || 8 }))}
            className="input-field max-w-xs" />
          <p className="text-xs text-brand-grey mt-1">
            Currently: <strong>{policy.minHoursBeforeRide} hours</strong> before pickup. Cancellations after this window are non-refundable.
          </p>
        </div>
        <div>
          <label className="label">Refund processing window (hours)</label>
          <input type="number" step="1" min="0" value={policy.refundWindowHours}
            onChange={e => setPolicy(p => ({ ...p, refundWindowHours: parseInt(e.target.value) || 48 }))}
            className="input-field max-w-xs" />
          <p className="text-xs text-brand-grey mt-1">
            Currently: refunds processed within <strong>{policy.refundWindowHours} hours</strong> of approval.
          </p>
        </div>
        <div>
          <label className="label">Customer-facing policy message</label>
          <textarea value={policy.message} rows={4}
            onChange={e => setPolicy(p => ({ ...p, message: e.target.value }))}
            className="input-field resize-none" />
          <p className="text-xs text-brand-grey mt-1">This message is shown on the booking form, confirmation page, and refund policy page.</p>
        </div>
      </div>

      <div className="bg-brand-grey-pale rounded-2xl p-6">
        <p className="text-sm font-semibold text-brand-black mb-2">Current policy summary</p>
        <div className="flex gap-8">
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>{policy.minHoursBeforeRide} hrs</p>
            <p className="text-xs text-brand-grey">Minimum notice to cancel</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>{policy.refundWindowHours} hrs</p>
            <p className="text-xs text-brand-grey">Refund processing time</p>
          </div>
        </div>
        <p className="text-xs text-brand-grey mt-4">
          Public refund page: <Link href="/refund" className="text-brand-gold underline" target="_blank">/refund</Link>
        </p>
      </div>

      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm text-brand-grey">Changes are published live to the website.</p>
        <button type="button" onClick={save} disabled={saving} className="btn-gold flex items-center gap-2 py-2.5 px-6 disabled:opacity-60">
          {saved ? <><CheckCircle size={15} /> Saved!</> : saving ? <><span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" /> Saving…</> : <><Save size={15} /> Save Policy</>}
        </button>
      </div>
    </div>
  );
}
