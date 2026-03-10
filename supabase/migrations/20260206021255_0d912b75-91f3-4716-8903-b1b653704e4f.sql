-- User privacy settings table
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_name_to_store BOOLEAN NOT NULL DEFAULT true,
  allow_promotional_contact BOOLEAN NOT NULL DEFAULT true,
  share_location_during_delivery BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_privacy_settings
CREATE POLICY "Users can view their own privacy settings"
ON public.user_privacy_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings"
ON public.user_privacy_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings"
ON public.user_privacy_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Account deletion requests table
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processed', 'cancelled')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for account_deletion_requests
CREATE POLICY "Users can view their own deletion requests"
ON public.account_deletion_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests"
ON public.account_deletion_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own pending deletion requests"
ON public.account_deletion_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'requested');

-- Admins can view and process all deletion requests
CREATE POLICY "Admins can view all deletion requests"
ON public.account_deletion_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update deletion requests"
ON public.account_deletion_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Add birth_date column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN birth_date DATE;
  END IF;
END $$;

-- Add avatar_url column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Create trigger for updated_at on user_privacy_settings
CREATE TRIGGER update_user_privacy_settings_updated_at
BEFORE UPDATE ON public.user_privacy_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id 
ON public.account_deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status 
ON public.account_deletion_requests(status);

-- Enable realtime for privacy settings (optional, for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_privacy_settings;