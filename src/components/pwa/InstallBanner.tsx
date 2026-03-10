import { useState } from 'react';
import { X, Download, Share, Plus, Smartphone, Zap, Wifi, Chrome, Monitor, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePWA } from '@/hooks/usePWA';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { cn } from '@/lib/utils';

interface InstallBannerProps {
  variant?: 'bottom' | 'top' | 'floating';
  className?: string;
}

export function InstallBanner({ variant = 'bottom', className }: InstallBannerProps) {
  const { shouldShowBanner, isIOS, isInstallable, promptInstall, dismiss } = usePWA();
  const { config } = useAppConfig();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  if (!shouldShowBanner || !config?.enable_install_banner) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      // iOS: show Safari instructions
      setShowIOSModal(true);
    } else if (isInstallable) {
      // Native prompt available - trigger it directly
      const success = await promptInstall();
      if (success) {
        // App was installed, banner will hide automatically
        return;
      }
      // User declined or something went wrong, show manual instructions
      setShowManualModal(true);
    } else {
      // No native prompt available: show manual instructions (no redirect)
      setShowManualModal(true);
    }
  };

  const appName = config?.app_name || '';
  const appShortName = config?.app_short_name || appName || 'Aplicativo';
  const themeColor = config?.theme_color || '#FF8A00';
  // Icon URL with cache-busting to ensure latest branding
  const iconUrl = config?.app_icon_192_url ? `${config.app_icon_192_url}?v=${Date.now()}` : undefined;
  const hasIcon = Boolean(config?.app_icon_192_url);

  return (
    <>
      {/* Install Banner (reference-like) */}
      <div
        className={cn(
          'fixed left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-500',
          variant === 'bottom' && 'bottom-0',
          variant === 'top' && 'top-0',
          variant === 'floating' && 'bottom-4 left-2 right-2',
          className
        )}
      >
        <div
          className={cn(
            'bg-card/95 backdrop-blur-md border shadow-2xl',
            variant === 'floating' ? 'rounded-2xl mx-2' : 'border-t rounded-t-2xl',
          )}
          style={{ borderTopColor: themeColor }}
        >
          <div className="p-4">
            {/* Top row: icon + texts + close */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl shadow-lg flex-shrink-0 overflow-hidden',
                  !hasIcon && 'flex items-center justify-center'
                )}
                style={!hasIcon ? { background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` } : undefined}
              >
                {hasIcon ? (
                  <img
                    src={iconUrl}
                    alt={appName || appShortName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Smartphone className="w-6 h-6 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-sm">
                      Instalar {appShortName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      Adicione à tela inicial para acesso rápido e experiência completa
                    </p>
                  </div>

                  <button
                    onClick={dismiss}
                    className="p-1.5 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>

            {/* Full-width CTA */}
            <Button
              onClick={handleInstall}
              className="w-full gap-2 h-10 mt-3 font-semibold shadow-lg motion-reduce:animate-none"
              style={{ background: themeColor }}
            >
              <Download className="w-4 h-4" />
              Instalar Aplicativo
            </Button>

            {/* Benefits (reference-like) */}
            <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" style={{ color: themeColor }} />
                <span>Acesso offline</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: themeColor }} />
                <span>Carregamento rápido</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
        <DialogContent className="max-w-[340px] mx-4 rounded-2xl p-4">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-3">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl shadow-lg mx-auto overflow-hidden',
                  !hasIcon && 'flex items-center justify-center'
                )}
                style={!hasIcon ? { background: themeColor } : undefined}
              >
                {hasIcon ? (
                  <img
                    src={iconUrl}
                    alt={appName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Smartphone className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <DialogTitle className="text-lg">Instalar {appShortName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Step 1 */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: themeColor }}
              >
                1
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Share className="w-4 h-4" style={{ color: themeColor }} />
                <span className="text-sm">Toque em Compartilhar</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: themeColor }}
              >
                2
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Plus className="w-4 h-4" />
                <span className="text-sm">Adicionar à Tela de Início</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: themeColor }}
              >
                3
              </div>
              <span className="text-sm">Toque em "Adicionar"</span>
            </div>
          </div>

          <Button
            onClick={() => setShowIOSModal(false)}
            className="w-full h-10 font-semibold mt-2"
            style={{ background: themeColor }}
          >
            Entendi
          </Button>
        </DialogContent>
      </Dialog>

      {/* Manual Instructions Modal (Android/Desktop when no native prompt) */}
      <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
        <DialogContent className="max-w-[360px] mx-4 rounded-2xl p-4">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-3">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl shadow-lg mx-auto overflow-hidden',
                  !hasIcon && 'flex items-center justify-center'
                )}
                style={!hasIcon ? { background: themeColor } : undefined}
              >
                {hasIcon ? (
                  <img
                    src={iconUrl}
                    alt={appName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Smartphone className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <DialogTitle className="text-lg">Como Instalar {appShortName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground text-center">
              Use o menu do seu navegador para instalar o aplicativo.
            </p>

            {/* Android/Chrome instructions */}
            <div className="p-3 rounded-xl bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Chrome className="w-4 h-4" style={{ color: themeColor }} />
                <p className="text-sm font-semibold">Android / Chrome</p>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1.5 pl-1">
                <li className="flex items-start gap-2">
                  <span className="font-bold" style={{ color: themeColor }}>1.</span>
                  <span>Toque no menu <MoreVertical className="w-3.5 h-3.5 inline" /> do navegador</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold" style={{ color: themeColor }}>2.</span>
                  <span>Selecione "Instalar app" ou "Adicionar à tela inicial"</span>
                </li>
              </ol>
            </div>

            {/* Desktop instructions */}
            <div className="p-3 rounded-xl bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" style={{ color: themeColor }} />
                <p className="text-sm font-semibold">Computador</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Clique no ícone de instalação na barra de endereço ou use o menu do navegador.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowManualModal(false)}
            className="w-full h-9 mt-2"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
