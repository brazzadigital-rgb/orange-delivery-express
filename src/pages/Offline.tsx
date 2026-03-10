import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppConfig } from '@/contexts/AppConfigContext';

export default function Offline() {
  const { config } = useAppConfig();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/app/home';
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: `linear-gradient(135deg, ${config?.theme_color || '#FF8A00'}10, ${config?.background_color || '#FFFFFF'})` }}
    >
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div 
          className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
          style={{ background: `${config?.theme_color || '#FF8A00'}20` }}
        >
          <WifiOff 
            className="w-12 h-12" 
            style={{ color: config?.theme_color || '#FF8A00' }}
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
            Você está offline
          </h1>
          <p className="text-muted-foreground text-lg">
            {config?.offline_message || 'Verifique sua conexão com a internet e tente novamente.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleRefresh}
            size="lg"
            className="gap-2"
            style={{ background: config?.theme_color || '#FF8A00' }}
          >
            <RefreshCw className="w-5 h-5" />
            Tentar novamente
          </Button>
          <Button
            onClick={handleGoHome}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <Home className="w-5 h-5" />
            Ir para o início
          </Button>
        </div>

        {/* Offline catalog hint */}
        {config?.enable_offline_catalog && (
          <p className="text-sm text-muted-foreground">
            Você ainda pode ver o cardápio em cache.
          </p>
        )}
      </div>
    </div>
  );
}