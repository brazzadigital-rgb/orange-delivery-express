import { ShoppingBag, Sliders, CreditCard, MapPin, Package } from 'lucide-react';
import { useEffect, useRef } from 'react';

const steps = [
  { icon: ShoppingBag, label: 'Escolha', description: 'Navegue pelo cardápio' },
  { icon: Sliders, label: 'Personalize', description: 'Monte do seu jeito' },
  { icon: CreditCard, label: 'Pague', description: 'Pix ou cartão' },
  { icon: MapPin, label: 'Acompanhe', description: 'Rastreio ao vivo' },
  { icon: Package, label: 'Receba', description: 'Quentinha na porta' },
];

export default function LandingHowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );

    const items = sectionRef.current?.querySelectorAll('.reveal-on-scroll');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-20 lg:py-32 bg-[hsl(230_12%_8%)]">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16 reveal-on-scroll">
          <span className="badge-premium inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Como funciona
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(30_100%_96%)] mb-3 sm:mb-4">
            Simples assim
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[hsl(220_10%_60%)] max-w-xl lg:max-w-2xl mx-auto">
            Do app à sua mesa em 5 passos simples.
          </p>
        </div>

        {/* Timeline - Desktop */}
        <div className="hidden lg:flex items-center justify-between relative">
          {/* Connecting Line */}
          <div className="absolute top-10 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[hsl(28_100%_50%/0.3)] via-[hsl(28_100%_50%)] to-[hsl(28_100%_50%/0.3)]" />
          
          {steps.map((step, i) => (
            <div 
              key={i} 
              className="reveal-on-scroll flex flex-col items-center relative z-10"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[hsl(28_100%_50%)] to-[hsl(345_100%_55%)] flex items-center justify-center shadow-xl glow-orange-soft mb-4">
                <step.icon className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[hsl(230_12%_8%)] border-2 border-[hsl(28_100%_50%)] flex items-center justify-center">
                <span className="text-sm font-bold text-[hsl(28_100%_55%)]">{i + 1}</span>
              </div>
              <h3 className="text-lg font-bold text-[hsl(30_100%_96%)] mb-1">{step.label}</h3>
              <p className="text-sm text-[hsl(220_10%_55%)] text-center max-w-[120px]">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Timeline - Mobile (Grid layout, no horizontal scroll) */}
        <div className="lg:hidden grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
          {steps.map((step, i) => (
            <div 
              key={i} 
              className="reveal-on-scroll flex flex-col items-center relative"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="relative mb-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[hsl(28_100%_50%)] to-[hsl(345_100%_55%)] flex items-center justify-center shadow-lg">
                  <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[hsl(230_12%_8%)] border-2 border-[hsl(28_100%_50%)] flex items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold text-[hsl(28_100%_55%)]">{i + 1}</span>
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[hsl(30_100%_96%)] text-center">{step.label}</h3>
              <p className="text-[10px] text-[hsl(220_10%_55%)] text-center">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
