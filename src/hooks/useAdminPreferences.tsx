import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AdminPreferences {
  id: string;
  user_id: string;
  sound_enabled: boolean;
  sound_volume: number;
  sound_type: 'chime' | 'bell' | 'pop' | 'custom';
  custom_sound_url: string | null;
  created_at: string;
  updated_at: string;
}

const defaultPreferences: Omit<AdminPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  sound_enabled: true,
  sound_volume: 0.7,
  sound_type: 'chime',
  custom_sound_url: null,
};

// Sound URLs - using web audio
const SOUNDS: Record<string, string> = {
  // Use local assets to keep consistency and avoid unexpected external audio.
  chime: '/sounds/soft-chime.mp3',
  bell: '/sounds/bell.mp3',
  // Versioned filename to avoid stale PWA/service-worker caches.
  pop: '/sounds/pop-v2.mp3',
};

// Store preferences in localStorage as fallback since the table may not exist yet
const STORAGE_KEY = 'admin_preferences';

function getStoredPreferences(): AdminPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredPreferences(prefs: Partial<AdminPreferences>) {
  try {
    const current = getStoredPreferences() || { ...defaultPreferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch {
    // Ignore storage errors
  }
}

export function useAdminPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-preferences', user?.id],
    queryFn: async (): Promise<AdminPreferences | null> => {
      if (!user) return null;

      // Try to get from localStorage first
      const stored = getStoredPreferences();
      if (stored) {
        return {
          ...stored,
          id: 'local',
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // Return defaults
      return {
        ...defaultPreferences,
        id: 'local',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    enabled: !!user,
  });
}

export function useUpdateAdminPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<AdminPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      setStoredPreferences(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-preferences'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar preferências');
    },
  });
}

export function playNotificationSound(preferences: AdminPreferences | null) {
  if (!preferences?.sound_enabled) return;

  const soundUrl = preferences.sound_type === 'custom' && preferences.custom_sound_url
    ? preferences.custom_sound_url
    : SOUNDS[preferences.sound_type] || SOUNDS.chime;

  const audio = new Audio(soundUrl);
  audio.volume = preferences.sound_volume;
  audio.play().catch(console.error);
}

export function testNotificationSound(soundType: string, volume: number, customUrl?: string) {
  const soundUrl = soundType === 'custom' && customUrl
    ? customUrl
    : SOUNDS[soundType] || SOUNDS.chime;

  const audio = new Audio(soundUrl);
  audio.volume = volume;
  audio.play().catch((err) => {
    console.error('Error playing sound:', err);
    toast.error('Erro ao reproduzir som');
  });
}
