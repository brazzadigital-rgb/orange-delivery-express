-- Add foreign key from user_roles.user_id to profiles.id
-- This allows Supabase to understand the relation for joins
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;