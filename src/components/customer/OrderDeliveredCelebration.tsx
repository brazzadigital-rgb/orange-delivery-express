 import { useEffect, useState } from 'react';
 import { PartyPopper, Star, Home, RotateCcw, Heart, Sparkles } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { useNavigate } from 'react-router-dom';
 import confetti from 'canvas-confetti';
 import { cn } from '@/lib/utils';
 
 interface OrderDeliveredCelebrationProps {
   orderNumber: number;
   onClose?: () => void;
 }
 
 export function OrderDeliveredCelebration({ orderNumber, onClose }: OrderDeliveredCelebrationProps) {
   const navigate = useNavigate();
   const [animate, setAnimate] = useState(false);
   const [showContent, setShowContent] = useState(false);
   const [selectedRating, setSelectedRating] = useState<number | null>(null);
 
   useEffect(() => {
     // Start animations
     setAnimate(true);
     
     // Delay content appearance for dramatic effect
     const contentTimer = setTimeout(() => setShowContent(true), 400);
 
     // Fire celebration confetti
     const duration = 3000;
     const end = Date.now() + duration;
 
     // Initial burst
     confetti({
       particleCount: 100,
       spread: 70,
       origin: { y: 0.6 },
       colors: ['#FF8A00', '#FFB800', '#FF6B00', '#22C55E', '#FFFFFF'],
     });
 
     // Continuous confetti
     const frame = () => {
       confetti({
         particleCount: 2,
         angle: 60,
         spread: 55,
         origin: { x: 0 },
         colors: ['#FF8A00', '#FFB800', '#FF6B00'],
       });
       confetti({
         particleCount: 2,
         angle: 120,
         spread: 55,
         origin: { x: 1 },
         colors: ['#FF8A00', '#FFB800', '#FF6B00'],
       });
 
       if (Date.now() < end) {
         requestAnimationFrame(frame);
       }
     };
     frame();
 
     return () => clearTimeout(contentTimer);
   }, []);
 
   const handleGoHome = () => {
     navigate('/app/home');
   };
 
   const handleReorder = () => {
     navigate('/app/home');
   };
 
   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
       {/* Animated Background */}
       <div 
         className={cn(
           "absolute inset-0 transition-all duration-700",
           animate ? "opacity-100" : "opacity-0"
         )}
         style={{
           background: 'linear-gradient(135deg, hsl(28 100% 50% / 0.95) 0%, hsl(18 100% 45% / 0.98) 50%, hsl(28 100% 40% / 1) 100%)',
         }}
       />
 
       {/* Floating particles */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         {[...Array(20)].map((_, i) => (
           <div
             key={i}
             className="absolute w-2 h-2 rounded-full bg-white/20 animate-float-up"
             style={{
               left: `${Math.random() * 100}%`,
               animationDelay: `${Math.random() * 3}s`,
               animationDuration: `${3 + Math.random() * 2}s`,
             }}
           />
         ))}
       </div>
 
       {/* Glowing orbs */}
       <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
       <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
 
       {/* Main Content */}
       <div className={cn(
         "relative z-10 text-center text-white max-w-sm w-full transition-all duration-700",
         showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
       )}>
         {/* Icon Animation */}
         <div className={cn(
           "relative mx-auto mb-8 transition-all duration-1000",
           animate ? "scale-100" : "scale-0"
         )}>
           {/* Outer glow ring */}
           <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
           <div className="absolute inset-0 w-36 h-36 mx-auto -m-2 rounded-full bg-white/10 animate-pulse" />
           
           {/* Main icon container */}
           <div className="relative w-32 h-32 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-2xl">
             <PartyPopper className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
           </div>
 
           {/* Sparkle decorations */}
           <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-bounce" style={{ animationDuration: '2s' }} />
           <Sparkles className="absolute -bottom-1 -left-3 w-6 h-6 text-yellow-300 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
         </div>
 
         {/* Text Content */}
         <div className={cn(
           "space-y-3 mb-8 transition-all duration-700 delay-200",
           showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
         )}>
           <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg">
             Pedido Entregue!
           </h1>
           <p className="text-xl text-white/90 font-medium">
             Obrigado pela preferência! 🧡
           </p>
           <p className="text-white/70 text-sm">
             Pedido #{orderNumber} entregue com sucesso
           </p>
         </div>
 
         {/* Rating Section */}
         <div className={cn(
           "mb-8 p-5 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-700 delay-300",
           showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
         )}>
           <p className="text-sm text-white/80 mb-3">Como foi sua experiência?</p>
           <div className="flex justify-center gap-2">
             {[1, 2, 3, 4, 5].map((star) => (
               <button
                 key={star}
                 onClick={() => setSelectedRating(star)}
                 className={cn(
                   "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300",
                   selectedRating && selectedRating >= star
                    ? "bg-warning scale-110 shadow-lg"
                     : "bg-white/20 hover:bg-white/30 hover:scale-105"
                 )}
                style={selectedRating && selectedRating >= star ? { boxShadow: '0 10px 25px -5px hsl(38 92% 50% / 0.4)' } : {}}
               >
                 <Star 
                   className={cn(
                     "w-6 h-6 transition-colors",
                     selectedRating && selectedRating >= star
                       ? "text-white fill-white"
                       : "text-white/80"
                   )} 
                 />
               </button>
             ))}
           </div>
           {selectedRating && (
             <p className="text-xs text-white/70 mt-3 animate-fade-in">
               {selectedRating === 5 ? '🌟 Excelente! Obrigado!' : 
                selectedRating >= 4 ? '😊 Que bom que gostou!' : 
                selectedRating >= 3 ? '👍 Vamos melhorar!' : 
                '💬 Nos conte como melhorar!'}
             </p>
           )}
         </div>
 
         {/* Action Buttons */}
         <div className={cn(
           "space-y-3 transition-all duration-700 delay-500",
           showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
         )}>
           <Button
             onClick={handleReorder}
            className="w-full h-14 rounded-2xl bg-white font-semibold text-base shadow-xl hover:bg-white/90 hover:scale-[1.02] transition-all"
            style={{ color: 'hsl(28 100% 50%)' }}
           >
             <RotateCcw className="w-5 h-5 mr-2" />
             Pedir Novamente
           </Button>
           
           <Button
             onClick={handleGoHome}
             variant="ghost"
             className="w-full h-12 rounded-2xl text-white/90 hover:text-white hover:bg-white/10 font-medium"
           >
             <Home className="w-5 h-5 mr-2" />
             Voltar ao Cardápio
           </Button>
         </div>
 
         {/* Footer message */}
         <p className={cn(
           "mt-8 text-xs text-white/50 flex items-center justify-center gap-1 transition-all duration-700 delay-700",
           showContent ? "opacity-100" : "opacity-0"
         )}>
          Feito com <Heart className="w-3 h-3 text-destructive fill-destructive" /> para você
         </p>
       </div>
     </div>
   );
 }