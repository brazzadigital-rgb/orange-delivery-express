import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';

import pizzaPepperoni from '@/assets/landing/pizza-pepperoni.jpg';
import pizzaQuattro from '@/assets/landing/pizza-quattro.jpg';
import pizzaChocolate from '@/assets/landing/pizza-chocolate.jpg';

const pizzas = [
  {
    image: pizzaPepperoni,
    name: 'Pepperoni Supreme',
    description: 'Pepperoni artesanal, mozzarella',
    price: 49.90,
    tag: 'Mais Pedida',
    rating: 4.9,
  },
  {
    image: pizzaQuattro,
    name: 'Quattro Formaggi',
    description: 'Mozzarella, gorgonzola, parmesão',
    price: 54.90,
    tag: 'Premium',
    rating: 4.8,
  },
  {
    image: pizzaChocolate,
    name: 'Chocolate & Morango',
    description: 'Chocolate belga, morangos',
    price: 44.90,
    tag: 'Sobremesa',
    rating: 5.0,
  },
];

export default function LandingMenu() {
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
    <section ref={sectionRef} className="relative py-16 sm:py-20 lg:py-32 bg-[hsl(230_15%_6%)]">
      {/* Background Glow */}
      <div className="absolute bottom-0 right-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[hsl(345_100%_50%/0.06)] rounded-full blur-[80px] sm:blur-[120px]" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16 reveal-on-scroll">
          <span className="badge-premium inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Nosso Cardápio
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(30_100%_96%)] mb-3 sm:mb-4">
            Pizzas que{' '}
            <span className="bg-gradient-to-r from-[hsl(28_100%_55%)] to-[hsl(345_100%_60%)] bg-clip-text text-transparent">
              encantam
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[hsl(220_10%_60%)] max-w-xl lg:max-w-2xl mx-auto px-4">
            +30 sabores feitos com ingredientes premium e amor artesanal.
          </p>
        </div>

        {/* Pizza Grid - Stacked on mobile, grid on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {pizzas.map((pizza, i) => (
            <div
              key={i}
              className="reveal-on-scroll group relative glass-premium rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 hover:border-[hsl(28_100%_50%/0.4)]"
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-[16/10] sm:aspect-square overflow-hidden">
                <img 
                  src={pizza.image} 
                  alt={pizza.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(230_15%_6%)] via-transparent to-transparent" />
                
                {/* Tag */}
                <span className="absolute top-3 sm:top-4 left-3 sm:left-4 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-[hsl(28_100%_50%)] to-[hsl(345_100%_55%)] text-white shadow-lg">
                  {pizza.tag}
                </span>

                {/* Rating */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-[hsl(0_0%_0%/0.6)] backdrop-blur-sm">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-white">{pizza.rating}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 lg:p-6">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[hsl(30_100%_96%)] mb-1 sm:mb-2">
                  {pizza.name}
                </h3>
                <p className="text-xs sm:text-sm text-[hsl(220_10%_55%)] mb-3 sm:mb-4 line-clamp-1">
                  {pizza.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] sm:text-sm text-[hsl(220_10%_50%)]">A partir de</span>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[hsl(28_100%_55%)]">
                      R$ {pizza.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <Button 
                    size="icon"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[hsl(28_100%_50%)] to-[hsl(345_100%_55%)] text-white shadow-lg hover:scale-105 transition-transform"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8 sm:mt-10 lg:mt-12 reveal-on-scroll">
          <Link to="/app/home">
            <Button 
              size="lg"
              className="btn-shimmer h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl text-white border-0 shadow-xl hover:scale-[1.02] transition-transform"
            >
              Ver Cardápio Completo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
