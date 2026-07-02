-- Add user_id column to orders table to link orders to customers
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
