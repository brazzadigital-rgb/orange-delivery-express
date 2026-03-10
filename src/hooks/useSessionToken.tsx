import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SessionToken {
  id: string;
  table_session_id: string;
  token: string;
  status: string;
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  is_verified: boolean;
  device_fingerprint: string | null;
  ip_hash: string | null;
}

/**
 * Validate a session token and return its data + session + table info
 */
export function useValidateSessionToken(token: string) {
  return useQuery({
    queryKey: ['session-token', token],
    queryFn: async () => {
      // Find the token
      const { data: tokenData, error } = await supabase
        .from('table_session_tokens' as any)
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (error) throw error;
      if (!tokenData) return { valid: false, reason: 'not_found' as const, token: null, session: null, table: null };

      const tk = tokenData as any as SessionToken;

      // Check token status
      if (tk.status !== 'active') {
        return { valid: false, reason: 'revoked' as const, token: tk, session: null, table: null };
      }

      // Check expiration
      if (tk.expires_at && new Date(tk.expires_at) < new Date()) {
        return { valid: false, reason: 'expired' as const, token: tk, session: null, table: null };
      }

      // Get session
      const { data: session } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('id', tk.table_session_id)
        .maybeSingle();

      if (!session || session.status !== 'open') {
        return { valid: false, reason: 'session_closed' as const, token: tk, session: null, table: null };
      }

      // Get table
      const { data: table } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('id', session.table_id)
        .eq('is_active', true)
        .maybeSingle();

      if (!table) {
        return { valid: false, reason: 'table_inactive' as const, token: tk, session, table: null };
      }

      // Update last_used_at
      await supabase
        .from('table_session_tokens' as any)
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', tk.id);

      return { valid: true, reason: 'ok' as const, token: tk, session, table };
    },
    enabled: !!token,
    refetchInterval: 30000, // recheck every 30s
  });
}

/**
 * Generate a new session token for a table session
 */
export function useCreateSessionToken() {
  return useMutation({
    mutationFn: async (params: { sessionId: string; expirationMinutes?: number }) => {
      const expiresAt = params.expirationMinutes
        ? new Date(Date.now() + params.expirationMinutes * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('table_session_tokens' as any)
        .insert({
          table_session_id: params.sessionId,
          status: 'active',
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;
      return data as any as SessionToken;
    },
  });
}

/**
 * Verify token with PIN
 */
export function useVerifyTokenPin() {
  return useMutation({
    mutationFn: async (params: { tokenId: string; tableId: string; pin: string }) => {
      // Check PIN against table
      const { data: table } = await supabase
        .from('restaurant_tables')
        .select('table_pin')
        .eq('id', params.tableId)
        .single();

      if (!table || (table as any).table_pin !== params.pin) {
        throw new Error('PIN incorreto');
      }

      // Mark token as verified
      await supabase
        .from('table_session_tokens' as any)
        .update({ is_verified: true })
        .eq('id', params.tokenId);

      return true;
    },
  });
}

/**
 * Fetch tokens for a session (admin)
 */
export function useSessionTokens(sessionId: string) {
  return useQuery({
    queryKey: ['session-tokens', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_session_tokens' as any)
        .select('*')
        .eq('table_session_id', sessionId)
        .order('issued_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as any as SessionToken[];
    },
    enabled: !!sessionId,
  });
}

/**
 * Fetch table token settings from store_settings
 */
export function useTableTokenSettings() {
  return useQuery({
    queryKey: ['table-token-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('token_expiration_minutes, require_table_pin')
        .limit(1)
        .maybeSingle();
      return {
        tokenExpirationMinutes: (data as any)?.token_expiration_minutes ?? 60,
        requireTablePin: (data as any)?.require_table_pin ?? false,
      };
    },
  });
}
