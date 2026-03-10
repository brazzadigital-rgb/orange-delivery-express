 import { useState, useEffect } from 'react';
import { Settings, Star, Gift, Save, Info, Zap } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { useAdminLoyaltySettings, useUpsertLoyaltySettings } from '@/hooks/useAdminLoyalty';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 
 export default function AdminLoyaltySettings() {
   const { data: settings, isLoading } = useAdminLoyaltySettings();
   const upsertSettings = useUpsertLoyaltySettings();
 
  const [form, setForm] = useState({
    enabled: true,
    program_name: 'Pontos Fidelidade',
    earning_rate_points_per_real: 1,
    reais_per_point: 1,
    min_order_to_earn: 0,
    credit_on_status: 'delivered' as 'paid' | 'accepted' | 'delivered',
    points_expire_days: null as number | null,
    allow_partial_redeem_shipping: true,
    max_points_redeem_per_order: null as number | null,
    auto_credit_enabled: true,
  });
 
  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled,
        program_name: settings.program_name,
        earning_rate_points_per_real: settings.earning_rate_points_per_real,
        reais_per_point: settings.reais_per_point ?? 1,
        min_order_to_earn: settings.min_order_to_earn,
        credit_on_status: settings.credit_on_status,
        points_expire_days: settings.points_expire_days,
        allow_partial_redeem_shipping: settings.allow_partial_redeem_shipping,
        max_points_redeem_per_order: settings.max_points_redeem_per_order,
        auto_credit_enabled: settings.auto_credit_enabled ?? true,
      });
    }
  }, [settings]);
 
   const handleSave = () => {
     upsertSettings.mutate(form);
   };
 
   if (isLoading) {
     return (
       <div className="p-6 flex items-center justify-center">
         <LoadingSpinner />
       </div>
     );
   }
 
   return (
     <div className="p-6 max-w-2xl">
       <div className="flex items-center justify-between mb-6">
         <div>
           <h1 className="text-2xl font-bold flex items-center gap-2">
             <Settings className="w-6 h-6" />
             Configurações
           </h1>
           <p className="text-muted-foreground">Configure o programa de fidelidade</p>
         </div>
         <Button onClick={handleSave} disabled={upsertSettings.isPending}>
           <Save className="w-4 h-4 mr-2" />
           Salvar
         </Button>
       </div>
 
       <div className="space-y-6">
         {/* Enable/Disable */}
         <div className="card-premium p-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                 <Star className="w-5 h-5 text-primary" />
               </div>
               <div>
                 <p className="font-semibold">Programa Ativo</p>
                 <p className="text-sm text-muted-foreground">Habilitar pontos de fidelidade</p>
               </div>
             </div>
             <Switch
               checked={form.enabled}
               onCheckedChange={(checked) => setForm(f => ({ ...f, enabled: checked }))}
             />
           </div>
         </div>
 
        {/* Auto Credit Toggle */}
        <div className="card-premium p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold">Crédito Automático</p>
                <p className="text-sm text-muted-foreground">
                  {form.auto_credit_enabled 
                    ? 'Pontos são creditados automaticamente quando o pedido é ' + (form.credit_on_status === 'delivered' ? 'entregue' : form.credit_on_status === 'paid' ? 'pago' : 'aceito')
                    : 'Pontos precisam ser aprovados manualmente na aba Clientes'}
                </p>
              </div>
            </div>
            <Switch
              checked={form.auto_credit_enabled}
              onCheckedChange={(checked) => setForm(f => ({ ...f, auto_credit_enabled: checked }))}
            />
          </div>
          {!form.auto_credit_enabled && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ Com o crédito automático desativado, você precisa aprovar manualmente os pontos de cada pedido na aba <strong>Clientes</strong>.
              </p>
            </div>
          )}
        </div>

         {/* Program Name */}
         <div className="card-premium p-4 space-y-4">
           <h2 className="font-semibold">Identidade</h2>
           
           <div>
             <Label>Nome do Programa</Label>
             <Input
               value={form.program_name}
               onChange={(e) => setForm(f => ({ ...f, program_name: e.target.value }))}
               placeholder="Pontos Fidelidade"
             />
             <p className="text-xs text-muted-foreground mt-1">
               Este nome aparecerá para os clientes
             </p>
           </div>
         </div>
 
        {/* Earning Rules */}
        <div className="card-premium p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Regras de Acúmulo
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Valor (R$) por 1 Ponto</Label>
              <Input
                type="number"
                min={0.01}
                step={0.5}
                value={form.reais_per_point}
                onChange={(e) => setForm(f => ({ ...f, reais_per_point: parseFloat(e.target.value) || 1 }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: 5 = cliente ganha 1 ponto a cada R$ 5
              </p>
            </div>

            <div>
              <Label>Pedido Mínimo para Ganhar</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.min_order_to_earn}
                onChange={(e) => setForm(f => ({ ...f, min_order_to_earn: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = sem mínimo
              </p>
            </div>
          </div>
 
           <div>
             <Label>Creditar Pontos Quando</Label>
             <Select
               value={form.credit_on_status}
               onValueChange={(value: 'paid' | 'accepted' | 'delivered') => setForm(f => ({ ...f, credit_on_status: value }))}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="paid">Pago</SelectItem>
                 <SelectItem value="accepted">Aceito</SelectItem>
                 <SelectItem value="delivered">Entregue</SelectItem>
               </SelectContent>
             </Select>
             <p className="text-xs text-muted-foreground mt-1">
               Pontos ficam pendentes até o status ser atingido
             </p>
           </div>
 
           <div>
             <Label>Expiração (dias)</Label>
             <Input
               type="number"
               min={0}
               value={form.points_expire_days ?? ''}
               onChange={(e) => setForm(f => ({ 
                 ...f, 
                 points_expire_days: e.target.value ? parseInt(e.target.value) : null 
               }))}
               placeholder="Sem expiração"
             />
             <p className="text-xs text-muted-foreground mt-1">
               Deixe vazio para pontos não expirarem
             </p>
           </div>
         </div>
 
         {/* Redemption Rules */}
         <div className="card-premium p-4 space-y-4">
           <h2 className="font-semibold">Regras de Resgate</h2>
           
           <div className="flex items-center justify-between">
             <div>
               <p className="font-medium">Resgate Parcial de Frete</p>
               <p className="text-sm text-muted-foreground">
                 Permitir usar pontos para pagar parte do frete
               </p>
             </div>
             <Switch
               checked={form.allow_partial_redeem_shipping}
               onCheckedChange={(checked) => setForm(f => ({ ...f, allow_partial_redeem_shipping: checked }))}
             />
           </div>
 
           <div>
             <Label>Máximo de Pontos por Pedido</Label>
             <Input
               type="number"
               min={0}
               value={form.max_points_redeem_per_order ?? ''}
               onChange={(e) => setForm(f => ({ 
                 ...f, 
                 max_points_redeem_per_order: e.target.value ? parseInt(e.target.value) : null 
               }))}
               placeholder="Sem limite"
             />
             <p className="text-xs text-muted-foreground mt-1">
               Deixe vazio para sem limite
             </p>
           </div>
         </div>
 
         {/* Info Box */}
         <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
           <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
           <div className="text-sm text-blue-800">
             <p className="font-medium mb-1">Como funciona?</p>
             <ul className="list-disc list-inside space-y-1 text-blue-700">
               <li>Clientes acumulam pontos a cada pedido</li>
               <li>Pontos ficam pendentes até o pedido ser {form.credit_on_status === 'delivered' ? 'entregue' : form.credit_on_status === 'paid' ? 'pago' : 'aceito'}</li>
               <li>Clientes podem trocar pontos por recompensas no checkout</li>
             </ul>
           </div>
         </div>
       </div>
     </div>
   );
 }