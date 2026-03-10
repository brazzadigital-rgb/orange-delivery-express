import { Link } from 'react-router-dom';
import { ChevronRight, Flame } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { getStoreTypeConfig } from '@/lib/store-type-config';

/**
 * A dynamic CTA that adapts its content based on the current store type.
 * For store types without a builder (e.g. bebidas, padaria), renders nothing.
 */
export function BuilderCTA() {
  const { store } = useTenant();
  const config = getStoreTypeConfig(store?.store_type);

  if (!config.builder) return null;

  const { title, subtitle, emoji, route, steps } = config.builder;

  return (
    <section className="px-3 sm:px-4 pt-4">
      <Link
        to={route}
        className="group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary bg-[length:200%_100%] animate-[gradient-x_3s_ease-in-out_infinite]" />
        
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        
        {/* Border glow */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300" />
        
        {/* Icon with animation */}
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/30 animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
            <span className="text-2xl sm:text-4xl drop-shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
              {emoji}
            </span>
          </div>
          <div className="absolute -top-1.5 sm:-top-2 -right-0.5 sm:-right-1 flex items-center gap-0.5">
            <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 animate-[pulse_0.5s_ease-in-out_infinite] drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
            <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400 animate-[pulse_0.6s_ease-in-out_infinite] -ml-1 drop-shadow-[0_0_4px_rgba(251,146,60,0.8)]" />
          </div>
        </div>
        
        {/* Content */}
        <div className="relative flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h3 className="font-bold text-base sm:text-xl text-white drop-shadow-lg">
              {title}
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-yellow-300 drop-shadow-lg">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              {subtitle}
            </span>
          </div>
          
          {/* Mini stepper */}
          <div className="mt-1.5 sm:mt-2 flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {steps.map((step, i) => (
              <span key={step}>
                {i > 0 && <span className="text-white/50 text-[8px] sm:text-xs mr-1 sm:mr-1.5">→</span>}
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[9px] sm:text-[10px] font-medium text-white/90">
                  {step}
                </span>
              </span>
            ))}
          </div>
        </div>
        
        {/* Arrow */}
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white transform group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
        
        {/* Corner accents */}
        <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-tr from-black/10 to-transparent rounded-tr-full" />
      </Link>
    </section>
  );
}
