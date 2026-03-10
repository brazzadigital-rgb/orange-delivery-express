import { useState, useEffect } from 'react';
import { Palette, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface BrandColors {
  brand_primary: string;
  brand_secondary: string;
  brand_accent: string;
  brand_background: string;
  brand_surface: string;
  brand_text: string;
  theme_color: string;
  background_color: string;
  gradient_start: string;
  gradient_end: string;
}

interface BrandColorsEditorProps {
  value: Partial<BrandColors>;
  onChange: (colors: Partial<BrandColors>) => void;
  disabled?: boolean;
}

const DEFAULT_COLORS: BrandColors = {
  brand_primary: '#FF8A00',
  brand_secondary: '#FF2D55',
  brand_accent: '#FFBB33',
  brand_background: '#FFFFFF',
  brand_surface: '#F9FAFB',
  brand_text: '#111827',
  theme_color: '#FF8A00',
  background_color: '#FFFFFF',
  gradient_start: '#FF8A00',
  gradient_end: '#FF6A3D',
};

const PRESETS = [
  {
    name: 'Laranja Clássico',
    colors: { brand_primary: '#FF8A00', brand_secondary: '#FF2D55', brand_accent: '#FFBB33' },
  },
  {
    name: 'Vermelho Pizza',
    colors: { brand_primary: '#DC2626', brand_secondary: '#F97316', brand_accent: '#FBBF24' },
  },
  {
    name: 'Verde Fresco',
    colors: { brand_primary: '#16A34A', brand_secondary: '#22D3EE', brand_accent: '#A3E635' },
  },
  {
    name: 'Azul Moderno',
    colors: { brand_primary: '#2563EB', brand_secondary: '#7C3AED', brand_accent: '#06B6D4' },
  },
  {
    name: 'Roxo Premium',
    colors: { brand_primary: '#7C3AED', brand_secondary: '#EC4899', brand_accent: '#A855F7' },
  },
];

// Convert hex to HSL for CSS variables
function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Apply colors to CSS variables
function applyColorsToCSS(colors: Partial<BrandColors>) {
  const root = document.documentElement;
  
  if (colors.brand_primary) {
    root.style.setProperty('--primary', hexToHSL(colors.brand_primary));
    root.style.setProperty('--ring', hexToHSL(colors.brand_primary));
  }
  if (colors.brand_secondary) {
    root.style.setProperty('--gradient-end', hexToHSL(colors.brand_secondary));
  }
  if (colors.brand_accent) {
    root.style.setProperty('--accent-foreground', hexToHSL(colors.brand_accent));
  }
  if (colors.brand_background) {
    root.style.setProperty('--background', hexToHSL(colors.brand_background));
  }
  if (colors.brand_surface) {
    root.style.setProperty('--card', hexToHSL(colors.brand_surface));
    root.style.setProperty('--popover', hexToHSL(colors.brand_surface));
  }
  if (colors.brand_text) {
    root.style.setProperty('--foreground', hexToHSL(colors.brand_text));
  }
  if (colors.gradient_start) {
    root.style.setProperty('--gradient-start', colors.gradient_start);
  }
  if (colors.gradient_end) {
    root.style.setProperty('--gradient-end-hex', colors.gradient_end);
  }
  
  // Update theme-color meta tag
  if (colors.theme_color) {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', colors.theme_color);
    }
  }
}

// Reset CSS variables to defaults
function resetCSSToDefaults() {
  const root = document.documentElement;
  root.style.removeProperty('--primary');
  root.style.removeProperty('--ring');
  root.style.removeProperty('--gradient-end');
  root.style.removeProperty('--accent-foreground');
  root.style.removeProperty('--background');
  root.style.removeProperty('--card');
  root.style.removeProperty('--popover');
  root.style.removeProperty('--foreground');
}

