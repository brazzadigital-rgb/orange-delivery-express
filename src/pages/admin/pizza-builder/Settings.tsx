import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { getDemoDataForSegment } from '@/lib/builder-demo-data';
import { useTenant } from '@/contexts/TenantContext';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Input } from '@/components/ui/input';
 import { Switch } from '@/components/ui/switch';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { 
   useAdminStorePizzaSettings, 
   useUpsertStorePizzaSettings,
   useCreatePizzaBuilderDemoData 
 } from '@/hooks/useAdminPizzaBuilder';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 import { cn } from '@/lib/utils';
 import { useAdminBuilderNav } from '@/hooks/useAdminBuilderNav';
 
export default function AdminPizzaBuilderSettings() {
   const location = useLocation();
   const { data: settings, isLoading } = useAdminStorePizzaSettings();
   const upsertSettings = useUpsertStorePizzaSettings();
  const createDemoData = useCreatePizzaBuilderDemoData();
  const { navItems, pageTitle, demoCardDesc } = useAdminBuilderNav();
  const { store } = useTenant();
  const demoData = getDemoDataForSegment(store?.store_type);
 
    const [pricingRule, setPricingRule] = useState<'average' | 'highest'>('average');
    const [pricingMode, setPricingMode] = useState<'matrix' | 'fixed_by_size' | 'per_item'>('matrix');
    const [allowLessThanMax, setAllowLessThanMax] = useState(true);
    const [maxObsChars, setMaxObsChars] = useState(140);
 
    useEffect(() => {
      if (settings) {
        setPricingRule(settings.pricing_rule);
        setPricingMode(settings.pricing_mode || 'matrix');
        setAllowLessThanMax(settings.allow_less_than_max);
        setMaxObsChars(settings.max_observation_chars);
      }
    }, [settings]);
 
    const handleSave = () => {
      upsertSettings.mutate({
        pricing_rule: pricingRule,
        pricing_mode: pricingMode,
        allow_less_than_max: allowLessThanMax,
        max_observation_chars: maxObsChars,
        require_at_least_one_flavor: true,
      });
    };
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center min-h-[400px]">
         <LoadingSpinner size="lg" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
      <PageHeader title={pageTitle} showBack={false} />
 
       {/* Navigation */}
       <div className="flex gap-2 overflow-x-auto pb-2">
         {navItems.map((item) => {
           const Icon = item.icon;
           const isActive = location.pathname === item.path || 
             (item.path === '/admin/pizza-builder/settings' && location.pathname === '/admin/pizza-builder');
           return (
             <Link
               key={item.path}
               to={item.path}
               className={cn(
                 "flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors",
                 isActive 
                   ? "bg-primary text-primary-foreground" 
                   : "bg-muted hover:bg-muted/80"
               )}
             >
               <Icon className="w-4 h-4" />
               {item.label}
             </Link>
           );
         })}
       </div>
 
       <div className="grid gap-6 md:grid-cols-2">
         {/* Settings */}
         <Card>
           <CardHeader>
             <CardTitle>Configurações Gerais</CardTitle>
             <CardDescription>Regras de cálculo e limites</CardDescription>
           </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing Mode */}
              <div>
                <Label className="text-base">Modo de precificação</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Como os preços são definidos no builder
                </p>
                <RadioGroup value={pricingMode} onValueChange={(v) => setPricingMode(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="matrix" id="mode-matrix" />
                    <Label htmlFor="mode-matrix" className="cursor-pointer">
                      <span className="font-medium">Matriz tamanho × sabor</span>
                      <span className="block text-xs text-muted-foreground">Preço individual por combinação (ideal para pizzarias)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed_by_size" id="mode-fixed" />
                    <Label htmlFor="mode-fixed" className="cursor-pointer">
                      <span className="font-medium">Fixo por tamanho</span>
                      <span className="block text-xs text-muted-foreground">Sabores/opções não afetam o preço (ideal para marmitaria, açaí)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="per_item" id="mode-per-item" />
                    <Label htmlFor="mode-per-item" className="cursor-pointer">
                      <span className="font-medium">Por item/peça</span>
                      <span className="block text-xs text-muted-foreground">Cada sabor/item tem preço unitário (ideal para sushi, por peça)</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Pricing Rule (only for matrix mode) */}
              {pricingMode === 'matrix' && (
              <div>
                <Label className="text-base">Regra de preço</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Como calcular o preço base quando há múltiplos sabores
                </p>
                <RadioGroup value={pricingRule} onValueChange={(v) => setPricingRule(v as 'average' | 'highest')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="average" id="average" />
                    <Label htmlFor="average">Média dos sabores</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="highest" id="highest" />
                    <Label htmlFor="highest">Maior preço prevalece</Label>
                  </div>
                </RadioGroup>
              </div>
              )}
 
             <div className="flex items-center justify-between">
               <div>
                 <Label className="text-base">Permitir menos que o máximo</Label>
                 <p className="text-sm text-muted-foreground">
                   Cliente pode escolher menos sabores que o limite
                 </p>
               </div>
               <Switch 
                 checked={allowLessThanMax} 
                 onCheckedChange={setAllowLessThanMax} 
               />
             </div>
 
             <div>
               <Label htmlFor="maxChars">Limite de caracteres (observação)</Label>
               <Input
                 id="maxChars"
                 type="number"
                 value={maxObsChars}
                 onChange={(e) => setMaxObsChars(Number(e.target.value))}
                 min={50}
                 max={500}
                 className="mt-2 w-32"
               />
             </div>
 
             <Button onClick={handleSave} disabled={upsertSettings.isPending}>
               {upsertSettings.isPending ? 'Salvando...' : 'Salvar configurações'}
             </Button>
           </CardContent>
         </Card>
 
         {/* Demo Data */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Sparkles className="w-5 h-5 text-primary" />
               Dados Demo
             </CardTitle>
             <CardDescription>{demoCardDesc}</CardDescription>
           </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Isso irá criar automaticamente:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {demoData.bullets.map((bullet, i) => (
                  <li key={i}>• {bullet}</li>
                ))}
              </ul>
             <Button 
               onClick={() => createDemoData.mutate()}
               disabled={createDemoData.isPending}
               variant="outline"
               className="w-full"
             >
               {createDemoData.isPending ? 'Criando...' : 'Criar dados demo'}
             </Button>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }