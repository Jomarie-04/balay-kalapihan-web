-- Add image column to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS image VARCHAR(255);

-- Update existing items with their default images
UPDATE public.menu_items SET image = '/images/koldbrew.jpg' WHERE name = 'Koldbrew';
UPDATE public.menu_items SET image = '/images/koldbrew-latte.jpg' WHERE name = 'Koldbrew Latte';
UPDATE public.menu_items SET image = '/images/cafe-latte.avif' WHERE name = 'Café Latte';
UPDATE public.menu_items SET image = '/images/cappuccino.jpg' WHERE name = 'Cappuccino';
UPDATE public.menu_items SET image = '/images/americano.jpg' WHERE name = 'Café Americano';
UPDATE public.menu_items SET image = '/images/caramel-macchiato.jpg' WHERE name = 'Caramel Macchiato';
UPDATE public.menu_items SET image = '/images/signature.jpg' WHERE name = 'Kalapihan''s Signature';
UPDATE public.menu_items SET image = '/images/mocha.jpg' WHERE name = 'Café Mocha';
UPDATE public.menu_items SET image = '/images/flat-white.jpg' WHERE name = 'Flat White';
UPDATE public.menu_items SET image = '/images/cinnamon-dolce.jpg' WHERE name = 'Cinnamon Dolce Latte';
UPDATE public.menu_items SET image = '/images/matcha-latte.jpg' WHERE name = 'Dirty Matcha Latte';
UPDATE public.menu_items SET image = '/images/mocha-loca.jpg' WHERE name = 'Mocha Loca';
UPDATE public.menu_items SET image = '/images/matcha-krema.avif' WHERE name = 'Matcha Krema';
UPDATE public.menu_items SET image = '/images/caramel-frappe.jpg' WHERE name = 'Caramel Frappuccino';
UPDATE public.menu_items SET image = '/images/cinnamon-frappe.jpg' WHERE name = 'Cinnamon Dolce';
UPDATE public.menu_items SET image = '/images/creamy-taro.avif' WHERE name = 'Creamy Taro';
UPDATE public.menu_items SET image = '/images/brewed-coffee.jpg' WHERE name = 'Brewed Coffee';
UPDATE public.menu_items SET image = '/images/raspberry-ripple.jpg' WHERE name = 'Raspberry Ripple';
UPDATE public.menu_items SET image = '/images/koldbrew.jpg' WHERE name = 'Iced Coffee';
