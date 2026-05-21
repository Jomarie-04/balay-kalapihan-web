import { useState, useEffect, useRef } from "react";
import { PaymentModal } from "./PaymentModal";
import { OrderConfirmation } from "./OrderConfirmation";
import { ProfileMenu } from "./ProfileMenu";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { EditInfoModal } from "./EditInfoModal";
import {
  CustomizeItemModal,
  AddOnOption,
  ItemCustomization,
} from "./CustomizeItemModal";
import { AboutUs } from "./AboutUs";
import { UserData } from "./Login";
import { SalesInvoice } from "./SalesInvoice";
import { CancelOrderModal } from "./CancelOrderModal";
import { ShopStatusIndicator } from "./ShopStatusIndicator";
import { ReadyNotification } from "./ReadyNotification";
import { Footer } from "./Footer";
import { api } from "../../services/api";
import {
  Search,
  Home,
  ShoppingCart,
  Menu,
  X,
  Bell,
  Trash2,
} from "lucide-react";

interface DashboardProps {
  username: string;
  userData: UserData;
  onLogout: () => void;
  onUpdateUserData: (updated: UserData) => void;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image: string;
}

interface CartItem {
  id: string;
  item: MenuItem;
  quantity: number;
  customization: ItemCustomization;
  price?: number;
  specialInstructions?: string;
}

interface Order {
  orderNumber: string;
  customer: string;
  totalAmount: number;
  subtotalAmount: number;
  discount: number;
  paymentMethod: string;
  referenceNumber: string;
  pickupDate: string;
  pickupTime: string;
  items: CartItem[];
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  createdAt: Date;
  cancelDeadline?: Date;
}

interface Notification {
  id: string;
  type: 'order_placed' | 'order_ready' | 'order_completed' | 'order_preparing';
  message: string;
  orderNumber?: string;
  timestamp: number;
  read: boolean;
}

const menuItems: MenuItem[] = [
  // ICED COFFEE
  {
    id: 1,
    name: "Iced Coffee",
    description: "Cold brew coffee with ice",
    price: 95,
    category: "Beverages",
    available: true,
    image: "/images/koldbrew.jpg",
  },

  // KOLDBREW (choose infusion at pickup)
  {
    id: 2,
    name: "Koldbrew",
    description:
      "Choose your infusion: Original, Salted Caramel, French Vanilla, Mocha, Raspberry, Caramel, Vanilla, Blueberry, Strawberry.",
    price: 79,
    category: "Koldbrew",
    available: true,
    image:
      "/images/koldbrew.jpg",
  },

  // KOLDBREW LATTE (choose latte at pickup)
  {
    id: 5,
    name: "Koldbrew Latte",
    description:
      "Choose your latte: Spanish Latte, Cinnamon Infused Latte, Koldbrew Taro Latte, Koldbrew Matcha Latte.",
    price: 85,
    category: "Koldbrew Latte",
    available: true,
    image:
      "/images/koldbrew-latte.jpg",
  },

  // ESPRESSO DRINKS
  {
    id: 7,
    name: "Café Latte",
    description: "Espresso with steamed milk.",
    price: 100,
    category: "Espresso Drinks",
    available: true,
    image:
      "/images/cafe-latte.avif",
  },

  {
    id: 9,
    name: "Cappuccino",
    description: "Espresso, steamed milk, and foam.",
    price: 95,
    category: "Espresso Drinks",
    available: true,
    image:
      "/images/cappuccino.jpg",
  },

  {
    id: 11,
    name: "Café Americano",
    description: "Espresso diluted with hot water.",
    price: 85,
    category: "Espresso Drinks",
    available: true,
    image:
      "/images/americano.jpg",
  },

  {
    id: 13,
    name: "Caramel Macchiato",
    description: "Espresso with milk and caramel.",
    price: 115,
    category: "Espresso Drinks",
    available: true,
    image:
      "/images/caramel-macchiato.jpg",
  },

  {
    id: 15,
    name: "Kalapihan's Signature",
    description: "House signature espresso drink.",
    price: 95,
    category: "Espresso Drinks",
    available: true,
    image:
      "/images/signature.jpg",
  },

  {
    id: 17,
    name: "Café Mocha",
    description: "Chocolate espresso drink.",
    price: 115,
    category: "Espresso Drinks",
    available: true,
    image:
      "/images/mocha.jpg",
  },

  {
    id: 19,
    name: "Flat White",
    description: "Smooth espresso with steamed milk.",
    price: 90,
    category: "Espresso Drinks",
    available: true,
    image:
      "/images/flat-white.jpg",
  },

  {
    id: 21,
    name: "Cinnamon Dolce Latte",
    description: "Cinnamon dolce latte.",
    price: 95,
    category: "Espresso Drinks",
    available: true,
    image:
      "/images/cinnamon-dolce.jpg",
  },

  {
    id: 23,
    name: "Dirty Matcha Latte",
    description: "Matcha latte with a shot of espresso.",
    price: 115,
    category: "Espresso Drinks",
    available: true,
    image:
      "/images/matcha-latte.jpg",
  },

  // FRAPPE
  {
    id: 25,
    name: "Mocha Loca",
    description: "Blended mocha frappe.",
    price: 135,
    category: "Frappe",
    available: true,
    image: "/images/mocha-loca.jpg",
  },
  {
    id: 26,
    name: "Matcha Krema",
    description: "Creamy matcha frappe.",
    price: 125,
    category: "Frappe",
    available: true,
    image: "/images/matcha-krema.avif",
  },
  {
    id: 27,
    name: "Caramel Frappuccino",
    description: "Caramel blended frappe.",
    price: 135,
    category: "Frappe",
    available: true,
    image:
      "/images/caramel-frappe.jpg",
  },
  {
    id: 28,
    name: "Raspberry Ripple",
    description: "Raspberry blended frappe.",
    price: 120,
    category: "Frappe",
    available: true,
    image:
      "/images/raspberry-ripple.jpg",
  },
  {
    id: 29,
    name: "Cinnamon Dolce",
    description: "Cinnamon dolce blended frappe.",
    price: 125,
    category: "Frappe",
    available: true,
    image:
      "/images/cinnamon-frappe.jpg",
  },
  {
    id: 30,
    name: "Creamy Taro",
    description: "Creamy taro blended frappe.",
    price: 120,
    category: "Frappe",
    available: true,
    image:
      "/images/creamy-taro.avif",
  },

  // BREWED COFFEE
  {
    id: 32,
    name: "Brewed Coffee",
    description: "Fresh brewed coffee.",
    price: 85,
    category: "Brewed Coffee",
    available: true,
    image:
      "/images/brewed-coffee.jpg",
  },

  // ADD-ONS
  {
    id: 33,
    name: "Cream Cheese",
    description: "Add-on",
    price: 20,
    category: "Add-ons",
    available: true,
    image: "https://placehold.co/400x300/png?text=Cream+Cheese",
  },
  {
    id: 34,
    name: "Syrup",
    description: "Add-on",
    price: 10,
    category: "Add-ons",
    available: true,
    image: "https://placehold.co/400x300/png?text=Syrup",
  },
  {
    id: 35,
    name: "Boba Pearls",
    description: "Add-on",
    price: 20,
    category: "Add-ons",
    available: true,
    image: "https://placehold.co/400x300/png?text=Boba+Pearls",
  },
  {
    id: 36,
    name: "Espresso Shot",
    description: "Add-on",
    price: 60,
    category: "Add-ons",
    available: true,
    image:
      "https://placehold.co/400x300/png?text=Espresso+Shot",
  },
];

