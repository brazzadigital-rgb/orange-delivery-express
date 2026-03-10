import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, QrCode, UserCheck, Truck, Star, AlertTriangle, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureFlags {
  table_service: boolean;
  waiter_app: boolean;
  courier_app: boolean;
  loyalty_points: boolean;
  kitchen_kds: boolean;
}

const FEATURE_META: Record<keyof FeatureFlags, { label: string; description: string; icon: typeof QrCode }> = {
  table_service: {
    label: 'Serviços de Mesa',
    description: 'QR Code, comandas digitais, mesas e chamados',
    icon: QrCode,
  },
  waiter_app: {
    label: 'App do Garçom',
    description: 'Interface do garçom para atender mesas (depende de Serviços de Mesa)',
    icon: UserCheck,
  },
  courier_app: {
    label: 'App Motoboy',
    description: 'App do entregador, rastreamento e gestão de motoboys',
    icon: Truck,
  },
  loyalty_points: {
    label: 'Pontos de Fidelidade',
    description: 'Programa de fidelidade, resgate de recompensas',
    icon: Star,
  },
  kitchen_kds: {
    label: 'Cozinha KDS',
    description: 'Display de cozinha em tempo real, workflow de pedidos',
    icon: ChefHat,
  },
};

export default function OwnerStoreFeatures() {
  const queryClient = useQueryClient();

  // Fetch all stores and their features
  const { data: stores, isLoading } = useQuery({
    queryKey: ['owner-stores-features'],
    queryFn: async () => {
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name, slug')
        .order('name');

      if (storesError) throw storesError;

      const { data: featuresData, error: featuresError } = await supabase
        .from('store_features')
        .select('*');

      if (featuresError) throw featuresError;

      return storesData.map((store) => {
        const featureRow = featuresData?.find((f: any) => f.store_id === store.id);
        const features: FeatureFlags = featureRow?.features
          ? {
              table_service: (featureRow.features as any).table_service !== false,
              waiter_app: (featureRow.features as any).waiter_app !== false,
              courier_app: (featureRow.features as any).courier_app !== false,
              loyalty_points: (featureRow.features as any).loyalty_points !== false,
              kitchen_kds: (featureRow.features as any).kitchen_kds !== false,
            }
          : { table_service: true, waiter_app: true, courier_app: true, loyalty_points: true, kitchen_kds: true };

        return { ...store, features, featureRowId: featureRow?.id };
      });
    },
  });

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/owner/subscriptions" className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Recursos do Plano</h1>
          <p className="text-muted-foreground text-sm">Ative ou desative módulos por cliente</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Carregando...</div>
      ) : (
        stores?.map((store) => (
          <StoreFeatureCard key={store.id} store={store} queryClient={queryClient} />
        ))
      )}
    </div>
  );
}

function StoreFeatureCard({
  store,
  queryClient,
}: {
  store: { id: string; name: string; slug: string; features: FeatureFlags; featureRowId?: string };
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [local, setLocal] = useState<FeatureFlags>(store.features);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(store.features);
    setDirty(false);
  }, [store.features]);

  const mutation = useMutation({
    mutationFn: async (features: FeatureFlags) => {
      const { error } = await supabase
        .from('store_features')
        .upsert(
          { store_id: store.id, features: features as any, updated_at: new Date().toISOString() },
          { onConflict: 'store_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Recursos de "${store.name}" atualizados!`);
      queryClient.invalidateQueries({ queryKey: ['owner-stores-features'] });
      setDirty(false);
    },
    onError: (err: any) => {
      toast.error('Erro ao salvar: ' + err.message);
    },
  });

  const toggle = (key: keyof FeatureFlags) => {
    setLocal((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Dependency: waiter_app requires table_service
      if (key === 'table_service' && !next.table_service) {
        next.waiter_app = false;
      }
      if (key === 'waiter_app' && next.waiter_app && !next.table_service) {
        next.table_service = true;
      }
      return next;
    });
    setDirty(true);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{store.name}</CardTitle>
            <CardDescription>{store.slug}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {Object.values(local).filter(Boolean).length}/{Object.keys(local).length} ativos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(FEATURE_META) as (keyof FeatureFlags)[]).map((key) => {
          const meta = FEATURE_META[key];
          const Icon = meta.icon;
          const isOn = local[key];
          const showWarning = key === 'waiter_app' && isOn && !local.table_service;

          return (
            <div key={key} className="flex items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isOn ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                  {showWarning && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3" /> Depende de Serviços de Mesa
                    </p>
                  )}
                </div>
              </div>
              <Switch checked={isOn} onCheckedChange={() => toggle(key)} />
            </div>
          );
        })}

        {dirty && (
          <div className="flex justify-end pt-2 border-t border-border">
            <Button
              onClick={() => mutation.mutate(local)}
              disabled={mutation.isPending}
              size="sm"
            >
              {mutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
