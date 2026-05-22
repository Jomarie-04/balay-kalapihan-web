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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/orders - Get user's own orders
    if (req.method === 'GET') {
      const user = authenticate(req);
      const customerName = user.fullName || user.username;

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer', customerName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user orders:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      return res.status(200).json(orders || []);
    }

    // POST /api/orders - Create new order
    if (req.method === 'POST') {
      const {
        customer,
        items,
        total,
        phoneNumber,
        orderItems,
        paymentMethod,
        referenceNumber,
        pickupDate,
        pickupTime,
        subtotal,
        discount,
        tax,
        customerId,
      } = req.body;

      if (!customer || items === undefined || total === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const validPaymentMethods = ['gcash', 'maya', 'GCash', 'Maya', 'GCASH', 'MAYA'];
      if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          error: 'Invalid payment method. Only GCash and Maya are accepted.',
        });
      }

      const orderId = `ORD-${Date.now()}`;

      const { error: orderError } = await supabase.from('orders').insert({
        id: orderId,
        customer,
        items,
        total,
        status: 'pending',
        user_id: customerId || null,
        phone_number: phoneNumber || null,
        time: pickupTime || null,
        payment_method: paymentMethod || null,
        reference_number: referenceNumber || null,
        pickup_date: pickupDate || null,
        pickup_time: pickupTime || null,
        total_amount: total || null,
        subtotal_amount: subtotal || null,
        discount: discount || null,
        tax: tax || null,
      });

      if (orderError) {
        console.error('Order insert error:', orderError);
        return res
          .status(500)
          .json({ error: 'Could not create order: ' + orderError.message });
      }

      if (orderItems && orderItems.length > 0) {
        const itemsToInsert = orderItems.map((item) => ({
          order_id: orderId,
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || null,
        }));

        await supabase.from('order_items').insert(itemsToInsert);
      }

      return res.status(201).json({
        message: 'Order created successfully',
        orderId,
        order: { id: orderId, customer, items, total, status: 'pending' },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);

    if (error.message === 'No token provided') {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    if (error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Authentication failed. Please login again.' });
    }

    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
