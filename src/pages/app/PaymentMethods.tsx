 import { PageHeader } from '@/components/common/PageHeader';
 import { CreditCard, Plus, Wallet } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { EmptyState } from '@/components/common/EmptyState';
 
 export default function PaymentMethods() {
   // For now, this is a placeholder page showing available payment methods
   // In the future, this could integrate with Stripe to save cards
   
   const paymentOptions = [
     { icon: Wallet, label: 'PIX', description: 'Pagamento instantâneo' },
     { icon: CreditCard, label: 'Cartão de Crédito/Débito', description: 'Na entrega ou online' },
     { icon: Wallet, label: 'Dinheiro', description: 'Pagamento na entrega' },
   ];
 
   return (
     <div className="min-h-screen bg-background">
       <PageHeader title="Formas de Pagamento" />
 
       <div className="px-4 pb-8">
         <p className="text-muted-foreground text-sm mb-6">
           Formas de pagamento aceitas pela loja:
         </p>
 
         <div className="space-y-3">
           {paymentOptions.map(({ icon: Icon, label, description }) => (
             <div
               key={label}
               className="card-premium p-4 flex items-center gap-4"
             >
               <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                 <Icon className="w-6 h-6 text-primary" />
               </div>
               <div className="flex-1">
                 <p className="font-medium">{label}</p>
                 <p className="text-sm text-muted-foreground">{description}</p>
               </div>
             </div>
           ))}
         </div>
 
         <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
           <p className="text-sm text-muted-foreground text-center">
             💡 Você escolhe a forma de pagamento no momento do checkout.
           </p>
         </div>
       </div>
     </div>
   );
 }