'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, Phone, ArrowRight, MessageSquare } from 'lucide-react';
import { siteSettings } from '@/lib/data';

export default function ThankYouClient() {
  const params = useSearchParams();
  const status = params.get('status') || 'accepted';
  const ref    = params.get('ref') || '';

  const configs = {
    accepted: { icon: CheckCircle, iconColor: 'text-green-500', iconBg: 'bg-green-50', title: 'Booking confirmed!', subtitle: 'Your journey is booked with Ride Prestige.', message: 'A confirmation email has been sent to your address. Your driver details will follow 24 hours before your journey.' },
    review: { icon: Clock, iconColor: 'text-amber-500', iconBg: 'bg-amber-50', title: 'Request received', subtitle: 'Your booking is under admin review.', message: 'Our team will review your journey details and contact you with a finalised quote within 2 hours.' },
    enquiry: { icon: MessageSquare, iconColor: 'text-blue-500', iconBg: 'bg-blue-50', title: 'Message sent!', subtitle: "We've received your enquiry.", message: 'Our support team will respond within 24 hours. For urgent matters, please call us directly.' },
  };

  const config = configs[status as keyof typeof configs] || configs.accepted;
  const Icon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-4" style={{background:'#f4f5f8'}}>
      <div className="max-w-lg w-full">
        <div className="card p-12 text-center">
          <div className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Icon size={40} className={config.iconColor} />
          </div>
          <div className="w-12 h-1 bg-gold-gradient rounded-full mx-auto mb-6" />
          <h1 className="text-3xl font-semibold mb-3" style={{fontFamily:'Playfair Display,Georgia,serif',color:'#0a0f1e'}}>{config.title}</h1>
          <p className="font-medium mb-4" style={{color:'#c9a84c'}}>{config.subtitle}</p>
          {ref && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4" style={{background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.2)'}}>
              <span className="text-xs uppercase tracking-widest" style={{color:'#8b8fa8'}}>Booking ref</span>
              <span className="font-mono font-bold text-sm" style={{color:'#c9a84c'}}>{ref}</span>
            </div>
          )}
          <p className="text-sm leading-relaxed mb-8" style={{color:'#8b8fa8'}}>{config.message}</p>

          <div className="rounded-2xl p-6 text-left mb-8" style={{background:'#f4f5f8'}}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{color:'#8b8fa8'}}>What happens next</p>
            {['Check your email for a detailed confirmation','Our team will send driver details before departure','Contact us anytime with your booking reference'].map((step,i)=>(
              <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{background:'rgba(201,168,76,0.15)'}}>
                  <span className="text-xs font-bold" style={{color:'#c9a84c'}}>{i+1}</span>
                </div>
                <p className="text-sm" style={{color:'#1a1f2e'}}>{step}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm mb-8" style={{color:'#8b8fa8'}}>
            <Phone size={14} style={{color:'#c9a84c'}} />
            <span>Need help? Call us:</span>
            <a href={`tel:${siteSettings.phoneNumber}`} className="font-semibold" style={{color:'#c9a84c'}}>{siteSettings.phoneNumber}</a>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="btn-gold flex-1 flex items-center justify-center gap-2 py-3">Back to home</Link>
            <Link href="/book" className="btn-outline-gold flex-1 flex items-center justify-center gap-2 py-3">Book another <ArrowRight size={15} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
