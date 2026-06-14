'use client';

import { useState, useEffect } from 'react';
import { FileText, Edit2, Eye, EyeOff, Save, X, GripVertical } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import type { Page, PageSection } from '@/types';
import Link from 'next/link';

const sectionTypeLabels: Record<string, string> = {
  hero: 'Hero Section',
  fleet_strip: 'Vehicle Categories',
  how_it_works: 'How It Works',
  trust: 'Trust & Stats',
  promo_banner: 'Promotion Banner',
};

export default function AdminContentPage() {
  const [pageList, setPageList] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.get<{ success: boolean; data: Page[] }>('/api/admin/pages')
      .then(r => {
        const pages = r.data ?? [];
        setPageList(pages);
        if (pages.length > 0) setSelectedPage(pages[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSection = (pageId: string, updatedSection: PageSection) => {
    setPageList(prev => prev.map(p => p.id === pageId
      ? { ...p, sections: p.sections.map(s => s.id === updatedSection.id ? updatedSection : s) }
      : p
    ));
    if (selectedPage?.id === pageId) {
      setSelectedPage(prev => prev
        ? { ...prev, sections: prev.sections.map(s => s.id === updatedSection.id ? updatedSection : s) }
        : null
      );
    }
  };

  const toggleSectionVisible = (pageId: string, sectionId: string) => {
    const page = pageList.find(p => p.id === pageId);
    const section = page?.sections.find(s => s.id === sectionId);
    if (section) updateSection(pageId, { ...section, visible: !section.visible });
  };

  const savePage = async () => {
    if (!selectedPage) return;
    setSaving(true);
    const updated = pageList.find(p => p.id === selectedPage.id) ?? selectedPage;
    await adminApi.put(`/api/admin/pages/${updated.id}`, updated).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updatePageMeta = (key: keyof Page, value: string) => {
    setSelectedPage(prev => prev ? { ...prev, [key]: value } : null);
    setPageList(prev => prev.map(p => p.id === selectedPage?.id ? { ...p, [key]: value } : p));
  };

  if (loading) return <div className="text-brand-grey text-sm p-4">Loading…</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Page list */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider px-2 mb-3">Pages</p>
          {pageList.map(page => (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                selectedPage?.id === page.id
                  ? 'bg-brand-gold/8 border-brand-gold/25 text-brand-black'
                  : 'bg-white border-gray-100 text-brand-grey hover:text-brand-black hover:border-gray-200'
              }`}
            >
              <FileText size={14} className={selectedPage?.id === page.id ? 'text-brand-gold' : 'text-gray-400'} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{page.title}</p>
                <p className="text-xs font-mono truncate opacity-60">{page.slug}</p>
              </div>
            </button>
          ))}

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-brand-grey px-2 mb-2">All public pages</p>
            {[
              { label: 'Book', href: '/book' }, { label: 'Quote', href: '/quote' },
              { label: 'Fleet', href: '/fleet' }, { label: 'Contact', href: '/contact' },
              { label: 'Promotions', href: '/promotions' }, { label: 'FAQ', href: '/faq' },
            ].map(p => (
              <div key={p.href} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-50 bg-white mb-1">
                <span className="text-sm text-brand-grey">{p.label}</span>
                <Link href={p.href} target="_blank" className="text-xs text-brand-gold hover:underline">View →</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Page editor */}
        <div className="lg:col-span-3 space-y-6">
          {selectedPage ? (
            <>
              {/* SEO / Meta */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display text-lg font-semibold text-brand-black">SEO & Metadata</h3>
                  <div className="flex items-center gap-2">
                    {saved && <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full">✓ Saved</span>}
                    <button onClick={savePage} disabled={saving} className="btn-gold flex items-center gap-1.5 py-2 px-4 text-xs disabled:opacity-60">
                      {saving
                        ? <span className="w-3 h-3 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                        : <Save size={13} />
                      }
                      Save
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="label">Page title</label>
                    <input value={selectedPage.title} onChange={e => updatePageMeta('title', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">SEO title (browser tab)</label>
                    <input value={selectedPage.seoTitle} onChange={e => updatePageMeta('seoTitle', e.target.value)} className="input-field" />
                    <p className="text-xs text-brand-grey mt-1">{selectedPage.seoTitle.length}/60 characters</p>
                  </div>
                  <div>
                    <label className="label">Meta description</label>
                    <textarea value={selectedPage.metaDescription} onChange={e => updatePageMeta('metaDescription', e.target.value)}
                      rows={2} className="input-field resize-none" />
                    <p className="text-xs text-brand-grey mt-1">{selectedPage.metaDescription.length}/160 characters</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">OG title</label>
                      <input value={selectedPage.ogTitle} onChange={e => updatePageMeta('ogTitle', e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="label">OG description</label>
                      <input value={selectedPage.ogDescription} onChange={e => updatePageMeta('ogDescription', e.target.value)} className="input-field" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-display text-lg font-semibold text-brand-black mb-5">Page sections</h3>
                {selectedPage.sections.length === 0 ? (
                  <p className="text-sm text-brand-grey text-center py-6">No sections configured for this page yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPage.sections.sort((a, b) => a.order - b.order).map(section => (
                      <div
                        key={section.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          section.visible ? 'border-gray-200 bg-gray-50/30' : 'border-gray-100 bg-gray-50/10 opacity-60'
                        }`}
                      >
                        <GripVertical size={15} className="text-gray-300 cursor-grab" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-brand-black">{sectionTypeLabels[section.type] || section.type}</p>
                          <p className="text-xs text-brand-grey font-mono">{section.type}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${section.visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {section.visible ? 'Visible' : 'Hidden'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleSectionVisible(selectedPage.id, section.id)}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-brand-grey"
                          >
                            {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => setEditingSection({ ...section })}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-brand-grey hover:text-brand-black"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-brand-grey">
              Select a page from the left to edit its content.
            </div>
          )}
        </div>
      </div>

      {/* Section edit modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-luxury w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display text-xl font-semibold text-brand-black">
                Edit: {sectionTypeLabels[editingSection.type] || editingSection.type}
              </h3>
              <button onClick={() => setEditingSection(null)} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={18} className="text-brand-grey" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(editingSection.content).map(([key, value]) => (
                <div key={key}>
                  <label className="label">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>
                  {String(value).length > 100 ? (
                    <textarea
                      value={String(value)}
                      onChange={e => setEditingSection(prev => prev ? { ...prev, content: { ...prev.content, [key]: e.target.value } } : null)}
                      rows={3} className="input-field resize-none"
                    />
                  ) : (
                    <input
                      value={String(value)}
                      onChange={e => setEditingSection(prev => prev ? { ...prev, content: { ...prev.content, [key]: e.target.value } } : null)}
                      className="input-field"
                    />
                  )}
                </div>
              ))}
              {Object.keys(editingSection.content).length === 0 && (
                <p className="text-brand-grey text-sm text-center py-4">This section has no editable content fields.</p>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  if (selectedPage && editingSection) {
                    updateSection(selectedPage.id, editingSection);
                    setEditingSection(null);
                  }
                }}
                className="btn-gold flex items-center gap-2 flex-1 justify-center py-3"
              >
                <Save size={15} /> Apply changes
              </button>
              <button onClick={() => setEditingSection(null)} className="btn-outline-gold flex-1 py-3">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
