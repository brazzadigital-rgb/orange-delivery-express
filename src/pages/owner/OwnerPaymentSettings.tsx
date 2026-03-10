import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { usePaymentSettings, useUpdatePaymentSettings } from '@/hooks/usePaymentSettings';
import { useStoreId } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { QrCode, CreditCard, RefreshCw } from 'lucide-react';

export default function OwnerPaymentSettings() {
  const storeId = useStoreId();
  const { data: settings, isLoading } = usePaymentSettings(storeId);
  const updateMutation = useUpdatePaymentSettings();

  const handleToggle = async (provider: 'efi' | 'mp', enabled: boolean) => {
    if (!settings) return;

    const payload = {
      storeId,
      efi_enabled: provider === 'efi' ? enabled : settings.efi_enabled,
      mp_enabled: provider === 'mp' ? enabled : settings.mp_enabled,
    };

    // At least one must be enabled
    if (!payload.efi_enabled && !payload.mp_enabled) {
      toast.error('Pelo menos um provedor deve estar ativo');
      return;
    }

    try {
      await updateMutation.mutateAsync(payload);
      toast.success(`${provider === 'efi' ? 'EFI Bank' : 'Mercado Pago'} ${enabled ? 'ativado' : 'desativado'}`);
    } catch {
      toast.error('Erro ao salvar configuração');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Integrações de Pagamento</h1>
        <p className="text-muted-foreground text-sm">
          Configure quais provedores de pagamento estão ativos para cobranças de assinaturas
        </p>
      </div>

      {/* EFI Bank */}
      <Card className={settings?.efi_enabled ? 'border-primary/30' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500 shadow-lg">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">EFI Bank (PIX)</CardTitle>
                <CardDescription>Cobranças via PIX com QR Code</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={settings?.efi_enabled ? 'default' : 'outline'}>
                {settings?.efi_enabled ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch
                checked={settings?.efi_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('efi', checked)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gera cobranças PIX instantâneas usando a API da EFI (Gerencianet). 
            Quando ativo, é usado como método prioritário para novas assinaturas.
          </p>
        </CardContent>
      </Card>

      {/* Mercado Pago */}
      <Card className={settings?.mp_enabled ? 'border-primary/30' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Mercado Pago</CardTitle>
                <CardDescription>Assinaturas recorrentes via Preapproval</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={settings?.mp_enabled ? 'default' : 'outline'}>
                {settings?.mp_enabled ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch
                checked={settings?.mp_enabled ?? false}
                onCheckedChange={(checked) => handleToggle('mp', checked)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Usa o Mercado Pago para criar assinaturas recorrentes com cobrança automática.
            Requer credenciais MP_ACCESS_TOKEN configuradas.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> O provedor ativo será usado ao criar ou alterar assinaturas. 
            Pelo menos um provedor deve estar habilitado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
