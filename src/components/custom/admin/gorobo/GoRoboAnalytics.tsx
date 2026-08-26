'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingBag,
  Clock,
  CheckCircle,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Boxes,
  Wallet,
  Phone,
  ShieldAlert
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  LoadingSpinner,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/custom/admin/AdminUI';
import { goroboApi, formatINR, type GoroboAnalyticsJson } from './gorobo-api';

interface GoRoboAnalyticsProps {
  onNavigateTab: (tabId: string) => void;
  onOpenCreateOrder?: () => void;
  onOpenAddItem?: () => void;
  onInspectOrder?: (orderId: string) => void;
}

export default function GoRoboAnalytics({
  onNavigateTab,
  onOpenCreateOrder,
  onOpenAddItem,
  onInspectOrder
}: GoRoboAnalyticsProps) {
  const [data, setData] = useState<GoroboAnalyticsJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustingStockId, setAdjustingStockId] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await goroboApi.fetchAnalytics();
      if (res.success && res.analytics) {
        setData(res.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const quickRestock = async (itemId: string, addQty: number = 10) => {
    setAdjustingStockId(itemId);
    try {
      await goroboApi.adjustStock(itemId, addQty);
      await fetchAnalytics();
    } catch (err) {
      console.error('Failed to restock item:', err);
    } finally {
      setAdjustingStockId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading store intelligence & metrics...</p>
      </div>
    );
  }

  const a = data || {
    today: { orders: 0, revenue: 0 },
    orders: { total: 0, pending: 0, confirmed: 0, processing: 0, ready: 0, completed: 0, archived: 0, completedRevenue: 0, activePipelineRevenue: 0, totalQuotedRevenue: 0 },
    inventory: { totalSkus: 0, inStockCount: 0, lowStockCount: 0, outOfStockCount: 0, totalCategories: 0, lowStockAlerts: [] },
    financials: { profitTotal: 0, profitSettled: 0, gstTotal: 0, gstSettled: 0, vendorPayable: 0, vendorPaid: 0 },
    recentOrders: []
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span>⚡ GoRoBo Command Center</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time electronics storefront operations, stock alerts, POS quoting, and financial reconciliation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onOpenCreateOrder && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCreateOrder}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New POS Order</span>
            </Button>
          )}
          {onOpenAddItem && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAddItem}
              className="flex items-center gap-1.5"
            >
              <Boxes className="w-4 h-4" />
              <span>Add Component</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fetchAnalytics}
            disabled={loading}
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card className="p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's Sales</p>
              <p className="text-2xl font-black text-foreground mt-1">{formatINR(a.today.revenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{a.today.orders}</span> orders today
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Completed Revenue */}
        <Card className="p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed Revenue</p>
              <p className="text-2xl font-black text-foreground mt-1">{formatINR(a.orders.completedRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold text-primary">{a.orders.completed}</span> fulfilled orders
              </p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Store Margin Profit */}
        <Card className="p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Margin Profit</p>
              <p className="text-2xl font-black text-foreground mt-1">{formatINR(a.financials.profitTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(a.financials.profitSettled)}</span> settled
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Inventory Stock Status */}
        <Card className="p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Catalog</p>
              <p className="text-2xl font-black text-foreground mt-1">{a.inventory.totalSkus} SKUs</p>
              <p className="text-xs text-muted-foreground mt-1">
                {a.inventory.lowStockCount > 0 ? (
                  <span className="font-bold text-amber-500 flex items-center gap-1 inline-flex">
                    <AlertTriangle className="w-3 h-3" /> {a.inventory.lowStockCount} need reorder
                  </span>
                ) : (
                  <span className="text-emerald-500">All stock optimal</span>
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline Status Ribbon */}
      <Card className="p-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Order Fulfillment Funnel</span>
          <Button variant="ghost" size="sm" onClick={() => onNavigateTab('orders')} className="text-xs text-primary flex items-center gap-1 h-7">
            View All Orders <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/15 transition-all text-center"
          >
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending Quotes</p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">{a.orders.pending}</p>
          </div>
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 cursor-pointer hover:bg-blue-500/15 transition-all text-center"
          >
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Confirmed</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">{a.orders.confirmed}</p>
          </div>
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 cursor-pointer hover:bg-purple-500/15 transition-all text-center"
          >
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Packaging / Prep</p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-0.5">{a.orders.processing}</p>
          </div>
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/15 transition-all text-center"
          >
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Ready for Pickup</p>
            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">{a.orders.ready}</p>
          </div>
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/15 transition-all text-center col-span-2 sm:col-span-1"
          >
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Completed</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{a.orders.completed}</p>
          </div>
        </div>
      </Card>

      {/* Split Section: Low Stock Warnings (Left) & Recent Orders (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Alerts (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Low Stock & Reorder Alerts</span>
              {a.inventory.lowStockAlerts.length > 0 && (
                <Badge variant="warning" size="sm">
                  {a.inventory.lowStockAlerts.length} Attention Required
                </Badge>
              )}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigateTab('inventory')} className="text-xs text-primary h-7">
              Manage Inventory →
            </Button>
          </div>

          {a.inventory.lowStockAlerts.length === 0 ? (
            <Card className="p-8 text-center bg-card/60">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-foreground">Stock Levels Healthy</p>
              <p className="text-xs text-muted-foreground mt-0.5">All catalog items have stock quantities above their minimum thresholds.</p>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-border/50 bg-muted/30">
                    <TableHead className="py-2.5 px-3 text-xs">Component</TableHead>
                    <TableHead className="py-2.5 px-3 text-xs">Category</TableHead>
                    <TableHead className="py-2.5 px-3 text-xs text-center">Remaining</TableHead>
                    <TableHead className="py-2.5 px-3 text-xs text-right">Quick Restock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {a.inventory.lowStockAlerts.slice(0, 6).map(item => (
                    <TableRow key={item.id} className="border-b border-border/30 hover:bg-muted/20">
                      <TableCell className="py-2.5 px-3">
                        <p className="text-xs font-bold text-foreground truncate max-w-[200px]" title={item.name}>
                          {item.name}
                        </p>
                        {item.locationBin && (
                          <span className="text-[10px] text-muted-foreground font-mono">📍 {item.locationBin}</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <Badge variant="default" size="sm" className="text-[10px]">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          item.stockQuantity === 0
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {item.stockQuantity} / {item.lowStockThreshold}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => quickRestock(item.id, 5)}
                            disabled={adjustingStockId === item.id}
                            className="h-7 text-[11px] px-2"
                          >
                            +5
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => quickRestock(item.id, 20)}
                            disabled={adjustingStockId === item.id}
                            className="h-7 text-[11px] px-2"
                          >
                            +20
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Recent Orders Ticker (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Recent Orders</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigateTab('orders')} className="text-xs text-primary h-7">
              Order Desk →
            </Button>
          </div>

          <Card className="p-3 space-y-2.5">
            {a.recentOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No recent orders recorded.</p>
            ) : (
              a.recentOrders.map(ord => (
                <div
                  key={ord.id}
                  onClick={() => onInspectOrder ? onInspectOrder(ord.id) : onNavigateTab('orders')}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/40 transition-colors border border-border/40 cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>{ord.userName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">({ord.itemCount} items)</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground/70" />
                      <span>{ord.phoneNumber}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{formatINR(ord.total)}</p>
                    <Badge
                      variant={
                        ord.status === 'completed' ? 'success' :
                        ord.status === 'confirmed' || ord.status === 'ready' ? 'info' :
                        ord.status === 'processing' ? 'purple' : 'warning'
                      }
                      size="sm"
                      className="text-[10px]"
                    >
                      {ord.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
