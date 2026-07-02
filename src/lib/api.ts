import { Order, User, InventoryItem, AuditLog, Feedback } from '../types';

async function handleResponse(res: Response) {
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errJson = await res.json();
        errMsg = errJson.error || errJson.message || errMsg;
      } else {
        const text = await res.text();
        if (text && text.length < 200) {
          errMsg = text;
        }
      }
    } catch (_) {}
    throw new Error(errMsg);
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Received non-JSON response from server");
  }
  return res.json();
}

export const api = {
  async getOrders(userId?: string, role?: string): Promise<Order[]> {
    const url = new URL('/api/orders', window.location.origin);
    if (userId) url.searchParams.append('userId', userId);
    if (role) url.searchParams.append('role', role);
    const res = await fetch(url.toString());
    return handleResponse(res);
  },
  
  async createOrder(data: Partial<Order>): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateOrder(id: string, updates: Partial<Order> & { updatedBy?: string }): Promise<Order> {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  async submitFeedback(id: string, data: { rating: number, review: string, customerName?: string }) {
    const res = await fetch(`/api/orders/${id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async authLogin(credentials: any): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(res);
  },

  async authRegister(userData: any): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    return handleResponse(res);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  async getInventory(): Promise<InventoryItem[]> {
    const res = await fetch('/api/inventory');
    return handleResponse(res);
  },

  async refillInventory(id: string, amount: number): Promise<InventoryItem> {
    const res = await fetch('/api/inventory/refill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, amount })
    });
    return handleResponse(res);
  },

  async predictDelivery(params: { service: string, workloadCount: number, weather: string, trafficLevel: string }): Promise<{ prediction: string }> {
    const res = await fetch('/api/predict-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  async getAnalytics(): Promise<{
    dailyOrders: any[];
    revenue: number;
    completedOrders: number;
    customerSatisfaction: number;
    mostRequestedService: string;
    feedbacks: Feedback[];
    auditLogs: AuditLog[];
  }> {
    const res = await fetch('/api/analytics');
    return handleResponse(res);
  },

  async getSupabaseConfig(): Promise<{
    supabaseUrl: string;
    supabaseKeyExists: boolean;
    useSupabase: boolean;
    isConnected: boolean;
    tablesExist: boolean;
  }> {
    const res = await fetch('/api/supabase/config');
    return handleResponse(res);
  },

  async updateSupabaseConfig(data: { supabaseUrl?: string, supabaseKey?: string, useSupabase?: boolean }): Promise<any> {
    const res = await fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async testSupabase(data: { supabaseUrl?: string, supabaseKey?: string }): Promise<{ success: boolean; message: string; error?: string }> {
    const res = await fetch('/api/supabase/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async seedSupabase(): Promise<{ success: boolean; message: string; error?: string }> {
    const res = await fetch('/api/supabase/seed', {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async getPrices(): Promise<{ washFold: number; washDry: number; dryClean: number; ironing: number; }> {
    const res = await fetch('/api/prices');
    return handleResponse(res);
  },

  async updatePrices(data: { washFold: number; washDry: number; dryClean: number; ironing: number; }): Promise<{ success: boolean; prices: any }> {
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};
