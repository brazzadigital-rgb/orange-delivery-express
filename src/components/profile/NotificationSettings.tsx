import { Volume2, VolumeX, Bell, BellOff, Smartphone, Check, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useAudioUnlock } from '@/hooks/useAudioUnlock';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { AudioManager } from '@/lib/AudioManager';
import { toast } from 'sonner';

const SOUND_TYPES = [
  { value: 'soft_chime', label: 'Chime suave' },
  { value: 'pop', label: 'Pop' },
  { value: 'bell', label: 'Sino' },
] as const;

// Map sound types to URLs
function getSoundUrl(type: string): string {
  switch (type) {
    case 'pop':
      return '/sounds/pop-v2.mp3';
    case 'bell':
      return '/sounds/bell.mp3';
    case 'soft_chime':
    default:
      return '/sounds/soft-chime.mp3';
  }
}

export function NotificationSettings() {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();
  const { isUnlocked, unlock } = useAudioUnlock();
  const { diagnostics, subscribe, unsubscribe, sendTestPush } = usePushNotifications();

  const handleSoundEnabledChange = (enabled: boolean) => {
    updatePreferences({ order_sound_enabled: enabled });
  };

  const handleVolumeChange = (value: number[]) => {
    updatePreferences({ order_sound_volume: value[0] });
  };

  const handleSoundTypeChange = (type: 'soft_chime' | 'pop' | 'bell') => {
    updatePreferences({ order_sound_type: type });
  };

  const handleVibrationChange = (enabled: boolean) => {
    updatePreferences({ vibration_enabled: enabled });
  };

  const handlePushChange = async (enabled: boolean) => {
    if (enabled) {
      // Subscribe to push notifications (this handles permission request)
      const success = await subscribe();
      if (!success) {
        return; // Don't update preference if subscription failed
      }
    }
    
    if (!enabled) {
      // Unsubscribe from push notifications
      await unsubscribe();
    }
    
    await updatePreferences({ push_enabled: enabled });
  };

  const handleActivateSound = async () => {
    // CRITICAL (Android/iOS): create the Audio element *before* any async operation (even unlock()).
    // Otherwise the user gesture context is lost.
    const soundType = preferences?.order_sound_type || 'soft_chime';
    const soundUrl = getSoundUrl(soundType);
    const testAudio = new Audio(soundUrl);
    testAudio.volume = preferences?.order_sound_volume || 0.8;
    testAudio.preload = 'auto';
    testAudio.load();

    // Now we can unlock (which itself tries to play a different muted audio)
    const success = await unlock();
    if (success) {
      // Play the pre-created element (this keeps the user gesture)
      try {
        await testAudio.play();
        toast.success('Som ativado com sucesso!');
      } catch (e) {
        console.error('[NotificationSettings] testAudio.play() failed:', e);
        toast.error('Não foi possível reproduzir o som');
      }
    } else {
      toast.error('Não foi possível ativar o som');
    }
  };

  const handleTestSound = async () => {
    if (!isUnlocked) {
      await handleActivateSound();
      return;
    }

    // Create audio element *immediately* (before any await)
    const soundType = preferences?.order_sound_type || 'soft_chime';
    const soundUrl = getSoundUrl(soundType);
    const testAudio = new Audio(soundUrl);
    testAudio.volume = preferences?.order_sound_volume || 0.8;
    testAudio.preload = 'auto';
    testAudio.load();

    try {
      await testAudio.play();
    } catch (e) {
      console.error('[NotificationSettings] testAudio.play() failed:', e);
      toast.error('Não foi possível reproduzir o som');
    }
  };

  if (isLoading) {
    return (
      <div className="card-premium p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sound Status Banner */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${isUnlocked ? 'bg-primary/10 border border-primary/30' : 'bg-accent/50 border border-accent'}`}>
        {isUnlocked ? (
          <>
            <Check className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              Som ativado ✅
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-accent-foreground" />
            <div className="flex-1">
              <span className="text-sm font-medium">
                Som bloqueado — toque para ativar
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={handleActivateSound}>
              Ativar
            </Button>
          </>
        )}
      </div>

      {/* Sound Settings */}
      <div className="card-premium p-4 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Sons de Notificação
        </h3>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Som de atualizações</p>
            <p className="text-sm text-muted-foreground">Tocar som quando o status do pedido mudar</p>
          </div>
          <Switch
            checked={preferences?.order_sound_enabled ?? true}
            onCheckedChange={handleSoundEnabledChange}
            disabled={isUpdating}
          />
        </div>

        {/* Volume Slider */}
        {preferences?.order_sound_enabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volume</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((preferences?.order_sound_volume ?? 0.8) * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <VolumeX className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[preferences?.order_sound_volume ?? 0.8]}
                onValueChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.1}
                className="flex-1"
              />
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Sound Type Selection */}
        {preferences?.order_sound_enabled && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Tipo de som</span>
            <div className="flex gap-2">
              {SOUND_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleSoundTypeChange(type.value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    preferences?.order_sound_type === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Test Sound Button */}
        {preferences?.order_sound_enabled && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleTestSound}
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Testar som
          </Button>
        )}
      </div>

      {/* Vibration Settings */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Vibração
            </p>
            <p className="text-sm text-muted-foreground">Vibrar ao receber atualizações</p>
          </div>
          <Switch
            checked={preferences?.vibration_enabled ?? true}
            onCheckedChange={handleVibrationChange}
            disabled={isUpdating}
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium flex items-center gap-2">
              {diagnostics.subscriptionExists ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5" />}
              Push Notifications
            </p>
            <p className="text-sm text-muted-foreground">
              {diagnostics.subscriptionExists 
                ? 'Ativo — você receberá notificações mesmo com o app fechado' 
                : 'Receber notificações mesmo com o app fechado'}
            </p>
          </div>
          <Switch
            checked={diagnostics.subscriptionExists || (preferences?.push_enabled ?? false)}
            onCheckedChange={handlePushChange}
            disabled={isUpdating || diagnostics.isSubscribing}
          />
        </div>
        
        {/* Test Push Button */}
        {diagnostics.subscriptionExists && (
          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-3" 
            onClick={sendTestPush}
          >
            <Bell className="w-4 h-4 mr-2" />
            Testar push notification
          </Button>
        )}
      </div>
    </div>
  );
}
