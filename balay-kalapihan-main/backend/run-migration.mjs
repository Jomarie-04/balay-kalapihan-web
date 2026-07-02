import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://kgppeufbtrbxrbeofyqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncHBldWZidHJieHJiZW9meXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTczMDU2MDUsImV4cCI6MTgzMzk2MzIwNX0.e6pZL2THr9pwE4DM8Av7CvQ8phXKKXVQp-fU49RW8ik';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running migration to add user_id column...');
    
    const migrationSql = `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;`;
    
    const { error } = await supabase.rpc('exec', { sql: migrationSql });
    
    if (error) {
      console.log('RPC exec not available. Attempting alternative approach...');
      console.log('Note: Due to Supabase client limitations, please run the following SQL in Supabase SQL Editor:');
      console.log(migrationSql);
    } else {
      console.log('✓ Migration applied successfully');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
}

runMigration();
