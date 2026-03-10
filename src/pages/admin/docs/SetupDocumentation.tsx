import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Server, Database, Key, Globe, Shield, Terminal, 
  CheckCircle, Copy, ChevronDown, ChevronRight,
  Rocket, FileCode, Lock, Cloud, MonitorSmartphone,
  Truck, CreditCard, Bell, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function CopyBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Copiado!');
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-muted/50">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
        onClick={handleCopy}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({ 
  icon: Icon, 
  title, 
  step, 
  children, 
  defaultOpen = false 
}: { 
  icon: any; 
  title: string; 
  step: number; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="border-border">
      <CardHeader 
        className="cursor-pointer select-none" 
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
            {step}
          </div>
          <Icon className="h-5 w-5 text-primary" />
          <span className="flex-1">{title}</span>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

function SecretRow({ name, description, where }: { name: string; description: string; where: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-border last:border-0">
      <Badge variant="secondary" className="font-mono text-xs w-fit">{name}</Badge>
      <span className="text-sm text-foreground flex-1">{description}</span>
      <span className="text-xs text-muted-foreground">{where}</span>
    </div>
  );
}

export default function SetupDocumentation() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Documentação de Setup" />

      {/* Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Rocket className="h-6 w-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">Visão Geral do Sistema</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sistema completo de delivery e pedidos com painel administrativo, app do cliente (PWA), 
                módulo de entregador, garçom, mesas com QR Code, programa de fidelidade, 
                integração iFood, pagamento PIX (Efí) e notificações push.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge>React + Vite</Badge>
                <Badge>TypeScript</Badge>
                <Badge>Tailwind CSS</Badge>
                <Badge>Supabase</Badge>
                <Badge>Edge Functions</Badge>
                <Badge>PWA</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">

        <Section icon={Terminal} title="Clonar o Repositório" step={1} defaultOpen>
          <p className="text-sm text-muted-foreground">
            Primeiro, clone o repositório do GitHub e instale as dependências.
          </p>
          <CopyBlock code={`git clone https://github.com/SEU-USUARIO/SEU-REPO.git
cd SEU-REPO
npm install`} />
          <p className="text-sm text-muted-foreground">
            Requisitos: <strong>Node.js 18+</strong> e <strong>npm 9+</strong> instalados.
          </p>
        </Section>

        <Section icon={Database} title="Criar Projeto Supabase" step={2}>
          <p className="text-sm text-muted-foreground">
            Crie um novo projeto no Supabase para o cliente.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
            <li>Acesse <strong>supabase.com</strong> e crie uma conta</li>
            <li>Clique em <strong>New Project</strong></li>
            <li>Escolha nome, senha do banco e região (preferencialmente <code>sa-east-1</code> para Brasil)</li>
            <li>Aguarde o projeto ser provisionado (~2 min)</li>
            <li>Anote o <strong>Project ID</strong> e as chaves em <strong>Settings → API</strong></li>
          </ol>
        </Section>

        <Section icon={Server} title="Restaurar o Banco de Dados" step={3}>
          <p className="text-sm text-muted-foreground">
            Execute todas as migrations para criar as tabelas, views, funções e triggers.
          </p>
          
          <h4 className="font-medium text-sm text-foreground">Opção A: Via Supabase CLI (recomendado)</h4>
          <CopyBlock code={`# Instale o Supabase CLI
npm install -g supabase

# Faça login
supabase login

# Linke ao projeto do cliente
supabase link --project-ref ID_DO_PROJETO_CLIENTE

# Execute todas as migrations
supabase db push`} />

          <Separator />

          <h4 className="font-medium text-sm text-foreground">Opção B: Via SQL Editor</h4>
          <p className="text-sm text-muted-foreground">
            No dashboard do Supabase, vá em <strong>SQL Editor</strong> e execute cada arquivo 
            da pasta <code>supabase/migrations/</code> na ordem cronológica (pelo nome do arquivo).
          </p>
        </Section>

        <Section icon={FileCode} title="Configurar Variáveis de Ambiente" step={4}>
          <p className="text-sm text-muted-foreground">
            Crie um arquivo <code>.env</code> na raiz do projeto com as credenciais do Supabase do cliente.
          </p>
          <CopyBlock code={`VITE_SUPABASE_URL=https://ID_DO_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_ANON_KEY_AQUI
VITE_SUPABASE_PROJECT_ID=ID_DO_PROJETO`} />
          <p className="text-sm text-muted-foreground">
            Essas chaves estão em: <strong>Supabase Dashboard → Settings → API</strong>
          </p>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              ⚠️ <strong>Importante:</strong> Também atualize o arquivo <code>src/integrations/supabase/client.ts</code>
              para apontar para a URL e anon key do novo projeto, caso não esteja usando variáveis de ambiente.
            </p>
          </div>
        </Section>

        <Section icon={Key} title="Configurar Secrets (Edge Functions)" step={5}>
          <p className="text-sm text-muted-foreground">
            No dashboard do Supabase do cliente, vá em <strong>Settings → Edge Functions → Secrets</strong> 
            e adicione cada secret abaixo.
          </p>

          <div className="space-y-1">
            <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Supabase (obrigatório)
            </h4>
            <SecretRow name="SUPABASE_URL" description="URL do projeto" where="Settings → API" />
            <SecretRow name="SUPABASE_ANON_KEY" description="Chave anônima" where="Settings → API" />
            <SecretRow name="SUPABASE_SERVICE_ROLE_KEY" description="Chave service role" where="Settings → API" />
          </div>

          <Separator />

          <div className="space-y-1">
            <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Pagamento PIX - Efí/Gerencianet
            </h4>
            <SecretRow name="EFI_CLIENT_ID" description="Client ID da API" where="Painel Efí → Aplicações" />
            <SecretRow name="EFI_CLIENT_SECRET" description="Client Secret da API" where="Painel Efí → Aplicações" />
            <SecretRow name="EFI_PIX_KEY" description="Chave PIX cadastrada" where="Painel Efí → PIX" />
            <SecretRow name="EFI_CERTIFICATE_P12_BASE64" description="Certificado .p12 em base64" where="Painel Efí → Certificados" />
          </div>

          <div className="p-3 rounded-lg bg-muted border border-border">
            <p className="text-sm text-muted-foreground">
              💡 Para converter o certificado .p12 em base64:
            </p>
            <CopyBlock code="base64 -i certificado.p12 | tr -d '\\n' > cert_base64.txt" />
          </div>

          <Separator />

          <div className="space-y-1">
            <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" /> Push Notifications (VAPID)
            </h4>
            <SecretRow name="VAPID_PUBLIC_KEY" description="Chave pública VAPID" where="Gerar com web-push" />
            <SecretRow name="VAPID_PRIVATE_KEY" description="Chave privada VAPID" where="Gerar com web-push" />
          </div>

          <CopyBlock code={`# Instale e gere as chaves VAPID
npx web-push generate-vapid-keys`} />

          <Separator />

          <div className="space-y-1">
            <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Google Maps
            </h4>
            <SecretRow name="GOOGLE_MAPS_API_KEY" description="API Key do Google Maps" where="Google Cloud Console" />
          </div>
          <p className="text-sm text-muted-foreground">
            APIs necessárias: <strong>Maps JavaScript API</strong>, <strong>Geocoding API</strong>, <strong>Directions API</strong>.
          </p>
        </Section>

        <Section icon={Cloud} title="Deploy das Edge Functions" step={6}>
          <p className="text-sm text-muted-foreground">
            Faça deploy de todas as Edge Functions para o projeto do cliente.
          </p>
          <CopyBlock code={`# Certifique-se que está linkado
supabase link --project-ref ID_DO_PROJETO_CLIENTE

# Deploy de todas as funções de uma vez
supabase functions deploy`} />
          
          <h4 className="font-medium text-sm text-foreground mt-4">Funções incluídas:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {[
              'stripe-checkout', 'stripe-webhook', 'efi-create-pix', 'efi-check-pix', 
              'efi-webhook', 'send-push', 'get-vapid-key', 'get-maps-key', 
              'get-cep-address', 'reverse-geocode', 'create-driver', 'validate-checkout',
              'serve-manifest', 'serve-pwa-icon', 'ifood-auth', 'ifood-poll',
              'ifood-process-events', 'ifood-order-actions', 'sync-subscription',
              'simulate-subscription', 'owner-create-subscription'
            ].map(fn => (
              <Badge key={fn} variant="outline" className="text-xs font-mono justify-center">{fn}</Badge>
            ))}
          </div>
        </Section>

        <Section icon={Shield} title="Configurar Authentication" step={7}>
          <p className="text-sm text-muted-foreground">
            Configure as URLs de redirecionamento no Supabase Auth.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
            <li>No dashboard: <strong>Authentication → URL Configuration</strong></li>
            <li><strong>Site URL:</strong> <code>https://dominio-do-cliente.com</code></li>
            <li><strong>Redirect URLs:</strong> <code>https://dominio-do-cliente.com/**</code></li>
          </ol>

          <div className="p-3 rounded-lg bg-muted border border-border">
            <p className="text-sm text-muted-foreground">
              💡 Se usar domínio temporário do Vercel/Netlify, adicione-o também nas Redirect URLs.
            </p>
          </div>
        </Section>

        <Section icon={Globe} title="Deploy do Frontend" step={8}>
          <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
            <Rocket className="h-4 w-4" /> Opção A: Vercel (recomendado)
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-foreground">
            <li>Acesse <strong>vercel.com</strong> e conecte o GitHub</li>
            <li>Importe o repositório</li>
            <li>Framework Preset: <strong>Vite</strong></li>
            <li>Adicione as 3 variáveis <code>VITE_*</code> em Environment Variables</li>
            <li>Clique Deploy</li>
          </ol>

          <Separator />

          <h4 className="font-medium text-sm text-foreground">Opção B: Netlify</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-foreground">
            <li>Acesse <strong>netlify.com</strong> e conecte o GitHub</li>
            <li>Build command: <code>npm run build</code></li>
            <li>Publish directory: <code>dist</code></li>
            <li>Adicione as variáveis de ambiente</li>
          </ol>

          <Separator />

          <h4 className="font-medium text-sm text-foreground">Opção C: VPS (Ubuntu + Nginx)</h4>
          <CopyBlock code={`# Build local
npm run build

# Copie para o servidor
scp -r dist/ usuario@servidor:/var/www/app`} />

          <p className="text-sm text-muted-foreground mt-2">Configuração Nginx:</p>
          <CopyBlock code={`server {
    listen 80;
    server_name dominio-do-cliente.com;
    root /var/www/app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}` } language="nginx" />

          <CopyBlock code={`# Ativar site e SSL
sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo certbot --nginx -d dominio-do-cliente.com
sudo systemctl reload nginx`} />
        </Section>

        <Section icon={Database} title="Dados Iniciais" step={9}>
          <p className="text-sm text-muted-foreground">
            Insira os dados iniciais obrigatórios no SQL Editor do Supabase.
          </p>
          <CopyBlock code={`-- Loja padrão (ID fixo usado pelo sistema)
INSERT INTO stores (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Nome da Pizzaria', 'pizzaria');

-- Store Settings padrão
INSERT INTO store_settings (store_id) 
VALUES ('00000000-0000-0000-0000-000000000001');

-- App Settings padrão
INSERT INTO app_settings (store_id, app_name, app_short_name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Nome da Pizzaria', 'Pizzaria');

-- Billing Settings (plano ativo)
INSERT INTO billing_settings (status, plan_name, monthly_price, next_due_date)
VALUES ('active', 'Pro', 99.90, (now() + interval '30 days')::date);

-- Criar usuário admin (após o signup via app)
-- Substitua o USER_ID pelo ID do usuário criado
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_AQUI', 'admin');

INSERT INTO store_users (store_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'USER_ID_AQUI', 'owner');`} />
        </Section>

        <Section icon={MonitorSmartphone} title="Storage Buckets" step={10}>
          <p className="text-sm text-muted-foreground">
            Crie os buckets de storage necessários no Supabase.
          </p>
          <CopyBlock code={`-- No SQL Editor do Supabase:
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('sounds', 'sounds', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('promotions', 'promotions', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('app-logos', 'app-logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('app-icons', 'app-icons', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('app-splash', 'app-splash', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);

-- Políticas de acesso público (leitura)
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (true);

-- Upload autenticado
CREATE POLICY "Authenticated upload" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update" ON storage.objects 
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete" ON storage.objects 
FOR DELETE TO authenticated USING (true);`} />
        </Section>
      </div>

      {/* Checklist Final */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5 text-primary" />
            Checklist Final
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Banco criado com todas as migrations',
              'Variáveis .env configuradas',
              'Secrets das Edge Functions adicionados',
              'Edge Functions deployadas',
              'Auth URLs configuradas',
              'Frontend deployado',
              'Dados iniciais inseridos (store, settings)',
              'Storage buckets criados',
              'Domínio com SSL ativo',
              'Testar: login, criar pedido, pagamento PIX',
              'Testar: push notifications',
              'Testar: QR Code das mesas',
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                {item}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
