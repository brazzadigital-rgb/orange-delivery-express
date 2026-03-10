import { useState } from 'react';
import { UserPlus, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  useWaiters, useCreateWaiter, useDeleteWaiter,
  useRestaurantTables, useWaiterAssignments, useCreateWaiterAssignment, useDeleteWaiterAssignment
} from '@/hooks/useTableOrders';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { usePlanEntitlements } from '@/hooks/usePlanEntitlements';
import { PlanLimitAlert } from '@/components/admin/PlanLimitAlert';
import { toast } from 'sonner';

export default function AdminWaiters() {
  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [assignWaiter, setAssignWaiter] = useState('');
  const [assignTable, setAssignTable] = useState('');
  const [assignArea, setAssignArea] = useState('');

  const { data: waiters, isLoading } = useWaiters();
  const { isLimitReached, usage, entitlements } = usePlanEntitlements();
  const waiterLimitReached = isLimitReached('users');
  const { data: tables } = useRestaurantTables();
  const { data: assignments } = useWaiterAssignments();
  const { data: customers } = useQuery({
    queryKey: ['admin-customers-lazy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name')
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: addOpen,
  });
  const createWaiter = useCreateWaiter();
  const deleteWaiter = useDeleteWaiter();
  const createAssignment = useCreateWaiterAssignment();
  const deleteAssignment = useDeleteWaiterAssignment();


  const waiterUserIds = new Set(waiters?.map(w => w.user_id) || []);
  const filteredCustomers = customers?.filter(c =>
    !waiterUserIds.has(c.id) &&
    (c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const handleAddWaiter = async () => {
    if (!selectedUser) return;
    await createWaiter.mutateAsync({
      user_id: selectedUser.id,
      display_name: selectedUser.name || selectedUser.email || 'Garçom',
    });
    setAddOpen(false);
    setSelectedUser(null);
    setSearch('');
  };

  const handleAssign = async () => {
    if (!assignWaiter) return;
    await createAssignment.mutateAsync({
      waiter_user_id: assignWaiter,
      table_id: assignTable || undefined,
      area: assignArea || undefined,
    });
    setAssignOpen(false);
    setAssignWaiter('');
    setAssignTable('');
    setAssignArea('');
  };

  if (isLoading) return <div className="p-6"><LoadingSpinner /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Garçons</h1>
          <p className="text-muted-foreground">Gerencie garçons e atribuições de mesas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAssignOpen(true)}>
            <MapPin className="w-4 h-4 mr-2" />
            Atribuir Mesa
          </Button>
          <Button
            onClick={() => {
              if (waiterLimitReached) {
                toast.error('Limite de usuários do plano atingido. Faça upgrade para adicionar mais.');
                return;
              }
              setAddOpen(true);
            }}
            disabled={waiterLimitReached}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Garçom
          </Button>
        </div>
      </div>

      {waiterLimitReached && (
        <PlanLimitAlert
          limitType="users"
          current={usage?.users_count ?? 0}
          max={entitlements?.max_users ?? 0}
        />
      )}

      {/* Waiters List */}
      <div className="space-y-3 mb-8">
        <h2 className="font-semibold text-lg">Garçons Ativos</h2>
        {waiters?.map(w => (
          <div key={w.user_id} className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{w.display_name}</p>
              <p className="text-sm text-muted-foreground">{(w as any).profiles?.email}</p>
            </div>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteWaiter.mutate(w.user_id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {(!waiters || waiters.length === 0) && (
          <p className="text-muted-foreground text-sm py-4 text-center">Nenhum garçom cadastrado</p>
        )}
      </div>

      {/* Assignments */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Atribuições</h2>
        {assignments?.map(a => (
          <div key={a.id} className="card-premium p-3 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{(a as any).waiters?.display_name}</span>
              {(a as any).restaurant_tables && (
                <span className="ml-2 text-muted-foreground">→ Mesa {(a as any).restaurant_tables.number}</span>
              )}
              {(a as any).area && <span className="ml-2 text-muted-foreground">→ {(a as any).area}</span>}
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAssignment.mutate(a.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {(!assignments || assignments.length === 0) && (
          <p className="text-muted-foreground text-sm py-4 text-center">Nenhuma atribuição</p>
        )}
      </div>

      {/* Add Waiter Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Garçom</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Buscar usuário</Label>
              <Input placeholder="Nome ou email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredCustomers.slice(0, 20).map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedUser(c)}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedUser?.id === c.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
                >
                  <p className="font-medium">{c.name || 'Sem nome'}</p>
                  <p className="text-sm text-muted-foreground">{c.email}</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddWaiter} disabled={!selectedUser || createWaiter.isPending}>
              Transformar em Garçom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atribuir Garçom a Mesa/Área</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Garçom</Label>
              <Select value={assignWaiter} onValueChange={setAssignWaiter}>
                <SelectTrigger><SelectValue placeholder="Selecionar garçom" /></SelectTrigger>
                <SelectContent>
                  {waiters?.map(w => (
                    <SelectItem key={w.user_id} value={w.user_id}>{w.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mesa (opcional)</Label>
              <Select value={assignTable} onValueChange={setAssignTable}>
                <SelectTrigger><SelectValue placeholder="Selecionar mesa" /></SelectTrigger>
                <SelectContent>
                  {tables?.map(t => (
                    <SelectItem key={t.id} value={t.id}>Mesa {t.number}{t.name ? ` - ${t.name}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Área (opcional)</Label>
              <Input value={assignArea} onChange={e => setAssignArea(e.target.value)} placeholder="Ex: Salão, Varanda" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={!assignWaiter || createAssignment.isPending}>Atribuir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
