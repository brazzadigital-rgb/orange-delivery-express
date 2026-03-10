export const DEFAULT_STORE_ID = '5bbece79-1112-4d71-bb66-3e55d17a280e';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  created: 'Aguardando',
  paid: 'Pago',
  accepted: 'Aceito',
  rejected: 'Recusado',
  preparing: 'Preparando',
  ready: 'Pronto',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  canceled: 'Cancelado',
  served: 'Servido',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<string, string> = {
  created: 'Aguardando a confirmação do restaurante',
  paid: 'Pagamento confirmado com sucesso',
  accepted: 'Seu pedido foi aceito pelo restaurante',
  rejected: 'Infelizmente seu pedido foi recusado',
  preparing: 'Estamos preparando seu pedido com carinho',
  ready: 'Seu pedido está pronto para retirada ou entrega',
  out_for_delivery: 'O entregador está a caminho do seu endereço',
  delivered: 'Pedido entregue! Bom apetite!',
  canceled: 'Este pedido foi cancelado',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  created: 'bg-amber-100 text-amber-800',
  paid: 'bg-blue-100 text-blue-800',
  accepted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  canceled: 'bg-red-100 text-red-800',
  served: 'bg-teal-100 text-teal-800',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  card: 'Cartão',
  cash: 'Dinheiro',
};

// Order status flow definitions
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  created: ['accepted', 'rejected', 'canceled'],
  accepted: ['preparing', 'canceled'],
  preparing: ['ready'],
  ready: ['out_for_delivery', 'delivered'], // delivered for pickup
  out_for_delivery: ['delivered'],
  delivered: [],
  rejected: [],
  canceled: [],
};

export const ORDER_STATUS_ACTIONS: Record<string, { label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' }[]> = {
  created: [
    { label: 'Aceitar', variant: 'default' },
    { label: 'Recusar', variant: 'destructive' },
  ],
  accepted: [
    { label: 'Iniciar Preparo', variant: 'default' },
  ],
  preparing: [
    { label: 'Marcar Pronto', variant: 'default' },
  ],
  ready: [
    { label: 'Despachar Entrega', variant: 'default' },
    { label: 'Marcar Entregue', variant: 'secondary' },
  ],
  out_for_delivery: [
    { label: 'Marcar Entregue', variant: 'default' },
  ],
};
