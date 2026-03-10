
-- 1) Add table_pin to restaurant_tables
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS table_pin text;

-- 2) Add token settings to store_settings
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS token_expiration_minutes integer DEFAULT 60;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS require_table_pin boolean DEFAULT false;

-- 3) Create table_session_tokens table
CREATE TABLE public.table_session_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_session_id uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'active',
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  is_verified boolean NOT NULL DEFAULT false,
  device_fingerprint text,
  ip_hash text
);

-- Index for fast token lookup
CREATE INDEX idx_session_tokens_token ON public.table_session_tokens(token);
CREATE INDEX idx_session_tokens_session ON public.table_session_tokens(table_session_id);

-- Enable RLS
ALTER TABLE public.table_session_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public read for token validation (anonymous QR users)
CREATE POLICY "Anyone can read session tokens for validation"
  ON public.table_session_tokens FOR SELECT
  USING (true);

-- Allow public insert for token creation (anonymous QR users)
CREATE POLICY "Anyone can create session tokens"
  ON public.table_session_tokens FOR INSERT
  WITH CHECK (true);

-- Allow public update for token verification and last_used_at
CREATE POLICY "Anyone can update session tokens"
  ON public.table_session_tokens FOR UPDATE
  USING (true);

-- 4) Trigger: revoke all active tokens when session is closed
CREATE OR REPLACE FUNCTION public.revoke_session_tokens_on_close()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'closed' AND OLD.status = 'open' THEN
    UPDATE public.table_session_tokens
    SET status = 'revoked', revoked_at = now()
    WHERE table_session_id = NEW.id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_revoke_tokens_on_session_close
  AFTER UPDATE ON public.table_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.revoke_session_tokens_on_close();

-- 5) Enable realtime for table_session_tokens
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_session_tokens;
