 import { useState, useEffect } from 'react';
 import { Printer, ChefHat, Receipt, Truck, TestTube } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
 import { usePrintSettings, useUpdatePrintSettings, type PrintSettings } from '@/hooks/usePrintSettings';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 import { toast } from 'sonner';
 
 const DEFAULT_SETTINGS: Partial<PrintSettings> = {
   printer_enabled: true,
   paper_size: '80mm',
   auto_print_new_orders: false,
   auto_print_copies: 1,
   print_on_status: 'accepted',
   print_templates_enabled: {
     kitchen: true,
     counter: true,
     delivery: true,
   },
   header_logo_url: null,
   footer_message: null,
   show_prices_on_kitchen: false,
   show_qr_pickup: true,
 };
 
 export function PrintSettingsSection() {
   const { data: settings, isLoading } = usePrintSettings();
   const updateSettings = useUpdatePrintSettings();
   
   const [formData, setFormData] = useState<Partial<PrintSettings>>(DEFAULT_SETTINGS);
   const [hasChanges, setHasChanges] = useState(false);
 
   useEffect(() => {
     if (settings) {
       setFormData(settings);
       setHasChanges(false);
     }
   }, [settings]);
 
   const handleChange = (field: keyof PrintSettings, value: any) => {
     setFormData(prev => ({ ...prev, [field]: value }));
     setHasChanges(true);
   };
 
   const handleTemplateToggle = (template: 'kitchen' | 'counter' | 'delivery', enabled: boolean) => {
     const current = formData.print_templates_enabled || DEFAULT_SETTINGS.print_templates_enabled!;
     handleChange('print_templates_enabled', { ...current, [template]: enabled });
   };
 
   const handleSave = async () => {
     try {
       await updateSettings.mutateAsync(formData);
       setHasChanges(false);
     } catch (error) {
       console.error('Save error:', error);
     }
   };
 
   const handleTestPrint = () => {
     const printWindow = window.open('/admin/print/test', 'print-test', 'width=400,height=600');
     if (!printWindow) {
       toast.error('Popup bloqueado. Permita popups para testar impressão.');
     }
   };
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-12">
         <LoadingSpinner size="lg" />
       </div>
     );
   }
 
   const templates = formData.print_templates_enabled || DEFAULT_SETTINGS.print_templates_enabled!;
 
   return (
     <div className="space-y-6">
       {/* Main Settings */}
       <div className="bg-card rounded-2xl border p-6 space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h3 className="font-semibold text-lg flex items-center gap-2">
               <Printer className="w-5 h-5" />
               Impressão de Pedidos
             </h3>
             <p className="text-sm text-muted-foreground">
               Configure a impressão automática e manual de comandas
             </p>
           </div>
           <Switch
             checked={formData.printer_enabled ?? true}
             onCheckedChange={(checked) => handleChange('printer_enabled', checked)}
           />
         </div>
 
         <div className="grid sm:grid-cols-2 gap-4">
           <div className="space-y-2">
             <Label>Tamanho do Papel</Label>
             <Select
               value={formData.paper_size || '80mm'}
               onValueChange={(value) => handleChange('paper_size', value)}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="80mm">80mm (Padrão)</SelectItem>
                 <SelectItem value="58mm">58mm (Compacto)</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label>Cópias Automáticas</Label>
             <Input
               type="number"
               min={1}
               max={5}
               value={formData.auto_print_copies || 1}
               onChange={(e) => handleChange('auto_print_copies', parseInt(e.target.value) || 1)}
             />
           </div>
         </div>
       </div>
 
       {/* Auto-Print Settings */}
       <div className="bg-card rounded-2xl border p-6 space-y-4">
         <div className="flex items-center justify-between">
           <div className="space-y-1">
             <Label className="font-semibold text-lg">Impressão Automática</Label>
             <p className="text-sm text-muted-foreground">
               Imprimir automaticamente quando chegar pedido novo
             </p>
           </div>
           <Switch
             checked={formData.auto_print_new_orders ?? false}
             onCheckedChange={(checked) => handleChange('auto_print_new_orders', checked)}
           />
         </div>
 
         {formData.auto_print_new_orders && (
           <div className="space-y-2 pt-4 border-t">
             <Label>Imprimir quando o pedido for...</Label>
             <Select
               value={formData.print_on_status || 'accepted'}
               onValueChange={(value) => handleChange('print_on_status', value)}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="created">Criado (imediato)</SelectItem>
                 <SelectItem value="accepted">Aceito pelo admin</SelectItem>
               </SelectContent>
             </Select>
             <p className="text-xs text-muted-foreground">
               Recomendamos "Aceito" para evitar impressões de pedidos cancelados
             </p>
           </div>
         )}
       </div>
 
       {/* Templates */}
       <div className="bg-card rounded-2xl border p-6 space-y-4">
         <h3 className="font-semibold text-lg">Templates de Impressão</h3>
         <p className="text-sm text-muted-foreground">
           Escolha quais tipos de comanda serão impressos
         </p>
 
         <div className="space-y-3">
           <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
             <div className="flex items-center gap-3">
               <ChefHat className="w-5 h-5 text-amber-500" />
               <div>
                 <Label className="font-medium">Cozinha</Label>
                 <p className="text-xs text-muted-foreground">Itens para preparo</p>
               </div>
             </div>
             <Switch
               checked={templates.kitchen}
               onCheckedChange={(checked) => handleTemplateToggle('kitchen', checked)}
             />
           </div>
 
           <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
             <div className="flex items-center gap-3">
               <Receipt className="w-5 h-5 text-blue-500" />
               <div>
                 <Label className="font-medium">Balcão / Caixa</Label>
                 <p className="text-xs text-muted-foreground">Valores e pagamento</p>
               </div>
             </div>
             <Switch
               checked={templates.counter}
               onCheckedChange={(checked) => handleTemplateToggle('counter', checked)}
             />
           </div>
 
           <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
             <div className="flex items-center gap-3">
               <Truck className="w-5 h-5 text-green-500" />
               <div>
                 <Label className="font-medium">Entrega</Label>
                 <p className="text-xs text-muted-foreground">Endereço e troco</p>
               </div>
             </div>
             <Switch
               checked={templates.delivery}
               onCheckedChange={(checked) => handleTemplateToggle('delivery', checked)}
             />
           </div>
         </div>
       </div>
 
       {/* Extra Options */}
       <div className="bg-card rounded-2xl border p-6 space-y-4">
         <h3 className="font-semibold text-lg">Opções Extras</h3>
 
         <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
           <div>
             <Label className="font-medium">Mostrar preços na cozinha</Label>
             <p className="text-xs text-muted-foreground">
               Exibe valores dos itens na comanda da cozinha
             </p>
           </div>
           <Switch
             checked={formData.show_prices_on_kitchen ?? false}
             onCheckedChange={(checked) => handleChange('show_prices_on_kitchen', checked)}
           />
         </div>
 
         <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
           <div>
             <Label className="font-medium">QR para retirada</Label>
             <p className="text-xs text-muted-foreground">
               Exibe QR code para cliente confirmar retirada
             </p>
           </div>
           <Switch
             checked={formData.show_qr_pickup ?? true}
             onCheckedChange={(checked) => handleChange('show_qr_pickup', checked)}
           />
         </div>
 
         <div className="space-y-2">
           <Label>Mensagem no Rodapé</Label>
           <Textarea
             value={formData.footer_message || ''}
             onChange={(e) => handleChange('footer_message', e.target.value || null)}
             placeholder="Obrigado pela preferência!"
             rows={2}
           />
         </div>
       </div>
 
       {/* Actions */}
       <div className="flex flex-wrap gap-3">
         <Button
           onClick={handleSave}
           disabled={!hasChanges || updateSettings.isPending}
         >
           {updateSettings.isPending ? <LoadingSpinner size="sm" /> : 'Salvar Configurações'}
         </Button>
         <Button variant="outline" onClick={handleTestPrint}>
           <TestTube className="w-4 h-4 mr-2" />
           Testar Impressão
         </Button>
       </div>
     </div>
   );
 }