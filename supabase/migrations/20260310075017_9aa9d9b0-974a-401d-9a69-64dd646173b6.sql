-- Add global admin role for master user
INSERT INTO public.user_roles (user_id, role)
VALUES ('1f32cee9-5345-44b7-84f3-7416ff9cfdfd', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;