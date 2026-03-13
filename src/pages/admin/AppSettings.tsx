import { useState, useRef, useEffect } from 'react';
import { 
  Smartphone, 
  Upload, 
  Save, 
  Palette, 
  Bell, 
  Shield, 
  MessageCircle,
  Image,
  Eye,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSettings, useUpdateAppSettings, useUploadAppAsset } from '@/hooks/useAppSettings';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BrandColorsEditor } from '@/components/admin/settings/BrandColorsEditor';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId } from '@/contexts/TenantContext';

export default function AppSettings() {
  const storeId = useStoreId();
  const { data: settings, isLoading } = useAppSettings();
  const updateSettings = useUpdateAppSettings();
  const uploadAsset = useUploadAppAsset();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [customDomain, setCustomDomain] = useState('');
  const [customDomainLoaded, setCustomDomainLoaded] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);

  useEffect(() => {
    supabase
      .from('stores')
      .select('custom_domain, slug')
      .eq('id', storeId)
      .single()
      .then(({ data }) => {
        // If custom_domain is set, use it; otherwise auto-fill with slug.platform
        const PLATFORM_DOMAIN = 'deliverylitoral.com.br';
        const domain = data?.custom_domain || (data?.slug ? `${data.slug}.${PLATFORM_DOMAIN}` : '');
        setCustomDomain(domain);
        setCustomDomainLoaded(true);
      });
  }, [storeId]);

  const handleSaveDomain = async () => {
    setSavingDomain(true);
    try {
      const domain = customDomain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
      const { error } = await supabase
        .from('stores')
        .update({ custom_domain: domain || null })
        .eq('id', storeId);
      if (error) throw error;
      setCustomDomain(domain);
      toast.success('Domínio atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar domínio');
    } finally {
      setSavingDomain(false);
    }
  };

  const [previewIcon, setPreviewIcon] = useState<string | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const icon192InputRef = useRef<HTMLInputElement>(null);
  const icon512InputRef = useRef<HTMLInputElement>(null);
  const splashInputRef = useRef<HTMLInputElement>(null);

  // Merge settings with form data
  const currentData = { ...settings, ...formData };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (
    file: File, 
    bucket: 'app-logos' | 'app-icons' | 'app-splash',
    field: string
  ) => {
    try {
      const ext = file.name.split('.').pop();
      const path = `${field}-${Date.now()}.${ext}`;
      
      const url = await uploadAsset.mutateAsync({ file, bucket, path });
      handleChange(field, url);
      
      // Set preview
      if (field.includes('icon')) {
        setPreviewIcon(url);
      } else if (field.includes('logo')) {
        setPreviewLogo(url);
      }
      
      toast.success('Upload realizado com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      setFormData({});
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const hasChanges = Object.keys(formData).length > 0;

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
            <Smartphone className="w-8 h-8 text-primary" />
            Configurações do App
          </h1>
          <p className="text-muted-foreground">
            Personalize a aparência e comportamento do aplicativo
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="identity" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="identity" className="gap-1.5">
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Identidade</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-1.5">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Aparência</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-1.5">
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Funções</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Suporte</span>
              </TabsTrigger>
            </TabsList>

            {/* Identity Tab */}
            <TabsContent value="identity" className="space-y-6">
              <div className="bg-card rounded-2xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Informações do App</h3>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="app_name">Nome do App</Label>
                    <Input
                      id="app_name"
                      value={currentData.app_name || ''}
                      onChange={(e) => handleChange('app_name', e.target.value)}
                      placeholder="Pizza Express"
                    />
                    <p className="text-xs text-muted-foreground">
                      Nome completo exibido ao instalar o app
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="app_short_name">Nome Curto</Label>
                    <Input
                      id="app_short_name"
                      value={currentData.app_short_name || ''}
                      onChange={(e) => handleChange('app_short_name', e.target.value)}
                      placeholder="Pizza"
                      maxLength={12}
                    />
                    <p className="text-xs text-muted-foreground">
                      Exibido abaixo do ícone (máx. 12 caracteres)
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="app_description">Descrição</Label>
                    <Textarea
                      id="app_description"
                      value={currentData.app_description || ''}
                      onChange={(e) => handleChange('app_description', e.target.value)}
                      placeholder="O melhor delivery de pizza da cidade"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Custom Domain */}
              <div className="bg-card rounded-2xl border p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Domínio Personalizado
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure o domínio público da sua loja. Este domínio será usado nos QR Codes das mesas e links compartilhados.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="meudelivery.com.br"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveDomain}
                    disabled={savingDomain || !customDomainLoaded}
                    variant="outline"
                  >
                    {savingDomain ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ex: meudelivery.com.br (sem https:// ou barra final)
                </p>
              </div>

              <div className="bg-card rounded-2xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Logo do App</h3>
                
                <div className="grid gap-6">
                  {/* Logo horizontal */}
                  <div className="space-y-3">
                    <Label>Logo (Header)</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-52 h-14 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                        {previewLogo || currentData.app_logo_url ? (
                          <img 
                            src={previewLogo || currentData.app_logo_url} 
                            alt="Logo" 
                            className="h-full object-contain"
                          />
                        ) : (
                          <Image className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadAsset.isPending}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'app-logos', 'app_logo_url');
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PNG ou JPG, recomendado 280x60px
                    </p>
                  </div>
                </div>
              </div>

              {/* Icons Upload */}
              <div className="bg-card rounded-2xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Ícones do App</h3>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Icon 192 */}
                  <div className="space-y-3">
                    <Label>Ícone 192x192</Label>
                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed bg-muted/30">
                      <div 
                        className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{ background: currentData.theme_color || '#FF8A00' }}
                      >
                        {previewIcon || currentData.app_icon_192_url ? (
                          <img 
                            src={previewIcon || currentData.app_icon_192_url} 
                            alt="Icon 192" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Smartphone className="w-12 h-12 text-white" />
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => icon192InputRef.current?.click()}
                        disabled={uploadAsset.isPending}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                      <input
                        ref={icon192InputRef}
                        type="file"
                        accept="image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'app-icons', 'app_icon_192_url');
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      PNG, 192x192px
                    </p>
                  </div>

                  {/* Icon 512 */}
                  <div className="space-y-3">
                    <Label>Ícone 512x512</Label>
                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed bg-muted/30">
                      <div 
                        className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{ background: currentData.theme_color || '#FF8A00' }}
                      >
                        {currentData.app_icon_512_url ? (
                          <img 
                            src={currentData.app_icon_512_url} 
                            alt="Icon 512" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Smartphone className="w-12 h-12 text-white" />
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => icon512InputRef.current?.click()}
                        disabled={uploadAsset.isPending}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                      <input
                        ref={icon512InputRef}
                        type="file"
                        accept="image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'app-icons', 'app_icon_512_url');
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      PNG, 512x512px (splash screen)
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              {/* Brand Colors Editor */}
              <div className="bg-card rounded-2xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Cores da Marca</h3>
                <p className="text-sm text-muted-foreground">
                  Personalize as cores do app. As alterações são aplicadas em tempo real.
                </p>
                <BrandColorsEditor
                  value={{
                    brand_primary: currentData.brand_primary || '#FF8A00',
                    brand_secondary: currentData.brand_secondary || '#FF2D55',
                    brand_accent: currentData.brand_accent || '#FFBB33',
                    brand_background: currentData.brand_background || '#FFFFFF',
                    brand_surface: currentData.brand_surface || '#F9FAFB',
                    brand_text: currentData.brand_text || '#111827',
                    theme_color: currentData.theme_color || '#FF8A00',
                    background_color: currentData.background_color || '#FFFFFF',
                    gradient_start: currentData.gradient_start || '#FF8A00',
                    gradient_end: currentData.gradient_end || '#FF6A3D',
                  }}
                  onChange={(colors) => {
                    Object.entries(colors).forEach(([key, value]) => {
                      if (value) handleChange(key, value);
                    });
                  }}
                />
              </div>

              {/* Splash Image */}
              {/* Home Background Image */}
              <div className="bg-card rounded-2xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Imagem de Fundo (Home)</h3>
                <p className="text-sm text-muted-foreground">
                  Imagem de fundo exibida no cabeçalho da home do app. Gerada automaticamente com base no segmento da loja ao ser criada.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-48 h-28 rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${currentData.gradient_start || '#FF8A00'}, ${currentData.gradient_end || '#FF6A3D'})` }}
                    >
                      {(currentData as any).home_bg_image_url ? (
                        <img 
                          src={(currentData as any).home_bg_image_url} 
                          alt="Home BG" 
                          className="w-full h-full object-cover opacity-40"
                        />
                      ) : (
                        <Image className="w-8 h-8 text-white/50" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => homeBgInputRef.current?.click()}
                        disabled={uploadAsset.isPending}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Fundo
                      </Button>
                      <input
                        ref={homeBgInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'app-splash', 'home_bg_image_url');
                        }}
                      />
                      {(currentData as any).home_bg_image_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleChange('home_bg_image_url', null)}
                        >
                          Remover fundo
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        PNG ou JPG, recomendado 800x400px
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Splash Image */}
              <div className="bg-card rounded-2xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Imagem de Splash</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-32 h-56 rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden"
                      style={{ background: currentData.background_color || '#FFFFFF' }}
                    >
                      {currentData.splash_image_url ? (
                        <img 
                          src={currentData.splash_image_url} 
                          alt="Splash" 
                          className="w-full h-full object-contain p-4"
                        />
                      ) : currentData.app_icon_512_url ? (
                        <img 
                          src={currentData.app_icon_512_url} 
                          alt="Icon" 
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <Smartphone className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => splashInputRef.current?.click()}
                        disabled={uploadAsset.isPending}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Splash
                      </Button>
                      <input
                        ref={splashInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'app-splash', 'splash_image_url');
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        PNG ou JPG, recomendado 512x512px
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              <div className="bg-card rounded-2xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Funcionalidades</h3>
                
                <div className="space-y-4">
                  {/* Install Banner */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="space-y-1">
                      <Label className="font-medium">Banner de Instalação</Label>
                      <p className="text-sm text-muted-foreground">
                        Mostra banner convidando usuários a instalar o app
                      </p>
                    </div>
                    <Switch
                      checked={currentData.enable_install_banner ?? true}
                      onCheckedChange={(checked) => handleChange('enable_install_banner', checked)}
                    />
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="space-y-1">
                      <Label className="font-medium flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Permite enviar notificações aos usuários
                      </p>
                    </div>
                    <Switch
                      checked={currentData.enable_push_notifications ?? false}
                      onCheckedChange={(checked) => handleChange('enable_push_notifications', checked)}
                    />
                  </div>

                  {/* Offline Catalog */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="space-y-1">
                      <Label className="font-medium">Catálogo Offline</Label>
                      <p className="text-sm text-muted-foreground">
                        Permite visualizar produtos sem internet (não finaliza pedido)
                      </p>
                    </div>
                    <Switch
                      checked={currentData.enable_offline_catalog ?? true}
                      onCheckedChange={(checked) => handleChange('enable_offline_catalog', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="bg-card rounded-2xl border p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Modo Manutenção
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Bloqueia acesso ao app (apenas admin pode acessar)
                    </p>
                  </div>
                  <Switch
                    checked={currentData.enable_maintenance_mode ?? false}
                    onCheckedChange={(checked) => handleChange('enable_maintenance_mode', checked)}
                  />
                </div>

                {currentData.enable_maintenance_mode && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <p className="text-sm font-medium text-amber-800">
                          Modo manutenção está ATIVO
                        </p>
                        <p className="text-sm text-amber-700">
                          Usuários verão a tela de manutenção ao acessar o app.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="maintenance_message">Mensagem de Manutenção</Label>
                  <Textarea
                    id="maintenance_message"
                    value={currentData.maintenance_message || ''}
                    onChange={(e) => handleChange('maintenance_message', e.target.value)}
                    placeholder="Estamos em manutenção. Voltamos em breve!"
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="offline_message">Mensagem Offline</Label>
                  <Textarea
                    id="offline_message"
                    value={currentData.offline_message || ''}
                    onChange={(e) => handleChange('offline_message', e.target.value)}
                    placeholder="Você está offline. Conecte-se para fazer pedidos."
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="bg-card rounded-2xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Contato de Suporte</h3>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="support_whatsapp">WhatsApp</Label>
                    <Input
                      id="support_whatsapp"
                      value={currentData.support_whatsapp || ''}
                      onChange={(e) => handleChange('support_whatsapp', e.target.value)}
                      placeholder="+5511999999999"
                    />
                    <p className="text-xs text-muted-foreground">
                      Número com código do país para link direto
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="support_email">Email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      value={currentData.support_email || ''}
                      onChange={(e) => handleChange('support_email', e.target.value)}
                      placeholder="suporte@pizzaexpress.com"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Links Legais</h3>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="terms_url">Termos de Uso</Label>
                    <Input
                      id="terms_url"
                      type="url"
                      value={currentData.terms_url || ''}
                      onChange={(e) => handleChange('terms_url', e.target.value)}
                      placeholder="https://seusite.com/termos"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="privacy_url">Política de Privacidade</Label>
                    <Input
                      id="privacy_url"
                      type="url"
                      value={currentData.privacy_url || ''}
                      onChange={(e) => handleChange('privacy_url', e.target.value)}
                      placeholder="https://seusite.com/privacidade"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="w-4 h-4" />
              Preview do App
            </div>
            
            {/* Phone Mockup */}
            <div className="relative mx-auto" style={{ maxWidth: '220px' }}>
              {/* Phone frame */}
              <div className="rounded-[2.5rem] border-[8px] border-slate-800 bg-slate-800 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-xl z-10" />
                
                {/* Screen */}
                <div 
                  className="aspect-[9/19.5] rounded-[2rem] overflow-hidden"
                  style={{ background: currentData.background_color || '#FFFFFF' }}
                >
                  {/* Status bar simulation */}
                  <div 
                    className="h-7 flex items-center justify-between px-6 text-white text-xs"
                    style={{ background: currentData.theme_color || '#FF8A00' }}
                  >
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>
                  
                  {/* App content simulation */}
                  <div className="p-4 space-y-4">
                    {/* Header with logo */}
                    <div className="flex items-center justify-center h-10">
                      {previewLogo || currentData.app_logo_url ? (
                        <img 
                          src={previewLogo || currentData.app_logo_url} 
                          alt="Logo" 
                          className="h-10 object-contain"
                        />
                      ) : (
                        <span 
                          className="font-bold"
                          style={{ color: currentData.theme_color || '#FF8A00' }}
                        >
                          {currentData.app_short_name || 'Pizza'}
                        </span>
                      )}
                    </div>

                    {/* Content placeholders */}
                    <div className="space-y-3">
                      <div className="h-24 rounded-xl bg-muted animate-pulse" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-16 rounded-lg bg-muted animate-pulse" />
                        <div className="h-16 rounded-lg bg-muted animate-pulse" />
                      </div>
                      <div className="h-20 rounded-xl bg-muted animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* App Icon Preview */}
            <div className="text-center space-y-2 pt-4">
              <div className="inline-flex flex-col items-center gap-2">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: currentData.theme_color || '#FF8A00' }}
                >
                  {previewIcon || currentData.app_icon_192_url ? (
                    <img 
                      src={previewIcon || currentData.app_icon_192_url} 
                      alt="Icon" 
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <Smartphone className="w-8 h-8 text-white" />
                  )}
                </div>
                <span className="text-xs font-medium truncate max-w-[80px]">
                  {currentData.app_short_name || 'Pizza'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ícone na tela inicial
              </p>
            </div>

            {/* Status indicators */}
            <div className="space-y-2 pt-4">
              <div className={cn(
                'flex items-center gap-2 text-sm p-2 rounded-lg',
                currentData.enable_maintenance_mode ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700'
              )}>
                {currentData.enable_maintenance_mode ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Modo manutenção ativo
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    App online
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}