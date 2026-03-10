import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { setTenantOverride } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Store, ArrowRight, ArrowLeft, CheckCircle2, Loader2, LogOut, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoWhite from '@/assets/logo-white.png';
import stepBusinessType from '@/assets/onboarding/step-business-type.jpg';
import stepStoreName from '@/assets/onboarding/step-store-name.jpg';
import stepContact from '@/assets/onboarding/step-contact.jpg';
import stepConfirmation from '@/assets/onboarding/step-confirmation.jpg';

const STORE_TYPES = [
  { value: 'pizzaria', label: '🍕 Pizzaria', description: 'Pizza Builder, tamanhos, sabores' },
  { value: 'hamburgueria', label: '🍔 Hamburgueria', description: 'Combos, adicionais, montagem' },
  { value: 'sushi', label: '🍣 Sushi / Japonesa', description: 'Combos por peça, mix de sabores' },
  { value: 'bebidas', label: '🍺 Distribuidora', description: 'Catálogo direto, filtros rápidos' },
  { value: 'acai', label: '🍇 Açaí / Sorvete', description: 'Monte seu açaí, complementos' },
  { value: 'padaria', label: '🥖 Padaria / Confeitaria', description: 'Produtos variados, encomendas' },
  { value: 'restaurante', label: '🍽️ Restaurante', description: 'Cardápio completo, mesas' },
  { value: 'generico', label: '🏪 Outro', description: 'Configuração personalizada' },
] as const;

const STEPS = [
  { title: 'Tipo de Negócio', description: 'Qual o segmento da sua loja?', image: stepBusinessType, headline: 'Escolha seu\nsegmento' },
  { title: 'Dados da Loja', description: 'Nome e identificação', image: stepStoreName, headline: 'Dê vida à\nsua marca' },
  { title: 'Contato', description: 'Telefone e endereço', image: stepContact, headline: 'Conecte-se\naos clientes' },
  { title: 'Confirmação', description: 'Revisão e criação', image: stepConfirmation, headline: 'Tudo pronto\npara lançar!' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 32);
}

