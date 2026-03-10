import { Link } from 'react-router-dom';
import { Flame, Instagram, Facebook, MessageCircle } from 'lucide-react';

interface LandingFooterProps {
  appName: string;
  logoUrl?: string;
}

export default function LandingFooter({ appName, logoUrl }: LandingFooterProps) {
  return (
    <footer className="relative py-12 sm:py-14 lg:py-16 bg-[hsl(230_15%_5%)] border-t border-[hsl(0_0%_100%/0.05)]">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={appName} 
                className="h-10 sm:h-12 max-w-[140px] sm:max-w-[180px] object-contain mb-3 sm:mb-4"
              />
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[hsl(28_100%_50%)] to-[hsl(345_100%_55%)] flex items-center justify-center">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-[hsl(30_100%_96%)]">{appName}</span>
              </div>
            )}
            <p className="text-xs sm:text-sm text-[hsl(220_10%_55%)] max-w-xs mb-4 sm:mb-6">
              Pizza artesanal premium com entrega rápida e rastreio ao vivo.
            </p>
            
            {/* Social */}
            <div className="flex items-center gap-2 sm:gap-3">
              {[
                { icon: Instagram, href: '#' },
                { icon: Facebook, href: '#' },
                { icon: MessageCircle, href: '#' },
              ].map((social, i) => (
                <a 
                  key={i}
                  href={social.href}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl glass-premium flex items-center justify-center text-[hsl(220_10%_60%)] hover:text-[hsl(28_100%_55%)] hover:border-[hsl(28_100%_50%/0.3)] transition-all"
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm sm:text-base text-[hsl(30_100%_96%)] mb-3 sm:mb-4">Navegação</h4>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { label: 'Cardápio', href: '/app/home' },
                { label: 'Pedidos', href: '/app/orders' },
                { label: 'Instalar App', href: '/pwa/install' },
              ].map((link, i) => (
                <li key={i}>
                  <Link 
                    to={link.href}
                    className="text-xs sm:text-sm text-[hsl(220_10%_55%)] hover:text-[hsl(28_100%_55%)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-sm sm:text-base text-[hsl(30_100%_96%)] mb-3 sm:mb-4">Contato</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-[hsl(220_10%_55%)]">
              <li>Seg - Dom: 18h - 23h</li>
              <li>(11) 99999-9999</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 sm:pt-8 border-t border-[hsl(0_0%_100%/0.05)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] sm:text-xs text-[hsl(220_10%_45%)]">
            © 2024 {appName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-[hsl(220_10%_45%)]">
            <a href="#" className="hover:text-[hsl(28_100%_55%)] transition-colors">Termos</a>
            <a href="#" className="hover:text-[hsl(28_100%_55%)] transition-colors">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
