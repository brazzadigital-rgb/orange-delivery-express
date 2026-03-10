import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Smartphone, Webhook, CreditCard, MapPin, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { useIFoodConnection } from '@/hooks/useIFoodIntegration';

export default function Integrations() {
  const { data: ifoodConnection } = useIFoodConnection();

  const integrations = [
    {
      id: 'ifood',
      name: 'iFood',
      description: 'Receba pedidos do iFood diretamente no seu painel',
      icon: Smartphone,
      status: ifoodConnection?.enabled ? 'connected' : ifoodConnection ? 'configured' : 'disconnected',
      path: '/admin/integrations/ifood',
      color: 'bg-red-500',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Pagamentos online com cartão de crédito e PIX',
      icon: CreditCard,
      status: 'connected',
      path: '/admin/settings',
      color: 'bg-purple-500',
    },
    {
      id: 'google-maps',
      name: 'Google Maps',
      description: 'Geolocalização e cálculo de rotas de entrega',
      icon: MapPin,
      status: 'connected',
      path: '/admin/settings',
      color: 'bg-blue-500',
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      description: 'Notificações para sistemas externos',
      icon: Webhook,
      status: 'disconnected',
      path: '#',
      color: 'bg-gray-500',
      disabled: true,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Ativo
          </Badge>
        );
      case 'configured':
        return (
          <Badge className="bg-accent/50 text-accent-foreground border-accent gap-1">
            <AlertCircle className="h-3 w-3" />
            Configurado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <Circle className="h-3 w-3" />
            Inativo
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">Conecte sua loja a plataformas e serviços externos</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {integrations.map((integration) => (
          <Card 
            key={integration.id} 
            className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30 ${integration.disabled ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {/* Decorative gradient */}
            <div className={`absolute inset-0 opacity-[0.03] ${integration.color}`} />
            
            <CardHeader className="relative pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className={`p-3 rounded-xl ${integration.color} shadow-lg`}>
                  <integration.icon className="h-6 w-6 text-white" />
                </div>
                {getStatusBadge(integration.status)}
              </div>
              
              <div className="mt-4">
                <CardTitle className="text-xl font-semibold">{integration.name}</CardTitle>
                <CardDescription className="mt-2 text-sm leading-relaxed">
                  {integration.description}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="relative pt-0">
              <Button 
                asChild 
                variant={integration.status === 'connected' ? 'secondary' : 'default'}
                className="w-full group-hover:shadow-sm"
                disabled={integration.disabled}
              >
                <Link to={integration.path}>
                  {integration.status === 'connected' ? 'Gerenciar' : 'Configurar'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info section */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Precisa de uma integração personalizada?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Entre em contato com nosso suporte para configurar webhooks ou integrações customizadas para o seu negócio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
