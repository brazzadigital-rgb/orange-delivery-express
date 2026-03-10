import { Link } from 'react-router-dom';
import { Flame, Clock, ArrowRight } from 'lucide-react';
import { useAppConfig } from '@/contexts/AppConfigContext';

interface PromotionCardProps {
  title: string;
  description?: string | null;
  discountLabel: string;
  bannerUrl?: string | null;
  tags?: string[];
  price?: number;
}

export function PromotionCard({ 
  title, 
  description, 
  discountLabel, 
  bannerUrl,
  tags = [],
  price,
}: PromotionCardProps) {
  const { config } = useAppConfig();
  
  const gradientStart = config?.gradient_start || '#FF8A00';
  const gradientEnd = config?.gradient_end || '#FF6A3D';

  return (
    <Link 
      to="/app/search"
      className="block flex-shrink-0 w-72 group"
    >
      <div 
        className="relative rounded-2xl overflow-hidden h-36"
        style={{ 
          background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
        }}
      >
        {/* Content */}
        <div className="relative z-10 h-full p-4 flex flex-col justify-between">
          {/* Top row - Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-white/95 text-foreground px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
              <Flame className="w-3 h-3 text-primary" />
              {discountLabel}
            </span>
            {tags.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                {tags[0]}
              </span>
            )}
          </div>

          {/* Bottom content */}
          <div className="space-y-1">
            {description && (
              <p className="text-white/70 text-xs font-medium">{description}</p>
            )}
            <h3 className="text-white text-lg font-bold leading-tight line-clamp-1">
              {title}
            </h3>
            
            <div className="flex items-center justify-between pt-1">
              {price ? (
                <span className="text-white text-base font-bold">
                  R$ {price.toFixed(2).replace('.', ',')}
                </span>
              ) : (
                <div className="flex items-center gap-1 text-white/80 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>Tempo limitado</span>
                </div>
              )}
              
              <span className="flex items-center gap-1 text-white text-xs font-medium group-hover:gap-2 transition-all">
                Ver
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Background image */}
        {bannerUrl && (
          <img 
            src={bannerUrl} 
            alt=""
            className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40 mix-blend-overlay"
            loading="lazy"
          />
        )}
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '16px 16px'
          }}
        />
      </div>
    </Link>
  );
}
