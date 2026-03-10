import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTableSessionDetail } from '@/hooks/useTableSessions';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { PrintStyles } from '@/components/print/PrintStyles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TableSessionReceipt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useTableSessionDetail(id || '');
  const { config } = useAppConfig();

  if (isLoading || !data) return <div className="p-6"><LoadingSpinner /></div>;

  const { session, orders } = data;
  const tableNum = (session.restaurant_tables as any)?.number || '?';
  const storeName = config?.app_name || 'Restaurante';
  const isMaster = (session as any).session_kind === 'master';
  const displayTables = (session as any).display_tables;
  const activeOrders = orders.filter(o => o.status !== 'canceled');

  // Consolidate items across all orders
  const itemMap = new Map<string, { name: string; qty: number; total: number; options: any[] }>();
  activeOrders.forEach(order => {
    order.order_items?.forEach(item => {
      const key = item.name_snapshot + JSON.stringify(item.options_snapshot || []);
      const existing = itemMap.get(key);
      if (existing) {
        existing.qty += item.quantity;
        existing.total += item.item_total;
      } else {
        itemMap.set(key, {
          name: item.name_snapshot,
          qty: item.quantity,
          total: item.item_total,
          options: Array.isArray(item.options_snapshot) ? item.options_snapshot : [],
        });
      }
    });
  });

  const totalAmount = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const isClosed = session.status === 'closed';
  const paymentLabel: Record<string, string> = {
    cash: 'Dinheiro', card: 'Cartão', pix: 'PIX', other: 'Outro',
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir
        </Button>
      </div>

      <PrintStyles paperSize="80mm" />

      <div className="print-container">
        {/* Header */}
        <div className="print-header">
          <div className="print-bold print-large">{storeName}</div>
          <div style={{ marginTop: '4px' }}>
            {isMaster ? `🧾 CONTA UNIFICADA — Mesas: ${displayTables}` : '🧾 CONTA DA MESA'}
          </div>
        </div>

        {/* Table Info */}
        <div className="print-section">
          <div className="print-row">
            <span className="print-bold">{isMaster ? 'Mesas:' : 'Mesa:'}</span>
            <span className="print-large print-bold">{isMaster ? displayTables : String(tableNum).padStart(2, '0')}</span>
          </div>
          {session.customer_name && (
            <div className="print-row">
              <span>Cliente:</span>
              <span>{session.customer_name}</span>
            </div>
          )}
          <div className="print-row">
            <span>Abertura:</span>
            <span>{format(new Date(session.opened_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          </div>
          {isClosed && session.closed_at && (
            <div className="print-row">
              <span>Fechamento:</span>
              <span>{format(new Date(session.closed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <hr className="print-cut" />

        {/* Items */}
        <div className="print-section">
          <div className="print-bold" style={{ marginBottom: '4px' }}>ITENS:</div>
          {Array.from(itemMap.values()).map((item, idx) => (
            <div key={idx} className="print-item">
              <div className="print-row">
                <span>{item.qty}x {item.name}</span>
                <span>R$ {item.total.toFixed(2).replace('.', ',')}</span>
              </div>
              {item.options.length > 0 && (
                <div className="print-small" style={{ marginLeft: '8px' }}>
                  {item.options.map((opt: any, oidx: number) => (
                    <div key={oidx}>
                      • {opt.optionName || opt.type}: {opt.itemLabel || opt.label}
                      {opt.priceDelta > 0 && ` (+R$ ${opt.priceDelta.toFixed(2).replace('.', ',')})`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <hr className="print-cut" />

        {/* Total */}
        <div className="print-section">
          <div className="print-row print-bold print-large" style={{ marginTop: '4px' }}>
            <span>TOTAL:</span>
            <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        {/* Payment */}
        {isClosed && (
          <div className="print-section">
            <div className="print-row">
              <span>Pagamento:</span>
              <span className="print-bold">
                {paymentLabel[(session as any).payment_method] || (session as any).payment_method || '-'}
              </span>
            </div>
            <div className="print-row">
              <span>Status:</span>
              <span className="print-bold">✅ PAGO</span>
            </div>
          </div>
        )}

        <hr className="print-cut" />

        {/* Footer */}
        <div className="print-center">
          <div className="print-small" style={{ marginTop: '4px' }}>
            Obrigado pela preferência!
          </div>
          <div className="print-small">
            {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
          </div>
        </div>
      </div>
    </div>
  );
}
