import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Shield, LogOut, Loader2, Check, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useChangePassword } from '@/hooks/useProfileSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[a-z]/, 'Deve conter letra minúscula')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'A nova senha deve ser diferente da atual',
  path: ['newPassword'],
});

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ caracteres', valid: password.length >= 8 },
    { label: 'Letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'Letra maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'Número', valid: /[0-9]/.test(password) },
  ];

  const validCount = checks.filter(c => c.valid).length;
  const strength = validCount === 4 ? 'strong' : validCount >= 2 ? 'medium' : 'weak';

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= validCount
                ? strength === 'strong'
                  ? 'bg-success'
                  : strength === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-destructive'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(check => (
          <div key={check.label} className="flex items-center gap-1.5 text-xs">
            {check.valid ? (
              <Check className="w-3 h-3 text-success" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
            )}
            <span className={check.valid ? 'text-success' : 'text-muted-foreground'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileSecurity() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
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
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSignOutAll = async () => {
    setIsSigningOutAll(true);
    try {
      // Sign out with global scope to invalidate all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      toast.success('Desconectado de todos os dispositivos');
      navigate('/');
    } catch (error) {
      console.error('Error signing out all:', error);
      toast.error('Erro ao desconectar');
    } finally {
      setIsSigningOutAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Segurança" />

      <div className="px-4 pb-8 space-y-6">
        {/* Change Password Card */}
        <div className="card-premium p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Alterar senha</h2>
              <p className="text-sm text-muted-foreground">Atualize sua senha de acesso</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`h-12 pr-12 ${errors.currentPassword ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-destructive">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`h-12 pr-12 ${errors.newPassword ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {newPassword && <PasswordStrength password={newPassword} />}
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`h-12 pr-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar senha'
              )}
            </Button>
          </form>
        </div>

        {/* Sessions Card */}
        <div className="card-premium p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">Sessões ativas</h2>
              <p className="text-sm text-muted-foreground">Gerencie seus dispositivos conectados</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Este dispositivo</p>
              <p className="text-xs text-muted-foreground">Sessão atual</p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={handleSignOutAll}
            disabled={isSigningOutAll}
          >
            {isSigningOutAll ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Desconectando...
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5 mr-2" />
                Sair de todos os dispositivos
              </>
            )}
          </Button>
        </div>

        {/* Security Tips */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Dicas de segurança</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use senhas únicas para cada serviço</li>
                <li>• Nunca compartilhe sua senha</li>
                <li>• Desconfie de e-mails solicitando sua senha</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
