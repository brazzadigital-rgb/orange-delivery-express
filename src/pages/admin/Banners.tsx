import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Image, Link, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useToggleBannerActive,
  Banner,
} from '@/hooks/useBanners';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminBanners() {
  const { data: banners, isLoading } = useBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const toggleActive = useToggleBannerActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_type: 'none' as 'none' | 'category' | 'product' | 'url',
    link_value: '',
    sort_order: 0,
    active: true,
    starts_at: '',
    ends_at: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      link_type: 'none',
      link_value: '',
      sort_order: 0,
      active: true,
      starts_at: '',
      ends_at: '',
    });
    setEditingBanner(null);
    setImageTab('upload');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('promotions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('promotions')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem: ' + (error.message || 'Tente novamente'));
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      link_type: (banner.link_type as any) || 'none',
      link_value: banner.link_value || '',
      sort_order: banner.sort_order || 0,
      active: banner.active ?? true,
      starts_at: banner.starts_at ? banner.starts_at.split('T')[0] : '',
      ends_at: banner.ends_at ? banner.ends_at.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.image_url) {
      return;
    }

    const bannerData = {
      title: formData.title || null,
      subtitle: formData.subtitle || null,
      image_url: formData.image_url,
      link_type: formData.link_type === 'none' ? null : formData.link_type,
      link_value: formData.link_value || null,
      sort_order: formData.sort_order,
      active: formData.active,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
    };

    if (editingBanner) {
      await updateBanner.mutateAsync({ id: editingBanner.id, ...bannerData });
    } else {
      await createBanner.mutateAsync(bannerData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (bannerToDelete) {
      await deleteBanner.mutateAsync(bannerToDelete);
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="text-muted-foreground">Gerencie os banners promocionais da home</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Banner
        </Button>
      </div>

      {/* Banner List */}
      <div className="grid gap-4">
        {banners?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-1">Nenhum banner cadastrado</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Crie seu primeiro banner promocional
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          banners?.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Preview */}
                <div className="w-full md:w-64 h-32 md:h-auto bg-muted flex-shrink-0">
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <CardContent className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {banner.title || 'Sem título'}
                      </h3>
                      {banner.subtitle && (
                        <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.active ?? false}
                        onCheckedChange={(active) =>
                          toggleActive.mutate({ id: banner.id, active })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(banner)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(banner.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${banner.active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {banner.active ? 'Ativo' : 'Inativo'}
                    </span>
                    {banner.link_type && (
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                        <Link className="w-3 h-3" />
                        {banner.link_type}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Ordem: {banner.sort_order}
                    </span>
                    {banner.starts_at && (
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        Início: {format(new Date(banner.starts_at), 'dd/MM/yyyy')}
                      </span>
                    )}
                    {banner.ends_at && (
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        Fim: {format(new Date(banner.ends_at), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Editar Banner' : 'Novo Banner'}
            </DialogTitle>
            <DialogDescription>
              Configure o banner que será exibido na home do app
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Imagem do Banner *</Label>
              <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as 'upload' | 'url')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="gap-2">
                    <Link className="w-4 h-4" />
                    URL
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="mt-3">
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="banner-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-24 border-dashed flex flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-sm">Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6" />
                          <span className="text-sm">Clique para selecionar uma imagem</span>
                          <span className="text-xs text-muted-foreground">PNG, JPG até 5MB</span>
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="url" className="mt-3">
                  <Input
                    id="image_url"
                    placeholder="https://exemplo.com/banner.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </TabsContent>
              </Tabs>
              
              {formData.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden border relative group">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título (opcional)</Label>
                <Input
                  id="title"
                  placeholder="Promoção Especial"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
                <Input
                  id="subtitle"
                  placeholder="Até 50% off"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Link</Label>
                <Select
                  value={formData.link_type}
                  onValueChange={(value: any) => setFormData({ ...formData, link_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="category">Categoria</SelectItem>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="url">URL externa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.link_type !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="link_value">
                    {formData.link_type === 'category' && 'Slug da Categoria'}
                    {formData.link_type === 'product' && 'ID do Produto'}
                    {formData.link_type === 'url' && 'URL'}
                  </Label>
                  <Input
                    id="link_value"
                    placeholder={
                      formData.link_type === 'category'
                        ? 'pizzas-especiais'
                        : formData.link_type === 'product'
                        ? 'uuid-do-produto'
                        : 'https://...'
                    }
                    value={formData.link_value}
                    onChange={(e) => setFormData({ ...formData, link_value: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordem</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="starts_at">Data Início</Label>
                <Input
                  id="starts_at"
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at">Data Fim</Label>
                <Input
                  id="ends_at"
                  type="date"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(active) => setFormData({ ...formData, active })}
              />
              <Label htmlFor="active">Banner ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.image_url || createBanner.isPending || updateBanner.isPending}
            >
              {createBanner.isPending || updateBanner.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Banner</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBanner.isPending}
            >
              {deleteBanner.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
