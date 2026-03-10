import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Send, Eye, Clock, User, Pizza } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTableSessionDetail, useRecalcSessionTotal } from '@/hooks/useTableSessions';
import { useCreateWaiterTableOrder } from '@/hooks/useWaiterTableActions';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { WaiterPizzaBuilderModal } from '@/components/waiter/WaiterPizzaBuilderModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CartItem {
  productId: string;
  name: string;
  basePrice: number;
  quantity: number;
  options_snapshot?: any;
}

export default function WaiterTableSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useTableSessionDetail(id || '');
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const createOrder = useCreateWaiterTableOrder();
  const recalc = useRecalcSessionTotal();

  const [mode, setMode] = useState<'view' | 'add'>('view');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pizzaBuilderOpen, setPizzaBuilderOpen] = useState(false);

  // Auto-recalc
  useEffect(() => {
    if (id && data?.orders) recalc.mutate(id);
  }, [id, data?.orders?.length]);

  if (isLoading || !data) return <div className="p-4"><LoadingSpinner /></div>;

  const { session, orders } = data;
  const tableNum = (session.restaurant_tables as any)?.number || '?';
  const totalAmount = orders
    .filter(o => o.status !== 'canceled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, basePrice: product.base_price, quantity: 1 }];
    });
  };

  const addPizzaToCart = (pizza: { name: string; basePrice: number; quantity: number; options_snapshot: any }) => {
    const pizzaId = `pizza_${Date.now()}`;
    setCart(prev => [
      ...prev,
      {
        productId: pizzaId,
        name: pizza.name,
        basePrice: pizza.basePrice,
        quantity: pizza.quantity,
        options_snapshot: pizza.options_snapshot,
      },
    ]);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      return { ...i, quantity: newQty };
    }).filter(i => i.quantity > 0));
  };

  const getCartTotal = () => cart.reduce((sum, i) => sum + i.basePrice * i.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    await createOrder.mutateAsync({
      storeId: session.store_id,
      tableId: session.table_id,
      sessionId: session.id,
      notes: notes || undefined,
      items: cart.map(i => ({
        product_id: i.productId.startsWith('pizza_') ? null : i.productId,
        name_snapshot: i.name,
        quantity: i.quantity,
        base_price: i.basePrice,
        options_snapshot: i.options_snapshot || [],
        item_total: i.basePrice * i.quantity,
      })),
    });
    setCart([]);
    setNotes('');
    setMode('view');
    refetch();
    toast.success('Pedido enviado para a cozinha!');
  };

  const filteredProducts = (products || []).filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || p.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  // View mode: show session summary and orders
  if (mode === 'view') {
    return (
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/waiter/tables')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Mesa {String(tableNum).padStart(2, '0')}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {session.customer_name || 'Cliente'}
              </span>
              {session.customer_phone && <span>📞 {session.customer_phone}</span>}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(session.opened_at), "HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>

        {/* Total card */}
        <div className="card-premium p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total da Comanda</p>
            <p className="text-2xl font-bold text-primary">
              R$ {totalAmount.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-muted-foreground">
              {orders.filter(o => o.status !== 'canceled').length} pedido(s)
            </p>
          </div>
          <Button onClick={() => setMode('add')}>
            <Plus className="w-4 h-4 mr-1" />Adicionar
          </Button>
        </div>

        {/* Orders list */}
        <h2 className="font-semibold text-sm mb-2">Pedidos</h2>
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="card-premium p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">#{order.order_number}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {order.kitchen_status === 'received' ? '⏳ Novo' :
                     order.kitchen_status === 'preparing' ? '👨‍🍳 Preparo' :
                     order.kitchen_status === 'ready' ? '✅ Pronto' :
                     order.kitchen_status === 'served' ? '🍽️ Servido' : order.kitchen_status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(order.created_at), "HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="space-y-0.5 text-sm">
                {order.order_items?.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.name_snapshot}</span>
                    <span className="font-medium">R$ {item.item_total.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
              {order.notes && (
                <p className="text-xs italic text-muted-foreground mt-1 bg-muted p-1.5 rounded">📝 {order.notes}</p>
              )}
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum pedido ainda</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => setMode('add')}>
                <Plus className="w-3 h-3 mr-1" />Fazer primeiro pedido
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Add items mode: product catalog
  return (
    <>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setMode('view')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Adicionar Itens — Mesa {String(tableNum).padStart(2, '0')}</h1>
          </div>
          {cart.length > 0 && (
            <Badge className="text-xs">{cart.reduce((s, i) => s + i.quantity, 0)} itens</Badge>
          )}
        </div>

        {/* Pizza Builder Button */}
        <div className="px-4 pt-3">
          <Button
            variant="outline"
            className="w-full border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => setPizzaBuilderOpen(true)}
          >
            <Pizza className="w-4 h-4 mr-2" />
            Montar Pizza
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="px-4 pt-2 flex gap-2 overflow-x-auto pb-1">
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "outline"}
              className="text-xs h-7 shrink-0"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className="text-xs h-7 shrink-0"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {/* Product list */}
        <ScrollArea className="flex-1 px-4 pt-2">
          <div className="space-y-2 pb-4">
            {filteredProducts.map(product => {
              const cartItem = cart.find(i => i.productId === product.id);
              return (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-primary font-bold">
                      R$ {(product.promo_price ?? product.base_price).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {cartItem ? (
                      <>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(product.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-7 text-center text-sm font-bold">{cartItem.quantity}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(product.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addToCart(product)}>
                        <Plus className="w-3 h-3 mr-1" />Adicionar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">Nenhum produto encontrado</p>
            )}
          </div>
        </ScrollArea>

        {/* Cart footer */}
        {cart.length > 0 && (
          <div className="border-t border-border p-4 bg-background space-y-2">
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-medium">R$ {(item.basePrice * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
            <Input
              placeholder="Observações (opcional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleSubmitOrder}
              disabled={createOrder.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {createOrder.isPending ? 'Enviando...' : `Enviar pedido — R$ ${getCartTotal().toFixed(2).replace('.', ',')}`}
            </Button>
          </div>
        )}
      </div>

      <WaiterPizzaBuilderModal
        open={pizzaBuilderOpen}
        onOpenChange={setPizzaBuilderOpen}
        onAddPizza={addPizzaToCart}
      />
    </>
  );
}
