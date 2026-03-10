export interface SubscriptionPlan {
  code: 'monthly' | 'quarterly' | 'annual';
  name: string;
  months: number;
  baseMonthlyPrice: number;
  discountPercent: number;
  totalPrice: number;
  savings: number;
  frequency: number;
  frequencyType: 'months';
  popular?: boolean;
}

const BASE_MONTHLY_PRICE = 250;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    code: 'monthly',
    name: 'Mensal',
    months: 1,
    baseMonthlyPrice: BASE_MONTHLY_PRICE,
    discountPercent: 0,
    totalPrice: BASE_MONTHLY_PRICE,
    savings: 0,
    frequency: 1,
    frequencyType: 'months',
  },
  {
    code: 'quarterly',
    name: 'Trimestral',
    months: 3,
    baseMonthlyPrice: BASE_MONTHLY_PRICE,
    discountPercent: 10,
    totalPrice: BASE_MONTHLY_PRICE * 3 * 0.9, // 675
    savings: BASE_MONTHLY_PRICE * 3 * 0.1,    // 75
    frequency: 3,
    frequencyType: 'months',
    popular: true,
  },
  {
    code: 'annual',
    name: 'Anual',
    months: 12,
    baseMonthlyPrice: BASE_MONTHLY_PRICE,
    discountPercent: 20,
    totalPrice: BASE_MONTHLY_PRICE * 12 * 0.8, // 2400
    savings: BASE_MONTHLY_PRICE * 12 * 0.2,    // 600
    frequency: 12,
    frequencyType: 'months',
  },
];

export function getPlanByCode(code: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(p => p.code === code);
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
