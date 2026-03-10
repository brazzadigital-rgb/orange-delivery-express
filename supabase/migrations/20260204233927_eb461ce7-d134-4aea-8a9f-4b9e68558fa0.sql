-- Create user notification preferences table
CREATE TABLE public.user_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_sound_enabled BOOLEAN NOT NULL DEFAULT true,
  order_sound_volume NUMERIC NOT NULL DEFAULT 0.8 CHECK (order_sound_volume >= 0 AND order_sound_volume <= 1),
  order_sound_type TEXT NOT NULL DEFAULT 'soft_chime' CHECK (order_sound_type IN ('soft_chime', 'pop', 'bell')),
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  vibration_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sound_unlocked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.user_notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences"
ON public.user_notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
ON public.user_notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_notification_preferences_updated_at
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.user_notification_preferences IS 'Stores user notification preferences for order updates, sounds, and push notifications';