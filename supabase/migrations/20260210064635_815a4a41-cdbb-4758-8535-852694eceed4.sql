-- Add FK from store_users.user_id to profiles.id for PostgREST joins
ALTER TABLE public.store_users 
  ADD CONSTRAINT store_users_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add FK from store_users.store_id to stores.id for PostgREST joins  
ALTER TABLE public.store_users 
  ADD CONSTRAINT store_users_store_id_stores_fkey 
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;