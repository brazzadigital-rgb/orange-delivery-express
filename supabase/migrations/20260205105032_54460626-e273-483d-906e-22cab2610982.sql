-- Allow anyone to view app reviews publicly (for social proof)
CREATE POLICY "Anyone can view app reviews" 
ON public.app_reviews 
FOR SELECT 
USING (true);