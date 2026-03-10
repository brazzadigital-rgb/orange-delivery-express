import { AlertTriangle, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlanLimitAlertProps {
  limitType: string;
  current: number;
  max: number;
  planName?: string;
}

export function PlanLimitAlert({ limitType, current, max, planName }: PlanLimitAlertProps) {
  const labels: Record<string, string> = {
    products: 'produtos',
    categories: 'categorias',
    orders: 'pedidos/mês',
    users: 'usuários',
    drivers: 'motoboys',
  };

  const label = labels[limitType] || limitType;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-amber-900 text-sm">
          Limite de {label} atingido
        </h4>
        <p className="text-amber-700 text-sm mt-1">
          Seu plano {planName && <strong>{planName}</strong>} permite até <strong>{max}</strong> {label}.
          Você já possui <strong>{current}</strong>.
        </p>
        <Link
          to="/admin/subscription"
          className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-primary hover:underline"
        >
          <Crown className="w-4 h-4" />
          Fazer upgrade
        </Link>
      </div>
    </div>
  );
}
