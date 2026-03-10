import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

interface AuditLogParams {
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export function useAuditLog() {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();

  return useMutation({
    mutationFn: async ({ action, entityType, entityId, metadata }: AuditLogParams) => {
      if (!user) return;

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          actor_role: userRole || 'customer',
          action,
          entity_type: entityType,
          entity_id: entityId,
          metadata: metadata || {},
        });

      if (error) {
        console.error('Error creating audit log:', error);
        throw error;
      }
    },
  });
}
