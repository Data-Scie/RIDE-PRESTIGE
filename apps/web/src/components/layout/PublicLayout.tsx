import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getLayoutCms } from '@/lib/cms';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { settings, navigation } = await getLayoutCms();
  return (
    <>
      <Header navigation={navigation} settings={settings} />
      <main>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
