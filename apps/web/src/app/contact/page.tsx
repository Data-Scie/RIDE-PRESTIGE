import { getContact } from '@/lib/kv';
import ContactClient from './ContactClient';

export default async function ContactPage() {
  const contact = await getContact();
  return <ContactClient contact={contact} />;
}
