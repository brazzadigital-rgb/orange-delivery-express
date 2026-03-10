import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import onboardingDelivery from '@/assets/onboarding-delivery.png';
import onboardingOrder from '@/assets/onboarding-order.png';
import onboardingEnjoy from '@/assets/onboarding-enjoy.png';

const slides = [
  {
    image: onboardingOrder,
    title: 'Escolha sua Pizza',
    description: 'Navegue pelo nosso cardápio e monte sua pizza do seu jeito.',
  },
  {
    image: onboardingDelivery,
    title: 'Entrega Rápida',
    description: 'Nossos motoboys levam sua pizza quentinha até você.',
  },
  {
    image: onboardingEnjoy,
    title: 'Aproveite!',
    description: 'Relaxe e saboreie a melhor pizza da cidade.',
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/auth/login');
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Skip button */}
      <div className="p-4 flex justify-end">
        <button
          onClick={handleSkip}
          className="text-white/80 hover:text-white text-sm font-medium"
        >
          Pular
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm">
          {/* Image */}
          <div className="relative w-64 h-64 mx-auto mb-8 animate-fade-in" key={currentSlide}>
            <img
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Text */}
          <div className="text-center text-white animate-slide-up" key={`text-${currentSlide}`}>
            <h2 className="text-2xl font-bold mb-3">{slides[currentSlide].title}</h2>
            <p className="text-white/80">{slides[currentSlide].description}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 pb-8 safe-area-bottom">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                i === currentSlide ? 'bg-white w-8' : 'bg-white/40'
              )}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          {currentSlide > 0 && (
            <Button
              onClick={handlePrev}
              variant="outline"
              size="lg"
              className="flex-1 rounded-full border-white text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 w-5 h-5" />
              Voltar
            </Button>
          )}
          <Button
            onClick={handleNext}
            size="lg"
            className={cn(
              'rounded-full bg-white text-primary hover:bg-white/90 font-semibold',
              currentSlide === 0 ? 'w-full' : 'flex-1'
            )}
          >
            {currentSlide === slides.length - 1 ? 'Começar' : 'Próximo'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
