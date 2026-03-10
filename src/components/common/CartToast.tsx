 import { ShoppingCart, Check, ChevronRight } from 'lucide-react';
 import { toast as sonnerToast } from 'sonner';
 
 interface CartToastProps {
   productName: string;
   quantity?: number;
   imageUrl?: string | null;
 }
 
 export function showCartToast({ productName, quantity = 1, imageUrl }: CartToastProps) {
   sonnerToast.custom(
     (id) => (
       <CartToastContent 
         id={id} 
         productName={productName} 
         quantity={quantity} 
         imageUrl={imageUrl}
       />
     ),
     {
       duration: 4000,
       position: 'bottom-center',
     }
   );
 }
 
 function CartToastContent({ 
   id, 
   productName, 
   quantity,
   imageUrl 
 }: CartToastProps & { id: string | number }) {
   const handleViewCart = () => {
    try {
      sonnerToast.dismiss(id);
      // Use window.location instead of useNavigate to avoid Router context issues
      window.location.href = '/app/cart';
    } catch (error) {
      console.error('Error navigating to cart:', error);
    }
   };
   
   return (
     <div 
       className="w-full max-w-md mx-auto animate-slide-up"
       style={{ 
         animation: 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
       }}
     >
       <div 
         className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 shadow-elevated backdrop-blur-sm"
         style={{ 
           boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
         }}
       >
         {/* Success icon or product image */}
         <div className="relative flex-shrink-0">
           {imageUrl ? (
             <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted">
               <img 
                 src={imageUrl} 
                 alt={productName}
                 className="w-full h-full object-cover"
               />
               {/* Success badge */}
               <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center shadow-lg">
                 <Check className="w-3 h-3 text-success-foreground" />
               </div>
             </div>
           ) : (
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
               <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                 <Check className="w-5 h-5 text-success-foreground" />
               </div>
             </div>
           )}
         </div>
         
         {/* Content */}
         <div className="flex-1 min-w-0">
           <p className="text-sm font-semibold text-foreground truncate">
             Adicionado ao carrinho!
           </p>
           <p className="text-xs text-muted-foreground truncate mt-0.5">
             {quantity > 1 ? `${quantity}x ` : ''}{productName}
           </p>
         </div>
         
         {/* CTA Button */}
         <button
           onClick={handleViewCart}
           className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95"
           style={{ 
             boxShadow: '0 4px 12px -2px hsl(var(--primary) / 0.4)'
           }}
         >
           <ShoppingCart className="w-4 h-4" />
           <span>Ver</span>
           <ChevronRight className="w-3.5 h-3.5 -mr-1" />
         </button>
       </div>
     </div>
   );
 }