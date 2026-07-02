// Production API Service - Uses Vercel API Routes
class BalayKalapihanAPI {
  constructor() {
    this.token = null;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getHeaders(includeAuth = true, contentType: string | null = 'application/json') {
    const headers: Record<string, string> = {};

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint: string, options: any = {}) {
    const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const baseUrl = import.meta.env.VITE_API_URL || (isLocalDev ? 'http://localhost:5000/api' : '/api');
    const url = `${baseUrl}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.includeAuth !== false, isFormData ? null : 'application/json'),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.setToken(null);
        throw new Error('Authentication failed. Please login again.');
      }

      const text = await response.text();
      let data: any = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Order endpoints - Admin Dashboard
  async getAllOrders() {
    return this.request('/orders/all', { includeAuth: true });
  }

  async getMyOrders(customer?: string) {
    const endpoint = customer ? `/orders?customer=${encodeURIComponent(customer)}` : '/orders';
    return this.request(endpoint, { includeAuth: false });
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
      body: data,
      includeAuth: true,
    });
  }

  async updateMenuItem(id: string | number, data: any) {
    return this.request(`/menu/${id}`, {
      method: 'PATCH',
      body: data,
      includeAuth: true,
    });
  }

  async deleteMenuItem(id: string | number) {
    return this.request(`/menu/${id}`, {
      method: 'DELETE',
      includeAuth: true,
    });
  }

  async updateMenuItemStock(id: string | number, stock: number) {
    return this.request(`/menu/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
      includeAuth: true,
    });
  }

  async updateMenuItemStatus(id: string | number, status: 'available' | 'unavailable') {
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

  async getPendingPaymentVerifications() {
    try {
      return await this.request('/admin/payment-verifications', { includeAuth: true });
    } catch (error) {
      console.error('Error fetching pending payment verifications:', error);
      return { pending: [], count: 0 };
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
    customerId?: number,
    customerEmail?: string,
    paymentProofPath?: string,
    status?: string
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
        customerEmail,
        paymentProofPath,
        status: status || 'pending',
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

  async forgotPassword(email: string): Promise<any> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      includeAuth: false,
    });
  }

  async verifyResetCode(email: string, code: string, newPassword: string): Promise<any> {
    return this.request('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
      includeAuth: false,
    });
  }

  // Customer management endpoints (Admin)
  async getAllCustomers() {
    return this.request('/admin/customers', {
      method: 'GET',
      includeAuth: true,
    });
  }

  async getCustomerDetails(customerId: string) {
    return this.request(`/admin/customers/${customerId}`, {
      method: 'GET',
      includeAuth: true,
    });
  }

  async deleteCustomer(customerId: string) {
    return this.request(`/admin/customers/${customerId}`, {
      method: 'DELETE',
      includeAuth: true,
    });
  }

  async updateCustomer(customerId: string, data: any) {
    return this.request(`/admin/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }
}

export const api = new BalayKalapihanAPI();
