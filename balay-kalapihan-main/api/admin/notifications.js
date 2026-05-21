import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const adminId = 'admin-placeholder'; // TODO: Get from JWT
    
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('admin_id', adminId)
        .order('timestamp', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      res.status(200).json(data || []);
    } else if (req.method === 'POST') {
      const { type, message, orderNumber, orderStatus, read } = req.body;
      
      if (!type || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          admin_id: adminId,
          type,
          message,
          order_number: orderNumber,
          order_status: orderStatus,
          read: read || false
        }])
        .select()
        .single();
      
      if (error) throw error;
      res.status(201).json(data);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
