import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Check, Navigation, Loader2, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAddresses } from '@/hooks/useAddresses';
import { useCheckoutStore } from '@/hooks/useCheckoutStore';
import { useCart } from '@/hooks/useCart';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LocationFormData {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
}

export default function CheckoutAddress() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { user } = useAuth();
  const { data: addresses, isLoading, refetch } = useAddresses();
  const { addressId, setAddress } = useCheckoutStore();
  const { getCurrentLocation, isLoading: isLocating, error: geoError, clearError } = useGeolocation();
  
  const [selectedId, setSelectedId] = useState(addressId);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationApplied, setLocationApplied] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const numberInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<LocationFormData>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip: '',
    lat: null,
    lng: null,
  });

  // Redirect if cart is empty
  if (items.length === 0) {
    navigate('/app/cart');
    return null;
  }

  const handleUseLocation = async () => {
    clearError();
    setLocationApplied(false);
    
    const result = await getCurrentLocation();
    
    if (result) {
      setFormData({
        street: result.street || '',
        number: result.number || '',
        complement: '',
        neighborhood: result.neighborhood || '',
        city: result.city || '',
        state: result.state || '',
        zip: result.cep ? formatCep(result.cep) : '',
        lat: result.lat,
        lng: result.lng,
      });
      
      setShowLocationForm(true);
      setSelectedId(null); // Deselect any saved address
      setLocationApplied(true);
      
      // Focus on number field after a short delay
      setTimeout(() => {
        numberInputRef.current?.focus();
      }, 100);
      
      if (!result.number) {
        toast.info('Ajuste o número do endereço se necessário', {
          duration: 4000,
        });
      }
    }
  };

  const formatCep = (cep: string): string => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length >= 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
    }
    return digits;
  };

  const handleFormChange = (field: keyof LocationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAndContinue = async () => {
    // Validate required fields
    if (!formData.street || !formData.number || !formData.neighborhood || !formData.city || !formData.state) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);

    try {
      // Save address to database
      const { data: newAddress, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user?.id,
          label: 'Localização atual',
          street: formData.street,
          number: formData.number,
          complement: formData.complement || null,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zip: formData.zip.replace(/\D/g, '') || '00000000',
          lat: formData.lat,
          lng: formData.lng,
          is_default: saveAsDefault,
        })
        .select()
        .single();

      if (error) throw error;

      // If saving as default, update other addresses
      if (saveAsDefault && newAddress) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .neq('id', newAddress.id)
          .eq('user_id', user?.id);
      }

      // Set checkout address
      setAddress(newAddress.id, {
        id: newAddress.id,
        label: newAddress.label,
        street: newAddress.street,
        number: newAddress.number,
        complement: newAddress.complement,
        neighborhood: newAddress.neighborhood,
        city: newAddress.city,
        state: newAddress.state,
        zip: newAddress.zip,
        lat: newAddress.lat,
        lng: newAddress.lng,
      });

      toast.success('Endereço salvo com sucesso!');
      refetch();
      navigate('/app/checkout/delivery');

    } catch (error) {
      console.error('[CheckoutAddress] Error saving address:', error);
      toast.error('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (showLocationForm) {
      handleSaveAndContinue();
      return;
    }

    const selected = addresses?.find((a) => a.id === selectedId);
    
    if (!selected) {
      toast.error('Selecione um endereço de entrega');
      return;
    }

    setAddress(selected.id, {
      id: selected.id,
      label: selected.label,
      street: selected.street,
      number: selected.number,
      complement: selected.complement,
      neighborhood: selected.neighborhood,
      city: selected.city,
      state: selected.state,
      zip: selected.zip,
      lat: selected.lat || null,
      lng: selected.lng || null,
    });

    navigate('/app/checkout/delivery');
  };

  const handleBackToList = () => {
    setShowLocationForm(false);
    setLocationApplied(false);
    setFormData({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip: '',
      lat: null,
      lng: null,
    });
  };

  return (
    <CheckoutLayout
      currentStep="address"
      title="Endereço de Entrega"
      nextLabel={showLocationForm ? (isSaving ? 'Salvando...' : 'Salvar e Continuar') : 'Continuar'}
      onNext={handleNext}
      nextDisabled={showLocationForm ? isSaving : !selectedId}
      backTo={showLocationForm ? undefined : '/app/cart'}
    >
      {/* Back to list button when in form mode */}
      {showLocationForm && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={handleBackToList}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar para lista
        </Button>
      )}

      {/* Geolocation Error Alert */}
      {geoError && (
        <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{geoError.message}</p>
            {geoError.code === 'PERMISSION_DENIED' && (
              <p className="text-xs text-muted-foreground mt-1">
                Verifique as permissões do site nas configurações do navegador.
              </p>
            )}
          </div>
          <button 
            onClick={clearError}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
      )}

      {showLocationForm ? (
        /* Location Form */
        <div className="space-y-4">
          {/* Success Badge */}
          {locationApplied && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/20 border border-accent/30">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Localização aplicada</p>
                <p className="text-xs text-muted-foreground">Ajuste o número se necessário</p>
              </div>
            </div>
          )}

          {/* Coordinates Badge */}
          {formData.lat && formData.lng && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
              </span>
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleFormChange('street', e.target.value)}
                placeholder="Nome da rua"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  ref={numberInputRef}
                  value={formData.number}
                  onChange={(e) => handleFormChange('number', e.target.value)}
                  placeholder="123"
                  className="mt-1.5"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => handleFormChange('complement', e.target.value)}
                  placeholder="Apto, bloco, etc."
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleFormChange('neighborhood', e.target.value)}
                placeholder="Nome do bairro"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  placeholder="Cidade"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="state">UF *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleFormChange('state', e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="RS"
                  maxLength={2}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="zip">CEP</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleFormChange('zip', formatCep(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Save as default checkbox */}
          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="saveDefault"
              checked={saveAsDefault}
              onCheckedChange={(checked) => setSaveAsDefault(!!checked)}
            />
            <Label htmlFor="saveDefault" className="text-sm font-normal cursor-pointer">
              Salvar como endereço padrão
            </Label>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : addresses && addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => {
            const isSelected = selectedId === address.id;

            return (
              <button
                key={address.id}
                onClick={() => setSelectedId(address.id)}
                className={cn(
                  'w-full p-4 rounded-2xl border-2 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/40 bg-card'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <MapPin className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{address.label || 'Endereço'}</span>
                      {address.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {address.street}, {address.number}
                      {address.complement && ` - ${address.complement}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.neighborhood}, {address.city} - {address.state}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CEP: {address.zip}
                    </p>
                  </div>

                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                    isSelected ? 'border-primary bg-primary' : 'border-border'
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </div>
              </button>
            );
          })}

          <Button
            variant="outline"
            className="w-full rounded-xl h-14 gap-2"
            onClick={() => navigate('/app/profile/addresses/new')}
          >
            <Plus className="w-5 h-5" />
            Adicionar novo endereço
          </Button>

          <Button
            variant="ghost"
            className="w-full rounded-xl h-12 gap-2 text-primary"
            onClick={handleUseLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Localizando...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                Usar minha localização atual
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Nenhum endereço cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Adicione um endereço para continuar com a entrega
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/app/profile/addresses/new')}
              className="btn-primary gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar endereço
            </Button>
            
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 gap-2"
              onClick={handleUseLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Localizando...
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  Usar minha localização atual
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </CheckoutLayout>
  );
}
