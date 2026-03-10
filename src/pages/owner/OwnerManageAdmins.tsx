import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, UserPlus, ShieldCheck, Trash2, Loader2 } from 'lucide-react';

interface FoundUser {
  id: string;
  name: string | null;
  email: string | null;
  storeRole: string | null;
  storeId: string | null;
  storeName: string | null;
}

interface AdminEntry {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
  storeName: string | null;
  storeId: string;
}

export default function OwnerManageAdmins() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Admins list
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsLoaded, setAdminsLoaded] = useState(false);

  const loadAdmins = async () => {
    setAdminsLoading(true);
    try {
      // Get all store_users with admin role (store-level admins assigned by owner)
      const { data: storeAdmins, error } = await supabase
        .from('store_users')
        .select('id, user_id, role, store_id, stores!store_users_store_id_stores_fkey(name), profiles!store_users_user_id_profiles_fkey(id, name, email)')
        .in('role', ['admin' as any, 'staff' as any, 'owner' as any]);

      if (error) throw error;

      setAdmins(
        (storeAdmins || []).map((sa: any) => ({
          id: sa.id,
          userId: sa.user_id,
          name: sa.profiles?.name || null,
          email: sa.profiles?.email || null,
          role: sa.role,
          storeName: sa.stores?.name || null,
          storeId: sa.store_id,
        }))
      );
      setAdminsLoaded(true);
    } catch (err: any) {
      toast.error('Erro ao carregar admins');
    } finally {
      setAdminsLoading(false);
    }
  };

  // Load admins on mount
  useEffect(() => {
    loadAdmins();
  }, []);

  const handleSearch = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setFoundUser(null);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        toast.error('Usuário não encontrado com esse email');
        return;
      }

      // Find the user's store via store_subscriptions (new SSOT)
      const { data: subscription } = await supabase
        .from('store_subscriptions')
        .select('store_id, stores!inner(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      // Match by checking if user is in store_users for any of these stores
      const { data: userStores } = await supabase
        .from('store_users')
        .select('store_id, stores!store_users_store_id_stores_fkey(name)')
        .eq('user_id', profile.id);

      const matchedStore = userStores?.[0];

      // Check if user already has a store_users admin role
      const { data: existingStoreRole } = await supabase
        .from('store_users')
        .select('role, store_id')
        .eq('user_id', profile.id)
        .in('role', ['admin' as any, 'owner' as any])
        .maybeSingle();

      setFoundUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        storeRole: existingStoreRole?.role || null,
        storeId: matchedStore?.store_id || existingStoreRole?.store_id || null,
        storeName: (matchedStore as any)?.stores?.name || null,
      });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao buscar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAdmin = async () => {
    if (!foundUser) return;

    if (!foundUser.storeId) {
      toast.error('Usuário não possui assinatura ativa vinculada a uma loja. Crie uma assinatura primeiro.');
      return;
    }

    setAssigning(true);

    try {
      // Add user to store_users as admin for their store
      const { error } = await supabase
        .from('store_users')
        .upsert(
          { 
            user_id: foundUser.id, 
            store_id: foundUser.storeId, 
            role: 'admin' as any 
          },
          { onConflict: 'store_id,user_id' }
        );

      if (error) throw error;

      toast.success(`${foundUser.name || foundUser.email} agora é Admin da loja!`);
      setFoundUser({ ...foundUser, storeRole: 'admin' });
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atribuir papel');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAdmin = async (entry: AdminEntry) => {
    setRemoving(true);
    try {
      // Remove specific store_users entry by id
      const { error } = await supabase
        .from('store_users')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      toast.success('Papel admin removido da loja');
      loadAdmins();
      if (foundUser?.id === entry.userId) {
        setFoundUser({ ...foundUser, storeRole: null });
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover papel');
    } finally {
      setRemoving(false);
    }
  };

  const isAlreadyAdmin = foundUser?.storeRole === 'admin' || foundUser?.storeRole === 'owner';

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Admins das Lojas</h1>
        <p className="text-muted-foreground text-sm">
          Atribua o papel de administrador ao cliente que comprou o sistema, vinculando à loja da assinatura
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar por email</CardTitle>
          <CardDescription>
            Digite o email do usuário cadastrado para atribuir o papel admin na loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !email.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </Button>
          </div>

          {foundUser && (
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{foundUser.name || '—'}</p>
                    <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                    {foundUser.storeName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Loja: <span className="font-medium">{foundUser.storeName}</span>
                      </p>
                    )}
                    <div className="mt-1 flex gap-1">
                      {isAlreadyAdmin ? (
                        <Badge variant="default">{foundUser.storeRole}</Badge>
                      ) : (
                        <Badge variant="secondary">cliente</Badge>
                      )}
                    </div>
                  </div>
                  {isAlreadyAdmin ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Já é {foundUser.storeRole === 'owner' ? 'Dono' : 'Admin'}
                    </Badge>
                  ) : (
                    <Button onClick={handleAssignAdmin} disabled={assigning}>
                      {assigning ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Tornar Admin
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Current Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admins atuais das lojas</CardTitle>
        </CardHeader>
        <CardContent>
          {adminsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Nenhum admin atribuído</p>
          ) : (
            <div className="space-y-3">
              {(() => {
                const grouped = admins.reduce<Record<string, AdminEntry[]>>((acc, admin) => {
                  if (!acc[admin.userId]) acc[admin.userId] = [];
                  acc[admin.userId].push(admin);
                  return acc;
                }, {});
                return Object.entries(grouped).map(([userId, entries]) => {
                  const first = entries[0];
                  return (
                    <div key={userId} className="p-3 rounded-lg border space-y-2">
                      <div>
                        <p className="font-medium">{first.name || '—'}</p>
                        <p className="text-sm text-muted-foreground">{first.email}</p>
                      </div>
                      <div className="space-y-1 pl-1">
                        {entries.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{entry.storeName || '—'}</span>
                              <Badge variant="secondary" className="text-xs">{entry.role}</Badge>
                            </div>
                            {(entry.role === 'admin' || entry.role === 'staff' || entry.role === 'owner') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAdmin(entry)}
                                disabled={removing}
                                className="text-destructive hover:text-destructive h-7 w-7 p-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
