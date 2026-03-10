-- Create push delivery logs table for debugging
CREATE TABLE public.push_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'expired', 'permission_denied')),
  http_status INTEGER,
  error_message TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add is_active column to push_subscriptions if not exists
ALTER TABLE public.push_subscriptions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for faster queries
CREATE INDEX idx_push_delivery_logs_user_id ON public.push_delivery_logs(user_id);
CREATE INDEX idx_push_delivery_logs_created_at ON public.push_delivery_logs(created_at DESC);
CREATE INDEX idx_push_subscriptions_user_active ON public.push_subscriptions(user_id, is_active);

-- Enable RLS
ALTER TABLE public.push_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for push_delivery_logs
CREATE POLICY "Users can view their own push logs"
ON public.push_delivery_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all push logs"
ON public.push_delivery_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert push logs"
ON public.push_delivery_logs FOR INSERT
WITH CHECK (true);

-- Enable realtime for push_subscriptions updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;