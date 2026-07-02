#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envFile = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envFile, 'utf-8');
const env = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();
  if (key && key.trim()) {
    env[key.trim()] = value;
  }
});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_KEY
);

const defaultMenuItems = [
  { name: 'Koldbrew', category: 'Koldbrew', price: 79, status: 'available', sales: 0, description: null, image: '/images/koldbrew.jpg' },
  { name: 'Koldbrew Latte', category: 'Koldbrew Latte', price: 85, status: 'available', sales: 0, description: null, image: '/images/koldbrew-latte.jpg' },
  { name: 'Café Latte', category: 'Espresso Drinks', price: 100, status: 'available', sales: 0, description: null, image: '/images/cafe-latte.avif' },
  { name: 'Cappuccino', category: 'Espresso Drinks', price: 95, status: 'available', sales: 0, description: null, image: '/images/cappuccino.jpg' },
  { name: 'Café Americano', category: 'Espresso Drinks', price: 85, status: 'available', sales: 0, description: null, image: '/images/americano.jpg' },
  { name: 'Caramel Macchiato', category: 'Espresso Drinks', price: 115, status: 'available', sales: 0, description: null, image: '/images/caramel-macchiato.jpg' },
  { name: 'Kalapihan\'s Signature', category: 'Espresso Drinks', price: 95, status: 'available', sales: 0, description: null, image: '/images/signature.jpg' },
  { name: 'Café Mocha', category: 'Espresso Drinks', price: 115, status: 'available', sales: 0, description: null, image: '/images/mocha.jpg' },
  { name: 'Flat White', category: 'Espresso Drinks', price: 90, status: 'available', sales: 0, description: null, image: '/images/flat-white.jpg' },
  { name: 'Cinnamon Dolce Latte', category: 'Espresso Drinks', price: 95, status: 'available', sales: 0, description: null, image: '/images/cinnamon-dolce.jpg' },
  { name: 'Dirty Matcha Latte', category: 'Espresso Drinks', price: 115, status: 'available', sales: 0, description: null, image: '/images/matcha-latte.jpg' },
  { name: 'Mocha Loca', category: 'Frappe', price: 135, status: 'available', sales: 0, description: null, image: '/images/mocha-loca.jpg' },
  { name: 'Matcha Krema', category: 'Frappe', price: 125, status: 'available', sales: 0, description: null, image: '/images/matcha-krema.avif' },
  { name: 'Caramel Frappuccino', category: 'Frappe', price: 135, status: 'available', sales: 0, description: null, image: '/images/caramel-frappe.jpg' },
  { name: 'Raspberry Ripple', category: 'Frappe', price: 120, status: 'available', sales: 0, description: null, image: '/images/raspberry-ripple.jpg' },
  { name: 'Cinnamon Dolce', category: 'Frappe', price: 125, status: 'available', sales: 0, description: null, image: '/images/cinnamon-frappe.jpg' },
  { name: 'Creamy Taro', category: 'Frappe', price: 120, status: 'available', sales: 0, description: null, image: '/images/creamy-taro.avif' },
  { name: 'Brewed Coffee', category: 'Brewed Coffee', price: 85, status: 'available', sales: 0, description: null, image: '/images/brewed-coffee.jpg' },
  { name: 'Cream Cheese', category: 'Add-ons', price: 20, status: 'available', sales: 0, description: null, image: null },
  { name: 'Syrup', category: 'Add-ons', price: 10, status: 'available', sales: 0, description: null, image: null },
  { name: 'Boba Pearls', category: 'Add-ons', price: 20, status: 'available', sales: 0, description: null, image: null },
  { name: 'Espresso Shot', category: 'Add-ons', price: 60, status: 'available', sales: 0, description: null, image: null },
];

async function restoreMenuItems() {
  try {
    console.log('🔄 Restoring menu items...\n');
    
    const { count } = await supabase
      .from('menu_items')
      .select('id', { count: 'exact' });
    
    if (count > 0) {
      console.log(`✅ Menu already has ${count} items. Skipping restore.\n`);
      return;
    }
    
    const { data, error } = await supabase
      .from('menu_items')
      .insert(defaultMenuItems)
      .select();
    
    if (error) {
      console.error('❌ Error inserting menu items:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Successfully restored ${data.length} menu items!\n`);
    console.log('📋 Restored Items by Category:');
    
    const categories = {};
    data.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item.name);
    });
    
    Object.entries(categories).forEach(([cat, items]) => {
      console.log(`   ${cat}: ${items.join(', ')}`);
    });
    
    console.log('\n✨ Menu restoration complete!');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

restoreMenuItems();
