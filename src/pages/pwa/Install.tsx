import { Smartphone, Download, Check, Share, Plus, Chrome, Apple, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { useNavigate } from 'react-router-dom';

export default function PWAInstall() {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, isAndroid, promptInstall } = usePWA();
  const { config } = useAppConfig();

  const appName = config?.app_name || 'Delivery';

  const handleInstall = async () => {
    if (isInstallable) {
      await promptInstall();
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold">App Instalado!</h1>
          <p className="text-muted-foreground">
            O {appName} já está instalado no seu dispositivo.
          </p>
          <Button onClick={() => navigate('/app/home')} className="w-full">
            Abrir o App
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary/5 to-background"
      style={{ 
        background: `linear-gradient(135deg, ${config?.theme_color || '#FF8A00'}10, ${config?.background_color || '#FFFFFF'})` 
      }}
    >
      <div className="container max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          {/* App Icon */}
          <div 
            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-xl"
            style={{ background: config?.theme_color || '#FF8A00' }}
          >
            {config?.app_icon_192_url ? (
              <img 
                src={config.app_icon_192_url} 
                alt={appName}
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <Smartphone className="w-12 h-12 text-white" />
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Instalar {appName}
            </h1>
            <p className="text-muted-foreground text-lg">
              {config?.app_description || 'Tenha acesso rápido ao app direto da sua tela inicial'}
            </p>
          </div>

          {/* Install Button for supported browsers */}
          {isInstallable && (
            <Button
              onClick={handleInstall}
              size="lg"
              className="gap-2 text-lg px-8"
              style={{ background: config?.theme_color || '#FF8A00' }}
            >
              <Download className="w-5 h-5" />
              Instalar Agora
            </Button>
          )}
        </div>

        {/* Benefits */}
        <div className="grid gap-4 mb-12">
          <h2 className="text-xl font-semibold text-center mb-4">
            Vantagens do App
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '⚡', title: 'Acesso Rápido', desc: 'Abra direto da tela inicial' },
              { icon: '📱', title: 'Tela Cheia', desc: 'Experiência sem barra do navegador' },
              { icon: '🔔', title: 'Notificações', desc: 'Receba atualizações do pedido' },
              { icon: '📶', title: 'Funciona Offline', desc: 'Veja o cardápio sem internet' },
            ].map((benefit, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{benefit.icon}</span>
                  <div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Instructions */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-center">
            Como Instalar
          </h2>

          {/* Android / Chrome */}
          <div className="p-6 rounded-2xl bg-card border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Chrome className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Android / Chrome</h3>
                <p className="text-sm text-muted-foreground">Google Chrome, Edge, Samsung Internet</p>
              </div>
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">1</span>
                <span>Toque no menu do navegador (⋮) no canto superior direito</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">2</span>
                <span>Selecione "Instalar app" ou "Adicionar à tela inicial"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">3</span>
                <span>Confirme tocando em "Instalar"</span>
              </li>
            </ol>
          </div>

          {/* iOS / Safari */}
          <div className="p-6 rounded-2xl bg-card border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center">
                <Apple className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold">iPhone / iPad</h3>
                <p className="text-sm text-muted-foreground">Safari (navegador padrão)</p>
              </div>
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">1</span>
                <div className="flex items-center gap-2">
                  <span>Toque no botão Compartilhar</span>
                  <Share className="w-4 h-4" />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">2</span>
                <div className="flex items-center gap-2">
                  <span>Role e toque em "Adicionar à Tela de Início"</span>
                  <Plus className="w-4 h-4" />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">3</span>
                <span>Toque em "Adicionar" no canto superior direito</span>
              </li>
            </ol>
          </div>

          {/* Desktop */}
          <div className="p-6 rounded-2xl bg-card border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Computador</h3>
                <p className="text-sm text-muted-foreground">Chrome, Edge, Brave</p>
              </div>
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">1</span>
                <span>Clique no ícone de instalação na barra de endereço</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">2</span>
                <span>Ou clique no menu (⋮) e selecione "Instalar {appName}"</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/app/home')}
          >
            Continuar no navegador
          </Button>
        </div>
      </div>
    </div>
  );
}