-- Add reais_per_point column to configure how many reais are needed to earn 1 point
-- This is an alternative to earning_rate_points_per_real (inverted logic)
-- Example: reais_per_point = 5 means customer needs to spend R$5 to earn 1 point

ALTER TABLE public.store_loyalty_settings 
ADD COLUMN IF NOT EXISTS reais_per_point numeric NOT NULL DEFAULT 1.0;

-- Add a comment to clarify the difference
COMMENT ON COLUMN public.store_loyalty_settings.earning_rate_points_per_real IS 'Pontos ganhos por cada R$1 gasto (legado)';
COMMENT ON COLUMN public.store_loyalty_settings.reais_per_point IS 'Valor em reais necessário para ganhar 1 ponto (ex: 5 = R$5 por ponto)';