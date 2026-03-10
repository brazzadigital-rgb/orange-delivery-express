import { Store, Clock } from 'lucide-react';

export function StoreUnavailableNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
          <Store className="w-10 h-10 text-muted-foreground" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Loja Temporariamente Indisponível</h1>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Estamos passando por uma manutenção temporária. Por favor, tente novamente mais tarde.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Voltaremos em breve</span>
        </div>
      </div>
    </div>
  );
}
