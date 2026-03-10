import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export default function WaiterProfile() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">Perfil</h1>

      <div className="card-premium p-6 text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-bold text-lg">{profile?.name || 'Garçom'}</h2>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
      </div>

      <Button variant="outline" className="w-full" onClick={() => signOut()}>
        <LogOut className="w-4 h-4 mr-2" />
        Sair
      </Button>
    </div>
  );
}
