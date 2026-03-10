import { useState, useEffect, useRef } from "react";
import logoWhite from "@/assets/logo-white.png";
import { Link } from "react-router-dom";
import { 
  Check, 
  ChevronDown, 
  Smartphone, 
  Store, 
  ChefHat, 
  Truck, 
  Building2, 
  Pizza, 
  UtensilsCrossed, 
  Beef, 
  Package, 
  Network,
  ShoppingCart,
  Search,
  Heart,
  CreditCard,
  MapPin,
  Bell,
  Download,
  Timer,
  Users,
  BarChart3,
  Palette,
  Shield,
  Zap,
  Globe,
  MessageSquare,
  Mail,
  Headphones,
  ArrowRight,
  Calculator,
  Sparkles,
  Crown,
  Star,
  X,
  Menu,
  ExternalLink,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/subscription-plans";
import PixPaymentModal from "@/components/subscription/PixPaymentModal";
import { toast } from "sonner";
 
// Plan pricing config
const PLAN_CONFIG: Record<string, { months: number; discount: number }> = {
  monthly:   { months: 1,  discount: 0 },
  quarterly: { months: 3,  discount: 10 },
  annual:    { months: 12, discount: 20 },
};

interface BillingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  features: string[] | null;
  is_default: boolean | null;
  active: boolean | null;
  sort_order: number | null;
}

function useBillingPlans() {
  return useQuery({
    queryKey: ['billing-plans-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data as BillingPlan[];
    },
  });
}

