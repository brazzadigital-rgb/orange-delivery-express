import { useNavigate, Link } from 'react-router-dom';
import { Store, ArrowLeft, Home, ExternalLink, Loader2, MapPin, Sparkles, Lock, LogOut, Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRole';
import { useUserStores } from '@/hooks/useUserStores';
import { setTenantOverride } from '@/contexts/TenantContext';
import { clearClientState } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import logoWhite from '@/assets/logo-white.png';
import signupHero from '@/assets/signup-hero.jpg';

const PORTAL_BASE_DOMAIN = 'deliverylitoral.com.br';

export default function AccessDenied() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: stores = [], isLoading } = useUserStores();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login', { replace: true });
  };

  const handleGoToStore = (store: { id: string; slug: string }) => {
    console.log('[AccessDenied] Switching to store:', store.id, store.slug);
    // Clear ALL previous tenant state to prevent stale data
    queryClient.clear();
    clearClientState();
    // Set the new tenant override — TenantProvider will pick this up on reload
    setTenantOverride(store.id);
    // Full page reload to re-initialize TenantProvider with new override
    window.location.href = '/admin/dashboard';
  };

  const hasStores = stores.length > 0;
  const singleStore = stores.length === 1 ? stores[0] : null;

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
              <span className="text-sm text-white/90 font-medium">Painel Administrativo</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight drop-shadow-lg">
              Acesse sua <br />
              <span className="bg-gradient-to-r from-[hsl(32,100%,55%)] to-[hsl(350,80%,55%)] bg-clip-text text-transparent">
                loja agora
              </span>
            </h1>

            <p className="text-lg text-white/70 max-w-md leading-relaxed drop-shadow">
              Gerencie pedidos, cardápio e entregas em uma só plataforma — tudo pelo seu subdomínio exclusivo.
            </p>
          </div>
        </div>

        <div className="relative z-10" />
        <div className="absolute right-0 top-[15%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
      </div>

      {/* Right panel - Store selector */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:py-0 relative z-10">
        <div className="w-full max-w-[460px] animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/planos" className="inline-block">
              <img src={logoWhite} alt="Logo" className="h-14 max-w-[220px] object-contain mx-auto" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(28,100%,55%)]" />
              <p className="text-white/45 text-sm">Identificando suas lojas...</p>
            </div>
          ) : hasStores ? (
            <div className="relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.08] opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-[hsl(28,100%,50%/0.15)] to-[hsl(350,80%,55%/0.08)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />

              <div className="relative bg-[#0F0F18]/80 backdrop-blur-xl rounded-2xl p-7 sm:p-8 border border-white/[0.06]">
                {singleStore ? (
                  <>
                    {/* Single store */}
                    <div className="mb-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[hsl(28,100%,50%/0.2)] to-[hsl(350,80%,55%/0.1)] border border-white/[0.08] flex items-center justify-center">
                        <Store className="w-8 h-8 text-[hsl(28,100%,55%)]" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-1">Identificamos sua loja!</h2>
                      <p className="text-white/45 text-sm">
                        Logado como <span className="text-white/70">{user?.email}</span>
                      </p>
                    </div>

                    {/* Store card */}
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(28,100%,50%/0.2)] to-[hsl(350,80%,55%/0.15)] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
                          <Store className="w-6 h-6 text-[hsl(28,100%,55%)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-lg">{singleStore.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5 text-sm text-white/40">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{singleStore.slug}.{PORTAL_BASE_DOMAIN}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-white/40 text-sm text-center mb-5">
                      Para acessar o painel, entre pelo endereço exclusivo da sua loja.
                    </p>

                    <button
                      onClick={() => handleGoToStore(singleStore)}
                      className="relative w-full h-13 text-base rounded-xl bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white font-semibold border-0 overflow-hidden group/btn transition-all duration-300 hover:shadow-[0_8px_30px_-5px_hsl(28,100%,50%/0.4)] active:scale-[0.98] flex items-center justify-center gap-2 py-3"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                      <span className="relative flex items-center justify-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Acessar painel de "{singleStore.name}"
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Multiple stores */}
                    <div className="mb-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[hsl(28,100%,50%/0.2)] to-[hsl(350,80%,55%/0.1)] border border-white/[0.08] flex items-center justify-center">
                        <Store className="w-8 h-8 text-[hsl(28,100%,55%)]" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-1">Selecione sua loja</h2>
                      <p className="text-white/45 text-sm">
                        Logado como <span className="text-white/70">{user?.email}</span>
                      </p>
                      <p className="text-white/35 text-sm mt-2">
                        Você possui acesso a {stores.length} lojas. Para qual deseja ir?
                      </p>
                    </div>

                    <div className="space-y-2 mb-6 max-h-[320px] overflow-y-auto pr-1">
                      {stores.map((store) => (
                        <button
                          key={store.id}
                          onClick={() => handleGoToStore(store)}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-left hover:bg-white/[0.07] hover:border-[hsl(28,100%,50%/0.3)] transition-all duration-200 group/item"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(28,100%,50%/0.15)] to-[hsl(350,80%,55%/0.1)] border border-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover/item:from-[hsl(28,100%,50%/0.25)] transition-colors">
                              <Store className="w-5 h-5 text-[hsl(28,100%,55%)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate text-sm">{store.name}</h3>
                              <p className="text-xs text-white/30 mt-0.5">
                                {store.slug}.{PORTAL_BASE_DOMAIN}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-white/20 group-hover/item:text-[hsl(28,100%,55%)] transition-colors flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Bottom actions */}
                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                </div>

                <button
                  onClick={() => navigate('/onboarding/create-store')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white border border-dashed border-white/[0.1] hover:border-[hsl(28,100%,50%/0.4)] hover:bg-[hsl(28,100%,50%/0.05)] transition-all duration-300"
                >
                  <Plus className="w-4 h-4" />
                  Criar nova loja
                </button>

                <div className="flex gap-3 justify-center mt-1">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <button
                    onClick={() => navigate('/app/home')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <Home className="w-4 h-4" />
                    Ir para Início
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Sair e entrar com outra conta
                </button>
              </div>
            </div>
          ) : (
            /* No stores — true access denied */
            <div className="relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.08]" />
              <div className="relative bg-[#0F0F18]/80 backdrop-blur-xl rounded-2xl p-7 sm:p-8 border border-white/[0.06]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Store className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
                  <p className="text-white/45 text-sm mb-6">
                    Você não tem permissão para acessar esta página.
                    Entre em contato com o administrador se acredita que isso é um erro.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => navigate(-1)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/[0.08] hover:bg-white/[0.04] transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar
                    </button>
                    <button
                      onClick={() => navigate('/app/home')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/[0.08] hover:bg-white/[0.04] transition-all"
                    >
                      <Home className="w-4 h-4" />
                      Ir para Início
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-white/20 text-xs mt-6 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            Seus dados estão protegidos com criptografia
          </p>
        </div>
      </div>
    </div>
  );
}
