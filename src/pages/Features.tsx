import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import logoWhite from "@/assets/logo-white.png";
import { Link } from "react-router-dom";
import {
  Check, ChevronDown, Smartphone, Store, ChefHat, Truck, Building2,
  Pizza, ShoppingCart, Search, Heart, CreditCard, MapPin, Bell,
  Download, Timer, Users, BarChart3, Palette, Shield, Zap, Globe,
  MessageSquare, ArrowRight, Sparkles, Crown, Star, X, Menu,
  Package, Network, QrCode, Printer, Gift, TrendingUp, Eye,
  Settings, Clock, Receipt, Headphones, CircleDollarSign,
  Utensils, LayoutDashboard, Navigation, UserCheck, Megaphone,
  Ticket, Image, Tag, Layers, Monitor, RefreshCw, Lock,
  Wifi, Volume2, FileText, Award, Percent
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Scroll reveal hook
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) { setIsVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function Section({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section ref={ref} id={id} className={cn("transition-all duration-700 ease-out", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8", className)}>
      {children}
    </section>
  );
}

// Mobile nav
function MobileNav() {
  const [open, setOpen] = useState(false);
  const navItems = ["App Cliente", "Painel Admin", "Motoboy", "Mesas", "Garçom"];
  return (
    <>
      <button onClick={() => setOpen(true)} className="md:hidden p-2 text-white/70 hover:text-white"><Menu className="w-6 h-6" /></button>
{open && ReactDOM.createPortal(
        <div className="fixed inset-0 md:hidden" style={{ zIndex: 99999 }}>
          <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-72 border-l border-white/10 p-6 shadow-2xl" style={{ backgroundColor: '#0B0B10', opacity: 1 }}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-white/70"><X className="w-6 h-6" /></button>
            <nav className="mt-12 space-y-4">
              {navItems.map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setOpen(false)} className="block py-2 text-white/70 hover:text-white transition-colors">{item}</a>
              ))}
              <Link to="/planos" onClick={() => setOpen(false)} className="block py-3 px-4 mt-4 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-white text-center font-semibold">Ver Planos</Link>
            </nav>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Feature card
function FeatureItem({ icon: Icon, text, detail }: { icon: any; text: string; detail?: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF7A00]/20 to-[#FF2D55]/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <Icon className="w-4 h-4 text-[#FF7A00]" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/90">{text}</p>
        {detail && <p className="text-xs text-white/50 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

// Module section
function ModuleSection({ id, icon: Icon, title, subtitle, color, features }: {
  id: string; icon: any; title: string; subtitle: string; color: string;
  features: { icon: any; text: string; detail?: string }[];
}) {
  return (
    <Section id={id} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-3">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", color)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-['Poppins',sans-serif] text-white">{title}</h2>
            <p className="text-white/50 text-sm">{subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {features.map((f, i) => <FeatureItem key={i} {...f} />)}
        </div>
      </div>
    </Section>
  );
}

// Flow step
function FlowStep({ step, title, desc, icon: Icon }: { step: number; title: string; desc: string; icon: any }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FF2D55] flex items-center justify-center text-white font-bold text-sm shrink-0">
        {step}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-[#FF7A00]" />
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
        <p className="text-sm text-white/60">{desc}</p>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <div className="min-h-screen bg-[#0B0B10] text-white font-['Inter',sans-serif] overflow-x-hidden w-full max-w-full">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0B0B10]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <img src={logoWhite} alt="Logo" className="h-10 max-w-[180px] object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {[
              { label: "App Cliente", href: "#app-cliente" },
              { label: "Painel Admin", href: "#painel-admin" },
              { label: "Motoboy", href: "#app-motoboy" },
              { label: "Mesas & QR", href: "#mesas-&-qr" },
              { label: "Garçom", href: "#garçom" },
            ].map((n) => (
              <a key={n.label} href={n.href} className="text-white/70 hover:text-white transition-colors">{n.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/planos" className="hidden md:inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#FF7A00]/25 transition-all">
              Ver Planos
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF7A00]/10 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 mb-6">
            <FileText className="w-4 h-4 text-[#FF7A00]" />
            Briefing Completo
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-['Poppins',sans-serif] leading-tight mb-6">
            Tudo que o sistema{" "}
            <span className="bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] bg-clip-text text-transparent">
              faz por você
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10">
            Conheça em detalhes cada módulo, funcionalidade e fluxo da plataforma.
            Delivery, mesas, cozinha, motoboy, fidelidade, relatórios e muito mais — tudo integrado.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {["5 Módulos", "70+ Funcionalidades", "PWA Instalável", "Tempo Real", "Mesas QR Code"].map((b) => (
              <span key={b} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ───── MODULE 1: APP CLIENTE ───── */}
      <ModuleSection
        id="app-cliente"
        icon={Smartphone}
        title="App do Cliente"
        subtitle="Experiência de delivery completa instalável no celular (PWA)"
        color="bg-gradient-to-br from-blue-500 to-blue-700"
        features={[
          { icon: ShoppingCart, text: "Cardápio digital por categorias", detail: "Navegação por abas, fotos HD, busca por nome" },
          { icon: Search, text: "Busca inteligente", detail: "Encontre qualquer produto por nome ou descrição" },
          { icon: Heart, text: "Favoritos", detail: "Salve os itens que mais gosta para pedir de novo" },
          { icon: Pizza, text: "Monte sua Pizza", detail: "Builder de pizza com tamanho, sabores e adicionais passo a passo" },
          { icon: ShoppingCart, text: "Carrinho completo", detail: "Adicione, remova, altere quantidade e veja o total" },
          { icon: CreditCard, text: "Checkout em etapas", detail: "Endereço → Tipo de entrega → Pagamento → Revisão" },
          { icon: CircleDollarSign, text: "PIX, Cartão e Dinheiro", detail: "QR Code PIX automático (Efí), troco calculado" },
          { icon: MapPin, text: "Múltiplos endereços", detail: "Cadastre e gerencie vários endereços de entrega" },
          { icon: Eye, text: "Acompanhamento do pedido", detail: "Timeline de status em tempo real + ETA" },
          { icon: Navigation, text: "Rastreio no mapa ao vivo", detail: "Veja o motoboy se movendo até seu endereço" },
          { icon: Bell, text: "Notificações push", detail: "Alertas de status do pedido no celular" },
          { icon: Volume2, text: "Sons por status", detail: "Alerta sonoro quando o status do pedido muda" },
          { icon: Download, text: "Instalável (PWA)", detail: "Funciona como app nativo, sem loja de apps" },
          { icon: Gift, text: "Programa de Fidelidade", detail: "Acumule pontos e troque por recompensas" },
          { icon: Star, text: "Avaliações", detail: "Avalie o app e veja avaliações de outros clientes" },
          { icon: Megaphone, text: "Promoções e banners", detail: "Carrossel de promoções e banners na home" },
          { icon: Clock, text: "Horários da loja", detail: "Veja quando a loja está aberta/fechada" },
          { icon: Headphones, text: "Suporte via WhatsApp", detail: "Link direto para atendimento" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4"><div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>

      {/* ───── MODULE 2: PAINEL ADMIN ───── */}
      <ModuleSection
        id="painel-admin"
        icon={Store}
        title="Painel Administrativo"
        subtitle="Gestão completa da operação de delivery e atendimento"
        color="bg-gradient-to-br from-[#FF7A00] to-[#FF2D55]"
        features={[
          { icon: LayoutDashboard, text: "Dashboard com métricas", detail: "Pedidos, faturamento, ticket médio, gráficos" },
          { icon: Bell, text: "Pedidos em tempo real", detail: "Novos pedidos com alerta sonoro configurável" },
          { icon: Check, text: "Fluxo de status", detail: "Aceitar → Preparar → Pronto → Em entrega → Entregue" },
          { icon: Package, text: "Gestão de produtos", detail: "Criar, editar, ativar/desativar com fotos" },
          { icon: Layers, text: "Categorias e adicionais", detail: "Organize o cardápio e crie opções extras" },
          { icon: Pizza, text: "Pizza Builder Admin", detail: "Configure tamanhos, sabores, preços e adicionais" },
          { icon: Ticket, text: "Cupons de desconto", detail: "Crie cupons com regras (valor mínimo, validade, usos)" },
          { icon: Megaphone, text: "Promoções", detail: "Crie promoções e notifique clientes" },
          { icon: Image, text: "Banners", detail: "Gerencie banners do carrossel da home" },
          { icon: MapPin, text: "Zonas de entrega", detail: "Raio ou polígono, taxa, tempo estimado, simulador" },
          { icon: Clock, text: "Horário automático", detail: "Abre/fecha por dia da semana" },
          { icon: Truck, text: "Gestão de motoboys", detail: "Cadastro, ativação e atribuição de entregas" },
          { icon: MapPin, text: "Mapa ao vivo", detail: "Veja todos os motoboys em tempo real" },
          { icon: Users, text: "Gestão de clientes", detail: "Lista de clientes, pedidos e dados" },
          { icon: UserCheck, text: "Staff e permissões", detail: "Crie admins e defina papéis de acesso" },
          { icon: Palette, text: "Branding do app", detail: "Logo, cores, nome, ícones do PWA" },
          { icon: Settings, text: "Configurações gerais", detail: "Loja, pagamentos, horários, impressão, sons" },
          { icon: BarChart3, text: "Relatórios completos", detail: "Vendas, produtos, clientes, operações, financeiro" },
          { icon: Gift, text: "Programa de fidelidade", detail: "Configure recompensas, pontos e acompanhe clientes" },
          { icon: Star, text: "Avaliações", detail: "Veja avaliações e configure alertas" },
          { icon: Printer, text: "Impressão de pedidos", detail: "Comanda de cozinha, slip de entrega, recibos" },
          { icon: Monitor, text: "KDS (Kitchen Display)", detail: "Tela da cozinha em tempo real para preparação" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4"><div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>

      {/* ───── MODULE 3: MOTOBOY ───── */}
      <ModuleSection
        id="app-motoboy"
        icon={Truck}
        title="App do Motoboy"
        subtitle="Interface simplificada para entregadores"
        color="bg-gradient-to-br from-green-500 to-emerald-700"
        features={[
          { icon: Package, text: "Pedidos atribuídos", detail: "Lista de entregas pendentes e em andamento" },
          { icon: MapPin, text: "Iniciar entrega", detail: "Ativa compartilhamento de localização em tempo real" },
          { icon: Navigation, text: "Navegação integrada", detail: "Abrir rota no Google Maps / Waze" },
          { icon: Check, text: "Confirmar entrega", detail: "Marque o pedido como entregue com um toque" },
          { icon: Eye, text: "Histórico", detail: "Consulte entregas anteriores e ganhos" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4"><div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>

      {/* ───── MODULE 4: MESAS QR ───── */}
      <ModuleSection
        id="mesas-&-qr"
        icon={QrCode}
        title="Mesas & QR Code"
        subtitle="Pedidos por mesa via QR Code — sem necessidade de login"
        color="bg-gradient-to-br from-purple-500 to-purple-700"
        features={[
          { icon: QrCode, text: "QR Code por mesa", detail: "Cada mesa tem um QR Code único" },
          { icon: ShoppingCart, text: "Cardápio digital na mesa", detail: "Cliente escaneia e faz pedido direto do celular" },
          { icon: Lock, text: "Sessões seguras", detail: "Token por sessão, expira automaticamente" },
          { icon: Eye, text: "Status do pedido na mesa", detail: "Acompanhe o preparo em tempo real" },
          { icon: Layers, text: "Junção de mesas", detail: "Mescle sessões para grupos grandes" },
          { icon: Receipt, text: "Recibo da sessão", detail: "Resumo com todos os itens e total" },
          { icon: Settings, text: "Admin: gerenciar mesas", detail: "Criar, editar, ativar/desativar mesas" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4"><div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>

      {/* ───── MODULE 5: GARÇOM ───── */}
      <ModuleSection
        id="garçom"
        icon={Utensils}
        title="Painel do Garçom"
        subtitle="Interface mobile otimizada para atendimento de mesas"
        color="bg-gradient-to-br from-amber-500 to-orange-700"
        features={[
          { icon: Eye, text: "Visão das mesas", detail: "Status de cada mesa (livre, ocupada, aguardando)" },
          { icon: ShoppingCart, text: "Lançar pedidos", detail: "Adicione itens à sessão da mesa" },
          { icon: Pizza, text: "Monte pizza pela mesa", detail: "Pizza Builder integrado ao pedido da mesa" },
          { icon: Bell, text: "Chamados", detail: "Receba chamados dos clientes na mesa" },
          { icon: Receipt, text: "Fechar sessão", detail: "Encerre a mesa e gere o recibo" },
        ]}
      />

      {/* ───── INTEGRATIONS ───── */}
      <Section className="py-20 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4 text-white">Integrações</h2>
            <p className="text-white/60">Conecte com as ferramentas que já usa.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: CreditCard, title: "Efí (Gerencianet)", desc: "Pagamento PIX automático com QR Code e webhook" },
              { icon: MapPin, title: "Google Maps", desc: "Mapa ao vivo, geocoding, cálculo de rotas e zonas" },
              { icon: Bell, title: "Push Notifications", desc: "Notificações via VAPID/web-push para o celular" },
              { icon: Package, title: "iFood", desc: "Receba pedidos do iFood direto no painel" },
              { icon: Printer, title: "Impressão térmica", desc: "Comanda de cozinha e slip de entrega" },
              { icon: MessageSquare, title: "WhatsApp", desc: "Link direto para suporte e mensagens de lead" },
              { icon: Wifi, title: "Realtime", desc: "Atualizações instantâneas de pedidos e status" },
              { icon: RefreshCw, title: "CEP automático", desc: "Preenchimento de endereço via API de CEP" },
            ].map((item) => (
              <Card key={item.title} className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] transition-all">
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A00]/20 to-[#FF2D55]/20 flex items-center justify-center mb-2">
                    <item.icon className="w-5 h-5 text-[#FF7A00]" />
                  </div>
                  <CardTitle className="text-white text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-white/60">{item.desc}</p></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── HOW IT WORKS FOR THE CLIENT ───── */}
      <Section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4 text-white">Como Funciona para o Cliente?</h2>
            <p className="text-white/60">O fluxo do pedido do início ao fim.</p>
          </div>

          <div className="space-y-4">
            <FlowStep step={1} icon={Download} title="Acessa e instala o app" desc="O cliente abre o link da loja no celular e instala como app (PWA) em um toque." />
            <FlowStep step={2} icon={Search} title="Navega pelo cardápio" desc="Explora categorias, busca por nome, vê fotos, descrições e preços dos produtos." />
            <FlowStep step={3} icon={ShoppingCart} title="Monta o pedido" desc="Adiciona itens ao carrinho, personaliza adicionais, monta pizza escolhendo sabores." />
            <FlowStep step={4} icon={CreditCard} title="Faz o pagamento" desc="Escolhe endereço, tipo de entrega, forma de pagamento (PIX, cartão ou dinheiro)." />
            <FlowStep step={5} icon={Eye} title="Acompanha em tempo real" desc="Vê a timeline de status do pedido e recebe notificação push a cada mudança." />
            <FlowStep step={6} icon={Navigation} title="Rastreia o motoboy" desc="Quando sai para entrega, vê a posição do motoboy no mapa ao vivo." />
            <FlowStep step={7} icon={Star} title="Avalia a experiência" desc="Após receber, pode avaliar o serviço e acumular pontos no programa de fidelidade." />
          </div>
        </div>
      </Section>

      {/* ───── HOW IT WORKS FOR THE ADMIN ───── */}
      <Section className="py-20 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4 text-white">Como Funciona para o Administrador?</h2>
            <p className="text-white/60">Fluxo operacional do dia a dia.</p>
          </div>

          <div className="space-y-4">
            <FlowStep step={1} icon={Settings} title="Configura a loja" desc="Define horários, zonas de entrega, taxas, meios de pagamento, branding e cardápio." />
            <FlowStep step={2} icon={Bell} title="Recebe pedido com alerta" desc="Novo pedido aparece no painel com alerta sonoro. O admin aceita ou recusa." />
            <FlowStep step={3} icon={ChefHat} title="Cozinha prepara" desc="O pedido aparece no KDS da cozinha. Quando pronto, muda o status." />
            <FlowStep step={4} icon={Truck} title="Atribui ao motoboy" desc="O admin atribui a entrega a um motoboy disponível." />
            <FlowStep step={5} icon={Navigation} title="Acompanha a entrega" desc="Vê a posição do motoboy no mapa ao vivo até a entrega ser confirmada." />
            <FlowStep step={6} icon={BarChart3} title="Analisa relatórios" desc="Acessa dashboard com vendas, ticket médio, produtos mais pedidos e métricas." />
          </div>
        </div>
      </Section>

      {/* ───── TECH STACK ───── */}
      <Section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4 text-white">Tecnologia de Ponta</h2>
          <p className="text-white/60 mb-10">Stack moderna, rápida e escalável.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              "React", "TypeScript", "Tailwind CSS", "Vite", "PWA",
              "Supabase", "Edge Functions", "Realtime", "Google Maps API",
              "Web Push", "Efí/PIX", "Zustand"
            ].map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 transition-all">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins',sans-serif] mb-4 text-white">
            Pronto para{" "}
            <span className="bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] bg-clip-text text-transparent">transformar</span>
            {" "}seu delivery?
          </h2>
          <p className="text-white/60 mb-8">Veja os planos ou fale com nosso time para uma demonstração.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/planos" className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-7 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2D55] text-white font-semibold hover:shadow-xl hover:shadow-[#FF7A00]/30 transition-all">
              Ver Planos e Preços <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://wa.me/5541996829083" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-7 rounded-full border-2 border-white/20 text-white font-semibold hover:bg-white/5 transition-all">
              <MessageSquare className="w-4 h-4" /> Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-white/40">© {new Date().getFullYear()} SpeedSlice. Todos os direitos reservados.</span>
          <div className="flex items-center gap-6">
            <Link to="/planos" className="text-sm text-white/40 hover:text-white/70 transition-colors">Planos</Link>
            <Link to="/" className="text-sm text-white/40 hover:text-white/70 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
