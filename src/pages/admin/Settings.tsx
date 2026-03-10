import { useState, useEffect } from 'react';
import { 
  Store, 
  Clock, 
  Truck, 
  CreditCard, 
  Target,
  Save,
  MapPin,
  Phone,
  ToggleLeft,
  Printer,
  Volume2,
  Star,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStoreSettings, useUpdateStoreSettings } from '@/hooks/useStoreSettings';
import { usePrintSettings, useUpdatePrintSettings } from '@/hooks/usePrintSettings';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OpeningHoursEditor } from '@/components/admin/settings/OpeningHoursEditor';
import { StoreStatusPreview } from '@/components/admin/settings/StoreStatusPreview';
import { LocationPickerMap } from '@/components/admin/settings/LocationPickerMap';
import { PrintSettingsSection } from '@/components/admin/settings/PrintSettingsSection';
import { AdminSoundSettings } from '@/components/admin/settings/AdminSoundSettings';
import { ReviewSettingsSection } from '@/components/admin/settings/ReviewSettingsSection';
import { HomeSectionsEditor } from '@/components/admin/settings/HomeSectionsEditor';
import type { OpeningHours } from '@/contexts/StoreConfigContext';

const DEFAULT_OPENING_HOURS: OpeningHours = {
  mon: [{ start: '18:00', end: '23:00' }],
  tue: [{ start: '18:00', end: '23:00' }],
  wed: [{ start: '18:00', end: '23:00' }],
  thu: [{ start: '18:00', end: '23:00' }],
  fri: [{ start: '18:00', end: '00:30' }],
  sat: [{ start: '18:00', end: '00:30' }],
  sun: [{ start: '18:00', end: '23:00' }],
};

