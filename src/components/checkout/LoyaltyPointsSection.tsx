import { useState, useEffect, useMemo, useCallback } from 'react';
import { Gift, Star, Truck, Check, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { 
  useLoyaltySettings, 
  useLoyaltyWallet, 
  useLoyaltyRewards,
  useReserveReward,
  useCancelRedemption,
  isRewardApplicable,
  LoyaltyReward
} from '@/hooks/useLoyalty';
import { cn } from '@/lib/utils';

interface LoyaltyPointsSectionProps {
  subtotal: number;
  deliveryFee: number;
  onApplyReward: (reward: LoyaltyReward | null, redemptionId: string | null) => void;
  appliedRedemptionId?: string | null;
}

export function LoyaltyPointsSection({ 
  subtotal, 
  deliveryFee, 
  onApplyReward,
  appliedRedemptionId 
}: LoyaltyPointsSectionProps) {
  const { data: settings, isLoading: settingsLoading } = useLoyaltySettings();
  const { data: wallet, isLoading: walletLoading } = useLoyaltyWallet();
  const { data: rewards, isLoading: rewardsLoading } = useLoyaltyRewards();
  const reserveReward = useReserveReward();
  const cancelRedemption = useCancelRedemption();

  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const isLoading = settingsLoading || walletLoading || rewardsLoading;
  const balance = wallet?.points_balance || 0;
  const pending = wallet?.points_pending || 0;

  // Memoize applicable rewards calculation
  const applicableRewards = useMemo(() => {
    if (!rewards) return [];
    return rewards.filter(reward => {
      const check = isRewardApplicable(reward, balance, subtotal, deliveryFee);
      return check.applicable;
    });
  }, [rewards, balance, subtotal, deliveryFee]);

  // Find free shipping reward
  const freeShippingReward = useMemo(() => {
    return applicableRewards.find(r => r.type === 'free_shipping');
  }, [applicableRewards]);

  // Sync selectedRewardId with appliedRedemptionId
  useEffect(() => {
    if (appliedRedemptionId && freeShippingReward) {
      setSelectedRewardId(freeShippingReward.id);
    } else if (!appliedRedemptionId) {
      setSelectedRewardId(null);
    }
  }, [appliedRedemptionId, freeShippingReward]);

  // Determine if free shipping is active
  const isFreeShippingActive = Boolean(appliedRedemptionId && selectedRewardId === freeShippingReward?.id);
  const isProcessing = reserveReward.isPending || cancelRedemption.isPending;

  const handleToggleFreeShipping = useCallback(async (enabled: boolean) => {
    if (!freeShippingReward) return;

    if (enabled) {
      try {
        const redemption = await reserveReward.mutateAsync({
          rewardId: freeShippingReward.id,
          pointsCost: freeShippingReward.points_cost,
        });
        setSelectedRewardId(freeShippingReward.id);
        onApplyReward(freeShippingReward, redemption.id);
      } catch (error) {
        console.error('Error reserving reward:', error);
      }
    } else {
      // When disabling, always try to cancel and reset state
      try {
        if (appliedRedemptionId) {
          await cancelRedemption.mutateAsync(appliedRedemptionId);
        }
      } catch (error) {
        console.error('Error cancelling redemption:', error);
      } finally {
        // Always reset state even if cancel fails
        setSelectedRewardId(null);
        onApplyReward(null, null);
      }
    }
  }, [freeShippingReward, appliedRedemptionId, reserveReward, cancelRedemption, onApplyReward]);

  // Loading state
  if (isLoading) {
    return (
      <div className="card-premium p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-3" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  // Don't show if loyalty is disabled
  if (!settings?.enabled) return null;

  return (
    <section className="card-premium p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Star className="w-5 h-5 text-primary fill-primary" />
          {settings.program_name}
        </h2>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">{balance.toLocaleString('pt-BR')} pts</p>
          {pending > 0 && (
            <p className="text-xs text-muted-foreground">+{pending} pendentes</p>
          )}
        </div>
      </div>

      {/* Free Shipping Toggle */}
      {freeShippingReward && deliveryFee > 0 && (
        <div 
          className={cn(
            "p-4 rounded-xl border-2 transition-all",
            isFreeShippingActive 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/40"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{freeShippingReward.name}</p>
              <p className="text-sm text-muted-foreground">
                Gastar <span className="font-bold text-primary">{freeShippingReward.points_cost} pontos</span>
              </p>
              {isFreeShippingActive && (
                <p className="text-sm text-primary font-medium mt-1 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Frete: R$ {deliveryFee.toFixed(2).replace('.', ',')} → Grátis
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <Switch
                  checked={isFreeShippingActive}
                  onCheckedChange={handleToggleFreeShipping}
                  disabled={isProcessing}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* No applicable rewards message */}
      {applicableRewards.length === 0 && balance > 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Você tem pontos, mas nenhuma recompensa está disponível para este pedido.
        </p>
      )}

      {/* Points to earn preview */}
      {settings.earning_rate_points_per_real > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Você ganhará{' '}
            <span className="font-bold text-primary">
              +{Math.floor(subtotal * settings.earning_rate_points_per_real)} pontos
            </span>{' '}
            com este pedido
          </p>
        </div>
      )}
    </section>
  );
}