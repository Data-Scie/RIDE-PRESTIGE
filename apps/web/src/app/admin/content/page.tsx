'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, ExternalLink, Eye, EyeOff, ChevronRight, Layout, Star, Car, Tag } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import type { Page, PageSection } from '@/types';
import Link from 'next/link';

// ── Section type registry — only types that actually render on a page ─────────
const SECTION_META: Record<string, {
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  fields: Array<{ key: string; label: string; hint?: string; multiline?: boolean; subgroup?: string }>;
}> = {
  hero: {
    label: 'Hero Section',
    icon: <Layout size={16} />,
    description: 'Full-screen banner at the top of the homepage — the first thing visitors see.',
    color: '#0a0f1e',
    fields: [
      { key: 'eyebrow', label: 'Location line', hint: 'Small gold text above the headline  (e.g. "Sheffield & South Yorkshire")' },
      { key: 'title', label: 'Main headline', hint: 'Black text of the headline (e.g. "Coach and minibus hire")' },
      { key: 'highlightedTitle', label: 'Gold headline text', hint: 'Second line in gold  (e.g. "for every group journey.")' },
      { key: 'description', label: 'Body paragraph', hint: 'Supporting description below the headline', multiline: true },
      { key: 'primaryCtaLabel', label: 'Primary button label', hint: 'Gold button text  (e.g. "Book Now")' },
      { key: 'secondaryCtaLabel', label: 'Secondary link label', hint: 'Plain link text  (e.g. "View our fleet")' },
      { key: 'stat1Value', label: 'Stat 1 — value', hint: 'e.g. "10K+"', subgroup: 'Trust stats (bottom strip)' },
      { key: 'stat1Label', label: 'Stat 1 — label', hint: 'e.g. "Journeys"', subgroup: 'Trust stats (bottom strip)' },
      { key: 'stat2Value', label: 'Stat 2 — value', hint: 'e.g. "4.9★"', subgroup: 'Trust stats (bottom strip)' },
      { key: 'stat2Label', label: 'Stat 2 — label', hint: 'e.g. "Rating"', subgroup: 'Trust stats (bottom strip)' },
      { key: 'stat3Value', label: 'Stat 3 — value', hint: 'e.g. "24/7"', subgroup: 'Trust stats (bottom strip)' },
      { key: 'stat3Label', label: 'Stat 3 — label', hint: 'e.g. "Service"', subgroup: 'Trust stats (bottom strip)' },
      { key: 'stat4Value', label: 'Stat 4 — value', hint: 'e.g. "50+"', subgroup: 'Trust stats (bottom strip)' },
      { key: 'stat4Label', label: 'Stat 4 — label', hint: 'e.g. "Drivers"', subgroup: 'Trust stats (bottom strip)' },
    ],
  },
  fleet_strip: {
    label: 'Vehicle Categories',
    icon: <Car size={16} />,
    description: 'Grid of vehicle cards (Prestige, Minibus, Coaches, Taxi). The heading and intro text are editable here — vehicle details are managed in Fleet Manager.',
    color: '#c9a84c',
    fields: [
      { key: 'eyebrow', label: 'Section eyebrow', hint: 'Small gold label above the heading  (e.g. "Our fleet")' },
      { key: 'title', label: 'Section heading', hint: 'Large heading  (e.g. "Choose your vehicle")' },
      { key: 'description', label: 'Section description', hint: 'Intro paragraph below the heading', multiline: true },
    ],
  },
  promo_banner: {
    label: 'Promotion Banner',
    icon: <Tag size={16} />,
    description: 'Dark banner showing the currently active promotion. The badge label is editable here — promotion title, description, and code are managed in Promotions.',
    color: '#6366f1',
    fields: [
      { key: 'label', label: 'Badge label', hint: 'Small gold badge above the promo title  (e.g. "Limited Offer", "Seasonal Deal")' },
    ],
  },
  page_intro: {
    label: 'Page Introduction',
    icon: <Star size={16} />,
    description: 'Intro block at the top of legal and content pages.',
    color: '#64748b',
    fields: [
      { key: 'title', label: 'Page title' },
      { key: 'lastUpdated', label: 'Last updated date', hint: 'e.g. "1 January 2025"' },
      { key: 'introduction', label: 'Introduction paragraph', multiline: true },
    ],
  },
  legal_section: {
    label: 'Legal Section',
    icon: <Layout size={16} />,
    description: 'A numbered section within a legal page (terms, privacy).',
    color: '#64748b',
    fields: [
      { key: 'title', label: 'Section title', hint: 'e.g. "1. Definitions"' },
      { key: 'content', label: 'Section content', multiline: true },
    ],
  },
};

