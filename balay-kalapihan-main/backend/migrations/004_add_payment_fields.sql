-- Add missing order fields for payment and pickup details
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_amount INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reference_number VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_date VARCHAR(50);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(50);

-- Rename userid to user_id for consistency
ALTER TABLE public.orders RENAME COLUMN IF EXISTS userid TO user_id;

-- Add phonenumber as phone_number (already exists in schema, but ensure consistency)
-- The phone_number column should already exist from the initial schema
