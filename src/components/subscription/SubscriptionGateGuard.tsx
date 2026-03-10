import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMySubscription, computeSubscriptionGate } from '@/hooks/useSubscription';
import { useHasRole } from '@/hooks/useUserRole';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

const SUBSCRIPTION_WHITELIST = [
  '/subscription',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot',
  '/auth/logout',
  '/app/home',
  '/app/search',
  '/app/category',
  '/app/product',
  '/app/store-hours',
  '/app/reviews',
  '/',
  '/onboarding',
  '/planos',
  '/offline',
  '/maintenance',
];

interface SubscriptionGateGuardProps {
  children: ReactNode;
}

export function SubscriptionGateGuard({ children }: SubscriptionGateGuardProps) {
  const { data: subscription, isLoading: subLoading } = useMySubscription();
  const { hasRole: isOwnerOrAdmin, isLoading: roleLoading } = useHasRole(['admin', 'staff']);
  const location = useLocation();

  const isWhitelisted = SUBSCRIPTION_WHITELIST.some(path =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  );

  if (isWhitelisted) {
    return <>{children}</>;
  }

  if (subLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  const gate = computeSubscriptionGate(subscription, isOwnerOrAdmin);

  if (gate === 'blocked') {
    return <Navigate to="/subscription/expired" replace />;
  }

  if (gate === 'past_due') {
    return (
      <>
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-[60]">
          <AlertTriangle className="w-4 h-4" />
          Pagamento em atraso —
          <a href="/subscription" className="underline font-bold hover:no-underline">
            Regularize agora
          </a>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