export default function CreateStore() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    phone: '',
    address: '',
    store_type: '' as string,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [createdStore, setCreatedStore] = useState<{ slug: string; storeId: string } | null>(null);

  const updateField = (field: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !slugManuallyEdited) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      navigate('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const res = await supabase.functions.invoke('create-store', {
        body: {
          name: form.name.trim(),
          slug: form.slug.trim(),
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          store_type: form.store_type || 'generico',
        },
      });

      if (res.error) {
        throw new Error(res.error.message || 'Erro ao criar loja');
      }

      const result = res.data;
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Loja criada com sucesso! 🎉');

      setTenantOverride(result.store_id);

      const redirect = searchParams.get('redirect');
      if (redirect) {
        window.location.href = redirect;
      } else {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname.includes('lovable')) {
          window.location.href = '/admin/dashboard';
        } else {
          const parts = hostname.split('.');
          const isCcTld = parts.length >= 3 && parts[parts.length - 2].length <= 3 && parts[parts.length - 1].length <= 3;
          const baseDomain = isCcTld ? parts.slice(-3).join('.') : parts.slice(-2).join('.');
          window.location.href = `https://${result.slug}.${baseDomain}/admin/dashboard`;
        }
      }
    } catch (err: any) {
      console.error('Create store error:', err);
      toast.error(err.message || 'Erro ao criar loja');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login', { replace: true });
  };

  const canProceedStep0 = form.store_type !== '';
  const canProceedStep1 = form.name.trim().length >= 3 && form.slug.trim().length >= 3;
  const canProceedStep2 = true;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070D] p-4">
        <div className="relative bg-[#0F0F18]/80 backdrop-blur-xl rounded-2xl p-7 border border-white/[0.06] max-w-md w-full text-center space-y-5">
          <Store className="w-12 h-12 mx-auto text-[hsl(28,100%,50%)]" />
          <h1 className="text-xl font-bold text-white">Crie sua Loja</h1>
          <p className="text-white/50">Faça login para começar</p>
          <Button
            onClick={() => navigate('/auth/login?redirect=/onboarding/create-store')}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white font-semibold border-0"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  const selectedType = STORE_TYPES.find(t => t.value === form.store_type);
  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#07070D] overflow-hidden relative">
      {/* Left panel — Hero image that changes per step */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-12 xl:p-16">
        {/* Image with transition */}
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-in-out',
              i === step ? 'opacity-100' : 'opacity-0'
            )}
          >
            <img src={s.image} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070D] via-[#07070D]/60 to-[#07070D]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07070D]/20 to-[#07070D]/40" />
          </div>
        ))}

        <div className="relative z-10">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/[0.08] backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[hsl(28,100%,50%)]" />
              <span className="text-sm text-white/90 font-medium">Passo {step + 1} de {STEPS.length}</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight drop-shadow-lg whitespace-pre-line">
              {currentStep.headline.split('\n')[0]}<br />
              <span className="bg-gradient-to-r from-[hsl(32,100%,55%)] to-[hsl(350,80%,55%)] bg-clip-text text-transparent">
                {currentStep.headline.split('\n')[1]}
              </span>
            </h1>

            <p className="text-lg text-white/70 max-w-md leading-relaxed drop-shadow">
              Configure tudo em minutos e comece a vender hoje mesmo.
            </p>
          </div>
        </div>

        {/* Stepper dots on left panel */}
        <div className="relative z-10 flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500',
                i < step
                  ? 'bg-gradient-to-br from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white shadow-lg shadow-[hsl(28,100%,50%/0.3)]'
                  : i === step
                    ? 'bg-gradient-to-br from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white shadow-lg shadow-[hsl(28,100%,50%/0.3)] ring-2 ring-white/20'
                    : 'bg-white/[0.06] text-white/30 border border-white/[0.08]'
              )}>
                {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 rounded transition-colors duration-500',
                  i < step ? 'bg-[hsl(28,100%,50%)]' : 'bg-white/[0.08]'
                )} />
              )}
            </div>
          ))}
        </div>

        <div className="absolute right-0 top-[15%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:py-0 relative z-10">
        <div className="w-full max-w-[480px] animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/planos" className="inline-block">
              <img src={logoWhite} alt="Logo" className="h-14 max-w-[220px] object-contain mx-auto" />
            </Link>
          </div>

          {/* Mobile stepper */}
          <div className="flex items-center gap-2 mb-6 lg:hidden justify-center">
            {STEPS.map((_, i) => (
              <div key={i} className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                i === step ? 'w-8 bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)]' : i < step ? 'w-4 bg-[hsl(28,100%,50%)]' : 'w-4 bg-white/[0.08]'
              )} />
            ))}
          </div>

          {/* Card */}
          <div className="relative group">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.08] opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-[hsl(28,100%,50%/0.15)] to-[hsl(350,80%,55%/0.08)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />

            <div className="relative bg-[#0F0F18]/80 backdrop-blur-xl rounded-2xl p-7 sm:p-8 border border-white/[0.06]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">{currentStep.title}</h2>
                <p className="text-white/45 text-sm">{currentStep.description}</p>
              </div>

              {/* Step 0: Store Type */}
              {step === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {STORE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateField('store_type', type.value)}
                      className={cn(
                        'text-left p-4 rounded-xl border transition-all duration-300',
                        form.store_type === type.value
                          ? 'border-[hsl(28,100%,50%)] bg-[hsl(28,100%,50%/0.1)] ring-1 ring-[hsl(28,100%,50%/0.3)] shadow-[0_0_20px_-5px_hsl(28,100%,50%/0.2)]'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
                      )}
                    >
                      <p className="text-base font-semibold text-white">{type.label}</p>
                      <p className="text-xs text-white/40 mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 1: Store name & slug */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                      Nome da Loja *
                    </Label>
                    <div className="relative rounded-xl">
                      <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/25" />
                      <Input
                        id="name"
                        placeholder="Ex: Pizzaria do João"
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        autoFocus
                        className="pl-11 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-2 focus-visible:ring-[hsl(28,100%,50%/0.4)] focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                      Slug (URL) *
                    </Label>
                    <Input
                      id="slug"
                      placeholder="pizzaria-do-joao"
                      value={form.slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      }}
                      className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-2 focus-visible:ring-[hsl(28,100%,50%/0.4)] focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                    />
                    <p className="text-xs text-white/30 mt-1">
                      Sua loja ficará em: <span className="font-medium text-[hsl(28,100%,55%)]">{form.slug || '...'}.seudominio.com.br</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Contact */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                      Telefone / WhatsApp
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      autoFocus
                      className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-2 focus-visible:ring-[hsl(28,100%,50%/0.4)] focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                      Endereço
                    </Label>
                    <Input
                      id="address"
                      placeholder="Rua Exemplo, 123 - Bairro, Cidade"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-2 focus-visible:ring-[hsl(28,100%,50%/0.4)] focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-3">
                    {[
                      { label: 'Tipo', value: selectedType?.label || '—' },
                      { label: 'Nome', value: form.name },
                      { label: 'Slug', value: form.slug },
                      ...(form.phone ? [{ label: 'Telefone', value: form.phone }] : []),
                      ...(form.address ? [{ label: 'Endereço', value: form.address }] : []),
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-sm text-white/40">{item.label}</span>
                        <span className="text-sm font-medium text-white text-right max-w-[220px]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/30 text-center">
                    Sua loja terá 7 dias de teste grátis. Você poderá personalizar tudo depois.
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center gap-3 mt-7">
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    disabled={loading}
                    className="flex-1 h-12 rounded-xl border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.04] hover:border-white/[0.15] transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button
                    className="relative flex-1 h-12 text-base rounded-xl bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white font-semibold border-0 overflow-hidden group/btn transition-all duration-300 hover:shadow-[0_8px_30px_-5px_hsl(28,100%,50%/0.4)] active:scale-[0.98]"
                    onClick={() => setStep(s => s + 1)}
                    disabled={
                      step === 0 ? !canProceedStep0 :
                      step === 1 ? !canProceedStep1 :
                      !canProceedStep2
                    }
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                    <span className="relative flex items-center justify-center gap-2">
                      Próximo
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </span>
                  </Button>
                ) : (
                  <Button
                    className="relative flex-1 h-12 text-base rounded-xl bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white font-semibold border-0 overflow-hidden group/btn transition-all duration-300 hover:shadow-[0_8px_30px_-5px_hsl(28,100%,50%/0.4)] active:scale-[0.98]"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Criar Loja
                        </>
                      )}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Back to stores + Logout */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={() => navigate('/minha-loja')}
              className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para minhas lojas
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors duration-300"
            >
              <LogOut className="w-4 h-4" />
              Sair e entrar com outra conta
            </button>
          </div>

          <p className="text-center text-white/20 text-xs mt-4 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            Seus dados estão protegidos com criptografia
          </p>
        </div>
      </div>
    </div>
  );
}
