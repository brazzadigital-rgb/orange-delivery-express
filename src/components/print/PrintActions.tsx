 import React, { useState } from 'react';
 import { Printer, ChefHat, Receipt, Truck, Check, RotateCw } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
   DropdownMenuSeparator,
 } from '@/components/ui/dropdown-menu';
 import { useCreatePrintJob, useHasPrintedTemplate } from '@/hooks/usePrintSettings';
 import { cn } from '@/lib/utils';
 
 interface PrintActionsProps {
   orderId: string;
   orderNumber: number;
   compact?: boolean;
   showLabels?: boolean;
 }
 
 export function PrintActions({ orderId, orderNumber, compact = false, showLabels = true }: PrintActionsProps) {
   const createPrintJob = useCreatePrintJob();
   
   const { data: kitchenPrinted } = useHasPrintedTemplate(orderId, 'kitchen');
   const { data: counterPrinted } = useHasPrintedTemplate(orderId, 'counter');
   const { data: deliveryPrinted } = useHasPrintedTemplate(orderId, 'delivery');
 
   const handlePrint = async (template: 'kitchen' | 'counter' | 'delivery', isReprint = false) => {
     try {
       const job = await createPrintJob.mutateAsync({
         orderId,
         template,
         isReprint,
       });
 
       // Open print view in new window
       const printUrl = `/admin/print/order/${orderId}?template=${template}&auto=true&jobId=${job.id}`;
       const printWindow = window.open(printUrl, `print-${orderId}-${template}`, 'width=400,height=600');
       
       if (!printWindow) {
         // Popup blocked - navigate instead
         window.location.href = printUrl.replace('&auto=true', '');
       }
     } catch (error) {
       console.error('Print error:', error);
     }
   };
 
   if (compact) {
     return (
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button size="sm" variant="outline" className="gap-1">
             <Printer className="w-4 h-4" />
             {showLabels && 'Imprimir'}
             {(kitchenPrinted || counterPrinted || deliveryPrinted) && (
               <Check className="w-3 h-3 text-success" />
             )}
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
           <DropdownMenuItem onClick={() => handlePrint('kitchen', !!kitchenPrinted)}>
             <ChefHat className="w-4 h-4 mr-2" />
             Cozinha
             {kitchenPrinted && <Check className="w-3 h-3 ml-auto text-success" />}
           </DropdownMenuItem>
           <DropdownMenuItem onClick={() => handlePrint('counter', !!counterPrinted)}>
             <Receipt className="w-4 h-4 mr-2" />
             Balcão
             {counterPrinted && <Check className="w-3 h-3 ml-auto text-success" />}
           </DropdownMenuItem>
           <DropdownMenuItem onClick={() => handlePrint('delivery', !!deliveryPrinted)}>
             <Truck className="w-4 h-4 mr-2" />
             Entrega
             {deliveryPrinted && <Check className="w-3 h-3 ml-auto text-success" />}
           </DropdownMenuItem>
           {(kitchenPrinted || counterPrinted || deliveryPrinted) && (
             <>
               <DropdownMenuSeparator />
               <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
                 <RotateCw className="w-3 h-3 mr-2" />
                 Clique para reimprimir
               </DropdownMenuItem>
             </>
           )}
         </DropdownMenuContent>
       </DropdownMenu>
     );
   }
 
   return (
     <div className="flex flex-wrap gap-2">
       <Button
         size="sm"
         variant="outline"
         onClick={() => handlePrint('kitchen', !!kitchenPrinted)}
         disabled={createPrintJob.isPending}
         className={cn(kitchenPrinted && "border-success/50")}
       >
         <ChefHat className="w-4 h-4 mr-1" />
         Cozinha
         {kitchenPrinted && <Check className="w-3 h-3 ml-1 text-success" />}
       </Button>
       <Button
         size="sm"
         variant="outline"
         onClick={() => handlePrint('counter', !!counterPrinted)}
         disabled={createPrintJob.isPending}
         className={cn(counterPrinted && "border-success/50")}
       >
         <Receipt className="w-4 h-4 mr-1" />
         Balcão
         {counterPrinted && <Check className="w-3 h-3 ml-1 text-success" />}
       </Button>
       <Button
         size="sm"
         variant="outline"
         onClick={() => handlePrint('delivery', !!deliveryPrinted)}
         disabled={createPrintJob.isPending}
         className={cn(deliveryPrinted && "border-success/50")}
       >
         <Truck className="w-4 h-4 mr-1" />
         Entrega
         {deliveryPrinted && <Check className="w-3 h-3 ml-1 text-success" />}
       </Button>
     </div>
   );
 }