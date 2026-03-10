import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAddresses, useCreateAddress, useUpdateAddress } from '@/hooks/useAddresses';
import { useCepLookup } from '@/hooks/useCepLookup';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// Same validation schema as Signup
const addressSchema = z.object({
  label: z.string().trim().min(1, 'Apelido é obrigatório').max(50),
  street: z.string().trim().min(3, 'Rua é obrigatória').max(200),
  number: z.string().trim().min(1, 'Número é obrigatório').max(20),
  complement: z.string().trim().max(100).optional(),
  neighborhood: z.string().trim().min(2, 'Bairro é obrigatório').max(100),
  city: z.string().trim().min(2, 'Cidade é obrigatória').max(100),
  state: z.string().trim().length(2, 'Estado deve ter 2 caracteres'),
  zip: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP inválido (formato: 00000-000)'),
});

export default function AddressForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== 'new';

  const { data: addresses, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const { lookupCep, isLoading: isLoadingCep, error: cepError } = useCepLookup();

  const existingAddress = addresses?.find((a) => a.id === id);

  // Form state
  const [label, setLabel] = useState('Casa');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Auto-fill tracking
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [userEditedCityState, setUserEditedCityState] = useState(false);

  // Load existing address data
  useEffect(() => {
    if (existingAddress) {
      setLabel(existingAddress.label || 'Casa');
      setStreet(existingAddress.street);
      setNumber(existingAddress.number);
      setComplement(existingAddress.complement || '');
      setNeighborhood(existingAddress.neighborhood);
      setCity(existingAddress.city);
      setState(existingAddress.state);
      setZip(existingAddress.zip);
      setIsDefault(existingAddress.is_default || false);
      // Mark as user-edited since it's existing data
      setUserEditedCityState(true);
    }
  }, [existingAddress]);

  const formatZip = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  // Handle CEP change and auto-lookup
  const handleCepChange = useCallback(async (value: string) => {
    const formatted = formatZip(value);
    setZip(formatted);
    
    // Clear auto-filled status when CEP changes
    setAutoFilledFields(new Set());
    
    // Only lookup when we have 8 digits
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 8) {
      const result = await lookupCep(digits);
      
      if (result) {
        const newAutoFilled = new Set<string>();
        
        // Auto-fill city/state if not manually edited or empty
        if (!userEditedCityState || !city) {
          setCity(result.city);
          newAutoFilled.add('city');
        }
        if (!userEditedCityState || !state) {
          setState(result.state);
          newAutoFilled.add('state');
        }
        
        // Auto-fill neighborhood if empty
        if (result.neighborhood && !neighborhood) {
          setNeighborhood(result.neighborhood);
          newAutoFilled.add('neighborhood');
        }
        
        // Auto-fill street if empty
        if (result.street && !street) {
          setStreet(result.street);
          newAutoFilled.add('street');
        }
        
        setAutoFilledFields(newAutoFilled);
        
        // Reset user edit flag after successful auto-fill
        if (newAutoFilled.has('city') || newAutoFilled.has('state')) {
          setUserEditedCityState(false);
        }
      }
    }
  }, [lookupCep, userEditedCityState, city, state, neighborhood, street]);

  // Track manual edits to city/state
  const handleCityChange = (value: string) => {
    setCity(value);
    setUserEditedCityState(true);
    setAutoFilledFields(prev => {
      const next = new Set(prev);
      next.delete('city');
      return next;
    });
  };

  const handleStateChange = (value: string) => {
    setState(value.toUpperCase().slice(0, 2));
    setUserEditedCityState(true);
    setAutoFilledFields(prev => {
      const next = new Set(prev);
      next.delete('state');
      return next;
    });
  };

  const handleNeighborhoodChange = (value: string) => {
    setNeighborhood(value);
    setAutoFilledFields(prev => {
      const next = new Set(prev);
      next.delete('neighborhood');
      return next;
    });
  };

  const handleStreetChange = (value: string) => {
    setStreet(value);
    setAutoFilledFields(prev => {
      const next = new Set(prev);
      next.delete('street');
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      label: label.trim(),
      street: street.trim(),
      number: number.trim(),
      complement: complement.trim() || undefined,
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: state.toUpperCase().trim(),
      zip: zip,
    };

    // Validate
    const result = addressSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    setErrors({});

    const addressData = {
      label: formData.label,
      street: formData.street,
      number: formData.number,
      complement: formData.complement || null,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      zip: formData.zip.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
      is_default: isDefault,
      lat: null,
      lng: null,
    };

    try {
      if (isEditing && id) {
        await updateAddress.mutateAsync({ id, ...addressData });
        toast.success('Endereço atualizado!');
      } else {
        await createAddress.mutateAsync(addressData);
        toast.success('Endereço cadastrado!');
      }
      navigate('/app/profile/addresses');
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Erro ao salvar endereço');
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Helper to show auto-fill badge
  const AutoFillBadge = ({ field }: { field: string }) => {
    if (!autoFilledFields.has(field)) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium animate-fade-in">
        <CheckCircle2 className="w-3 h-3" />
        Preenchido automaticamente
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title={isEditing ? 'Editar Endereço' : 'Novo Endereço'} />

      <form onSubmit={handleSubmit} className="px-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Apelido</Label>
          <Input
            id="label"
            type="text"
            placeholder="Ex: Casa, Trabalho..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input-modern"
            required
          />
          {errors.label && <p className="text-sm text-destructive">{errors.label}</p>}
        </div>

        {/* CEP with loading indicator */}
        <div className="space-y-2">
          <Label htmlFor="zip">CEP</Label>
          <div className="relative">
            <Input
              id="zip"
              type="text"
              placeholder="00000-000"
              value={zip}
              onChange={(e) => handleCepChange(e.target.value)}
              className={cn(
                "input-modern pr-10",
                isLoadingCep && "pr-24"
              )}
              maxLength={9}
              required
            />
            {/* Loading/Status indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isLoadingCep && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-fade-in">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Buscando...</span>
                </span>
              )}
              {cepError && !isLoadingCep && (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
            </div>
          </div>
          {errors.zip && <p className="text-sm text-destructive">{errors.zip}</p>}
          {cepError && !isLoadingCep && (
            <p className="text-sm text-destructive/80 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              CEP não encontrado. Preencha cidade e estado manualmente.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="street">Rua</Label>
            <AutoFillBadge field="street" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="street"
              type="text"
              placeholder="Nome da rua"
              value={street}
              onChange={(e) => handleStreetChange(e.target.value)}
              className={cn(
                "pl-10 input-modern",
                autoFilledFields.has('street') && "animate-fade-in ring-1 ring-primary/30"
              )}
              required
            />
          </div>
          {errors.street && <p className="text-sm text-destructive">{errors.street}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              type="text"
              placeholder="123"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="input-modern"
              required
            />
            {errors.number && <p className="text-sm text-destructive">{errors.number}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              type="text"
              placeholder="Apto 101"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              className="input-modern"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="neighborhood">Bairro</Label>
            <AutoFillBadge field="neighborhood" />
          </div>
          <Input
            id="neighborhood"
            type="text"
            placeholder="Nome do bairro"
            value={neighborhood}
            onChange={(e) => handleNeighborhoodChange(e.target.value)}
            className={cn(
              "input-modern",
              autoFilledFields.has('neighborhood') && "animate-fade-in ring-1 ring-primary/30"
            )}
            required
          />
          {errors.neighborhood && <p className="text-sm text-destructive">{errors.neighborhood}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="city">Cidade</Label>
              <AutoFillBadge field="city" />
            </div>
            <Input
              id="city"
              type="text"
              placeholder="Sua cidade"
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              className={cn(
                "input-modern",
                autoFilledFields.has('city') && "animate-fade-in ring-1 ring-primary/30"
              )}
              required
            />
            {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="state">UF</Label>
              <AutoFillBadge field="state" />
            </div>
            <Input
              id="state"
              type="text"
              placeholder="SP"
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              className={cn(
                "input-modern uppercase",
                autoFilledFields.has('state') && "animate-fade-in ring-1 ring-primary/30"
              )}
              maxLength={2}
              required
            />
            {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border">
          <div>
            <p className="font-medium">Endereço padrão</p>
            <p className="text-sm text-muted-foreground">
              Usar como endereço principal
            </p>
          </div>
          <Switch
            checked={isDefault}
            onCheckedChange={setIsDefault}
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
          <Button
            type="submit"
            disabled={createAddress.isPending || updateAddress.isPending}
            className="w-full btn-primary h-12"
          >
            {(createAddress.isPending || updateAddress.isPending)
              ? 'Salvando...'
              : 'Salvar Endereço'}
          </Button>
        </div>
      </form>
    </div>
  );
}
