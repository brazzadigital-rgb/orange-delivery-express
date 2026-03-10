import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  Key, 
  Webhook, 
  ShoppingBag, 
  CheckCircle, 
  AlertTriangle,
  Code,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function IFoodDocumentation() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Documentação iFood</h1>
            <p className="text-muted-foreground">Guia completo de integração com a plataforma iFood</p>
          </div>
        </div>
        <Button asChild>
          <Link to="/admin/integrations/ifood">
            Ir para Configuração
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6 pr-4">
          {/* Pré-requisitos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>A) Pré-requisitos</CardTitle>
              </div>
              <CardDescription>O que você precisa antes de começar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">1. Conta no iFood Developer</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse <a href="https://developer.ifood.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">developer.ifood.com.br</a> e crie uma conta de desenvolvedor.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">2. Criar um Aplicativo</h4>
                <p className="text-sm text-muted-foreground">
                  No portal do desenvolvedor, crie um novo aplicativo e obtenha:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                  <li><code className="bg-muted px-1 rounded">clientId</code> - Identificador do seu aplicativo</li>
                  <li><code className="bg-muted px-1 rounded">clientSecret</code> - Chave secreta (nunca compartilhe!)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">3. Escolher o Modo de Ingestão</h4>
                <div className="grid gap-3 mt-2">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>Recomendado</Badge>
                      <span className="font-medium">Polling</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Busca eventos a cada 30 segundos. Mais simples de configurar, não requer infraestrutura adicional.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Avançado</Badge>
                      <span className="font-medium">Webhook</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recebe eventos em tempo real. Requer autenticação centralizada e infraestrutura estável com HTTPS.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Autenticação */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>B) Como Autenticar (OAuth2)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A autenticação com o iFood usa o padrão OAuth 2.0 Bearer Token.
              </p>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="client-credentials">
                  <AccordionTrigger>Fluxo Client Credentials (Server-to-Server)</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Usado quando você controla totalmente a autenticação (centralizada).
                      </p>
                      <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`POST https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token
Content-Type: application/x-www-form-urlencoded

grantType=client_credentials
&clientId=SEU_CLIENT_ID
&clientSecret=SEU_CLIENT_SECRET`}
                      </pre>
                      <p className="text-sm text-muted-foreground">
                        Resposta contém <code>accessToken</code> e <code>expiresIn</code> (em segundos).
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="authorization-code">
                  <AccordionTrigger>Fluxo Authorization Code (Distribuído)</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Usado quando o lojista autoriza seu app pelo Portal iFood.
                      </p>
                      <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                        <li>Gere um <code>userCode</code> via API</li>
                        <li>Lojista acessa <code>verificationUrlComplete</code> e autoriza</li>
                        <li>Receba o <code>authorizationCode</code></li>
                        <li>Troque por <code>accessToken</code> e <code>refreshToken</code></li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-600">Importante</p>
                    <p className="text-sm text-muted-foreground">
                      Tokens expiram! Use o campo <code>expiresIn</code> para renovar antes da expiração. 
                      Não fixe tempos de expiração no código.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Como Receber Pedidos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <CardTitle>C) Como Receber Pedidos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="polling">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge>Recomendado</Badge>
                      Polling
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">1. Buscar Eventos (a cada 30s)</h4>
                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`GET https://merchant-api.ifood.com.br/order/v1.0/events:polling
Authorization: Bearer {accessToken}`}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">2. Persistir Eventos (Antes do ACK!)</h4>
                        <p className="text-sm text-muted-foreground">
                          Salve todos os eventos no banco de dados antes de confirmar. 
                          Use <code>event.id</code> como chave única para idempotência.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">3. Enviar ACK (Acknowledgment)</h4>
                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`POST https://merchant-api.ifood.com.br/order/v1.0/events/acknowledgment
Authorization: Bearer {accessToken}
Content-Type: application/json

[{"id": "event-id-1"}, {"id": "event-id-2"}]`}
                        </pre>
                        <p className="text-sm text-muted-foreground">
                          Máximo de 2000 eventos por requisição.
                        </p>
                      </div>

                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm">
                          <strong>Dica:</strong> Eventos podem chegar fora de ordem! 
                          Sempre ordene por <code>createdAt</code> antes de processar.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="webhook">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Avançado</Badge>
                      Webhook
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Webhook é para autenticação centralizada e requer validação de assinatura.
                      </p>

                      <div className="space-y-2">
                        <h4 className="font-medium">1. Configurar URL no Portal</h4>
                        <p className="text-sm text-muted-foreground">
                          Registre sua URL HTTPS no iFood Developer Portal.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">2. Validar Assinatura (Obrigatório!)</h4>
                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`// Validar X-IFood-Signature
const hmac = crypto.createHmac('sha256', clientSecret);
hmac.update(rawBody); // Body BRUTO, não parseado!
const signature = hmac.digest('hex');

if (signature !== requestSignature) {
  return res.status(401).send('Invalid signature');
}`}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">3. Responder 202 Imediatamente</h4>
                        <p className="text-sm text-muted-foreground">
                          Responda <code>202 Accepted</code> antes de processar. 
                          O processamento deve ser assíncrono.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Como Aceitar e Atualizar */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle>D) Como Aceitar e Atualizar Pedido</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">1. Buscar Detalhes do Pedido</h4>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`GET https://merchant-api.ifood.com.br/order/v1.0/orders/{orderId}
