-- Remove the check constraint to allow custom discount types
ALTER TABLE public.promotions DROP CONSTRAINT promotions_discount_type_check;