export function BrandColorsEditor({ value, onChange, disabled }: BrandColorsEditorProps) {
  const [previewEnabled, setPreviewEnabled] = useState(true);

  // Apply colors when value changes (for live preview)
  useEffect(() => {
    if (previewEnabled) {
      applyColorsToCSS(value);
    }
  }, [value, previewEnabled]);

  const handleColorChange = (field: keyof BrandColors, newValue: string) => {
    const updates: Partial<BrandColors> = { [field]: newValue };
    
    // Sync theme_color with brand_primary
    if (field === 'brand_primary') {
      updates.theme_color = newValue;
    }
    if (field === 'brand_background') {
      updates.background_color = newValue;
    }
    
    onChange({ ...value, ...updates });
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    onChange({ ...value, ...preset.colors, theme_color: preset.colors.brand_primary });
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_COLORS);
    resetCSSToDefaults();
  };

  const ColorInput = ({ 
    field, 
    label, 
    description 
  }: { 
    field: keyof BrandColors; 
    label: string; 
    description?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <div 
        className="flex items-center gap-3"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="relative"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
        <input
          type="color"
          id={field}
          value={value[field] || DEFAULT_COLORS[field]}
          onChange={(e) => handleColorChange(field, e.target.value)}
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClickCapture={(e) => e.stopPropagation()}
          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
          disabled={disabled}
        />
        </div>
        <Input
          value={value[field] || DEFAULT_COLORS[field]}
          onChange={(e) => handleColorChange(field, e.target.value)}
          placeholder={DEFAULT_COLORS[field]}
          className="flex-1"
          disabled={disabled}
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="space-y-3">
        <Label>Paletas Prontas</Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:border-primary/50',
                'bg-card hover:bg-muted/50'
              )}
            >
              <div className="flex gap-0.5">
                <div 
                  className="w-4 h-4 rounded-l-sm" 
                  style={{ background: preset.colors.brand_primary }} 
                />
                <div 
                  className="w-4 h-4" 
                  style={{ background: preset.colors.brand_secondary }} 
                />
                <div 
                  className="w-4 h-4 rounded-r-sm" 
                  style={{ background: preset.colors.brand_accent }} 
                />
              </div>
              <span className="text-sm">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gradient Controls */}
      <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r border border-border/50" 
        style={{ 
          background: `linear-gradient(135deg, ${value.gradient_start || DEFAULT_COLORS.gradient_start} 0%, ${value.gradient_end || DEFAULT_COLORS.gradient_end} 100%)` 
        }}
      >
        <p className="text-sm font-medium text-white drop-shadow">Gradiente do Header</p>
        <div className="grid sm:grid-cols-2 gap-4 bg-white/95 backdrop-blur rounded-lg p-4">
          <ColorInput 
            field="gradient_start" 
            label="Início do Gradiente" 
            description="Cor inicial do header"
          />
          <ColorInput 
            field="gradient_end" 
            label="Fim do Gradiente" 
            description="Cor final do header"
          />
        </div>
      </div>

      {/* Color Inputs */}
      <div className="grid sm:grid-cols-2 gap-6">
        <ColorInput 
          field="brand_primary" 
          label="Cor Principal" 
          description="Botões, links, destaques"
        />
        <ColorInput 
          field="brand_secondary" 
          label="Cor Secundária" 
          description="Gradientes, acentos"
        />
        <ColorInput 
          field="brand_accent" 
          label="Cor de Destaque" 
          description="Badges, notificações"
        />
        <ColorInput 
          field="brand_text" 
          label="Cor do Texto" 
          description="Texto principal"
        />
        <ColorInput 
          field="brand_background" 
          label="Cor de Fundo" 
          description="Fundo do app"
        />
        <ColorInput 
          field="brand_surface" 
          label="Cor de Superfície" 
          description="Cards, modais"
        />
      </div>

      {/* Preview Controls */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Preview ao vivo: {previewEnabled ? 'Ativo' : 'Desativado'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetToDefaults}
          disabled={disabled}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar Padrão
        </Button>
      </div>

      {/* Preview Box */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium">Preview de Elementos</p>
        <div className="flex flex-wrap gap-3">
          <Button 
            className="btn-primary"
            style={{ 
              background: `linear-gradient(135deg, ${value.brand_primary || DEFAULT_COLORS.brand_primary} 0%, ${value.brand_secondary || DEFAULT_COLORS.brand_secondary} 100%)`
            }}
          >
            Botão Primário
          </Button>
          <Button variant="outline">Botão Secundário</Button>
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ background: value.brand_accent || DEFAULT_COLORS.brand_accent }}
          >
            Badge
          </div>
        </div>
      </div>
    </div>
  );
}
