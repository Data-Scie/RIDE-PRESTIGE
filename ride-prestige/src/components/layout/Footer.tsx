'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import { siteSettings } from '@/lib/data';

const GOLD = '#c9a84c';
const BLACK = '#0a0f1e';

export default function Footer() {
  return (
    <footer style={{background:BLACK, color:'white'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{background:'linear-gradient(135deg,#c9a84c,#e8c96d,#a07c30)'}}>
                <span style={{color:BLACK,fontFamily:'Georgia,serif',fontWeight:'700',fontSize:'13px'}}>RP</span>
              </div>
              <span className="font-semibold text-lg text-white" style={{fontFamily:'Playfair Display,Georgia,serif',letterSpacing:'0.01em'}}>RIDE PRESTIGE</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{color:'rgba(255,255,255,0.55)'}}>
              Premium coach and minibus hire across the United Kingdom, with luxury transport options for groups, events and airport transfers.
            </p>
            <div className="flex items-center gap-2.5">
              {[
                { href: siteSettings.socialLinks.twitter, label: 'X' },
                { href: siteSettings.socialLinks.instagram, label: 'IG' },
                { href: siteSettings.socialLinks.linkedin, label: 'in' },
              ].filter(s => s.href).map(({ href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 text-xs font-bold"
                  style={{
                    background:'rgba(255,255,255,0.06)',
                    border:'1px solid rgba(255,255,255,0.1)',
                    color:'rgba(255,255,255,0.6)',
                  }}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold uppercase mb-5" style={{letterSpacing:'0.1em',color:'white'}}>Services</h4>
            <ul className="space-y-3">
              {['Airport Transfers','Corporate Travel','Event Transport','Group Travel','Coach Hire','Prestige Vehicles'].map(s => (
                <li key={s}>
                  <Link href="/fleet" className="text-sm transition-colors duration-150 hover:text-white"
                    style={{color:'rgba(255,255,255,0.55)'}}>
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase mb-5" style={{letterSpacing:'0.1em',color:'white'}}>Company</h4>
            <ul className="space-y-3">
              {[
                {label:'Book a Journey',href:'/book'},{label:'Fleet',href:'/fleet'},
                {label:'Promotions',href:'/promotions'},{label:'FAQ',href:'/faq'},
                {label:'Contact Us',href:'/contact'},{label:'Privacy Policy',href:'/privacy-policy'},
                {label:'Terms & Conditions',href:'/terms'},
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm transition-colors duration-150 hover:text-white"
                    style={{color:'rgba(255,255,255,0.55)'}}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase mb-5" style={{letterSpacing:'0.1em',color:'white'}}>Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={14} className="mt-0.5 shrink-0" style={{color:GOLD}} />
                <a href={`tel:${siteSettings.phoneNumber}`} className="text-sm transition-colors hover:text-white"
                  style={{color:'rgba(255,255,255,0.55)'}}>
                  {siteSettings.phoneNumber}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={14} className="mt-0.5 shrink-0" style={{color:GOLD}} />
                <a href={`mailto:${siteSettings.contactEmail}`} className="text-sm transition-colors hover:text-white"
                  style={{color:'rgba(255,255,255,0.55)'}}>
                  {siteSettings.contactEmail}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={14} className="mt-0.5 shrink-0" style={{color:GOLD}} />
                <span className="text-sm" style={{color:'rgba(255,255,255,0.55)'}}>{siteSettings.address}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm" style={{color:'rgba(255,255,255,0.35)'}}>
            &copy; 2026 Ride Prestige Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="text-xs transition-colors hover:text-white" style={{color:'rgba(255,255,255,0.35)'}}>Privacy Policy</Link>
            <Link href="/terms" className="text-xs transition-colors hover:text-white" style={{color:'rgba(255,255,255,0.35)'}}>Terms &amp; Conditions</Link>
            <Link href="/admin/login" className="text-xs transition-colors hover:text-white" style={{color:'rgba(255,255,255,0.2)'}}>Admin Panel</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
