import { Check, MapPin, Truck, CreditCard, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutStep = 'address' | 'delivery' | 'payment' | 'review';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
}

const steps: { id: CheckoutStep; label: string; shortLabel: string; icon: typeof MapPin }[] = [
  { id: 'address', label: 'Endereço', shortLabel: 'Endereço', icon: MapPin },
  { id: 'delivery', label: 'Entrega', shortLabel: 'Entrega', icon: Truck },
  { id: 'payment', label: 'Pagamento', shortLabel: 'Pagar', icon: CreditCard },
  { id: 'review', label: 'Revisão', shortLabel: 'Revisar', icon: ClipboardCheck },
];

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="py-5 px-4 bg-gradient-to-b from-muted/40 to-transparent">
      <div className="relative max-w-md mx-auto">
        {/* Background line */}
        <div className="absolute top-6 left-8 right-8 h-1 bg-border/40 rounded-full" />

        {/* Progress line */}
        <div
          className="absolute top-6 left-8 h-1 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 4rem)`,
            background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)',
            boxShadow: '0 0 12px hsl(var(--primary) / 0.4)',
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center gap-2"
              >
                {/* Step circle */}
                <div
                  className={cn(
                    'relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-500',
                    isCompleted && 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg',
                    isCurrent && 'bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-xl ring-4 ring-primary/25 scale-105',
                    isPending && 'bg-card border-2 border-border/60 text-muted-foreground'
                  )}
                  style={isCurrent ? { boxShadow: '0 8px 32px -8px hsl(var(--primary) / 0.5)' } : {}}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                  ) : (
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}

                  {/* Pulse effect for current step */}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
                  )}

                  {/* Glow ring for completed */}
                  {isCompleted && (
                    <span className="absolute inset-0 rounded-2xl bg-primary/10 blur-sm" />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    'text-[11px] sm:text-xs font-medium transition-all duration-300 text-center',
                    isCompleted && 'text-primary font-semibold',
                    isCurrent && 'text-foreground font-bold',
                    isPending && 'text-muted-foreground'
                  )}
                >
                  <span className="sm:hidden">{step.shortLabel}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
