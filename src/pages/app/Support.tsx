 import { useState } from 'react';
 import { MessageCircle, ChevronDown, ChevronUp, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { cn } from '@/lib/utils';
 import { useAppConfig } from '@/contexts/AppConfigContext';
 import { useStoreSettings } from '@/hooks/useStoreSettings';
 import { Skeleton } from '@/components/ui/skeleton';

const faqs = [
  {
    question: 'Como rastrear meu pedido?',
    answer: 'Após o pedido sair para entrega, você verá um botão "Acompanhar" na página do pedido. Clique nele para ver a localização do motoboy em tempo real.',
  },
  {
    question: 'Posso cancelar meu pedido?',
    answer: 'Você pode cancelar seu pedido enquanto ele ainda não foi aceito pelo restaurante. Após aceito, entre em contato conosco para verificar a possibilidade.',
  },
  {
    question: 'Quais são as formas de pagamento?',
    answer: 'Aceitamos PIX, cartão de crédito/débito e dinheiro na entrega. Você pode escolher a forma de pagamento no checkout.',
  },
  {
    question: 'Qual o tempo de entrega?',
    answer: 'O tempo de entrega varia de acordo com a distância e a demanda. Em média, entregamos em 35-50 minutos.',
  },
  {
    question: 'Como usar um cupom de desconto?',
    answer: 'No carrinho de compras, você encontrará um campo para inserir o código do cupom. Digite o código e clique em "Aplicar".',
  },
];

 // Helper to format phone for WhatsApp link
 function formatWhatsAppLink(phone: string | null | undefined): string | null {
   if (!phone) return null;
   // Remove all non-numeric characters
   const cleaned = phone.replace(/\D/g, '');
   // Ensure it has country code (Brazil = 55)
   const withCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
   return `https://wa.me/${withCountry}`;
 }
 
 // Helper to format opening hours for display
 function formatOpeningHours(openingHours: any): string {
   if (!openingHours) return 'Horário não definido';
   
   try {
     const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
     const dayNames: Record<string, string> = {
       mon: 'Seg', tue: 'Ter', wed: 'Qua', thu: 'Qui', fri: 'Sex', sat: 'Sáb', sun: 'Dom'
     };
     
     // Group days by their hours
     const groups: Record<string, string[]> = {};
     
     for (const day of days) {
       const slots = openingHours[day];
       if (!slots || !Array.isArray(slots) || slots.length === 0) continue;
       
       const timeStr = slots.map((s: any) => `${s.start} às ${s.end}`).join(', ');
       if (!groups[timeStr]) groups[timeStr] = [];
       groups[timeStr].push(dayNames[day]);
     }
     
     // Format groups
     const parts: string[] = [];
     for (const [time, dayList] of Object.entries(groups)) {
       if (dayList.length === 1) {
         parts.push(`${dayList[0]}: ${time}`);
       } else {
         parts.push(`${dayList[0]}-${dayList[dayList.length - 1]}: ${time}`);
       }
     }
     
     return parts.join(' | ') || 'Horário não definido';
   } catch {
     return 'Horário não definido';
   }
 }
 
export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
   const { config, isLoading: isLoadingApp } = useAppConfig();
   const { data: storeSettings, isLoading: isLoadingStore } = useStoreSettings();
   
   const isLoading = isLoadingApp || isLoadingStore;
   
   const whatsappLink = formatWhatsAppLink(config?.support_whatsapp);
   const phoneNumber = storeSettings?.store_phone || config?.support_whatsapp;
   const email = config?.support_email;
   const openingHoursText = formatOpeningHours(storeSettings?.opening_hours);

  return (
    <div className="min-h-screen bg-background pb-8">
      <PageHeader title="Suporte" />

      <div className="px-4 space-y-6">
        {/* Contact Options */}
        <section>
          <h2 className="font-semibold mb-3">Fale Conosco</h2>
           {isLoading ? (
             <div className="grid grid-cols-2 gap-3">
               <Skeleton className="h-28 rounded-xl" />
               <Skeleton className="h-28 rounded-xl" />
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-3">
               {phoneNumber && (
                 <a 
                   href={`tel:${phoneNumber.replace(/\D/g, '')}`}
                   className="card-premium p-4 text-center hover:shadow-lg transition-shadow"
                 >
                   <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                     <Phone className="w-6 h-6 text-primary" />
                   </div>
                   <p className="font-medium text-sm">Ligar</p>
                   <p className="text-xs text-muted-foreground">{phoneNumber}</p>
                 </a>
               )}
               {whatsappLink && (
                 <a 
                   href={whatsappLink}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="card-premium p-4 text-center hover:shadow-lg transition-shadow"
                 >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <MessageCircle className="w-6 h-6 text-primary" />
                   </div>
                   <p className="font-medium text-sm flex items-center justify-center gap-1">
                     WhatsApp <ExternalLink className="w-3 h-3" />
                   </p>
                   <p className="text-xs text-muted-foreground">Resposta rápida</p>
                 </a>
               )}
               {!phoneNumber && !whatsappLink && (
                 <div className="col-span-2 text-center text-muted-foreground text-sm py-4">
                   Contato não configurado
                 </div>
               )}
             </div>
           )}
        </section>

        {/* Working Hours */}
         {isLoading ? (
           <Skeleton className="h-20 rounded-xl" />
         ) : (
           <section className="card-premium p-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                 <Clock className="w-5 h-5 text-primary" />
               </div>
               <div className="min-w-0">
                 <p className="font-medium">Horário de Funcionamento</p>
                 <p className="text-sm text-muted-foreground">
                   {openingHoursText}
                 </p>
               </div>
             </div>
           </section>
         )}

        {/* FAQ */}
        <section>
          <h2 className="font-semibold mb-3">Perguntas Frequentes</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="card-premium overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                <div
                  className={cn(
                    'px-4 overflow-hidden transition-all duration-200',
                    openFaq === index ? 'pb-4 max-h-40' : 'max-h-0'
                  )}
                >
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Email */}
         {isLoading ? (
           <Skeleton className="h-20 rounded-xl" />
         ) : email ? (
           <a 
             href={`mailto:${email}`}
             className="card-premium p-4 block hover:shadow-lg transition-shadow"
           >
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                 <Mail className="w-5 h-5 text-muted-foreground" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="font-medium">E-mail</p>
                 <p className="text-sm text-muted-foreground truncate">{email}</p>
               </div>
             </div>
           </a>
         ) : null}
      </div>
    </div>
  );
}
