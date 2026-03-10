import { MapPin, Bell, Gift, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import { triggerInstallPrompt } from '@/lib/pwa-prompt';
import AppMockupVisual from './AppMockupVisual';

const features = [
  {
    icon: MapPin,
    title: 'Rastreio em tempo real',
    description: 'Veja o motoboy no mapa se aproximando.',
  },
  {
    icon: Bell,
    title: 'Notificações do pedido',
    description: 'Alertas de cada etapa: preparo, saída, chegada.',
  },
  {
    icon: Gift,
    title: 'Promoções exclusivas',
    description: 'Ofertas só para quem tem o app.',
  },
];

export default function LandingAppExperience() {
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

  const handleInstall = async () => {
    const success = await triggerInstallPrompt();
    if (!success) {
      window.location.href = '/pwa/install';
    }
  };

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-20 lg:py-32 bg-[hsl(230_15%_6%)] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-[hsl(28_100%_50%/0.08)] rounded-full blur-[60px] sm:blur-[100px]" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* App Mockup - Centered on mobile */}
          <div className="reveal-on-scroll relative order-2 lg:order-1 flex justify-center">
            <div className="scale-90 sm:scale-100">
              <AppMockupVisual />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="reveal-on-scroll">
              <span className="badge-premium inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                Nosso App
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(30_100%_96%)] mb-3 sm:mb-4">
                Tudo na palma da{' '}
                <span className="bg-gradient-to-r from-[hsl(28_100%_55%)] to-[hsl(345_100%_60%)] bg-clip-text text-transparent">
                  sua mão
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-[hsl(220_10%_60%)] max-w-lg mx-auto lg:mx-0">
                Peça, acompanhe e receba com a melhor experiência mobile.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 sm:space-y-4">
              {features.map((feature, i) => (
                <div 
                  key={i}
                  className="reveal-on-scroll glass-premium glass-premium-hover rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all duration-500 text-left"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[hsl(28_100%_50%)] to-[hsl(345_100%_55%)] flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-[hsl(30_100%_96%)] mb-0.5 sm:mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[hsl(220_10%_55%)]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="reveal-on-scroll pt-2 sm:pt-4 flex justify-center lg:justify-start">
              <Button 
                size="lg"
                onClick={handleInstall}
                className="btn-shimmer h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl text-white border-0 shadow-xl hover:scale-[1.02] transition-transform"
              >
                <Download className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                Instalar App Grátis
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
