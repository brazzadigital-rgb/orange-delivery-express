import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldCheck, Trash2, UserPlus, Search } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useStoreId } from '@/contexts/TenantContext';
import { usePlanEntitlements } from '@/hooks/usePlanEntitlements';
import { PlanLimitAlert } from '@/components/admin/PlanLimitAlert';

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export default function AdminsPage() {
  const queryClient = useQueryClient();
  const storeId = useStoreId();
  const [searchEmail, setSearchEmail] = useState('');
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);
  const { isLimitReached, usage, entitlements } = usePlanEntitlements();
  const userLimitReached = isLimitReached('users');

  // Fetch store admins from store_users table
  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['store-admin-users-list', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_users')
        .select('id, user_id, role, created_at, profiles (id, name, email, phone)')
        .eq('store_id', storeId)
        .in('role', ['owner' as any, 'admin' as any, 'staff' as any]);
      if (error) throw error;
      return (data || []) as unknown as AdminUser[];
    },
  });

  // Search user by email
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['search-user-for-store-admin', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone')
        .ilike('email', `%${searchEmail}%`)
        .limit(5);
      if (error) throw error;
      // Filter out users already in the store admins list
      const adminIds = admins.map(a => a.user_id);
      return (data || []).filter(u => !adminIds.includes(u.id));
    },
    enabled: searchEmail.length >= 3,
  });

  // Promote to admin in store_users
  const promoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('store_users')
        .upsert(
          { user_id: userId, store_id: storeId, role: 'admin' as any },
          { onConflict: 'store_id,user_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-admin-users-list'] });
      setSearchEmail('');
      toast.success('Usuário promovido a administrador da loja!');
    },
    onError: () => toast.error('Erro ao promover usuário'),
  });

  // Remove admin from store_users
  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('store_users')
        .delete()
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .in('role', ['admin' as any, 'staff' as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-admin-users-list'] });
      setRemoveTarget(null);
      toast.success('Permissão de admin removida');
    },
    onError: () => toast.error('Erro ao remover admin'),
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Dono';
      case 'admin': return 'Admin';
      case 'staff': return 'Equipe';
      default: return role;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold">Administradores</h1>
      </div>

      {userLimitReached && (
        <PlanLimitAlert
          limitType="users"
          current={usage?.users_count ?? 0}
          max={entitlements?.max_users ?? 0}
        />
      )}

      {/* Add admin section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Adicionar Administrador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por e-mail do usuário..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-10"
            />
          </div>

          {isSearching && <p className="text-sm text-muted-foreground">Buscando...</p>}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium">{user.name || 'Sem nome'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                   <Button
                    size="sm"
                    onClick={() => {
                      if (userLimitReached) {
                        toast.error('Limite de usuários do plano atingido. Faça upgrade.');
                        return;
                      }
                      promoteMutation.mutate(user.id);
                    }}
                    disabled={promoteMutation.isPending || userLimitReached}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Tornar Admin
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchEmail.length >= 3 && !isSearching && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado ou já é admin.</p>
          )}
        </CardContent>
      </Card>

      {/* Current admins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Administradores Atuais</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : admins.length === 0 ? (
            <p className="text-muted-foreground">Nenhum administrador encontrado.</p>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{admin.profiles?.name || 'Sem nome'}</p>
                      <p className="text-sm text-muted-foreground">{admin.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getRoleLabel(admin.role)}</Badge>
                    {admin.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRemoveTarget(admin)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm remove dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.profiles?.name || removeTarget?.profiles?.email} perderá acesso ao painel administrativo da loja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.user_id)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
