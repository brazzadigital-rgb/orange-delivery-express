import { useFeatures, StoreFeatures } from '@/contexts/FeatureContext';
import { Navigate } from 'react-router-dom';

interface FeatureGateProps {
  feature: keyof StoreFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature, isLoaded } = useFeatures();

  if (!isLoaded) return null;

  if (!hasFeature(feature)) {
    if (fallback) return <>{fallback}</>;
    return <FeatureUnavailablePage />;
  }

  return <>{children}</>;
}

function FeatureUnavailablePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h1 className="text-xl font-bold mb-2">Recurso indisponível</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Este recurso não está disponível no seu plano atual. Entre em contato com o suporte para mais informações.
      </p>
      <a
        href="/admin/dashboard"
        className="text-primary font-medium hover:underline"
      >
        Voltar ao painel
      </a>
    </div>
  );
}

/** Route-level gate that redirects */
export function FeatureRouteGate({ feature, children }: { feature: keyof StoreFeatures; children: React.ReactNode }) {
  const { hasFeature, isLoaded } = useFeatures();

  if (!isLoaded) return null;
  if (!hasFeature(feature)) return <Navigate to="/admin/dashboard" replace />;

  return <>{children}</>;
}
