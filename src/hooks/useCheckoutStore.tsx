import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DeliveryType = 'delivery' | 'pickup';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash';
export type ScheduleType = 'asap' | 'scheduled';

 interface LoyaltyRewardApplied {
   rewardId: string;
   redemptionId: string;
   type: 'free_shipping' | 'free_item' | 'discount_amount' | 'discount_percent';
   pointsCost: number;
   value: number; // The actual value (e.g., shipping fee zeroed, discount amount)
 }
 
interface AddressSnapshot {
  id: string;
  label: string | null;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
}

interface CheckoutState {
  // Address step
  addressId: string | null;
  addressSnapshot: AddressSnapshot | null;
  
  // Delivery step
  deliveryType: DeliveryType;
  scheduleType: ScheduleType;
  scheduledTime: string | null;
  deliveryFee: number;
  estimatedMinutes: number | null;
  
  // Payment step
  paymentMethod: PaymentMethod;
  
  // Coupon
  couponCode: string | null;
  couponId: string | null;
  discount: number;
  
  // Notes
  notes: string;
  
  // Cash change
  cashChangeNeeded: boolean;
  cashChangeFor: number | null;
  cashChangeAmount: number | null;
   
   // Loyalty
   loyaltyReward: LoyaltyRewardApplied | null;
  
  // Actions
  setAddress: (addressId: string, snapshot: AddressSnapshot) => void;
  setDeliveryType: (type: DeliveryType) => void;
  setSchedule: (type: ScheduleType, time?: string) => void;
  setDeliveryFee: (fee: number, estimatedMinutes?: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCashChange: (needed: boolean, changeFor?: number, changeAmount?: number) => void;
  setCoupon: (code: string | null, id: string | null, discount: number) => void;
  setNotes: (notes: string) => void;
   setLoyaltyReward: (reward: LoyaltyRewardApplied | null) => void;
  reset: () => void;
}

const initialState = {
  addressId: null,
  addressSnapshot: null,
  deliveryType: 'delivery' as DeliveryType,
  scheduleType: 'asap' as ScheduleType,
  scheduledTime: null,
  deliveryFee: 0,
  estimatedMinutes: null,
  paymentMethod: 'pix' as PaymentMethod,
  couponCode: null,
  couponId: null,
  discount: 0,
  notes: '',
  // Cash change fields
  cashChangeNeeded: false,
  cashChangeFor: null as number | null,
  cashChangeAmount: null as number | null,
   // Loyalty
   loyaltyReward: null,
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      ...initialState,

      setAddress: (addressId, snapshot) =>
        set({ addressId, addressSnapshot: snapshot }),

      setDeliveryType: (deliveryType) =>
        set({ 
          deliveryType,
          deliveryFee: deliveryType === 'pickup' ? 0 : 8, // Reset fee for pickup
        }),

      setSchedule: (scheduleType, scheduledTime) =>
        set({ scheduleType, scheduledTime: scheduledTime || null }),

      setDeliveryFee: (deliveryFee, estimatedMinutes) =>
        set({ deliveryFee, estimatedMinutes: estimatedMinutes || null }),

      setPaymentMethod: (paymentMethod) =>
        set({ paymentMethod }),

      setCoupon: (couponCode, couponId, discount) =>
        set({ couponCode, couponId, discount }),

      setNotes: (notes) => set({ notes }),

      setCashChange: (cashChangeNeeded, cashChangeFor, cashChangeAmount) =>
        set({ 
          cashChangeNeeded, 
          cashChangeFor: cashChangeFor || null,
          cashChangeAmount: cashChangeAmount || null 
        }),
 
       setLoyaltyReward: (loyaltyReward) => set({ loyaltyReward }),

      reset: () => set(initialState),
    }),
    {
      name: 'checkout-store',
    }
  )
);
