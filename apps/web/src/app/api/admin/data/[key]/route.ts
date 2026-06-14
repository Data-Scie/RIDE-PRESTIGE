import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { kvSet, getPricing, getCancellation, getContact, getVehicles, getCategories, getFaqs, getPromotions, getNavigation, getSettings } from '@/lib/kv';

const ADMIN_COOKIE = 'rp_admin_token';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'rp_admin_secure_2026';

const REVALIDATE: Record<string, string[]> = {
  pricing:      ['/prices', '/book', '/quote'],
  cancellation: ['/refund', '/book'],
  settings:     ['/'],
  contact:      ['/', '/contact'],
  vehicles:     ['/fleet'],
  categories:   ['/fleet'],
  faqs:         ['/faq'],
  promotions:   ['/promotions'],
  navigation:   ['/'],
};

const GETTERS: Record<string, () => Promise<unknown>> = {
  pricing:      getPricing,
  cancellation: getCancellation,
  settings:     getSettings,
  contact:      getContact,
  vehicles:     getVehicles,
  categories:   getCategories,
  faqs:         getFaqs,
  promotions:   getPromotions,
  navigation:   getNavigation,
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;
  const getter = GETTERS[key];
  if (!getter) return NextResponse.json({ error: 'Unknown key' }, { status: 400 });
  const data = await getter();
  return NextResponse.json({ data });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key } = await context.params;
  if (!GETTERS[key]) return NextResponse.json({ error: 'Unknown key' }, { status: 400 });

  const body = await request.json();
  try {
    await kvSet(key, body);
    (REVALIDATE[key] ?? ['/']).forEach(p => revalidatePath(p));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Storage not configured — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN' }, { status: 503 });
  }
}
