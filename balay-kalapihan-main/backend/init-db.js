import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSchema() {
  try {
    console.log('🔄 Creating database schema...\n');

    // Execute all SQL statements
    const sql = `
      -- Create customers table
      CREATE TABLE IF NOT EXISTS public.customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create menu_items table
      CREATE TABLE IF NOT EXISTS public.menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        sales INTEGER DEFAULT 0,
        description TEXT,
        image VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create orders table
      CREATE TABLE IF NOT EXISTS public.orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
        customer VARCHAR(255) NOT NULL,
        items INTEGER NOT NULL,
        total INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        time VARCHAR(50),
        phone_number VARCHAR(20),
        total_amount INTEGER,
        subtotal_amount INTEGER,
        discount INTEGER DEFAULT 0,
        tax INTEGER DEFAULT 0,
        payment_method VARCHAR(50),
        reference_number VARCHAR(255),
        pickup_date VARCHAR(50),
        pickup_time VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create order_items table
      CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id VARCHAR(255) REFERENCES public.orders(id) ON DELETE CASCADE,
        menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create notifications table
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_customers_username ON public.customers(username);
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
    `;

    // Use RPC or direct execution - try using the query method
    const { error } = await supabase.rpc('exec', { sql });
    
    if (error) {
      // If RPC doesn't exist, we'll need to use SQL editor
      console.error('❌ Could not execute via RPC');
      console.log('\n📋 Please manually run the schema.sql file in Supabase SQL Editor:');
      console.log('1. Go to https://supabase.com/dashboard/project/kgppeufbtrbxrbeofyqk');
      console.log('2. Log in if needed');
      console.log('3. Click "SQL Editor" in the left sidebar');
      console.log('4. Click "New Query"');
      console.log('5. Copy contents from backend/schema.sql');
      console.log('6. Paste into the editor');
      console.log('7. Click "Run"');
      console.log('8. Come back here and run this script again');
      process.exit(1);
    }

    console.log('✅ Database schema created successfully!\n');
    console.log('✨ Tables created:');
    console.log('   - customers');
    console.log('   - menu_items');
    console.log('   - orders');
    console.log('   - order_items');
    console.log('   - notifications');
    console.log('\n🚀 You can now start the server: node server.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  If you see an RPC error, please:');
    console.log('1. Go to https://supabase.com/dashboard/project/kgppeufbtrbxrbeofyqk');
    console.log('2. Click "SQL Editor" → "New Query"');
    console.log('3. Paste the contents of backend/schema.sql');
    console.log('4. Click "Run"');
    process.exit(1);
  }
}

createSchema();
