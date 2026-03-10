 import { ChevronLeft, ChevronRight } from 'lucide-react';
 import { useState, useEffect, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useActiveBanners, Banner } from '@/hooks/useBanners';
 import { cn } from '@/lib/utils';
 
 export function PromoBannerCarousel() {
   const { data: banners, isLoading } = useActiveBanners();
   const [currentIndex, setCurrentIndex] = useState(0);
   const [isAnimating, setIsAnimating] = useState(false);
   const [touchStart, setTouchStart] = useState<number | null>(null);
   const navigate = useNavigate();
 
   const nextSlide = useCallback(() => {
     if (banners && banners.length > 0 && !isAnimating) {
       setIsAnimating(true);
       setCurrentIndex((prev) => (prev + 1) % banners.length);
       setTimeout(() => setIsAnimating(false), 500);
     }
   }, [banners, isAnimating]);
 
   const prevSlide = useCallback(() => {
     if (banners && banners.length > 0 && !isAnimating) {
       setIsAnimating(true);
       setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
       setTimeout(() => setIsAnimating(false), 500);
     }
   }, [banners, isAnimating]);
 
   // Auto-advance
   useEffect(() => {
     if (!banners || banners.length <= 1) return;
     
     const interval = setInterval(nextSlide, 4000);
     return () => clearInterval(interval);
   }, [banners, nextSlide]);
 
   const handleBannerClick = (banner: Banner) => {
     if (!banner.link_type || !banner.link_value) return;
     
     switch (banner.link_type) {
       case 'category':
         navigate(`/app/category/${banner.link_value}`);
         break;
       case 'product':
         navigate(`/app/product/${banner.link_value}`);
         break;
       case 'url':
         window.open(banner.link_value, '_blank');
         break;
     }
   };
 
   // Touch handlers for swipe
   const handleTouchStart = (e: React.TouchEvent) => {
     setTouchStart(e.touches[0].clientX);
   };
 
   const handleTouchEnd = (e: React.TouchEvent) => {
     if (touchStart === null) return;
     
     const touchEnd = e.changedTouches[0].clientX;
     const diff = touchStart - touchEnd;
     
     if (Math.abs(diff) > 50) {
       if (diff > 0) {
         nextSlide();
       } else {
         prevSlide();
       }
     }
     setTouchStart(null);
   };
 
   // Show nothing when loading
   if (isLoading) {
     return (
       <div className="relative overflow-hidden rounded-3xl bg-muted animate-pulse aspect-[2.2/1]" />
     );
   }
 
   // No banners configured
   if (!banners || banners.length === 0) {
     return null;
   }
 
    return (
      <div className="relative">
        {/* Main Carousel Container */}
        <div 
          className="relative overflow-hidden rounded-2xl"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides Container */}
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <div 
                key={banner.id}
                className="w-full flex-shrink-0 cursor-pointer group"
                onClick={() => handleBannerClick(banner)}
              >
                {/* Clean image without overlay */}
                <div className="relative aspect-[2.2/1] overflow-hidden bg-muted">
                  {banner.image_url ? (
                    <img 
                      src={banner.image_url} 
                      alt={banner.title || 'Banner promocional'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="w-full h-full gradient-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-foreground items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                aria-label="Banner anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-foreground items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                aria-label="Próximo banner"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* 3D Text Panel - Compact floating below the banner */}
        {banners[currentIndex] && (banners[currentIndex].title || banners[currentIndex].subtitle) && (
          <div 
            className="relative mt-2 mx-3 z-10"
            key={currentIndex}
          >
            <div 
              className="relative bg-card rounded-xl px-3 py-2 border border-border/50 overflow-hidden"
              style={{
                boxShadow: '0 8px 24px -6px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.08)',
                transform: 'perspective(1000px) rotateX(1deg)',
                transformOrigin: 'top center',
              }}
            >
              {/* Gradient accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 gradient-primary rounded-t-xl" />
              
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {banners[currentIndex].title && (
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {banners[currentIndex].title}
                    </h3>
                  )}
                  {banners[currentIndex].subtitle && (
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                      {banners[currentIndex].subtitle}
                    </span>
                  )}
                </div>
                
                {/* CTA Button */}
                {(banners[currentIndex].link_type && banners[currentIndex].link_value) && (
                  <button 
                    onClick={() => handleBannerClick(banners[currentIndex])}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                  >
                    <span>Ver</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress bar for auto-advance */}
        {banners.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 overflow-hidden rounded-t-2xl">
            <div 
              key={currentIndex}
              className="h-full bg-primary/80 rounded-full"
              style={{ 
                animation: 'banner-progress 4s linear forwards'
              }}
            />
          </div>
        )}
      </div>
    );
 }