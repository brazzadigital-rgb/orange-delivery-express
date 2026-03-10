-- Add EFI Bank columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'mercadopago',
ADD COLUMN IF NOT EXISTS efi_txid text,
ADD COLUMN IF NOT EXISTS efi_pix_copia_cola text,
ADD COLUMN IF NOT EXISTS efi_qrcode_image text;

-- Add provider column to subscription_payments if not exists
ALTER TABLE public.subscription_payments
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'mercadopago',
ADD COLUMN IF NOT EXISTS provider_payment_id text;