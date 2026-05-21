// Production API Service - Uses Vercel API Routes
class BalayKalapihanAPI {
  constructor() {
    this.token = null;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getHeaders(includeAuth = true) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint: string, options: any = {}) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const url = `${apiUrl}/api${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.includeAuth !== false),
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.setToken(null);
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Order endpoints - Admin Dashboard
  async getAllOrders() {
    return this.request('/orders/all', { includeAuth: true });
  }

  // Get customer's own orders
  async getMyOrders() {
    return this.request('/orders', { includeAuth: true });
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      includeAuth: true,
    });
  }

  async deleteOrder(id: string) {
    return this.request(`/orders/${id}`, {
      method: 'DELETE',
      includeAuth: true,
    });
  }

  // Menu endpoints - Admin Dashboard
  async getMenu() {
    return this.request('/menu', { includeAuth: true });
  }

  async createMenuItem(data: any) {
    return this.request('/menu', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async updateMenuItem(id: number, data: any) {
    return this.request(`/menu/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async deleteMenuItem(id: number) {
    return this.request(`/menu/${id}`, {
      method: 'DELETE',
      includeAuth: true,
    });
  }

  async updateMenuItemStock(id: number, stock: number) {
    return this.request(`/menu/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
      includeAuth: true,
    });
  }

  async updateMenuItemStatus(id: number, status: 'available' | 'unavailable') {
    return this.request(`/menu/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      includeAuth: true,
    });
  }

  // Security endpoints
  async getAdminSessions() {
    try {
      return await this.request('/admin/sessions', { includeAuth: true });
    } catch (error) {
      console.error('Error fetching admin sessions:', error);
      return [];
    }
  }

  async getAuditLog() {
    try {
      return await this.request('/admin/audit', { includeAuth: true });
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  }

  async getSecurityLog() {
    try {
      return await this.request('/admin/security', { includeAuth: true });
    } catch (error) {
      console.error('Error fetching security log:', error);
      return null;
    }
  }

  // Notification endpoints
  async getNotifications() {
    try {
      return await this.request('/admin/notifications', { includeAuth: true });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async saveNotifications(notifs: any) {
    try {
      return await this.request('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(notifs),
        includeAuth: true,
      });
    } catch (error) {
      console.error('Error saving notifications:', error);
      return null;
    }
  }

  // Customer endpoints
  async getMenuPublic() {
    return this.request('/menu', { includeAuth: false });
  }

  async createOrder(
    customer: string,
    items: any,
    total: number,
    phoneNumber?: string,
    orderItems?: any[],
    paymentMethod?: string,
    referenceNumber?: string,
    pickupDate?: string,
    pickupTime?: string,
    subtotal?: number,
    discount?: number,
    tax?: number,
    orderNotes?: string,
    estimatedReadyTime?: string,
    customerId?: number
  ) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({
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
        orderNotes,
        estimatedReadyTime,
        customerId,
      }),
      includeAuth: false,
    });
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`, { includeAuth: false });
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<any> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      includeAuth: false,
    });
  }

  async signup(username: string, email: string, fullName: string, password: string, phoneNumber: string): Promise<any> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, fullName, password, phoneNumber }),
      includeAuth: false,
    });
  }
}

export const api = new BalayKalapihanAPI();
