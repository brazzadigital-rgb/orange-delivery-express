 import React from 'react';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { PrintStyles } from './PrintStyles';
 
 interface OrderItem {
   id: string;
   quantity: number;
   name_snapshot: string;
 }
 
 interface DeliverySlipProps {
   order: {
     id: string;
     order_number: number;
     created_at: string;
     notes: string | null;
     total: number;
     payment_method: string;
     payment_status: string;
     cash_change_needed?: boolean | null;
     cash_change_for?: number | null;
     cash_change_amount?: number | null;
     address_snapshot?: {
       label?: string;
       street?: string;
       number?: string;
       complement?: string;
       neighborhood?: string;
       city?: string;
       reference?: string;
     } | null;
     profiles?: { name?: string; phone?: string } | null;
     estimated_minutes?: number | null;
   };
   items: OrderItem[];
   driverName?: string;
   paperSize?: '80mm' | '58mm';
  departureTime?: string | null;
  deliveryTime?: string | null;
 }
 
 export function DeliverySlip({
   order,
   items,
   driverName,
   paperSize = '80mm',
  departureTime,
  deliveryTime,
 }: DeliverySlipProps) {
   const address = order.address_snapshot;
   
   const paymentLabel = {
     pix: 'PIX',
     card: 'Cartão',
     cash: 'Dinheiro',
   }[order.payment_method] || order.payment_method;
 
   return (
     <>
       <PrintStyles paperSize={paperSize} />
       <div className="print-container">
         {/* Header */}
         <div className="print-header">
           <div className="print-large print-bold">🛵 ENTREGA</div>
           <div className="print-large print-bold">#{order.order_number}</div>
         </div>
 
         {/* Address - MOST IMPORTANT */}
         {address && (
           <div className="print-highlight">
             <div className="print-bold">📍 ENDEREÇO:</div>
             <div className="print-bold">{address.street}, {address.number}</div>
             {address.complement && <div>{address.complement}</div>}
             <div>{address.neighborhood}</div>
             <div>{address.city}</div>
             {address.label && address.label !== 'Casa' && (
               <div className="print-small">({address.label})</div>
             )}
           </div>
         )}
 
         {/* Customer */}
         <div className="print-section">
           <div className="print-bold">👤 CLIENTE:</div>
           <div>{order.profiles?.name || 'Cliente'}</div>
           {order.profiles?.phone && (
             <div className="print-bold">📞 {order.profiles.phone}</div>
           )}
         </div>
 
         <hr className="print-cut" />
 
         {/* Items Summary */}
         <div className="print-section">
           <div className="print-bold">ITENS ({items.length}):</div>
           {items.map((item) => (
             <div key={item.id}>
               • {item.quantity}x {item.name_snapshot}
             </div>
           ))}
         </div>
 
         {/* Notes */}
         {order.notes && (
           <div className="print-highlight" style={{ marginBottom: '8px' }}>
             <div className="print-bold">⚠️ OBS:</div>
             <div>{order.notes}</div>
           </div>
         )}
 
         <hr className="print-cut" />
 
         {/* Payment Info */}
         <div className="print-section">
           <div className="print-row">
             <span className="print-bold">TOTAL:</span>
             <span className="print-bold print-large">R$ {order.total.toFixed(2).replace('.', ',')}</span>
           </div>
           <div className="print-row">
             <span>Pagamento:</span>
             <span>{paymentLabel} {order.payment_status === 'paid' ? '(PAGO)' : '(PENDENTE)'}</span>
           </div>
         </div>
 
         {/* Cash Change - HIGHLIGHTED */}
         {order.payment_method === 'cash' && order.cash_change_needed && (
           <div className="print-highlight">
             <div className="print-bold print-large">💵 LEVAR TROCO!</div>
             <div className="print-row">
               <span>Troco para:</span>
               <span className="print-bold">R$ {(order.cash_change_for || 0).toFixed(2).replace('.', ',')}</span>
             </div>
             <div className="print-row print-bold">
               <span>Troco:</span>
               <span className="print-large">R$ {(order.cash_change_amount || 0).toFixed(2).replace('.', ',')}</span>
             </div>
           </div>
         )}
 
         <hr className="print-cut" />
 
         {/* Driver Fields */}
         <div className="print-section">
           <div className="print-row">
             <span>Motoboy:</span>
             <span>{driverName || '________________'}</span>
           </div>
           <div className="print-row" style={{ marginTop: '8px' }}>
             <span>Saída:</span>
              <span>{departureTime || '____:____'}</span>
           </div>
           <div className="print-row">
             <span>Entrega:</span>
              <span>{deliveryTime || '____:____'}</span>
           </div>
         </div>
 
         {order.estimated_minutes && (
           <div className="print-center print-small">
             ⏱️ Tempo estimado: {order.estimated_minutes} min
           </div>
         )}
 
         <div className="print-center print-small" style={{ marginTop: '8px' }}>
           {format(new Date(), "dd/MM/yyyy HH:mm")}
         </div>
       </div>
     </>
   );
 }