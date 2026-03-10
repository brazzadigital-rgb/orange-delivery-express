import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Tag, Image, Calendar, Users, Percent, DollarSign, Truck, Gift, Upload, X, Loader2, Sparkles } from 'lucide-react';
import { usePromotion, useCreatePromotion, useUpdatePromotion } from '@/hooks/usePromotions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getDiscountTypes } from '@/components/admin/DiscountTypesManager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

const iconMap = {
  percent: Percent,
  dollar: DollarSign,
  truck: Truck,
  gift: Gift,
  sparkles: Sparkles,
};

const targetAudiences = [
  { value: 'all', label: 'Todos os clientes' },
  { value: 'customers', label: 'Clientes ativos' },
  { value: 'inactive_30d', label: 'Inativos há 30 dias' },
  { value: 'vip', label: 'Clientes VIP' },
];

export default function AdminPromotionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id && id !== 'new';
  
  const { data: existingPromo, isLoading } = usePromotion(isEditing ? id : '');
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [discountTypes, setDiscountTypes] = useState(getDiscountTypes());

  // Refresh discount types when component mounts or becomes visible
  useEffect(() => {
    const handleFocus = () => setDiscountTypes(getDiscountTypes());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    banner_url: '',
    discount_type: 'percent',
    discount_value: 0,
    starts_at: '',
    ends_at: '',
    target_audience: 'all' as 'all' | 'customers' | 'inactive_30d' | 'vip',
    active: false,
  });

  // Load existing data when editing - using proper useEffect
  useEffect(() => {
    if (existingPromo) {
      setFormData({
        title: existingPromo.title,
        description: existingPromo.description || '',
        banner_url: existingPromo.banner_url || '',
        discount_type: existingPromo.discount_type,
        discount_value: existingPromo.discount_value,
        starts_at: existingPromo.starts_at?.split('T')[0] || '',
        ends_at: existingPromo.ends_at?.split('T')[0] || '',
        target_audience: existingPromo.target_audience,
        active: existingPromo.active,
      });
    }
  }, [existingPromo]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('promotions')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('promotions')
        .getPublicUrl(filePath);

      setFormData({ ...formData, banner_url: publicUrl });
      toast.success('Banner enviado com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    // Just clear the URL - we don't delete from storage to avoid complexity
    setFormData({ ...formData, banner_url: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Informe o título da promoção');
      return;
    }

    try {
      if (isEditing) {
        await updatePromotion.mutateAsync({
          id,
          data: {
            ...formData,
            starts_at: formData.starts_at || undefined,
            ends_at: formData.ends_at || undefined,
          },
        });
      } else {
        await createPromotion.mutateAsync({
          ...formData,
          starts_at: formData.starts_at || undefined,
          ends_at: formData.ends_at || undefined,
        });
      }
      navigate('/admin/promotions');
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isEditing && isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/admin/promotions')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <div className="card-premium p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Tag className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Promoção' : 'Nova Promoção'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualize os dados da promoção' : 'Crie uma nova promoção para seus clientes'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: 40% OFF em todas as pizzas"
                className="input-modern mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a promoção..."
                className="input-modern mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Image className="w-4 h-4" />
                Banner da Promoção
              </Label>
              
              {formData.banner_url ? (
                <div className="relative group">
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-border bg-muted">
                    <img
                      src={formData.banner_url}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Trocar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="relative aspect-[16/9] rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 hover:bg-muted transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          Clique para fazer upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG ou WebP (máx. 5MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Desconto</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {discountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        {(() => {
                          const Icon = iconMap[type.icon] || Sparkles;
                          return <Icon className="w-4 h-4" />;
                        })()}
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="discount_value">
                Valor do Desconto {formData.discount_type === 'percent' ? '(%)' : formData.discount_type === 'free_delivery' ? '' : '(R$)'}
              </Label>
              <Input
                id="discount_value"
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                placeholder="0"
                className="input-modern mt-1"
                min={0}
                step={formData.discount_type === 'percent' ? 1 : 0.01}
                disabled={formData.discount_type === 'free_delivery'}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="starts_at" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Início
              </Label>
              <Input
                id="starts_at"
                type="date"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                className="input-modern mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ends_at" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Término
              </Label>
              <Input
                id="ends_at"
                type="date"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                className="input-modern mt-1"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Público Alvo
            </Label>
            <Select
              value={formData.target_audience}
              onValueChange={(value: 'all' | 'customers' | 'inactive_30d' | 'vip') => setFormData({ ...formData, target_audience: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targetAudiences.map((audience) => (
                  <SelectItem key={audience.value} value={audience.value}>
                    {audience.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/promotions')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-primary flex-1"
              disabled={createPromotion.isPending || updatePromotion.isPending}
            >
              {createPromotion.isPending || updatePromotion.isPending
                ? 'Salvando...'
                : isEditing
                ? 'Salvar Alterações'
                : 'Criar Promoção'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
