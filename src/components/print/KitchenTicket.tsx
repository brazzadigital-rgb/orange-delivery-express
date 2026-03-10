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
 
 interface KitchenTicketProps {
   order: {
     id: string;
     order_number: number;
     created_at: string;
     delivery_type: string;
     notes: string | null;
     estimated_minutes?: number | null;
   };
   items: OrderItem[];
   storeName?: string;
   paperSize?: '80mm' | '58mm';
   showPrices?: boolean;
 }
 
 export function KitchenTicket({
   order,
   items,
   storeName = 'Pizzaria',
   paperSize = '80mm',
   showPrices = false,
 }: KitchenTicketProps) {
   const renderPizzaDetails = (options: any) => {
     if (!options || !Array.isArray(options)) return null;
 
     // Check if it's a pizza_v2 item
     const sizeOption = options.find((o: any) => o.optionName?.toLowerCase().includes('tamanho') || o.type === 'size');
     const flavors = options.filter((o: any) => o.optionName?.toLowerCase().includes('sabor') || o.type === 'flavor');
     const border = options.find((o: any) => o.optionName?.toLowerCase().includes('borda') || o.type === 'border');
     const addons = options.filter((o: any) => o.optionName?.toLowerCase().includes('adicional') || o.type === 'addon');
     const observations = options.filter((o: any) => o.type === 'observation' || o.optionName?.toLowerCase().includes('observ'));
 
     if (sizeOption || flavors.length > 0) {
       return (
         <div className="print-small" style={{ marginLeft: '8px' }}>
           {sizeOption && <div>📏 {sizeOption.itemLabel || sizeOption.label}</div>}
           {flavors.length > 0 && (
             <div>
               🍕 Sabores:
               {flavors.map((f: any, idx: number) => (
                 <div key={idx} style={{ marginLeft: '8px' }}>
                   • {f.itemLabel || f.label || f.name}
                   {f.observation && <div style={{ marginLeft: '12px', fontStyle: 'italic' }}>"{f.observation}"</div>}
                 </div>
               ))}
             </div>
           )}
           {border && <div>🔴 Borda: {border.itemLabel || border.label}</div>}
           {addons.length > 0 && (
             <div>
               ➕ Adicionais:
               {addons.map((a: any, idx: number) => (
                 <div key={idx} style={{ marginLeft: '8px' }}>
                   • {a.quantity || 1}x {a.itemLabel || a.label || a.name}
                 </div>
               ))}
             </div>
           )}
           {observations.length > 0 && observations.map((obs: any, idx: number) => (
             <div key={idx} className="print-obs">⚠️ {obs.itemLabel || obs.label || obs.text}</div>
           ))}
         </div>
       );
     }
 
     // Regular product options
     return (
       <div className="print-small" style={{ marginLeft: '8px' }}>
         {options.map((opt: any, idx: number) => (
           <div key={idx}>• {opt.optionName}: {opt.itemLabel}</div>
         ))}
       </div>
     );
   };
 
   return (
     <>
       <PrintStyles paperSize={paperSize} />
       <div className="print-container">
         {/* Header */}
         <div className="print-header">
           <div className="print-bold">{storeName}</div>
           <div className="print-large print-bold">🍳 COZINHA</div>
         </div>
 
         {/* Order Info */}
         <div className="print-section">
           <div className="print-row">
             <span className="print-large print-bold">#{order.order_number}</span>
             <span>{order.delivery_type === 'delivery' ? '🛵 ENTREGA' : '🏪 RETIRADA'}</span>
           </div>
           <div className="print-small">
             {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
           </div>
           {order.estimated_minutes && (
             <div className="print-small">⏱️ Tempo estimado: {order.estimated_minutes} min</div>
           )}
         </div>
 
         <hr className="print-cut" />
 
         {/* Items */}
         <div className="print-section">
           <div className="print-bold" style={{ marginBottom: '8px' }}>ITENS:</div>
           {items.map((item) => (
             <div key={item.id} className="print-item">
               <div className="print-row">
                 <span className="print-bold">{item.quantity}x {item.name_snapshot}</span>
                 {showPrices && <span>R$ {item.item_total.toFixed(2).replace('.', ',')}</span>}
               </div>
               {renderPizzaDetails(item.options_snapshot)}
             </div>
           ))}
         </div>
 
         {/* Notes */}
         {order.notes && (
           <>
             <hr className="print-cut" />
             <div className="print-highlight">
               <div className="print-bold">⚠️ OBSERVAÇÕES DO PEDIDO:</div>
               <div>{order.notes}</div>
             </div>
           </>
         )}
 
         <hr className="print-cut" />
 
         <div className="print-center print-small">
           Impresso em: {format(new Date(), "dd/MM HH:mm:ss")}
         </div>
       </div>
     </>
   );
 }