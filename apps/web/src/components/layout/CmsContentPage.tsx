import type { Page } from '@/types';

export default function CmsContentPage({ page }: { page: Page }) {
  const sections = page.sections.filter(section => section.visible).sort((a, b) => a.order - b.order);
  const intro = sections.find(section => section.type === 'page_intro');
  const bodySections = sections.filter(section => section.type !== 'page_intro');

  return (
    <>
      <div className="bg-brand-black pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-3">
            {String(intro?.content.title || page.title)}
          </h1>
          {Boolean(intro?.content.lastUpdated) && (
            <p className="text-white/50 text-sm">Last updated: {String(intro?.content.lastUpdated)}</p>
          )}
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {Boolean(intro?.content.introduction) && (
            <p className="text-brand-grey leading-relaxed mb-10">
              {String(intro?.content.introduction)}
            </p>
          )}
          <div className="space-y-10">
            {bodySections.map(section => (
              <div key={section.id}>
                <h2 className="font-display text-xl font-semibold text-brand-black mb-3">
                  {String(section.content.title || '')}
                </h2>
                <p className="text-brand-grey leading-relaxed text-sm">
                  {String(section.content.content || '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
