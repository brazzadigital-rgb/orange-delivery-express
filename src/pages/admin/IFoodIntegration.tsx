import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Smartphone,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Link as LinkIcon
} from 'lucide-react';
import {
  useIFoodConnection,
  useIFoodMerchants,
  useIFoodEvents,
  useCreateIFoodConnection,
  useUpdateIFoodConnection,
  useIFoodAuth,
  useIFoodPoll,
  useProcessIFoodEvents,
} from '@/hooks/useIFoodIntegration';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function IFoodIntegration() {
  const { data: connection, isLoading } = useIFoodConnection();
  const { data: merchants = [] } = useIFoodMerchants(connection?.id || null);
  const { data: events = [] } = useIFoodEvents(connection?.id || null);

  const createConnection = useCreateIFoodConnection();
  const updateConnection = useUpdateIFoodConnection();
  const ifoodAuth = useIFoodAuth();
  const ifoodPoll = useIFoodPoll();
  const processEvents = useProcessIFoodEvents();

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const isTokenValid = connection?.expires_at && new Date(connection.expires_at) > new Date();

  const handleCreateConnection = () => {
    if (!clientId || !clientSecret) return;
    createConnection.mutate({ clientId, clientSecret });
  };

  const handleRefreshToken = () => {
    if (!connection) return;
    ifoodAuth.mutate({ connectionId: connection.id, action: 'refresh' });
  };

  const handleTestConnection = () => {
    if (!connection) return;
    ifoodAuth.mutate({ connectionId: connection.id, action: 'test' });
  };

  const handleToggleEnabled = () => {
    if (!connection) return;
    updateConnection.mutate({ id: connection.id, enabled: !connection.enabled });
  };

  const handlePoll = () => {
    if (!connection) return;
    ifoodPoll.mutate(connection.id);
  };

  const handleProcessEvents = () => {
    processEvents.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Integração iFood</h1>
            <p className="text-muted-foreground">Receba pedidos do iFood diretamente no seu painel</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/docs/ifood-integration">
            <LinkIcon className="mr-2 h-4 w-4" />
            Documentação
          </Link>
        </Button>
      </div>

      {!connection ? (
        /* Setup Form */
        <Card>
          <CardHeader>
            <CardTitle>Configurar Conexão</CardTitle>
            <CardDescription>
              Insira suas credenciais do iFood Developer Portal para começar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="Seu Client ID do iFood"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="Seu Client Secret do iFood"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleCreateConnection} 
              disabled={!clientId || !clientSecret || createConnection.isPending}
              className="w-full"
            >
              {createConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Credenciais
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Connected View */
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {connection.enabled ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-600">Ativo</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium text-yellow-600">Pausado</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Token</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {isTokenValid ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-600">Válido</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-red-600">Expirado</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Merchants</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{merchants.length}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Último Polling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {connection.last_poll_at
                      ? formatDistanceToNow(new Date(connection.last_poll_at), { locale: ptBR, addSuffix: true })
                      : 'Nunca'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Controles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={connection.enabled}
                    onCheckedChange={handleToggleEnabled}
                    disabled={updateConnection.isPending}
                  />
                  <Label>Polling Ativo</Label>
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleRefreshToken}
                  disabled={ifoodAuth.isPending}
                >
                  {ifoodAuth.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Atualizar Token
                </Button>

                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={ifoodAuth.isPending}
                >
                  {ifoodAuth.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Testar Conexão
                </Button>

                <Button 
                  variant="outline" 
                  onClick={handlePoll}
                  disabled={ifoodPoll.isPending || !isTokenValid}
                >
                  {ifoodPoll.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar Agora
                </Button>

                <Button 
                  variant="outline" 
                  onClick={handleProcessEvents}
                  disabled={processEvents.isPending}
                >
                  {processEvents.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Processar Eventos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="merchants">
            <TabsList>
              <TabsTrigger value="merchants">Merchants ({merchants.length})</TabsTrigger>
              <TabsTrigger value="events">Eventos ({events.length})</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="merchants" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lojas Conectadas</CardTitle>
                  <CardDescription>Merchants vinculados a esta conexão</CardDescription>
                </CardHeader>
                <CardContent>
                  {merchants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum merchant encontrado</p>
                      <p className="text-sm">Clique em "Testar Conexão" para buscar merchants</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {merchants.map((merchant) => (
                        <div 
                          key={merchant.id} 
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">{merchant.name || 'Sem nome'}</p>
                            <p className="text-sm text-muted-foreground">{merchant.merchant_id}</p>
                          </div>
                          <Badge variant={merchant.active ? 'default' : 'secondary'}>
                            {merchant.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Log de Eventos</CardTitle>
                  <CardDescription>Últimos 100 eventos recebidos do iFood</CardDescription>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum evento registrado</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {events.map((event) => (
                          <div 
                            key={event.id} 
                            className="flex items-center justify-between p-3 rounded-lg border text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant={event.processed ? 'secondary' : 'default'}>
                                {event.code}
                              </Badge>
                              <span className="text-muted-foreground">
                                {event.order_id?.substring(0, 8)}...
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {event.processed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                              <span className="text-muted-foreground">
                                {format(new Date(event.created_at_event), 'dd/MM HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Avançadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Modo</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {connection.mode === 'POLLING' ? 'Polling (a cada 30s)' : 'Webhook (tempo real)'}
                      </p>
                    </div>
                    <div>
                      <Label>Client ID</Label>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">
                        {connection.client_id.substring(0, 8)}...
                      </p>
                    </div>
                    <div>
                      <Label>Token Expira</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {connection.expires_at
                          ? format(new Date(connection.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label>Criado em</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(connection.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
