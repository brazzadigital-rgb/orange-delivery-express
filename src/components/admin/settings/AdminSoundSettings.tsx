 import { Volume2, VolumeX } from 'lucide-react';
 import { Switch } from '@/components/ui/switch';
 import { Slider } from '@/components/ui/slider';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { useAdminPreferences, useUpdateAdminPreferences, testNotificationSound } from '@/hooks/useAdminPreferences';
 
 const SOUND_TYPES = [
   { value: 'chime', label: 'Chime' },
   { value: 'pop', label: 'Pop' },
   { value: 'bell', label: 'Sino' },
 ] as const;
 
 export function AdminSoundSettings() {
   const { data: preferences, isLoading } = useAdminPreferences();
   const updatePreferences = useUpdateAdminPreferences();
 
   const handleSoundEnabledChange = (enabled: boolean) => {
     updatePreferences.mutate({ sound_enabled: enabled });
   };
 
   const handleVolumeChange = (value: number[]) => {
     updatePreferences.mutate({ sound_volume: value[0] });
   };
 
   const handleSoundTypeChange = (type: 'chime' | 'bell' | 'pop') => {
     updatePreferences.mutate({ sound_type: type });
   };
 
   const handleTestSound = () => {
     testNotificationSound(
       preferences?.sound_type || 'chime',
       preferences?.sound_volume ?? 0.7
     );
   };
 
   if (isLoading) {
     return (
       <div className="bg-card rounded-2xl border p-6 animate-pulse">
         <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
         <div className="space-y-4">
           <div className="h-12 bg-muted rounded"></div>
           <div className="h-12 bg-muted rounded"></div>
         </div>
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Sound Toggle */}
       <div className="bg-card rounded-2xl border p-6 space-y-6">
         <h3 className="font-semibold text-lg flex items-center gap-2">
           <Volume2 className="w-5 h-5" />
           Som de Novos Pedidos
         </h3>
 
         <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
           <div className="space-y-1">
             <Label className="font-medium">Ativar som</Label>
             <p className="text-sm text-muted-foreground">
               Tocar som quando um novo pedido chegar
             </p>
           </div>
           <Switch
             checked={preferences?.sound_enabled ?? true}
             onCheckedChange={handleSoundEnabledChange}
             disabled={updatePreferences.isPending}
           />
         </div>
 
         {/* Volume Slider */}
         {preferences?.sound_enabled && (
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <Label>Volume</Label>
               <span className="text-sm text-muted-foreground">
                 {Math.round((preferences?.sound_volume ?? 0.7) * 100)}%
               </span>
             </div>
             <div className="flex items-center gap-3">
               <VolumeX className="w-4 h-4 text-muted-foreground" />
               <Slider
                 value={[preferences?.sound_volume ?? 0.7]}
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
         {preferences?.sound_enabled && (
           <div className="space-y-3">
             <Label>Tipo de som</Label>
             <div className="flex gap-2">
               {SOUND_TYPES.map((type) => (
                 <button
                   key={type.value}
                   onClick={() => handleSoundTypeChange(type.value)}
                   className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                     preferences?.sound_type === type.value
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
         {preferences?.sound_enabled && (
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
 
       <div className="bg-muted/30 rounded-xl p-4">
         <p className="text-sm text-muted-foreground">
           💡 O som será tocado em <strong>qualquer página do painel</strong> quando um novo pedido chegar.
         </p>
       </div>
     </div>
   );
 }