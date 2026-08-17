'use client';
import { apiFetch } from '@/lib/api';

export interface GoroboItemJson {
  id: string;
  name: string;
  description: string;
  price: number;
  basePrice: number;
  margin: number;
  category: string;
  inStock: boolean;
  image: string;
  updatedAt?: string;
}

export interface GoroboLine {
  itemId?: string;
  name?: string;
  custom?: boolean;
  quantity: number;
  unitPrice: number;
  basePrice?: number;
  margin?: number;
}

export interface GoroboOrderJson {
  id: string;
  userName: string;
  phoneNumber: string;
  items: GoroboLine[];
  total: number;
  status: 'pending' | 'confirmed' | 'completed' | 'archived';
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  taxable: number;
  gstPct: number;
  gstAmount: number;
  shipmentCost: number;
  notes: string;
  deliveryMode?: string;
  mapsUrl?: string;
  createdAt: string;
  archivedAt?: string;
}

export interface WalletEntryJson {
  party: 'customer' | 'vendor';
  kind: 'profit' | 'gst' | 'cost';
  amount: number;
  status: 'pending' | 'settled';
  settled_at: string | null;
  created_at: string;
}

export interface WalletTransaction {
  orderId: string;
  userName: string;
  phoneNumber: string;
  createdAt: string;
  customer: {
    profit: { amount: number; status: 'pending' | 'settled' } | null;
    gst: { amount: number; status: 'pending' | 'settled' } | null;
  };
  vendor: {
    cost: { amount: number; status: 'pending' | 'settled' } | null;
  };
}

export interface WalletSummary {
  profitTotal: number;
  profitSettled: number;
  gstTotal: number;
  gstSettled: number;
  vendorPayable: number;
  vendorPaid: number;
  customerReceivable: number;
  customerReceived: number;
}

export function formatINR(value: number): string {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function handle<T>(res: Promise<Response>): Promise<T> {
  const response = await res;
  const data = await response.json().catch(() => ({ success: false, error: `HTTP ${response.status}` }));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }
  return data as T;
}

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const goroboApi = {
  fetchItems(search?: string, category?: string) {
    return handle<{ success: boolean; count: number; items: GoroboItemJson[] }>(
      apiFetch(`/api/admin/gorobo/items${qs({ search, category })}`)
    );
  },
  createItem(payload: Partial<GoroboItemJson>) {
    return handle<{ success: boolean; item: GoroboItemJson }>(
      apiFetch('/api/admin/gorobo/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  },
  updateItem(id: string, payload: Partial<GoroboItemJson>) {
    return handle<{ success: boolean; item: GoroboItemJson }>(
      apiFetch(`/api/admin/gorobo/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  },
  fetchOrders(status?: string, search?: string) {
    return handle<{ success: boolean; count: number; orders: GoroboOrderJson[] }>(
      apiFetch(`/api/admin/gorobo/orders${qs({ status, search })}`)
    );
  },
  fetchOrder(id: string) {
    return handle<{ success: boolean; order: GoroboOrderJson; wallet: WalletEntryJson[] }>(
      apiFetch(`/api/admin/gorobo/orders/${id}`)
    );
  },
  saveQuote(id: string, payload: { items: GoroboLine[]; discountPct: number; gstPct: number; shipmentCost: number; notes: string }) {
    return handle<{ success: boolean; order: GoroboOrderJson }>(
      apiFetch(`/api/admin/gorobo/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  },
  confirmOrder(id: string) {
    return handle<{ success: boolean; order: GoroboOrderJson }>(
      apiFetch(`/api/admin/gorobo/orders/${id}/confirm`, { method: 'POST' })
    );
  },
  completeOrder(id: string) {
    return handle<{ success: boolean; order: GoroboOrderJson; wallet: WalletEntryJson[] }>(
      apiFetch(`/api/admin/gorobo/orders/${id}/complete`, { method: 'POST' })
    );
  },
  async archiveOrder(id: string, reason?: string) {
    try {
      return await handle<{ success: boolean; order?: GoroboOrderJson }>(
        apiFetch(`/api/admin/gorobo/orders/${id}/archive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        })
      );
    } catch {
      return await handle<{ success: boolean; order?: GoroboOrderJson }>(
        apiFetch(`/api/admin/gorobo/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived', notes: reason ? `[ARCHIVED: ${reason}]` : '[ARCHIVED]' }),
        })
      );
    }
  },
  async unarchiveOrder(id: string) {
    try {
      return await handle<{ success: boolean; order?: GoroboOrderJson }>(
        apiFetch(`/api/admin/gorobo/orders/${id}/unarchive`, {
          method: 'POST',
        })
      );
    } catch {
      return await handle<{ success: boolean; order?: GoroboOrderJson }>(
        apiFetch(`/api/admin/gorobo/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'pending' }),
        })
      );
    }
  },
  fetchWallet() {
    return handle<{ success: boolean; summary: WalletSummary; transactions: WalletTransaction[] }>(
      apiFetch('/api/admin/gorobo/wallet')
    );
  },
  settleWallet(orderId: string, party: 'customer' | 'vendor') {
    return handle<{ success: boolean; settled: number }>(
      apiFetch(`/api/admin/gorobo/wallet/orders/${orderId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ party }),
      })
    );
  },
};
