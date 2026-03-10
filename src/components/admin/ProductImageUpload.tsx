import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImagePlus, Upload, Loader2, Link, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ProductImageUpload({ value, onChange }: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemoveImage = () => {
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <ImagePlus className="w-4 h-4 text-muted-foreground" />
        Imagem do Produto
      </Label>

      <div className="flex gap-4">
        {/* Image Preview */}
        <div 
          className={cn(
            "w-32 h-32 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden relative group",
            !value && "cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          )}
          onClick={() => !value && fileInputRef.current?.click()}
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="text-center p-2">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">Clique para enviar</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Upload Options */}
        <div className="flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              disabled={uploading}
            >
              <Link className="w-4 h-4" />
            </Button>
          </div>

          {showUrlInput && (
            <div className="flex gap-2">
              <Input
                placeholder="https://exemplo.com/imagem.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
              >
                OK
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Formatos: JPG, PNG, WebP. Máximo 5MB.
          </p>
        </div>
      </div>
    </div>
  );
}
