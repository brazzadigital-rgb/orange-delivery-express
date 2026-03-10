import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, AlertTriangle, Bell, CheckCircle, Loader2, User, Pizza } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTableByToken, useTableSession, useCreateTableSession, useCreateTableOrder } from '@/hooks/useTableOrders';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCreateTableCall, useTableCallStatus } from '@/hooks/useTableCalls';
import { WaiterPizzaBuilderModal } from '@/components/waiter/WaiterPizzaBuilderModal';

interface TableCartItem {
  productId: string | null;
  name: string;
  basePrice: number;
  quantity: number;
  imageUrl?: string;
  options_snapshot?: any;
}

export default function TableMenu() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: table, isLoading: tableLoading } = useTableByToken(token || '');
  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useTableSession(table?.id || '');
  const createSession = useCreateTableSession();
  const createOrder = useCreateTableOrder();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { isStoreOpen } = useStoreConfig();

  const [cart, setCart] = useState<TableCartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeSession, setActiveSession] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [callMessage, setCallMessage] = useState('');
  const [showCallForm, setShowCallForm] = useState(false);
  const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);
  const { createCall, cooldown: callCooldown } = useCreateTableCall();
  const latestCall = useTableCallStatus(table?.id);

  // Name modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (session) {
      setActiveSession(session);
    } else if (!sessionLoading && activeSession) {
      // Session was closed by admin — redirect to thank you page
      setActiveSession(null);
      navigate(`/t/${token}/closed`);
    }
  }, [session, sessionLoading]);

  // Track if a session was ever active to prevent auto-reopening after admin closes it
  const [hadSession, setHadSession] = useState(false);

  useEffect(() => {
    if (session || activeSession) setHadSession(true);
  }, [session, activeSession]);

  // Auto-create session only on first visit (never had a session before)
  useEffect(() => {
    if (table && !session && !sessionLoading && !activeSession && !hadSession) {
      createSession.mutateAsync({
        table_id: table.id,
        store_id: table.store_id,
      }).then(s => setActiveSession(s));
    }
  }, [table, session, sessionLoading, activeSession, hadSession]);

  // Realtime: detect session closure by admin and redirect
  useEffect(() => {
    if (!activeSession?.id) return;
    const channel = supabase
      .channel(`table-session-close-${activeSession.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'table_sessions', filter: `id=eq.${activeSession.id}` },
        (payload) => {
          if (payload.new && (payload.new as any).status === 'closed') {
            setActiveSession(null);
            navigate(`/t/${token}/closed`);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeSession?.id, token, navigate]);

  // Show name modal if session is open but has no customer_name
  useEffect(() => {
    if (activeSession && activeSession.status === 'open' && !activeSession.customer_name) {
      setShowNameModal(true);
    } else {
      setShowNameModal(false);
    }
  }, [activeSession]);

  const handleSaveName = async () => {
    if (!nameInput.trim() || !activeSession) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('table_sessions')
        .update({
          customer_name: nameInput.trim(),
          customer_phone: phoneInput.trim() || null,
        } as any)
        .eq('id', activeSession.id);
      if (error) throw error;
      setActiveSession({ ...activeSession, customer_name: nameInput.trim(), customer_phone: phoneInput.trim() || null });
      setShowNameModal(false);
      toast.success('Bem-vindo(a), ' + nameInput.trim() + '!');
    } catch {
      toast.error('Erro ao salvar nome. Tente novamente.');
    } finally {
      setSavingName(false);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        basePrice: product.base_price,
        quantity: 1,
        imageUrl: product.image_url,
      }];
    });
  };

  const handleAddPizza = (pizza: { name: string; basePrice: number; quantity: number; options_snapshot: any }) => {
    setCart(prev => [...prev, {
      productId: null,
      name: pizza.name,
      basePrice: pizza.basePrice,
      quantity: pizza.quantity,
      options_snapshot: pizza.options_snapshot,
    }]);
    toast.success('Pizza adicionada ao carrinho!');
  };

  const updateQty = (index: number, delta: number) => {
    setCart(prev => prev.map((i, idx) => {
      if (idx !== index) return i;
      const newQty = i.quantity + delta;
      return { ...i, quantity: newQty };
    }).filter(i => i.quantity > 0));
  };

  const getTotal = () => cart.reduce((sum, i) => sum + i.basePrice * i.quantity, 0);
  const getCartCount = () => cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || !table || !activeSession) return;

    // Guard: if name not set, show modal instead
    if (!activeSession.customer_name) {
      setShowNameModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const orderId = await createOrder.mutateAsync({
        storeId: table.store_id,
        tableId: table.id,
        sessionId: activeSession.id,
        customerName: activeSession.customer_name,
        notes: notes || undefined,
        items: cart.map(i => ({
          product_id: i.productId || undefined,
          name_snapshot: i.name,
          quantity: i.quantity,
          base_price: i.basePrice,
          options_snapshot: i.options_snapshot || [],
          item_total: i.basePrice * i.quantity,
        })),
      });

      // Recalculate session total
      const { data: orders } = await (supabase
        .from('orders') as any)
        .select('total')
        .eq('table_session_id', activeSession.id)
        .neq('status', 'canceled');
      const total = (orders || []).reduce((sum: any, o: any) => sum + (o.total || 0), 0);
      await supabase
        .from('table_sessions')
        .update({ total_amount: total } as any)
        .eq('id', activeSession.id);

      setCart([]);
      setShowCart(false);
      navigate(`/t/${token}/status/${orderId}`);
    } catch {
      // error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  if (tableLoading || productsLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-destructive" />
          <h1 className="text-xl font-bold mb-2">Mesa Indisponível</h1>
          <p className="text-muted-foreground">Esta mesa não está ativa ou o QR Code é inválido.</p>
        </div>
      </div>
    );
  }

  if (!isStoreOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-warning" />
          <h1 className="text-xl font-bold mb-2">Loja Fechada</h1>
          <p className="text-muted-foreground">Não estamos aceitando pedidos no momento.</p>
        </div>
      </div>
    );
  }

  const activeProducts = products || [];
  const customerName = activeSession?.customer_name;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Mandatory Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-background rounded-2xl p-6 max-w-sm mx-4 w-full animate-in zoom-in-95 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Como podemos te chamar?</h2>
                <p className="text-sm text-muted-foreground">Informe seu nome para iniciar a comanda</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="customer-name" className="text-sm font-medium">Nome *</Label>
                <Input
                  id="customer-name"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Seu nome"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && nameInput.trim() && handleSaveName()}
                />
              </div>
              <div>
                <Label htmlFor="customer-phone" className="text-sm font-medium">WhatsApp (opcional)</Label>
                <Input
                  id="customer-phone"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleSaveName}
              disabled={!nameInput.trim() || savingName}
            >
              {savingName ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Mesa {String(table.number).padStart(2, '0')}</h1>
            {customerName ? (
              <p className="text-sm opacity-90 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {customerName}
              </p>
            ) : (
              table.name && <p className="text-sm opacity-80">{table.name}</p>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="relative"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Carrinho
            {getCartCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getCartCount()}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Products */}
      <div className="p-4 space-y-3">
        {/* Pizza Builder CTA */}
        <button
          onClick={() => setShowPizzaBuilder(true)}
          className="w-full card-premium p-4 flex items-center gap-3 border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Pizza className="w-6 h-6 text-primary" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-sm">Monte sua Pizza</p>
            <p className="text-xs text-muted-foreground">Escolha tamanho e sabores</p>
          </div>
          <Plus className="w-5 h-5 text-primary" />
        </button>

        {activeProducts.map((product, _idx) => {
          const cartIndex = cart.findIndex(i => i.productId === product.id);
          const cartItem = cartIndex >= 0 ? cart[cartIndex] : null;
          return (
            <div key={product.id} className="card-premium p-3 flex gap-3">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                )}
                <p className="font-bold text-primary mt-1">R$ {product.base_price.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {cartItem ? (
                  <>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(cartIndex, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-bold">{cartItem.quantity}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(cartIndex, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => addToCart(product)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Bottom Sheet */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
              <h2 className="font-bold text-lg mb-4">Seu Pedido</h2>

              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Carrinho vazio</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.quantity}x R$ {item.basePrice.toFixed(2).replace('.', ',')}</p>
                          {item.options_snapshot && Array.isArray(item.options_snapshot) && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.options_snapshot
                                .filter((opt: any) => opt.optionName !== 'Tamanho' && opt.optionName !== 'Sabor')
                                .map((opt: any, idx: number) => (
                                  <span key={idx}>• {opt.optionName}: {opt.itemLabel} </span>
                                ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">R$ {(item.basePrice * item.quantity).toFixed(2).replace('.', ',')}</p>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(idx, -1)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(idx, 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Only notes field - name comes from session */}
                  <div className="border-t pt-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Observações (opcional)</label>
                      <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: sem cebola" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4 font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">R$ {getTotal().toFixed(2).replace('.', ',')}</span>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmitOrder}
                    disabled={submitting || cart.length === 0}
                  >
                    {submitting ? 'Enviando...' : 'Confirmar Pedido'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Call Waiter CTA */}
      {!showCart && (
        <div className="px-4 pb-4">
          <div className="card-premium p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Chamar atendimento</p>
                  <p className="text-xs text-muted-foreground">Um garçom será avisado.</p>
                </div>
              </div>
              {latestCall?.status === 'pendente' && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full animate-pulse">
                  Aguardando...
                </span>
              )}
              {latestCall?.status === 'atendido' && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Atendido
                </span>
              )}
            </div>

            {showCallForm && (
              <Input
                value={callMessage}
                onChange={e => setCallMessage(e.target.value)}
                placeholder="Ex.: pedir talheres, chamar a conta…"
                className="text-sm"
              />
            )}

            <div className="flex gap-2">
              {!showCallForm ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowCallForm(true)}
                  disabled={callCooldown}
                >
                  {callCooldown ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aguarde...</>
                  ) : (
                    <><Bell className="w-4 h-4 mr-2" />Chamar Garçom</>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      if (!table || !activeSession) return;
                      await createCall({
                        table_id: table.id,
                        table_session_id: activeSession?.id || null,
                        table_number: table.number,
                        store_id: table.store_id,
                        message: callMessage || undefined,
                      });
                      setCallMessage('');
                      setShowCallForm(false);
                    }}
                    disabled={callCooldown}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Enviar
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowCallForm(false); setCallMessage(''); }}>
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating cart button */}
      {getCartCount() > 0 && !showCart && (
        <div className="fixed bottom-4 left-4 right-4 z-30">
          <Button className="w-full" size="lg" onClick={() => setShowCart(true)}>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Ver Carrinho ({getCartCount()}) — R$ {getTotal().toFixed(2).replace('.', ',')}
          </Button>
        </div>
      )}

      {/* Pizza Builder Modal */}
      <WaiterPizzaBuilderModal
        open={showPizzaBuilder}
        onOpenChange={setShowPizzaBuilder}
        onAddPizza={handleAddPizza}
      />
    </div>
  );
}
