import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Store, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import logoWhite from '@/assets/logo-white.png';
import signupHero from '@/assets/signup-hero.jpg';

const phoneRegex = /^\(?[1-9]{2}\)?\s?9[0-9]{4}-?[0-9]{4}$/;

const ownerSignupSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().trim().email('E-mail inválido').max(255),
  phone: z.string().trim().regex(phoneRegex, 'WhatsApp inválido (ex: 11 91234-5678)'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const BENEFITS = [
  'Cardápio digital completo',
  'Gestão de pedidos em tempo real',
  'Relatórios e métricas',
  'App próprio para seus clientes',
];

export default function OwnerSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/onboarding/create-store', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length > 6) {
      return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 2) {
      return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    }
    return digits;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = ownerSignupSchema.safeParse({ name, email, phone, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login?redirect=/onboarding/create-store`,
          data: { 
            name,
            phone: phone.replace(/\D/g, ''),
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      navigate('/auth/login?redirect=/onboarding/create-store');
    } catch (error: any) {
      console.error('Owner signup error:', error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070D]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#07070D] overflow-hidden relative">

      {/* Left panel - Branding with hero image */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-12 xl:p-16">
        {/* Background hero image - full bleed */}
        <div className="absolute inset-0 -top-px -left-px -right-px -bottom-px bg-[#07070D]">
          <img 
            src={signupHero} 
            alt="" 
            className="w-full h-full object-cover object-center"
          />
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

        {/* Benefits list */}
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

        {/* Decorative gradient line */}
        <div className="absolute right-0 top-[15%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:py-0 relative z-10">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Logo above form */}
          <div className="text-center mb-6">
            <Link to="/planos" className="inline-block">
              <img src={logoWhite} alt="Logo" className="h-14 max-w-[220px] object-contain mx-auto" />
            </Link>
          </div>

          {/* Form card */}
          <div className="relative group">
            {/* Glow border effect */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.08] opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-[hsl(28,100%,50%/0.15)] to-[hsl(350,80%,55%/0.08)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
            
            <div className="relative bg-[#0F0F18]/80 backdrop-blur-xl rounded-2xl p-7 sm:p-8 border border-white/[0.06]">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-1">Crie sua conta</h2>
                <p className="text-white/45 text-sm">Comece a vender online em minutos</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                    Seu nome
                  </Label>
                  <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'name' ? 'ring-2 ring-[hsl(28,100%,50%/0.4)] shadow-[0_0_20px_-5px_hsl(28,100%,50%/0.2)]' : ''}`}>
                    <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'name' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25'}`} />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className="pl-11 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                      required
                      autoFocus
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-400 flex items-center gap-1 animate-fade-in">{errors.name}</p>}
                </div>

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
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-400 flex items-center gap-1 animate-fade-in">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                    WhatsApp
                  </Label>
                  <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'phone' ? 'ring-2 ring-[hsl(28,100%,50%/0.4)] shadow-[0_0_20px_-5px_hsl(28,100%,50%/0.2)]' : ''}`}>
                    <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300 ${focusedField === 'phone' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25'}`} />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="11 91234-5678"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      className="pl-11 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                      maxLength={14}
                      required
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-400 flex items-center gap-1 animate-fade-in">{errors.phone}</p>}
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
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="pl-11 pr-11 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300"
                      minLength={6}
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
                  {errors.password && <p className="text-xs text-red-400 flex items-center gap-1 animate-fade-in">{errors.password}</p>}
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="relative w-full h-13 text-base rounded-xl bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white font-semibold border-0 overflow-hidden group/btn transition-all duration-300 hover:shadow-[0_8px_30px_-5px_hsl(28,100%,50%/0.4)] active:scale-[0.98]"
                  >
                    {/* Shimmer overlay */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        'Criando conta...'
                      ) : (
                        <>
                          Criar conta e testar grátis
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                        </>
                      )}
                    </span>
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                </div>

                <p className="text-center text-white/40 text-sm">
                  Já tem uma conta?{' '}
                  <Link 
                    to="/auth/login?redirect=/onboarding/create-store" 
                    className="text-[hsl(28,100%,55%)] font-medium hover:text-[hsl(28,100%,65%)] transition-colors duration-200 hover:underline underline-offset-4"
                  >
                    Entrar
                  </Link>
                </p>
              </form>
            </div>
          </div>

          {/* Trust badge */}
          <p className="text-center text-white/20 text-xs mt-6 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            Seus dados estão protegidos com criptografia
          </p>
        </div>
      </div>
    </div>
  );
}
