import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBillingGate } from '@/hooks/useBilling';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

const BILLING_WHITELIST = [
  '/admin/subscription',
  '/admin/billing',
  '/subscription/expired',
  '/billing/expired',
  '/billing',
  '/expired',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot',
  '/auth/logout',
  '/planos',
  '/onboarding',
];

interface BillingGateGuardProps {
  children: ReactNode;
}

export function BillingGateGuard({ children }: BillingGateGuardProps) {
  const { gate, isLoading } = useBillingGate();
  const location = useLocation();

  const isWhitelisted = BILLING_WHITELIST.some(path => 
    location.pathname.startsWith(path)
  );

  if (isWhitelisted) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (gate === 'blocked') {
    return <Navigate to="/expired" replace />;
  }

  if (gate === 'past_due') {
    return (
      <>
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-[60]">
          <AlertTriangle className="w-4 h-4" />
          Pagamento em atraso — 
          <a href="/admin/subscription" className="underline font-bold hover:no-underline">
            Regularize agora
          </a>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