Authorization: Bearer {accessToken}`}
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    Verifique itens, endereço e pagamento antes de confirmar.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">2. Confirmar Pedido</h4>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`POST https://merchant-api.ifood.com.br/order/v1.0/orders/{orderId}/confirm
Authorization: Bearer {accessToken}`}
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    A confirmação é assíncrona. O status atualizado chegará via evento.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">3. Outros Status</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><code>/dispatch</code> - Saiu para entrega</p>
                    <p><code>/readyToPickup</code> - Pronto para retirada</p>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">4. Cancelar Pedido</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Obrigatório:</strong> Consulte os motivos de cancelamento primeiro!
                  </p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto mb-2">
{`GET /orders/{orderId}/cancellationReasons
POST /orders/{orderId}/requestCancellation
{ "reason": "...", "cancellationCode": "..." }`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <CardTitle>E) Troubleshooting</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="no-orders">
                  <AccordionTrigger>Pedidos não chegam</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Verifique se o polling está rodando a cada 30 segundos</li>
                      <li>Confirme que o ACK está sendo enviado após persistir eventos</li>
                      <li>Verifique se o token não expirou (erro 401)</li>
                      <li>Confira se os merchants estão ativos na conexão</li>
                      <li>Eventos ficam disponíveis por até 8 horas</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="webhook-fails">
                  <AccordionTrigger>Webhook não entrega eventos</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Validação de assinatura incorreta (use body bruto!)</li>
                      <li>Endpoint instável ou lento (responda 202 imediatamente)</li>
                      <li>Certificado HTTPS/TLS inválido ou expirado</li>
                      <li>URL não acessível publicamente</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="token-expired">
                  <AccordionTrigger>Token expira frequentemente</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Implemente renovação automática antes da expiração</li>
                      <li>Use o campo <code>expiresIn</code> da resposta do token</li>
                      <li>Renove quando faltar ~5 minutos para expirar</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="duplicate-orders">
                  <AccordionTrigger>Pedidos duplicados</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Use <code>event_id</code> como chave única (constraint)</li>
                      <li>Verifique <code>external_order_id</code> antes de criar pedido</li>
                      <li>Implemente upsert com <code>ON CONFLICT</code></li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Códigos de Evento */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                <CardTitle>F) Códigos de Evento iFood</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <Badge className="mb-2">PLC</Badge>
                  <p className="text-sm text-muted-foreground">Placed - Pedido criado</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <Badge className="mb-2">CFM</Badge>
                  <p className="text-sm text-muted-foreground">Confirmed - Pedido aceito</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <Badge className="mb-2">RTP</Badge>
                  <p className="text-sm text-muted-foreground">Ready to Pickup - Pronto</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <Badge className="mb-2">DSP</Badge>
                  <p className="text-sm text-muted-foreground">Dispatched - Saiu para entrega</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <Badge className="mb-2">CON</Badge>
                  <p className="text-sm text-muted-foreground">Concluded - Entregue</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <Badge variant="destructive" className="mb-2">CAN</Badge>
                  <p className="text-sm text-muted-foreground">Cancelled - Cancelado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
