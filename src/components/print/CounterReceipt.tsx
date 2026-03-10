 import React from 'react';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { PrintStyles } from './PrintStyles';
 
 interface OrderItem {
   id: string;
   quantity: number;
   name_snapshot: string;
   options_snapshot: any;
   base_price: number;
   item_total: number;
 }
 
 interface CounterReceiptProps {
   order: {
     id: string;
     order_number: number;
     created_at: string;
     delivery_type: string;
     notes: string | null;
     subtotal: number;
     delivery_fee: number | null;
     discount: number | null;
     total: number;
     payment_method: string;
     payment_status: string;
     cash_change_needed?: boolean | null;
     cash_change_for?: number | null;
     cash_change_amount?: number | null;
     profiles?: { name?: string; phone?: string } | null;
   };
   items: OrderItem[];
   storeName?: string;
   storePhone?: string;
   paperSize?: '80mm' | '58mm';
   footerMessage?: string | null;
 }
 
 export function CounterReceipt({
   order,
   items,
   storeName = 'Pizzaria',
   storePhone,
   paperSize = '80mm',
   footerMessage,
 }: CounterReceiptProps) {
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
           <div className="print-bold print-large">{storeName}</div>
           {storePhone && <div className="print-small">📞 {storePhone}</div>}
           <div style={{ marginTop: '4px' }}>🧾 RECIBO / BALCÃO</div>
         </div>
 
         {/* Order Info */}
         <div className="print-section">
           <div className="print-row">
             <span className="print-bold">Pedido:</span>
             <span className="print-large print-bold">#{order.order_number}</span>
           </div>
           <div className="print-row">
             <span>Data:</span>
             <span>{format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
           </div>
           <div className="print-row">
             <span>Tipo:</span>
             <span>{order.delivery_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}</span>
           </div>
         </div>
 
         {/* Customer */}
         {order.profiles && (
           <div className="print-section">
             <div className="print-bold">Cliente:</div>
             <div>{order.profiles.name || 'Cliente'}</div>
             {order.profiles.phone && <div>📞 {order.profiles.phone}</div>}
           </div>
         )}
 
         <hr className="print-cut" />
 
         {/* Items */}
         <div className="print-section">
           <div className="print-bold" style={{ marginBottom: '4px' }}>ITENS:</div>
           {items.map((item) => (
             <div key={item.id} className="print-item">
               <div className="print-row">
                 <span>{item.quantity}x {item.name_snapshot}</span>
                 <span>R$ {item.item_total.toFixed(2).replace('.', ',')}</span>
               </div>
               {item.options_snapshot && Array.isArray(item.options_snapshot) && item.options_snapshot.length > 0 && (
                 <div className="print-small" style={{ marginLeft: '8px' }}>
                   {item.options_snapshot.map((opt: any, idx: number) => (
                     <div key={idx}>
                       • {opt.optionName || opt.type}: {opt.itemLabel || opt.label}
                       {opt.priceDelta > 0 && ` (+R$ ${opt.priceDelta.toFixed(2).replace('.', ',')})`}
                     </div>
                   ))}
                 </div>
               )}
             </div>
           ))}
         </div>
 
         <hr className="print-cut" />
 
         {/* Totals */}
         <div className="print-section">
           <div className="print-row">
             <span>Subtotal:</span>
             <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
           </div>
           {order.delivery_type === 'delivery' && (
             <div className="print-row">
               <span>Taxa de entrega:</span>
               <span>R$ {(order.delivery_fee || 0).toFixed(2).replace('.', ',')}</span>
             </div>
           )}
           {(order.discount || 0) > 0 && (
             <div className="print-row">
               <span>Desconto:</span>
               <span>-R$ {order.discount!.toFixed(2).replace('.', ',')}</span>
             </div>
           )}
           <div className="print-row print-bold print-large" style={{ marginTop: '4px' }}>
             <span>TOTAL:</span>
             <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
           </div>
         </div>
 
         {/* Payment */}
         <div className="print-section">
           <div className="print-row">
             <span>Pagamento:</span>
             <span className="print-bold">{paymentLabel}</span>
           </div>
           <div className="print-row">
             <span>Status:</span>
             <span className={order.payment_status === 'paid' ? 'print-bold' : ''}>
               {order.payment_status === 'paid' ? '✅ PAGO' : '⏳ PENDENTE'}
             </span>
           </div>
         </div>
 
         {/* Cash Change */}
         {order.payment_method === 'cash' && order.cash_change_needed && (
           <div className="print-highlight">
             <div className="print-bold">💵 TROCO</div>
             <div className="print-row">
               <span>Troco para:</span>
               <span>R$ {(order.cash_change_for || 0).toFixed(2).replace('.', ',')}</span>
             </div>
             <div className="print-row print-bold">
               <span>Troco:</span>
               <span>R$ {(order.cash_change_amount || 0).toFixed(2).replace('.', ',')}</span>
             </div>
           </div>
         )}
 
         <hr className="print-cut" />
 
         {/* Footer */}
         <div className="print-center">
           {footerMessage && <div className="print-small">{footerMessage}</div>}
           <div className="print-small" style={{ marginTop: '4px' }}>
             Obrigado pela preferência!
           </div>
           <div className="print-small">
             {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
           </div>
         </div>
       </div>
     </>
   );
 }