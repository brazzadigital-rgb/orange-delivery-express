import { Home, Search, Heart, ShoppingBag, User, Star, Clock, MapPin, Plus, Flame } from 'lucide-react';

// Visual mockup of the real app interface
export default function AppMockupVisual() {
  return (
    <div className="relative mx-auto w-[280px] floating-slow">
      {/* Phone Frame */}
      <div className="relative rounded-[3rem] bg-[hsl(230_12%_10%)] p-2 shadow-2xl border border-[hsl(0_0%_100%/0.1)]">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-7 bg-[hsl(230_12%_10%)] rounded-b-2xl z-20" />
        
        {/* Screen */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-[hsl(0_0%_100%)]">
          {/* Status Bar */}
          <div className="h-8 bg-primary flex items-center justify-between px-6">
            <span className="text-[10px] text-white font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-white/80 rounded-sm" />
            </div>
          </div>
          
          {/* App Header */}
          <div className="bg-primary px-4 pb-4 pt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-white/70">Olá! 👋</p>
                <p className="text-xs font-bold text-white">Bem-vindo</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="bg-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-white/60" />
              <span className="text-[10px] text-white/60">Buscar pizzas...</span>
            </div>
          </div>

          {/* Banner */}
          <div className="px-3 pt-3">
            <div className="relative h-20 rounded-xl overflow-hidden bg-gradient-to-r from-orange-500 to-red-500">
              <div className="absolute inset-0 p-3 flex flex-col justify-center">
                <p className="text-[10px] text-white/80">Promoção</p>
                <p className="text-xs font-bold text-white">20% OFF na primeira compra</p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="px-3 pt-3">
            <p className="text-[10px] font-semibold text-gray-700 mb-2">Categorias</p>
            <div className="flex gap-2 overflow-hidden">
              {['Pizzas', 'Bebidas', 'Sobremesas'].map((cat, i) => (
                <div 
                  key={i}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-medium whitespace-nowrap ${
                    i === 0 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="px-3 pt-3 pb-20">
            <p className="text-[10px] font-semibold text-gray-700 mb-2">Mais Pedidas</p>
            <div className="space-y-2">
              {[
                { name: 'Pepperoni', price: 'R$ 49,90', rating: '4.9' },
                { name: 'Margherita', price: 'R$ 44,90', rating: '4.8' },
              ].map((pizza, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                    <span className="text-xl">🍕</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-gray-800 truncate">{pizza.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-[8px] text-gray-500">{pizza.rating}</span>
                    </div>
                    <p className="text-[10px] font-bold text-primary">{pizza.price}</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex justify-around">
            {[
              { icon: Home, label: 'Início', active: true },
              { icon: Search, label: 'Buscar', active: false },
              { icon: Heart, label: 'Favoritos', active: false },
              { icon: ShoppingBag, label: 'Pedidos', active: false },
              { icon: User, label: 'Perfil', active: false },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <item.icon 
                  className={`w-4 h-4 ${
                    item.active ? 'text-primary' : 'text-gray-400'
                  }`} 
                />
                <span 
                  className={`text-[7px] ${
                    item.active ? 'text-primary font-medium' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 -z-10 bg-[hsl(28_100%_50%/0.3)] rounded-[3rem] blur-[60px] scale-90" />
    </div>
  );
}
