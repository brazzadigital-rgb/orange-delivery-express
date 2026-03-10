
CREATE OR REPLACE FUNCTION public.has_store_access(p_user_id uuid, p_store_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.store_users
    WHERE user_id = p_user_id
    AND store_id = p_store_id
  )
  OR has_role(p_user_id, 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.stores s
    JOIN auth.users u ON u.id = p_user_id
    WHERE s.id = p_store_id
    AND s.owner_email = u.email
  )
$function$;
