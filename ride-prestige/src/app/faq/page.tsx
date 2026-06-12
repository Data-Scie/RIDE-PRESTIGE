import { getFaqs } from '@/lib/kv';
import FaqClient from './FaqClient';

export default async function FAQPage() {
  const faqs = await getFaqs();
  return <FaqClient faqs={faqs} />;
}
