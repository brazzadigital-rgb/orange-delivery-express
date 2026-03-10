import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, AlertTriangle, Bell, CheckCircle, Loader2, User, Pizza, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { useStoreConfig } from '@/contexts/StoreConfigContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCreateTableCall, useTableCallStatus } from '@/hooks/useTableCalls';
import { WaiterPizzaBuilderModal } from '@/components/waiter/WaiterPizzaBuilderModal';
import { useValidateSessionToken } from '@/hooks/useSessionToken';

interface TableCartItem {
  productId: string | null;
  name: string;
  basePrice: number;
  quantity: number;
  imageUrl?: string;
  options_snapshot?: any;
}

export default function TableSessionMenu() {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const navigate = useNavigate();
  const { data: validation, isLoading: validating } = useValidateSessionToken(sessionToken || '');
  const { data: products, isLoading: productsLoading } = useProducts();
  const { isStoreOpen } = useStoreConfig();

  const [cart, setCart] = useState<TableCartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);

  // Name modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  // PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Call waiter
  const [callMessage, setCallMessage] = useState('');
  const [showCallForm, setShowCallForm] = useState(false);
  const { createCall, cooldown: callCooldown } = useCreateTableCall();

  const table = validation?.table;
  const session = validation?.session;
  const tokenData = validation?.token;
  const latestCall = useTableCallStatus(table?.id);

  // Use state (not refs) for IDs so realtime subscriptions re-create when IDs become available
  const [stableSessionId, setStableSessionId] = useState<string | null>(null);
  const [stableTokenId, setStableTokenId] = useState<string | null>(null);

  // Track if we already had a valid session (to distinguish close vs never-valid)
  const [hadSession, setHadSession] = useState(false);
  // Track if we already navigated away to prevent double-redirect
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (validation?.valid) {
      setHadSession(true);
      if (session?.id && !stableSessionId) setStableSessionId(session.id);
      if (tokenData?.id && !stableTokenId) setStableTokenId(tokenData.id);
    }
  }, [validation?.valid, session?.id, tokenData?.id]);

  // Redirect if token invalid — but only if we haven't already navigated via realtime
  useEffect(() => {
    if (navigatedRef.current) return;
    if (!validating && validation && !validation.valid) {
      if (validation.reason === 'session_closed' || hadSession) {
        navigatedRef.current = true;
        navigate(`/s/${sessionToken}/closed`, { replace: true });
      } else {
        navigatedRef.current = true;
        navigate(`/s/${sessionToken}/expired`, { replace: true });
      }
    }
  }, [validating, validation, hadSession]);

  // Check if PIN verification needed
  useEffect(() => {
    if (!validation?.valid || !tokenData || !table) return;

    const checkPinRequired = async () => {
      const { data: settings } = await supabase
        .from('store_settings')
        .select('require_table_pin')
        .limit(1)
        .maybeSingle();

      const requirePin = (settings as any)?.require_table_pin ?? false;
      const tablePin = (table as any)?.table_pin;

      if (requirePin && tablePin && !tokenData.is_verified) {
        setShowPinModal(true);
      }
    };

    checkPinRequired();
  }, [validation?.valid, tokenData?.is_verified]);

  // Show name modal if session has no customer_name
  useEffect(() => {
    if (session && session.status === 'open' && !session.customer_name && !showPinModal) {
      setShowNameModal(true);
    } else if (session?.customer_name) {
      setShowNameModal(false);
    }
  }, [session, showPinModal]);

  // Realtime: detect session closure
  useEffect(() => {
    if (!stableSessionId) return;
    const channel = supabase
      .channel(`table-session-close-${stableSessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'table_sessions', filter: `id=eq.${stableSessionId}` },
        (payload) => {
          if (payload.new && (payload.new as any).status === 'closed' && !navigatedRef.current) {
            navigatedRef.current = true;
            navigate(`/s/${sessionToken}/closed`, { replace: true });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [stableSessionId, sessionToken, navigate]);

  // Realtime: detect token revocation
  useEffect(() => {
    if (!stableTokenId) return;
    const channel = supabase
      .channel(`token-revoke-${stableTokenId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'table_session_tokens', filter: `id=eq.${stableTokenId}` },
        async (payload) => {
          if (navigatedRef.current) return;
          if (payload.new && (payload.new as any).status !== 'active') {
            if (stableSessionId) {
              const { data: freshSession } = await supabase
                .from('table_sessions')
                .select('status')
                .eq('id', stableSessionId)
                .maybeSingle();
              if (freshSession && freshSession.status === 'closed') {
                navigatedRef.current = true;
                navigate(`/s/${sessionToken}/closed`, { replace: true });
                return;
              }
            }
            navigatedRef.current = true;
            navigate(`/s/${sessionToken}/expired`, { replace: true });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [stableTokenId, stableSessionId, sessionToken, navigate]);

  // Polling fallback: check session status every 5s in case realtime misses the event
  useEffect(() => {
    if (!stableSessionId) return;
    const interval = setInterval(async () => {
      if (navigatedRef.current) return;
      const { data } = await supabase
        .from('table_sessions')
        .select('status')
        .eq('id', stableSessionId)
        .maybeSingle();
      if (data && data.status === 'closed' && !navigatedRef.current) {
        navigatedRef.current = true;
        navigate(`/s/${sessionToken}/closed`, { replace: true });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [stableSessionId, sessionToken, navigate]);

  const handleVerifyPin = async () => {
    if (!pinInput.trim() || !tokenData || !table) return;
    setVerifyingPin(true);
    setPinError('');
    try {
      const { data: tableData } = await supabase
        .from('restaurant_tables')
        .select('table_pin')
        .eq('id', table.id)
        .single();

      if (!tableData || (tableData as any).table_pin !== pinInput.trim()) {
        setPinError('PIN incorreto. Verifique o adesivo na mesa.');
        setVerifyingPin(false);
        return;
      }

      await supabase
        .from('table_session_tokens' as any)
        .update({ is_verified: true })
        .eq('id', tokenData.id);

      setShowPinModal(false);
      toast.success('Mesa verificada!');
    } catch {
      setPinError('Erro ao verificar. Tente novamente.');
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || !session) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('table_sessions')
        .update({
          customer_name: nameInput.trim(),
          customer_phone: phoneInput.trim() || null,
        } as any)
        .eq('id', session.id);
      if (error) throw error;
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
      return { ...i, quantity: i.quantity + delta };
    }).filter(i => i.quantity > 0));
  };

  const getTotal = () => cart.reduce((sum, i) => sum + i.basePrice * i.quantity, 0);
  const getCartCount = () => cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || !table || !session) return;

    // Guard: if name not set, show modal
    if (!session.customer_name && !nameInput.trim()) {
      setShowNameModal(true);
      return;
    }

    setSubmitting(true);
    try {
      // Re-validate token before submitting
      const { data: freshToken } = await supabase
        .from('table_session_tokens' as any)
        .select('status, expires_at')
        .eq('token', sessionToken!)
        .maybeSingle();

      if (!freshToken || (freshToken as any).status !== 'active') {
        toast.error('Sessão encerrada. Escaneie o QR novamente.');
        navigate(`/s/${sessionToken}/expired`, { replace: true });
        return;
      }

      if ((freshToken as any).expires_at && new Date((freshToken as any).expires_at) < new Date()) {
        toast.error('Sessão expirada. Escaneie o QR novamente.');
        navigate(`/s/${sessionToken}/expired`, { replace: true });
        return;
      }

      const { data: orderId, error } = await supabase.rpc('create_table_order', {
        p_store_id: table.store_id,
        p_table_id: table.id,
        p_table_session_id: session.id,
        p_customer_name: session.customer_name || nameInput.trim() || null,
        p_payment_method: 'cash',
        p_notes: notes || null,
        p_items: cart.map(i => ({
          product_id: i.productId || undefined,
          name_snapshot: i.name,
          quantity: i.quantity,
          base_price: i.basePrice,
          options_snapshot: i.options_snapshot || [],
          item_total: i.basePrice * i.quantity,
        })),
      });

      if (error) throw error;

      // Recalculate session total
      const { data: orders } = await (supabase
        .from('orders') as any)
        .select('total')
        .eq('table_session_id', session.id)
        .neq('status', 'canceled');
      const total = (orders || []).reduce((sum: any, o: any) => sum + (o.total || 0), 0);
      await supabase
        .from('table_sessions')
        .update({ total_amount: total } as any)
        .eq('id', session.id);

      setCart([]);
      setShowCart(false);
      navigate(`/s/${sessionToken}/status/${orderId}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating || productsLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  if (!validation?.valid || !table || !session) {
    return null; // Will redirect via useEffect
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
  const customerName = session?.customer_name;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
          <div className="bg-background rounded-2xl p-6 max-w-sm mx-4 w-full animate-in zoom-in-95 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Verificação de Mesa</h2>
                <p className="text-sm text-muted-foreground">Digite o PIN impresso no adesivo da mesa</p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(''); }}
                placeholder="0000"
                maxLength={4}
                className="text-center text-2xl tracking-[0.5em] font-bold"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && pinInput.length === 4 && handleVerifyPin()}
              />
              {pinError && <p className="text-sm text-destructive text-center">{pinError}</p>}
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleVerifyPin}
              disabled={pinInput.length < 4 || verifyingPin}
            >
              {verifyingPin ? 'Verificando...' : 'Confirmar PIN'}
            </Button>
          </div>
        </div>
      )}

      {/* Name Modal */}
      {showNameModal && !showPinModal && (
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
            <h1 className="font-bold text-lg">Mesa {String((table as any).number).padStart(2, '0')}</h1>
            {customerName ? (
              <p className="text-sm opacity-90 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {customerName}
              </p>
            ) : (
              (table as any).name && <p className="text-sm opacity-80">{(table as any).name}</p>
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

        {activeProducts.map((product) => {
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
                                .map((opt: any, i: number) => (
                                  <span key={i}>• {opt.optionName}: {opt.itemLabel} </span>
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
                      if (!table || !session) return;
                      await createCall({
                        table_id: table.id,
                        table_session_id: session?.id || null,
                        table_number: (table as any).number,
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
