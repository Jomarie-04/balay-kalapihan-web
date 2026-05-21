// pages/api/admin/orders.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for backend
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify admin authentication here
    
    if (req.method === 'GET') {
      const { limit = 50, offset = 0, status, customer } = req.query;
      
      let query = supabase.from('orders').select('*');
      
      if (status) {
        query = query.eq('status', status);
      }
      if (customer) {
        query = query.ilike('customer', `%${customer}%`);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Orders API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