export default function AdminContentPage() {
  const [pageList, setPageList] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [activeSection, setActiveSection] = useState<PageSection | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [pageDraft, setPageDraft] = useState<Partial<Page>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.get<{ success: boolean; data: Page[] }>('/api/admin/pages')
      .then(r => {
        const pages = r.data ?? [];
        setPageList(pages);
        if (pages.length > 0) {
          setSelectedPage(pages[0]);
          setPageDraft({ ...pages[0] });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectPage = (p: Page) => {
    setSelectedPage(p);
    setPageDraft({ ...p });
    setActiveSection(null);
    setDraft({});
  };

  const openSection = (s: PageSection) => {
    setActiveSection(s);
    setDraft(Object.fromEntries(Object.entries(s.content).map(([k, v]) => [k, String(v ?? '')])));
  };

  const toggleVisible = (sectionId: string) => {
    if (!selectedPage) return;
    const updated = {
      ...selectedPage,
      sections: selectedPage.sections.map(s =>
        s.id === sectionId ? { ...s, visible: !s.visible } : s
      ),
    };
    setSelectedPage(updated);
    setPageList(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (activeSection?.id === sectionId) {
      setActiveSection(prev => prev ? { ...prev, visible: !prev.visible } : null);
    }
  };

  const applyDraft = (): Page | null => {
    if (!selectedPage || !activeSection) return selectedPage;
    const updatedSection = { ...activeSection, content: { ...activeSection.content, ...draft } };
    const updatedPage = {
      ...selectedPage,
      sections: selectedPage.sections.map(s => s.id === activeSection.id ? updatedSection : s),
    };
    setSelectedPage(updatedPage);
    setPageList(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
    setActiveSection(updatedSection);
    return updatedPage;
  };

  const save = async () => {
    if (!selectedPage) return;
    // Use applyDraft's return value directly rather than re-reading `pageList` state —
    // setPageList above is async, so the component's `pageList` closure is still stale here.
    const current = applyDraft() ?? selectedPage;
    setSaving(true);
    setSaveError(null);
    try {
      await adminApi.put(`/api/admin/pages/${current.id}`, {
        title: pageDraft.title ?? current.title,
        seoTitle: pageDraft.seoTitle ?? current.seoTitle,
        metaDescription: pageDraft.metaDescription ?? current.metaDescription,
        ogTitle: pageDraft.ogTitle ?? current.ogTitle,
        ogDescription: pageDraft.ogDescription ?? current.ogDescription,
        sections: current.sections,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading…</div>;

  const activeSectionMeta = activeSection ? SECTION_META[activeSection.type] : null;

  // Group fields by subgroup for the editor
  const fieldGroups = (() => {
    if (!activeSectionMeta) return [];
    const groups: Record<string, typeof activeSectionMeta.fields> = {};
    for (const f of activeSectionMeta.fields) {
      const g = f.subgroup ?? '__main__';
      if (!groups[g]) groups[g] = [];
      groups[g].push(f);
    }
    return Object.entries(groups).map(([name, fields]) => ({ name: name === '__main__' ? null : name, fields }));
  })();

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-black">Page Content</h1>
          <p className="text-sm text-brand-grey mt-0.5">Edit website copy, headings, and metadata. Changes publish instantly on save.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full font-medium">
              <CheckCircle size={13} /> Published
            </span>
          )}
          {saveError && <span className="text-xs text-red-600">{saveError}</span>}
          <button onClick={save} disabled={saving} className="btn-gold flex items-center gap-2 py-2.5 px-5 disabled:opacity-60">
            {saving
              ? <><span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" /> Saving…</>
              : <><Save size={14} /> Save & Publish</>
            }
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* ── Left: page list ──────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-grey px-1 mb-2">Pages</p>
          {pageList.map(p => (
            <button key={p.id} onClick={() => selectPage(p)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                selectedPage?.id === p.id
                  ? 'bg-brand-black text-white border-brand-black'
                  : 'bg-white border-gray-100 text-brand-grey hover:text-brand-black hover:border-gray-300'
              }`}
            >
              <span className="truncate">{p.title}</span>
              <ChevronRight size={13} className="shrink-0 opacity-50" />
            </button>
          ))}

          <div className="pt-3 mt-1 border-t border-gray-100 space-y-1">
            <p className="text-xs text-brand-grey px-1 mb-2">Live pages</p>
            {[
              { label: 'Homepage', href: '/' },
              { label: 'Book', href: '/book' },
              { label: 'Quote', href: '/quote' },
              { label: 'Fleet', href: '/fleet' },
              { label: 'Contact', href: '/contact' },
            ].map(lp => (
              <Link key={lp.href} href={lp.href} target="_blank"
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-xs text-brand-grey hover:text-brand-black transition-colors">
                <span>{lp.label}</span>
                <ExternalLink size={11} />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Middle: section list ─────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-3">
          {selectedPage ? (
            <>
              {/* SEO meta (compact) */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-grey mb-4">SEO & Metadata</p>
                <div className="space-y-3">
                  <div>
                    <label className="label">SEO title</label>
                    <input
                      value={pageDraft.seoTitle ?? selectedPage.seoTitle}
                      onChange={e => setPageDraft(p => ({ ...p, seoTitle: e.target.value }))}
                      className="input-field text-sm"
                      placeholder="Browser tab title"
                    />
                    <p className="text-xs text-brand-grey mt-1">{(pageDraft.seoTitle ?? selectedPage.seoTitle).length}/60 chars</p>
                  </div>
                  <div>
                    <label className="label">Meta description</label>
                    <textarea
                      value={pageDraft.metaDescription ?? selectedPage.metaDescription}
                      onChange={e => setPageDraft(p => ({ ...p, metaDescription: e.target.value }))}
                      rows={2} className="input-field text-sm resize-none"
                      placeholder="Search engine snippet"
                    />
                    <p className="text-xs text-brand-grey mt-1">{(pageDraft.metaDescription ?? selectedPage.metaDescription).length}/160 chars</p>
                  </div>
                </div>
              </div>

              {/* Page sections */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-grey mb-4">Page Sections</p>
                <div className="space-y-2">
                  {selectedPage.sections
                    .filter(s => SECTION_META[s.type])
                    .sort((a, b) => a.order - b.order)
                    .map(section => {
                      const meta = SECTION_META[section.type];
                      const isActive = activeSection?.id === section.id;
                      return (
                        <button key={section.id} onClick={() => openSection(section)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            isActive
                              ? 'border-brand-gold bg-brand-gold/5'
                              : section.visible
                                ? 'border-gray-200 bg-gray-50/40 hover:border-gray-300'
                                : 'border-gray-100 bg-gray-50/10 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-brand-grey shrink-0">{meta.icon}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-brand-black truncate">{meta.label}</p>
                                <p className="text-xs text-brand-grey truncate mt-0.5">{meta.description.split('—')[0].trim()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={e => { e.stopPropagation(); toggleVisible(section.id); }}
                                className={`p-1.5 rounded-lg border transition-colors ${section.visible ? 'border-gray-200 text-brand-grey hover:bg-gray-100' : 'border-gray-100 text-gray-300 hover:bg-gray-50'}`}
                                title={section.visible ? 'Hide section' : 'Show section'}
                              >
                                {section.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                              </button>
                              <ChevronRight size={13} className={`transition-transform ${isActive ? 'text-brand-gold rotate-90' : 'text-gray-300'}`} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>

                {selectedPage.sections.filter(s => SECTION_META[s.type]).length === 0 && (
                  <p className="text-sm text-brand-grey text-center py-6">No editable sections on this page.</p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-brand-grey text-sm">
              Select a page from the left to edit.
            </div>
          )}
        </div>

        {/* ── Right: section editor ────────────────────────────────────── */}
        <div className="lg:col-span-5">
          {activeSection && activeSectionMeta ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-4">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100" style={{ background: `${activeSectionMeta.color}08` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: activeSectionMeta.color }}>{activeSectionMeta.icon}</span>
                  <h3 className="font-display text-base font-semibold text-brand-black">{activeSectionMeta.label}</h3>
                </div>
                <p className="text-xs text-brand-grey leading-relaxed">{activeSectionMeta.description}</p>
              </div>

              {/* Fields */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {fieldGroups.map(({ name: groupName, fields }) => (
                  <div key={groupName ?? 'main'}>
                    {groupName && (
                      <div className="flex items-center gap-2 mb-3 pt-2 border-t border-gray-100">
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-grey">{groupName}</p>
                      </div>
                    )}
                    <div className="space-y-4">
                      {fields.map(field => (
                        <div key={field.key}>
                          <label className="label">{field.label}</label>
                          {field.hint && <p className="text-xs text-brand-grey mb-1.5">{field.hint}</p>}
                          {field.multiline ? (
                            <textarea
                              rows={3}
                              value={draft[field.key] ?? ''}
                              onChange={e => setDraft(d => ({ ...d, [field.key]: e.target.value }))}
                              className="input-field resize-none text-sm"
                            />
                          ) : (
                            <input
                              value={draft[field.key] ?? ''}
                              onChange={e => setDraft(d => ({ ...d, [field.key]: e.target.value }))}
                              className="input-field text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Linked resources note */}
                {activeSection.type === 'fleet_strip' && (
                  <div className="rounded-xl p-4 bg-amber-50 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-800 mb-1">Vehicle card data</p>
                    <p className="text-xs text-amber-700">Individual vehicle cards (name, tagline, description) are managed in <Link href="/admin/fleet" className="underline font-medium">Fleet Manager →</Link></p>
                  </div>
                )}
                {activeSection.type === 'promo_banner' && (
                  <div className="rounded-xl p-4 bg-indigo-50 border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-800 mb-1">Promotion content</p>
                    <p className="text-xs text-indigo-700">The promotion title, description, and coupon code are managed in <Link href="/admin/promotions" className="underline font-medium">Promotions →</Link>. If no promotion is active, this banner is hidden automatically.</p>
                  </div>
                )}
              </div>

              {/* Apply button */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                <p className="text-xs text-brand-grey">Apply stages the changes. Hit <strong>Save & Publish</strong> at the top to go live.</p>
                <button onClick={applyDraft} className="btn-gold shrink-0 py-2 px-4 text-sm flex items-center gap-1.5">
                  <CheckCircle size={13} /> Apply
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center gap-4 min-h-64">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Layout size={20} className="text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-black mb-1">Select a section to edit</p>
                <p className="text-xs text-brand-grey">Choose any section from the middle panel to edit its content</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
