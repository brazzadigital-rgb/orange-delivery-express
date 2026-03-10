import { ArrowLeft, Clock, MapPin, Phone, Truck, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStoreConfig, OpeningHoursSlot } from '@/contexts/StoreConfigContext';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_NAMES: Record<string, string> = {
  mon: 'Segunda-feira',
  tue: 'Terça-feira',
  wed: 'Quarta-feira',
  thu: 'Quinta-feira',
  fri: 'Sexta-feira',
  sat: 'Sábado',
  sun: 'Domingo',
};

function getCurrentDayKey(): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date().getDay()];
}

function formatSlots(slots: OpeningHoursSlot[]): string {
  if (!slots || slots.length === 0) return 'Fechado';
  return slots.map(s => `${s.start} - ${s.end}`).join(', ');
}

export default function StoreHoursPage() {
  const { settings, isStoreOpen, nextOpenTime, closesAt, isLoading } = useStoreConfig();
  const { config } = useAppConfig();
  
  const gradientStart = config?.gradient_start || '#FF8A00';
  const gradientEnd = config?.gradient_end || '#FF6A3D';
  const todayKey = getCurrentDayKey();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header 
        className="relative text-white px-4 pb-8 rounded-b-[28px] overflow-hidden"
        style={{ 
          paddingTop: 'max(56px, calc(env(safe-area-inset-top, 24px) + 32px))',
          background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)` 
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Link 
            to="/app/home"
            className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Horários de Funcionamento</h1>
        </div>

        {/* Status Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                isStoreOpen ? "bg-emerald-500/20" : "bg-white/10"
              )}
            >
              {isStoreOpen ? (
                <Store className="w-6 h-6 text-emerald-300" />
              ) : (
                <Clock className="w-6 h-6 text-white/80" />
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">
                {isStoreOpen ? 'Aberto agora' : 'Fechado'}
              </p>
              <p className="text-sm text-white/70">
                {isStoreOpen && closesAt && `Fecha às ${closesAt}`}
                {!isStoreOpen && nextOpenTime && `Abre às ${nextOpenTime}`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 -mt-2">
        {/* Weekly Schedule */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Horários da Semana
            </h2>
          </div>
          
          <div className="divide-y divide-border/30">
            {DAY_ORDER.map((day) => {
              const slots = settings?.opening_hours?.[day] || [];
              const isToday = day === todayKey;
              
              return (
                <div 
                  key={day}
                  className={cn(
                    "flex items-center justify-between px-4 py-3.5 transition-colors",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ background: gradientStart }}
                      />
                    )}
                    <span className={cn(
                      "text-sm",
                      isToday ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}>
                      {DAY_NAMES[day]}
                    </span>
                    {isToday && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        Hoje
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    slots.length === 0 ? "text-muted-foreground" : "font-medium text-foreground"
                  )}>
                    {formatSlots(slots)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Store Info */}
        <div className="mt-4 bg-card rounded-2xl border border-border/50 p-4 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Informações da Loja
          </h2>
          
          {settings?.store_address && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Endereço</p>
                <p className="text-sm font-medium">{settings.store_address}</p>
              </div>
            </div>
          )}
          
          {settings?.store_phone && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm font-medium">{settings.store_phone}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <div className={cn(
              "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border",
              settings?.delivery_enabled 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                : "bg-muted border-border text-muted-foreground"
            )}>
              <Truck className="w-4 h-4" />
              <span className="text-sm font-medium">
                Entrega {settings?.delivery_enabled ? 'Ativa' : 'Indisponível'}
              </span>
            </div>
            
            <div className={cn(
              "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border",
              settings?.pickup_enabled 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                : "bg-muted border-border text-muted-foreground"
            )}>
              <Store className="w-4 h-4" />
              <span className="text-sm font-medium">
                Retirada {settings?.pickup_enabled ? 'Ativa' : 'Indisponível'}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <Link to="/app/home">
            <Button 
              className="w-full h-12 rounded-xl font-semibold text-white"
              style={{ 
                background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
              }}
            >
              Ver Cardápio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
