import { useState, useEffect } from 'react';
import { LogOut, Plus, Edit2, Trash2, Package, AlertCircle, Search, Lock, Clock, AlertTriangle, TrendingUp, DollarSign, CheckCircle2, Bell, X } from 'lucide-react';
import { api } from '../../services/api';

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
  id: number;
  name: string;
  category: string;
  price: number;
  status: 'available' | 'unavailable';
  sales: number;
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

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [view, setView] = useState<'overview' | 'orders' | 'menu' | 'security' | 'analytics'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', price: 0, description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [adminSessions, setAdminSessions] = useState<AdminSession[]>([]);
  const [adminAudit, setAdminAudit] = useState<AdminAudit[]>([]);
  const [securityLog, setSecurityLog] = useState<any>(null);
  const [analyticsRange, setAnalyticsRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [previousOrdersCount, setPreviousOrdersCount] = useState(0);
  const [previousMenuStatus, setPreviousMenuStatus] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    loadOrders();
    loadMenuItems();
    loadSecurityData();
    loadNotifications();
    
    // TODO: Replace polling with Supabase Realtime subscriptions
    // Temporary 5-second polling for live updates
    const interval = setInterval(() => {
      loadOrders();
      loadSecurityData();
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
          if (order.orderItems) {
            const orderItemSales = order.orderItems.reduce((sum: number, orderItem: any) => {
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
    if (previousOrdersCount === 0) {
      setPreviousOrdersCount(orders.length);
      console.log('[NOTIFICATIONS] Initial load. Total orders:', orders.length);
      return;
    }

    // Check for new orders
    if (orders.length > previousOrdersCount) {
      const newOrders = orders.slice(previousOrdersCount);
      console.log('[NOTIFICATIONS] New orders detected:', newOrders.length);
      
      newOrders.forEach(order => {
        if (!order.orderNumber && !order.id) return;
        
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
      setPreviousOrdersCount(orders.length);
    }
  }, [orders, previousOrdersCount]);

  // Detect menu status changes
  useEffect(() => {
    const currentStatus: { [key: number]: string } = {};
    menuItems.forEach(item => {
      currentStatus[item.id] = item.status;
    });

    // Check for changes in status
    if (Object.keys(previousMenuStatus).length > 0) {
      Object.entries(currentStatus).forEach(([itemId, status]) => {
        const previousStatus = previousMenuStatus[parseInt(itemId)];
        
        if (previousStatus !== undefined && previousStatus !== status) {
          const item = menuItems.find(m => m.id === parseInt(itemId));
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

  const loadOrders = async () => {
    try {
      const backendOrders = await api.getAllOrders();
      setOrders(Array.isArray(backendOrders) ? backendOrders : []);
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
      await api.updateOrderStatus?.(orderRef, status);
      const updatedOrders = orders.map(o => 
        (o.id === orderRef || o.orderNumber === orderRef) 
          ? { ...o, status } 
          : o
      );
      setOrders(updatedOrders);
      
      // Broadcast update to customer localStorage so they see the change immediately
      updatedOrders.forEach(order => {
        if (order.customer) {
          const customerKey = `userOrders_${order.customer}`;
          try {
            const existingOrders = localStorage.getItem(customerKey);
            if (existingOrders) {
              const parsed = JSON.parse(existingOrders);
              const updated = parsed.map((o: any) => 
                (o.id === orderRef || o.orderNumber === orderRef) 
                  ? { ...o, status } 
                  : o
              );
              localStorage.setItem(customerKey, JSON.stringify(updated));
              console.log(`[ADMIN_BROADCAST] Updated order ${orderRef} status to ${status} for customer ${order.customer}`);
            }
          } catch (e) {
            console.warn(`[ADMIN_BROADCAST] Failed to update customer localStorage:`, e);
          }
        }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const deleteMenuItem = async (itemId: number) => {
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
        await api.updateMenuItemStatus?.(itemId, newStatus);
        console.log(`Status updated via API: ${itemId} -> ${newStatus}`);
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
  const unavailableItems = menuItems.filter(item => item.status === 'unavailable');
  const filteredOrders = orders.filter(o => o.customer.toLowerCase().includes(searchQuery.toLowerCase()) || (o.id?.includes(searchQuery)) || (o.orderNumber?.includes(searchQuery)));

  const handleSaveMenuItem = async () => {
    if (!formData.name || !formData.category || formData.price <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      if (editingItem) {
        // Update existing item
        await api.updateMenuItem?.(editingItem.id, formData);
        setMenuItems(menuItems.map(i => 
          i.id === editingItem.id ? { ...i, ...formData } : i
        ));
      } else {
        // Create new item
        const newItem = await api.createMenuItem?.(formData);
        if (newItem) {
          setMenuItems([...menuItems, newItem]);
        }
      }
      
      setShowMenuItemModal(false);
      setFormData({ name: '', category: '', price: 0, description: '' });
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Failed to save menu item. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <header className="bg-muted border-b border-primary/20 p-4 sm:p-6 flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-4">
          <img 
            src="/images/kipin-logo.png" 
            alt="Balay Kalapihan Logo" 
            className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain"
          />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Admin</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-card rounded-lg transition-all"
            >
              <Bell className="w-5 h-5 text-primary" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 bg-destructive text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-card border border-primary/20 rounded-xl shadow-xl z-40 max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-primary/20 p-4 flex justify-between items-center">
                  <h3 className="text-foreground font-bold">Notifications ({notifications.filter(n => !n.read).length} new)</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-primary/10">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id}
                        className={`p-4 cursor-pointer transition-all ${notif.read ? 'bg-muted/40' : 'bg-primary/5'} hover:bg-primary/10`}
                        onClick={() => markNotificationAsRead(notif.id)}
                      >
                        <div className="flex gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.type === 'new_order' ? 'bg-blue-400' : notif.type === 'order_status' ? 'bg-green-400' : 'bg-purple-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${notif.read ? 'text-muted-foreground' : 'text-foreground font-semibold'}`}>
                              {notif.message}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    ))}
                    {notifications.length > 0 && (
                      <div className="space-y-1 p-2">
                        <button 
                          onClick={clearAllNotifications}
                          className="w-full p-2 text-center text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded transition-all"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button onClick={onLogout} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 text-xs sm:text-sm">
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Out</span>
          </button>
        </div>
      </header>

      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto pb-2">
          {['overview', 'orders', 'menu', 'analytics', 'security'].map(tab => (
            <button
              key={tab}
              onClick={() => setView(tab as any)}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap text-xs sm:text-sm ${view === tab ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
            >
              {tab === 'security' ? '🔐 Security' : tab === 'analytics' ? '📊 Analytics' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

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

            {unavailableItems.length > 0 && (
              <div className="bg-red-100 border border-red-300 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <h3 className="text-sm sm:text-lg font-bold text-red-600">Items Not Available</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {unavailableItems.map(item => (
                    <div key={item.id} className="bg-white border border-red-300 rounded-lg p-3">
                      <p className="text-foreground font-semibold">{item.name}</p>
                      <p className="text-red-600 text-sm">Status: Not Available</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    <>
                      <tr key={o.orderNumber || o.id} className="border-b border-primary/10 hover:bg-muted/40">
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-foreground text-xs sm:text-sm">#{o.orderNumber || o.id}</td>
                        <td className="hidden sm:table-cell py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground">{o.customer}</td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-accent text-xs sm:text-sm">₱{(o.totalAmount || o.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="hidden md:table-cell py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground text-xs sm:text-sm">{o.paymentmethod || o.paymentMethod || 'GCash'}</td>
                        <td className="hidden lg:table-cell py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground text-xs sm:text-sm">{(o.pickupdate || o.pickupDate) && (o.pickuptime || o.pickupTime) ? `${o.pickupdate || o.pickupDate} ${o.pickuptime || o.pickupTime}` : 'N/A'}</td>
                        <td className={`py-2 px-2 sm:py-3 sm:px-4 font-semibold rounded text-xs sm:text-sm ${getStatusColor(o.status)}`}>{o.status.toUpperCase()}</td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4">
                          <button 
                            onClick={() => {
                              const orderId = o.orderNumber || o.id;
                              setSelectedOrderId(selectedOrderId === orderId ? null : (orderId || null));
                            }}
                            className="text-primary hover:text-primary/80 text-xs font-medium px-2 py-1 rounded border border-primary/30 hover:bg-primary/10"
                          >
                            {selectedOrderId === (o.orderNumber || o.id) ? 'Hide' : 'View'} Items
                          </button>
                        </td>
                      </tr>
                      {selectedOrderId === (o.orderNumber || o.id) && Array.isArray(o.items) && (
                        <tr className="border-b border-primary/10 bg-muted/20">
                          <td colSpan={7} className="py-4 px-4">
                            <div className="bg-white rounded-lg p-4 border border-primary/15">
                              <h4 className="text-sm font-semibold text-foreground mb-3">Order Items ({o.items.length} items):</h4>
                              <div className="space-y-2">
                                {o.items?.map((item: any, idx: number) => (
                                  <div key={idx} className="bg-muted/30 rounded p-3 border border-primary/10">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-foreground font-medium">{item.quantity}x {item.item?.name || item.name || 'Item'}</span>
                                      <span className="text-accent text-sm">₱{((item.item?.price || item.price || 0) * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
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
                                        <p className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">📝 Note: {item.customization.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'orders' && (
          <div className="space-y-6">
            <div className="bg-card border border-primary/15 rounded-2xl p-6">
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
                  <th className="text-left py-3 px-4 text-muted-foreground">Pickup Time</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 px-4 text-center text-muted-foreground/60">No orders found</td>
                  </tr>
                ) : (
                  filteredOrders.map(o => (
                    <>
                      <tr key={o.orderNumber || o.id} className="border-b border-primary/10 hover:bg-muted/40">
                        <td className="py-3 px-4 text-foreground">#{o.orderNumber || o.id}</td>
                        <td className="py-3 px-4 text-muted-foreground">{o.customer}</td>
                        <td className="py-3 px-4 text-accent">₱{(o.totalAmount || o.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">{o.paymentmethod || o.paymentMethod || 'GCash'} {(o.referencenumber || o.referenceNumber) && `(${o.referencenumber || o.referenceNumber})`}</td>
                        <td className="py-3 px-4 text-muted-foreground">{(o.pickupdate || o.pickupDate) && (o.pickuptime || o.pickupTime) ? `${o.pickupdate || o.pickupDate} ${o.pickuptime || o.pickupTime}` : 'N/A'}</td>
                        <td className="py-3 px-4">
                          <select value={o.status} onChange={e => updateOrderStatus(o.orderNumber || o.id || '', e.target.value as any)} className={`px-3 py-1 rounded text-sm font-semibold border-0 ${getStatusColor(o.status)}`}>
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
                            onClick={() => {
                              const orderId = o.orderNumber || o.id;
                              setSelectedOrderId(selectedOrderId === orderId ? null : (orderId || null));
                            }}
                            className="text-primary hover:text-primary/80 text-xs font-medium px-2 py-1 rounded border border-primary/30 hover:bg-primary/10"
                          >
                            {selectedOrderId === (o.orderNumber || o.id) ? 'Hide' : 'View'} Items
                          </button>
                          <button onClick={() => deleteOrder(o.orderNumber || o.id || '')} className="text-destructive hover:text-destructive/70">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {selectedOrderId === (o.orderNumber || o.id) && Array.isArray(o.orderItems) && (
                        <tr className="border-b border-primary/10 bg-muted/20">
                          <td colSpan={7} className="py-4 px-4">
                            <div className="bg-white rounded-lg p-4 border border-primary/15">
                              <h4 className="text-sm font-semibold text-foreground mb-3">Order Items ({o.orderItems.length} items):</h4>
                              <div className="space-y-2">
                                {o.orderItems?.map((item: any, idx: number) => (
                                  <div key={idx} className="bg-muted/30 rounded p-3 border border-primary/10">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-foreground font-medium">{item.quantity}x {item.item?.name || item.name || 'Item'}</span>
                                      <span className="text-accent text-sm">₱{((item.item?.price || item.price || 0) * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
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
                                        <p className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">📝 Note: {item.customization.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div className="space-y-6">
            <button onClick={() => { setEditingItem(null); setFormData({ name: '', category: '', price: 0, description: '' }); setShowMenuItemModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
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
                      <td className="py-3 px-4 flex gap-2">
                        <button onClick={() => { setEditingItem(item); setFormData({ name: item.name, category: item.category, price: item.price, description: (item as any).description || '' }); setShowMenuItemModal(true); }} className="text-primary hover:text-primary/80">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMenuItem(item.id)} className="text-destructive hover:text-destructive/70">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                {['GCash', 'PayMaya'].map(method => {
                  const count = orders.filter(o => o.paymentMethod === method).length;
                  const total = orders.filter(o => o.paymentMethod === method).reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
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
                            acc[o.paymentMethod || 'Unknown'] = (acc[o.paymentMethod || 'Unknown'] || 0) + 1;
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
      </div>

      {showMenuItemModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-primary/15 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">{editingItem ? 'Edit' : 'Add'} Menu Item</h3>
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <input type="text" placeholder="Item name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 sm:px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="text" placeholder="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 sm:px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full px-3 sm:px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 sm:px-4 py-2 bg-muted border border-primary/15 rounded-lg text-foreground placeholder:text-muted-foreground/60 min-h-[80px] resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
