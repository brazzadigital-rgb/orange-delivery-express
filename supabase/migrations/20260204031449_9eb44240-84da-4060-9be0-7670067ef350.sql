-- Add foreign key relationship from orders.user_id to profiles.id
-- This allows us to join orders with profiles to get customer info

ALTER TABLE public.orders
ADD CONSTRAINT orders_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE RESTRICT;