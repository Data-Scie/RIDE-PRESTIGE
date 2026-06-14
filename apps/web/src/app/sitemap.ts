import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rideprestige.co.uk';

  const publicRoutes = [
    { url: `${baseUrl}/`, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/book`, priority: 0.9, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/fleet`, priority: 0.85, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/promotions`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/faq`, priority: 0.75, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/contact`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/privacy-policy`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/terms`, priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  return publicRoutes.map(route => ({
    url: route.url,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
