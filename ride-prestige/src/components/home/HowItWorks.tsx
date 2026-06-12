import { MapPin, Car, FileText, CheckCircle } from 'lucide-react';

const GOLD = '#c9a84c';
const BLACK = '#0a0f1e';
const GREY = '#8b8fa8';

const steps = [
  { icon: MapPin, title: 'Enter your journey', description: 'Add your pickup and drop-off locations with postcodes. We cover the entire UK.' },
  { icon: Car, title: 'Choose your vehicle', description: 'Select from minibus, coach, or prestige vehicle based on your group size and preference.' },
  { icon: FileText, title: 'Review your quote', description: 'Receive a transparent, itemised fare estimate instantly. No hidden charges.' },
  { icon: CheckCircle, title: 'Confirm your journey', description: 'Accept the quote and your booking is confirmed. A professional driver handles the rest.' },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{color:GOLD}}>Simple process</p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4" style={{fontFamily:'Playfair Display,Georgia,serif',color:BLACK}}>
            How booking works
          </h2>
          <p className="text-lg max-w-lg mx-auto leading-relaxed" style={{color:GREY}}>
            From quote to confirmed journey in under two minutes. No calls, no waiting, no complexity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line desktop */}
          <div className="hidden lg:block absolute" style={{
            top:'56px', left:'12.5%', right:'12.5%', height:'1px',
            background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.25),transparent)'
          }} />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative text-center group">
                <div className="relative mx-auto w-28 h-28 mb-6">
                  <div className="absolute inset-0 rounded-2xl transition-colors duration-300"
                    style={{background:'rgba(201,168,76,0.07)'}} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={32} style={{color:GOLD}} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{background:BLACK}}>
                    <span style={{color:GOLD,fontSize:'0.7rem',fontWeight:'bold'}}>{i+1}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-3" style={{fontFamily:'Playfair Display,Georgia,serif',color:BLACK}}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{color:GREY}}>{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
