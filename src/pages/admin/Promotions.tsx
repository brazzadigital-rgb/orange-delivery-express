import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Tag, Edit2, Trash2, Eye, EyeOff, Search, Bell, Calendar } from 'lucide-react';
import { usePromotions, useDeletePromotion, usePublishPromotion, useUpdatePromotion } from '@/hooks/usePromotions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DiscountTypesManager, getDiscountTypes } from '@/components/admin/DiscountTypesManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminPromotions() {
  const navigate = useNavigate();
  const { data: promotions, isLoading } = usePromotions();
  const deletePromotion = useDeletePromotion();
  const publishPromotion = usePublishPromotion();
  const updatePromotion = useUpdatePromotion();
  const [search, setSearch] = useState('');

  const filteredPromotions = promotions?.filter((promo) =>
    promo.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatDiscountValue = (type: string, value: number) => {
    const discountTypes = getDiscountTypes();
    const customType = discountTypes.find(t => t.value === type);
    
    switch (type) {
      case 'percent':
        return `${value}% OFF`;
      case 'value':
        return `R$ ${value.toFixed(2).replace('.', ',')} OFF`;
      case 'free_delivery':
        return 'Frete Grátis';
      case 'combo':
        return 'Combo Especial';
      default:
        return customType ? customType.label : value.toString();
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await updatePromotion.mutateAsync({ id, data: { active: !active } });
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Promoções</h1>
          <p className="text-muted-foreground">Crie e gerencie promoções para seus clientes</p>
        </div>
        <Link to="/admin/promotions/new">
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nova Promoção
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar promoções..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <DiscountTypesManager />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{promotions?.length || 0}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Ativas</p>
          <p className="text-2xl font-bold text-success">
            {promotions?.filter((p) => p.active).length || 0}
          </p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Expiradas</p>
          <p className="text-2xl font-bold text-muted-foreground">
            {promotions?.filter((p) => p.ends_at && new Date(p.ends_at) < new Date()).length || 0}
          </p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Agendadas</p>
          <p className="text-2xl font-bold text-primary">
            {promotions?.filter((p) => p.starts_at && new Date(p.starts_at) > new Date()).length || 0}
          </p>
        </div>
      </div>

      {/* Promotions List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : filteredPromotions && filteredPromotions.length > 0 ? (
        <div className="grid gap-4">
          {filteredPromotions.map((promo) => (
            <div key={promo.id} className="card-premium p-5">
              <div className="flex items-start gap-4">
                {/* Banner Preview */}
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {promo.banner_url ? (
                    <img
                      src={promo.banner_url}
                      alt={promo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Tag className="w-8 h-8 text-primary" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{promo.title}</h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            promo.active
                              ? 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {promo.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {promo.description}
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm whitespace-nowrap">
                      {formatDiscountValue(promo.discount_type, promo.discount_value)}
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {promo.starts_at
                        ? format(new Date(promo.starts_at), "dd/MM/yy", { locale: ptBR })
                        : 'Sem início'}{' '}
                      -{' '}
                      {promo.ends_at
                        ? format(new Date(promo.ends_at), "dd/MM/yy", { locale: ptBR })
                        : 'Sem fim'}
                    </span>
                    <span className="capitalize">
                      Público: {promo.target_audience === 'all' ? 'Todos' : promo.target_audience}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/promotions/${promo.id}`)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(promo.id, promo.active)}
                    >
                      {promo.active ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Ativar
                        </>
                      )}
                    </Button>

                    {!promo.active && (
                      <Button
                        size="sm"
                        className="btn-primary"
                        onClick={() => publishPromotion.mutate(promo)}
                        disabled={publishPromotion.isPending}
                      >
                        <Bell className="w-4 h-4 mr-1" />
                        Publicar e Notificar
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive ml-auto">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir promoção?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A promoção será removida permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePromotion.mutate(promo.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-premium p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Tag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">
            {search ? 'Nenhuma promoção encontrada' : 'Nenhuma promoção cadastrada'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'Tente buscar por outro termo' : 'Crie sua primeira promoção para atrair mais clientes'}
          </p>
          {!search && (
            <Link to="/admin/promotions/new">
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Criar Promoção
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
