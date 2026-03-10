import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItemOption {
  optionId: string;
  optionName: string;
  itemId: string;
  itemLabel: string;
  priceDelta: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  quantity: number;
  options: CartItemOption[];
  notes?: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemTotal: (item: CartItem) => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const id = `${item.productId}-${Date.now()}`;
        set((state) => ({
          items: [...state.items, { ...item, id }],
        }));
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getItemTotal: (item) => {
        const optionsTotal = item.options.reduce((sum, opt) => sum + opt.priceDelta, 0);
        return (item.basePrice + optionsTotal) * item.quantity;
      },
      
      getTotal: () => {
        const { items, getItemTotal } = get();
        return items.reduce((sum, item) => sum + getItemTotal(item), 0);
      },
    }),
    {
      name: 'pizza-cart',
    }
  )
);
