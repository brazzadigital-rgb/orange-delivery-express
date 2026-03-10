-- Cache table for CEP lookups to reduce Google API calls
CREATE TABLE public.cep_cache (
  cep text PRIMARY KEY,
  street text,
  neighborhood text,
  city text NOT NULL,
  state text NOT NULL,
  country text DEFAULT 'BR',
  lat numeric,
  lng numeric,
  source text DEFAULT 'google',
  confidence text DEFAULT 'high',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_cep_cache_updated ON cep_cache(updated_at);

-- Enable RLS
ALTER TABLE public.cep_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (cache is not sensitive data)
CREATE POLICY "Anyone can read CEP cache"
  ON public.cep_cache
  FOR SELECT
  USING (true);

-- Only server can insert/update (via service role)
-- No insert/update policies for anon/authenticated - only service role can write

-- Trigger to update updated_at
CREATE TRIGGER update_cep_cache_updated_at
  BEFORE UPDATE ON public.cep_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();