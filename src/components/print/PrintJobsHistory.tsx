 import React from 'react';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { ChefHat, Receipt, Truck, Check, X, Clock, RotateCw } from 'lucide-react';
 import { useOrderPrintJobs } from '@/hooks/usePrintSettings';
 import { cn } from '@/lib/utils';
 
 interface PrintJobsHistoryProps {
   orderId: string;
 }
 
 export function PrintJobsHistory({ orderId }: PrintJobsHistoryProps) {
   const { data: jobs, isLoading } = useOrderPrintJobs(orderId);
 
   if (isLoading) {
     return <div className="text-sm text-muted-foreground">Carregando...</div>;
   }
 
   if (!jobs || jobs.length === 0) {
     return (
       <div className="text-sm text-muted-foreground text-center py-4">
         Nenhuma impressão realizada
       </div>
     );
   }
 
   const templateIcons = {
     kitchen: ChefHat,
     counter: Receipt,
     delivery: Truck,
   };
 
   const templateLabels = {
     kitchen: 'Cozinha',
     counter: 'Balcão',
     delivery: 'Entrega',
   };
 
   const statusIcons = {
     queued: Clock,
     printed: Check,
     failed: X,
   };
 
   const statusColors = {
     queued: 'text-amber-500',
     printed: 'text-success',
     failed: 'text-destructive',
   };
 
   return (
     <div className="space-y-2">
       {jobs.map((job) => {
         const TemplateIcon = templateIcons[job.template];
         const StatusIcon = statusIcons[job.status];
 
         return (
           <div
             key={job.id}
             className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg text-sm"
           >
             <div className="flex items-center gap-2">
               <TemplateIcon className="w-4 h-4 text-muted-foreground" />
               <span>{templateLabels[job.template]}</span>
               {job.is_reprint && (
                 <span className="flex items-center gap-1 text-xs text-muted-foreground">
                   <RotateCw className="w-3 h-3" />
                   reimpr.
                 </span>
               )}
             </div>
             <div className="flex items-center gap-2">
               <StatusIcon className={cn("w-4 h-4", statusColors[job.status])} />
               <span className="text-xs text-muted-foreground">
                 {job.printed_at
                   ? format(new Date(job.printed_at), "dd/MM HH:mm", { locale: ptBR })
                   : format(new Date(job.created_at), "dd/MM HH:mm", { locale: ptBR })}
               </span>
             </div>
           </div>
         );
       })}
     </div>
   );
 }