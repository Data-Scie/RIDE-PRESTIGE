import PublicLayout from '@/components/layout/PublicLayout';
import { getContact } from '@/lib/cms';
import ContactClient from './ContactClient';

export default async function ContactPage() {
  const contact = await getContact();
  return (
    <PublicLayout>
      <ContactClient contact={contact} />
    </PublicLayout>
  );
}
