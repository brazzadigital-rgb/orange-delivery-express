import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Crown, Pencil, Plus, Trash2, Save, GripVertical, Package,
  Check, X, RefreshCw, Sparkles, Shield, Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface BillingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[] | null;
  max_orders_per_month: number | null;
  max_products: number | null;
  max_categories: number | null;
  max_users: number | null;
  max_drivers: number | null;
  has_analytics: boolean | null;
  has_api_access: boolean | null;
  has_custom_domain: boolean | null;
  has_priority_support: boolean | null;
  active: boolean | null;
  is_default: boolean | null;
  sort_order: number | null;
}

const EMPTY_PLAN: Omit<BillingPlan, 'id'> = {
  name: '',
  slug: '',
  description: '',
  price_monthly: 0,
  price_yearly: null,
  features: [],
  max_orders_per_month: null,
  max_products: null,
  max_categories: null,
  max_users: null,
  max_drivers: null,
  has_analytics: false,
  has_api_access: false,
  has_custom_domain: false,
  has_priority_support: false,
  active: true,
  is_default: false,
  sort_order: 0,
};

function useBillingPlans() {
  return useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as BillingPlan[];
    },
  });
}

export default function OwnerPlans() {
  const { data: plans, isLoading } = useBillingPlans();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (plan: Partial<BillingPlan> & { id?: string }) => {
      const { id, ...rest } = plan;
      if (id) {
        const { error } = await supabase.from('billing_plans').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('billing_plans').insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
      toast.success(isNew ? 'Plano criado!' : 'Plano atualizado!');
      setDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao salvar plano'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('billing_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
      toast.success('Plano removido');
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao remover'),
  });

  const openEdit = (plan: BillingPlan) => {
    setEditingPlan({ ...plan });
    setIsNew(false);
    setFeatureInput('');
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingPlan({ id: '', ...EMPTY_PLAN, sort_order: (plans?.length || 0) + 1 } as BillingPlan);
    setIsNew(true);
    setFeatureInput('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingPlan) return;
    const payload: any = { ...editingPlan };
    if (isNew) delete payload.id;
    saveMutation.mutate(payload);
  };

  const addFeature = () => {
    if (!featureInput.trim() || !editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...(editingPlan.features || []), featureInput.trim()],
    });
    setFeatureInput('');
  };

  const removeFeature = (idx: number) => {
    if (!editingPlan) return;
    const updated = [...(editingPlan.features || [])];
    updated.splice(idx, 1);
    setEditingPlan({ ...editingPlan, features: updated });
  };

  const updateField = (field: keyof BillingPlan, value: any) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, [field]: value });
  };

  const PLAN_CONFIG: Record<string, { months: number; discount: number }> = {
    monthly:   { months: 1,  discount: 0 },
    quarterly: { months: 3,  discount: 10 },
    annual:    { months: 12, discount: 20 },
  };

  const getPlanTotal = (plan: BillingPlan) => {
    const cfg = PLAN_CONFIG[plan.slug] || { months: 1, discount: 0 };
    return plan.price_monthly * cfg.months * (1 - cfg.discount / 100);
  };

  const getPlanLabel = (plan: BillingPlan) => {
    const cfg = PLAN_CONFIG[plan.slug] || { months: 1, discount: 0 };
    if (cfg.months === 1) return '/mês';
    return `/${cfg.months} meses`;
  };

  const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Planos & Preços
          </h1>
          <p className="text-muted-foreground text-sm">Gerencie os planos disponíveis para as lojas</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`relative transition-all hover:shadow-md ${!plan.active ? 'opacity-60' : ''}`}>
            {plan.is_default && (
              <Badge className="absolute top-3 right-3 bg-primary/10 text-primary border-primary/20">Padrão</Badge>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{plan.slug}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{formatBRL(getPlanTotal(plan))}</span>
                <span className="text-muted-foreground text-sm">{getPlanLabel(plan)}</span>
              </div>
              {(PLAN_CONFIG[plan.slug]?.discount ?? 0) > 0 && (
                <p className="text-xs text-emerald-600 font-medium">
                  {PLAN_CONFIG[plan.slug].discount}% de desconto · Base: {formatBRL(plan.price_monthly)}/mês
                </p>
              )}

              {plan.description && (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              )}

              {/* Limits */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground">Pedidos/mês</span>
                  <p className="font-semibold">{plan.max_orders_per_month ?? '∞'}</p>
                </div>
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground">Produtos</span>
                  <p className="font-semibold">{plan.max_products ?? '∞'}</p>
                </div>
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground">Categorias</span>
                  <p className="font-semibold">{plan.max_categories ?? '∞'}</p>
                </div>
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground">Motoboys</span>
                  <p className="font-semibold">{plan.max_drivers ?? '∞'}</p>
                </div>
              </div>

              {/* Features */}
              {plan.features && (plan.features as string[]).length > 0 && (
                <div className="space-y-1.5">
                  {(plan.features as string[]).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Flags */}
              <div className="flex flex-wrap gap-2">
                {plan.has_analytics && <Badge variant="secondary" className="text-xs"><Zap className="w-3 h-3 mr-1" />Analytics</Badge>}
                {plan.has_custom_domain && <Badge variant="secondary" className="text-xs"><Shield className="w-3 h-3 mr-1" />Domínio</Badge>}
                {plan.has_priority_support && <Badge variant="secondary" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />Suporte VIP</Badge>}
                {plan.has_api_access && <Badge variant="secondary" className="text-xs">API</Badge>}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(plan)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Editar
                </Button>
                {!plan.is_default && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Remover este plano?')) deleteMutation.mutate(plan.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? 'Novo Plano' : `Editar — ${editingPlan?.name}`}</DialogTitle>
            <DialogDescription>Configure os detalhes, preços, limites e benefícios do plano.</DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-5 py-2">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={editingPlan.name} onChange={(e) => updateField('name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={editingPlan.slug} onChange={(e) => updateField('slug', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={editingPlan.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={2}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Preço Mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPlan.price_monthly}
                    onChange={(e) => updateField('price_monthly', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Preço Anual (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPlan.price_yearly ?? ''}
                    onChange={(e) => updateField('price_yearly', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
              </div>

              {/* Limits */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Limites</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Pedidos/mês</Label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={editingPlan.max_orders_per_month ?? ''}
                      onChange={(e) => updateField('max_orders_per_month', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Produtos</Label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={editingPlan.max_products ?? ''}
                      onChange={(e) => updateField('max_products', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Categorias</Label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={editingPlan.max_categories ?? ''}
                      onChange={(e) => updateField('max_categories', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Usuários</Label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={editingPlan.max_users ?? ''}
                      onChange={(e) => updateField('max_users', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Motoboys</Label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={editingPlan.max_drivers ?? ''}
                      onChange={(e) => updateField('max_drivers', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                </div>
              </div>

              {/* Flags */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Recursos</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytics / Relatórios</span>
                    <Switch checked={!!editingPlan.has_analytics} onCheckedChange={(v) => updateField('has_analytics', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Domínio Personalizado</span>
                    <Switch checked={!!editingPlan.has_custom_domain} onCheckedChange={(v) => updateField('has_custom_domain', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Suporte Prioritário</span>
                    <Switch checked={!!editingPlan.has_priority_support} onCheckedChange={(v) => updateField('has_priority_support', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Acesso API</span>
                    <Switch checked={!!editingPlan.has_api_access} onCheckedChange={(v) => updateField('has_api_access', v)} />
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Benefícios</Label>
                <div className="space-y-2">
                  {(editingPlan.features || []).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-sm flex-1">{f}</span>
                      <button onClick={() => removeFeature(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Suporte 24/7"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button size="sm" variant="outline" onClick={addFeature} type="button">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Ativo</span>
                  <Switch checked={!!editingPlan.active} onCheckedChange={(v) => updateField('active', v)} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Plano Padrão</span>
                  <Switch checked={!!editingPlan.is_default} onCheckedChange={(v) => updateField('is_default', v)} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
