import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export interface OpeningHoursSlot {
  start: string;
  end: string;
}

export interface OpeningHours {
  mon: OpeningHoursSlot[];
  tue: OpeningHoursSlot[];
  wed: OpeningHoursSlot[];
  thu: OpeningHoursSlot[];
  fri: OpeningHoursSlot[];
  sat: OpeningHoursSlot[];
  sun: OpeningHoursSlot[];
}

export interface StoreSettings {
  id: string;
  store_id: string;
  store_name: string;
  store_phone: string | null;
  store_address: string | null;
  store_lat: number | null;
  store_lng: number | null;
  timezone: string;
  opening_hours: OpeningHours;
  auto_open_close_enabled: boolean;
  is_open_override: boolean | null;
  closed_message: string | null;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  scheduled_delivery_enabled: boolean;
  min_order_value: number;
  payment_pix_enabled: boolean;
  payment_card_enabled: boolean;
  payment_cash_enabled: boolean;
  sla_accept_minutes: number;
  sla_prepare_minutes: number;
  sla_delivery_minutes: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_OPENING_HOURS: OpeningHours = {
  mon: [{ start: '18:00', end: '23:00' }],
  tue: [{ start: '18:00', end: '23:00' }],
  wed: [{ start: '18:00', end: '23:00' }],
  thu: [{ start: '18:00', end: '23:00' }],
  fri: [{ start: '18:00', end: '00:30' }],
  sat: [{ start: '18:00', end: '00:30' }],
  sun: [{ start: '18:00', end: '23:00' }],
};

const NEUTRAL_DEFAULTS: Partial<StoreSettings> = {
  store_name: '',
  timezone: 'America/Sao_Paulo',
  opening_hours: DEFAULT_OPENING_HOURS,
  auto_open_close_enabled: true,
  is_open_override: null,
  closed_message: 'Estamos fechados no momento. Volte em breve!',
  delivery_enabled: true,
  pickup_enabled: true,
  scheduled_delivery_enabled: false,
  min_order_value: 0,
  payment_pix_enabled: true,
  payment_card_enabled: true,
  payment_cash_enabled: true,
  sla_accept_minutes: 5,
  sla_prepare_minutes: 30,
  sla_delivery_minutes: 45,
};

interface StoreConfigContextValue {
  settings: StoreSettings | null;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  isStoreOpen: boolean;
  nextOpenTime: string | null;
  closesAt: string | null;
  refetch: () => Promise<void>;
}

const StoreConfigContext = createContext<StoreConfigContextValue | undefined>(undefined);

const DAY_MAP: Record<number, keyof OpeningHours> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function isWithinSlot(nowMinutes: number, slot: OpeningHoursSlot): boolean {
  const start = parseTimeToMinutes(slot.start);
  const end = parseTimeToMinutes(slot.end);
  if (end <= start) {
    return nowMinutes >= start || nowMinutes < end;
  } else {
    return nowMinutes >= start && nowMinutes < end;
  }
}

function getEndMinutes(slot: OpeningHoursSlot): number {
  const end = parseTimeToMinutes(slot.end);
  const start = parseTimeToMinutes(slot.start);
  return end <= start ? end + 24 * 60 : end;
}

function calculateStoreStatus(settings: StoreSettings | null): {
  isOpen: boolean;
  nextOpenTime: string | null;
  closesAt: string | null;
} {
  if (!settings) return { isOpen: false, nextOpenTime: null, closesAt: null };
  if (settings.is_open_override !== null) {
    return { isOpen: settings.is_open_override, nextOpenTime: null, closesAt: null };
  }
  if (!settings.auto_open_close_enabled) {
    return { isOpen: true, nextOpenTime: null, closesAt: null };
  }

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone,
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || 'mon';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const nowMinutes = hour * 60 + minute;
  const dayKey = weekday.slice(0, 3) as keyof OpeningHours;
  const todaySlots = settings.opening_hours[dayKey] || [];

  for (const slot of todaySlots) {
    if (isWithinSlot(nowMinutes, slot)) {
      const endMinutes = getEndMinutes(slot);
      const closesAt = formatMinutesToTime(endMinutes % (24 * 60));
      return { isOpen: true, nextOpenTime: null, closesAt };
    }
  }

  const yesterday = Object.keys(DAY_MAP).find(k => DAY_MAP[Number(k)] === dayKey);
  const yesterdayIndex = ((Number(yesterday) || 0) - 1 + 7) % 7;
  const yesterdayKey = DAY_MAP[yesterdayIndex];
  const yesterdaySlots = settings.opening_hours[yesterdayKey] || [];
  for (const slot of yesterdaySlots) {
    const end = parseTimeToMinutes(slot.end);
    const start = parseTimeToMinutes(slot.start);
    if (end <= start && nowMinutes < end) {
      return { isOpen: true, nextOpenTime: null, closesAt: slot.end };
    }
  }

  let nextOpenTime: string | null = null;
  for (const slot of todaySlots) {
    const start = parseTimeToMinutes(slot.start);
    if (start > nowMinutes) { nextOpenTime = slot.start; break; }
  }
  if (!nextOpenTime) {
    for (let i = 1; i <= 7; i++) {
      const checkDayIndex = (Object.entries(DAY_MAP).find(([_, v]) => v === dayKey)?.[0] || '0');
      const nextDayIndex = (Number(checkDayIndex) + i) % 7;
      const nextDayKey = DAY_MAP[nextDayIndex];
      const nextDaySlots = settings.opening_hours[nextDayKey] || [];
      if (nextDaySlots.length > 0) { nextOpenTime = nextDaySlots[0].start; break; }
    }
  }
  return { isOpen: false, nextOpenTime, closesAt: null };
}

export function StoreConfigProvider({ children }: { children: ReactNode }) {
  const storeId = useStoreId();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (data) {
        const openingHours = typeof data.opening_hours === 'string' 
          ? JSON.parse(data.opening_hours) 
          : data.opening_hours;
        setSettings({ ...data, opening_hours: openingHours || DEFAULT_OPENING_HOURS } as StoreSettings);
      } else {
        setSettings({ ...NEUTRAL_DEFAULTS, store_id: storeId, opening_hours: DEFAULT_OPENING_HOURS } as StoreSettings);
      }
    } catch (err) {
      console.error('[StoreConfig] Failed to fetch settings:', err);
      setError(err as Error);
      setSettings({ ...NEUTRAL_DEFAULTS, store_id: storeId, opening_hours: DEFAULT_OPENING_HOURS } as StoreSettings);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    // Reset state immediately when storeId changes to prevent stale data flash
    setSettings(null);
    setIsLoading(true);
    fetchSettings();
    const interval = setInterval(fetchSettings, 60000);
    return () => clearInterval(interval);
  }, [fetchSettings]);

  const storeStatus = useMemo(() => calculateStoreStatus(settings), [settings]);

  const value: StoreConfigContextValue = {
    settings,
    isLoading,
    isReady: !isLoading && settings !== null,
    error,
    isStoreOpen: storeStatus.isOpen,
    nextOpenTime: storeStatus.nextOpenTime,
    closesAt: storeStatus.closesAt,
    refetch: fetchSettings,
  };

  return (
    <StoreConfigContext.Provider value={value}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig() {
  const context = useContext(StoreConfigContext);
  if (context === undefined) {
    throw new Error('useStoreConfig must be used within StoreConfigProvider');
  }
  return context;
}
