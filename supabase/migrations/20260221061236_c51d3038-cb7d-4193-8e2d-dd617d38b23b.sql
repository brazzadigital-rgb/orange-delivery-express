
-- 1. Create store type enum
CREATE TYPE public.store_type AS ENUM (
  'pizzaria',
  'hamburgueria',
  'bebidas',
  'sushi',
  'acai',
  'padaria',
  'restaurante',
  'generico'
);

-- 2. Add store_type column to stores (default 'generico' so existing stores work)
ALTER TABLE public.stores 
ADD COLUMN store_type public.store_type NOT NULL DEFAULT 'generico';

-- 3. Create home sections configuration table
CREATE TABLE public.store_home_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, section_key)
);

-- 4. Enable RLS
ALTER TABLE public.store_home_sections ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies
CREATE POLICY "Anyone can read store home sections"
ON public.store_home_sections FOR SELECT
USING (true);

CREATE POLICY "Store admins can manage home sections"
ON public.store_home_sections FOR ALL
TO authenticated
USING (public.has_store_role(auth.uid(), store_id, ARRAY['owner', 'admin']::store_role[]))
WITH CHECK (public.has_store_role(auth.uid(), store_id, ARRAY['owner', 'admin']::store_role[]));

-- 6. Global admins can manage all
CREATE POLICY "Global admins can manage all home sections"
ON public.store_home_sections FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. Updated_at trigger
CREATE TRIGGER update_store_home_sections_updated_at
BEFORE UPDATE ON public.store_home_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Function to initialize default home sections for a store based on type
CREATE OR REPLACE FUNCTION public.initialize_store_home_sections(p_store_id UUID, p_store_type store_type DEFAULT 'generico')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete existing sections for this store
  DELETE FROM store_home_sections WHERE store_id = p_store_id;

  -- Common sections for all types
  INSERT INTO store_home_sections (store_id, section_key, label, sort_order, enabled) VALUES
    (p_store_id, 'banners', 'Banners / Carrossel', 1, true),
    (p_store_id, 'categories', 'Categorias', 3, true),
    (p_store_id, 'products', 'Produtos', 4, true),
    (p_store_id, 'promotions', 'Promoções', 5, true);

  -- Type-specific sections
  CASE p_store_type
    WHEN 'pizzaria' THEN
      INSERT INTO store_home_sections (store_id, section_key, label, sort_order, enabled) VALUES
        (p_store_id, 'pizza_builder_cta', 'Monte sua Pizza (CTA)', 2, true),
        (p_store_id, 'pizza_sizes', 'Tamanhos de Pizza', 6, true);
    WHEN 'hamburgueria' THEN
      INSERT INTO store_home_sections (store_id, section_key, label, sort_order, enabled) VALUES
        (p_store_id, 'combo_builder_cta', 'Monte seu Combo (CTA)', 2, true),
        (p_store_id, 'featured_combos', 'Combos em Destaque', 6, true);
    WHEN 'sushi' THEN
      INSERT INTO store_home_sections (store_id, section_key, label, sort_order, enabled) VALUES
        (p_store_id, 'combo_builder_cta', 'Monte seu Combo (CTA)', 2, true),
        (p_store_id, 'popular_items', 'Mais Pedidos', 6, true);
    WHEN 'bebidas' THEN
      INSERT INTO store_home_sections (store_id, section_key, label, sort_order, enabled) VALUES
        (p_store_id, 'quick_filters', 'Filtros Rápidos', 2, true),
        (p_store_id, 'offers', 'Ofertas do Dia', 6, true);
    WHEN 'acai' THEN
      INSERT INTO store_home_sections (store_id, section_key, label, sort_order, enabled) VALUES
        (p_store_id, 'combo_builder_cta', 'Monte seu Açaí (CTA)', 2, true),
        (p_store_id, 'popular_items', 'Mais Pedidos', 6, true);
    ELSE
      INSERT INTO store_home_sections (store_id, section_key, label, sort_order, enabled) VALUES
        (p_store_id, 'featured', 'Destaques', 2, true);
  END CASE;

  -- Loyalty section (always available but disabled by default for non-food)
  INSERT INTO store_home_sections (store_id, section_key, label, sort_order, enabled) VALUES
    (p_store_id, 'loyalty', 'Programa de Fidelidade', 7, p_store_type != 'bebidas');
END;
$$;

-- 9. Trigger to auto-initialize sections when a store is created
CREATE OR REPLACE FUNCTION public.auto_init_home_sections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM initialize_store_home_sections(NEW.id, NEW.store_type);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_init_home_sections
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.auto_init_home_sections();
