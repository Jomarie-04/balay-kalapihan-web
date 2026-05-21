import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    
    if (req.method === 'POST') {
      const { status } = req.body;
      
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .or(`id.eq.${id},order_number.eq.${id}`)
        .select()
        .single();
      
      if (error) throw error;
      res.status(200).json(data);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
