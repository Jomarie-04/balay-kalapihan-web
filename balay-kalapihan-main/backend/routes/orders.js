import { Router } from 'express';
import { supabase } from '../database.js';
import { authenticate } from '../middleware.js';
import { addAdminNotification } from '../notifications-store.js';
import { buildOrderMetadataPayload, encodeOrderMetadataNote, decodeOrderMetadataFromNote } from '../order-metadata.js';
import { getLocalOrders, getLocalOrderById, addLocalOrder, updateLocalOrderStatus, deleteLocalOrder } from '../order-store.js';
import { sendInvoiceEmail } from '../email.js';

const router = Router();

async function resolveOrderMetadata(order) {
  const metadataFallback = await import('../order-metadata-store.js').then(({ getOrderMetadata }) => getOrderMetadata(order.id));
  return {
    paymentMethod: order.payment_method ?? metadataFallback?.paymentMethod ?? order.paymentMethod ?? null,
    referenceNumber: order.reference_number ?? metadataFallback?.referenceNumber ?? order.referenceNumber ?? null,    paymentProofPath: order.payment_proof_path ?? metadataFallback?.paymentProofPath ?? order.paymentProofPath ?? null,    pickupDate: order.pickup_date ?? metadataFallback?.pickupDate ?? order.pickupDate ?? null,
    pickupTime: order.pickup_time ?? metadataFallback?.pickupTime ?? order.pickupTime ?? order.time ?? null,
    subtotalAmount: order.subtotal_amount ?? metadataFallback?.subtotal ?? order.subtotalAmount ?? order.total,
    discount: order.discount ?? metadataFallback?.discount ?? order.discount ?? 0,
  };
}

async function ensureLocalFallbackOrder(orderId, fallbackOrder = {}) {
  if (!orderId) return null;

  const existingOrder = await getLocalOrderById(orderId);
  if (existingOrder) return existingOrder;

  const orderSnapshot = {
    id: String(orderId),
    customer: fallbackOrder.customer ?? null,
    status: fallbackOrder.status ?? 'pending',
    total: fallbackOrder.total ?? 0,
    created_at: fallbackOrder.created_at ?? fallbackOrder.createdAt ?? new Date().toISOString(),
    updated_at: fallbackOrder.updated_at ?? fallbackOrder.updatedAt ?? new Date().toISOString(),
    orderItems: Array.isArray(fallbackOrder.orderItems) ? fallbackOrder.orderItems : [],
    items: Array.isArray(fallbackOrder.orderItems) ? fallbackOrder.orderItems : [],
  };

  return addLocalOrder(orderSnapshot);
}

function normalizeOrderItems(items = []) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const resolvedItem = item?.item ?? item?.menu_items ?? item?.menuItem ?? item?.menu_item ?? null;
    const resolvedName = item?.name || resolvedItem?.name || item?.menuItemName || item?.menu_item_name || 'Unknown Item';

    return {
      ...item,
      item: resolvedItem,
      name: resolvedName,
    };
  });
}

function normalizeOrderForResponse(order, items = []) {
  const pickupDate = order.pickup_date ?? order.pickupDate ?? null;
  const pickupTime = order.pickup_time ?? order.pickupTime ?? order.time ?? null;
  const paymentMethod = order.payment_method ?? order.paymentMethod ?? null;
  const referenceNumber = order.reference_number ?? order.referenceNumber ?? null;
  const subtotalAmount = order.subtotal_amount ?? order.subtotalAmount ?? order.total;

  return {
    id: order.id,
    customer: order.customer,
    items,
    total: order.total,
    total_amount: order.total_amount ?? order.total,
    subtotal_amount: subtotalAmount,
    discount: order.discount ?? 0,
    status: order.status,
    payment_method: paymentMethod,
    reference_number: referenceNumber,
    pickup_date: pickupDate,
    pickup_time: pickupTime,
    paymentMethod,
    referenceNumber,
    pickupDate,
    pickupTime,
    subtotalAmount,
    phone_number: order.phone_number ?? null,
    created_at: order.created_at,
    updated_at: order.updated_at,
    orderItems: items,
  };
}

