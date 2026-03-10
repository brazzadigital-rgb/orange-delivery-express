
-- Add store_id column to billing_settings
ALTER TABLE public.billing_settings
ADD COLUMN store_id uuid REFERENCES public.stores(id);

-- Backfill existing rows
UPDATE public.billing_settings
SET store_id = (SELECT id FROM public.stores ORDER BY created_at ASC LIMIT 1)
WHERE store_id IS NULL;

-- Make store_id NOT NULL
ALTER TABLE public.billing_settings
ALTER COLUMN store_id SET NOT NULL;

-- Unique constraint: one billing_settings per store
ALTER TABLE public.billing_settings
ADD CONSTRAINT billing_settings_store_id_unique UNIQUE (store_id);

-- Update get_billing_gate to accept store_id
CREATE OR REPLACE FUNCTION public.get_billing_gate(p_store_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_settings billing_settings;
  v_grace interval;
BEGIN
  SELECT * INTO v_settings FROM billing_settings WHERE store_id = p_store_id;
  
  IF NOT FOUND THEN
    RETURN 'blocked';
  END IF;
  
  IF v_settings.status = 'active' THEN
    IF v_settings.next_due_date IS NOT NULL THEN
      v_grace := (v_settings.grace_period_days || ' days')::interval;
      IF now()::date > v_settings.next_due_date + v_grace THEN
        RETURN 'blocked';
      ELSIF now()::date > v_settings.next_due_date THEN
        RETURN 'past_due';
      END IF;
    END IF;
    RETURN 'open';
  END IF;
  
  IF v_settings.status = 'past_due' THEN
    RETURN 'past_due';
  END IF;
  
  RETURN 'blocked';
END;
$function$;

-- Backward-compatible overload (returns open to avoid breaking things)
CREATE OR REPLACE FUNCTION public.get_billing_gate()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'open';
END;
$function$;

-- RLS policies
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their billing"
ON public.billing_settings FOR SELECT
USING (
  public.has_store_role(auth.uid(), store_id, ARRAY['owner'::store_role, 'admin'::store_role])
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only global admins can modify billing"
ON public.billing_settings FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only global admins can insert billing"
ON public.billing_settings FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);
