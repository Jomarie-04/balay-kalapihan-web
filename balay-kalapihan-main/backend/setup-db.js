/**
 * Database Setup Script
 * Run this to create all required tables in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kgppeufbtrbxrbeofyqk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
  console.error('Please add them to your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing Balay Kalapihan Database...\n');

    // Step 1: Check if customers table exists
    console.log('1️⃣  Checking customers table...');
    const { error: customersCheckError, data: customersData } = await supabase
      .from('customers')
      .select('id')
      .limit(1);

    if (customersCheckError && customersCheckError.code === 'PGRST116') {
      console.log('   ✗ customers table does not exist');
      console.log('   ⚠️  You must run the schema.sql in Supabase SQL Editor manually');
      console.log('\n📋 REQUIRED STEPS:');
      console.log('   1. Go to: https://app.supabase.com');
      console.log('   2. Select your project (balay-kalapihan)');
      console.log('   3. Click "SQL Editor" in the left sidebar');
      console.log('   4. Create a new query');
      console.log('   5. Copy the contents of backend/schema.sql');
      console.log('   6. Paste it in the SQL Editor');
      console.log('   7. Click "Run"');
      console.log('   8. After tables are created, restart this server\n');
      process.exit(1);
    } else if (customersCheckError) {
      console.log('   ✗ Error checking customers table:', customersCheckError.message);
      console.log('   ⚠️  Please ensure your Supabase credentials are correct');
      process.exit(1);
    } else {
      console.log('   ✓ customers table exists\n');
    }

    // Step 2: Check menu_items table
    console.log('2️⃣  Checking menu_items table...');
    const { error: menuCheckError, data: menuData } = await supabase
      .from('menu_items')
      .select('id')
      .limit(1);

    if (menuCheckError && menuCheckError.code === 'PGRST116') {
      console.log('   ✗ menu_items table does not exist\n');
      console.log('⚠️  Please run schema.sql in Supabase SQL Editor\n');
      process.exit(1);
    } else if (!menuCheckError) {
      console.log('   ✓ menu_items table exists\n');
    }

    // Step 3: Check orders table
    console.log('3️⃣  Checking orders table...');
    const { error: ordersCheckError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (ordersCheckError && ordersCheckError.code === 'PGRST116') {
      console.log('   ✗ orders table does not exist\n');
      console.log('⚠️  Please run schema.sql in Supabase SQL Editor\n');
      process.exit(1);
    } else if (!ordersCheckError) {
      console.log('   ✓ orders table exists\n');
    }

    console.log('✅ All tables are initialized!');
    console.log('✅ Database is ready to use\n');

    // Try to insert a test record to verify write access
    console.log('Testing write access to database...');
    const testId = `test-${Date.now()}`;
    const { error: testError } = await supabase
      .from('orders')
      .insert({ id: testId, customer: 'test', items: 0, total: 0 })
      .select();

    if (testError) {
      console.log('   ⚠️  Warning: Could not write to database');
      console.log('   Error:', testError.message);
    } else {
      // Delete test record
      await supabase.from('orders').delete().eq('id', testId);
      console.log('   ✓ Database write access verified\n');
    }

    return true;

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase().then(() => {
  console.log('🚀 Database initialization complete!');
  console.log('You can now start your server normally');
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
