import PublicLayout from '@/components/layout/PublicLayout';
import { getFaqs } from '@/lib/cms';
import FaqClient from './FaqClient';

export default async function FAQPage() {
  const faqs = await getFaqs();
  return (
    <PublicLayout>
      <FaqClient faqs={faqs} />
    </PublicLayout>
  );
}
