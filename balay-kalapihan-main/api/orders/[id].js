import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authenticate(req) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      userId: decoded.userId,
      username: decoded.username,
      fullName: decoded.fullName,
      isAdmin: decoded.isAdmin,
    };
  } catch (err) {
    throw new Error('Invalid token');
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;

    // GET /api/orders/:id - Get single order with items
    if (req.method === 'GET') {
      authenticate(req);

      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .limit(1);

      if (orderError) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!orders || orders.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orders[0];

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(
          `
          id,
          order_id,
          menu_item_id,
          quantity,
          price,
          notes,
          menu_items:menu_item_id(id, name, price, description, category)
        `
        )
        .eq('order_id', id);

      if (itemsError) {
        return res.status(500).json({ error: 'Database error' });
      }

      const transformedItems =
        items?.map((item) => ({
          ...item,
          item: item.menu_items,
          name: item.menu_items?.name || 'Unknown Item',
        })) || [];

      return res.status(200).json({ ...order, items: transformedItems });
    }

    // PATCH /api/orders/:id/status - Update order status
    if (req.method === 'PATCH') {
      const user = authenticate(req);
      const { status } = req.body;

      if (
        ![
          'pending',
          'preparing',
          'ready',
          'completed',
          'confirmed',
          'cancelled',
        ].includes(status)
      ) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('customer')
        .eq('id', id)
        .single();

      if (fetchError || !order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Allow customers to only cancel pending orders
      if (order.customer !== (user.fullName || user.username) && !user.isAdmin) {
        return res
          .status(403)
          .json({ error: 'You can only modify your own orders' });
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (updateError) {
        return res
          .status(500)
          .json({ error: 'Could not update order status' });
      }

      return res.status(200).json({ message: 'Order status updated' });
    }

    // DELETE /api/orders/:id - Delete order
    if (req.method === 'DELETE') {
      const user = authenticate(req);

      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('customer, status')
        .eq('id', id)
        .single();

      if (fetchError || !order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.customer !== (user.fullName || user.username) && !user.isAdmin) {
        return res
          .status(403)
          .json({ error: 'You can only delete your own orders' });
      }

      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({ error: 'Could not delete order' });
      }

      return res.status(200).json({ message: 'Order deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);

    if (error.message === 'No token provided') {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    if (error.message === 'Invalid token') {
      return res
        .status(401)
        .json({ error: 'Authentication failed. Please login again.' });
    }

    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
