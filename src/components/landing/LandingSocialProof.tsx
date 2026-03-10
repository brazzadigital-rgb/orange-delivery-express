import { Star } from 'lucide-react';
import { useEffect, useRef } from 'react';

const reviews = [
  {
    name: 'Maria S.',
    avatar: '👩',
    rating: 5,
    text: 'Melhor pizza! Chegou quentinha em 25 min.',
  },
  {
    name: 'João P.',
    avatar: '👨',
    rating: 5,
    text: 'O rastreio ao vivo é incrível!',
  },
  {
    name: 'Ana L.',
    avatar: '👩‍🦰',
    rating: 5,
    text: 'Ingredientes premium de verdade.',
  },
  {
    name: 'Carlos M.',
    avatar: '🧑',
    rating: 5,
    text: 'App super fácil de usar.',
  },
];

export default function LandingSocialProof() {
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
            Avaliações
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(30_100%_96%)] mb-3 sm:mb-4">
            O que dizem{' '}
            <span className="bg-gradient-to-r from-[hsl(28_100%_55%)] to-[hsl(345_100%_60%)] bg-clip-text text-transparent">
              nossos clientes
            </span>
          </h2>
          
          {/* Rating Badge */}
          <div className="inline-flex items-center gap-2 sm:gap-3 glass-premium rounded-full px-4 sm:px-6 py-2 sm:py-3 mt-3 sm:mt-4">
            <div className="flex items-center gap-0.5 sm:gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-xl sm:text-2xl font-bold text-[hsl(30_100%_96%)]">4.9</span>
            <span className="text-xs sm:text-sm text-[hsl(220_10%_55%)]">• 2.5k+ avaliações</span>
          </div>
        </div>

        {/* Reviews Grid - Stacked on mobile, grid on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="reveal-on-scroll social-proof-card p-4 sm:p-5 lg:p-6"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[hsl(28_100%_50%/0.2)] flex items-center justify-center text-xl sm:text-2xl">
                  {review.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base text-[hsl(30_100%_96%)]">{review.name}</p>
                  <div className="flex items-center gap-0.5">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[hsl(220_10%_65%)] leading-relaxed">
                "{review.text}"
              </p>
            </div>
          ))}
        </div>

        {/* Marquee - Hidden on very small screens */}
        <div className="mt-10 sm:mt-12 lg:mt-16 marquee-container hidden sm:block">
          <div className="marquee-content">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex items-center gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4">
                {['Forno a Lenha', '5 Estrelas', 'Entrega Rápida', 'Ingredientes Premium', 'Rastreio ao Vivo', 'App Intuitivo'].map((badge, i) => (
                  <span 
                    key={i}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[hsl(28_100%_50%/0.3)] text-[hsl(28_100%_60%)] text-xs sm:text-sm font-medium whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[hsl(28_100%_50%)]" />
                    {badge}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
