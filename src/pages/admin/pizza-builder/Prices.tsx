 import { useState, useMemo, useCallback } from 'react';
 import { Link, useLocation } from 'react-router-dom';
 import { Save } from 'lucide-react';
 import { PageHeader } from '@/components/common/PageHeader';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
import { 
  useAdminPizzaSizes, 
  useAdminPizzaFlavors, 
  useAdminPizzaFlavorPrices,
  useUpsertPizzaFlavorPrice,
  useAdminStorePizzaSettings,
} from '@/hooks/useAdminPizzaBuilder';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 import { cn } from '@/lib/utils';
 import { toast } from 'sonner';
 import { useAdminBuilderNav } from '@/hooks/useAdminBuilderNav';
 
export default function AdminPizzaBuilderPrices() {
   const location = useLocation();
   const { navItems, pageTitle } = useAdminBuilderNav();
   const { data: sizes, isLoading: loadingSizes } = useAdminPizzaSizes();
    const { data: flavors, isLoading: loadingFlavors } = useAdminPizzaFlavors();
    const { data: prices, isLoading: loadingPrices } = useAdminPizzaFlavorPrices();
    const { data: settings } = useAdminStorePizzaSettings();
    const upsertPrice = useUpsertPizzaFlavorPrice();
    const pricingMode = settings?.pricing_mode || 'matrix';
 
   const [localPrices, setLocalPrices] = useState<Record<string, number>>({});
   const [isSaving, setIsSaving] = useState(false);
 
   // Create price map from DB
   const dbPriceMap = useMemo(() => {
     const map: Record<string, number> = {};
     prices?.forEach(p => {
       map[`${p.size_id}__${p.flavor_id}`] = p.price;
     });
     return map;
   }, [prices]);
 
   const getPrice = useCallback((sizeId: string, flavorId: string) => {
     const key = `${sizeId}__${flavorId}`;
     return localPrices[key] ?? dbPriceMap[key] ?? 0;
   }, [localPrices, dbPriceMap]);
 
   const setPrice = (sizeId: string, flavorId: string, price: number) => {
     const key = `${sizeId}__${flavorId}`;
     setLocalPrices(prev => ({ ...prev, [key]: price }));
   };
 
   const handleSaveAll = async () => {
     const changedPrices = Object.entries(localPrices).filter(([key, value]) => {
       return dbPriceMap[key] !== value;
     });
 
     if (changedPrices.length === 0) {
       toast.info('Nenhuma alteração para salvar');
       return;
     }
 
     setIsSaving(true);
     try {
       for (const [key, price] of changedPrices) {
         const [size_id, flavor_id] = key.split('__');
         await upsertPrice.mutateAsync({ size_id, flavor_id, price });
       }
       setLocalPrices({});
       toast.success(`${changedPrices.length} preços atualizados!`);
     } catch (error) {
       toast.error('Erro ao salvar preços');
     } finally {
       setIsSaving(false);
     }
   };
 
   const isLoading = loadingSizes || loadingFlavors || loadingPrices;
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center min-h-[400px]">
         <LoadingSpinner size="lg" />
       </div>
     );
   }
 
   const hasChanges = Object.keys(localPrices).length > 0;
 
   return (
     <div className="space-y-6">
      <PageHeader title={pageTitle} showBack={false} />
 
       {/* Navigation */}
       <div className="flex gap-2 overflow-x-auto pb-2">
         {navItems.map((item) => {
           const Icon = item.icon;
           const isActive = location.pathname === item.path;
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
 
       {/* Actions */}
       <div className="flex justify-end">
         <Button onClick={handleSaveAll} disabled={!hasChanges || isSaving}>
           <Save className="w-4 h-4 mr-2" />
           {isSaving ? 'Salvando...' : 'Salvar alterações'}
         </Button>
       </div>
 
        {pricingMode !== 'matrix' ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {pricingMode === 'fixed_by_size' 
                  ? 'No modo "Fixo por tamanho", o preço é definido apenas no tamanho. Não é necessário configurar a matriz.'
                  : 'No modo "Por item/peça", o preço é definido no cadastro de cada sabor/item (campo "Preço unitário").'
                }
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Altere o modo de precificação em <strong>Configurações</strong> para usar a matriz.
              </p>
            </CardContent>
          </Card>
        ) : (!sizes?.length || !flavors?.length) ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Crie tamanhos e sabores primeiro para configurar os preços.
              </p>
            </CardContent>
          </Card>
        ) : (
         <Card>
           <CardHeader>
             <CardTitle>Matriz de Preços</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                 <thead>
                   <tr>
                     <th className="p-2 text-left bg-muted font-semibold sticky left-0">Sabor</th>
                     {sizes?.map(size => (
                       <th key={size.id} className="p-2 text-center bg-muted font-semibold min-w-[100px]">
                         {size.name}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {flavors?.map(flavor => (
                     <tr key={flavor.id} className="border-b border-border">
                       <td className="p-2 font-medium bg-muted/50 sticky left-0">
                         {flavor.name}
                       </td>
                       {sizes?.map(size => {
                         const price = getPrice(size.id, flavor.id);
                         const key = `${size.id}__${flavor.id}`;
                         const isChanged = localPrices[key] !== undefined && localPrices[key] !== dbPriceMap[key];
                         
                         return (
                           <td key={size.id} className="p-1">
                             <Input
                               type="number"
                               step="0.01"
                               min="0"
                               value={price}
                               onChange={(e) => setPrice(size.id, flavor.id, Number(e.target.value))}
                               className={cn(
                                 "w-full text-center h-9",
                                 isChanged && "border-primary bg-primary/5"
                               )}
                             />
                           </td>
                         );
                       })}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </CardContent>
         </Card>
       )}
     </div>
   );
 }