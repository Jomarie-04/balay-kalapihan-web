-- Migration: Replace stock with status in menu_items table
-- This migration adds a status column and removes the stock column

-- Add status column with default value 'available'
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';

-- Populate status based on stock values (if stock > 0, status is 'available', else 'unavailable')
UPDATE public.menu_items
SET status = CASE 
  WHEN stock > 0 THEN 'available'
  ELSE 'unavailable'
END
WHERE status = 'available';

-- Drop the stock column
ALTER TABLE public.menu_items
DROP COLUMN IF EXISTS stock;
