import { useNavigate } from 'react-router-dom';
import { User, Star, Truck, LogOut, MapPin, Phone, Mail, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useDriverStats } from '@/hooks/useDriverOrders';

export default function DriverProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: stats } = useDriverStats();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Meu Perfil" showBack={false} />
      
      <div className="px-4 pb-8 space-y-6">
        {/* Profile Card */}
        <div className="card-premium p-6 text-center">
          <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name || 'Avatar'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold">{profile?.name || 'Motoboy'}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Truck className="w-5 h-5 text-primary" />
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <p className="text-xs text-muted-foreground">Entregas totais</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <p className="text-2xl font-bold">5.0</p>
              </div>
              <p className="text-xs text-muted-foreground">Avaliação</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <section className="card-premium p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Informações de Contato</h3>
          
          <div className="space-y-4">
            {user?.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            )}
            
            {profile?.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Stats Summary */}
        <section className="card-premium p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Resumo</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary/5 text-center">
              <p className="text-3xl font-bold text-primary">{stats?.today || 0}</p>
              <p className="text-sm text-muted-foreground">Entregas hoje</p>
            </div>
            <div className="p-4 rounded-xl bg-muted text-center">
              <p className="text-3xl font-bold">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total geral</p>
            </div>
          </div>
        </section>

        {/* Help */}
        <section className="card-premium p-4">
          <button className="w-full flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Suporte</p>
              <p className="text-sm text-muted-foreground">Precisa de ajuda?</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </section>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/5"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair da conta
        </Button>
      </div>
    </div>
  );
}
