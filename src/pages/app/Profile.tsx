import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, MapPin, CreditCard, HelpCircle, LogOut, ChevronRight, 
  Volume2, Star, MessageCircle, Edit3, Lock, Bell, Cake, PartyPopper
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { UserModeSelector } from '@/components/profile/UserModeSelector';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { LoyaltyCard } from '@/components/profile/LoyaltyCard';
import { AppReviewModal } from '@/components/profile/AppReviewModal';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useReviewSettings, useCanSubmitReview } from '@/hooks/useAppReviews';
import { useReviewsStats } from '@/hooks/usePublicReviews';
import { Skeleton } from '@/components/ui/skeleton';

// Check if today is the user's birthday (handles timezone correctly)
function isBirthday(birthDateStr: string | null | undefined): boolean {
  if (!birthDateStr) return false;
  
  // Parse YYYY-MM-DD in local timezone (avoid UTC shift)
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return false;
  
  const birthMonth = parseInt(parts[1], 10); // 1-12
  const birthDay = parseInt(parts[2], 10);   // 1-31
  
  const today = new Date();
  const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11
  const todayDay = today.getDate();
  
  return todayMonth === birthMonth && todayDay === birthDay;
}

const profileSettingsItems = [
  { icon: Edit3, label: 'Editar perfil', path: '/app/profile/edit' },
  { icon: Lock, label: 'Segurança', path: '/app/profile/security' },
];

const menuItems = [
  { icon: MapPin, label: 'Meus Endereços', path: '/app/profile/addresses' },
  { icon: CreditCard, label: 'Formas de Pagamento', path: '/app/profile/payments' },
  { icon: HelpCircle, label: 'Suporte', path: '/app/support' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: reviewSettings } = useReviewSettings();
  const { data: canSubmitReview } = useCanSubmitReview();
  const { data: reviewsStats } = useReviewsStats();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const handleSignOut = async () => {
    localStorage.removeItem('user_mode');
    await signOut();
    navigate('/');
  };

  // Check if today is the user's birthday
  const profileAny = profile as any;
  const showBirthdayBanner = useMemo(() => {
    return isBirthday(profileAny?.birth_date);
  }, [profileAny?.birth_date]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Perfil" showBack={false} />

      <div className="px-4 pb-8 space-y-4">
        {/* Birthday Banner */}
        {showBirthdayBanner && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 text-white shadow-lg animate-fade-in">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce">
                <Cake className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Feliz Aniversário! 🎉</h3>
                  <PartyPopper className="w-5 h-5" />
                </div>
                <p className="text-sm text-white/90">
                  Desejamos um dia incrível cheio de alegrias e pizzas deliciosas! 🍕
                </p>
              </div>
            </div>
            {/* Confetti decoration */}
            <div className="absolute top-2 right-4 text-2xl animate-pulse">🎂</div>
            <div className="absolute bottom-2 right-12 text-lg opacity-70">🎈</div>
          </div>
        )}
        
        {/* Profile Card with Settings */}
        <div className="card-premium overflow-hidden">
          <button 
            onClick={() => setShowProfileSettings(!showProfileSettings)}
            className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/30 transition-all duration-200"
          >
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-md">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              {profileLoading ? (
                <>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </>
              ) : (
                <>
                  <h2 className="font-bold text-lg">{profile?.name || 'Cliente'}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showProfileSettings ? 'rotate-90' : ''}`} />
            </div>
          </button>
          
          {/* Expandable Settings */}
          {showProfileSettings && (
            <div className="border-t border-border/50 animate-fade-in">
              {profileSettingsItems.map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-b-0"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="flex-1 text-left font-medium text-sm">{label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mode Selector - Shows only if user has multiple roles */}
        <div>
          <UserModeSelector />
        </div>
 
        {/* Loyalty Points Card */}
        <LoyaltyCard />


        {/* See Reviews Link */}
        <button
          onClick={() => navigate('/app/reviews')}
          className="w-full card-premium p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-200 group"
        >
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold">Veja o que estão falando</p>
            <p className="text-sm text-muted-foreground">
              {reviewsStats && reviewsStats.total > 0 
                ? `${reviewsStats.total} avaliações • ${reviewsStats.average} ⭐`
                : 'Avaliações dos clientes'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Quick Notification Settings Toggle */}
        <button
          onClick={() => setShowNotificationSettings(!showNotificationSettings)}
          className="w-full list-item-premium"
        >
          <div className="icon-container icon-container-primary">
            <Volume2 className="w-5 h-5 text-primary" />
          </div>
          <span className="flex-1 text-left font-semibold">Sons rápidos</span>
          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${showNotificationSettings ? 'rotate-90' : ''}`} />
        </button>

        {/* Notification Settings Panel */}
        {showNotificationSettings && (
          <div className="animate-fade-in">
            <NotificationSettings />
          </div>
        )}

        {/* Rate App Button */}
        {reviewSettings?.enabled && canSubmitReview && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full list-item-premium"
          >
            <div className="icon-container icon-container-primary">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-semibold">Avaliar o app</span>
              <p className="text-sm text-muted-foreground">
                {reviewSettings?.review_prompt_subtitle || 'Conte como foi sua experiência'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        {/* Other Menu Items */}
        <div className="space-y-2 pt-2">
          {menuItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="w-full list-item-premium"
            >
              <div className="icon-container icon-container-muted">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-semibold">{label}</span>
              <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full mt-6 p-4 rounded-2xl border border-destructive/20 text-destructive flex items-center justify-center gap-2.5 font-semibold hover:bg-destructive/5 active:scale-[0.99] transition-all duration-150"
        >
          <LogOut className="w-5 h-5" />
          Sair da conta
        </button>

        {/* App Review Modal */}
        <AppReviewModal open={showReviewModal} onOpenChange={setShowReviewModal} />
      </div>
    </div>
  );
}
