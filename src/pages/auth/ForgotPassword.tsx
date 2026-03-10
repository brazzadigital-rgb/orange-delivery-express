import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Pizza, ArrowLeft, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { toast } from 'sonner';
import logoWhite from '@/assets/logo-white.png';
import signupHero from '@/assets/signup-hero.jpg';

export default function ForgotPassword() {
  const { config } = useAppConfig();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  
  // Detect if we're on the main portal (not a store subdomain)
  const isPortalDomain = (() => {
    const host = window.location.hostname.split(':')[0];
    if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return true;
    if (host.endsWith('.lovable.app') || host.endsWith('.lovableproject.com')) return true;
    const parts = host.split('.');
    const PORTAL_HOSTS = ['app', 'www', 'admin', 'api'];
    if (parts.length >= 3 && !PORTAL_HOSTS.includes(parts[0])) return false;
    return true;
  })();
  
  const isSystemLogin = isPortalDomain || (redirectParam || '').includes('onboarding') || (redirectParam || '').includes('create-store');

  const logoUrl = isSystemLogin ? null : config?.app_logo_url;
  const appName = config?.app_name || '';
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) throw error;

      setSent(true);
      toast.success('E-mail enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  };

  const loginPath = `/auth/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`;

  // ── System layout (dark cinematic) ──
  if (isSystemLogin) {
    return (
      <div className="min-h-screen flex bg-[#07070D]">
        {/* Left panel - hero image */}
        <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-12 xl:p-16">
          <div className="absolute inset-0 bg-[#07070D]">
            <img src={signupHero} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070D] via-[#07070D]/60 to-[#07070D]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07070D]/20 to-[#07070D]/40" />
          </div>
          <div className="relative z-10">
            <img src={logoWhite} alt="Logo" className="h-8 opacity-90" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-full px-4 py-2 text-white/60 text-sm">
              <Lock className="w-4 h-4 text-[hsl(28,100%,55%)]" />
              Recuperação segura
            </div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
              Recupere o acesso<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(28,100%,55%)] to-[hsl(350,80%,55%)]">
                à sua conta
              </span>
            </h2>
            <p className="text-white/40 text-base max-w-sm leading-relaxed">
              Enviaremos um link seguro para redefinir sua senha.
            </p>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-[420px] space-y-8">
            <div className="lg:hidden flex items-center gap-3 mb-2">
              <img src={logoWhite} alt="Logo" className="h-7 opacity-80" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(28,100%,55%)]/20 to-[hsl(350,80%,55%)]/10 border border-[hsl(28,100%,55%)]/20">
                  <Sparkles className="w-5 h-5 text-[hsl(28,100%,55%)]" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Esqueceu a senha?</h1>
              </div>
              <p className="text-white/40 text-sm pl-[52px]">
                Digite seu e-mail para receber o link de recuperação
              </p>
            </div>

            {sent ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">E-mail enviado!</h2>
                <p className="text-white/40 text-sm max-w-xs mx-auto">
                  Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                </p>
                <Link to={loginPath}>
                  <Button variant="outline" className="rounded-full border-white/10 text-white/60 hover:text-white hover:bg-white/5 mt-4">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/50 text-sm font-medium">E-mail</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/20 transition-colors duration-200 group-focus-within:text-[hsl(28,100%,55%)]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-[hsl(28,100%,55%)]/40 focus:ring-1 focus:ring-[hsl(28,100%,55%)]/20 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="relative w-full h-13 text-base rounded-xl bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white font-semibold border-0 overflow-hidden group/btn transition-all duration-300 hover:shadow-[0_8px_30px_-5px_hsl(28,100%,50%/0.4)] active:scale-[0.98]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                  <span className="relative">{loading ? 'Enviando...' : 'Enviar link'}</span>
                </Button>

                <div className="text-center">
                  <Link
                    to={loginPath}
                    className="text-white/40 hover:text-white/60 inline-flex items-center gap-2 text-sm transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Customer layout (branded) ──
  return (
    <div className="min-h-screen flex flex-col">
      <div className="gradient-hero text-white px-6 pt-12 pb-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          {logoUrl ? (
            <div className="relative">
              <div className="absolute inset-0 bg-white/25 rounded-xl blur-lg scale-110" />
              <img 
                src={logoUrl} 
                alt={appName} 
                className="relative h-12 max-w-[180px] object-contain drop-shadow-xl"
              />
            </div>
          ) : (
            <>
              <Pizza className="w-8 h-8" />
              <span className="text-xl font-bold">{appName}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2">Esqueceu a senha?</h1>
        <p className="text-white/80">Enviaremos um link de recuperação</p>
      </div>

      <div className="flex-1 bg-background -mt-8 rounded-t-3xl px-6 pt-8 pb-6">
        {sent ? (
          <div className="max-w-sm mx-auto text-center py-8">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold mb-2">E-mail enviado!</h2>
            <p className="text-muted-foreground mb-6">
              Verifique sua caixa de entrada e clique no link para redefinir sua senha.
            </p>
            <Link to="/auth/login">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Voltar ao login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 max-w-sm mx-auto">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 input-modern"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-12 text-base"
            >
              {loading ? 'Enviando...' : 'Enviar link'}
            </Button>

            <div className="text-center">
              <Link
                to="/auth/login"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
