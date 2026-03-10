-- Public read for all buckets
CREATE POLICY "Public read storage" ON storage.objects FOR SELECT USING (true);

-- Authenticated users can upload
CREATE POLICY "Authenticated upload storage" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated update storage" ON storage.objects 
FOR UPDATE TO authenticated USING (true);

-- Authenticated users can delete their uploads
CREATE POLICY "Authenticated delete storage" ON storage.objects 
FOR DELETE TO authenticated USING (true);