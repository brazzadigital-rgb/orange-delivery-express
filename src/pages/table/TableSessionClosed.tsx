import { Heart, Star, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TableSessionClosed() {
  const [show, setShow] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
    setTimeout(() => setShowStars(true), 800);
    setTimeout(() => setShowMessage(true), 1200);
    setTimeout(() => setShowFooter(true), 1600);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 via-background to-background p-6 overflow-hidden relative">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-primary/10 animate-float-particle"
          style={{ width: `${8 + Math.random() * 16}px`, height: `${8 + Math.random() * 16}px`,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.4}s`, animationDuration: `${4 + Math.random() * 4}s` }} />
      ))}

      <div className="text-center max-w-sm mx-auto space-y-8 relative z-10">
        <div className={`transition-all duration-700 ease-out ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto shadow-lg shadow-primary/10 animate-pulse-soft">
              <UtensilsCrossed className="w-14 h-14 text-primary" />
            </div>
            <div className={`absolute -top-1 -right-1 transition-all duration-500 delay-500 ${show ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 rotate-45'}`}>
              <Sparkles className="w-7 h-7 text-primary fill-primary/30" />
            </div>
          </div>
        </div>

        <div className={`space-y-3 transition-all duration-700 ease-out delay-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Obrigado! 🎉</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">Sua conta foi fechada com sucesso.</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-7 h-7 text-primary fill-primary transition-all duration-500 ease-out ${showStars ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
              style={{ transitionDelay: `${i * 120}ms`, filter: showStars ? 'drop-shadow(0 0 6px hsl(var(--primary) / 0.4))' : 'none' }} />
          ))}
        </div>

        <div className={`transition-all duration-700 ease-out ${showMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-sm">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Esperamos que tenha gostado da experiência! ✨<br />
              <span className="font-medium text-foreground">Volte sempre</span>, será um prazer atendê-lo novamente.
            </p>
          </div>
        </div>

        <div className={`flex items-center justify-center gap-1.5 text-muted-foreground/50 text-xs pt-2 transition-all duration-700 ${showFooter ? 'opacity-100' : 'opacity-0'}`}>
          <span>Feito com</span>
          <Heart className="w-3.5 h-3.5 fill-destructive text-destructive animate-heartbeat" />
        </div>
      </div>

      <style>{`
        @keyframes float-particle { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; } 50% { transform: translateY(-30px) scale(1.2); opacity: 0.6; } }
        .animate-float-particle { animation: float-particle ease-in-out infinite; }
        @keyframes pulse-soft { 0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.15); } 50% { box-shadow: 0 0 0 16px hsl(var(--primary) / 0); } }
        .animate-pulse-soft { animation: pulse-soft 2.5s ease-in-out infinite; }
        @keyframes heartbeat { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.3); } 30% { transform: scale(1); } 45% { transform: scale(1.2); } }
        .animate-heartbeat { animation: heartbeat 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
