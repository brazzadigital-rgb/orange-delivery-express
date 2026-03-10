import { useState } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import { useCreateInternalTableOrder, TableSessionEnriched } from '@/hooks/useTableSessions';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CartItem {
  productId: string;
  name: string;
  basePrice: number;
  quantity: number;
}

interface AddItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: TableSessionEnriched;
  onSuccess: () => void;
}

export function AddItemsModal({ open, onOpenChange, session, onSuccess }: AddItemsModalProps) {
  const { data: products } = useProducts();
  const createOrder = useCreateInternalTableOrder();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, basePrice: product.base_price, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      return newQty > 0 ? { ...i, quantity: newQty } : i;
    }).filter(i => i.quantity > 0));
  };

  const getTotal = () => cart.reduce((sum, i) => sum + i.basePrice * i.quantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    await createOrder.mutateAsync({
      storeId: session.store_id,
      tableId: session.table_id,
      sessionId: session.id,
      notes: notes || undefined,
      items: cart.map(i => ({
        product_id: i.productId,
        name_snapshot: i.name,
        quantity: i.quantity,
        base_price: i.basePrice,
        options_snapshot: [],
        item_total: i.basePrice * i.quantity,
      })),
    });
    setCart([]);
    setNotes('');
    onSuccess();
  };

  const filteredProducts = (products || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Itens à Mesa {(session.restaurant_tables as any)?.number}</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-2"
        />

        <ScrollArea className="flex-1 max-h-[40vh]">
          <div className="space-y-2 pr-4">
            {filteredProducts.map(product => {
              const cartItem = cart.find(i => i.productId === product.id);
              return (
                <div key={product.id} className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-primary font-bold">R$ {product.base_price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {cartItem ? (
                      <>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(product.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-bold">{cartItem.quantity}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(product.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addToCart(product)}>
                        <Plus className="w-3 h-3 mr-1" />Adicionar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {cart.length > 0 && (
          <div className="border-t border-border pt-3 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-1">
              <ShoppingCart className="w-4 h-4" /> Itens selecionados
            </h4>
            {cart.map(item => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-medium">R$ {(item.basePrice * item.quantity).toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
            <Input
              placeholder="Observações (opcional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="flex justify-between font-bold pt-1">
              <span>Total:</span>
              <span className="text-primary">R$ {getTotal().toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={cart.length === 0 || createOrder.isPending}>
            {createOrder.isPending ? 'Enviando...' : `Confirmar (R$ ${getTotal().toFixed(2).replace('.', ',')})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
