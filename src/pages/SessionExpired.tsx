import { useNavigate } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function SessionExpired() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogin = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Sessão Expirada</h1>
        <p className="text-muted-foreground mb-8">
          Sua sessão expirou por inatividade. 
          Por favor, faça login novamente para continuar.
        </p>

        <Button
          onClick={handleLogin}
          className="btn-primary gap-2"
        >
          <LogIn className="w-4 h-4" />
          Fazer Login
        </Button>
      </div>
    </div>
  );
}
