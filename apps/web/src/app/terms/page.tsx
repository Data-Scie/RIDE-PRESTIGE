import type { Metadata } from 'next';
import PublicLayout from '@/components/layout/PublicLayout';
import CmsContentPage from '@/components/layout/CmsContentPage';
import { getPage } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('terms');
  return { title: page.seoTitle, description: page.metaDescription };
}

export default async function TermsPage() {
  const page = await getPage('terms');
  return (
    <PublicLayout>
      <CmsContentPage page={page} />
    </PublicLayout>
  );
}
