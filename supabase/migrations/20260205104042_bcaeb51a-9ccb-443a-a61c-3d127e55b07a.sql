
-- Create app_reviews table for storing customer ratings
CREATE TABLE public.app_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  contact_allowed boolean DEFAULT false,
  platform text CHECK (platform IN ('ios', 'android', 'desktop', 'pwa')),
  app_version text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_app_reviews_store_created ON public.app_reviews (store_id, created_at DESC);
CREATE INDEX idx_app_reviews_store_rating ON public.app_reviews (store_id, rating);
CREATE INDEX idx_app_reviews_user ON public.app_reviews (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own reviews"
ON public.app_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reviews"
ON public.app_reviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reviews"
ON public.app_reviews FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can update reviews"
ON public.app_reviews FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Create store_app_review_settings table
CREATE TABLE public.store_app_review_settings (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  min_days_between_reviews integer DEFAULT 30,
  play_store_url text,
  app_store_url text,
  review_prompt_title text DEFAULT 'Avaliar o app',
  review_prompt_subtitle text DEFAULT 'Conte como foi sua experiência',
  thank_you_message text DEFAULT 'Obrigado pela avaliação! 🙌',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.store_app_review_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for settings
CREATE POLICY "Anyone can view review settings"
ON public.store_app_review_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage review settings"
ON public.store_app_review_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create function to check if user can submit review
CREATE OR REPLACE FUNCTION public.can_submit_review(p_user_id uuid, p_store_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min_days integer;
  v_last_review timestamptz;
  v_enabled boolean;
BEGIN
  -- Get settings
  SELECT enabled, min_days_between_reviews INTO v_enabled, v_min_days
  FROM store_app_review_settings
  WHERE store_id = p_store_id;
  
  -- If no settings, use defaults
  IF NOT FOUND THEN
    v_enabled := true;
    v_min_days := 30;
  END IF;
  
  -- Check if enabled
  IF NOT v_enabled THEN
    RETURN false;
  END IF;
  
  -- Get last review date
  SELECT created_at INTO v_last_review
  FROM app_reviews
  WHERE user_id = p_user_id AND store_id = p_store_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no previous review, can submit
  IF v_last_review IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if enough days have passed
  RETURN (now() - v_last_review) >= (v_min_days || ' days')::interval;
END;
$$;
