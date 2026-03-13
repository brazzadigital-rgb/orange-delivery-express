import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Pizza, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import logoWhite from '@/assets/logo-white.png';
import signupHero from '@/assets/signup-hero.jpg';

// Helper function to get user's primary role and redirect path
async function getUserRedirectPath(userId: string, isPortal: boolean): Promise<string> {
  console.log('[Login] getUserRedirectPath called:', { userId, isPortal, host: window.location.hostname });
  
  const { data: globalRoles, error: globalError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  console.log('[Login] Global roles query:', { globalRoles, globalError });

  const { data: storeRoles, error: storeError } = await supabase
    .from('store_users')
    .select('role, store_id')
    .eq('user_id', userId);

  console.log('[Login] Store roles query:', { storeRoles, storeError });

  // Also check owner_email — always, regardless of store_users
  let hasOwnedStore = false;
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (authUser?.email) {
    const { data: ownedStore } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_email', authUser.email)
      .limit(1)
      .maybeSingle();
    hasOwnedStore = !!ownedStore;
  }

  const globalRoleSet = new Set<string>();
  globalRoles?.forEach(r => globalRoleSet.add(r.role));

  const storeRoleSet = new Set<string>();
  storeRoles?.forEach(r => storeRoleSet.add(r.role));

  console.log('[Login] Role sets:', { global: [...globalRoleSet], store: [...storeRoleSet], isPortal, hasOwnedStore });

  // Global SaaS owners always go to /owner dashboard regardless of domain
  if (globalRoleSet.has('owner')) {
    console.log('[Login] Redirecting to /owner (global owner)');
    return '/owner';
  }

  // User is store staff/admin/owner via store_users OR owner via owner_email
  const isStoreAdmin = storeRoleSet.has('owner') || storeRoleSet.has('admin') || storeRoleSet.has('staff') || hasOwnedStore;
  
  if (isStoreAdmin) {
    // On portal/preview: send to store selector (avoids requireStoreAccess loop)
    if (isPortal) {
      console.log('[Login] Portal detected + store admin, redirecting to /minha-loja');
      return '/minha-loja';
    }
    // On store subdomain: go directly to admin
    const storeId = storeRoles?.find(r => ['owner', 'admin', 'staff'].includes(r.role))?.store_id;
    if (storeId) {
      const { data: gate } = await supabase.rpc('get_billing_gate', { p_store_id: storeId });
      if (gate === 'blocked') return '/expired';
      if (gate === 'past_due') return '/admin';
    }
    return '/admin';
  }

  if (globalRoleSet.has('admin') || globalRoleSet.has('staff')) return '/admin';
  if (globalRoleSet.has('driver') || storeRoleSet.has('driver')) return '/driver';
  if (globalRoleSet.has('waiter')) return '/waiter';

  // Regular customers go to the app — even without store_users entries
  // Only redirect to onboarding if they explicitly have no global role at all
  // (handle_new_user trigger always creates a 'customer' role)
  return '/app/home';
}

const BENEFITS = [
  'Cardápio digital completo',
  'Gestão de pedidos em tempo real',
  'Relatórios e métricas',
  'App próprio para seus clientes',
];

export default function Login() {
  const { config } = useAppConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const didNavigateRef = useRef(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  
  // Detect if we're on the main portal (not a store subdomain)
  const isPortalDomain = (() => {
    const host = window.location.hostname.split(':')[0];
    if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return true;
    if (host.endsWith('.lovable.app') || host.endsWith('.lovableproject.com')) return true;
    // Check if it's one of the known portal base domains (e.g. deliverylitoral.com.br)
    const PORTAL_BASE_DOMAINS = ['deliverylitoral.com.br'];
    if (PORTAL_BASE_DOMAINS.some(d => host === d || host === `www.${d}`)) return true;
    // System subdomains on portal domains (app.deliverylitoral.com.br, etc.)
    const PORTAL_HOSTS = ['app', 'www', 'admin', 'api'];
    if (PORTAL_BASE_DOMAINS.some(d => host.endsWith(`.${d}`) && PORTAL_HOSTS.includes(host.slice(0, -(`.${d}`).length)))) return true;
    // Any other subdomain on portal domains = store subdomain
    if (PORTAL_BASE_DOMAINS.some(d => host.endsWith(`.${d}`))) return false;
    return true; // unknown domain, treat as portal
  })();
  
  const isSystemLogin = isPortalDomain || (redirectParam || '').includes('onboarding') || (redirectParam || '').includes('create-store');

  const logoUrl = isSystemLogin ? null : config?.app_logo_url;
  const appName = isSystemLogin ? '' : (config?.app_name || '');

  const fromValue = (location.state as any)?.from;
  const fromState = typeof fromValue === 'string' ? fromValue : fromValue?.pathname;
  const effectiveFrom = fromState || redirectParam;
  const safeFromState =
    typeof effectiveFrom === 'string' &&
    effectiveFrom.length > 0 &&
    !effectiveFrom.startsWith('/auth') &&
    !effectiveFrom.includes('minha-loja');

  useEffect(() => {
    let isMounted = true;

    const handleRedirect = async () => {
      if (didNavigateRef.current) return;
      if (authLoading || !user) return;

      try {
        if (!isMounted) return;
        setRedirecting(true);

        // Always check role first — global owners must go to /owner
        const redirectPath = await getUserRedirectPath(user.id, isPortalDomain);
        
        // Only honor fromState if user is NOT a global owner
        // (owners must always land on /owner to avoid cross-tenant leakage)
        if (safeFromState && redirectPath !== '/owner') {
          navigate(effectiveFrom!, { replace: true });
          return;
        }

        navigate(redirectPath, { replace: true });
      } catch (error: any) {
        console.error('Redirect error:', error);
        toast.error('Erro ao redirecionar. Tente novamente.');
        if (isMounted) setRedirecting(false);
      }
    };

    void handleRedirect();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, navigate, effectiveFrom, safeFromState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      didNavigateRef.current = true;
      setRedirecting(true);

      toast.success('Login realizado com sucesso!');

      if (data.user) {
        // Always check role first — global owners must go to /owner
        const redirectPath = await getUserRedirectPath(data.user.id, isPortalDomain);
        
        // Only honor fromState if user is NOT a global owner
        if (safeFromState && redirectPath !== '/owner') {
          navigate(effectiveFrom!, { replace: true });
          return;
        }

        navigate(redirectPath, { replace: true });
      } else {
        navigate('/app/home', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      didNavigateRef.current = false;
      setRedirecting(false);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || redirecting) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isSystemLogin ? 'bg-[#07070D]' : 'bg-background'}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isSystemLogin ? 'bg-[#07070D]' : 'bg-background'}`}>
        <LoadingSpinner />
      </div>
    );
  }

  // ── System login (onboarding flow) — matches OwnerSignup layout ──
  if (isSystemLogin) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#07070D] overflow-hidden relative">
        {/* Left panel - Branding with hero image */}
        <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-12 xl:p-16">
          <div className="absolute inset-0 -top-px -left-px -right-px -bottom-px bg-[#07070D]">
            <img src={signupHero} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070D] via-[#07070D]/60 to-[#07070D]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07070D]/20 to-[#07070D]/40" />
          </div>

          <div className="relative z-10">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/[0.08] backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-[hsl(28,100%,50%)]" />
                <span className="text-sm text-white/90 font-medium">Teste grátis por 7 dias</span>
              </div>

              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight drop-shadow-lg">
                Transforme seu <br />
                <span className="bg-gradient-to-r from-[hsl(32,100%,55%)] to-[hsl(350,80%,55%)] bg-clip-text text-transparent">
                  negócio digital
                </span>
              </h1>

              <p className="text-lg text-white/70 max-w-md leading-relaxed drop-shadow">
                Tudo que você precisa para gerenciar pedidos, cardápio e entregas em uma só plataforma.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4 animate-fade-in [animation-delay:0.3s]">
            {BENEFITS.map((benefit, i) => (
              <div
                key={benefit}
                className="flex items-center gap-3 text-white/80 animate-fade-in"
                style={{ animationDelay: `${0.4 + i * 0.1}s` }}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] flex items-center justify-center shadow-lg shadow-[hsl(28,100%,50%/0.3)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium drop-shadow">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="absolute right-0 top-[15%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
        </div>

        {/* Right panel - Login Form */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 lg:py-0 relative z-10">
          <div className="w-full max-w-[420px] animate-fade-in">
            <div className="text-center mb-6">
              <Link to="/planos" className="inline-block">
                <img src={logoWhite} alt="Logo" className="h-14 max-w-[220px] object-contain mx-auto" />
              </Link>
            </div>

            <div className="relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.08] opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-[hsl(28,100%,50%/0.15)] to-[hsl(350,80%,55%/0.08)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />

              <div className="relative bg-[#0F0F18]/80 backdrop-blur-xl rounded-2xl p-7 sm:p-8 border border-white/[0.06]">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta!</h2>
                  <p className="text-white/45 text-sm">Entre para continuar</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                      E-mail
                    </Label>
                    <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-[hsl(28,100%,50%/0.4)] shadow-[0_0_20px_-5px_hsl(28,100%,50%/0.2)]' : ''}`}>
                      <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'email' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25'}`} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="pl-11 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                      Senha
                    </Label>
                    <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-[hsl(28,100%,50%/0.4)] shadow-[0_0_20px_-5px_hsl(28,100%,50%/0.2)]' : ''}`}>
                      <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'password' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25'}`} />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="pl-11 pr-11 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <Link
                      to={`/auth/forgot${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
                      className="text-sm text-[hsl(28,100%,55%)] hover:text-[hsl(28,100%,65%)] transition-colors duration-200 hover:underline underline-offset-4"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="relative w-full h-13 text-base rounded-xl bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white font-semibold border-0 overflow-hidden group/btn transition-all duration-300 hover:shadow-[0_8px_30px_-5px_hsl(28,100%,50%/0.4)] active:scale-[0.98]"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          'Entrando...'
                        ) : (
                          <>
                            Entrar
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                          </>
                        )}
                      </span>
                    </Button>
                  </div>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/[0.06]" />
                    </div>
                  </div>

                  <p className="text-center text-white/40 text-sm">
                    Não tem uma conta?{' '}
                    <Link
                      to="/auth/signup/lojista"
                      className="text-[hsl(28,100%,55%)] font-medium hover:text-[hsl(28,100%,65%)] transition-colors duration-200 hover:underline underline-offset-4"
                    >
                      Cadastre-se
                    </Link>
                  </p>
                </form>
              </div>
            </div>

            <p className="text-center text-white/20 text-xs mt-6 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              Seus dados estão protegidos com criptografia
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Customer/tenant login — Dark Premium layout ──
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#07070D] overflow-hidden relative">
      {/* Left panel - Branding with store logo */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-12 xl:p-16">
        <div className="absolute inset-0 bg-[#07070D]">
          <img src={signupHero} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07070D] via-[#07070D]/60 to-[#07070D]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07070D]/20 to-[#07070D]/40" />
        </div>

        <div className="relative z-10">
          <div className="space-y-8 animate-fade-in">

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight drop-shadow-lg">
              Peça pelo <br />
              <span className="bg-gradient-to-r from-[hsl(32,100%,55%)] to-[hsl(350,80%,55%)] bg-clip-text text-transparent">
                app agora
              </span>
            </h1>

            <p className="text-lg text-white/70 max-w-md leading-relaxed drop-shadow">
              Faça pedidos, acompanhe em tempo real e aproveite promoções exclusivas.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4 animate-fade-in [animation-delay:0.3s]">
          {['Cardápio completo e atualizado', 'Acompanhe seu pedido em tempo real', 'Promoções e cupons exclusivos', 'Programa de fidelidade'].map((benefit, i) => (
            <div
              key={benefit}
              className="flex items-center gap-3 text-white/80 animate-fade-in"
              style={{ animationDelay: `${0.4 + i * 0.1}s` }}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] flex items-center justify-center shadow-lg shadow-[hsl(28,100%,50%/0.3)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium drop-shadow">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="absolute right-0 top-[15%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
      </div>

      {/* Right panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:py-0 relative z-10">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Store logo — same position as portal logo */}
          <div className="text-center mb-6">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-14 max-w-[220px] object-contain mx-auto" />
            ) : appName ? (
              <span className="text-2xl font-bold text-white">{appName}</span>
            ) : null}
          </div>

          <div className="relative group">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.08] opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-[hsl(28,100%,50%/0.15)] to-[hsl(350,80%,55%/0.08)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />

            <div className="relative bg-[#0F0F18]/80 backdrop-blur-xl rounded-2xl p-7 sm:p-8 border border-white/[0.06]">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta!</h2>
                <p className="text-white/45 text-sm">Entre para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                    E-mail
                  </Label>
                  <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-[hsl(28,100%,50%/0.4)] shadow-[0_0_20px_-5px_hsl(28,100%,50%/0.2)]' : ''}`}>
                    <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'email' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25'}`} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="pl-11 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                    Senha
                  </Label>
                  <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-[hsl(28,100%,50%/0.4)] shadow-[0_0_20px_-5px_hsl(28,100%,50%/0.2)]' : ''}`}>
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'password' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25'}`} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="pl-11 pr-11 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <Link
                    to="/auth/forgot"
                    className="text-sm text-[hsl(28,100%,55%)] hover:text-[hsl(28,100%,65%)] transition-colors duration-200 hover:underline underline-offset-4"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="relative w-full h-13 text-base rounded-xl bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white font-semibold border-0 overflow-hidden group/btn transition-all duration-300 hover:shadow-[0_8px_30px_-5px_hsl(28,100%,50%/0.4)] active:scale-[0.98]"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        'Entrando...'
                      ) : (
                        <>
                          Entrar
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                        </>
                      )}
                    </span>
                  </Button>
                </div>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                </div>

                <p className="text-center text-white/40 text-sm">
                  Não tem uma conta?{' '}
                  <Link
                    to="/auth/signup"
                    className="text-[hsl(28,100%,55%)] font-medium hover:text-[hsl(28,100%,65%)] transition-colors duration-200 hover:underline underline-offset-4"
                  >
                    Cadastre-se
                  </Link>
                </p>
              </form>
            </div>
          </div>

          <p className="text-center text-white/20 text-xs mt-6 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            Seus dados estão protegidos com criptografia
          </p>
        </div>
      </div>
    </div>
  );
}
