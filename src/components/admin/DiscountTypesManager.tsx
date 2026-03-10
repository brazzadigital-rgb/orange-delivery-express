 import { useState, useEffect } from 'react';
 import { Settings, Plus, Edit2, Trash2, Percent, DollarSign, Truck, Gift, Sparkles } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from '@/components/ui/dialog';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
 } from '@/components/ui/alert-dialog';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 
 export interface DiscountType {
   id: string;
   value: string;
   label: string;
   icon: 'percent' | 'dollar' | 'truck' | 'gift' | 'sparkles';
   isDefault?: boolean;
 }
 
 const DEFAULT_DISCOUNT_TYPES: DiscountType[] = [
   { id: '1', value: 'percent', label: 'Porcentagem', icon: 'percent', isDefault: true },
   { id: '2', value: 'value', label: 'Valor fixo', icon: 'dollar', isDefault: true },
   { id: '3', value: 'free_delivery', label: 'Frete grátis', icon: 'truck', isDefault: true },
   { id: '4', value: 'combo', label: 'Combo especial', icon: 'gift', isDefault: true },
 ];
 
 const STORAGE_KEY = 'custom_discount_types';
 
 const iconMap = {
   percent: Percent,
   dollar: DollarSign,
   truck: Truck,
   gift: Gift,
   sparkles: Sparkles,
 };
 
 const iconOptions = [
   { value: 'percent', label: 'Porcentagem', Icon: Percent },
   { value: 'dollar', label: 'Dinheiro', Icon: DollarSign },
   { value: 'truck', label: 'Entrega', Icon: Truck },
   { value: 'gift', label: 'Presente', Icon: Gift },
   { value: 'sparkles', label: 'Especial', Icon: Sparkles },
 ];
 
 export function getDiscountTypes(): DiscountType[] {
   try {
     const stored = localStorage.getItem(STORAGE_KEY);
     const customTypes = stored ? JSON.parse(stored) : [];
     return [...DEFAULT_DISCOUNT_TYPES, ...customTypes];
   } catch {
     return DEFAULT_DISCOUNT_TYPES;
   }
 }
 
 export function DiscountTypesManager() {
   const [isOpen, setIsOpen] = useState(false);
   const [isFormOpen, setIsFormOpen] = useState(false);
   const [customTypes, setCustomTypes] = useState<DiscountType[]>([]);
   const [editingType, setEditingType] = useState<DiscountType | null>(null);
   const [formData, setFormData] = useState({
     label: '',
     value: '',
     icon: 'sparkles' as DiscountType['icon'],
   });
 
   useEffect(() => {
     try {
       const stored = localStorage.getItem(STORAGE_KEY);
       if (stored) {
         setCustomTypes(JSON.parse(stored));
       }
     } catch {
       setCustomTypes([]);
     }
   }, []);
 
   const saveToStorage = (types: DiscountType[]) => {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
     setCustomTypes(types);
   };
 
   const generateValue = (label: string) => {
     return label
       .toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-z0-9]+/g, '_')
       .replace(/(^_|_$)/g, '');
   };
 
   const handleOpenForm = (type?: DiscountType) => {
     if (type) {
       setEditingType(type);
       setFormData({
         label: type.label,
         value: type.value,
         icon: type.icon,
       });
     } else {
       setEditingType(null);
       setFormData({ label: '', value: '', icon: 'sparkles' });
     }
     setIsFormOpen(true);
   };
 
   const handleSave = () => {
     if (!formData.label.trim()) {
       toast.error('Informe o nome do tipo de desconto');
       return;
     }
 
     const value = formData.value || generateValue(formData.label);
     
     // Check for duplicates
     const allTypes = getDiscountTypes();
     const isDuplicate = allTypes.some(
       (t) => t.value === value && t.id !== editingType?.id
     );
     
     if (isDuplicate) {
       toast.error('Já existe um tipo de desconto com esse identificador');
       return;
     }
 
     if (editingType) {
       const updated = customTypes.map((t) =>
         t.id === editingType.id
           ? { ...t, label: formData.label, value, icon: formData.icon }
           : t
       );
       saveToStorage(updated);
       toast.success('Tipo de desconto atualizado!');
     } else {
       const newType: DiscountType = {
         id: `custom_${Date.now()}`,
         label: formData.label,
         value,
         icon: formData.icon,
       };
       saveToStorage([...customTypes, newType]);
       toast.success('Tipo de desconto criado!');
     }
 
     setIsFormOpen(false);
     setEditingType(null);
   };
 
   const handleDelete = (id: string) => {
     const updated = customTypes.filter((t) => t.id !== id);
     saveToStorage(updated);
     toast.success('Tipo de desconto removido!');
   };
 
   const allTypes = [...DEFAULT_DISCOUNT_TYPES, ...customTypes];
 
   return (
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
       <DialogTrigger asChild>
         <Button variant="outline" size="sm">
           <Settings className="w-4 h-4 mr-2" />
           Tipos de Desconto
         </Button>
       </DialogTrigger>
       <DialogContent className="sm:max-w-lg">
         <DialogHeader>
           <DialogTitle>Gerenciar Tipos de Desconto</DialogTitle>
           <DialogDescription>
             Configure os tipos de desconto disponíveis para suas promoções.
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-3 my-4 max-h-80 overflow-y-auto">
           {allTypes.map((type) => {
             const Icon = iconMap[type.icon];
             return (
               <div
                 key={type.id}
                 className={cn(
                   'flex items-center justify-between p-3 rounded-lg border',
                   type.isDefault ? 'bg-muted/50' : 'bg-background'
                 )}
               >
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                     <Icon className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                     <p className="font-medium">{type.label}</p>
                     <p className="text-xs text-muted-foreground">{type.value}</p>
                   </div>
                 </div>
                 
                 {type.isDefault ? (
                   <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                     Padrão
                   </span>
                 ) : (
                   <div className="flex items-center gap-1">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleOpenForm(type)}
                     >
                       <Edit2 className="w-4 h-4" />
                     </Button>
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="sm" className="text-destructive">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Excluir tipo de desconto?</AlertDialogTitle>
                           <AlertDialogDescription>
                             Esta ação não pode ser desfeita. Promoções que usam este tipo não serão afetadas.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancelar</AlertDialogCancel>
                           <AlertDialogAction
                             onClick={() => handleDelete(type.id)}
                             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                           >
                             Excluir
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                   </div>
                 )}
               </div>
             );
           })}
         </div>
 
         <DialogFooter>
           <Button onClick={() => handleOpenForm()} className="w-full">
             <Plus className="w-4 h-4 mr-2" />
             Novo Tipo de Desconto
           </Button>
         </DialogFooter>
 
         {/* Form Dialog */}
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
           <DialogContent className="sm:max-w-md">
             <DialogHeader>
               <DialogTitle>
                 {editingType ? 'Editar Tipo de Desconto' : 'Novo Tipo de Desconto'}
               </DialogTitle>
             </DialogHeader>
 
             <div className="space-y-4 py-4">
               <div>
                 <Label htmlFor="label">Nome *</Label>
                 <Input
                   id="label"
                   value={formData.label}
                   onChange={(e) => {
                     setFormData({
                       ...formData,
                       label: e.target.value,
                       value: generateValue(e.target.value),
                     });
                   }}
                   placeholder="Ex: Desconto especial"
                   className="mt-1"
                 />
               </div>
 
               <div>
                 <Label htmlFor="value">Identificador</Label>
                 <Input
                   id="value"
                   value={formData.value}
                   onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                   placeholder="desconto_especial"
                   className="mt-1 font-mono text-sm"
                 />
                 <p className="text-xs text-muted-foreground mt-1">
                   Usado internamente para identificar o tipo
                 </p>
               </div>
 
               <div>
                 <Label>Ícone</Label>
                 <RadioGroup
                   value={formData.icon}
                   onValueChange={(value) => setFormData({ ...formData, icon: value as DiscountType['icon'] })}
                   className="grid grid-cols-5 gap-2 mt-2"
                 >
                   {iconOptions.map((option) => (
                     <div key={option.value}>
                       <RadioGroupItem
                         value={option.value}
                         id={`icon-${option.value}`}
                         className="peer sr-only"
                       />
                       <Label
                         htmlFor={`icon-${option.value}`}
                         className={cn(
                           'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors',
                           'hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5'
                         )}
                       >
                         <option.Icon className="w-5 h-5 text-primary" />
                       </Label>
                     </div>
                   ))}
                 </RadioGroup>
               </div>
             </div>
 
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                 Cancelar
               </Button>
               <Button onClick={handleSave}>
                 {editingType ? 'Salvar' : 'Criar'}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </DialogContent>
     </Dialog>
   );
 }