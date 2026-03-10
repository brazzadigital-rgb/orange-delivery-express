import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Clears all client-side state to prevent cross-tenant data leakage.
 * Called on sign-out and tenant switch.
 */
export function clearClientState() {
  // Tenant override
  localStorage.removeItem('tenant_store_override');
  // App config cache
  localStorage.removeItem('app_config_version');
  localStorage.removeItem('app_name_cached');
  localStorage.removeItem('app_logo_cached');
  localStorage.removeItem('theme_color_cached');
  // Cart
  localStorage.removeItem('cart-storage');
  // Checkout
  localStorage.removeItem('checkout-storage');
  // PWA
  localStorage.removeItem('pwa_install_dismissed');
  localStorage.removeItem('pending_address');
  // Audio
  localStorage.removeItem('audio_unlocked');
  // Admin prefs
  localStorage.removeItem('admin_sound_enabled');
  localStorage.removeItem('admin_sound_volume');
  // Reset CSS variables to defaults to avoid stale brand colors
  const root = document.documentElement;
  root.style.removeProperty('--primary');
  root.style.removeProperty('--ring');
  root.style.removeProperty('--gradient-end');
  root.style.removeProperty('--accent-foreground');
  root.style.removeProperty('--background');
  root.style.removeProperty('--card');
  root.style.removeProperty('--popover');
  root.style.removeProperty('--foreground');
  root.style.removeProperty('--gradient-start');
  root.style.removeProperty('--gradient-end-hex');
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

async function migratePendingAddress(user: User, invalidateAddresses?: () => void): Promise<void> {
  const userId = user.id;
  
  // First try localStorage
  let addressData = null;
  const pendingAddressRaw = localStorage.getItem('pending_address');
  
  if (pendingAddressRaw) {
    console.log('[Auth] Found pending address in localStorage');
    try {
      addressData = JSON.parse(pendingAddressRaw);
    } catch (e) {
      console.error('[Auth] Error parsing localStorage address:', e);
    }
  }
  
  // If not in localStorage, try user_metadata (for cross-device signup)
  if (!addressData && user.user_metadata?.pending_address) {
    console.log('[Auth] Found pending address in user_metadata');
    addressData = user.user_metadata.pending_address;
  }
  
  if (!addressData) {
    console.log('[Auth] No pending address found');
    return;
  }

  console.log('[Auth] Attempting to migrate address:', addressData);

  try {
    // Check if user already has addresses
    const { data: existingAddresses, error: checkError } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', userId);

    if (checkError) {
      console.error('[Auth] Error checking existing addresses:', checkError);
      return;
    }

    if (existingAddresses && existingAddresses.length > 0) {
      console.log('[Auth] User already has addresses, skipping migration');
      localStorage.removeItem('pending_address');
      // Clear pending_address from user_metadata
      await supabase.auth.updateUser({
        data: { pending_address: null }
      });
      return;
    }

    // Create the address
    const { data: newAddress, error } = await supabase
      .from('addresses')
      .insert({
        user_id: userId,
        label: addressData.label || 'Casa',
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement || null,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        zip: addressData.zip,
        is_default: true,
        lat: null,
        lng: null,
      })
      .select()
      .single();

    if (!error && newAddress) {
      console.log('[Auth] Successfully created address:', newAddress.id);
      localStorage.removeItem('pending_address');
      
      // Clear pending_address from user_metadata
      await supabase.auth.updateUser({
        data: { pending_address: null }
      });
      
      // Invalidate addresses query to force refetch
      if (invalidateAddresses) {
        invalidateAddresses();
      }
    } else {
      console.error('[Auth] Error creating address:', error);
    }
  } catch (error) {
    console.error('[Auth] Error migrating pending address:', error);
    localStorage.removeItem('pending_address');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const invalidateAddresses = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['addresses'] });
  }, [queryClient]);

  useEffect(() => {
    let isMounted = true;

    // ============================================================
    // CRITICAL: Set up listener BEFORE calling getSession()
    // This prevents race conditions where auth state changes 
    // happen between getSession() and subscription setup
    // ============================================================
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;

        console.log('[Auth] Auth state changed:', event, newSession?.user?.id);
        
        // Always update session and user state
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Handle migration on sign in (fire-and-forget)
        if (event === 'SIGNED_IN' && newSession?.user) {
          setTimeout(() => {
            void migratePendingAddress(newSession.user, invalidateAddresses);
          }, 500);
        }

        // Handle token refresh events - ensure session stays active
        if (event === 'TOKEN_REFRESHED' && newSession) {
          console.log('[Auth] Token refreshed successfully');
        }

        // Clear state on sign out + purge all cached data
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          // Purge all TanStack Query cache to prevent stale tenant data
          queryClient.clear();
          // Clear tenant-related localStorage keys
          clearClientState();
        }
      }
    );

    // ============================================================
    // INITIAL LOAD: Get session after listener is set up
    // Only set loading=false after initial session check completes
    // ============================================================
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
          }
          return;
        }

        if (!isMounted) return;

        console.log('[Auth] Initial session:', initialSession?.user?.id ?? 'none');
        
        // Set initial state
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Migrate pending address if user is logged in
        if (initialSession?.user) {
          await migratePendingAddress(initialSession.user, invalidateAddresses);
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        // CRITICAL: Only set loading=false after all async operations complete
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Start initialization
    void initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [invalidateAddresses]);

  const signOut = async () => {
    try {
      // Clear all cached data BEFORE signing out
      queryClient.clear();
      clearClientState();
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('[Auth] Error signing out:', error);
      }
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('[Auth] Error during sign out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
