import { ReactNode, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export type AppRole = 'customer' | 'admin' | 'staff' | 'driver' | 'owner' | 'waiter';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
  fallbackTo?: string;
  /** When true, validates that the user belongs to the active store (TenantContext) */
  requireStoreAccess?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['customer', 'admin', 'staff', 'driver', 'owner', 'waiter'],
  redirectTo = '/auth/login',
  fallbackTo,
  requireStoreAccess = false,
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { storeId, isLoading: tenantLoading } = useTenant();
  const location = useLocation();
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [allUserRoles, setAllUserRoles] = useState<Set<string>>(new Set());
  const globalRolesRef = useRef<Set<string>>(new Set());
  const [roleLoading, setRoleLoading] = useState(true);
  const [hasStoreAccess, setHasStoreAccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchUserRoles() {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        const combinedRoles = new Set<string>();
        let hasGlobalOwnerRole = false;

        // Fetch global roles (user_roles table) — SaaS-level
        const { data: globalRolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const globalRoles = new Set<string>();
        if (globalRolesData) {
          globalRolesData.forEach(r => {
            combinedRoles.add(r.role);
            globalRoles.add(r.role);
            if (r.role === 'owner') hasGlobalOwnerRole = true;
          });
        }
        globalRolesRef.current = globalRoles;

        // Fetch store-level roles (store_users table)
        // But skip mapping for users who have a global 'owner' role
        if (!hasGlobalOwnerRole) {
          const { data: storeRolesData } = await supabase
            .from('store_users')
            .select('role')
            .eq('user_id', user.id);

          if (storeRolesData) {
            storeRolesData.forEach(r => {
              if (r.role === 'owner') {
                combinedRoles.add('admin');
                combinedRoles.add('staff');
              } else {
                combinedRoles.add(r.role);
              }
            });
          }

          // Also check owner_email — store owners who aren't in store_users yet
          if (!combinedRoles.has('admin') && user.email) {
            const { data: ownedStore } = await supabase
              .from('stores')
              .select('id')
              .eq('owner_email', user.email)
              .limit(1)
              .maybeSingle();

            if (ownedStore) {
              combinedRoles.add('admin');
              combinedRoles.add('staff');
            }
          }
        }

        if (combinedRoles.size > 0) {
          const priority: AppRole[] = ['owner', 'admin', 'staff', 'waiter', 'driver', 'customer'];
          const bestRole = priority.find(r => combinedRoles.has(r)) || 'customer';
          setUserRole(bestRole);
          setAllUserRoles(combinedRoles);
        } else {
          setUserRole('customer');
          setAllUserRoles(new Set(['customer']));
        }
      } catch (err) {
        console.error('Error in fetchUserRoles:', err);
        setUserRole('customer');
        setAllUserRoles(new Set(['customer']));
      } finally {
        setRoleLoading(false);
      }
    }

    fetchUserRoles();
  }, [user]);

  // Validate store access when requireStoreAccess is enabled
  useEffect(() => {
    let cancelled = false;

    async function checkStoreAccess() {
      if (!requireStoreAccess || !user || !storeId || tenantLoading || roleLoading) {
        return;
      }

      // Global owners (SaaS super admins) have access to all stores
      if (allUserRoles.has('owner')) {
        if (!cancelled) setHasStoreAccess(true);
        return;
      }

      try {
        // Use SECURITY DEFINER RPC to bypass RLS — checks store_users + global admin
        const { data: hasAccess, error } = await supabase.rpc('has_store_access', {
          p_user_id: user.id,
          p_store_id: storeId,
        });

        if (cancelled) return;

        if (error) {
          console.error('Error in has_store_access RPC:', error);
          // Fallback: check owner_email directly
          const { data: ownerMatch } = await supabase
            .from('stores')
            .select('id')
            .eq('id', storeId)
            .eq('owner_email', user.email ?? '')
            .maybeSingle();

          if (!cancelled) setHasStoreAccess(!!ownerMatch);
          return;
        }

        setHasStoreAccess(!!hasAccess);
      } catch (err) {
        console.error('Error checking store access:', err);
        if (!cancelled) setHasStoreAccess(false);
      }
    }

    checkStoreAccess();

    return () => { cancelled = true; };
  }, [requireStoreAccess, user, storeId, tenantLoading, roleLoading, allUserRoles]);

  // Safety timeout: if still loading after 8s, assume access is granted to avoid infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (hasStoreAccess === null && requireStoreAccess) {
        console.warn('[ProtectedRoute] Store access check timed out, granting access');
        setHasStoreAccess(true);
      }
    }, 8000);
    return () => clearTimeout(timeout);
  }, [hasStoreAccess, requireStoreAccess]);

  // Show loading while checking auth, role, and store access
  const isCheckingStoreAccess = requireStoreAccess && hasStoreAccess === null;
  if (authLoading || roleLoading || tenantLoading || isCheckingStoreAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role permission - check if ANY of the user's roles match allowedRoles
  // Global owners (SaaS super admins) can access admin/staff routes on any store subdomain
  // Global admins can also access owner routes (they are platform-level super admins)
  const isGlobalOwner = allUserRoles.has('owner');
  const isGlobalAdmin = allUserRoles.has('admin') && 
    (globalRolesRef.current?.has('admin') ?? false);
  const hasAllowedRole = allowedRoles.some(role => allUserRoles.has(role)) || 
    (isGlobalOwner && allowedRoles.some(r => ['admin', 'staff'].includes(r))) ||
    (isGlobalAdmin && allowedRoles.some(r => ['owner', 'admin', 'staff'].includes(r)));
  
  if (allUserRoles.size > 0 && !hasAllowedRole) {
    if (isGlobalOwner || isGlobalAdmin) {
      const host = window.location.hostname.split(':')[0];
      const PORTAL_BASE_DOMAINS = ['deliverylitoral.com.br'];
      const isPortal = host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host) || 
        host.endsWith('.lovable.app') || host.endsWith('.lovableproject.com') ||
        PORTAL_BASE_DOMAINS.some(d => host === d || host === `www.${d}`);
      if (isPortal) {
        return <Navigate to="/owner" replace />;
      }
    }
    return <Navigate to={fallbackTo || "/minha-loja"} replace />;
  }

  // Check store-level access
  if (requireStoreAccess && hasStoreAccess === false) {
    return <Navigate to="/minha-loja" replace />;
  }

  return <>{children}</>;
}
