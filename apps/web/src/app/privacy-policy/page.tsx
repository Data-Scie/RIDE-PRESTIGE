import type { Metadata } from 'next';
import PublicLayout from '@/components/layout/PublicLayout';
import CmsContentPage from '@/components/layout/CmsContentPage';
import { getPage } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('privacy-policy');
  return { title: page.seoTitle, description: page.metaDescription };
}

export default async function PrivacyPolicyPage() {
  const page = await getPage('privacy-policy');
  return (
    <PublicLayout>
      <CmsContentPage page={page} />
    </PublicLayout>
  );
}
