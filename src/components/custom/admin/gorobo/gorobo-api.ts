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
  sku?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  locationBin?: string;
  datasheetUrl?: string;
  tags?: string[];
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
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled' | 'archived';
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  taxable: number;
  gstPct: number;
  gstAmount: number;
  gstEnabled?: boolean;
  shipmentCost: number;
  overallMarginType?: 'flat' | 'percent';
  overallMarginValue?: number;
  overallMarginAmount?: number;
  // legacy flat field for backwards compat
  overallMargin?: number;
  notes: string;
  deliveryMode?: string;
  mapsUrl?: string;
  createdAt: string;
  archivedAt?: string;
}

export interface GoroboBundleJson {
  id: string;
  name: string;
  description: string;
  category: string;
  items: GoroboLine[];
  bundlePrice: number;
  discountPct: number;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface GoroboAnalyticsJson {
  today: {
    orders: number;
    revenue: number;
  };
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    ready: number;
    completed: number;
    archived: number;
    completedRevenue: number;
    activePipelineRevenue: number;
    totalQuotedRevenue: number;
  };
  inventory: {
    totalSkus: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalCategories: number;
    lowStockAlerts: Array<{
      id: string;
      name: string;
      category: string;
      stockQuantity: number;
      lowStockThreshold: number;
      locationBin: string;
      price: number;
      inStock: boolean;
    }>;
  };
  financials: {
    profitTotal: number;
    profitSettled: number;
    gstTotal: number;
    gstSettled: number;
    vendorPayable: number;
    vendorPaid: number;
  };
  recentOrders: Array<{
    id: string;
    userName: string;
    phoneNumber: string;
    total: number;
    status: string;
    createdAt: string;
    itemCount: number;
  }>;
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

function qs(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const goroboApi = {
  fetchAnalytics() {
    return handle<{ success: boolean; analytics: GoroboAnalyticsJson }>(
      apiFetch('/api/admin/gorobo/analytics')
    );
  },

  fetchItems(search?: string, category?: string, lowStock?: boolean, limit?: number) {
    return handle<{ success: boolean; count: number; totalCount?: number; hasMore?: boolean; items: GoroboItemJson[] }>(
      apiFetch(`/api/admin/gorobo/items${qs({ search, category, lowStock, limit })}`)
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

  deleteItem(id: string) {
    return handle<{ success: boolean; message: string }>(
      apiFetch(`/api/admin/gorobo/items/${id}`, { method: 'DELETE' })
    );
  },

  adjustStock(itemId: string, delta?: number, stockQuantity?: number) {
    return handle<{ success: boolean; item: GoroboItemJson }>(
      apiFetch('/api/admin/gorobo/items/stock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, delta, stockQuantity }),
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

  createOrder(payload: {
    userName: string;
    phoneNumber: string;
    items: GoroboLine[];
    discountPct?: number;
    gstPct?: number;
    gstEnabled?: boolean;
    shipmentCost?: number;
    overallMarginType?: 'flat' | 'percent';
    overallMarginValue?: number;
    notes?: string;
    deliveryMode?: string;
    status?: string;
  }) {
    return handle<{ success: boolean; order: GoroboOrderJson }>(
      apiFetch('/api/admin/gorobo/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  },

  saveQuote(id: string, payload: { items: GoroboLine[]; discountPct: number; gstPct: number; gstEnabled: boolean; shipmentCost: number; overallMarginType?: 'flat' | 'percent'; overallMarginValue?: number; notes: string }) {
    return handle<{ success: boolean; order: GoroboOrderJson }>(
      apiFetch(`/api/admin/gorobo/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  },

  updateOrderStatus(id: string, status: string, notes?: string, deliveryMode?: string) {
    return handle<{ success: boolean; order: GoroboOrderJson }>(
      apiFetch(`/api/admin/gorobo/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, deliveryMode }),
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
    return handle<{ success: boolean; order?: GoroboOrderJson }>(
      apiFetch(`/api/admin/gorobo/orders/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
    );
  },

  async unarchiveOrder(id: string) {
    return handle<{ success: boolean; order?: GoroboOrderJson }>(
      apiFetch(`/api/admin/gorobo/orders/${id}/unarchive`, {
        method: 'POST',
      })
    );
  },

  fetchBundles() {
    return handle<{ success: boolean; count: number; bundles: GoroboBundleJson[] }>(
      apiFetch('/api/admin/gorobo/bundles')
    );
  },

  createBundle(payload: Partial<GoroboBundleJson>) {
    return handle<{ success: boolean; bundle: GoroboBundleJson }>(
      apiFetch('/api/admin/gorobo/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  },

  updateBundle(id: string, payload: Partial<GoroboBundleJson>) {
    return handle<{ success: boolean; bundle: GoroboBundleJson }>(
      apiFetch(`/api/admin/gorobo/bundles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  },

  deleteBundle(id: string) {
    return handle<{ success: boolean; message: string }>(
      apiFetch(`/api/admin/gorobo/bundles/${id}`, { method: 'DELETE' })
    );
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
