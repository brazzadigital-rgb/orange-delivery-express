import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, Camera, Loader2, Save } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useProfileSettings';
import { toast } from 'sonner';
import { z } from 'zod';

// Phone mask helper
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Date mask helper (DD/MM/AAAA)
function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Convert DD/MM/YYYY to YYYY-MM-DD for storage
function dateToISO(dateStr: string): string | null {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

// Convert YYYY-MM-DD to DD/MM/YYYY for display
function isoToDate(isoStr: string): string {
  if (!isoStr) return '';
  const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  phone: z.string().optional().refine(val => {
    if (!val) return true;
    const digits = val.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
  }, 'Telefone inválido'),
  birth_date: z.string().optional().refine(val => {
    if (!val) return true;
    // Validate DD/MM/YYYY format
    const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;
    const [, day, month, year] = match;
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    if (y < 1900 || y > new Date().getFullYear()) return false;
    return true;
  }, 'Data inválida (use DD/MM/AAAA)'),
});

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone ? formatPhone(profile.phone) : '');
      // birth_date might be in profile (stored as YYYY-MM-DD)
      const profileAny = profile as any;
      if (profileAny.birth_date) {
        setBirthDate(isoToDate(profileAny.birth_date));
      }
    }
  }, [profile]);

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthDate(formatDateInput(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = profileSchema.safeParse({
      name,
      phone,
      birth_date: birthDate || undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      // Convert DD/MM/YYYY to YYYY-MM-DD for storage
      const isoDate = birthDate ? dateToISO(birthDate) : null;
      
      await updateProfile.mutateAsync({
        name: name.trim(),
        phone: phone.replace(/\D/g, '') || null,
        birth_date: isoDate,
      });
      navigate('/app/profile');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Editar Perfil" />
        <div className="px-4 pb-8 space-y-6">
          <div className="flex justify-center">
            <Skeleton className="w-24 h-24 rounded-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Editar Perfil" />

      <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card border-2 border-background flex items-center justify-center shadow-md"
              onClick={() => toast.info('Upload de avatar em breve!')}
            >
              <Camera className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">Toque para alterar a foto</p>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Email</Label>
          <div className="p-3 rounded-xl bg-muted/50 text-muted-foreground">
            {user?.email}
          </div>
          <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className={`pl-11 h-12 ${errors.name ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className={`pl-11 h-12 ${errors.phone ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>

        {/* Birth Date */}
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data de nascimento</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="birth_date"
              type="text"
              inputMode="numeric"
              value={birthDate}
              onChange={handleBirthDateChange}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className={`pl-11 h-12 ${errors.birth_date ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.birth_date && <p className="text-sm text-destructive">{errors.birth_date}</p>}
          <p className="text-xs text-muted-foreground">Opcional - usado para promoções de aniversário</p>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-semibold"
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar alterações
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
