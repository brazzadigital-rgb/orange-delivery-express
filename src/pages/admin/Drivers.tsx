import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Truck, Phone, Mail, Search, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import { useDrivers, useDriverDeliveriesToday } from '@/hooks/useDrivers';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { usePlanEntitlements } from '@/hooks/usePlanEntitlements';
import { PlanLimitAlert } from '@/components/admin/PlanLimitAlert';
import { toast } from 'sonner';

function DriverCard({ driver }: { driver: any }) {
  const navigate = useNavigate();
  const { data: deliveriesToday } = useDriverDeliveriesToday(driver.user_id);
  const isOnline = Math.random() > 0.5; // Placeholder - would come from realtime presence

  return (
    <div className="card-premium p-5 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              {driver.profiles?.avatar_url ? (
                <img
                  src={driver.profiles.avatar_url}
                  alt={driver.profiles.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Truck className="w-7 h-7 text-primary" />
              )}
            </div>
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white',
                isOnline ? 'bg-success' : 'bg-muted'
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{driver.profiles?.name || 'Motoboy'}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {driver.profiles?.phone || 'Sem telefone'}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/admin/drivers/${driver.id}`)}>
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/admin/drivers/${driver.id}/edit`)}>
              Editar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{deliveriesToday || 0}</p>
            <p className="text-xs text-muted-foreground">Entregas hoje</p>
          </div>
          <div>
            <p className="text-2xl font-bold">4.8</p>
            <p className="text-xs text-muted-foreground">Avaliação</p>
          </div>
          <div>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                isOnline ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              )}
            >
              {isOnline ? (
                <>
                  <UserCheck className="w-3 h-3" /> Online
                </>
              ) : (
                <>
                  <UserX className="w-3 h-3" /> Offline
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDrivers() {
  const { data: drivers, isLoading } = useDrivers();
  const [search, setSearch] = useState('');

  const { entitlements, usage, isLimitReached } = usePlanEntitlements();
  const driverLimitReached = isLimitReached('drivers');

  const filteredDrivers = drivers?.filter((driver) => {
    const name = driver.profiles?.name?.toLowerCase() || '';
    const phone = driver.profiles?.phone || '';
    const query = search.toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

  const handleNewDriver = (e: React.MouseEvent) => {
    if (driverLimitReached) {
      e.preventDefault();
      toast.error('Limite de motoboys atingido. Faça upgrade do seu plano.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Motoboys</h1>
          <p className="text-muted-foreground">Gerencie sua equipe de entregadores</p>
        </div>
        <Link to="/admin/drivers/new" onClick={handleNewDriver}>
          <Button className="btn-primary" disabled={driverLimitReached}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Motoboy
          </Button>
        </Link>
      </div>

      {driverLimitReached && usage && entitlements?.max_drivers !== null && entitlements?.max_drivers !== undefined && (
        <div className="mb-6">
          <PlanLimitAlert
            limitType="drivers"
            current={usage.drivers_count}
            max={entitlements.max_drivers}
            planName={entitlements.plan_name}
          />
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{drivers?.length || 0}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Online agora</p>
          <p className="text-2xl font-bold text-success">{Math.floor((drivers?.length || 0) * 0.6)}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Em entrega</p>
          <p className="text-2xl font-bold text-primary">{Math.floor((drivers?.length || 0) * 0.3)}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Entregas hoje</p>
          <p className="text-2xl font-bold">42</p>
        </div>
      </div>

      {/* Drivers Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : filteredDrivers && filteredDrivers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => (
            <DriverCard key={driver.id} driver={driver} />
          ))}
        </div>
      ) : (
        <div className="card-premium p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Truck className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">
            {search ? 'Nenhum motoboy encontrado' : 'Nenhum motoboy cadastrado'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'Tente buscar por outro termo' : 'Cadastre seu primeiro motoboy para começar'}
          </p>
          {!search && (
            <Link to="/admin/drivers/new">
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Motoboy
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
