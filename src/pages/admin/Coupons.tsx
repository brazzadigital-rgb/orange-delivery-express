import { Plus, Edit2, Copy, Trash2 } from 'lucide-react';
import { useAdminCoupons } from '@/hooks/useAdmin';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminCoupons() {
  const { data: coupons, isLoading } = useAdminCoupons();

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const formatCouponValue = (type: string, amount: number) => {
    if (type === 'percent') return `${amount}%`;
    if (type === 'value') return `R$ ${amount.toFixed(2).replace('.', ',')}`;
    return 'Frete grátis';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cupons</h1>
          <p className="text-muted-foreground">Gerencie cupons de desconto</p>
        </div>
        <Button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="card-premium overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Desconto</th>
                <th>Mínimo</th>
                <th>Usos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {coupons?.map((coupon) => (
                <tr key={coupon.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                        {coupon.code}
                      </code>
                      <button
                        onClick={() => copyCode(coupon.code)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm capitalize">
                      {coupon.type === 'percent'
                        ? 'Porcentagem'
                        : coupon.type === 'value'
                        ? 'Valor fixo'
                        : 'Frete grátis'}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium text-primary">
                      {formatCouponValue(coupon.type, coupon.amount)}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm">
                      R$ {coupon.min_value.toFixed(2).replace('.', ',')}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm">
                      {coupon.used_count}/{coupon.max_uses || '∞'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        coupon.active
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {coupon.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
