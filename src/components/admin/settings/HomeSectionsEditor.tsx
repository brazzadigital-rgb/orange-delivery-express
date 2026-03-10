import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical, ArrowUp, ArrowDown, LayoutGrid } from 'lucide-react';
import { useHomeSections, useUpdateHomeSection, useReorderHomeSections, HomeSection } from '@/hooks/useHomeSections';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SECTION_ICONS: Record<string, string> = {
  banners: '🖼️',
  categories: '📂',
  products: '📦',
  promotions: '🎉',
  pizza_builder_cta: '🍕',
  pizza_sizes: '📐',
  combo_builder_cta: '🍔',
  featured_combos: '⭐',
  popular_items: '🔥',
  quick_filters: '🔍',
  offers: '💸',
  featured: '✨',
  loyalty: '🎁',
};

export function HomeSectionsEditor() {
  const { data: sections, isLoading } = useHomeSections();
  const updateSection = useUpdateHomeSection();
  const reorderSections = useReorderHomeSections();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <LayoutGrid className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma seção configurada.</p>
        <p className="text-xs mt-1">As seções são criadas automaticamente ao definir o tipo da loja.</p>
      </div>
    );
  }

  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  const handleToggle = async (section: HomeSection) => {
    try {
      await updateSection.mutateAsync({ id: section.id, enabled: !section.enabled });
      toast.success(`${section.label} ${!section.enabled ? 'ativada' : 'desativada'}`);
    } catch {
      toast.error('Erro ao atualizar seção');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const updated = sorted.map((s, i) => {
      if (i === index) return { id: s.id, sort_order: sorted[swapIndex].sort_order };
      if (i === swapIndex) return { id: s.id, sort_order: sorted[index].sort_order };
      return { id: s.id, sort_order: s.sort_order };
    });

    try {
      await reorderSections.mutateAsync(updated);
    } catch {
      toast.error('Erro ao reordenar');
    }
  };

  return (
    <div className="space-y-2">
      {sorted.map((section, index) => (
        <Card key={section.id} className={cn(
          'transition-opacity',
          !section.enabled && 'opacity-60'
        )}>
          <CardContent className="p-3 flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            
            <span className="text-lg shrink-0">
              {SECTION_ICONS[section.section_key] || '📄'}
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{section.label}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{section.section_key}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === 0}
                onClick={() => handleMove(index, 'up')}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === sorted.length - 1}
                onClick={() => handleMove(index, 'down')}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Switch
              checked={section.enabled}
              onCheckedChange={() => handleToggle(section)}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
