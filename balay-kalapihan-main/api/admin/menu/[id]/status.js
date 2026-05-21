import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    
    if (req.method === 'PATCH') {
      const { status } = req.body;
      
      // Validate status values: 'available' or 'unavailable'
      if (!['available', 'unavailable'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "available" or "unavailable"' });
      }
      
      const { data, error } = await supabase
        .from('menu_items')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`Menu item ${id} status updated to: ${status}`);
      res.status(200).json(data);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
