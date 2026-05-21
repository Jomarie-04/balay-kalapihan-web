import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function initializeDatabase() {
  try {
    console.log('Connecting to Supabase database...');
    
    // Test connection and table existence
    const { error: tablesCheckError } = await supabase.from('orders').select('id').limit(1);
    
    if (tablesCheckError) {
      if (tablesCheckError.code === 'PGRST116') {
        console.log('✓ Supabase connection successful');
        console.log('✓ Tables exist (no data yet)');
      } else if (tablesCheckError.code === 'PGRST204') {
        console.warn('\n⚠️  DATABASE SCHEMA NOT FOUND');
        console.warn('======================================');
        console.warn('The database tables are not created yet.');
        console.warn('\n1. Go to your Supabase Dashboard');
        console.warn('2. Open the SQL Editor');
        console.warn('3. Copy and paste the contents of backend/schema.sql');
        console.warn('4. Execute the SQL statements');
        console.warn('5. Restart this server');
        console.warn('======================================\n');
        throw new Error('Database schema not initialized. Please run schema.sql in Supabase SQL Editor.');
      } else {
        throw tablesCheckError;
      }
    } else {
      console.log('✓ Supabase connection successful');
    }
    
    // Initialize default menu items if table is empty
    try {
      const { count } = await supabase
        .from('menu_items')
        .select('id', { count: 'exact' });
      
      if (count === 0 || count === null) {
        console.log('Inserting default menu items...');
        
        const defaultItems = [
          // KOLDBREW
          { name: 'Koldbrew', category: 'Koldbrew', price: 79, status: 'available', sales: 0, description: null, image: '/images/koldbrew.jpg' },
          // KOLDBREW LATTE
          { name: 'Koldbrew Latte', category: 'Koldbrew Latte', price: 85, status: 'available', sales: 0, description: null, image: '/images/koldbrew-latte.jpg' },
          // ESPRESSO DRINKS
          { name: 'Café Latte', category: 'Espresso Drinks', price: 100, status: 'available', sales: 0, description: null, image: '/images/cafe-latte.avif' },
          { name: 'Cappuccino', category: 'Espresso Drinks', price: 95, status: 'available', sales: 0, description: null, image: '/images/cappuccino.jpg' },
          { name: 'Café Americano', category: 'Espresso Drinks', price: 85, status: 'available', sales: 0, description: null, image: '/images/americano.jpg' },
          { name: 'Caramel Macchiato', category: 'Espresso Drinks', price: 115, status: 'available', sales: 0, description: null, image: '/images/caramel-macchiato.jpg' },
          { name: 'Kalapihan\'s Signature', category: 'Espresso Drinks', price: 95, status: 'available', sales: 0, description: null, image: '/images/signature.jpg' },
          { name: 'Café Mocha', category: 'Espresso Drinks', price: 115, status: 'available', sales: 0, description: null, image: '/images/mocha.jpg' },
          { name: 'Flat White', category: 'Espresso Drinks', price: 90, status: 'available', sales: 0, description: null, image: '/images/flat-white.jpg' },
          { name: 'Cinnamon Dolce Latte', category: 'Espresso Drinks', price: 95, status: 'available', sales: 0, description: null, image: '/images/cinnamon-dolce.jpg' },
          { name: 'Dirty Matcha Latte', category: 'Espresso Drinks', price: 115, status: 'available', sales: 0, description: null, image: '/images/matcha-latte.jpg' },
          // FRAPPE
          { name: 'Mocha Loca', category: 'Frappe', price: 135, status: 'available', sales: 0, description: null, image: '/images/mocha-loca.jpg' },
          { name: 'Matcha Krema', category: 'Frappe', price: 125, status: 'available', sales: 0, description: null, image: '/images/matcha-krema.avif' },
          { name: 'Caramel Frappuccino', category: 'Frappe', price: 135, status: 'available', sales: 0, description: null, image: '/images/caramel-frappe.jpg' },
          { name: 'Raspberry Ripple', category: 'Frappe', price: 120, status: 'available', sales: 0, description: null, image: '/images/raspberry-ripple.jpg' },
          { name: 'Cinnamon Dolce', category: 'Frappe', price: 125, status: 'available', sales: 0, description: null, image: '/images/cinnamon-frappe.jpg' },
          { name: 'Creamy Taro', category: 'Frappe', price: 120, status: 'available', sales: 0, description: null, image: '/images/creamy-taro.avif' },
          // BREWED COFFEE
          { name: 'Brewed Coffee', category: 'Brewed Coffee', price: 85, status: 'available', sales: 0, description: null, image: '/images/brewed-coffee.jpg' },
          // ADD-ONS
          { name: 'Cream Cheese', category: 'Add-ons', price: 20, status: 'available', sales: 0, description: null, image: null },
          { name: 'Syrup', category: 'Add-ons', price: 10, status: 'available', sales: 0, description: null, image: null },
          { name: 'Boba Pearls', category: 'Add-ons', price: 20, status: 'available', sales: 0, description: null, image: null },
          { name: 'Espresso Shot', category: 'Add-ons', price: 60, status: 'available', sales: 0, description: null, image: null },
        ];
        
        const { error: insertError } = await supabase
          .from('menu_items')
          .insert(defaultItems);
        
        if (insertError) {
          console.error('Error inserting default items:', insertError);
        } else {
          console.log('✓ Default menu items inserted successfully');
        }
      }
    } catch (menuError) {
      console.warn('Could not initialize menu items:', menuError.message);
    }
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
}