export default function AdminSettings() {
  const { data: settings, isLoading } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({});
      setHasChanges(false);
    }
  }, [settings]);

  const currentData = { ...settings, ...formData };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      setFormData({});
      setHasChanges(false);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            Configurações da Loja
          </h1>
          <p className="text-muted-foreground">
            Horários, entrega, pagamentos e operação
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || updateSettings.isPending}
          className="gap-2"
        >
          {updateSettings.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Configurações
        </Button>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid grid-cols-9 w-full">
          <TabsTrigger value="store" className="gap-1.5">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Loja</span>
          </TabsTrigger>
          <TabsTrigger value="home" className="gap-1.5">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-1.5">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="gap-1.5">
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Entrega</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Pagamentos</span>
          </TabsTrigger>
          <TabsTrigger value="sla" className="gap-1.5">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">SLA</span>
          </TabsTrigger>
          <TabsTrigger value="print" className="gap-1.5">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Impressão</span>
          </TabsTrigger>
          <TabsTrigger value="sound" className="gap-1.5">
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">Som</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Avaliações</span>
          </TabsTrigger>
        </TabsList>

        {/* Store Info Tab */}
        <TabsContent value="store" className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 space-y-6">
            <h3 className="font-semibold text-lg">Informações da Loja</h3>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="store_name">Nome da Loja</Label>
                <Input
                  id="store_name"
                  value={currentData.store_name || ''}
                  onChange={(e) => handleChange('store_name', e.target.value)}
                  placeholder="Minha Pizzaria"
                />
                <p className="text-xs text-muted-foreground">
                  Nome comercial exibido para clientes
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="store_phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </Label>
                <Input
                  id="store_phone"
                  value={currentData.store_phone || ''}
                  onChange={(e) => handleChange('store_phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="store_address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </Label>
                <Textarea
                  id="store_address"
                  value={currentData.store_address || ''}
                  onChange={(e) => handleChange('store_address', e.target.value)}
                  placeholder="Rua das Pizzas, 123 - Centro"
                  rows={2}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="store_lat">Latitude</Label>
                  <Input
                    id="store_lat"
                    type="number"
                    step="any"
                    value={currentData.store_lat || ''}
                    onChange={(e) => handleChange('store_lat', parseFloat(e.target.value) || null)}
                    placeholder="-23.5505"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="store_lng">Longitude</Label>
                  <Input
                    id="store_lng"
                    type="number"
                    step="any"
                    value={currentData.store_lng || ''}
                    onChange={(e) => handleChange('store_lng', parseFloat(e.target.value) || null)}
                    placeholder="-46.6333"
                  />
                </div>
              </div>

              {/* Map Picker */}
              <div className="pt-2">
                <Label className="mb-3 block">Localização no Mapa</Label>
                <LocationPickerMap
                  lat={currentData.store_lat}
                  lng={currentData.store_lng}
                  address={currentData.store_address}
                  onLocationChange={(lat, lng) => {
                    handleChange('store_lat', lat);
                    handleChange('store_lng', lng);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h3 className="font-semibold text-lg">Timezone</h3>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Input
                id="timezone"
                value={currentData.timezone || 'America/Sao_Paulo'}
                onChange={(e) => handleChange('timezone', e.target.value)}
                placeholder="America/Sao_Paulo"
              />
              <p className="text-xs text-muted-foreground">
                Usado para cálculo de horário de funcionamento
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Home Sections Tab */}
        <TabsContent value="home" className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Seções da Home
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ative, desative e reordene as seções que aparecem na tela inicial do app para seus clientes.
              </p>
            </div>
            <HomeSectionsEditor />
          </div>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="space-y-6">
          {/* Status Preview */}
          <StoreStatusPreview
            isAutoEnabled={currentData.auto_open_close_enabled ?? true}
            isOpenOverride={currentData.is_open_override ?? null}
          />

          {/* Auto Open/Close Toggle */}
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-semibold text-lg flex items-center gap-2">
                  <ToggleLeft className="w-5 h-5" />
                  Abertura/Fechamento Automático
                </Label>
                <p className="text-sm text-muted-foreground">
                  A loja abre e fecha automaticamente conforme os horários configurados
                </p>
              </div>
              <Switch
                checked={currentData.auto_open_close_enabled ?? true}
                onCheckedChange={(checked) => handleChange('auto_open_close_enabled', checked)}
              />
            </div>
          </div>

          {/* Opening Hours Editor */}
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horário de Funcionamento
            </h3>
            <OpeningHoursEditor
              value={currentData.opening_hours || DEFAULT_OPENING_HOURS}
              onChange={(hours) => handleChange('opening_hours', hours)}
            />
          </div>

          {/* Closed Message */}
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h3 className="font-semibold text-lg">Mensagem quando Fechado</h3>
            <Textarea
              value={currentData.closed_message || ''}
              onChange={(e) => handleChange('closed_message', e.target.value)}
              placeholder="Estamos fechados no momento. Volte em breve!"
              rows={2}
            />
          </div>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 space-y-6">
            <h3 className="font-semibold text-lg">Tipos de Entrega</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="space-y-1">
                  <Label className="font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Entrega (Delivery)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que clientes recebam pedidos em casa
                  </p>
                </div>
                <Switch
                  checked={currentData.delivery_enabled ?? true}
                  onCheckedChange={(checked) => handleChange('delivery_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="space-y-1">
                  <Label className="font-medium flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Retirada no Balcão (Pickup)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que clientes retirem pedidos na loja
                  </p>
                </div>
                <Switch
                  checked={currentData.pickup_enabled ?? true}
                  onCheckedChange={(checked) => handleChange('pickup_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="space-y-1">
                  <Label className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Agendamento de Pedidos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que clientes agendem pedidos para data/hora futura
                  </p>
                </div>
                <Switch
                  checked={currentData.scheduled_delivery_enabled ?? false}
                  onCheckedChange={(checked) => handleChange('scheduled_delivery_enabled', checked)}
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h3 className="font-semibold text-lg">Pedido Mínimo</h3>
            <div className="grid gap-2">
              <Label htmlFor="min_order_value">Valor Mínimo (R$)</Label>
              <Input
                id="min_order_value"
                type="number"
                step="0.01"
                min="0"
                value={currentData.min_order_value || 0}
                onChange={(e) => handleChange('min_order_value', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Valor mínimo para finalizar um pedido (0 = sem mínimo)
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              💡 Para configurar zonas de entrega e taxas, acesse o menu <strong>Zonas de Entrega</strong>.
            </p>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 space-y-6">
            <h3 className="font-semibold text-lg">Métodos de Pagamento</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="space-y-1">
                  <Label className="font-medium">PIX</Label>
                  <p className="text-sm text-muted-foreground">
                    Pagamento instantâneo via PIX
                  </p>
                </div>
                <Switch
                  checked={currentData.payment_pix_enabled ?? true}
                  onCheckedChange={(checked) => handleChange('payment_pix_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="space-y-1">
                  <Label className="font-medium">Cartão (Crédito/Débito)</Label>
                  <p className="text-sm text-muted-foreground">
                    Pagamento online com cartão
                  </p>
                </div>
                <Switch
                  checked={currentData.payment_card_enabled ?? true}
                  onCheckedChange={(checked) => handleChange('payment_card_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="space-y-1">
                  <Label className="font-medium">Dinheiro</Label>
                  <p className="text-sm text-muted-foreground">
                    Pagamento em dinheiro na entrega
                  </p>
                </div>
                <Switch
                  checked={currentData.payment_cash_enabled ?? true}
                  onCheckedChange={(checked) => handleChange('payment_cash_enabled', checked)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SLA Tab */}
        <TabsContent value="sla" className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 space-y-6">
            <h3 className="font-semibold text-lg">Metas de SLA (Tempo)</h3>
            <p className="text-sm text-muted-foreground">
              Defina os tempos-alvo para cada etapa do pedido. Usado para alertas e relatórios.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sla_accept">Aceitar Pedido (min)</Label>
                <Input
                  id="sla_accept"
                  type="number"
                  min="1"
                  value={currentData.sla_accept_minutes || 5}
                  onChange={(e) => handleChange('sla_accept_minutes', parseInt(e.target.value) || 5)}
                />
                <p className="text-xs text-muted-foreground">
                  Tempo para aceitar um novo pedido
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sla_prepare">Preparar (min)</Label>
                <Input
                  id="sla_prepare"
                  type="number"
                  min="1"
                  value={currentData.sla_prepare_minutes || 30}
                  onChange={(e) => handleChange('sla_prepare_minutes', parseInt(e.target.value) || 30)}
                />
                <p className="text-xs text-muted-foreground">
                  Tempo de preparo até "pronto"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sla_delivery">Entregar (min)</Label>
                <Input
                  id="sla_delivery"
                  type="number"
                  min="1"
                  value={currentData.sla_delivery_minutes || 45}
                  onChange={(e) => handleChange('sla_delivery_minutes', parseInt(e.target.value) || 45)}
                />
                <p className="text-xs text-muted-foreground">
                  Tempo total até entrega
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Print Tab */}
        <TabsContent value="print" className="space-y-6">
          <PrintSettingsSection />
        </TabsContent>

        {/* Sound Tab */}
        <TabsContent value="sound" className="space-y-6">
          <AdminSoundSettings />
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <ReviewSettingsSection />
        </TabsContent>
      </Tabs>

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending}
            size="lg"
            className="gap-2 shadow-lg"
          >
            {updateSettings.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Salvar Alterações
          </Button>
        </div>
      )}
    </div>
  );
}
