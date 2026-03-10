-- Create view for latest driver locations (for performance)
CREATE OR REPLACE VIEW public.driver_locations_latest AS
SELECT DISTINCT ON (order_id)
  id, driver_id, order_id, lat, lng, accuracy, heading, speed, recorded_at
FROM public.driver_locations
ORDER BY order_id, recorded_at DESC;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('sounds', 'sounds', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('promotions', 'promotions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for sounds bucket
CREATE POLICY "Anyone can view sounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'sounds');

CREATE POLICY "Admins can upload sounds"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sounds' AND has_role(auth.uid(), 'admin'));

-- Storage policies for promotions bucket
CREATE POLICY "Anyone can view promo banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'promotions');

CREATE POLICY "Admins can upload promo banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'promotions' AND has_role(auth.uid(), 'admin'));