 import { ShoppingBag } from 'lucide-react';
 import { useNavigate, useLocation } from 'react-router-dom';
 import { useCart } from '@/hooks/useCart';
 import { cn } from '@/lib/utils';
 
 export function FloatingCartButton() {
   const navigate = useNavigate();
   const location = useLocation();
   const { items, getTotal } = useCart();
   
   const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
   const total = getTotal();
   
   // Hide on cart page, checkout pages, product detail, and pizza builder
   const hiddenPaths = [
     '/app/cart',
     '/app/checkout',
     '/app/product/',
     '/app/pizza',
   ];
   const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
   
   if (cartCount === 0 || shouldHide) {
     return null;
   }
   
   return (
     <button
       onClick={() => navigate('/app/cart')}
       className={cn(
         "fixed bottom-24 right-4 z-40",
         "flex items-center gap-3 px-4 py-3 rounded-full",
         "bg-primary text-primary-foreground",
         "shadow-xl hover:shadow-2xl",
         "transform hover:scale-105 active:scale-95",
         "transition-all duration-200",
         "animate-fade-in"
       )}
       style={{ 
         boxShadow: '0 8px 32px -8px hsl(var(--primary) / 0.5)' 
       }}
     >
       <div className="relative">
         <ShoppingBag className="w-5 h-5" />
         <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-white text-primary text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
           {cartCount > 9 ? '9+' : cartCount}
         </span>
       </div>
       <span className="font-semibold text-sm">
         R$ {total.toFixed(2).replace('.', ',')}
       </span>
     </button>
   );
 }