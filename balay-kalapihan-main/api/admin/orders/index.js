import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { limit = 50, offset = 0, status, customer } = req.query;
      
      let query = supabase.from('orders').select('*');
      
      if (status && status !== '') query = query.eq('status', status);
      if (customer && customer !== '') query = query.ilike('customer', `%${customer}%`);
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);
      
      if (error) throw error;
      res.status(200).json({ data: data || [], total: count || 0 });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
