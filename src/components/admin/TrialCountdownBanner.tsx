import { Timer, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlanEntitlements } from '@/hooks/usePlanEntitlements';

export function TrialCountdownBanner() {
  const { entitlements, isTrialing } = usePlanEntitlements();

  if (!isTrialing || !entitlements?.trial_ends_at) return null;

  const trialEnd = new Date(entitlements.trial_ends_at);
  const now = new Date();
  const diffMs = trialEnd.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (daysLeft > 7) return null; // Only show in last 7 days

  const isUrgent = daysLeft <= 2;

  return (
    <div className={`px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-[60] ${
      isUrgent 
        ? 'bg-destructive text-destructive-foreground' 
        : 'bg-primary/10 text-primary'
    }`}>
      <Timer className="w-4 h-4" />
      {daysLeft === 0 ? (
        <span>Seu período de teste expira <strong>hoje</strong>!</span>
      ) : daysLeft === 1 ? (
        <span>Seu período de teste expira <strong>amanhã</strong>!</span>
      ) : (
        <span>Seu período de teste expira em <strong>{daysLeft} dias</strong></span>
      )}
      <span className="mx-1">—</span>
      <Link
        to="/admin/subscription"
        className="inline-flex items-center gap-1 font-bold underline hover:no-underline"
      >
        <Crown className="w-3.5 h-3.5" />
        Assinar agora
      </Link>
    </div>
  );
}
