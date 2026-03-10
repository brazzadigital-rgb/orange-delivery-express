import { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Pencil, 
  Trash2, 
  Circle, 
  Hexagon,
  Clock,
  DollarSign,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useDeliveryZones, 
  useCreateDeliveryZone, 
  useUpdateDeliveryZone, 
  useDeleteDeliveryZone,
  calculateDistance,
  findDeliveryZone,
  type DeliveryZone 
} from '@/hooks/useDeliveryZones';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ZoneFormData = Partial<DeliveryZone>;

const DEFAULT_ZONE: ZoneFormData = {
  name: '',
  mode: 'radius',
  max_distance: 5,
  min_distance: 0,
  fee: 5,
  per_km_fee: 0,
  estimated_minutes: 30,
  min_order_value: 0,
  active: true,
  sort_order: 0,
};

export default function DeliveryZones() {
  const { data: zones, isLoading } = useDeliveryZones();
  const { data: storeSettings } = useStoreSettings();
  const createZone = useCreateDeliveryZone();
  const updateZone = useUpdateDeliveryZone();
  const deleteZone = useDeleteDeliveryZone();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [formData, setFormData] = useState<ZoneFormData>(DEFAULT_ZONE);
  
  // Simulator
  const [simulatorAddress, setSimulatorAddress] = useState('');
  const [simulatorResult, setSimulatorResult] = useState<{
    zone: DeliveryZone | null;
    distance: number;
    fee: number;
    eta: number;
  } | null>(null);

  const handleOpenDialog = (zone?: DeliveryZone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData(zone);
    } else {
      setEditingZone(null);
      setFormData({ ...DEFAULT_ZONE, sort_order: (zones?.length || 0) + 1 });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingZone(null);
    setFormData(DEFAULT_ZONE);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Nome da zona é obrigatório');
      return;
    }

    try {
      if (editingZone) {
        await updateZone.mutateAsync({ id: editingZone.id, ...formData });
      } else {
        await createZone.mutateAsync(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving zone:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta zona?')) {
      await deleteZone.mutateAsync(id);
    }
  };

  const handleSimulate = () => {
    // For demo purposes, we'll use mock coordinates
    // In production, you'd use Google Maps Geocoding API
    if (!simulatorAddress.trim()) {
      toast.error('Digite um endereço para simular');
      return;
    }

    if (!storeSettings?.store_lat || !storeSettings?.store_lng) {
      toast.error('Configure as coordenadas da loja primeiro');
      return;
    }

    if (!zones || zones.length === 0) {
      toast.error('Nenhuma zona configurada');
      return;
    }

    // Mock: Generate random coordinates within 15km of store
    const mockLat = storeSettings.store_lat + (Math.random() - 0.5) * 0.2;
    const mockLng = storeSettings.store_lng + (Math.random() - 0.5) * 0.2;
    
    const result = findDeliveryZone(
      mockLat, 
      mockLng, 
      zones, 
      storeSettings.store_lat, 
      storeSettings.store_lng
    );

    if (result) {
      setSimulatorResult(result);
      toast.success(`Endereço dentro da zona: ${result.zone.name}`);
    } else {
      const distance = calculateDistance(
        storeSettings.store_lat, 
        storeSettings.store_lng, 
        mockLat, 
        mockLng
      );
      setSimulatorResult({ zone: null, distance, fee: 0, eta: 0 });
      toast.error('Endereço fora da área de entrega');
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            Zonas de Entrega
          </h1>
          <p className="text-muted-foreground">
            Configure áreas de entrega, taxas e tempo estimado
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Zona
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Zones List */}
        <div className="lg:col-span-2 space-y-4">
          {zones?.length === 0 ? (
            <div className="bg-card rounded-2xl border p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhuma zona configurada</h3>
              <p className="text-muted-foreground mb-4">
                Crie zonas de entrega para definir taxas por região
              </p>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeira Zona
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {zones?.map((zone) => (
                <div 
                  key={zone.id} 
                  className={cn(
                    'bg-card rounded-xl border p-4 transition-all',
                    !zone.active && 'opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        zone.mode === 'polygon' 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-accent text-accent-foreground'
                      )}>
                        {zone.mode === 'polygon' ? (
                          <Hexagon className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {zone.name}
                          {!zone.active && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">Inativa</span>
                          )}
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {zone.mode === 'radius' 
                              ? `${zone.min_distance || 0}km - ${zone.max_distance}km`
                              : 'Polígono personalizado'
                            }
                          </p>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              R$ {zone.fee.toFixed(2)}
                              {zone.per_km_fee > 0 && ` + R$ ${zone.per_km_fee}/km`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ~{zone.estimated_minutes}min
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(zone)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(zone.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simulator */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Search className="w-5 h-5" />
              Simulador de Entrega
            </h3>
            <p className="text-sm text-muted-foreground">
              Teste se um endereço está dentro da área de entrega
            </p>
            
            <div className="space-y-3">
              <Input
                placeholder="Digite um endereço ou CEP..."
                value={simulatorAddress}
                onChange={(e) => setSimulatorAddress(e.target.value)}
              />
              <Button 
                onClick={handleSimulate} 
                className="w-full gap-2"
                variant="outline"
              >
                <Search className="w-4 h-4" />
                Simular
              </Button>
            </div>

            {simulatorResult && (
              <div className={cn(
                'p-4 rounded-lg',
                simulatorResult.zone 
                  ? 'bg-success/10 border border-success/20' 
                  : 'bg-destructive/10 border border-destructive/20'
              )}>
                {simulatorResult.zone ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-success">✓ Dentro da área</p>
                    <div className="text-sm space-y-1">
                      <p>Zona: <strong>{simulatorResult.zone.name}</strong></p>
                      <p>Distância: <strong>{simulatorResult.distance.toFixed(1)}km</strong></p>
                      <p>Taxa: <strong>R$ {simulatorResult.fee.toFixed(2)}</strong></p>
                      <p>ETA: <strong>~{simulatorResult.eta}min</strong></p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold text-destructive">✗ Fora da área</p>
                    <p className="text-sm">
                      Distância: {simulatorResult.distance.toFixed(1)}km
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sugerir retirada no balcão
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Store Coordinates Info */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium">Coordenadas da Loja</p>
            {storeSettings?.store_lat && storeSettings?.store_lng ? (
              <p className="text-xs text-muted-foreground">
                {storeSettings.store_lat}, {storeSettings.store_lng}
              </p>
            ) : (
              <p className="text-xs text-destructive">
                ⚠️ Configure as coordenadas em Configurações &gt; Loja
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Zone Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Editar Zona' : 'Nova Zona de Entrega'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Nome da Zona</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Centro, Até 5km..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={formData.mode || 'radius'}
                onValueChange={(v) => setFormData({ ...formData, mode: v as 'radius' | 'polygon' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="radius">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4" />
                      Raio (km)
                    </div>
                  </SelectItem>
                  <SelectItem value="polygon">
                    <div className="flex items-center gap-2">
                      <Hexagon className="w-4 h-4" />
                      Polígono
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.mode === 'radius' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Distância Mínima (km)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.min_distance || 0}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      min_distance: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Distância Máxima (km)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.max_distance || 5}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      max_distance: parseFloat(e.target.value) || 5 
                    })}
                  />
                </div>
              </div>
            )}

            {formData.mode === 'polygon' && (
              <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">
                <Hexagon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Editor de polígono em breve.
                <br />
                Use a API para definir polygon_geojson.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Taxa Base (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.fee || 0}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    fee: parseFloat(e.target.value) || 0 
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Taxa por km (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.per_km_fee || 0}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    per_km_fee: parseFloat(e.target.value) || 0 
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tempo Estimado (min)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.estimated_minutes || 30}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    estimated_minutes: parseInt(e.target.value) || 30 
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Pedido Mínimo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.min_order_value || 0}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    min_order_value: parseFloat(e.target.value) || 0 
                  })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>Zona Ativa</Label>
              <Switch
                checked={formData.active ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createZone.isPending || updateZone.isPending}
            >
              {(createZone.isPending || updateZone.isPending) && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              {editingZone ? 'Salvar' : 'Criar Zona'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
