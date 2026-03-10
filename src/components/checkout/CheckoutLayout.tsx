import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { CheckoutStepper, CheckoutStep } from './CheckoutStepper';
import { CheckoutSummary } from './CheckoutSummary';
import { Button } from '@/components/ui/button';
import { useStoreGate } from '@/hooks/useStoreGate';
import { StoreUnavailableNotice } from '@/components/common/StoreUnavailableNotice';

interface CheckoutLayoutProps {
  children: ReactNode;
  currentStep: CheckoutStep;
  title: string;
  showSummary?: boolean;
  nextLabel?: string;
  onNext?: () => void;
  nextDisabled?: boolean;
  isLoading?: boolean;
  backTo?: string;
}

export function CheckoutLayout({
  children,
  currentStep,
  title,
  showSummary = true,
  nextLabel = 'Continuar',
  onNext,
  nextDisabled = false,
  isLoading = false,
  backTo,
}: CheckoutLayoutProps) {
  const navigate = useNavigate();
  const { data: storeGate } = useStoreGate();

  if (storeGate === 'blocked') {
    return <StoreUnavailableNotice />;
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted active:scale-95 transition-all duration-150"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        </div>
        <CheckoutStepper currentStep={currentStep} />
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {children}
      </div>

      {/* Fixed Bottom */}
      <div className="bottom-bar-premium">
        {showSummary && <CheckoutSummary compact />}
        
        {onNext && (
          <div className="px-4 pb-4">
            <Button
              onClick={onNext}
              disabled={nextDisabled || isLoading}
              className="w-full btn-primary h-14 text-base"
            >
              {isLoading ? 'Processando...' : nextLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
