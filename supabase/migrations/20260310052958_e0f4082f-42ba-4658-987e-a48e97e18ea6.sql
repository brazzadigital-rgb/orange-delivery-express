
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.delivery_type ADD VALUE IF NOT EXISTS 'table';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'served';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'waiter';
