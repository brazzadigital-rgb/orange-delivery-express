import { Wrench, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppConfig } from '@/contexts/AppConfigContext';

export default function Maintenance() {
  const { config } = useAppConfig();

  const handleContactSupport = () => {
    if (config?.support_whatsapp) {
      const phone = config.support_whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    } else if (config?.support_email) {
      window.location.href = `mailto:${config.support_email}`;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ 
        background: `linear-gradient(135deg, ${config?.theme_color || '#FF8A00'}10, ${config?.background_color || '#FFFFFF'})` 
      }}
    >
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animation */}
        <div className="relative">
          <div 
            className="w-28 h-28 mx-auto rounded-full flex items-center justify-center animate-pulse"
            style={{ background: `${config?.theme_color || '#FF8A00'}15` }}
          >
            <Wrench 
              className="w-14 h-14" 
              style={{ color: config?.theme_color || '#FF8A00' }}
            />
          </div>
          <div 
            className="absolute top-0 right-1/4 w-4 h-4 rounded-full animate-bounce"
            style={{ background: config?.theme_color || '#FF8A00' }}
          />
        </div>

        {/* Logo */}
        {config?.app_logo_url && (
          <img 
            src={config.app_logo_url} 
            alt={config?.app_name || 'App'} 
            className="h-12 max-w-[180px] mx-auto object-contain"
          />
        )}

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Em Manutenção
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {config?.maintenance_message || 'Estamos trabalhando para melhorar sua experiência. Voltamos em breve!'}
          </p>
        </div>

        {/* Time indicator */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span>Previsão: em breve</span>
        </div>

        {/* Support contact */}
        {(config?.support_whatsapp || config?.support_email) && (
          <Button
            onClick={handleContactSupport}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Falar com Suporte
          </Button>
        )}
      </div>
    </div>
  );
}