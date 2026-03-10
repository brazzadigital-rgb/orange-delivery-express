import { useState, useRef, useEffect } from 'react';
import { Globe, Save, Upload, Image, Smartphone, MessageCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { usePlatformSettings, useUpdatePlatformSettings } from '@/hooks/usePlatformSettings';
import { supabase } from '@/integrations/supabase/client';

export default function OwnerPlatformSettings() {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const ogInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings && Object.keys(formData).length === 0) {
      setFormData({
        platform_name: settings.platform_name || '',
        platform_short_name: settings.platform_short_name || '',
        platform_description: settings.platform_description || '',
        platform_favicon_url: settings.platform_favicon_url || '',
        platform_logo_url: settings.platform_logo_url || '',
        platform_og_image_url: settings.platform_og_image_url || '',
        theme_color: settings.theme_color || '#FF8A00',
        support_email: settings.support_email || '',
        support_whatsapp: settings.support_whatsapp || '',
        terms_url: settings.terms_url || '',
        privacy_url: settings.privacy_url || '',
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, field: string) => {
    try {
      const ext = file.name.split('.').pop();
      const path = `platform/${field}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('app-icons')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('app-icons')
        .getPublicUrl(path);

      handleChange(field, urlData.publicUrl);
      toast.success('Upload realizado!');
    } catch (err) {
      console.error(err);
      toast.error('Erro no upload');
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast.success('Configurações da plataforma salvas!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar');
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
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            Configurações da Plataforma
          </h1>
          <p className="text-muted-foreground">
            Defina o nome, favicon, imagem OG e demais dados do portal principal
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="gap-2">
          {updateSettings.isPending ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
          Salvar
        </Button>
      </div>

      {/* Identity */}
      <div className="bg-card rounded-2xl border p-6 space-y-5">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          Identidade da Plataforma
        </h3>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nome da Plataforma</Label>
            <Input
              value={formData.platform_name || ''}
              onChange={(e) => handleChange('platform_name', e.target.value)}
              placeholder="Delivery Litoral"
            />
            <p className="text-xs text-muted-foreground">
              Exibido no título da página, OG tags e portal
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Nome Curto</Label>
            <Input
              value={formData.platform_short_name || ''}
              onChange={(e) => handleChange('platform_short_name', e.target.value)}
              placeholder="Delivery"
              maxLength={12}
            />
          </div>

          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.platform_description || ''}
              onChange={(e) => handleChange('platform_description', e.target.value)}
              placeholder="A melhor plataforma de delivery da região"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Usada nas meta tags (SEO) e OG description
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Cor Tema</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.theme_color || '#FF8A00'}
                onChange={(e) => handleChange('theme_color', e.target.value)}
                className="w-10 h-10 rounded-lg border cursor-pointer"
              />
              <Input
                value={formData.theme_color || ''}
                onChange={(e) => handleChange('theme_color', e.target.value)}
                placeholder="#FF8A00"
                className="max-w-[160px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-card rounded-2xl border p-6 space-y-5">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          Imagens
        </h3>

        <div className="grid sm:grid-cols-3 gap-6">
          {/* Favicon */}
          <div className="space-y-3">
            <Label>Favicon</Label>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed bg-muted/30">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden bg-muted">
                {formData.platform_favicon_url ? (
                  <img src={formData.platform_favicon_url} alt="Favicon" className="w-full h-full object-cover" />
                ) : (
                  <Globe className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload
              </Button>
              <input ref={faviconInputRef} type="file" accept="image/png,image/ico,image/svg+xml" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'platform_favicon_url'); }} />
            </div>
            <p className="text-xs text-muted-foreground text-center">PNG/ICO, 32x32 ou 64x64</p>
          </div>

          {/* Logo */}
          <div className="space-y-3">
            <Label>Logo</Label>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed bg-muted/30">
              <div className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden bg-muted">
                {formData.platform_logo_url ? (
                  <img src={formData.platform_logo_url} alt="Logo" className="h-full object-contain" />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload
              </Button>
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'platform_logo_url'); }} />
            </div>
            <p className="text-xs text-muted-foreground text-center">PNG/JPG, 280x60px</p>
          </div>

          {/* OG Image */}
          <div className="space-y-3">
            <Label>Imagem OG (Social)</Label>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed bg-muted/30">
              <div className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden bg-muted">
                {formData.platform_og_image_url ? (
                  <img src={formData.platform_og_image_url} alt="OG" className="h-full object-cover" />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => ogInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload
              </Button>
              <input ref={ogInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'platform_og_image_url'); }} />
            </div>
            <p className="text-xs text-muted-foreground text-center">1200x630px recomendado</p>
          </div>
        </div>

        {/* URL fields for images */}
        <div className="grid gap-4 mt-4">
          <div className="grid gap-2">
            <Label>URL do Favicon (ou use o upload acima)</Label>
            <Input
              value={formData.platform_favicon_url || ''}
              onChange={(e) => handleChange('platform_favicon_url', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2">
            <Label>URL do Logo</Label>
            <Input
              value={formData.platform_logo_url || ''}
              onChange={(e) => handleChange('platform_logo_url', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2">
            <Label>URL da Imagem OG</Label>
            <Input
              value={formData.platform_og_image_url || ''}
              onChange={(e) => handleChange('platform_og_image_url', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Support & Legal */}
      <div className="bg-card rounded-2xl border p-6 space-y-5">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Suporte & Legal
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>E-mail de Suporte</Label>
            <Input
              value={formData.support_email || ''}
              onChange={(e) => handleChange('support_email', e.target.value)}
              placeholder="suporte@seudominio.com.br"
            />
          </div>
          <div className="grid gap-2">
            <Label>WhatsApp de Suporte</Label>
            <Input
              value={formData.support_whatsapp || ''}
              onChange={(e) => handleChange('support_whatsapp', e.target.value)}
              placeholder="5511999999999"
            />
          </div>
          <div className="grid gap-2">
            <Label>URL dos Termos de Uso</Label>
            <Input
              value={formData.terms_url || ''}
              onChange={(e) => handleChange('terms_url', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2">
            <Label>URL da Política de Privacidade</Label>
            <Input
              value={formData.privacy_url || ''}
              onChange={(e) => handleChange('privacy_url', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
