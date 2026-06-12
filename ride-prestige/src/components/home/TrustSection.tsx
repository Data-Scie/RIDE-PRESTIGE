import { Shield, Clock, Award, HeartHandshake, MapPin, Star } from 'lucide-react';

const GOLD = '#c9a84c';
const BLACK = '#0a0f1e';
const CHARCOAL = '#1a1f2e';

const trust = [
  { icon: Shield, title: 'Fully licensed & insured', desc: 'All vehicles and drivers meet UK regulatory standards. Fully insured for passenger transport.' },
  { icon: Clock, title: 'Punctuality guaranteed', desc: 'We track flights, monitor traffic, and plan routes in advance. On time, every time.' },
  { icon: Award, title: 'Professional drivers only', desc: 'Every driver is DBS-checked, licensed, and trained to deliver a premium passenger experience.' },
  { icon: MapPin, title: 'UK-wide coverage', desc: 'From London to Edinburgh. Airport transfers, city routes, and cross-country journeys.' },
  { icon: Star, title: 'Transparent pricing', desc: 'No hidden fees. Your quote is itemised and final. What you see is exactly what you pay.' },
  { icon: HeartHandshake, title: '24/7 support', desc: "Dedicated customer support around the clock. We're here before, during, and after your journey." },
];

export default function TrustSection() {
  return (
    <section className="py-24 relative overflow-hidden" style={{background:BLACK}}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)'}} />
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)'}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{color:GOLD}}>Why choose us</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4"
            style={{fontFamily:'Playfair Display,Georgia,serif'}}>
            The Ride Prestige standard
          </h2>
          <p className="text-lg max-w-lg mx-auto leading-relaxed" style={{color:'rgba(255,255,255,0.5)'}}>
            Premium transport means more than a comfortable vehicle. It&apos;s every detail, handled with care.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trust.map(({icon:Icon, title, desc}) => (
            <div key={title} className="p-7 rounded-2xl transition-all duration-300 group"
              style={{background:CHARCOAL, border:'1px solid rgba(255,255,255,0.07)'}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300"
                style={{background:'rgba(201,168,76,0.1)'}}>
                <Icon size={22} style={{color:GOLD}} />
              </div>
              <h3 className="font-semibold text-base text-white mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{color:'rgba(255,255,255,0.47)'}}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16"
          style={{borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          {[
            {value:'5,000+', label:'Journeys completed'},
            {value:'98%', label:'On-time record'},
            {value:'4.9★', label:'Customer rating'},
            {value:'24/7', label:'Support available'},
          ].map(({value,label}) => (
            <div key={label} className="text-center">
              <p className="font-semibold mb-2" style={{fontFamily:'Playfair Display,Georgia,serif',fontSize:'1.875rem',color:GOLD}}>{value}</p>
              <p className="text-sm" style={{color:'rgba(255,255,255,0.45)'}}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
