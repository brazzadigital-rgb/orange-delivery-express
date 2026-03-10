
-- Add pricing_mode to store_pizza_settings
-- 'matrix' = current size×flavor price matrix
-- 'fixed_by_size' = price only from size base_price (flavors free)
-- 'per_item' = price per individual piece/unit (e.g. sushi per piece)
ALTER TABLE public.store_pizza_settings 
ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'matrix';

-- Add unit_price to pizza_flavors for per_item pricing mode
ALTER TABLE public.pizza_flavors 
ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;

-- Add unit_label to pizza_sizes for per_item mode (e.g. "peças", "unidades")
ALTER TABLE public.pizza_sizes 
ADD COLUMN IF NOT EXISTS unit_label text DEFAULT NULL;

-- Add description to pizza_sizes for richer display
ALTER TABLE public.pizza_sizes 
ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;