export function Dashboard({
  username,
  userData,
  onLogout,
  onUpdateUserData,
}: DashboardProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [displayMenuItems, setDisplayMenuItems] = useState<MenuItem[]>(menuItems);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("All");
  const [showPaymentModal, setShowPaymentModal] =
    useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] =
    useState(false);
  const [showChangePassword, setShowChangePassword] =
    useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [itemToCustomize, setItemToCustomize] =
    useState<MenuItem | null>(null);
  const [currentOrder, setCurrentOrder] =
    useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<
    "menu" | "cart" | "about" | "profile" | "notifications" | "payments" | "history" | "account-settings"
  >("menu");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const [pickupDate, setPickupDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [pickupTime, setPickupTime] = useState(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 60 * 1000);
    const hh = String(in30.getHours()).padStart(2, "0");
    const mm = String(in30.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  });
  
  // New state for additional features
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [cancelTimeRemaining, setCancelTimeRemaining] = useState(0);
  const [orderCountdowns, setOrderCountdowns] = useState<Record<string, number>>({});
  const [readyOrders, setReadyOrders] = useState<string[]>([]);
  const readyOrdersShown = useRef<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<string>>(new Set());

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Load notifications on mount
    loadNotifications();
  }, []);

  // Detect customer order status changes and create notifications
  useEffect(() => {
    // If this is the first render, just save current order IDs
    if (previousOrderIds.size === 0) {
      const currentIds = new Set(orders.map(o => o.orderNumber));
      setPreviousOrderIds(currentIds);
      console.log('[CUSTOMER_NOTIFICATIONS] Initial load. Total orders:', orders.length);
      return;
    }

    // Check for status changes in customer's orders
    orders.forEach(currentOrder => {
      // Check if this order status changed to "ready"
      const alreadyNotifiedReady = notifications.some(n => 
        n.type === 'order_ready' && n.orderNumber === currentOrder.orderNumber
      );
      
      if (!alreadyNotifiedReady && currentOrder.status === 'ready') {
        addNotification(
          `🎉 Your order #${currentOrder.orderNumber} is ready for pickup!`,
          'order_ready',
          currentOrder.orderNumber
        );
      }

      // Check if order status changed to "completed"
      const alreadyNotifiedCompleted = notifications.some(n => 
        n.type === 'order_completed' && n.orderNumber === currentOrder.orderNumber
      );
      
      if (!alreadyNotifiedCompleted && currentOrder.status === 'completed') {
        addNotification(
          `✅ Your order #${currentOrder.orderNumber} is completed!`,
          'order_completed',
          currentOrder.orderNumber
        );
      }

      // Check if order status changed to "preparing"
      const alreadyNotifiedPreparing = notifications.some(n => 
        n.type === 'order_preparing' && n.orderNumber === currentOrder.orderNumber
      );
      
      if (!alreadyNotifiedPreparing && currentOrder.status === 'preparing') {
        addNotification(
          `⏱️ Your order #${currentOrder.orderNumber} is being prepared!`,
          'order_preparing',
          currentOrder.orderNumber
        );
      }
    });

    // Update previous order IDs
    const currentIds = new Set(orders.map(o => o.orderNumber));
    setPreviousOrderIds(currentIds);
  }, [orders, notifications]);

  // Sync menu items (both from backend and custom items) from admin dashboard
  useEffect(() => {
    const updateMenuItems = async () => {
      try {
        // First, try to load menu items from backend API
        let backendItems: MenuItem[] = [];
        try {
          const response = await api.getMenu();
          if (Array.isArray(response)) {
            backendItems = response.map((item: any) => {
              // Find the hardcoded item to get the image if not provided by API
              const hardcodedItem = menuItems.find(m => m.name === item.name);
              return {
                id: item.id,
                name: item.name,
                description: item.description || '',
                price: item.price,
                category: item.category,
                available: item.status === 'available',
                image: item.image || hardcodedItem?.image || '/images/default.jpg'
              };
            });
          }
        } catch (error) {
          console.error('Error loading menu from backend:', error);
          // Fall back to default menu items if API fails
          backendItems = menuItems;
        }

        let updatedItems: MenuItem[] = backendItems;
        
        // Load and merge custom items
        const customItemsData = localStorage.getItem('customMenuItems');
        if (customItemsData) {
          try {
            const customItems = JSON.parse(customItemsData);
            // Add custom items (with descriptions converted to proper format)
            const formattedCustomItems = customItems.map((item: any) => {
              // Find the hardcoded item to get the image if not provided
              const hardcodedItem = menuItems.find(m => m.name === item.name);
              return {
                id: item.id,
                name: item.name,
                description: item.description || '',
                price: item.price,
                category: item.category,
                available: item.status === 'available',
                image: item.image || hardcodedItem?.image || '/images/default.jpg'
              };
            });
            updatedItems = [...updatedItems, ...formattedCustomItems];
          } catch (error) {
            console.error('Error parsing custom menu items:', error);
          }
        }
        
        setDisplayMenuItems(updatedItems);
      } catch (error) {
        console.error('Error updating menu items:', error);
      }
    };

    // Load on mount
    updateMenuItems();

    // Listen for changes from admin dashboard (real-time sync across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'menuAvailability' || e.key === 'customMenuItems') {
        updateMenuItems();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for updates every 3 seconds (for same-tab updates)
    const pollInterval = setInterval(() => {
      updateMenuItems();
    }, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  // Track order cancellation deadlines
  useEffect(() => {
    const interval = setInterval(() => {
      orders.forEach(order => {
        if (order.cancelDeadline && order.status === 'pending') {
          const now = new Date();
          const deadline = new Date(order.cancelDeadline);
          if (now >= deadline) {
            // Remove cancel option
            setOrders(prev => prev.map(o => 
              o.orderNumber === order.orderNumber 
                ? { ...o, cancelDeadline: undefined }
                : o
            ));
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [orders]);

  // Check for ready orders and show notifications
  useEffect(() => {
    orders.forEach(order => {
      if (order.status === 'ready' && !readyOrdersShown.current.has(order.orderNumber)) {
        readyOrdersShown.current.add(order.orderNumber);
        setReadyOrders(prev => [...prev, order.orderNumber]);
      }
    });
  }, [orders]);

  // Generate user-specific orders key
  const userOrdersKey = `userOrders_${userData.username}`;
  const userNotificationsKey = `userNotifications_${userData.username}`;

  // Notification helper functions
  const loadNotifications = () => {
    const stored = localStorage.getItem(userNotificationsKey);
    if (stored) {
      try {
        const loaded = JSON.parse(stored).slice(-20); // Keep last 20 notifications
        setNotifications(loaded);
        console.log('[CUSTOMER_NOTIFICATIONS] Loaded', loaded.length, 'notifications from storage');
      } catch (e) {
        console.error('[CUSTOMER_NOTIFICATIONS] Error loading notifications:', e);
      }
    }
  };

  const saveNotifications = (notifs: Notification[]) => {
    try {
      const toSave = notifs.slice(-20);
      localStorage.setItem(userNotificationsKey, JSON.stringify(toSave));
      console.log('[CUSTOMER_NOTIFICATIONS] Saved', toSave.length, 'notifications to storage');
    } catch (e) {
      console.error('[CUSTOMER_NOTIFICATIONS] Error saving notifications:', e);
    }
  };

  const addNotification = (message: string, type: Notification['type'], orderNumber?: string) => {
    const notification: Notification = {
      id: `notif_${orderNumber || Date.now()}_${Date.now()}`,
      type,
      message,
      orderNumber,
      timestamp: Date.now(),
      read: false
    };

    console.log('[CUSTOMER_NOTIFICATIONS] Adding notification:', message);

    setNotifications(prev => {
      const updated = [notification, ...prev];
      saveNotifications(updated);
      return updated;
    });
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

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem(userNotificationsKey);
    console.log('[CUSTOMER_NOTIFICATIONS] Cleared all notifications');
  };

  // Listen for real-time order updates from admin dashboard
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === userOrdersKey && e.newValue) {
        const updatedOrders = JSON.parse(e.newValue);
        setOrders(updatedOrders);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll localStorage for updates every 3 seconds (for same-tab updates from admin dashboard)
    const pollLocalStorageInterval = setInterval(() => {
      const updatedOrders = localStorage.getItem(userOrdersKey);
      if (updatedOrders) {
        const parsed = JSON.parse(updatedOrders);
        // Restore cancelDeadline if missing (after page refresh)
        const ordersWithDeadlines = parsed.map((order: any) => {
          if (!order.cancelDeadline && order.status === 'pending' && order.createdAt) {
            const createdAt = new Date(order.createdAt);
            return {
              ...order,
              cancelDeadline: new Date(createdAt.getTime() + 5 * 60 * 1000)
            };
          }
          return order;
        });
        
        setOrders(prev => {
          // Only update if orders have changed (to avoid unnecessary re-renders)
          if (JSON.stringify(prev) !== JSON.stringify(ordersWithDeadlines)) {
            return ordersWithDeadlines;
          }
          return prev;
        });
      }
    }, 3000);

    // Poll API for fresh order data every 5 seconds to catch admin updates
    const pollAPIInterval = setInterval(async () => {
      try {
        if (orders.length > 0) {
          const freshOrders = await api.getMyOrders();
          if (freshOrders && Array.isArray(freshOrders)) {
            // Backend now returns only customer's orders, no need to filter
            const customerOrders = freshOrders;
            
            // Check if any order status has changed
            setOrders(prev => {
              const hasChanges = customerOrders.length !== prev.length ||
                customerOrders.some((newOrder: any) => {
                  const oldOrder = prev.find(o => o.orderNumber === newOrder.id);
                  return oldOrder && oldOrder.status !== newOrder.status;
                });
              
              if (hasChanges && customerOrders.length > 0) {
                console.log('[ORDER_SYNC] Order status updated from API:', customerOrders);
                // Update localStorage to keep local state in sync
                const formattedOrders = customerOrders.map((order: any) => {
                  const createdAt = new Date(order.createdat);
                  // Calculate cancel deadline: 5 minutes from order creation if still pending
                  const cancelDeadline = order.status === 'pending' 
                    ? new Date(createdAt.getTime() + 5 * 60 * 1000)
                    : undefined;
                  
                  return {
                    orderNumber: order.id,
                    customer: order.customer,
                    totalAmount: order.total_amount,
                    subtotalAmount: order.subtotal_amount,
                    discount: order.discount,
                    paymentMethod: order.payment_method,
                    referenceNumber: order.reference_number,
                    pickupDate: order.pickup_date,
                    pickupTime: order.pickup_time,
                    items: order.items || [],
                    status: order.status,
                    createdAt: createdAt,
                    cancelDeadline: cancelDeadline,
                  };
                });
                localStorage.setItem(userOrdersKey, JSON.stringify(formattedOrders));
                return formattedOrders;
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.warn('[ORDER_SYNC] Error polling for order updates:', error);
        // Silently fail - continue using localStorage data
      }
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollLocalStorageInterval);
      clearInterval(pollAPIInterval);
    };
  }, [userData.username, userData.fullName, userOrdersKey, orders.length]);

  // Update cancellation countdown timers every second
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setOrderCountdowns(() => {
        const updated: Record<string, number> = {};
        orders.forEach(order => {
          if (order.cancelDeadline && order.status === 'pending') {
            const now = new Date();
            const deadline = new Date(order.cancelDeadline);
            const remaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
            updated[order.orderNumber] = remaining;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [orders]);

  const categories = [
    "All",
    ...Array.from(
      new Set(displayMenuItems.map((item) => item.category).filter((cat) => cat !== "Add-ons")),
    ),
  ];

  const addOnOptions: AddOnOption[] = displayMenuItems
    .filter((i) => i.category === "Add-ons")
    .map((i) => ({ id: i.id, name: i.name, price: i.price }));

  const filteredItems = displayMenuItems.filter((item) => {
    // Hide Add-ons from menu display
    if (item.category === "Add-ons") return false;
    
    const matchesCategory =
      selectedCategory === "All" ||
      item.category === selectedCategory;
    const matchesSearch =
      item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    // Always customize; different options should create different cart lines.
    setItemToCustomize(item);
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter((cartItem) => cartItem.id !== cartId));
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
    } else {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === cartId
            ? { ...cartItem, quantity }
            : cartItem,
        ),
      );
    }
  };

  const subtotalAmount = cart.reduce((sum, cartItem) => {
    const addOnsTotal = cartItem.customization.addOnIds
      .map(
        (id) =>
          addOnOptions.find((a) => a.id === id)?.price ?? 0,
      )
      .reduce((a, b) => a + b, 0);
    const line =
      (cartItem.item.price + addOnsTotal) * cartItem.quantity;
    return sum + line;
  }, 0);

  const totalAmount = subtotalAmount;
  const totalItems = cart.reduce(
    (sum, cartItem) => sum + cartItem.quantity,
    0,
  );

  const handleCheckout = () => {
    if (cart.length > 0 && pickupDate && pickupTime) {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentConfirm = async (
    paymentMethod: string,
    referenceNumber: string,
  ) => {
    const orderNumber = `BK${Date.now().toString().slice(-6)}`;
    const itemsSnapshot = cart;
    const cancelDeadline = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const newOrder: Order = {
      orderNumber,
      customer: userData.fullName,
      totalAmount,
      subtotalAmount,
      discount: 0,
      paymentMethod,
      referenceNumber,
      pickupDate,
      pickupTime: new Date(
        `${pickupDate}T${pickupTime}`,
      ).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      items: itemsSnapshot,
      status: "pending",
      createdAt: new Date(),
      cancelDeadline: cancelDeadline,
    };

    try {
      // Prepare order items for backend
      const orderItemsData = itemsSnapshot.map((item) => ({
        menuItemId: item.item.id,
        quantity: item.quantity,
        price: item.item.price,
        notes: item.specialInstructions || '',
      }));

      // Send order to backend API
      const response = await api.createOrder(
        userData.fullName,
        itemsSnapshot.length,
        totalAmount,
        userData.phoneNumber || '',
        orderItemsData as any,
        paymentMethod,
        referenceNumber,
        pickupDate,
        pickupTime,
        subtotalAmount,
        newOrder.discount,
        0, // tax - currently 0
        undefined,
        new Date(pickupDate + 'T' + pickupTime).toISOString(),
        userData.id || undefined
      );
      console.log('Order sent to backend:', response);
    } catch (error) {
      console.error('Failed to send order to backend:', error);
      // Still save locally even if API fails
    }

    setCurrentOrder(newOrder);
    setOrders([newOrder, ...orders]);
    
    // Save orders to user-specific localStorage
    const allOrders = [newOrder, ...orders];
    const userOrdersKey = `userOrders_${userData.username}`;
    localStorage.setItem(userOrdersKey, JSON.stringify(allOrders));
    
    setShowPaymentModal(false);
    setShowOrderConfirmation(true);
    setShowInvoice(true); // Show invoice after confirmation
    setCart([]);
  };

  const handleCloseConfirmation = () => {
    setShowOrderConfirmation(false);
    setView("menu");
  };

  const handleCancelOrder = (orderNumber: string) => {
    const order = orders.find(o => o.orderNumber === orderNumber);
    if (!order || !order.cancelDeadline) return;

    const now = new Date();
    const deadline = new Date(order.cancelDeadline);
    const timeRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));

    if (timeRemaining > 0) {
      setOrderToCancel(orderNumber);
      setCancelTimeRemaining(timeRemaining);
    }
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      // Call backend API to update order status in database
      const response = await api.updateOrderStatus(orderToCancel, 'cancelled');
      console.log('[ORDER_CANCELLATION] API response:', response);
      
      // Update frontend state after successful API call
      const updated = orders.map(order =>
        order.orderNumber === orderToCancel
          ? { ...order, status: 'cancelled' as const, cancelDeadline: undefined }
          : order
      );
      setOrders(updated);
      
      // Persist cancellation to user-specific localStorage
      const userOrdersKey = `userOrders_${userData.username}`;
      localStorage.setItem(userOrdersKey, JSON.stringify(updated));
      
      console.log('[ORDER_CANCELLATION] Order', orderToCancel, 'marked as cancelled');
      
      // Broadcast to admin dashboard's localStorage to trigger immediate update
      // This allows admin to see the cancellation in real-time without waiting for polling
      const adminOrdersKey = 'adminAllOrders';
      try {
        const adminOrders = JSON.parse(localStorage.getItem(adminOrdersKey) || '[]');
        const updatedAdminOrders = adminOrders.map((order: any) =>
          order.id === orderToCancel
            ? { ...order, status: 'cancelled' }
            : order
        );
        localStorage.setItem(adminOrdersKey, JSON.stringify(updatedAdminOrders));
        // Trigger storage event for admin dashboard if viewing same window
        window.dispatchEvent(new StorageEvent('storage', {
          key: adminOrdersKey,
          newValue: JSON.stringify(updatedAdminOrders),
          url: window.location.href
        }));
      } catch (e) {
        // Silently fail if admin orders not in localStorage
      }
      
      // Close modal by clearing state
      const cancelledOrderNumber = orderToCancel;
      setOrderToCancel(null);
      setCancelTimeRemaining(0);
      
      // Add success notification
      addNotification(
        `✅ Your order #${cancelledOrderNumber} has been cancelled successfully!`,
        'order_completed',
        cancelledOrderNumber
      );
    } catch (error) {
      console.error('[ORDER_CANCELLATION] Error cancelling order:', error);
      // Show error but keep modal open so user can try again
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order. Please try again.';
      console.error('[ORDER_CANCELLATION] Error details:', errorMessage);
      // Don't close the modal on error - let user see the error message and retry
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Navigation */}
      <header className="bg-card border-b-4 border-primary sticky top-0 z-40 backdrop-blur-lg bg-card/95 shadow-lg">
        <div className="w-full max-w-full px-3 sm:px-4 md:px-6">
          {/* Top Bar */}
          <div className="flex justify-between items-center py-2 sm:py-3 md:py-4">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                src="/images/kipin-logo.png"
                alt="Kipin Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                loading="lazy"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.backgroundColor = '#D97A3A';
                }}
              />
              <div className="hidden sm:block">
                <h1
                  className="text-lg sm:text-2xl"
                  style={{ fontFamily: "var(--font-script)" }}
                >
                  Balay Kalapihan
                </h1>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground hidden md:block">
                    Welcome, {userData.fullName}!
                  </p>
                  <ShopStatusIndicator className="hidden md:flex" />
                </div>
              </div>
              <div className="sm:hidden flex items-center gap-3">
                <h1
                  className="text-lg"
                  style={{ fontFamily: "var(--font-script)" }}
                >
                  Balay Kalapihan
                </h1>
                <ShopStatusIndicator />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-2 rounded-full">
              <button
                onClick={() => setView("menu")}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium ${
                  view === "menu"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-secondary hover:bg-accent/20 hover:text-accent"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button
                onClick={() => setView("cart")}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 relative font-medium ${
                  view === "cart"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-secondary hover:bg-accent/20 hover:text-accent"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setView("about")}
                className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                  view === "about"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-secondary hover:bg-accent/20 hover:text-accent"
                }`}
              >
                About Us
              </button>
              <button
                onClick={() => setView("history")}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium ${
                  view === "history"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-secondary hover:bg-accent/20 hover:text-accent"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 2m6-11a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Order History</span>
              </button>
              <button
                onClick={() => setView("notifications")}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 relative font-medium ${
                  view === "notifications"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-secondary hover:bg-accent/20 hover:text-accent"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span>Notifications</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </nav>

            {/* Profile */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Profile Menu */}
              <div className="hidden sm:block">
                <ProfileMenu
                  userData={userData}
                  onLogout={onLogout}
                  onAccountSettings={() =>
                    setView("account-settings")
                  }
                  onProfile={() => setView("profile")}
                  onPayments={() => setView("payments")}
                />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() =>
                  setIsMobileMenuOpen(!isMobileMenuOpen)
                }
                className="lg:hidden p-2 hover:bg-accent/20 text-secondary rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t-4 border-primary bg-gradient-to-b from-background to-background/95 animate-slide-down shadow-lg max-h-[calc(100vh-180px)] overflow-y-auto">
            <nav className="px-3 sm:px-4 py-2 sm:py-3 space-y-1">
              <button
                onClick={() => {
                  setView("menu");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 font-medium ${
                  view === "menu"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-secondary hover:bg-accent/20 hover:text-accent"
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </button>
              <button
                onClick={() => {
                  setView("cart");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 relative font-medium ${
                  view === "cart"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-secondary hover:bg-accent/20 hover:text-accent"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="ml-auto bg-accent text-accent-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setView("about");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 font-medium ${
                  view === "about"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-secondary hover:bg-accent/20 hover:text-accent"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>About Us</span>
              </button>
              <button
                onClick={() => {
                  setView("history");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 font-medium ${
                  view === "history"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-secondary hover:bg-accent/20 hover:text-accent"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 2m6-11a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Order History</span>
              </button>
              <button
                onClick={() => {
                  setView("notifications");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 relative font-medium ${
                  view === "notifications"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-secondary hover:bg-accent/20 hover:text-accent"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span>Notifications</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="ml-auto bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              <div className="sm:hidden pt-2 border-t border-border mt-2">
                <div className="px-4 py-3 bg-muted/30 rounded-lg mb-2">
                  <p className="text-sm font-medium">
                    {userData.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userData.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setView("profile");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 font-medium mb-2 ${
                    view === "profile"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-secondary hover:bg-accent/20 hover:text-accent"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    setView("account-settings");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 font-medium mb-2 ${
                    view === "account-settings"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-secondary hover:bg-accent/20 hover:text-accent"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Account Settings</span>
                </button>
                <button
                  onClick={() => {
                    setView("payments");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 font-medium mb-2 ${
                    view === "payments"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-secondary hover:bg-accent/20 hover:text-accent"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h.01M11 15h.01M15 15h.01M7 19h.01M11 19h.01M15 19h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                    />
                  </svg>
                  <span>Payments</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-all duration-300 flex items-center gap-3"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-b from-background to-accent/5">
        {view === "about" ? (
          <AboutUs onBack={() => setView("menu")} />
        ) : view === "profile" ? (
          <div className="w-full max-w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-bold mb-8" style={{ fontFamily: "var(--font-display)" }}>
                My Profile
              </h1>

              {/* Profile Information Card */}
              <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{userData.fullName}</h2>
                    <p className="text-muted-foreground">{userData.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-border">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                    <p className="font-medium">{userData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Username</p>
                    <p className="font-medium">{username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

  
              </div>

              {/* Account Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{orders.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Orders</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-primary">₱{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Spent</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{orders.filter(o => o.status === 'completed').length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Completed Orders</p>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                    <div>
                      <p className="font-medium">Order Updates</p>
                      <p className="text-sm text-muted-foreground">Get notified when your order status changes</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                    <div>
                      <p className="font-medium">Promotions</p>
                      <p className="text-sm text-muted-foreground">Receive promo codes and special offers</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded" />
                    <div>
                      <p className="font-medium">New Items</p>
                      <p className="text-sm text-muted-foreground">Be notified about new menu items</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : view === "account-settings" ? (
          <div className="w-full max-w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-bold mb-8" style={{ fontFamily: "var(--font-display)" }}>
                Account Settings
              </h1>

              {/* Edit Information Section */}
              <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Personal Information</h2>
                    <p className="text-sm text-muted-foreground">Update your account details</p>
                  </div>
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <button
                  onClick={() => setShowEditInfo(true)}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 font-medium"
                >
                  Edit Information
                </button>
              </div>

              {/* Change Password Section */}
              <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Password</h2>
                    <p className="text-sm text-muted-foreground">Change your account password</p>
                  </div>
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="w-full bg-secondary/30 border border-secondary py-3 rounded-lg hover:bg-secondary/50 transition-all duration-300 font-medium"
                >
                  Change Password
                </button>
              </div>

              {/* Back Button */}
              <button
                onClick={() => setView("profile")}
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                ← Back to Profile
              </button>
            </div>
          </div>
        ) : view === "notifications" ? (
          <div className="w-full max-w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Notifications
                </h1>
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                    className="text-primary hover:text-primary/80 text-sm transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-2">You'll receive notifications when your orders are updated</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notification => {
                    const typeColors: Record<Notification['type'], string> = {
                      'order_ready': 'bg-green-500/10 text-green-600 border-green-500/30',
                      'order_completed': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                      'order_preparing': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
                      'order_placed': 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                    };
                    
                    const unreadClass = notification.read ? '' : ' bg-primary/5 border-primary/40';
                    
                    return (
                      <div
                        key={notification.id}
                        className={`border rounded-xl p-4 transition-all cursor-pointer hover:shadow-md ${typeColors[notification.type]}${unreadClass}`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-2xl flex-shrink-0">
                            {notification.type === 'order_ready' && '🎉'}
                            {notification.type === 'order_completed' && '✅'}
                            {notification.type === 'order_preparing' && '⏱️'}
                            {notification.type === 'order_placed' && '📦'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`${notification.read ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotifications(notifications.filter(n => n.id !== notification.id));
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-lg"
                    >
                      Clear all notifications
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : view === "payments" ? (
          <div className="w-full max-w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-bold mb-8" style={{ fontFamily: "var(--font-display)" }}>
                Payment History
              </h1>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h.01M11 15h.01M15 15h.01M7 19h.01M11 19h.01M15 19h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                  </svg>
                  <p className="text-muted-foreground mb-4">No payment history yet</p>
                  <button
                    onClick={() => setView("menu")}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Start Ordering
                  </button>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Order #</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Method</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {orders.map(order => (
                          <tr key={order.orderNumber} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium">{order.orderNumber}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{order.paymentMethod}</td>
                            <td className="px-6 py-4 text-sm font-medium">₱{order.totalAmount}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-500/10 text-green-700' :
                                order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                                order.status === 'ready' ? 'bg-primary/10 text-primary' :
                                'bg-yellow-500/10 text-yellow-700'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => {
                                  setCurrentOrder(order);
                                  setShowInvoice(true);
                                }}
                                className="text-primary hover:text-primary/80 transition-colors"
                              >
                                View Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="bg-muted/30 px-6 py-4 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount Paid</p>
                        <p className="text-2xl font-bold text-primary">₱{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Transactions</p>
                        <p className="text-2xl font-bold">{orders.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="text-2xl font-bold text-green-600">₱{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : view === "history" ? (
          <div className="w-full max-w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Order History
              </h1>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 2m6-11a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-muted-foreground mb-4">No orders yet</p>
                  <button
                    onClick={() => setView("menu")}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Start Ordering
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...orders].reverse().map((order, idx) => (
                    <div
                      key={idx}
                      className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all hover:shadow-lg"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Order #</p>
                          <p className="font-semibold text-lg text-foreground">{order.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                          <p className="font-medium text-foreground">
                            {new Date(order.createdAt).toLocaleDateString()} at {order.pickupTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                          <p className="font-semibold text-accent text-lg">₱{order.totalAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                          <p className="font-medium text-foreground">{order.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Status</p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              order.status === 'completed'
                                ? 'bg-green-500/20 text-green-600'
                                : order.status === 'ready'
                                ? 'bg-blue-500/20 text-blue-600'
                                : order.status === 'preparing'
                                ? 'bg-purple-500/20 text-purple-600'
                                : order.status === 'cancelled'
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-yellow-500/20 text-yellow-600'
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Items ({order.items.length})</p>
                            <div className="space-y-1">
                              {order.items.slice(0, 3).map((item, i) => (
                                <p key={i} className="text-sm text-foreground">
                                  {item.quantity}x {item.item.name}
                                </p>
                              ))}
                              {order.items.length > 3 && (
                                <p className="text-sm text-muted-foreground">+{order.items.length - 3} more items</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                            {order.status === 'pending' && order.cancelDeadline && (orderCountdowns[order.orderNumber] || 0) > 0 ? (
                              <>
                                <button
                                  onClick={() => handleCancelOrder(order.orderNumber)}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-all text-sm font-medium"
                                >
                                  Cancel Order ({formatTimeRemaining(orderCountdowns[order.orderNumber] || 0)})
                                </button>
                              </>
                            ) : order.status === 'pending' ? (
                              <p className="text-xs text-muted-foreground py-2">Cancellation window closed</p>
                            ) : null}
                            <button
                              onClick={() => {
                                setCurrentOrder(order);
                                setShowInvoice(true);
                                setIsMobileMenuOpen(false);
                              }}
                              className="flex-1 sm:flex-none px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
                            >
                              View Invoice
                            </button>
                            <button
                              onClick={() => {
                                const rebuilt = order.items.map((ci) => ({
                                  ...ci,
                                  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                }));
                                setCart(rebuilt);
                                setIsMobileMenuOpen(false);
                                setView("cart");
                              }}
                              className="flex-1 sm:flex-none px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-all text-sm font-medium"
                            >
                              Reorder
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : view === "cart" ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-2xl sm:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Your Cart
              </h2>
              <button
                onClick={() => setView("menu")}
                className="lg:hidden text-primary hover:text-primary/80 transition-colors text-sm"
              >
                Continue Shopping
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                </div>
                <h3
                  className="text-lg sm:text-xl mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Your cart is empty
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6">
                  Add some delicious items to get started!
                </p>
                <button
                  onClick={() => setView("menu")}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {cart.map((cartItem) => (
                    <div
                      key={cartItem.id}
                      className="bg-card border border-border rounded-xl p-4 sm:p-6 flex gap-4"
                    >
                      <img
                        src={cartItem.item.image}
                        alt={cartItem.item.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%234A3728%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <h3
                              className="text-base sm:text-lg font-medium truncate"
                              style={{
                                fontFamily:
                                  "var(--font-display)",
                              }}
                            >
                              {cartItem.item.name}
                            </h3>
                            <p className="text-sm text-muted-foreground hidden sm:block">
                              {cartItem.item.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {
                                cartItem.customization
                                  .sugarLevel
                              }{" "}
                              sugar •{" "}
                              {cartItem.customization.iceLevel}
                              {cartItem.customization.addOnIds
                                .length > 0 && (
                                <span className="ml-1">
                                  • +
                                  {
                                    cartItem.customization
                                      .addOnIds.length
                                  }{" "}
                                  add-on
                                  {cartItem.customization
                                    .addOnIds.length > 1
                                    ? "s"
                                    : ""}
                                </span>
                              )}
                              {cartItem.customization.notes && (
                                <span className="ml-1">
                                  • “
                                  {cartItem.customization.notes}
                                  ”
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              removeFromCart(cartItem.id)
                            }
                            className="text-destructive hover:text-destructive/80 transition-colors p-1"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  cartItem.id,
                                  cartItem.quantity - 1,
                                )
                              }
                              className="w-8 h-8 rounded-md bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  cartItem.id,
                                  cartItem.quantity + 1,
                                )
                              }
                              className="w-8 h-8 rounded-md bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xl sm:text-2xl text-primary font-bold">
                            ₱
                            {(() => {
                              const addOnsTotal =
                                cartItem.customization.addOnIds
                                  .map(
                                    (id) =>
                                      addOnOptions.find(
                                        (a) => a.id === id,
                                      )?.price ?? 0,
                                  )
                                  .reduce((a, b) => a + b, 0);
                              return (
                                (cartItem.item.price +
                                  addOnsTotal) *
                                cartItem.quantity
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                    <h3
                      className="text-xl sm:text-2xl mb-4"
                      style={{
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      Order Summary
                    </h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center text-sm sm:text-base">
                        <span className="text-muted-foreground">
                          Items ({totalItems})
                        </span>
                        <span>₱{subtotalAmount}</span>
                      </div>
                      <div className="pt-3 border-t border-border space-y-3">

                      </div>

                      <div className="pt-3 border-t border-border space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-sm text-muted-foreground block">
                              Pick-up Date
                            </label>
                            <input
                              type="date"
                              value={pickupDate}
                              onChange={(e) =>
                                setPickupDate(e.target.value)
                              }
                              min={new Date()
                                .toISOString()
                                .slice(0, 10)}
                              className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm text-muted-foreground block">
                              Pick-up Time
                            </label>
                            <input
                              type="time"
                              value={pickupTime}
                              onChange={(e) =>
                                setPickupTime(e.target.value)
                              }
                              className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                              required
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Selected schedule:{" "}
                          <span className="font-medium text-foreground">
                            {pickupDate} • {pickupTime}
                          </span>
                        </p>
                      </div>
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between items-center text-xl sm:text-2xl font-bold">
                          <span>Total</span>
                          <span className="text-primary">
                            ₱{totalAmount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleCheckout}
                      disabled={!pickupDate || !pickupTime}
                      className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      Proceed to Payment
                    </button>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Choose your preferred pick-up schedule
                      before paying.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <div className="w-full">
              {/* Menu Section */}
              <div className="w-full bg-gradient-to-br from-foreground to-foreground/95 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl">
                <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-primary/40">
                  <h2
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-1 sm:mb-2 font-bold text-white"
                    style={{
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    Our Menu
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base text-primary/70">
                    Explore our delicious coffee selection
                  </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6 sm:mb-8 md:mb-10 pb-4 sm:pb-6 border-b border-primary/40">
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
                    <input
                      type="text"
                      placeholder="Search for items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-2 sm:py-3 bg-foreground/20 border-2 border-primary/40 rounded-lg text-white placeholder:text-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6 sm:mb-8 md:mb-10 pb-4 sm:pb-6 border-b border-primary/40">
                  <h3 className="text-xs sm:text-sm font-semibold text-primary/80 mb-3 sm:mb-4 uppercase tracking-wide">Filter by Category</h3>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() =>
                          setSelectedCategory(category)
                        }
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-300 text-xs sm:text-sm md:text-base font-medium ${
                          selectedCategory === category
                            ? "bg-primary text-white shadow-md border-2 border-primary"
                            : "bg-foreground/20 border-2 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu Items Grid - Responsive Columns */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-primary/70">
                        No items found matching your search.
                      </p>
                    </div>
                  ) : (
                    filteredItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="bg-foreground/10 border-2 border-primary/40 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] group hover:border-primary backdrop-blur-sm"
                        style={{
                          animation: `fade-in-up 0.5s ease-out ${index * 0.1}s both`,
                        }}
                      >
                        {/* Item Image */}
                        <div className="relative aspect-square overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#4A3728' }}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (img.src !== 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%234A3728%22 width=%22400%22 height=%22400%22/%3E%3C/svg%3E') {
                                img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%234A3728%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2220%22 fill=%22%23fff%22%3EImage not found%3C/text%3E%3C/svg%3E';
                              }
                            }}
                          />
                          {!item.available && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="bg-foreground/10 px-4 py-2 rounded-lg text-sm font-medium text-white border border-primary/40">
                                Unavailable
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 sm:p-4 md:p-5">
                          <div className="mb-2 sm:mb-3">
                            <h3
                              className="text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 group-hover:text-accent transition-colors line-clamp-2 break-words text-white"
                              style={{
                                fontFamily:
                                  "var(--font-display)",
                              }}
                            >
                              {item.name}
                            </h3>
                            <p className="text-xs text-primary/60 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="text-lg sm:text-xl md:text-2xl text-accent font-bold">
                              ₱{item.price}
                            </span>
                            {item.available ? (
                              <button
                                onClick={() => addToCart(item)}
                                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-accent transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] shadow-md text-xs sm:text-sm font-medium w-fit"
                              >
                                Add
                              </button>
                            ) : (
                              <span className="text-sm text-primary/60 italic">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Cart FAB */}
      {view === "menu" && cart.length > 0 && (
        <button
          onClick={() => setView("cart")}
          className="xl:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:bg-primary/90 transition-all duration-300 hover:scale-110 active:scale-95 z-30"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
            {totalItems}
          </span>
        </button>
      )}

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          totalAmount={totalAmount}
          onConfirm={handlePaymentConfirm}
          pickupDate={pickupDate}
          pickupTime={new Date(
            `${pickupDate}T${pickupTime}`,
          ).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}

      {showOrderConfirmation && currentOrder && (
        <OrderConfirmation
          orderNumber={currentOrder.orderNumber}
          totalAmount={currentOrder.totalAmount}
          paymentMethod={currentOrder.paymentMethod}
          referenceNumber={currentOrder.referenceNumber}
          pickupDate={currentOrder.pickupDate}
          pickupTime={currentOrder.pickupTime}
          onClose={handleCloseConfirmation}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          username={username}
          onClose={() => setShowChangePassword(false)}
        />
      )}

      {showEditInfo && (
        <EditInfoModal
          username={username}
          userData={userData}
          onSave={(updated: UserData) => onUpdateUserData(updated)}
          onClose={() => setShowEditInfo(false)}
        />
      )}

      {itemToCustomize && (
        <CustomizeItemModal
          itemName={itemToCustomize.name}
          basePrice={itemToCustomize.price}
          addOns={addOnOptions}
          onCancel={() => setItemToCustomize(null)}
          onConfirm={(customization) => {
            const cartId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            setCart((prev) => [
              ...prev,
              {
                id: cartId,
                item: itemToCustomize,
                quantity: 1,
                customization,
              },
            ]);
            setItemToCustomize(null);
          }}
        />
      )}

      {/* Sales Invoice Modal */}
      {showInvoice && currentOrder && (
        <SalesInvoice
          orderNumber={currentOrder.orderNumber}
          totalAmount={currentOrder.totalAmount}
          subtotalAmount={currentOrder.subtotalAmount}
          paymentMethod={currentOrder.paymentMethod}
          referenceNumber={currentOrder.referenceNumber}
          pickupDate={currentOrder.pickupDate}
          pickupTime={currentOrder.pickupTime}
          items={currentOrder.items.map(ci => ({
            id: ci.id,
            item: {
              id: ci.item.id,
              name: ci.item.name,
              price: ci.item.price
            },
            quantity: ci.quantity,
            customization: {
              addOnIds: ci.customization.addOnIds || [],
              specialInstructions: ci.customization.notes || ''
            }
          }))}
          customerName={userData.fullName}
          createdAt={currentOrder.createdAt}
          onClose={() => {
            setShowInvoice(false);
            setShowOrderConfirmation(false);
          }}
        />
      )}

      {/* Order Cancellation Modal */}
      {orderToCancel && (
        <CancelOrderModal
          orderNumber={orderToCancel}
          timeRemaining={cancelTimeRemaining}
          onConfirm={confirmCancelOrder}
          onCancel={() => {
            setOrderToCancel(null);
            setCancelTimeRemaining(0);
          }}
        />
      )}

      {/* Ready for Pickup Notifications */}
      {readyOrders.map(orderNumber => (
        <ReadyNotification
          key={orderNumber}
          orderNumber={orderNumber}
          onDismiss={() => {
            setReadyOrders(prev => prev.filter(on => on !== orderNumber));
          }}
          onViewOrder={() => {
            setReadyOrders(prev => prev.filter(on => on !== orderNumber));
            setView('menu');
          }}
        />
      ))}

      {/* Footer */}
      <Footer />

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}