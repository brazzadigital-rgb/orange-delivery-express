import { Link } from 'react-router-dom';
import { ArrowRight, Download, Flame, MapPin, Clock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerInstallPrompt, getDeferredPrompt } from '@/lib/pwa-prompt';
import { useState, useEffect } from 'react';
import heroPizza from '@/assets/landing/hero-pizza.jpg';
import logoPizzaria from '@/assets/logo-pizzaria.webp';

interface LandingHeroProps {
  appName: string;
  logoUrl?: string;
}

export default function LandingHero({ appName, logoUrl }: LandingHeroProps) {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const checkInstallable = () => setCanInstall(!!getDeferredPrompt());
    checkInstallable();
    window.addEventListener('pwa-prompt-available', checkInstallable);
    return () => window.removeEventListener('pwa-prompt-available', checkInstallable);
  }, []);

  const handleInstall = async () => {
    const success = await triggerInstallPrompt();
    if (!success) {
      window.location.href = '/pwa/install';
    }
  };

  return (
    <section className="relative min-h-[100dvh] flex items-center landing-hero-bg noise-overlay overflow-hidden">
      {/* Header with Login Button */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 py-4">
        <div className="container mx-auto flex justify-end">
          <Link to="/auth/login?redirect=/onboarding/create-store">
            <Button 
              variant="outline"
              size="sm"
              className="rounded-full px-4 sm:px-5 border-[hsl(0_0%_100%/0.2)] text-[hsl(30_100%_96%)] bg-[hsl(0_0%_100%/0.05)] hover:bg-[hsl(0_0%_100%/0.1)] hover:border-[hsl(28_100%_50%/0.5)] transition-all"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Entrar
            </Button>
          </Link>
        </div>
      </div>

      {/* Animated Gradient Orbs - Smaller on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-64 md:w-96 h-64 md:h-96 bg-[hsl(28_100%_50%/0.15)] rounded-full blur-[80px] md:blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-48 md:w-80 h-48 md:h-80 bg-[hsl(345_100%_50%/0.1)] rounded-full blur-[60px] md:blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>


      <div className="container mx-auto px-4 sm:px-6 py-16 pt-20 lg:py-0 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-center lg:text-left">
            {/* Logo */}
            <div className="animate-fade-in flex justify-center lg:justify-start">
              <img 
                src={logoPizzaria} 
                alt={appName} 
                className="h-20 sm:h-24 lg:h-28 max-w-[280px] sm:max-w-[360px] object-contain drop-shadow-lg"
              />
            </div>

            {/* Headline */}
            <div className="space-y-3 sm:space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                <span className="text-[hsl(30_100%_96%)]">Pizza Premium.</span>
                <br />
                <span className="bg-gradient-to-r from-[hsl(28_100%_55%)] to-[hsl(345_100%_60%)] bg-clip-text text-transparent">
                  Quente. Rápida.
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-[hsl(220_10%_70%)] max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Peça em segundos, acompanhe no mapa e receba no ponto certo.
              </p>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {[
                { icon: Flame, label: 'Forno a lenha' },
                { icon: MapPin, label: 'Rastreio' },
                { icon: Clock, label: '30-40 min' },
              ].map((chip, i) => (
                <span 
                  key={i}
                  className="badge-premium inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium"
                >
                  <chip.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {chip.label}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in justify-center lg:justify-start" style={{ animationDelay: '0.3s' }}>
              <Link to="/app/home" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="btn-shimmer w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl text-white border-0 shadow-xl hover:scale-[1.02] transition-transform"
                >
                  Fazer Pedido
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleInstall}
                className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-medium rounded-xl sm:rounded-2xl border-2 border-[hsl(0_0%_100%/0.2)] text-[hsl(30_100%_96%)] bg-[hsl(0_0%_100%/0.05)] hover:bg-[hsl(0_0%_100%/0.1)] hover:border-[hsl(28_100%_50%/0.5)] transition-all"
              >
                <Download className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                Instalar App
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center lg:justify-start gap-6 sm:gap-8 pt-2 sm:pt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                { value: '+50k', label: 'Pedidos' },
                { value: '4.9', label: 'Avaliação' },
                { value: '30min', label: 'Entrega' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[hsl(30_100%_96%)] counter-animate" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-[hsl(220_10%_55%)]">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Mobile Hero Image */}
            <div className="block lg:hidden pt-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="relative mx-auto max-w-[280px] sm:max-w-[320px]">
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[hsl(0_0%_100%/0.1)]">
                  <img 
                    src={heroPizza} 
                    alt="Pizza premium" 
                    className="w-full aspect-[4/3] object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(230_15%_6%/0.6)] via-transparent to-transparent" />
                </div>
                {/* Glow */}
                <div className="absolute inset-0 -z-10 bg-[hsl(28_100%_50%/0.2)] rounded-3xl blur-[40px] scale-90" />
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image (Desktop) */}
          <div className="relative hidden lg:block animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative floating-slow image-glow">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-[hsl(0_0%_100%/0.1)]">
                <img 
                  src={heroPizza} 
                  alt="Pizza premium" 
                  className="w-full aspect-[4/3] object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(230_15%_6%/0.6)] via-transparent to-transparent" />
              </div>

              {/* Floating Badge - Time */}
              <div className="absolute -bottom-4 -left-4 glass-premium rounded-2xl p-4 shadow-xl animate-fade-in" style={{ animationDelay: '0.7s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(28_100%_50%)] to-[hsl(345_100%_55%)] flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(30_100%_96%)]">Entrega Rápida</p>
                    <p className="text-sm text-[hsl(220_10%_60%)]">30-40 minutos</p>
                  </div>
                </div>
              </div>

              {/* Rating Badge */}
              <div className="absolute -top-4 -right-4 glass-premium rounded-2xl px-5 py-3 shadow-xl animate-fade-in" style={{ animationDelay: '0.9s' }}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-2xl font-bold text-[hsl(30_100%_96%)]">4.9</span>
                  <span className="text-sm text-[hsl(220_10%_60%)]">(2.5k+)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Hidden on very small screens */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:flex">
        <div className="flex flex-col items-center gap-2 text-[hsl(220_10%_50%)]">
          <span className="text-xs sm:text-sm">Rolar</span>
          <div className="w-5 h-8 sm:w-6 sm:h-10 rounded-full border-2 border-[hsl(220_10%_30%)] flex justify-center pt-1.5 sm:pt-2">
            <div className="w-1 h-2.5 sm:w-1.5 sm:h-3 bg-[hsl(28_100%_50%)] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
