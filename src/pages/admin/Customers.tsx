import { Search, Mail, Phone, MessageCircle, Cake, Gift, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAdminCustomers } from '@/hooks/useAdmin';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Check if today is the customer's birthday
function isBirthdayToday(birthDateStr: string | null | undefined): boolean {
  if (!birthDateStr) return false;
  
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return false;
  
  const birthMonth = parseInt(parts[1], 10);
  const birthDay = parseInt(parts[2], 10);
  
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  
  return todayMonth === birthMonth && todayDay === birthDay;
}

// Format birth date for display
function formatBirthDate(birthDateStr: string | null | undefined): string | null {
  if (!birthDateStr) return null;
  
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return null;
  
  const day = parts[2];
  const month = parts[1];
  
  return `${day}/${month}`;
}

export default function AdminCustomers() {
  const { data: customers, isLoading } = useAdminCustomers();
  const [search, setSearch] = useState('');
  const [showBirthdayOnly, setShowBirthdayOnly] = useState(false);

  // Count birthday customers
  const birthdayCount = useMemo(() => {
    if (!customers) return 0;
    return customers.filter(c => isBirthdayToday((c as any).birth_date)).length;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    let result = customers || [];
    
    // Filter by birthday if enabled
    if (showBirthdayOnly) {
      result = result.filter(c => isBirthdayToday((c as any).birth_date));
    }
    
    // Filter by search
    if (search) {
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.phone?.includes(search)
      );
    }
    
    return result;
  }, [customers, search, showBirthdayOnly]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            {customers?.length || 0} clientes cadastrados
          </p>
        </div>
        
        {/* Birthday Alert Banner */}
        {birthdayCount > 0 && (
          <Button
            variant={showBirthdayOnly ? "default" : "outline"}
            onClick={() => setShowBirthdayOnly(!showBirthdayOnly)}
            className={cn(
              "gap-2 transition-all",
              showBirthdayOnly && "bg-gradient-to-r from-pink-500 to-purple-500 border-0 text-white hover:from-pink-600 hover:to-purple-600"
            )}
          >
            <Cake className="w-4 h-4" />
            <span>{birthdayCount} aniversariante{birthdayCount > 1 ? 's' : ''} hoje!</span>
            <Gift className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 input-modern"
          />
        </div>
        
        {showBirthdayOnly && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowBirthdayOnly(false)}
            className="text-muted-foreground"
          >
            <Filter className="w-4 h-4 mr-2" />
            Limpar filtro
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="card-premium overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Aniversário</th>
                <th>Cadastro</th>
                <th className="w-16 text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers?.map((customer) => {
                const customerAny = customer as any;
                const hasBirthday = isBirthdayToday(customerAny.birth_date);
                const birthDateFormatted = formatBirthDate(customerAny.birth_date);
                
                return (
                  <tr 
                    key={customer.id}
                    className={cn(
                      hasBirthday && "bg-gradient-to-r from-pink-500/5 to-purple-500/5"
                    )}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center relative",
                          hasBirthday 
                            ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white" 
                            : "bg-primary/10"
                        )}>
                          {hasBirthday ? (
                            <Cake className="w-5 h-5" />
                          ) : (
                            <span className="text-primary font-semibold">
                              {customer.name?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{customer.name || 'Sem nome'}</span>
                            {hasBirthday && (
                              <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 text-xs px-2 py-0.5">
                                🎂 Aniversário!
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {birthDateFormatted ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm",
                            hasBirthday ? "text-pink-500 font-semibold" : "text-muted-foreground"
                          )}>
                            {birthDateFormatted}
                          </span>
                          {hasBirthday && <span className="text-lg">🎉</span>}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </td>
                    <td className="text-center">
                      {customer.phone ? (
                        <a
                          href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}${hasBirthday ? '?text=Feliz%20Aniversário!%20🎂%20Temos%20uma%20surpresa%20especial%20para%20você!' : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                            hasBirthday 
                              ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90"
                              : "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
                          )}
                          title={hasBirthday ? "Enviar felicitações" : "Enviar WhatsApp"}
                        >
                          {hasBirthday ? <Gift className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {filteredCustomers?.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    {showBirthdayOnly 
                      ? 'Nenhum aniversariante hoje' 
                      : 'Nenhum cliente encontrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}