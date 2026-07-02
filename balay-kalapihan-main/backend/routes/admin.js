import { Router } from 'express';
import { authenticate } from '../middleware.js';
import { supabase } from '../database.js';
import { getAdminNotifications, addAdminNotification, clearAdminNotifications, replaceAdminNotifications } from '../notifications-store.js';
import { getLocalOrders, updateLocalOrderStatus } from '../order-store.js';
import { getOrderMetadata } from '../order-metadata-store.js';

const router = Router();

// Admin Security Data
router.get('/security', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Return mock security data
    const securityLog = {
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date().toISOString()
    };

    res.json(securityLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Sessions
router.get('/sessions', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Return mock session data
    const sessions = [
      {
        loginTime: Date.now(),
        loginDate: new Date().toLocaleDateString(),
        sessionDuration: 30 * 60 * 1000 // 30 minutes
      }
    ];

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Audit Log
router.get('/audit', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Return mock audit data
    const auditLog = [
      {
        action: 'login',
        timestamp: Date.now()
      }
    ];

    res.json(auditLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications endpoints
router.get('/notifications', authenticate, async (req, res) => {
  try {
    res.json(getAdminNotifications());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications', authenticate, async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      if (req.body.length === 0) {
        clearAdminNotifications();
        return res.json({ message: 'Notifications cleared' });
      }

      replaceAdminNotifications(req.body);
      return res.json({ message: 'Notifications saved', notifications: getAdminNotifications() });
    }

    const notification = req.body;
    if (!notification || !notification.message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    addAdminNotification(notification);
    res.json({ message: 'Notifications saved', notifications: getAdminNotifications() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all customers with their order data
router.get('/customers', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, username, email, full_name, phone_number, created_at');

    if (error) throw error;

    // Get order data for each customer to compute total spent
    const { data: orders } = await supabase
      .from('orders')
      .select('customer, total, payment_method');

    const customersWithStats = customers.map(customer => {
      // Match orders by customer field - try username, email, or full_name matching
      const customerOrders = orders?.filter(o => {
        if (!o.customer) return false;
        // Try matching with username, email, or full name (case-insensitive)
        const customerStr = o.customer.toLowerCase();
        return (
          customerStr === customer.username?.toLowerCase() ||
          customerStr === customer.email?.toLowerCase() ||
          customerStr === customer.full_name?.toLowerCase() ||
          customerStr.includes(customer.username?.toLowerCase()) ||
          customerStr.includes(customer.full_name?.split(' ')[0]?.toLowerCase())
        );
      }) || [];
      
      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const orderCount = customerOrders.length;

      return {
        id: customer.id,
        username: customer.username,
        email: customer.email,
        fullName: customer.full_name,
        phoneNumber: customer.phone_number,
        createdAt: customer.created_at,
        totalSpent,
        orderCount,
        status: 'active' // Default status - can be extended later
      };
    });

    res.json(customersWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer details with full order history
router.get('/customers/:customerId', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { customerId } = req.params;

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer', customer.username);

    if (ordersError) throw ordersError;

    res.json({
      customer,
      orders: orders || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer information
router.patch('/customers/:customerId', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { customerId } = req.params;
    const { full_name, email, phone_number } = req.body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;

    const { data: updatedCustomer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .select();

    if (error) throw error;

    res.json({ message: 'Customer updated successfully', customer: updatedCustomer?.[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a customer
router.delete('/customers/:customerId', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { customerId } = req.params;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) throw error;

    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function resolveOrderMetadataForAdmin(order) {
  const metadataFallback = await getOrderMetadata(order.id);

  return {
    paymentMethod: order.payment_method ?? order.paymentMethod ?? metadataFallback?.paymentMethod ?? null,
    referenceNumber: order.reference_number ?? order.referenceNumber ?? metadataFallback?.referenceNumber ?? null,
    paymentProofPath: order.payment_proof_path ?? order.paymentProofPath ?? metadataFallback?.paymentProofPath ?? null,
    pickupDate: order.pickup_date ?? order.pickupDate ?? metadataFallback?.pickupDate ?? null,
    pickupTime: order.pickup_time ?? order.pickupTime ?? order.time ?? metadataFallback?.pickupTime ?? null,
  };
}

// Get pending payment verifications
router.get('/payment-verifications', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const localOrders = await getLocalOrders();
    const pendingLocalOrders = localOrders.filter((order) => order.status === 'pending');
    const orderIds = new Set((orders || []).map((order) => order.id));
    const mergedOrders = [
      ...(orders || []),
      ...pendingLocalOrders.filter((order) => !orderIds.has(order.id)),
    ];

    const enrichedOrders = await Promise.all(
      mergedOrders.map(async (order) => {
        const metadata = await resolveOrderMetadataForAdmin(order);
        return {
          ...order,
          orderNumber: order.id,
          customerName: order.customer,
          totalAmount: order.total ?? order.total_amount ?? 0,
          paymentMethod: metadata.paymentMethod,
          paymentReferenceNumber: metadata.referenceNumber,
          paymentProofPath: metadata.paymentProofPath,
          pickupDate: metadata.pickupDate,
          pickupTime: metadata.pickupTime,
          createdAt: order.created_at,
          status: order.status,
        };
      })
    );

    const pendingVerifications = enrichedOrders.filter(
      (order) => order.paymentProofPath || order.paymentMethod || order.paymentReferenceNumber
    );

    res.json({
      pending: pendingVerifications,
      count: pendingVerifications.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve payment verification
router.patch('/payment-verifications/:orderId/approve', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { orderId } = req.params;

    // Update order status to 'preparing'
    // Note: payment_verified_at column doesn't exist in current schema
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'preparing'
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Also update local fallback order status if it exists
    try {
      await updateLocalOrderStatus(orderId, 'preparing');
    } catch (localError) {
      console.warn('Failed to update local fallback order status on approval:', localError?.message || localError);
    }

    // Add admin notification
    addAdminNotification({
      type: 'payment_approved',
      message: `Payment verified for order ${orderId}`,
      orderId,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true,
      message: 'Payment approved successfully',
      orderId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject payment verification
router.patch('/payment-verifications/:orderId/reject', authenticate, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { orderId } = req.params;
    const { reason } = req.body;

    // Update order status to 'cancelled' when payment is rejected
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled'
      })
      .eq('id', orderId);

    if (updateError) {
      console.warn('Supabase update failed for rejection, continuing with local fallback:', updateError.message);
    }

    // Also update local fallback order status if it exists
    try {
      await updateLocalOrderStatus(orderId, 'cancelled');
    } catch (localError) {
      console.warn('Failed to update local fallback order status:', localError?.message || localError);
    }

    addAdminNotification({
      type: 'payment_rejected',
      message: `Payment rejected for order ${orderId}: ${reason || 'Invalid proof'}`,
      orderId,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true,
      message: 'Payment rejected and order cancelled',
      orderId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
