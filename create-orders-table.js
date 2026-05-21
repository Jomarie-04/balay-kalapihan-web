// Simple script to create the orders table via Supabase SQL
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kgppeufbtrbxrbeofyqk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncHBldWZidHJieHJiZW9meXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTczMDU2MDUsImV4cCI6MTgzMzk2MzIwNX0.e6pZL2THr9pwE4DM8Av7CvQ8phXKKXVQp-fU49RW8ik';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false
  }
});

async function createOrdersTable() {
  try {
    console.log('Creating orders table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer VARCHAR(255),
        items INTEGER,
        total INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        time VARCHAR(50),
        phone_number VARCHAR(20)
      );`
    });

    if (error) {
      console.error('Error creating table via RPC:', error);
      // Try direct SQL execution instead
      console.log('Attempting direct SQL execution...');
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(50) PRIMARY KEY,
            customer VARCHAR(255),
            items INTEGER,
            total INTEGER,
            status VARCHAR(50) DEFAULT 'pending',
            time VARCHAR(50),
            phone_number VARCHAR(20)
          );`
        })
      });
      const result = await response.json();
      console.log('Direct SQL result:', result);
    } else {
      console.log('Orders table created successfully!', data);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

createOrdersTable();