function getOrderTimestamp(order) {
  const rawValue = order?.created_at || order?.updated_at || order?.createdAt || order?.updatedAt;
  const timestamp = rawValue ? new Date(rawValue).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortOrdersByRecency(orders = []) {
  return [...orders].sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
}

// Create order - Allow without authentication for demo
router.post('/', async (req, res) => {
  try {
    const { customer, items, total, phoneNumber, orderItems, paymentMethod, referenceNumber, pickupDate, pickupTime, subtotal, discount, tax, orderNotes, estimatedReadyTime, customerId, customerEmail, status = 'pending', paymentProofPath } = req.body;

    console.log('Creating order:', { customer, items, total, phoneNumber, paymentMethod, referenceNumber, pickupDate, pickupTime, subtotal, discount, tax, status, paymentProofPath });

    if (!customer || items === undefined || total === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate payment method - only GCash or Maya allowed
    const validPaymentMethods = ['gcash', 'maya', 'GCash', 'Maya', 'GCASH', 'MAYA'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method. Only GCash and Maya are accepted.' });
    }

    const orderId = `ORD-${Date.now()}`;
    const metadataPayload = buildOrderMetadataPayload({
      paymentMethod,
      referenceNumber,
      paymentProofPath,
      pickupDate,
      pickupTime,
      subtotal,
      discount,
      tax,
    });

    // Try to insert into the main orders table using the columns that exist in the current schema.
    // If the payment columns are missing, we still preserve the metadata in a local fallback store.
    // Note: payment_proof_path is stored in metadata only, not as a separate column
    const insertPayload = {
      id: orderId,
      customer,
      items,
      total,
      status: status || 'pending',
      phone_number: phoneNumber || null,
    };

    let persistedOrder = null;
    const { error: orderError } = await supabase
      .from('orders')
      .insert(insertPayload);

    if (orderError) {
      console.warn('Supabase order insert failed, falling back to local order store:', orderError.message);
      persistedOrder = await import('../order-store.js').then(({ addLocalOrder }) => addLocalOrder({
        ...insertPayload,
        paymentMethod,
        referenceNumber,
        pickupDate,
        pickupTime,
        subtotalAmount: subtotal,
        discount,
        tax,
        orderItems: Array.isArray(orderItems) ? orderItems : [],
      }));
    } else {
      persistedOrder = { ...insertPayload };
      await addLocalOrder({
        ...insertPayload,
        paymentMethod,
        referenceNumber,
        pickupDate,
        pickupTime,
        subtotalAmount: subtotal,
        discount,
        tax,
        orderItems: Array.isArray(orderItems) ? orderItems : [],
      }).catch((localError) => {
        console.warn('Could not persist new order to local fallback store:', localError?.message || localError);
      });
    }

    if (!persistedOrder) {
      return res.status(500).json({ error: 'Could not create order' });
    }

    try {
      const metadataNote = encodeOrderMetadataNote(metadataPayload);
      await import('../order-metadata-store.js').then(({ persistOrderMetadata }) => persistOrderMetadata(orderId, { ...metadataPayload, metadataNote }));
    } catch (metadataError) {
      console.warn('Could not persist order metadata fallback:', metadataError);
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

    addAdminNotification({
      type: 'new_order',
      message: `New order #${orderId} from ${customer} - ₱${Number(total || 0).toLocaleString('en-PH')}`,
      orderNumber: orderId,
      orderStatus: 'pending'
    });

    if (customerEmail) {
      try {
        const invoiceItems = Array.isArray(orderItems) && orderItems.length > 0 ? orderItems : (Array.isArray(items) ? items : []);
        await sendInvoiceEmail({
          to: customerEmail,
          orderId,
          customerName: customer,
          totalAmount: Number(total || 0),
          subtotalAmount: Number(subtotal || 0),
          paymentMethod,
          referenceNumber,
          pickupDate,
          pickupTime,
          items: invoiceItems,
          createdAt: new Date().toISOString(),
        });
      } catch (invoiceError) {
        console.error('Could not send invoice email:', invoiceError);
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
      console.warn('Supabase order fetch failed for admin /all, returning local orders only:', error.message);
    }

    const localOrders = await getLocalOrders();
    const orderIds = new Set((orders || []).map((order) => order.id));
    const mergedOrders = sortOrdersByRecency([...(orders || []), ...localOrders.filter((order) => !orderIds.has(order.id))]);

    // Fetch items for all orders
    if (mergedOrders && mergedOrders.length > 0) {
      const orderIds = mergedOrders.map(o => o.id);
      console.log('Fetching items for orders:', orderIds);

      let allItems = [];
      let itemsError = null;

      if (orderIds.length > 0) {
        const itemsResponse = await supabase
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

        allItems = itemsResponse.data || [];
        itemsError = itemsResponse.error;
        if (itemsError) {
          console.error('Error fetching items:', itemsError);
        } else {
          console.log(`Fetched ${allItems.length} items`);
        }
      } else {
        console.log('No order IDs to fetch items for; using local orderItems only.');
      }

      const itemsByOrderId = {};
      if (allItems && allItems.length > 0) {
        allItems.forEach(item => {
          if (!itemsByOrderId[item.order_id]) {
            itemsByOrderId[item.order_id] = [];
          }
          itemsByOrderId[item.order_id].push(...normalizeOrderItems([{ ...item, item: item.menu_items }]));
        });
      }

      console.log('Items grouped by order. Returning orders with items.');
      const enrichedOrders = await Promise.all(mergedOrders.map(async (order) => {
        const metadata = await resolveOrderMetadata(order);
        const items = normalizeOrderItems(itemsByOrderId[order.id] || order.orderItems || order.items || []);
        return {
          ...normalizeOrderForResponse(order, items),
          orderItems: items,
          paymentMethod: metadata.paymentMethod,
          referenceNumber: metadata.referenceNumber,
          paymentProofPath: metadata.paymentProofPath,
          pickupDate: metadata.pickupDate,
          pickupTime: metadata.pickupTime,
          subtotalAmount: metadata.subtotalAmount,
          discount: metadata.discount,
        };
      }));
      return res.json(enrichedOrders);
    }

    console.log('No orders found.');
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's orders
// Get customer's orders - no auth required, can filter by customer name or query params
router.get('/', async (req, res) => {
  try {
    // Get customer name from query params or from auth token if provided
    let customerName = req.query.customer || req.query.email || req.query.phone || req.fullName || req.username || '';

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer', customerName)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase user order fetch failed, falling back to local orders:', error.message);
    }

    const localOrders = await getLocalOrders();
    const localCustomerOrders = localOrders.filter((order) => order.customer === customerName || order.customer === req.fullName || order.customer === req.username);
    const mergedOrders = sortOrdersByRecency([...(orders || []), ...localCustomerOrders]);

    // For each order, fetch its items from order_items table
    const enrichedOrders = [];
    for (const order of mergedOrders) {
      // Fetch order items
      let orderItems = [];
      if (order.orderItems && order.orderItems.length > 0) {
        orderItems = order.orderItems;
      } else {
        const { data: fetchedItems, error: itemsError } = await supabase
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
          .eq('order_id', order.id);

        if (itemsError) {
          console.error('Error fetching order items for', order.id, ':', itemsError);
          // Continue with empty items array if error
          orderItems = [];
        } else {
          orderItems = normalizeOrderItems((fetchedItems || []).map((item) => ({ ...item, item: item.menu_items })));
        }
      }

      if (Array.isArray(order.orderItems) && order.orderItems.length > 0) {
        orderItems = normalizeOrderItems(order.orderItems);
      }

      // Transform order with actual items array and preserve persisted payment/pickup details
      const metadataFallback = await import('../order-metadata-store.js').then(({ getOrderMetadata }) => getOrderMetadata(order.id));
      const paymentMethod = order.payment_method ?? metadataFallback?.paymentMethod ?? null;
      const referenceNumber = order.reference_number ?? metadataFallback?.referenceNumber ?? null;
      const pickupDate = order.pickup_date ?? metadataFallback?.pickupDate ?? null;
      const pickupTime = order.pickup_time ?? metadataFallback?.pickupTime ?? order.time ?? null;
      const subtotalAmount = order.subtotal_amount ?? metadataFallback?.subtotal ?? order.total;
      const discount = order.discount ?? metadataFallback?.discount ?? 0;

      enrichedOrders.push({
        ...normalizeOrderForResponse(order, orderItems || []),
        subtotal_amount: subtotalAmount,
        discount,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        paymentProofPath: metadata.paymentProofPath,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        paymentMethod,
        referenceNumber,
        pickupDate,
        pickupTime,
      });
    }

    res.json(enrichedOrders);
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

    let order;
    if (orderError) {
      console.warn('Supabase order fetch failed for order id', req.params.id, ':', orderError.message);
    }

    if (orders && orders.length > 0) {
      order = orders[0];
    } else {
      order = await getLocalOrderById(req.params.id);
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items with menu details
    let items = [];
    let itemsError = null;

    try {
      const itemsResponse = await supabase
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

      items = itemsResponse.data || [];
      itemsError = itemsResponse.error;
    } catch (err) {
      itemsError = err;
    }

    let transformedItems = [];
    if (itemsError) {
      console.warn('Order items fetch failed for', req.params.id, ':', itemsError?.message || itemsError);
      transformedItems = order.orderItems || order.items || [];
    } else {
      transformedItems = items.map(item => ({
        ...item,
        item: item.menu_items,
        name: item.menu_items?.name || 'Unknown Item'
      }));
    }

    const metadata = await resolveOrderMetadata(order);
    res.json({
      ...order,
      items: transformedItems,
      paymentMethod: metadata.paymentMethod,
      referenceNumber: metadata.referenceNumber,
      paymentProofPath: metadata.paymentProofPath,
      pickupDate: metadata.pickupDate,
      pickupTime: metadata.pickupTime,
      subtotalAmount: metadata.subtotalAmount,
      discount: metadata.discount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedOrderId = String(req.params.id || '').trim().replace(/^#/, '');

    if (!['pending', 'preparing', 'ready', 'completed', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // First, get the order to check ownership
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('customer, total, status, created_at, updated_at')
      .eq('id', normalizedOrderId)
      .single();

    let targetOrder = order;
    if (fetchError || !order) {
      targetOrder = await getLocalOrderById(normalizedOrderId);
    }

    if (!targetOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await ensureLocalFallbackOrder(normalizedOrderId, {
      customer: targetOrder.customer ?? null,
      total: targetOrder.total ?? 0,
      status: targetOrder.status ?? 'pending',
      created_at: targetOrder.created_at ?? null,
      updated_at: targetOrder.updated_at ?? null,
    });

    // Check permissions:
    // - Admins can change any order status
    // - Customers can cancel their own orders
    const normalizedCustomerName = String(targetOrder.customer || '').trim();
    const currentUserName = String(req.fullName || req.username || req.user?.fullName || req.user?.username || '').trim();
    const isOwnOrder = normalizedCustomerName === currentUserName || normalizedCustomerName.toLowerCase() === currentUserName.toLowerCase();
    const isAllowedCancellation = status === 'cancelled' && (req.isAdmin || isOwnOrder || !currentUserName);

    if (!req.isAdmin && !isAllowedCancellation) {
      return res.status(403).json({ error: 'You can only cancel your own orders' });
    }

    console.log(`Updating order ${normalizedOrderId} status to ${status}`);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', normalizedOrderId);

      if (error) {
        throw error;
      }

      return res.json({ message: 'Order status updated', id: normalizedOrderId, status });
    } catch (error) {
      console.warn('Supabase order status update failed, applying to local fallback order:', error.message);
      const updatedLocal = await updateLocalOrderStatus(normalizedOrderId, status);
      if (updatedLocal) {
        return res.json({ message: 'Order status updated locally', id: req.params.id, status });
      }
      return res.status(500).json({ error: 'Could not update order: ' + error.message });
    }
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
      .eq('order_id', req.params.id);

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
      console.warn('Supabase order delete failed, deleting local fallback order if present:', orderError.message);
      const deletedLocal = await deleteLocalOrder(req.params.id);
      if (deletedLocal) {
        return res.json({ message: 'Order deleted locally', id: req.params.id });
      }
      console.error('Order delete error:', orderError);
      return res.status(500).json({ error: 'Could not delete order: ' + orderError.message });
    }

    await deleteLocalOrder(req.params.id);

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
