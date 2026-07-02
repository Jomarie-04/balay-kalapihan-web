import { useState, useEffect, useRef } from 'react';
import { LogOut, Plus, Edit2, Trash2, Package, AlertCircle, Search, Lock, Clock, AlertTriangle, TrendingUp, DollarSign, CheckCircle2, Bell, X, Menu, MoreVertical, RefreshCw, Loader2, Eye, ImageIcon } from 'lucide-react';
import { api } from '../../services/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface Order {
  id?: string;
  orderNumber?: string;
  customer: string;
  items?: any[];
  totalAmount?: number;
  total?: number;
  paymentMethod?: string;
  referenceNumber?: string;
  pickupDate?: string;
  pickupTime?: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'confirmed' | 'cancelled';
  time?: string;
  createdAt?: Date;
}

interface MenuItem {
  id: string | number;
  name: string;
  category: string;
  price: number;
  status: 'available' | 'unavailable';
  sales: number;
  image?: string | null;
  description?: string | null;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

interface AdminSession {
  loginTime: number;
  loginDate: string;
  sessionDuration: number;
}

interface AdminAudit {
  action: string;
  timestamp: number;
  sessionDuration?: number;
}

interface Notification {
  id: string;
  type: 'new_order' | 'order_status' | 'menu_alert';
  message: string;
  orderNumber?: string;
  orderStatus?: string;
  timestamp: number;
  read: boolean;
}

const getPaymentMethodDisplay = (order: any) => {
  const rawValue = order?.paymentMethod || order?.paymentmethod || order?.payment_method || '';
  if (!rawValue) return 'GCash';

  const value = String(rawValue).trim();
  if (!value) return 'GCash';

  const normalized = value.toLowerCase();
  if (normalized === 'maya' || normalized === 'paymaya' || normalized === 'pay maya') return 'Maya';
  if (normalized === 'gcash') return 'GCash';

  return value;
};

const getReferenceNumberDisplay = (order: any) => {
  return order?.referenceNumber || order?.referencenumber || order?.reference_number || '';
};

const getOrderPickupDateDisplay = (order: any) => {
  return order?.pickupDate || order?.pickup_date || order?.pickupdate || 'N/A';
};

const getOrderPickupTimeDisplay = (order: any) => {
  return order?.pickupTime || order?.pickup_time || order?.pickuptime || 'N/A';
};

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [view, setView] = useState<'overview' | 'orders' | 'menu' | 'security' | 'analytics' | 'users' | 'category' | 'products' | 'revenue' | 'payment-verifications'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', price: '', description: '', imageFile: null as File | null, imageUrl: '' });
  const [previewImage, setPreviewImage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [showOrderItemsModal, setShowOrderItemsModal] = useState(false);
  const [adminSessions, setAdminSessions] = useState<AdminSession[]>([]);
  const [adminAudit, setAdminAudit] = useState<AdminAudit[]>([]);
  const [securityLog, setSecurityLog] = useState<any>(null);
  const [analyticsRange, setAnalyticsRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const previousOrderIdsRef = useRef<string[]>([]);
  const [previousMenuStatus, setPreviousMenuStatus] = useState<{ [key: string]: string }>({});
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({ manage: true });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orderFilterStartDate, setOrderFilterStartDate] = useState<string>('');
  const [orderFilterEndDate, setOrderFilterEndDate] = useState<string>('');
  
  // Customer management states
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSortBy, setCustomerSortBy] = useState<'name' | 'orders' | 'spent' | 'date'>('name');
  const [customerFilterDateStart, setCustomerFilterDateStart] = useState<string>('');
  const [customerFilterDateEnd, setCustomerFilterDateEnd] = useState<string>('');
  const [customerFilterMinOrders, setCustomerFilterMinOrders] = useState<number | ''>('');
  const [customerFilterStatus, setCustomerFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<any>(null);
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  // Payment verification states
  const [pendingPaymentVerifications, setPendingPaymentVerifications] = useState<any[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [editingCustomerData, setEditingCustomerData] = useState<any>(null);

  useEffect(() => {
    loadOrders();
    loadMenuItems();
    loadSecurityData();
    loadNotifications();
    loadCustomers();
    loadPaymentVerifications();
    
    // TODO: Replace polling with Supabase Realtime subscriptions
    // Temporary 5-second polling for live updates (exclude payment verifications - only load when viewing that page)
    const interval = setInterval(() => {
      loadOrders();
      loadSecurityData();
      // Payment verifications will be polled only when viewing that specific page
    }, 5000);

    // Listen for storage events (e.g., customer cancelling order from different tab/window)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'adminAllOrders' && event.newValue) {
        try {
          const updatedOrders = JSON.parse(event.newValue);
          console.log('[ADMIN_SYNC] Detected order change from customer cancellation:', updatedOrders);
          setOrders(Array.isArray(updatedOrders) ? updatedOrders : []);
        } catch (e) {
          console.error('[ADMIN_SYNC] Error parsing updated orders:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update menu item sales based on completed orders
  useEffect(() => {
    if (orders.length > 0 && menuItems.length > 0) {
      const updatedMenuItems = menuItems.map(item => {
        const completedOrders = orders.filter(o => o.status === 'completed');
        const itemSales = completedOrders.reduce((total, order) => {
          const orderItems = order.orderItems || order.items || [];
          if (Array.isArray(orderItems)) {
            const orderItemSales = orderItems.reduce((sum: number, orderItem: any) => {
              if ((orderItem.item?.id || orderItem.id) === item.id) {
                return sum + (orderItem.quantity || 1);
              }
              return sum;
            }, 0);
            return total + orderItemSales;
          }
          return total;
        }, 0);
        
        return { ...item, sales: itemSales };
      });
      
      setMenuItems(updatedMenuItems);
    }
  }, [orders]);

  // Detect new orders and status changes
  useEffect(() => {
    const currentOrderIds = orders
      .map(order => String(order.orderNumber || order.id || ''))
      .filter(Boolean);

    if (previousOrderIdsRef.current.length === 0) {
      previousOrderIdsRef.current = currentOrderIds;
      console.log('[NOTIFICATIONS] Initial load. Total orders:', orders.length);
      return;
    }

    const newOrderIds = currentOrderIds.filter(id => !previousOrderIdsRef.current.includes(id));

    if (newOrderIds.length > 0) {
      console.log('[NOTIFICATIONS] New orders detected:', newOrderIds.length);

      newOrderIds.forEach(id => {
        const order = orders.find(candidate => String(candidate.orderNumber || candidate.id || '') === id);
        if (!order || (!order.orderNumber && !order.id)) return;

        const notification: Notification = {
          id: `new_${order.orderNumber || order.id}_${Date.now()}`,
          type: 'new_order',
          message: `🎉 New order #${order.orderNumber || order.id} from ${order.customer} - ₱${(order.totalAmount || order.total || 0).toLocaleString('en-PH')}`,
          orderNumber: order.orderNumber || order.id,
          timestamp: Date.now(),
          read: false
        };

        console.log('[NOTIFICATIONS] Adding new order notification:', notification.message);

        setNotifications(prev => {
          const updated = [notification, ...prev];
          saveNotifications(updated);
          return updated;
        });
      });
    }

    previousOrderIdsRef.current = currentOrderIds;
  }, [orders]);

  // Detect menu status changes
  useEffect(() => {
    const currentStatus: { [key: string]: string } = {};
    menuItems.forEach(item => {
      currentStatus[String(item.id)] = item.status;
    });

    // Check for changes in status
    if (Object.keys(previousMenuStatus).length > 0) {
      Object.entries(currentStatus).forEach(([itemId, status]) => {
        const previousStatus = previousMenuStatus[itemId];
        
        if (previousStatus !== undefined && previousStatus !== status) {
          const item = menuItems.find(m => String(m.id) === itemId);
          if (!item) return;

          const notification: Notification = {
            id: `menu_${itemId}_${Date.now()}`,
            type: 'menu_alert',
            message: status === 'available' 
              ? `📦 "${item.name}" is now available!`
              : `❌ "${item.name}" is no longer available`,
            timestamp: Date.now(),
            read: false
          };

          console.log('[NOTIFICATIONS] Menu status changed:', notification.message);

          setNotifications(prev => {
            const updated = [notification, ...prev];
            saveNotifications(updated);
            return updated;
          });
        }
      });
    }

    setPreviousMenuStatus(currentStatus);
  }, [menuItems]);

  // Load payment verifications when navigating to that view
  // Also set up polling for payment verifications only on this page
  useEffect(() => {
    if (view === 'payment-verifications') {
      loadPaymentVerifications();
      
      // Poll payment verifications every 1 minute while viewing this page
      const verificationInterval = setInterval(() => {
        loadPaymentVerifications();
      }, 60000);
      
      return () => clearInterval(verificationInterval);
    }
  }, [view]);



  const loadOrders = async () => {
    try {
      const backendOrders = await api.getAllOrders();
      const sortedOrders = Array.isArray(backendOrders)
        ? [...backendOrders].sort((a, b) => {
            const aTime = new Date(a?.created_at || a?.updated_at || 0).getTime();
            const bTime = new Date(b?.created_at || b?.updated_at || 0).getTime();
            return bTime - aTime;
          })
        : [];
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error loading orders from backend:', error);
      setOrders([]);
    }
  };

  const loadMenuItems = async () => {
    try {
      const backendMenu = await api.getMenu();
      setMenuItems(Array.isArray(backendMenu) ? backendMenu : []);
    } catch (error) {
      console.error('Error loading menu items from backend:', error);
      setMenuItems([]);
    }
  };

  const loadSecurityData = async () => {
    try {
      // Fetch from backend instead of localStorage
      const [sessions, audit, security] = await Promise.all([
        api.getAdminSessions?.() ?? Promise.resolve([]),
        api.getAuditLog?.() ?? Promise.resolve([]),
        api.getSecurityLog?.() ?? Promise.resolve(null)
      ]);
      
      setAdminSessions(Array.isArray(sessions) ? sessions.slice(-10) : []);
      setAdminAudit(Array.isArray(audit) ? audit.slice(-50) : []);
      setSecurityLog(security || null);
    } catch (error) {
      console.error('Error loading security data:', error);
      // Set defaults if error occurs
      setAdminSessions([]);
      setAdminAudit([]);
      setSecurityLog(null);
    }
  };

  const loadPaymentVerifications = async () => {
    try {
      setLoadingVerifications(true);
      const response = await api.getPendingPaymentVerifications();
      setPendingPaymentVerifications(response.pending || []);
    } catch (error) {
      console.error('Error loading payment verifications:', error);
      setPendingPaymentVerifications([]);
    } finally {
      setLoadingVerifications(false);
    }
  };

  const apiBaseUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : '/api');

  const approvePayment = async (orderId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/admin/payment-verifications/${orderId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        }
      });

      if (response.ok) {
        alert('Payment approved successfully');
        loadPaymentVerifications(); // Refresh the list
        loadOrders(); // Refresh orders to show updated status
      } else {
        alert('Failed to approve payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Error approving payment');
    }
  };

  const rejectPayment = async (orderId: string, reason: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/admin/payment-verifications/${orderId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Payment rejected - customer will be notified');
        loadPaymentVerifications(); // Refresh the list
        loadOrders(); // Refresh orders
      } else {
        alert('Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Error rejecting payment');
    }
  };

  const loadNotifications = async () => {
    try {
      const notifs = await api.getNotifications?.() ?? [];
      if (Array.isArray(notifs)) {
        setNotifications(notifs.slice(-20));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const saveNotifications = async (notifs: Notification[]) => {
    try {
      const toSave = notifs.slice(-20);
      await api.saveNotifications?.(toSave);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      saveNotifications(updated);
      return updated;
    });
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      await api.saveNotifications?.([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const backendCustomers = await api.getAllCustomers();
      setCustomers(Array.isArray(backendCustomers) ? backendCustomers : []);
    } catch (error) {
      console.error('Error loading customers from backend:', error);
      setCustomers([]);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await api.deleteCustomer(customerId);
        setCustomers(customers.filter(c => c.id !== customerId));
        alert('Customer deleted successfully');
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer. Please try again.');
      }
    }
  };

  const viewCustomerDetails = async (customerId: string) => {
    try {
      const details = await api.getCustomerDetails(customerId);
      setSelectedCustomerDetails(details);
      setShowCustomerDetailsModal(true);
    } catch (error) {
      console.error('Error loading customer details:', error);
      alert('Failed to load customer details');
    }
  };

  const startEditingCustomer = () => {
    if (selectedCustomerDetails?.customer) {
      setEditingCustomerData({
        full_name: selectedCustomerDetails.customer.full_name || '',
        email: selectedCustomerDetails.customer.email || '',
        phone_number: selectedCustomerDetails.customer.phone_number || ''
      });
      setIsEditingCustomer(true);
    }
  };

  const saveCustomerChanges = async () => {
    try {
      if (!selectedCustomerDetails?.customer?.id || !editingCustomerData) return;
      
      await api.updateCustomer(selectedCustomerDetails.customer.id, editingCustomerData);
      
      // Update local state
      const updatedCustomer = {
        ...selectedCustomerDetails.customer,
        ...editingCustomerData
      };
      setSelectedCustomerDetails({
        ...selectedCustomerDetails,
        customer: updatedCustomer
      });
      
      // Update customers list
      setCustomers(customers.map(c => 
        c.id === selectedCustomerDetails.customer.id 
          ? { ...c, ...editingCustomerData }
          : c
      ));
      
      setIsEditingCustomer(false);
      alert('Customer information updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer information');
    }
  };

  const cancelEditingCustomer = () => {
    setIsEditingCustomer(false);
    setEditingCustomerData(null);
  };




  const getOrderItems = (order: Order | null | undefined) => {
    if (!order) return [];
    const rawItems = (order as any).orderItems ?? (order as any).items ?? [];
    return Array.isArray(rawItems) ? rawItems : [];
  };

  const openOrderItemsModal = (order: Order) => {
    setSelectedOrderForModal(order);
    setShowOrderItemsModal(true);
  };

  const closeOrderItemsModal = () => {
    setShowOrderItemsModal(false);
    setSelectedOrderForModal(null);
  };

  const deleteOrder = async (orderRef: string) => {
    if (confirm('Delete this order?')) {
      try {
        await api.deleteOrder?.(orderRef);
        setOrders(orders.filter(o => o.id !== orderRef && o.orderNumber !== orderRef));
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  const updateOrderStatus = async (orderRef: string, status: Order['status']) => {
    try {
      const normalizedOrderRef = String(orderRef || '').trim().replace(/^#/, '');
      const matchingOrder = orders.find((order) => {
        const currentId = String(order.id || '').trim().replace(/^#/, '');
        const currentOrderNumber = String(order.orderNumber || '').trim().replace(/^#/, '');
        return currentId === normalizedOrderRef || currentOrderNumber === normalizedOrderRef;
      });
      const targetOrderId = String(matchingOrder?.id || normalizedOrderRef || orderRef).trim();

      await api.updateOrderStatus?.(targetOrderId, status);
      const updatedOrders = orders.map((order) => {
        const currentId = String(order.id || '').trim().replace(/^#/, '');
        const currentOrderNumber = String(order.orderNumber || '').trim().replace(/^#/, '');
        return currentId === targetOrderId || currentOrderNumber === normalizedOrderRef
          ? { ...order, status }
          : order;
      });
      setOrders(updatedOrders);
      
      // Broadcast update to customer localStorage so they see the change immediately
      const customerStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('userOrders_'));
      customerStorageKeys.forEach((customerKey) => {
        try {
          const existingOrders = localStorage.getItem(customerKey);
          if (!existingOrders) return;

          const parsed = JSON.parse(existingOrders);
          if (!Array.isArray(parsed)) return;

          const updated = parsed.map((order: any) => {
            const currentId = String(order.id || '').trim().replace(/^#/, '');
            const currentOrderNumber = String(order.orderNumber || '').trim().replace(/^#/, '');
            return currentId === targetOrderId || currentOrderNumber === normalizedOrderRef
              ? { ...order, status }
              : order;
          });

          const hasChanges = JSON.stringify(parsed) !== JSON.stringify(updated);
          if (hasChanges) {
            localStorage.setItem(customerKey, JSON.stringify(updated));
            console.log(`[ADMIN_BROADCAST] Updated order ${orderRef} status to ${status} in ${customerKey}`);
          }
        } catch (e) {
          console.warn(`[ADMIN_BROADCAST] Failed to update customer localStorage for ${customerKey}:`, e);
        }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const deleteMenuItem = async (itemId: string | number) => {
    if (confirm('Delete this menu item?')) {
      try {
        await api.deleteMenuItem?.(itemId);
        setMenuItems(menuItems.filter(i => i.id !== itemId));
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Failed to delete menu item. Please try again.');
      }
    }
  };

  const toggleStatus = async (itemId: number | string) => {
    try {
      const item = menuItems.find(i => i.id === itemId);
      if (!item) return;
      
      const newStatus = item.status === 'unavailable' ? 'available' : 'unavailable';
      
      // Try API call first
      try {
        await api.updateMenuItemStatus?.(String(itemId), newStatus);
        console.log(`Status updated via API: ${itemId} -> ${newStatus}`);
        const existing = localStorage.getItem('menuItemStatus');
        const updates = existing ? JSON.parse(existing) : {};
        updates[String(itemId)] = newStatus;
        localStorage.setItem('menuItemStatus', JSON.stringify(updates));
      } catch (apiError) {
        console.warn('API not available, using local storage:', apiError);
        // Fallback: Use localStorage when API is not available (e.g., backend not running)
        const menuStatus: { [key: string]: string } = {};
        menuStatus[String(itemId)] = newStatus;
        const existing = localStorage.getItem('menuItemStatus');
        const updates = existing ? JSON.parse(existing) : {};
        const allUpdates = { ...updates, ...menuStatus };
        localStorage.setItem('menuItemStatus', JSON.stringify(allUpdates));
        console.log(`Status updated via localStorage: ${itemId} -> ${newStatus}`);
      }
      
      // Broadcast availability change to other tabs
      localStorage.setItem(
        'menuAvailability',
        JSON.stringify({
          itemId: String(itemId),
          name: item.name,
          status: newStatus,
          updatedAt: Date.now(),
        }),
      );
      
      // Update UI immediately
      setMenuItems(menuItems.map(i => 
        i.id === itemId ? { ...i, status: newStatus } : i
      ));
      
      // Show success notification
      const notification: Notification = {
        id: `status_${itemId}_${Date.now()}`,
        type: 'menu_alert',
        message: `✅ "${item.name}" status changed to ${newStatus.toUpperCase()}`,
        timestamp: Date.now(),
        read: false
      };
      setNotifications(prev => [notification, ...prev]);
      
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update item status. Please try again.');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'preparing':
        return 'bg-cyan-100 text-cyan-700';
      case 'ready':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-purple-100 text-purple-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const getStatusCount = (status: Order['status']) => orders.filter(o => o.status === status).length;
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer.toLowerCase().includes(searchQuery.toLowerCase()) || (o.id?.includes(searchQuery)) || (o.orderNumber?.includes(searchQuery));
    
    if (!matchesSearch) return false;
    
    // Date filter logic
    if (orderFilterStartDate || orderFilterEndDate) {
      const orderDate = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : null;
      
      if (orderFilterStartDate && orderDate && orderDate < orderFilterStartDate) return false;
      if (orderFilterEndDate && orderDate && orderDate > orderFilterEndDate) return false;
    }
    
    return true;
  });

  const handleSaveMenuItem = async () => {
    const name = formData.name?.trim();
    const category = formData.category?.trim();
    const priceValue = formData.price?.toString().trim();
    const numericPrice = Number(priceValue);
    const priceIsValid = priceValue !== '' && !Number.isNaN(numericPrice) && numericPrice > 0;

    if (!name || !category || !priceIsValid) {
      alert('Please fill in all required fields and enter a valid price');
      return;
    }

    try {
      const payload = new FormData();
      payload.append('name', name);
      payload.append('category', category);
      payload.append('price', String(numericPrice));
      if (formData.description) payload.append('description', formData.description);
      if (formData.imageFile) payload.append('image', formData.imageFile);

      if (editingItem) {
        // Update existing item
        const updatedItem = await api.updateMenuItem?.(editingItem.id, payload);
        if (updatedItem) {
          setMenuItems(menuItems.map(i => i.id === editingItem.id ? { ...i, ...updatedItem } : i));
        }
      } else {
        // Create new item
        const newItem = await api.createMenuItem?.(payload);
        if (newItem) {
          setMenuItems([...menuItems, newItem]);
        }
      }

      setShowMenuItemModal(false);
      setFormData({ name: '', category: '', price: 0, description: '', imageFile: null, imageUrl: '' });
      setPreviewImage('');
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      alert(`Failed to save menu item. ${error?.message || 'Please try again.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-0'
      } bg-muted border-r border-primary/20 flex flex-col h-screen sticky top-0 transition-all duration-300 overflow-hidden`}>
        {/* Logo */}
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <img 
              src="/images/kipin-logo.png" 
              alt="Balay Kalapihan Logo" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-lg font-bold text-foreground">Admin</h1>
          </div>
        </div>



        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* BASIC Section */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">BASIC</p>
            <div className="space-y-2">
              <button
                onClick={() => setView('overview')}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 text-sm ${
                  view === 'overview' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <span>📊</span>
                Dashboard
              </button>
              <button
                onClick={() => setView('users')}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 text-sm ${
                  view === 'users' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <span>👥</span>
                Registered Users
              </button>
            </div>
          </div>

          {/* MANAGE Section */}
          <div>
            <button
              onClick={() => setExpandedMenus(prev => ({ ...prev, manage: !prev.manage }))}
              className="w-full text-left px-4 py-2 flex items-center justify-between group"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">MANAGE</p>
              <span className={`text-muted-foreground transition-transform ${expandedMenus.manage ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {expandedMenus.manage && (
              <div className="space-y-2 mt-3">
                <button
                  onClick={() => setView('products')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 text-sm ml-2 ${
                    view === 'products' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <span>☕</span>
                  Menu
                </button>
                <button
                  onClick={() => setView('orders')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 text-sm ml-2 ${
                    view === 'orders' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <span>📋</span>
                  Orders
                </button>
                <button
                  onClick={() => {
                    setView('payment-verifications');
                    loadPaymentVerifications();
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 text-sm ml-2 ${
                    view === 'payment-verifications' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <span>💳</span>
                  Payment Verifications
                  {pendingPaymentVerifications.length > 0 && (
                    <span className="ml-auto bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                      {pendingPaymentVerifications.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Other Items */}
          <div className="space-y-2">
            <button
              onClick={() => setView('revenue')}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 text-sm ${
                view === 'revenue' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <span>💰</span>
              Revenue
            </button>
            <button
              onClick={() => setView('security')}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 text-sm ${
                view === 'security' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <span>🔒</span>
              Security
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary/20 space-y-2">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 text-xs font-semibold transition-all relative"
          >
            <Bell className="w-4 h-4" />
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1 right-1 bg-destructive text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 text-xs font-semibold transition-all"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {/* Notifications Panel */}
        {showNotifications && (
          <div className="absolute top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-card border border-primary/20 rounded-2xl shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-primary/15 flex justify-between items-center bg-muted/40">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground/60">
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications
                    .slice()
                    .reverse()
                    .map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b border-primary/10 last:border-b-0 cursor-pointer transition-all hover:bg-muted/40 ${
                          !notif.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notif.id)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-semibold text-foreground ${notif.read ? 'opacity-70' : ''}`}>
                              {notif.message}
                            </p>
                            {notif.orderNumber && (
                              <p className="text-xs text-muted-foreground mt-1">Order: {notif.orderNumber}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5"></div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-3 border-t border-primary/15 bg-muted/40">
                <button
                  onClick={() => clearAllNotifications()}
                  className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-primary/10 transition-all"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Click outside to close notifications */}
        {showNotifications && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          ></div>
        )}
        {/* Top Header */}
        <header className="bg-muted border-b border-primary/20 p-4 sm:p-6 flex justify-between items-center fixed top-0 left-0 right-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-primary/10 rounded-lg transition-all lg:hidden"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-primary" />
            </button>
            <img 
              src="/images/kipin-logo.png" 
              alt="Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
            />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground capitalize">
              {view === 'overview' ? 'Dashboard' : view === 'users' ? 'Registered Users' : view === 'products' ? 'Menu' : view === 'revenue' ? 'Revenue' : view.charAt(0).toUpperCase() + view.slice(1)}
            </h2>
          </div>
        </header>

        {/* Content */}
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pt-28 sm:pt-32 lg:pt-20">

        {view === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <p className="text-muted-foreground text-xs sm:text-sm">Total Orders</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">{orders.length}</p>
              </div>
              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <p className="text-muted-foreground text-xs sm:text-sm">Total Revenue</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-accent line-clamp-2">₱{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 0 })}</p>
              </div>
              <div className="hidden sm:block bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <p className="text-muted-foreground text-xs sm:text-sm">Pending</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-yellow-600">{getStatusCount('pending')}</p>
              </div>
              <div className="hidden lg:block bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <p className="text-muted-foreground text-xs sm:text-sm">Preparing</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-600">{getStatusCount('preparing')}</p>
              </div>
            </div>

            <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6 overflow-x-auto">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">Recent Orders</h2>
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-primary/15">
                    <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground font-semibold text-xs sm:text-sm">ID</th>
                    <th className="hidden sm:table-cell text-left py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground font-semibold">Customer</th>
                    <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground font-semibold text-xs sm:text-sm">Total</th>
                    <th className="hidden md:table-cell text-left py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground font-semibold">Payment</th>
                    <th className="hidden lg:table-cell text-left py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground font-semibold">Pickup Time</th>
                    <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground font-semibold text-xs sm:text-sm">Status</th>
                    <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground font-semibold text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(o => (
                      <tr key={o.orderNumber || o.id} className="border-b border-primary/10 hover:bg-muted/40">
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-foreground text-xs sm:text-sm">#{o.orderNumber || o.id}</td>
                        <td className="hidden sm:table-cell py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground">{o.customer}</td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-accent text-xs sm:text-sm">₱{(o.totalAmount || o.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="hidden md:table-cell py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground text-xs sm:text-sm">{getPaymentMethodDisplay(o)}</td>
                        <td className="hidden lg:table-cell py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground text-xs sm:text-sm">{`${getOrderPickupDateDisplay(o)} ${getOrderPickupTimeDisplay(o)}`}</td>
                        <td className={`py-2 px-2 sm:py-3 sm:px-4 font-semibold rounded text-xs sm:text-sm ${getStatusColor(o.status)}`}>{o.status.toUpperCase()}</td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4">
                          <button
                            type="button"
                            onClick={() => openOrderItemsModal(o)}
                            className="text-primary hover:text-primary/80 text-xs font-medium px-2 py-1 rounded border border-primary/30 hover:bg-primary/10"
                          >
                            View Items
                          </button>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'orders' && (
          <div className="space-y-6">
            <div className="bg-card border border-primary/15 rounded-2xl p-6 space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3 bg-muted border border-primary/15 rounded-lg px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by customer name or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
              
              {/* Date Filter */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1">
                  <label className="text-sm font-semibold text-foreground block mb-2">Start Date</label>
                  <input
                    type="date"
                    value={orderFilterStartDate}
                    onChange={(e) => setOrderFilterStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-semibold text-foreground block mb-2">End Date</label>
                  <input
                    type="date"
                    value={orderFilterEndDate}
                    onChange={(e) => setOrderFilterEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground"
                  />
                </div>
                <button
                  onClick={() => {
                    setOrderFilterStartDate('');
                    setOrderFilterEndDate('');
                  }}
                  className="px-4 py-2 bg-muted hover:bg-muted/70 text-foreground rounded-lg transition-all text-sm font-medium"
                >
                  Clear Dates
                </button>
              </div>
            </div>

            <div className="bg-card border border-primary/15 rounded-2xl p-6 overflow-x-auto">
              <h2 className="text-xl font-bold text-foreground mb-4">All Orders {searchQuery && `(${filteredOrders.length} results)`}</h2>
              <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/15">
                  <th className="text-left py-3 px-4 text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Customer</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Total</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Payment</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Pickup Date</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Pickup Time</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 px-4 text-center text-muted-foreground/60">No orders found</td>
                  </tr>
                ) : (
                  filteredOrders.map(o => (
                      <tr key={o.orderNumber || o.id} className="border-b border-primary/10 hover:bg-muted/40">
                        <td className="py-3 px-4 text-foreground">#{o.orderNumber || o.id}</td>
                        <td className="py-3 px-4 text-muted-foreground">{o.customer}</td>
                        <td className="py-3 px-4 text-accent">₱{(o.totalAmount || o.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">{getPaymentMethodDisplay(o)} {getReferenceNumberDisplay(o) && `(${getReferenceNumberDisplay(o)})`}</td>
                        <td className="py-3 px-4 text-muted-foreground">{getOrderPickupDateDisplay(o)}</td>
                        <td className="py-3 px-4 text-muted-foreground">{getOrderPickupTimeDisplay(o)}</td>
                        <td className="py-3 px-4">
                          <select value={o.status} onChange={e => updateOrderStatus(o.id || o.orderNumber || '', e.target.value as any)} className={`px-3 py-1 rounded text-sm font-semibold border-0 ${getStatusColor(o.status)}`}>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => openOrderItemsModal(o)}
                            className="text-primary hover:text-primary/80 text-xs font-medium px-2 py-1 rounded border border-primary/30 hover:bg-primary/10"
                          >
                            View Items
                          </button>
                          <button type="button" onClick={() => deleteOrder(o.orderNumber || o.id || '')} className="text-destructive hover:text-destructive/70">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {showOrderItemsModal && selectedOrderForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-primary/15 bg-card p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Order Details</p>
                  <h3 className="text-xl font-bold text-foreground">#{selectedOrderForModal.orderNumber || selectedOrderForModal.id}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrderForModal.customer}</p>
                </div>
                <button
                  type="button"
                  onClick={closeOrderItemsModal}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Close order items"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 grid gap-3 rounded-xl border border-primary/10 bg-muted/20 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold text-accent">₱{(selectedOrderForModal.totalAmount || selectedOrderForModal.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
                  <p className="text-sm text-foreground">{getPaymentMethodDisplay(selectedOrderForModal)} {getReferenceNumberDisplay(selectedOrderForModal) && `(${getReferenceNumberDisplay(selectedOrderForModal)})`}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pickup</p>
                  <p className="text-sm text-foreground">{`${getOrderPickupDateDisplay(selectedOrderForModal)} ${getOrderPickupTimeDisplay(selectedOrderForModal)}`}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="text-sm font-semibold capitalize text-foreground">{selectedOrderForModal.status}</p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/10 bg-background/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-foreground">Items ({getOrderItems(selectedOrderForModal).length})</h4>
                  <span className="text-sm text-muted-foreground">Review the selected order contents</span>
                </div>

                <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                  {getOrderItems(selectedOrderForModal).length === 0 ? (
                    <div className="rounded-lg border border-dashed border-primary/15 bg-muted/20 p-4 text-sm text-muted-foreground">
                      No items were attached to this order.
                    </div>
                  ) : (
                    getOrderItems(selectedOrderForModal).map((item: any, idx: number) => (
                      <div key={idx} className="rounded-lg border border-primary/10 bg-muted/30 p-3">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <span className="font-medium text-foreground">{item.quantity}x {item.item?.name || item.name || 'Item'}</span>
                          <span className="text-sm font-semibold text-accent">₱{((item.item?.price || item.price || 0) * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="space-y-1">
                          {item.customization?.size && (
                            <p className="text-xs text-muted-foreground">Size: {item.customization.size}</p>
                          )}
                          {item.customization?.sugarLevel && (
                            <p className="text-xs text-muted-foreground">Sugar: {item.customization.sugarLevel}</p>
                          )}
                          {item.customization?.iceLevel && (
                            <p className="text-xs text-muted-foreground">Ice: {item.customization.iceLevel}</p>
                          )}
                          {item.customization?.notes && (
                            <p className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700">📝 Note: {item.customization.notes}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div className="space-y-6">
            <button onClick={() => { setEditingItem(null); setFormData({ name: '', category: '', price: 0, description: '', imageFile: null, imageUrl: '' }); setPreviewImage(''); setShowMenuItemModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              <Plus className="w-5 h-5" />
              Add Item
            </button>

            <div className="bg-card border border-primary/15 rounded-2xl p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/15">
                    <th className="text-left py-3 px-4 text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Price</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map(item => (
                    <tr key={item.id} className="border-b border-primary/10 hover:bg-muted/40">
                      <td className="py-3 px-4 text-foreground">{item.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                      <td className="py-3 px-4 text-accent">₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => toggleStatus(item.id)}
                          className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${
                            item.status === 'unavailable' 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {item.status === 'unavailable' ? 'NOT AVAILABLE' : 'AVAILABLE'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="p-2 rounded-md border border-primary/20 text-primary hover:bg-primary/10" aria-label="Menu actions">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setEditingItem(item); setFormData({ name: item.name, category: item.category, price: item.price, description: (item as any).description || '', imageFile: null, imageUrl: item.image || '' }); setShowMenuItemModal(true); }}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => deleteMenuItem(item.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'security' && (
          <div className="space-y-6">
            {/* Security Status Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-card border border-yellow-400/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-700 text-sm font-semibold">Failed Login Attempts</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{securityLog?.failedAttempts || 0}</p>
                <p className="text-xs text-yellow-600/70 mt-2">Max: 5 attempts</p>
              </div>

              <div className={`bg-card border rounded-2xl p-6 ${securityLog?.lockedUntil && securityLog.lockedUntil > Date.now() ? 'border-red-400/30' : 'border-green-400/30'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5" style={{ color: securityLog?.lockedUntil && securityLog.lockedUntil > Date.now() ? '#dc2626' : '#16a34a' }} />
                  <p style={{ color: securityLog?.lockedUntil && securityLog.lockedUntil > Date.now() ? '#dc2626' : '#16a34a' }} className="text-sm font-semibold">Account Status</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {securityLog?.lockedUntil && securityLog.lockedUntil > Date.now() ? 'LOCKED' : 'ACTIVE'}
                </p>
                {securityLog?.lockedUntil && securityLog.lockedUntil > Date.now() && (
                  <p className="text-xs text-red-600/70 mt-2">Unlocks at: {new Date(securityLog.lockedUntil).toLocaleTimeString()}</p>
                )}
              </div>

              <div className="bg-card border border-blue-400/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-700 text-sm font-semibold">Last Login</p>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {adminSessions.length > 0
                    ? new Date(adminSessions[adminSessions.length - 1].loginTime).toLocaleTimeString()
                    : 'Never'}
                </p>
                <p className="text-xs text-blue-600/70 mt-2">Total Sessions: {adminSessions.length}</p>
              </div>
            </div>

            {/* Login Attempts History */}
            <div className="bg-card border border-primary/15 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Login Attempts History
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(() => {
                  const attempts = JSON.parse(localStorage.getItem("loginAttemptHistory") || "[]");
                  return attempts.length > 0 ? (
                    attempts
                      .slice()
                      .reverse()
                      .map((attempt: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg border border-primary/10">
                          <div>
                            <p className="text-foreground text-sm font-semibold">{attempt.date}</p>
                            <p className="text-muted-foreground text-xs">User: {attempt.username || 'admin'}</p>
                          </div>
                          <div className={`px-3 py-1 rounded text-xs font-semibold ${
                            attempt.status === 'success' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {attempt.status === 'success' ? '✓ Success' : '✗ Failed'}
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground/60 text-center py-4">No login attempts yet</p>
                  );
                })()}
              </div>
            </div>

            {/* Login History */}
            <div className="bg-card border border-primary/15 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Login History
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {adminSessions.length > 0 ? (
                  adminSessions
                    .slice()
                    .reverse()
                    .map((session, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg border border-primary/10">
                        <div>
                          <p className="text-foreground text-sm font-semibold">{session.loginDate}</p>
                          <p className="text-muted-foreground text-xs">Session Duration: {Math.round(session.sessionDuration / 60000)} minutes</p>
                        </div>
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Successful</div>
                      </div>
                    ))
                ) : (
                  <p className="text-muted-foreground/60 text-center py-4">No login history yet</p>
                )}
              </div>
            </div>

            {/* Audit Log */}
            <div className="bg-card border border-primary/15 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Admin Activity Log
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {adminAudit.length > 0 ? (
                  adminAudit
                    .slice()
                    .reverse()
                    .map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg border border-primary/10">
                        <div>
                          <p className="text-foreground text-sm font-semibold capitalize">{entry.action}</p>
                          <p className="text-muted-foreground text-xs">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                        <div className={`px-3 py-1 rounded text-xs font-semibold ${
                          entry.action === 'logout' ? 'bg-blue-100 text-blue-700' : 'bg-primary/10 text-primary'
                        }`}>
                          {entry.action === 'logout' ? 'Logged Out' : 'Action'}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-muted-foreground/60 text-center py-4">No activity yet</p>
                )}
              </div>
            </div>

            {/* Security Guidelines */}
            <div className="bg-blue-100 border border-blue-300 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-blue-700 mb-4">🔒 Security Guidelines</h3>
              <ul className="space-y-2 text-sm text-blue-700/90">
                <li>✓ Account locks after 5 failed login attempts for 15 minutes</li>
                <li>✓ Sessions automatically expire after 30 minutes of inactivity</li>
                <li>✓ All admin actions are logged for audit purposes</li>
                <li>✓ Login attempts are tracked and displayed in history</li>
                <li>✓ Activity warnings appear 5 minutes before session expiration</li>
              </ul>
            </div>
          </div>
        )}

        {view === 'analytics' && (
          <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-3">
              {(['daily', 'weekly', 'monthly'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setAnalyticsRange(range)}
                  className={`px-3 sm:px-6 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                    analyticsRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Total Revenue</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-accent line-clamp-1">₱{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 0 })}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Completed orders only</p>
              </div>

              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Total Orders</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-green-600">{orders.length}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Order count</p>
              </div>

              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Completed</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-blue-600">{orders.filter(o => o.status === 'completed').length}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">{orders.length > 0 ? Math.round((orders.filter(o => o.status === 'completed').length / orders.length) * 100) : 0}% completion rate</p>
              </div>

              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Avg Order Value</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-yellow-600">₱{orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0) / orders.length) : 0}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Per order</p>
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-4 sm:mb-4">Order Status Distribution</h3>
                <div className="space-y-2 sm:space-y-3">
                  {(['pending', 'preparing', 'ready', 'completed', 'cancelled'] as const).map(status => {
                    const count = orders.filter(o => o.status === status).length;
                    const percentage = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                    const colors: Record<string, string> = {
                      pending: 'bg-yellow-500',
                      preparing: 'bg-blue-500',
                      ready: 'bg-green-500',
                      completed: 'bg-purple-500',
                      cancelled: 'bg-red-500'
                    };
                    return (
                      <div key={status}>
                        <div className="flex justify-between mb-1 text-xs sm:text-sm">
                          <span className="text-sm text-muted-foreground capitalize">{status}</span>
                          <span className="text-sm font-semibold text-foreground">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colors[status]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Selling Items */}
              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-4 sm:mb-4">Top Selling Items</h3>
                <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
                  {menuItems
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 10)
                    .map((item, idx) => (
                      <div key={item.id} className="flex justify-between items-center p-2 sm:p-3 bg-muted rounded-lg border border-primary/10">
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-xs sm:text-sm font-semibold truncate">#{idx + 1} {item.name}</p>
                          <p className="text-muted-foreground text-xs">{item.category}</p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-accent font-bold text-sm">{item.sales}</p>
                          <p className="text-muted-foreground text-xs">sold</p>
                        </div>
                      </div>
                    ))}
                  {menuItems.length === 0 && <p className="text-muted-foreground/60 text-center py-4">No items yet</p>}
                </div>
              </div>
            </div>

            {/* Payment Method Analysis */}
            <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-4 sm:mb-4">Payment Method Distribution</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {['GCash', 'Maya'].map(method => {
                  const count = orders.filter(o => getPaymentMethodDisplay(o) === method).length;
                  const total = orders.filter(o => getPaymentMethodDisplay(o) === method).reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
                  return (
                    <div key={method} className="bg-muted rounded-lg p-3 sm:p-4 border border-primary/10">
                      <p className="text-muted-foreground text-xs sm:text-sm font-semibold mb-2">{method}</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">{count}</p>
                      <p className="text-xs text-accent">₱{total.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-4 sm:mb-4">Category Performance</h3>
              <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                {Array.from(new Set(menuItems.map(i => i.category)))
                  .map(category => {
                    const categoryItems = menuItems.filter(i => i.category === category);
                    const totalSales = categoryItems.reduce((sum, i) => sum + i.sales, 0);
                    const totalRevenue = categoryItems.reduce((sum, i) => sum + (i.price * i.sales), 0);
                    return (
                      <div key={category} className="p-3 sm:p-4 bg-muted rounded-lg border border-primary/10">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground font-semibold text-sm">{category}</p>
                            <p className="text-muted-foreground text-xs">{categoryItems.length} items</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-accent font-bold text-sm">₱{totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</p>
                            <p className="text-muted-foreground text-xs">{totalSales} units</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-primary mb-4 sm:mb-4">📈 Summary Statistics</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Avg Items per Order</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {orders.length > 0 
                      ? (orders.reduce((sum, o) => sum + (o.orderItems?.length || 0), 0) / orders.length).toFixed(1)
                      : 0
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Most Used Payment</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {orders.length > 0 
                      ? Object.entries(
                          orders.reduce((acc: Record<string, number>, o) => {
                            acc[getPaymentMethodDisplay(o) || 'Unknown'] = (acc[getPaymentMethodDisplay(o) || 'Unknown'] || 0) + 1;
                            return acc;
                          }, {})
                        ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Total Customers</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">{new Set(orders.map(o => o.customer)).size}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'users' && (
          <div className="space-y-6">
            {/* Search, Sort, and Filter Controls */}
            <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4"></h2>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Sort, Filter Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Sort */}
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-1 block">Sort By</label>
                  <select
                    value={customerSortBy}
                    onChange={(e) => setCustomerSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 bg-muted border border-primary/15 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="orders">Total Orders</option>
                    <option value="spent">Total Spent</option>
                    <option value="date">Join Date</option>
                  </select>
                </div>

                {/* Filter by Status */}
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-1 block">Account Status</label>
                  <select
                    value={customerFilterStatus}
                    onChange={(e) => setCustomerFilterStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-muted border border-primary/15 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="all">All Accounts</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Filter by Date Range Start */}
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={customerFilterDateStart}
                    onChange={(e) => setCustomerFilterDateStart(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-primary/15 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Filter by Date Range End */}
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={customerFilterDateEnd}
                    onChange={(e) => setCustomerFilterDateEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-primary/15 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Filter by Minimum Orders */}
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-1 block">Min Orders</label>
                  <input
                    type="number"
                    value={customerFilterMinOrders}
                    onChange={(e) => setCustomerFilterMinOrders(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-muted border border-primary/15 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Reset Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setCustomerSearchQuery('');
                      setCustomerSortBy('name');
                      setCustomerFilterStatus('all');
                      setCustomerFilterDateStart('');
                      setCustomerFilterDateEnd('');
                      setCustomerFilterMinOrders('');
                    }}
                    className="w-full px-3 py-2 bg-muted border border-primary/15 rounded-lg text-foreground text-sm hover:bg-muted/80 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-4 sm:p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/15">
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Phone</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Orders</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Total Spent</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Join Date</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers
                    .filter(customer => {
                      // Search filter
                      const searchLower = customerSearchQuery.toLowerCase();
                      const matchesSearch = 
                        customer.username.toLowerCase().includes(searchLower) ||
                        customer.email.toLowerCase().includes(searchLower) ||
                        (customer.phoneNumber && customer.phoneNumber.includes(searchLower)) ||
                        customer.fullName.toLowerCase().includes(searchLower);

                      // Status filter
                      const matchesStatus = customerFilterStatus === 'all' || customer.status === customerFilterStatus;

                      // Date filter
                      let matchesDate = true;
                      if (customerFilterDateStart || customerFilterDateEnd) {
                        const customerDate = new Date(customer.createdAt);
                        if (customerFilterDateStart) {
                          const startDate = new Date(customerFilterDateStart);
                          matchesDate = matchesDate && customerDate >= startDate;
                        }
                        if (customerFilterDateEnd) {
                          const endDate = new Date(customerFilterDateEnd);
                          endDate.setHours(23, 59, 59, 999);
                          matchesDate = matchesDate && customerDate <= endDate;
                        }
                      }

                      // Orders filter
                      const matchesMinOrders = customerFilterMinOrders === '' || customer.orderCount >= customerFilterMinOrders;

                      return matchesSearch && matchesStatus && matchesDate && matchesMinOrders;
                    })
                    .sort((a, b) => {
                      switch (customerSortBy) {
                        case 'name':
                          return a.username.localeCompare(b.username);
                        case 'orders':
                          return b.orderCount - a.orderCount;
                        case 'spent':
                          return b.totalSpent - a.totalSpent;
                        case 'date':
                          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        default:
                          return 0;
                      }
                    })
                    .map(customer => (
                      <tr key={customer.id} className="border-b border-primary/10 hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 text-foreground font-medium">{customer.fullName || customer.username}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs break-all">{customer.email}</td>
                        <td className="py-3 px-4 text-muted-foreground">{customer.phoneNumber || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            customer.status === 'active' 
                              ? 'bg-green-500/20 text-green-700' 
                              : 'bg-red-500/20 text-red-700'
                          }`}>
                            {customer.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-accent font-semibold">{customer.orderCount}</td>
                        <td className="py-3 px-4 text-accent font-semibold">₱{customer.totalSpent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(customer.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 space-x-2 flex">
                          <button
                            onClick={() => viewCustomerDetails(customer.id)}
                            className="px-2 py-1 bg-blue-500/20 text-blue-700 rounded hover:bg-blue-500/30 text-xs font-semibold transition-colors"
                            title="View details"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer.id)}
                            className="px-2 py-1 bg-red-500/20 text-red-700 rounded hover:bg-red-500/30 text-xs font-semibold transition-colors"
                            title="Delete customer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {customers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No customers found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer Details Modal */}
        {showCustomerDetailsModal && selectedCustomerDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-primary/15 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground">{isEditingCustomer ? 'Edit Customer' : 'Customer Details'}</h2>
                <button
                  onClick={() => {
                    setShowCustomerDetailsModal(false);
                    cancelEditingCustomer();
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedCustomerDetails.customer && (
                <div className="space-y-4 mb-6">
                  {!isEditingCustomer ? (
                    // View Mode
                    <div>
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-primary/15">
                        <div>
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="text-foreground font-semibold">{selectedCustomerDetails.customer.full_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Username</p>
                          <p className="text-foreground font-semibold">{selectedCustomerDetails.customer.username}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-foreground font-semibold">{selectedCustomerDetails.customer.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-foreground font-semibold">{selectedCustomerDetails.customer.phone_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Join Date</p>
                          <p className="text-foreground font-semibold">{new Date(selectedCustomerDetails.customer.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-3 mt-6">Order History</h3>
                        {selectedCustomerDetails.orders && selectedCustomerDetails.orders.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {[...selectedCustomerDetails.orders].reverse().map((order: any) => (
                              <div key={order.id} className="p-3 bg-muted rounded-lg border border-primary/10">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-foreground font-semibold">Order #{order.id}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-accent font-semibold">₱{order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                      order.status === 'completed' ? 'bg-green-500/20 text-green-700' :
                                      order.status === 'ready' ? 'bg-blue-500/20 text-blue-700' :
                                      order.status === 'preparing' ? 'bg-yellow-500/20 text-yellow-700' :
                                      'bg-gray-500/20 text-gray-700'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No orders found</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold mb-1 block">Full Name</label>
                        <input
                          type="text"
                          value={editingCustomerData?.full_name || ''}
                          onChange={(e) => setEditingCustomerData({ ...editingCustomerData, full_name: e.target.value })}
                          className="w-full px-3 py-2 bg-muted border border-primary/15 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold mb-1 block">Username (Read-only)</label>
                        <input
                          type="text"
                          value={selectedCustomerDetails.customer.username}
                          disabled
                          className="w-full px-3 py-2 bg-muted/50 border border-primary/15 rounded-lg text-muted-foreground cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold mb-1 block">Email</label>
                        <input
                          type="email"
                          value={editingCustomerData?.email || ''}
                          onChange={(e) => setEditingCustomerData({ ...editingCustomerData, email: e.target.value })}
                          className="w-full px-3 py-2 bg-muted border border-primary/15 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold mb-1 block">Phone Number</label>
                        <input
                          type="tel"
                          value={editingCustomerData?.phone_number || ''}
                          onChange={(e) => setEditingCustomerData({ ...editingCustomerData, phone_number: e.target.value })}
                          className="w-full px-3 py-2 bg-muted border border-primary/15 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-blue-700 font-medium">Note: Username and join date cannot be edited.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!isEditingCustomer ? (
                  <>
                    <button
                      onClick={startEditingCustomer}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowCustomerDetailsModal(false)}
                      className="px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={cancelEditingCustomer}
                      className="px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCustomerChanges}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}


        {view === 'category' && (
          <div className="space-y-6">
            <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">Product Categories</h2>
              <div className="space-y-3">
                {Array.from(new Set(menuItems.map(i => i.category))).map(category => {
                  const categoryItems = menuItems.filter(i => i.category === category);
                  return (
                    <div key={category} className="p-4 bg-muted rounded-lg border border-primary/10 hover:border-primary/30 transition-all">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-foreground font-semibold">{category}</p>
                          <p className="text-muted-foreground text-sm">{categoryItems.length} items</p>
                        </div>
                        <button 
                          onClick={() => setView('products')}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
                        >
                          View Products
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'products' && (
          <div className="space-y-6">
            <button onClick={() => { setEditingItem(null); setFormData({ name: '', category: '', price: 0, description: '', imageFile: null, imageUrl: '' }); setPreviewImage(''); setShowMenuItemModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              <Plus className="w-5 h-5" />
              Add Items
            </button>

            <div className="bg-card border border-primary/15 rounded-2xl p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/15">
                    <th className="text-left py-3 px-4 text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Price</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map(item => (
                    <tr key={item.id} className="border-b border-primary/10 hover:bg-muted/40">
                      <td className="py-3 px-4 text-foreground">{item.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                      <td className="py-3 px-4 text-accent font-semibold">₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => toggleStatus(item.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${
                            item.status === 'available' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="p-2 rounded-md border border-primary/20 text-primary hover:bg-primary/10" aria-label="Menu actions">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => {
                              setEditingItem(item);
                              setFormData({ name: item.name, category: item.category, price: item.price, description: (item as any).description || '', imageFile: null, imageUrl: item.image || '' });
                              setShowMenuItemModal(true);
                            }}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => deleteMenuItem(item.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'revenue' && (
          <div className="space-y-6">
            <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8">
              {['daily', 'weekly', 'monthly'].map(range => (
                <button
                  key={range}
                  onClick={() => setAnalyticsRange(range as 'daily' | 'weekly' | 'monthly')}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap text-xs sm:text-sm ${
                    analyticsRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Total Revenue</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-accent line-clamp-1">₱{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 0 })}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Completed orders only</p>
              </div>

              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Total Orders</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-green-600">{orders.length}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Order count</p>
              </div>

              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Completed</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-blue-600">{orders.filter(o => o.status === 'completed').length}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">{orders.length > 0 ? Math.round((orders.filter(o => o.status === 'completed').length / orders.length) * 100) : 0}% completion rate</p>
              </div>

              <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Avg Order Value</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-yellow-600">₱{orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0) / orders.length) : 0}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Per order</p>
              </div>
            </div>
          </div>
        )}

        {view === 'payment-verifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Payment Verifications</h2>
              <button 
                onClick={loadPaymentVerifications}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {loadingVerifications ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pendingPaymentVerifications.length === 0 ? (
              <div className="bg-card border border-primary/15 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">No Pending Verifications</p>
                <p className="text-muted-foreground">All payments have been verified!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingPaymentVerifications.map((verification: any) => (
                  <div key={verification.id} className="bg-card border border-primary/15 rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Order Details */}
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Order ID</p>
                          <p className="text-lg font-semibold text-foreground">{verification.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Customer Name</p>
                          <p className="text-lg font-semibold text-foreground">{verification.customerName || verification.customer_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Order Amount</p>
                          <p className="text-lg font-semibold text-accent">₱{(verification.totalAmount || verification.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Reference Number</p>
                          <p className="text-lg font-semibold text-foreground">{verification.paymentReferenceNumber || verification.payment_reference_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Method</p>
                          <p className="text-lg font-semibold text-foreground">{verification.paymentMethod || verification.payment_method || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Submitted</p>
                          <p className="text-lg font-semibold text-foreground">
                            {new Date(verification.createdAt || verification.created_at).toLocaleDateString('en-PH')} {new Date(verification.createdAt || verification.created_at).toLocaleTimeString('en-PH')}
                          </p>
                        </div>
                      </div>

                      {/* Proof of Payment Image */}
                      <div className="flex flex-col items-center justify-center bg-muted/30 rounded-xl p-4 border border-primary/10">
                        {verification.paymentProofPath || verification.payment_proof_path ? (
                          <div className="w-full space-y-3">
                            <img 
                              src={verification.paymentProofPath || verification.payment_proof_path}
                              alt="Payment proof"
                              className="w-full h-48 object-cover rounded-lg border border-primary/15"
                            />
                            <a 
                              href={verification.paymentProofPath || verification.payment_proof_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 text-xs font-medium transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Full Size
                            </a>
                          </div>
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">No proof image</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3 justify-center">
                        <button
                          onClick={() => approvePayment(verification.id)}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) {
                              rejectPayment(verification.id, reason);
                            }
                          }}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                        >
                          <X className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </main>

      {showMenuItemModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">{editingItem ? 'Edit' : 'Add'} Menu Item</h3>
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <input type="text" placeholder="Item name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 sm:px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="text" placeholder="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 sm:px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 sm:px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 sm:px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground placeholder:text-muted-foreground/60 min-h-[80px] resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <label className="block text-sm font-medium text-muted-foreground">Product image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    setFormData({ ...formData, imageFile: file });
                    setPreviewImage(URL.createObjectURL(file));
                  } else {
                    setFormData({ ...formData, imageFile: null });
                    setPreviewImage(formData.imageUrl || '');
                  }
                }}
                className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-primary/20 file:bg-muted file:text-sm file:font-medium file:text-primary hover:file:bg-primary/10"
              />
              {previewImage ? (
                <div className="mt-3 rounded-xl overflow-hidden border border-primary/15 bg-muted/20">
                  <img src={previewImage} alt="Menu item preview" className="w-full object-cover max-h-56" />
                </div>
              ) : null}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button onClick={() => setShowMenuItemModal(false)} className="flex-1 px-3 sm:px-4 py-2 border border-primary/30 rounded-lg text-primary hover:bg-primary/10 text-xs sm:text-sm">
                Cancel
              </button>
              <button onClick={handleSaveMenuItem} className="flex-1 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-xs sm:text-sm">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
