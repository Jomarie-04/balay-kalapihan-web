import { Router } from 'express';
import { supabase } from '../database.js';
import { authenticate } from '../middleware.js';

const router = Router();

// Create order - Allow without authentication for demo
router.post('/', async (req, res) => {
  try {
    const { customer, items, total, phoneNumber, orderItems, paymentMethod, referenceNumber, pickupDate, pickupTime, subtotal, discount, tax, orderNotes, estimatedReadyTime, customerId } = req.body;

    console.log('Creating order:', { customer, items, total, phoneNumber, paymentMethod, referenceNumber, pickupDate, pickupTime, subtotal, discount, tax });

    if (!customer || items === undefined || total === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate payment method - only GCash or Maya allowed
    const validPaymentMethods = ['gcash', 'maya', 'GCash', 'Maya', 'GCASH', 'MAYA'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method. Only GCash and Maya are accepted.' });
    }

    const orderId = `ORD-${Date.now()}`;

    // Insert order - use actual column names from database
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
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
        tax: tax || null
      });

    if (orderError) {
      console.error('Order insert error:', orderError);
      return res.status(500).json({ error: 'Could not create order: ' + orderError.message });
    }

    console.log('Order created with ID:', orderId);

    // Insert order items if provided
    if (orderItems && orderItems.length > 0) {
      const itemsToInsert = orderItems.map(item => ({
        order_id: orderId,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Order items insert error:', itemsError);
      } else {
        console.log(`Inserted ${itemsToInsert.length} order items`);
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      order: { id: orderId, customer, items, total, status: 'pending' }
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (admin only)
router.get('/all', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Fetch items for all orders
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      console.log('Fetching items for orders:', orderIds);
      
      const { data: allItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          menu_item_id,
          quantity,
          price,
          notes,
          menu_items:menu_item_id(id, name, price, description, category)
        `)
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
      } else {
        console.log(`Fetched ${allItems?.length || 0} items`);
      }

      if (allItems && allItems.length > 0) {
        // Group items by order and transform them
        const itemsByOrderId = {};
        allItems.forEach(item => {
          if (!itemsByOrderId[item.order_id]) {
            itemsByOrderId[item.order_id] = [];
          }
          itemsByOrderId[item.order_id].push({
            ...item,
            item: item.menu_items,
            name: item.menu_items?.name || 'Unknown Item'
          });
        });

        console.log('Items grouped by order. Returning orders with items.');
        // Add items to orders - use 'orderItems' to avoid conflicting with existing 'items' field
        return res.json(orders.map(order => ({
          ...order,
          orderItems: itemsByOrderId[order.id] || []
        })));
      } else {
        // No items found, still return orders with empty orderItems arrays
        console.log('No items found. Returning orders with empty orderItems arrays.');
        return res.json(orders.map(order => ({
          ...order,
          orderItems: []
        })));
      }
    }

    console.log('No orders found.');
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's orders
router.get('/', authenticate, async (req, res) => {
  try {
    // Filter orders by customer name (from JWT token)
    // If fullName not in token (legacy), use username as fallback
    const customerName = req.fullName || req.username;

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer', customerName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user orders:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(orders || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .limit(1);

    if (orderError) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get order items with menu details
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        menu_item_id,
        quantity,
        price,
        notes,
        menu_items:menu_item_id(id, name, price, description, category)
      `)
      .eq('order_id', req.params.id);

    if (itemsError) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Transform items to include menu details
    const transformedItems = items?.map(item => ({
      ...item,
      item: item.menu_items,
      name: item.menu_items?.name || 'Unknown Item'
    })) || [];

    res.json({ ...order, items: transformedItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'preparing', 'ready', 'completed', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // First, get the order to check ownership
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('customer')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permissions: 
    // - Admins can change any order status
    // - Customers can only cancel their own orders
    const isOwnOrder = order.customer === req.fullName;
    const isAllowedCancellation = status === 'cancelled' && isOwnOrder;

    if (!req.isAdmin && !isAllowedCancellation) {
      return res.status(403).json({ error: 'You can only cancel your own orders' });
    }

    console.log(`Updating order ${req.params.id} status to ${status}`);

    // If cancelling, also update the cancelled_at timestamp
    const updateData = { status };
    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', req.params.id);

    if (error) {
      console.error('Order status update error:', error);
      return res.status(500).json({ error: 'Could not update order: ' + error.message });
    }

    res.json({ message: 'Order status updated', id: req.params.id, status });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete order
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log(`Deleting order ${req.params.id}`);

    // Delete order items first (optional - may not exist)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('orderid', req.params.id);

    // Don't fail if there are no items - just log if there's a real error
    if (itemsError && itemsError.code !== 'PGRST116') {
      console.error('Warning: Could not delete order items:', itemsError);
    }

    // Delete order
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', req.params.id);

    if (orderError) {
      console.error('Order delete error:', orderError);
      return res.status(500).json({ error: 'Could not delete order: ' + orderError.message });
    }

    console.log(`Order ${req.params.id} deleted successfully`);
    res.json({ message: 'Order deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
