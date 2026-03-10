import { ShieldX, QrCode, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TableSessionExpired() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-destructive/5 via-background to-background p-6 overflow-hidden relative">
      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-destructive/5"
          style={{
            width: `${6 + Math.random() * 12}px`,
            height: `${6 + Math.random() * 12}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-particle ${4 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      <div className={`text-center max-w-sm mx-auto space-y-6 relative z-10 transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Icon */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-destructive/15 to-destructive/5 flex items-center justify-center mx-auto shadow-lg">
            <ShieldX className="w-12 h-12 text-destructive" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-6 h-6 text-muted-foreground/40" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Sessão Expirada
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Esta sessão não está mais ativa ou o token expirou.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Escaneie o QR Code da mesa</p>
              <p className="text-xs text-muted-foreground">
                Para iniciar uma nova sessão, escaneie novamente o QR Code disponível na sua mesa.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/50 pt-2">
          Sua segurança é nossa prioridade 🔒
        </p>
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.15); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
