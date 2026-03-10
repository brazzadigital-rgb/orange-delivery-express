import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_STORE_ID } from '@/lib/constants';

// ============================================================================
// TENANT CONTEXT - Resolves store_id dynamically by hostname
// ============================================================================
// Priority:
// 1. Custom domain match (stores.custom_domain)
// 2. Subdomain slug match (slug.domain.com → stores.slug)
// 3. Fallback to DEFAULT_STORE_ID (single-store / dev mode)
// ============================================================================

interface TenantStore {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  store_type: string | null;
}

interface TenantContextValue {
  storeId: string;
  store: TenantStore | null;
  isLoading: boolean;
  isResolved: boolean;
  error: Error | null;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

const TENANT_OVERRIDE_KEY = 'tenant_store_override';

/** Set a temporary tenant override (used after onboarding in dev/preview) */
export function setTenantOverride(storeId: string) {
  localStorage.setItem(TENANT_OVERRIDE_KEY, storeId);
}

/** Clear the tenant override */
export function clearTenantOverride() {
  localStorage.removeItem(TENANT_OVERRIDE_KEY);
}

// Known portal/app hostnames that are NOT tenant subdomains
const PORTAL_HOSTS = ['app', 'www', 'admin', 'api'];

// Known base domains for the SaaS portal
const PORTAL_BASE_DOMAINS = ['deliverylitoral.com.br'];

function extractSlugFromHostname(hostname: string): string | null {
  // Remove port for local dev
  const host = hostname.split(':')[0];

  // localhost or IP → no slug
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }

  // Preview/lovable domains → no slug
  if (host.endsWith('.lovable.app') || host.endsWith('.lovableproject.com')) {
    return null;
  }

  // Check if host is a known portal base domain (e.g. deliverylitoral.com.br)
  if (PORTAL_BASE_DOMAINS.some(d => host === d || host === `www.${d}`)) {
    return null;
  }

  // Check for subdomain on known portal base domains
  // e.g. slug.deliverylitoral.com.br → slug
  for (const baseDomain of PORTAL_BASE_DOMAINS) {
    const suffix = `.${baseDomain}`;
    if (host.endsWith(suffix)) {
      const subdomain = host.slice(0, -suffix.length);
      if (subdomain && !subdomain.includes('.') && !PORTAL_HOSTS.includes(subdomain)) {
        return subdomain;
      }
      return null;
    }
  }

  // Generic fallback: simple 3-part domain check (e.g. slug.example.com)
  const parts = host.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (!PORTAL_HOSTS.includes(subdomain)) {
      return subdomain;
    }
  }

  return null;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<TenantStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const resolveTenant = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const hostname = window.location.hostname;
      const fullHost = hostname.split(':')[0]; // strip port

      // 1. Check localStorage override FIRST (set by store selector / onboarding)
      // This takes priority so that selecting a store from /minha-loja works
      const overrideId = localStorage.getItem(TENANT_OVERRIDE_KEY);
      if (overrideId) {
        const { data: overrideMatch } = await supabase
          .from('stores')
          .select('id, name, slug, custom_domain, store_type')
          .eq('id', overrideId)
          .maybeSingle();

        if (overrideMatch) {
          console.log('[Tenant] Resolved by override:', overrideMatch.slug);
          setStore(overrideMatch as TenantStore);
          return;
        } else {
          // Invalid override, clear it
          localStorage.removeItem(TENANT_OVERRIDE_KEY);
        }
      }

      // 2. Try custom domain match (exact match on full hostname)
      if (fullHost !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(fullHost)) {
        const { data: domainMatch } = await supabase
          .from('stores')
          .select('id, name, slug, custom_domain, store_type')
          .eq('custom_domain', fullHost)
          .maybeSingle();

        if (domainMatch) {
          console.log('[Tenant] Resolved by custom_domain:', domainMatch.slug);
          setStore(domainMatch as TenantStore);
          return;
        }
      }

      // 3. Try subdomain slug match
      const slug = extractSlugFromHostname(hostname);
      if (slug) {
        const { data: slugMatch } = await supabase
          .from('stores')
          .select('id, name, slug, custom_domain, store_type')
          .eq('slug', slug)
          .maybeSingle();

        if (slugMatch) {
          console.log('[Tenant] Resolved by slug:', slugMatch.slug);
          setStore(slugMatch as TenantStore);
          return;
        }
      }

      // 4. Fallback to default store
      const { data: fallback } = await supabase
        .from('stores')
        .select('id, name, slug, custom_domain, store_type')
        .eq('id', DEFAULT_STORE_ID)
        .maybeSingle();

      if (fallback) {
        console.log('[Tenant] Fallback to default store:', fallback.slug);
        setStore(fallback as TenantStore);
      } else {
        throw new Error('No store found');
      }
    } catch (err) {
      console.error('[Tenant] Failed to resolve:', err);
      setError(err as Error);
      // Minimal fallback so the app doesn't crash
      setStore({ id: DEFAULT_STORE_ID, name: '', slug: '', custom_domain: null, store_type: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    resolveTenant();
  }, [resolveTenant]);

  const storeId = store?.id || DEFAULT_STORE_ID;

  return (
    <TenantContext.Provider value={{ storeId, store, isLoading, isResolved: !isLoading && store !== null, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

/**
 * Shortcut to get just the storeId (most common use case).
 * Returns the resolved storeId or DEFAULT_STORE_ID during loading.
 */
export function useStoreId(): string {
  return useTenant().storeId;
}
