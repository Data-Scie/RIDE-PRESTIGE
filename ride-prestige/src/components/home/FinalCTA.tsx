import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { siteSettings } from '@/lib/data';

const GOLD = '#c9a84c';
const BLACK = '#0a0f1e';
const GREY = '#8b8fa8';

export default function FinalCTA() {
  return (
    <section className="py-24" style={{background:'#f4f5f8'}}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{color:GOLD}}>Ready to travel?</p>
        <h2 className="text-3xl md:text-4xl font-semibold mb-5" style={{fontFamily:'Playfair Display,Georgia,serif',color:BLACK}}>
          Your journey starts here.
        </h2>
        <p className="text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{color:GREY}}>
          Get an instant quote in seconds. Professional drivers, transparent pricing, premium service — every journey.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/book" className="btn-gold flex items-center gap-2 text-base px-8 py-4">
            Book your journey <ArrowRight size={18}/>
          </Link>
          <a href={`tel:${siteSettings.phoneNumber}`} className="btn-outline-gold flex items-center gap-2 text-base px-8 py-4">
            <Phone size={16}/> Call us now
          </a>
        </div>

        <p className="text-sm mt-8" style={{color:'rgba(139,143,168,0.65)'}}>
          Or email us at{' '}
          <a href={`mailto:${siteSettings.contactEmail}`} style={{color:GOLD}}>{siteSettings.contactEmail}</a>
        </p>
      </div>
    </section>
  );
}
