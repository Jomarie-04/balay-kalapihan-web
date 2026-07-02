const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres:balaykalapihan@db.kgppeufbtrbxrbeofyqk.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const sql = `
      ALTER TABLE public.orders
      ADD COLUMN IF NOT EXISTS total_amount INTEGER,
      ADD COLUMN IF NOT EXISTS subtotal_amount INTEGER,
      ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tax INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
      ADD COLUMN IF NOT EXISTS reference_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS pickup_date VARCHAR(50),
      ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(50);
    `;

    await client.query(sql);
    console.log('Payment columns added successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
