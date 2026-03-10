import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Pizza, MapPin, Home, Phone, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import signupHero from '@/assets/signup-hero.jpg';

// Brazilian phone validation (WhatsApp format)
const phoneRegex = /^\(?[1-9]{2}\)?\s?9[0-9]{4}-?[0-9]{4}$/;

// Validation schema
const signupSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().trim().email('E-mail inválido').max(255),
  phone: z.string().trim().regex(phoneRegex, 'WhatsApp inválido (ex: 11 91234-5678)'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  street: z.string().trim().min(3, 'Rua é obrigatória').max(200),
  number: z.string().trim().min(1, 'Número é obrigatório').max(20),
  complement: z.string().trim().max(100).optional(),
  neighborhood: z.string().trim().min(2, 'Bairro é obrigatório').max(100),
  city: z.string().trim().min(2, 'Cidade é obrigatória').max(100),
  state: z.string().trim().length(2, 'Estado deve ter 2 caracteres'),
  zip: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP inválido (formato: 00000-000)'),
});

export default function Signup() {
  const { config } = useAppConfig();
  const logoUrl = config?.app_logo_url;
  const appName = config?.app_name || '';
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Address fields
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/app/home';

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const validateStep1 = () => {
    const result = signupSchema.pick({ name: true, email: true, phone: true, password: true }).safeParse({
      name, email, phone, password
    });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const formatZip = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

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
    
    const formData = {
      name, email, phone, password, street, number, 
      complement: complement || undefined, 
      neighborhood, city, state: state.toUpperCase(), zip
    };
    
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast.error('Preencha todos os campos corretamente');
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { 
            name,
            phone: phone.replace(/\D/g, ''),
            pending_address: {
              label: 'Casa',
              street: street.trim(),
              number: number.trim(),
              complement: complement.trim() || null,
              neighborhood: neighborhood.trim(),
              city: city.trim(),
              state: state.toUpperCase().trim(),
              zip: zip.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
              is_default: true,
            },
          },
        },
      });

      // Handle "User already registered" — transparent multi-tenant flow
      if (authError) {
        const msg = authError.message?.toLowerCase() || '';
        const isAlreadyRegistered = msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already') || authError.status === 422;
        
        if (isAlreadyRegistered) {
          // Try signing in silently with the password provided
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            // Password doesn't match — user needs to use their existing password
            // Don't mention "other store", just say they already have an account
            toast.error('Você já possui uma conta com este e-mail. Use sua senha atual ou redefina-a.', { duration: 6000 });
            setStep(1);
            setErrors({ 
              password: 'Senha incorreta. Caso tenha esquecido, redefina sua senha.' 
            });
            return;
          }

          if (signInData.user) {
            // Silently save the new address for this store context
            const addressData = {
              label: 'Casa',
              street: street.trim(),
              number: number.trim(),
              complement: complement.trim() || null,
              neighborhood: neighborhood.trim(),
              city: city.trim(),
              state: state.toUpperCase().trim(),
              zip: zip.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
              is_default: true,
            };
            localStorage.setItem('pending_address', JSON.stringify(addressData));

            // Update profile with latest name/phone if needed
            await supabase.auth.updateUser({
              data: { 
                name,
                phone: phone.replace(/\D/g, ''),
              }
            });
            
            // Seamless — user doesn't know it was an existing account
            toast.success('Conta criada com sucesso! Bem-vindo!', { duration: 3000 });
            navigate(from, { replace: true });
            return;
          }
        }
        
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      const addressData = {
        label: 'Casa',
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim() || null,
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.toUpperCase().trim(),
        zip: zip.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
        is_default: true,
      };
      
      localStorage.setItem('pending_address', JSON.stringify(addressData));

      toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      navigate('/auth/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070D]">
        <LoadingSpinner />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070D]">
        <LoadingSpinner />
      </div>
    );
  }

  const inputClass = (field: string) => cn(
    'h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/[0.15] transition-all duration-300',
    focusedField === field && 'ring-2 ring-[hsl(28,100%,50%/0.4)]'
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#07070D] overflow-hidden relative">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-12 xl:p-16">
        <div className="absolute inset-0 bg-[#07070D]">
          <img src={signupHero} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07070D] via-[#07070D]/60 to-[#07070D]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07070D]/20 to-[#07070D]/40" />
        </div>

        <div className="relative z-10">
          <div className="space-y-8 animate-fade-in">
            {logoUrl ? (
              <div className="relative inline-block">
                <img src={logoUrl} alt={appName} className="h-16 max-w-[220px] object-contain drop-shadow-xl" />
              </div>
            ) : appName ? (
              <h2 className="text-3xl font-bold text-white drop-shadow-xl">{appName}</h2>
            ) : null}

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight drop-shadow-lg">
              {step === 1 ? (
                <>
                  Crie sua <br />
                  <span className="bg-gradient-to-r from-[hsl(32,100%,55%)] to-[hsl(350,80%,55%)] bg-clip-text text-transparent">
                    conta agora
                  </span>
                </>
              ) : (
                <>
                  Endereço de <br />
                  <span className="bg-gradient-to-r from-[hsl(32,100%,55%)] to-[hsl(350,80%,55%)] bg-clip-text text-transparent">
                    entrega
                  </span>
                </>
              )}
            </h1>

            <p className="text-lg text-white/70 max-w-md leading-relaxed drop-shadow">
              {step === 1 
                ? 'Cadastre-se para fazer pedidos, acompanhar em tempo real e aproveitar promoções exclusivas.'
                : 'Informe seu endereço para receber seus pedidos com rapidez e praticidade.'
              }
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

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:py-0 relative z-10">
        <div className="w-full max-w-[440px] animate-fade-in">
          {/* Mobile logo */}
          <div className="text-center mb-6 lg:hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-14 max-w-[200px] object-contain mx-auto" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Pizza className="w-7 h-7 text-[hsl(28,100%,55%)]" />
                <span className="text-xl font-bold text-white">{appName}</span>
              </div>
            )}
          </div>

          {/* Mobile stepper */}
          <div className="flex items-center gap-2 mb-6 justify-center">
            <div className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              'w-8 bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)]'
            )} />
            <div className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              step >= 2 ? 'w-8 bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)]' : 'w-4 bg-white/[0.08]'
            )} />
          </div>

          <div className="relative group">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.08] opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-[hsl(28,100%,50%/0.15)] to-[hsl(350,80%,55%/0.08)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />

            <div className="relative bg-[#0F0F18]/80 backdrop-blur-xl rounded-2xl p-7 sm:p-8 border border-white/[0.06]">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {step === 1 ? 'Criar conta' : 'Seu endereço'}
                </h2>
                <p className="text-white/45 text-sm">
                  {step === 1 ? 'Passo 1 de 2 — Dados pessoais' : 'Passo 2 de 2 — Endereço de entrega'}
                </p>
              </div>

              {step === 1 ? (
                <form onSubmit={handleNextStep} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Nome completo</Label>
                    <div className="relative rounded-xl">
                      <User className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300', focusedField === 'name' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25')} />
                      <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} className={cn('pl-11', inputClass('name'))} required autoFocus />
                    </div>
                    {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/70 text-xs uppercase tracking-wider font-semibold">E-mail</Label>
                    <div className="relative rounded-xl">
                      <Mail className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300', focusedField === 'email' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25')} />
                      <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} className={cn('pl-11', inputClass('email'))} required />
                    </div>
                    {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/70 text-xs uppercase tracking-wider font-semibold">WhatsApp</Label>
                    <div className="relative rounded-xl">
                      <Phone className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300', focusedField === 'phone' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25')} />
                      <Input id="phone" type="tel" placeholder="11 91234-5678" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)} className={cn('pl-11', inputClass('phone'))} maxLength={14} required />
                    </div>
                    {errors.phone && <p className="text-sm text-red-400">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Senha</Label>
                    <div className="relative rounded-xl">
                      <Lock className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300', focusedField === 'password' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25')} />
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} className={cn('pl-11 pr-11', inputClass('password'))} minLength={6} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors duration-200">
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                  </div>

                  <div className="pt-2">
                    <Button type="submit" className="relative w-full h-13 text-base rounded-xl bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white font-semibold border-0 overflow-hidden group/btn transition-all duration-300 hover:shadow-[0_8px_30px_-5px_hsl(28,100%,50%/0.4)] active:scale-[0.98]">
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                      <span className="relative flex items-center justify-center gap-2">
                        Continuar
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </span>
                    </Button>
                  </div>

                  <p className="text-center text-white/40 text-sm pt-1">
                    Já tem uma conta?{' '}
                    <Link to="/auth/login" className="text-[hsl(28,100%,55%)] font-medium hover:text-[hsl(28,100%,65%)] transition-colors duration-200 hover:underline underline-offset-4">
                      Entrar
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-[hsl(28,100%,50%/0.08)] border border-[hsl(28,100%,50%/0.15)] rounded-xl mb-1">
                    <Home className="w-5 h-5 text-[hsl(28,100%,55%)]" />
                    <span className="text-sm text-white/60">
                      Este será seu endereço padrão de entrega
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip" className="text-white/70 text-xs uppercase tracking-wider font-semibold">CEP</Label>
                    <Input id="zip" placeholder="00000-000" value={zip} onChange={(e) => setZip(formatZip(e.target.value))} onFocus={() => setFocusedField('zip')} onBlur={() => setFocusedField(null)} className={inputClass('zip')} maxLength={9} required />
                    {errors.zip && <p className="text-sm text-red-400">{errors.zip}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Rua</Label>
                    <div className="relative rounded-xl">
                      <MapPin className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-300', focusedField === 'street' ? 'text-[hsl(28,100%,55%)]' : 'text-white/25')} />
                      <Input id="street" placeholder="Nome da rua" value={street} onChange={(e) => setStreet(e.target.value)} onFocus={() => setFocusedField('street')} onBlur={() => setFocusedField(null)} className={cn('pl-11', inputClass('street'))} required />
                    </div>
                    {errors.street && <p className="text-sm text-red-400">{errors.street}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="number" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Número</Label>
                      <Input id="number" placeholder="123" value={number} onChange={(e) => setNumber(e.target.value)} onFocus={() => setFocusedField('number')} onBlur={() => setFocusedField(null)} className={inputClass('number')} required />
                      {errors.number && <p className="text-sm text-red-400">{errors.number}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Complemento</Label>
                      <Input id="complement" placeholder="Apto 101" value={complement} onChange={(e) => setComplement(e.target.value)} onFocus={() => setFocusedField('complement')} onBlur={() => setFocusedField(null)} className={inputClass('complement')} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Bairro</Label>
                    <Input id="neighborhood" placeholder="Nome do bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} onFocus={() => setFocusedField('neighborhood')} onBlur={() => setFocusedField(null)} className={inputClass('neighborhood')} required />
                    {errors.neighborhood && <p className="text-sm text-red-400">{errors.neighborhood}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="city" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Cidade</Label>
                      <Input id="city" placeholder="Sua cidade" value={city} onChange={(e) => setCity(e.target.value)} onFocus={() => setFocusedField('city')} onBlur={() => setFocusedField(null)} className={inputClass('city')} required />
                      {errors.city && <p className="text-sm text-red-400">{errors.city}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-white/70 text-xs uppercase tracking-wider font-semibold">UF</Label>
                      <Input id="state" placeholder="SP" value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} onFocus={() => setFocusedField('state')} onBlur={() => setFocusedField(null)} className={cn('uppercase', inputClass('state'))} maxLength={2} required />
                      {errors.state && <p className="text-sm text-red-400">{errors.state}</p>}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12 rounded-xl border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.04] hover:border-white/[0.15] transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar
                    </button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="relative flex-1 h-12 text-base rounded-xl bg-gradient-to-r from-[hsl(28,100%,50%)] to-[hsl(350,80%,55%)] text-white font-semibold border-0 overflow-hidden group/btn transition-all duration-300 hover:shadow-[0_8px_30px_-5px_hsl(28,100%,50%/0.4)] active:scale-[0.98]"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? 'Criando...' : 'Criar conta'}
                      </span>
                    </Button>
                  </div>
                </form>
              )}
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
