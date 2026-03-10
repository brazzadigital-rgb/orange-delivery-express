import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerInstallPrompt } from '@/lib/pwa-prompt';
import deliveryRider from '@/assets/landing/delivery-rider.png';

export default function LandingCTA() {
  const handleInstall = async () => {
    const success = await triggerInstallPrompt();
    if (!success) {
      window.location.href = '/pwa/install';
    }
  };

  return (
    <section className="relative py-16 sm:py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(28_100%_50%)] via-[hsl(22_100%_48%)] to-[hsl(345_100%_50%)]" />
      <div className="absolute inset-0 noise-overlay opacity-50" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[hsl(0_0%_100%/0.1)] rounded-full blur-[60px] sm:blur-[80px]" />
      <div className="absolute bottom-0 left-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-[hsl(345_100%_50%/0.3)] rounded-full blur-[40px] sm:blur-[60px]" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="glass-premium rounded-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-16 border-[hsl(0_0%_100%/0.2)]">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                Pronto para experimentar?
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0">
                Instale o app e ganhe ofertas exclusivas. Sua pizza favorita está a poucos cliques!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  onClick={handleInstall}
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl bg-white text-[hsl(28_100%_45%)] hover:bg-white/90 shadow-xl hover:scale-[1.02] transition-transform"
                >
                  <Download className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  Instalar App
                </Button>
                <Link to="/app/home" className="w-full sm:w-auto">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-medium rounded-xl sm:rounded-2xl border-2 border-white text-white bg-white/10 hover:bg-white/20 transition-all"
                  >
                    Fazer Pedido
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image - Hidden on mobile */}
            <div className="hidden lg:block">
              <div className="relative floating-slow">
                <img 
                  src={deliveryRider}
                  alt="Entrega rápida"
                  className="w-full max-w-[400px] mx-auto drop-shadow-2xl"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
