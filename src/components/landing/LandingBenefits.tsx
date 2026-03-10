import { MapPin, Palette, CreditCard, Truck } from 'lucide-react';
import { useEffect, useRef } from 'react';

const benefits = [
  {
    icon: MapPin,
    title: 'Rastreio ao Vivo',
    description: 'Acompanhe seu motoboy em tempo real no mapa.',
  },
  {
    icon: Palette,
    title: 'Monte Sua Pizza',
    description: 'Escolha ingredientes, borda e tamanho.',
  },
  {
    icon: CreditCard,
    title: 'Pix ou Cartão',
    description: 'Pagamento rápido e seguro.',
  },
  {
    icon: Truck,
    title: 'Entrega com SLA',
    description: 'Compromisso de entrega em até 40 min.',
  },
];

export default function LandingBenefits() {
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
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[150px] sm:h-[300px] bg-[hsl(28_100%_50%/0.08)] rounded-full blur-[60px] sm:blur-[100px]" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16 reveal-on-scroll">
          <span className="badge-premium inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Por que nos escolher?
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(30_100%_96%)] mb-3 sm:mb-4">
            Experiência{' '}
            <span className="bg-gradient-to-r from-[hsl(28_100%_55%)] to-[hsl(345_100%_60%)] bg-clip-text text-transparent">
              Premium
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[hsl(220_10%_60%)] max-w-xl lg:max-w-2xl mx-auto px-4">
            Da massa artesanal à entrega na porta, cada detalhe pensado para você.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="reveal-on-scroll glass-premium glass-premium-hover rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 transition-all duration-500"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[hsl(28_100%_50%)] to-[hsl(345_100%_55%)] flex items-center justify-center mb-3 sm:mb-4 lg:mb-6 glow-orange-soft">
                <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-xl font-bold text-[hsl(30_100%_96%)] mb-1 sm:mb-2 lg:mb-3">
                {benefit.title}
              </h3>
              <p className="text-xs sm:text-sm text-[hsl(220_10%_60%)] leading-relaxed line-clamp-3">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
