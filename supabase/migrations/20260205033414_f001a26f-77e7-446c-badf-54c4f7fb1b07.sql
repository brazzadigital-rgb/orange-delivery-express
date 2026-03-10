-- Pizza Builder v2 Tables

-- 1) pizza_sizes - Tamanhos de pizza com limite de sabores
CREATE TABLE public.pizza_sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slices INTEGER NOT NULL CHECK (slices > 0),
  max_flavors INTEGER NOT NULL DEFAULT 1 CHECK (max_flavors >= 1 AND max_flavors <= 10),
  base_price NUMERIC NOT NULL DEFAULT 0,
  is_promo BOOLEAN DEFAULT false,
  promo_label TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2) pizza_flavors - Sabores de pizza
CREATE TABLE public.pizza_flavors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3) pizza_flavor_prices - Preço por sabor por tamanho
CREATE TABLE public.pizza_flavor_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  size_id UUID NOT NULL REFERENCES public.pizza_sizes(id) ON DELETE CASCADE,
  flavor_id UUID NOT NULL REFERENCES public.pizza_flavors(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (size_id, flavor_id)
);

-- 4) pizza_addon_groups - Grupos de adicionais (borda, extras)
CREATE TABLE public.pizza_addon_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_select INTEGER DEFAULT 1,
  min_select INTEGER DEFAULT 0,
  group_type TEXT NOT NULL DEFAULT 'single' CHECK (group_type IN ('single', 'multi')),
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5) pizza_addons - Itens adicionais
CREATE TABLE public.pizza_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.pizza_addon_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6) store_pizza_settings - Configurações do Pizza Builder por loja
CREATE TABLE public.store_pizza_settings (
  store_id UUID NOT NULL PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  pricing_rule TEXT NOT NULL DEFAULT 'average' CHECK (pricing_rule IN ('average', 'highest')),
  require_at_least_one_flavor BOOLEAN DEFAULT true,
  allow_less_than_max BOOLEAN DEFAULT true,
  max_observation_chars INTEGER DEFAULT 140,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.pizza_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_flavor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_pizza_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pizza_sizes
CREATE POLICY "Admins can manage pizza sizes" ON public.pizza_sizes
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active pizza sizes" ON public.pizza_sizes
FOR SELECT USING (active = true);

-- RLS Policies for pizza_flavors
CREATE POLICY "Admins can manage pizza flavors" ON public.pizza_flavors
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active pizza flavors" ON public.pizza_flavors
FOR SELECT USING (active = true);

-- RLS Policies for pizza_flavor_prices
CREATE POLICY "Admins can manage pizza flavor prices" ON public.pizza_flavor_prices
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view pizza flavor prices" ON public.pizza_flavor_prices
FOR SELECT USING (true);

-- RLS Policies for pizza_addon_groups
CREATE POLICY "Admins can manage pizza addon groups" ON public.pizza_addon_groups
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active pizza addon groups" ON public.pizza_addon_groups
FOR SELECT USING (active = true);

-- RLS Policies for pizza_addons
CREATE POLICY "Admins can manage pizza addons" ON public.pizza_addons
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active pizza addons" ON public.pizza_addons
FOR SELECT USING (active = true);

-- RLS Policies for store_pizza_settings
CREATE POLICY "Admins can manage store pizza settings" ON public.store_pizza_settings
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view store pizza settings" ON public.store_pizza_settings
FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_pizza_sizes_updated_at
BEFORE UPDATE ON public.pizza_sizes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pizza_flavors_updated_at
BEFORE UPDATE ON public.pizza_flavors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pizza_addon_groups_updated_at
BEFORE UPDATE ON public.pizza_addon_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pizza_addons_updated_at
BEFORE UPDATE ON public.pizza_addons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_pizza_settings_updated_at
BEFORE UPDATE ON public.store_pizza_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();