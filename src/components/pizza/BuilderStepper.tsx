import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
 
interface Step {
  label: string;
  shortLabel?: string;
}
 
interface BuilderStepperProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
}
 
export function BuilderStepper({ steps, currentStep, className }: BuilderStepperProps) {
  return (
    <div className={cn("px-4 py-4", className)}>
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-muted rounded-full" />
        
        {/* Progress track */}
        <div 
          className="absolute top-5 left-8 h-1 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 4rem)`,
          }}
        />
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;
            
            return (
              <div 
                key={index}
                className="flex flex-col items-center gap-2"
              >
                {/* Step circle */}
                <div
                  className={cn(
                    "relative w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                    isCompleted && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25",
                    isCurrent && "bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-xl shadow-primary/30 ring-4 ring-primary/20 scale-110",
                    isPending && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  
                  {/* Pulse effect for current step */}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                  )}
                </div>
                
                {/* Step label */}
                <span 
                  className={cn(
                    "text-xs font-medium transition-colors duration-300 text-center",
                    isCompleted && "text-primary",
                    isCurrent && "text-foreground font-semibold",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.shortLabel || step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}