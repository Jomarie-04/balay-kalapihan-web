// pages/api/admin/menu.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify admin authentication here
    
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    
    if (req.method === 'POST') {
      const { name, category, price, description } = req.body;
      
      if (!name || !category || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{ name, category, price, description, status: 'available', sales: 0 }])
        .select()
        .single();
      
      if (error) throw error;
      return res.status(201).json(data);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Menu API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
