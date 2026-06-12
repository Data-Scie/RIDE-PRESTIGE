'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Globe } from 'lucide-react';
import Link from 'next/link';

const pageTitles: Record<string, {title:string; subtitle:string}> = {
  '/admin':              { title:'Dashboard',       subtitle:'Overview of your transport operations' },
  '/admin/content':      { title:'Page Content',    subtitle:'Edit website pages and sections' },
  '/admin/navigation':   { title:'Navigation',      subtitle:'Manage menus and links' },
  '/admin/fleet':        { title:'Fleet Editor',    subtitle:'Manage vehicle categories and descriptions' },
  '/admin/promotions':   { title:'Promotions',      subtitle:'Create and manage discount offers' },
  '/admin/faqs':         { title:'FAQ Editor',      subtitle:'Manage frequently asked questions' },
  '/admin/bookings':     { title:'Bookings',        subtitle:'View and manage all booking records' },
  '/admin/quotes':       { title:'Quotes',          subtitle:'Review submitted quotes and estimates' },
  '/admin/support':      { title:'Support Tickets', subtitle:'Handle customer enquiries and complaints' },
  '/admin/settings':     { title:'Settings',        subtitle:'Global site settings, SEO, and pricing' },
};

const GOLD = '#c9a84c';

export default function AdminTopbar() {
  const pathname = usePathname();
  const page = pageTitles[pathname] || { title:'MakeMe CMS', subtitle:'Ride Prestige admin panel' };

  return (
    <header className="h-16 flex items-center justify-between px-6 shrink-0"
      style={{background:'white', borderBottom:'1px solid #f0f0f0'}}>
      <div>
        <h1 className="font-semibold text-lg leading-none" style={{fontFamily:'Playfair Display,Georgia,serif',color:'#0a0f1e'}}>{page.title}</h1>
        <p className="text-xs mt-0.5" style={{color:'#8b8fa8'}}>{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2 w-52"
          style={{background:'#f4f5f8', border:'1px solid #e5e7eb'}}>
          <Search size={13} style={{color:'#8b8fa8'}} />
          <input type="text" placeholder="Search..."
            className="bg-transparent text-xs focus:outline-none w-full"
            style={{color:'#0a0f1e'}} />
        </div>

        <Link href="/" target="_blank"
          className="hidden md:flex items-center gap-1.5 text-xs rounded-xl px-3 py-2 transition-colors"
          style={{color:'#8b8fa8', border:'1px solid #e5e7eb'}}>
          <Globe size={13}/> View site
        </Link>

        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{background:'#f4f5f8', border:'1px solid #e5e7eb'}}>
          <Bell size={14} style={{color:'#8b8fa8'}} />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{background:GOLD}} />
        </button>
      </div>
    </header>
  );
}