function getPlanPricing(p: BillingPlan) {
  const cfg = PLAN_CONFIG[p.slug] || { months: 1, discount: 0 };
  const totalPrice = p.price_monthly * cfg.months * (1 - cfg.discount / 100);
  const savings = p.price_monthly * cfg.months * (cfg.discount / 100);
  return { months: cfg.months, discount: cfg.discount, totalPrice, savings };
}
 
 const segments = [
   {
     icon: Pizza,
     title: "Pizzarias",
     pains: ["Perder para apps que cobram 25%+", "Não conhecer seus clientes", "Depender de horários de pico"],
     gains: ["Canal próprio sem taxas por pedido", "CRM e promoções diretas", "Previsibilidade de receita"]
   },
   {
     icon: UtensilsCrossed,
     title: "Restaurantes",
     pains: ["Cardápio difícil de atualizar", "Pedidos perdidos por telefone", "Sem rastreio de entregas"],
     gains: ["Cardápio digital com fotos e busca", "Pedidos em tempo real no painel", "Mapa ao vivo para cliente e admin"]
   },
   {
     icon: Beef,
     title: "Hamburguerias",
     pains: ["Combos complexos de montar", "Adicionais e personalizações", "Alto volume em horário de pico"],
     gains: ["Builder de produto flexível", "Adicionais ilimitados por item", "KDS para cozinha organizada"]
   },
   {
     icon: Package,
     title: "Dark Kitchens",
     pains: ["Múltiplas marcas virtuais", "Gestão de zonas de entrega", "Otimizar rotas de motoboys"],
     gains: ["Multi-tenant por design", "Zonas por polígono + simulador", "App do motoboy com navegação"]
   },
   {
     icon: Network,
     title: "Redes / Franquias",
     pains: ["Padronizar operação nas unidades", "Relatórios consolidados", "Controle de permissões"],
     gains: ["Super Admin para gestão central", "Relatórios por loja e rede", "Roles e permissões granulares"]
   }
 ];
 
 const features = [
   {
     title: "App do Cliente",
     icon: Smartphone,
     items: [
       { icon: ShoppingCart, text: "Cardápio por categorias + busca + favoritos" },
       { icon: Pizza, text: "Monte sua pizza (builder)" },
       { icon: CreditCard, text: "Carrinho + checkout em etapas" },
       { icon: CreditCard, text: "Pagamento (Pix/Cartão/Dinheiro) + troco" },
       { icon: Timer, text: "Acompanhamento do pedido + timeline" },
       { icon: MapPin, text: "Rastreamento no mapa ao vivo" },
       { icon: Bell, text: "Notificações (push) + som por status" },
       { icon: Download, text: "Instalar como app (PWA)" }
     ]
   },
   {
     title: "Painel Admin",
     icon: Store,
     items: [
       { icon: Bell, text: "Pedidos em tempo real + som configurável" },
       { icon: Check, text: "Aceitar/recusar + fluxo de status" },
       { icon: ChefHat, text: "KDS cozinha" },
       { icon: Package, text: "Produtos/categorias/adicionais/combos" },
       { icon: Sparkles, text: "Promoções, cupons + notificar usuários" },
       { icon: Timer, text: "Horário automático abre/fecha" },
       { icon: MapPin, text: "Zonas de entrega + taxa/ETA + simulador" },
       { icon: BarChart3, text: "Dashboard (clientes, faturamento, métricas)" },
       { icon: Palette, text: "Branding do app (logo, cores)" },
       { icon: Users, text: "Usuários e permissões (staff)" }
     ]
   },
   {
     title: "App Motoboy",
     icon: Truck,
     items: [
       { icon: Package, text: "Pedidos atribuídos" },
       { icon: MapPin, text: "Iniciar entrega + localização em tempo real" },
       { icon: ArrowRight, text: "Navegação + confirmação de entrega" }
     ]
   },
   {
     title: "Multi-loja / SaaS",
     icon: Building2,
     items: [
       { icon: Network, text: "Multi-tenant (cada loja independente)" },
       { icon: Crown, text: "Super Admin para gestão de lojas" },
       { icon: Palette, text: "Branding próprio por loja" },
       { icon: Globe, text: "Domínios personalizados (add-on)" },
       { icon: Shield, text: "Controle por roles e segurança" }
     ]
   }
 ];
 
 const addons = [
   { icon: Package, title: "Integração iFood", desc: "Receba pedidos no mesmo painel", price: "Sob consulta" },
   { icon: Globe, title: "Domínio personalizado", desc: "sualoja.com.br", price: "R$ 49/mês" },
   { icon: MessageSquare, title: "WhatsApp automações", desc: "Templates e notificações", price: "R$ 99/mês" },
   { icon: Mail, title: "SMS transacional", desc: "Confirmações e alertas", price: "R$ 0,08/msg" },
   { icon: Headphones, title: "Setup assistido", desc: "Implantação com especialista", price: "R$ 499 único" },
   { icon: ArrowRight, title: "Migração de cardápio", desc: "Importamos seu menu atual", price: "R$ 299 único" }
 ];
 
 const faqItems = [
   { q: "Funciona para várias lojas?", a: "Sim! Nossa plataforma é multi-tenant por design. Cada loja tem seu painel, catálogo, horários e zonas independentes. Você pode gerenciar 1 ou 100 lojas no mesmo sistema." },
   { q: "Cada loja tem seu próprio painel?", a: "Exatamente. Cada estabelecimento acessa apenas seus dados, produtos e pedidos. Você, como gestor da rede, tem um Super Admin para visão consolidada." },
   { q: "Tem app na loja de aplicativos?", a: "O app é um PWA (Progressive Web App) que funciona como app nativo. O cliente instala direto do navegador, sem precisar baixar na loja. Atualizações são instantâneas e sem burocracia." },
   { q: "Como instala no celular?", a: "Ao acessar o app pelo celular, aparece um banner 'Adicionar à tela inicial'. Um clique e o app fica no celular do cliente, com ícone e tudo." },
   { q: "Como funciona o rastreio ao vivo?", a: "Quando o motoboy inicia a entrega, sua localização é transmitida em tempo real. O cliente vê no mapa exatamente onde o pedido está." },
   { q: "Dá para configurar horário automático?", a: "Sim! Você define os horários de funcionamento por dia da semana e o sistema abre e fecha automaticamente, inclusive com mensagens personalizadas." },
   { q: "Como funcionam zonas de entrega?", a: "Você pode definir zonas por raio (km) ou desenhar polígonos no mapa. Cada zona tem sua taxa e tempo estimado. O simulador mostra a taxa antes do cliente finalizar." },
   { q: "Tem suporte e SLA?", a: "Todos os planos incluem suporte. Growth tem suporte prioritário, Pro tem suporte premium, e Enterprise tem SLA dedicado com tempo de resposta garantido." }
 ];
 
 const processSteps = [
   { step: 1, title: "Diagnóstico", desc: "Configuração de horários, zonas e catálogo" },
   { step: 2, title: "Treinamento", desc: "Capacitação do admin e equipe operacional" },
   { step: 3, title: "Go-live", desc: "Primeiros pedidos reais com acompanhamento" },
   { step: 4, title: "Otimização", desc: "Promoções, CRM e análise de relatórios" }
 ];
 
 // Scroll reveal hook
 function useScrollReveal() {
   const ref = useRef<HTMLDivElement>(null);
   const [isVisible, setIsVisible] = useState(false);
 
   useEffect(() => {
     const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
     if (prefersReducedMotion) {
       setIsVisible(true);
       return;
     }
 
     const observer = new IntersectionObserver(
       ([entry]) => {
         if (entry.isIntersecting) {
           setIsVisible(true);
           observer.disconnect();
         }
       },
       { threshold: 0.1 }
     );
 
     if (ref.current) observer.observe(ref.current);
     return () => observer.disconnect();
   }, []);
 
   return { ref, isVisible };
 }
 
 // Section wrapper with scroll reveal
 function Section({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) {
   const { ref, isVisible } = useScrollReveal();
   return (
     <section
       ref={ref}
       id={id}
       className={cn(
         "transition-all duration-700 ease-out",
         isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
         className
       )}
     >
       {children}
     </section>
   );
 }
 
 // Calculator component
 function PriceCalculator() {
    const [stores, setStores] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState("monthly");
    const [perOrderFee, setPerOrderFee] = useState(false);
    const [feeAmount, setFeeAmount] = useState(0.5);
    const [ordersPerMonth, setOrdersPerMonth] = useState(500);

    const basePrice = 250;
    const planCfg = PLAN_CONFIG[selectedPlan] || { months: 1, discount: 0 };
    const planTotal = basePrice * planCfg.months * (1 - planCfg.discount / 100);
    const monthlyEquivalent = planTotal / planCfg.months;
 
   // Volume discount
   let discount = 0;
   if (stores >= 10) discount = 0.20;
   else if (stores >= 5) discount = 0.15;
   else if (stores >= 3) discount = 0.10;
 
    const subtotal = monthlyEquivalent * stores;
    const discountAmount = subtotal * discount;
    const perOrderTotal = perOrderFee ? feeAmount * ordersPerMonth * stores : 0;
    const monthlyTotal = subtotal - discountAmount + perOrderTotal;
    const periodTotal = monthlyTotal * planCfg.months;

    const whatsappMessage = encodeURIComponent(
      `Olá! Tenho interesse no plano ${selectedPlan.toUpperCase()} para ${stores} loja(s). ` +
      `Valor estimado: R$ ${monthlyTotal.toFixed(2)}/mês. ` +
      (perOrderFee ? `Com taxa por pedido de R$ ${feeAmount}/pedido. ` : '') +
      `Gostaria de uma proposta personalizada.`
    );
 
   return (
     <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">
       <div className="flex items-center gap-3 mb-6">
         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF2D55] flex items-center justify-center">
           <Calculator className="w-5 h-5 text-white" />
         </div>
         <h3 className="text-xl font-semibold text-white">Calculadora de Preço</h3>
       </div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
           <div>
             <label className="block text-sm text-white/70 mb-2">Quantidade de lojas</label>
             <Input
               type="number"
               min={1}
               value={stores}
               onChange={(e) => setStores(Math.max(1, parseInt(e.target.value) || 1))}
               className="bg-white/5 border-white/10 text-white"
             />
           </div>
 
           <div>
             <label className="block text-sm text-white/70 mb-2">Plano</label>
              <div className="grid grid-cols-3 gap-2">
                {[{key: "monthly", label: "Mensal"}, {key: "quarterly", label: "Trimestral"}, {key: "annual", label: "Anual"}].map((plan) => (
                  <button
                    key={plan.key}
                    onClick={() => setSelectedPlan(plan.key)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      selectedPlan === plan.key
                        ? "bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-white"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {plan.label}
                  </button>
                ))}
              </div>
           </div>
 
           <div className="flex items-center justify-between">
             <label className="text-sm text-white/70">Cobrança por pedido?</label>
             <Switch checked={perOrderFee} onCheckedChange={setPerOrderFee} />
           </div>
 
           {perOrderFee && (
             <div className="space-y-4 p-4 bg-white/5 rounded-xl">
               <div>
                 <label className="block text-sm text-white/70 mb-2">Taxa por pedido (R$)</label>
                 <Input
                   type="number"
                   step={0.1}
                   min={0}
                   value={feeAmount}
                   onChange={(e) => setFeeAmount(parseFloat(e.target.value) || 0)}
                   className="bg-white/5 border-white/10 text-white"
                 />
               </div>
               <div>
                 <label className="block text-sm text-white/70 mb-2">Pedidos estimados/mês (por loja)</label>
                 <Input
                   type="number"
                   min={0}
                   value={ordersPerMonth}
                   onChange={(e) => setOrdersPerMonth(parseInt(e.target.value) || 0)}
                   className="bg-white/5 border-white/10 text-white"
                 />
               </div>
             </div>
           )}
         </div>
 
         <div className="bg-gradient-to-br from-[#FF7A00]/10 to-[#FF2D55]/10 rounded-xl p-5 border border-white/10">
           <h4 className="text-lg font-semibold text-white mb-4">Resumo</h4>
           <div className="space-y-3 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Subtotal ({stores} loja{stores > 1 ? 's' : ''} × R$ {monthlyEquivalent.toFixed(2)}/mês)</span>
                <span>R$ {subtotal.toFixed(2)}/mês</span>
              </div>
             {discount > 0 && (
               <div className="flex justify-between text-green-400">
                 <span>Desconto por volume ({(discount * 100).toFixed(0)}%)</span>
                 <span>- R$ {discountAmount.toFixed(2)}</span>
               </div>
             )}
             {perOrderFee && (
               <div className="flex justify-between text-white/70">
                 <span>Taxa por pedido estimada</span>
                 <span>+ R$ {perOrderTotal.toFixed(2)}</span>
               </div>
             )}
             <div className="border-t border-white/10 pt-3 mt-3">
               <div className="flex justify-between text-white font-semibold text-lg">
                 <span>Total mensal</span>
                 <span>R$ {monthlyTotal.toFixed(2)}</span>
               </div>
                <div className="flex justify-between text-[#FF7A00] mt-2">
                  <span>Total no período ({planCfg.months} {planCfg.months === 1 ? 'mês' : 'meses'})</span>
                  <span>R$ {periodTotal.toFixed(2)}</span>
                </div>
             </div>
           </div>
 
           <a
              href={`https://wa.me/5541996829083?text=${whatsappMessage}`}
              target="_blank"
             rel="noopener noreferrer"
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-white font-semibold hover:shadow-lg hover:shadow-[#FF7A00]/25 transition-all"
           >
             <MessageSquare className="w-4 h-4" />
             Quero essa proposta no WhatsApp
           </a>
         </div>
       </div>
     </div>
   );
 }
 
 // Mobile nav
 function MobileNav() {
   const [open, setOpen] = useState(false);
   
   return (
     <>
       <button 
         onClick={() => setOpen(true)} 
         className="md:hidden p-2 text-white/70 hover:text-white"
       >
         <Menu className="w-6 h-6" />
       </button>
       
       {open && (
         <div className="fixed inset-0 z-50 md:hidden">
           <div className="absolute inset-0 bg-black/80" onClick={() => setOpen(false)} />
           <div className="absolute right-0 top-0 bottom-0 w-72 bg-[#0B0B10] border-l border-white/10 p-6">
             <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-white/70">
               <X className="w-6 h-6" />
             </button>
             <nav className="mt-12 space-y-4">
               {["Segmentos", "Funcionalidades", "Planos", "FAQ"].map((item) => (
                 <a
                   key={item}
                   href={`#${item.toLowerCase()}`}
                   onClick={() => setOpen(false)}
                   className="block py-2 text-white/70 hover:text-white transition-colors"
                 >
                   {item}
                 </a>
               ))}
               <a
                 href="#calculadora"
                 onClick={() => setOpen(false)}
                 className="block py-3 px-4 mt-4 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-white text-center font-semibold"
               >
                 Ver Planos
               </a>
             </nav>
           </div>
         </div>
       )}
     </>
   );
 }
 
export default function Plans() {
  const { data: dbPlans } = useBillingPlans();
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [pixModalData, setPixModalData] = useState<{
    planName: string; amount: number; pixCopiaECola: string | null; qrCodeImage: string | null; txid: string | null;
  }>({ planName: '', amount: 0, pixCopiaECola: null, qrCodeImage: null, txid: null });
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<BillingPlan | null>(null);

  // Customer info form state
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pendingPlan, setPendingPlan] = useState<BillingPlan | null>(null);

  const handleSubscribe = (plan: BillingPlan) => {
    setPendingPlan(plan);
    setShowCustomerForm(true);
  };

  const handleCustomerFormSubmit = async () => {
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (!pendingPlan) return;

    const plan = pendingPlan;
    const { totalPrice } = getPlanPricing(plan);
    setShowCustomerForm(false);
    setSelectedPlanForPayment(plan);
    setPixModalData({ planName: plan.name, amount: totalPrice, pixCopiaECola: null, qrCodeImage: null, txid: null });
    setPixModalOpen(true);
    setGeneratingPix(true);
    try {
      // Create purchase order in DB
      const { error: poErr } = await (supabase.from('purchase_orders') as any).insert({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        plan_name: plan.name,
        plan_slug: plan.slug,
        amount: totalPrice,
      });
      if (poErr) console.error('Error creating purchase order:', poErr);

      const { data: pixData, error: pixErr } = await supabase.functions.invoke('efi-create-pix', {
        body: { amount: totalPrice, plan_name: plan.name, plan_slug: plan.slug },
      });
      if (pixErr) throw pixErr;
      setPixModalData({
        planName: plan.name, amount: totalPrice,
        pixCopiaECola: pixData?.pix_copia_cola || null,
        qrCodeImage: pixData?.qrcode_image || null,
        txid: pixData?.txid || null,
      });

      // Update purchase order with txid
      if (pixData?.txid) {
        await (supabase.from('purchase_orders') as any)
          .update({ efi_txid: pixData.txid })
          .eq('customer_email', customerEmail.trim())
          .eq('plan_slug', plan.slug)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao gerar PIX');
      setPixModalOpen(false);
    } finally {
      setGeneratingPix(false);
    }
  };

   return (
     <div className="min-h-screen bg-[#0B0B10] text-white font-['Inter',sans-serif] overflow-x-hidden w-full max-w-full">
       {/* Header */}
       <header className="fixed top-0 left-0 right-0 z-40 bg-[#0B0B10]/80 backdrop-blur-xl border-b border-white/5">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/">
              <img src={logoWhite} alt="Logo" className="h-10 max-w-[180px] object-contain" />
            </Link>
           <nav className="hidden md:flex items-center gap-8">
             <a href="#segmentos" className="text-sm text-white/70 hover:text-white transition-colors">Segmentos</a>
             <a href="#funcionalidades" className="text-sm text-white/70 hover:text-white transition-colors">Funcionalidades</a>
             <a href="#planos" className="text-sm text-white/70 hover:text-white transition-colors">Planos</a>
             <a href="#faq" className="text-sm text-white/70 hover:text-white transition-colors">FAQ</a>
           </nav>
           <div className="flex items-center gap-3">
               <Link 
                 to="/auth/signup/lojista"
                 className="hidden md:inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#FF7A00]/25 transition-all"
               >
                 Teste 7 dias grátis
               </Link>
              <Link 
                to="/auth/login?redirect=/onboarding/create-store"
                className="hidden md:inline-flex items-center gap-2 py-2.5 px-5 rounded-full border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-all"
              >
                Entrar
              </Link>
             <MobileNav />
           </div>
         </div>
       </header>
 
       {/* Hero */}
       <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF7A00]/10 via-transparent to-transparent" />
         <div className="max-w-5xl mx-auto text-center relative">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 mb-6">
             <Sparkles className="w-4 h-4 text-[#FF7A00]" />
             Plataforma Multi-loja
           </div>
           
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-['Poppins',sans-serif] leading-tight mb-6">
              Seu delivery próprio{" "}
              <span className="bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] bg-clip-text text-transparent">
                sem depender de marketplace
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-8">
              Crie seu app de delivery com pedidos em tempo real, rastreio do motoboy no mapa e painel completo. Comece agora com 7 dias grátis.
            </p>
 
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
               <Link
                 to="/auth/signup/lojista"
                 className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-7 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-white font-semibold hover:shadow-xl hover:shadow-[#FF7A00]/30 transition-all"
               >
                 Criar minha loja (Teste 7 dias)
                 <ArrowRight className="w-4 h-4" />
               </Link>
              <Link
                to="/auth/login?redirect=/onboarding/create-store"
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-7 rounded-full border-2 border-white/20 text-white font-semibold hover:bg-white/5 transition-all"
              >
                Entrar
              </Link>
            </div>
 
           <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
             {["Multi-loja", "Marca própria", "Mapa ao vivo", "CRM + Relatórios", "Horário automático", "Zonas de entrega"].map((badge) => (
               <span key={badge} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                 {badge}
               </span>
             ))}
           </div>
 
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
             <Check className="w-4 h-4" />
             Sem taxa por pedido (opcional) — você escolhe o modelo.
           </div>
         </div>
       </section>
 
       {/* Segments */}
       <Section id="segmentos" className="py-20 px-4">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4">Para quem é?</h2>
             <p className="text-white/60 max-w-2xl mx-auto">Atendemos diversos segmentos do food service com soluções específicas.</p>
           </div>
 
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
             {segments.map((segment) => (
               <Card key={segment.title} className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20 transition-all group">
                 <CardHeader className="pb-3">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF7A00]/20 to-[#FF2D55]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                     <segment.icon className="w-6 h-6 text-[#FF7A00]" />
                   </div>
                   <CardTitle className="text-white text-lg">{segment.title}</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div>
                     <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Dores</p>
                     <ul className="space-y-1">
                       {segment.pains.map((pain, i) => (
                         <li key={i} className="text-sm text-white/50 flex items-start gap-2">
                           <X className="w-3 h-3 text-red-400 mt-1 shrink-0" />
                           {pain}
                         </li>
                       ))}
                     </ul>
                   </div>
                   <div>
                     <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Ganhos</p>
                     <ul className="space-y-1">
                       {segment.gains.map((gain, i) => (
                         <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                           <Check className="w-3 h-3 text-green-400 mt-1 shrink-0" />
                           {gain}
                         </li>
                       ))}
                     </ul>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </Section>
 
       {/* Features */}
       <Section id="funcionalidades" className="py-20 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4">Funcionalidades Completas</h2>
             <p className="text-white/60 max-w-2xl mx-auto">Tudo que você precisa para operar delivery de forma profissional.</p>
           </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {features.map((module) => (
               <Card key={module.title} className="bg-white/[0.02] border-white/10">
                 <CardHeader>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF2D55] flex items-center justify-center">
                       <module.icon className="w-5 h-5 text-white" />
                     </div>
                     <CardTitle className="text-white">{module.title}</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <ul className="grid gap-2">
                     {module.items.map((item, i) => (
                       <li key={i} className="flex items-center gap-3 text-sm text-white/70">
                         <item.icon className="w-4 h-4 text-[#FF7A00] shrink-0" />
                         {item.text}
                       </li>
                     ))}
                   </ul>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </Section>
 
       {/* Comparison */}
       <Section className="py-20 px-4">
         <div className="max-w-4xl mx-auto">
           <div className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4">Canal Próprio vs Marketplace</h2>
             <p className="text-white/60">Entenda as diferenças e escolha o melhor para seu negócio.</p>
           </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="bg-[#0B0B10] border-2 border-[#FF7A00]/60 shadow-[0_0_30px_rgba(255,122,0,0.15)]">
               <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 font-bold">
                   <Crown className="w-5 h-5 text-[#FF7A00]" />
                   Seu App (Canal Próprio)
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <ul className="space-y-3">
                   {[
                     "Marca própria no app do cliente",
                     "Você é dono dos dados do cliente",
                     "Promoções diretas e personalizadas",
                     "Recorrência e previsibilidade",
                     "Sem taxa por pedido (opcional)",
                     "CRM para fidelização"
                   ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-white">
                        <Check className="w-4 h-4 text-[#4ADE80] shrink-0" />
                       {item}
                     </li>
                   ))}
                 </ul>
               </CardContent>
             </Card>
 
             <Card className="bg-white/[0.02] border-white/10">
               <CardHeader>
                 <CardTitle className="text-white flex items-center gap-2">
                   <Store className="w-5 h-5 text-white/60" />
                   Marketplace
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <ul className="space-y-3">
                   {[
                     "Alcance e visibilidade inicial",
                     "Taxas de 12% a 30% por pedido",
                     "Cliente é do marketplace",
                     "Regras e limitações da plataforma",
                     "Competição direta com concorrentes",
                     "Dependência do algoritmo"
                   ].map((item, i) => (
                     <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                       <div className="w-4 h-4 rounded-full bg-white/20 shrink-0" />
                       {item}
                     </li>
                   ))}
                 </ul>
               </CardContent>
             </Card>
           </div>
         </div>
       </Section>
 
        {/* Plans */}
        <Section id="planos" className="py-20 px-4 bg-gradient-to-b from-transparent via-[#FF7A00]/5 to-transparent">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4">Escolha seu Plano</h2>
              <p className="text-white/60 max-w-2xl mx-auto">Todos os planos incluem acesso completo à plataforma. Escolha a periodicidade ideal.</p>
            </div>

            {dbPlans && dbPlans.length > 0 ? (
              <div className={cn(
                "grid grid-cols-1 gap-6 mb-12",
                dbPlans.length === 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" :
                dbPlans.length >= 3 ? "sm:grid-cols-3" : "max-w-md mx-auto"
              )}>
                {dbPlans.map((plan) => {
                  const { totalPrice, discount, savings, months } = getPlanPricing(plan);
                  const isPopular = plan.is_default;
                  const benefits = (plan.features as string[]) || [];
                  return (
                    <Card
                      key={plan.id}
                      className={cn(
                        "relative bg-white/[0.02] border-white/10 transition-all hover:scale-[1.02]",
                        isPopular && "border-[#FF7A00]/50 bg-gradient-to-b from-[#FF7A00]/10 to-transparent"
                      )}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-xs font-semibold text-white whitespace-nowrap">
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          Mais Popular
                        </div>
                      )}
                      <CardHeader className="text-center pb-4">
                        <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                        <CardDescription className="text-white/50">{plan.description}</CardDescription>
                        <div className="mt-4">
                          <span className="text-4xl font-bold text-white">{formatBRL(totalPrice)}</span>
                          <span className="text-white/50 text-sm block mt-1">/{months === 1 ? 'mês' : `${months} meses`}</span>
                        </div>
                        {discount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded-full px-3 py-1 mt-2">
                            <TrendingUp className="w-3 h-3" />
                            {discount}% off · Economia de {formatBRL(savings)}
                          </span>
                        )}
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3 mb-6">
                          {benefits.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                              <Check className="w-4 h-4 text-[#FF7A00] mt-0.5 shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div className="space-y-2">
                          <button
                            onClick={() => handleSubscribe(plan)}
                            disabled={generatingPix}
                            className={cn(
                              "w-full flex items-center justify-center py-2.5 rounded-full font-semibold text-sm transition-all",
                              isPopular
                                ? "bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-white hover:shadow-lg hover:shadow-[#FF7A00]/25"
                                : "bg-white/10 text-white hover:bg-white/20"
                            )}
                          >
                            {generatingPix ? 'Processando...' : 'Assinar Agora'}
                          </button>
                          <a
                             href="https://wa.me/5541996829083"
                             target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center py-2.5 rounded-full border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-all"
                          >
                            Falar com especialista
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-white/50">Carregando planos...</div>
            )}

             {/* Volume discounts */}
             <div className="flex flex-wrap items-center justify-center gap-3 p-4 md:p-6 rounded-2xl bg-white/[0.02] border border-white/10">
               <span className="text-white/70 text-sm w-full text-center md:w-auto">Desconto por volume:</span>
               <span className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs sm:text-sm whitespace-nowrap">3–4 lojas: 10% off</span>
               <span className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs sm:text-sm whitespace-nowrap">5–9 lojas: 15% off</span>
               <span className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs sm:text-sm whitespace-nowrap">10+ lojas: 20% off</span>
             </div>
          </div>
        </Section>
 
       {/* Calculator */}
       <Section id="calculadora" className="py-20 px-4">
         <div className="max-w-4xl mx-auto">
           <PriceCalculator />
         </div>
       </Section>
 
       {/* Add-ons */}
       <Section className="py-20 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
         <div className="max-w-6xl mx-auto">
           <div className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4">Add-ons</h2>
             <p className="text-white/60">Recursos extras para potencializar sua operação.</p>
           </div>
 
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {addons.map((addon) => (
               <Card key={addon.title} className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] transition-all">
                 <CardContent className="p-5 flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                     <addon.icon className="w-5 h-5 text-[#FF7A00]" />
                   </div>
                   <div>
                     <h3 className="text-white font-semibold mb-1">{addon.title}</h3>
                     <p className="text-white/50 text-sm mb-2">{addon.desc}</p>
                     <span className="text-[#FF7A00] text-sm font-medium">{addon.price}</span>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </Section>
 
       {/* Process */}
       <Section className="py-20 px-4">
         <div className="max-w-4xl mx-auto">
           <div className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4">Como Funciona a Implantação</h2>
             <p className="text-white/60">4 passos para você começar a vender.</p>
           </div>
 
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {processSteps.map((step, i) => (
                <div key={step.step} className="relative text-center">
                  {i < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-gradient-to-r from-[#FF7A00]/50 to-transparent" />
                  )}
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FF2D55] flex items-center justify-center mx-auto mb-4 text-white font-bold">
                   {step.step}
                 </div>
                 <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                 <p className="text-white/50 text-sm">{step.desc}</p>
               </div>
             ))}
           </div>
         </div>
       </Section>
 
       {/* FAQ */}
       <Section id="faq" className="py-20 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
         <div className="max-w-3xl mx-auto">
           <div className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4">Perguntas Frequentes</h2>
           </div>
 
           <Accordion type="single" collapsible className="space-y-3">
             {faqItems.map((item, i) => (
               <AccordionItem
                 key={i}
                 value={`item-${i}`}
                 className="bg-white/[0.02] border border-white/10 rounded-xl px-5 data-[state=open]:bg-white/[0.05]"
               >
                 <AccordionTrigger className="text-white hover:no-underline py-4">
                   {item.q}
                 </AccordionTrigger>
                 <AccordionContent className="text-white/60 pb-4">
                   {item.a}
                 </AccordionContent>
               </AccordionItem>
             ))}
           </Accordion>
         </div>
       </Section>
 
       {/* Final CTA */}
       <Section className="py-20 px-4">
         <div className="max-w-4xl mx-auto">
           <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF7A00] to-[#FF2D55] p-8 md:p-12 text-center">
             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
             <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] text-white mb-4">
                  Comece agora com 7 dias grátis
                </h2>
                <p className="text-white/80 mb-8 max-w-xl mx-auto">
                  Crie sua loja em minutos e teste todas as funcionalidades sem compromisso.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                     to="/auth/signup/lojista"
                     className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-7 rounded-full bg-white text-[#FF7A00] font-semibold hover:bg-white/90 transition-all"
                   >
                     Criar minha loja (Teste 7 dias)
                     <ArrowRight className="w-4 h-4" />
                   </Link>
                  <Link
                    to="/auth/login?redirect=/onboarding/create-store"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-7 rounded-full border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
                  >
                    Já tenho conta — Entrar
                  </Link>
                </div>
             </div>
           </div>
         </div>
       </Section>
 
       {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <Link to="/" className="text-xl font-bold font-['Poppins',sans-serif] bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] bg-clip-text text-transparent">
                  SpeedSlice
                </Link>
                <p className="text-white/50 text-sm mt-1">Plataforma de delivery multi-loja</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-white/50">
                <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                <a href="mailto:contato@speedslice.com" className="hover:text-white transition-colors break-all">contato@speedslice.com</a>
              </div>
             <a
                href="https://wa.me/5541996829083"
                target="_blank"
               rel="noopener noreferrer"
               className="flex items-center gap-2 text-[#FF7A00] hover:text-[#FF2D55] transition-colors"
             >
               <MessageSquare className="w-4 h-4" />
               WhatsApp
             </a>
           </div>
           <div className="text-center text-white/30 text-xs mt-8">
             © {new Date().getFullYear()} SpeedSlice. Todos os direitos reservados.
           </div>
         </div>
        </footer>

        {/* Customer info form dialog */}
        {showCustomerForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCustomerForm(false)} />
            <div className="relative bg-[#15151E] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Seus dados</h3>
                <p className="text-sm text-white/50">Preencha para gerar o pagamento via PIX</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Nome completo</label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">E-mail</label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Telefone / WhatsApp</label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustomerForm(false)}
                  className="flex-1 py-2.5 rounded-full border border-white/20 text-white/70 text-sm font-medium hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCustomerFormSubmit}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#FF7A00]/25 transition-all"
                >
                  Gerar PIX
                </button>
              </div>
            </div>
          </div>
        )}

        <PixPaymentModal
          open={pixModalOpen}
          onOpenChange={(open) => { setPixModalOpen(open); if (!open) setSelectedPlanForPayment(null); }}
          planName={pixModalData.planName}
          amount={pixModalData.amount}
          pixCopiaECola={pixModalData.pixCopiaECola}
          qrCodeImage={pixModalData.qrCodeImage}
          txid={pixModalData.txid}
          isLoading={generatingPix}
          onPaymentConfirmed={() => {
            toast.success('Pagamento confirmado! Entraremos em contato para configurar sua loja.');
            setSelectedPlanForPayment(null);
          }}
        />
      </div>
    );
  }