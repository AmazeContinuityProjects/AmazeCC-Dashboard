'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, X, Save, AlertCircle, CheckCircle, FileDown, Eye, Plus, Trash2,
  CheckCheck, BadgeCheck, Truck
} from 'lucide-react';
import { Modal } from '@amazecontinuityprojects/amazeui';
import {
  GlassCard, GlassButton, GlassInput, GlassTextarea, LoadingSpinner, EmptyState
} from '@/components/custom/admin/AdminUI';
import { goroboApi, formatINR, type GoroboLine, type GoroboOrderJson } from './gorobo-api';
import { downloadBomPdf } from './gorobo-pdf';

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
];

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function GoRoboBillProcessor() {
  const [orders, setOrders] = useState<GoroboOrderJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GoroboOrderJson | null>(null);
  const [lines, setLines] = useState<GoroboLine[]>([]);
  const [discountPct, setDiscountPct] = useState('0');
  const [gstPct, setGstPct] = useState('18');
  const [shipmentCost, setShipmentCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goroboApi.fetchOrders(statusFilter || undefined, search || undefined);
      setOrders(data.orders);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setMsg('');
    try {
      const data = await goroboApi.fetchOrder(id);
      setDetail(data.order);
      setLines(data.order.items.map(l => ({ ...l })));
      setDiscountPct(String(data.order.discountPct));
      setGstPct(String(data.order.gstPct));
      setShipmentCost(String(data.order.shipmentCost));
      setNotes(data.order.notes);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
      setDetailId(null);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  const updateLine = (idx: number, patch: Partial<GoroboLine>) => {
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addCustomLine = () => {
    setLines(prev => [...prev, { custom: true, name: '', quantity: 1, unitPrice: 0, basePrice: 0, margin: 0 }]);
  };

  const removeLine = (idx: number) => {
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const quote = (() => {
    const subtotal = Math.round(lines.reduce((s, l) => s + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0), 0) * 100) / 100;
    const dp = Math.min(Math.max(Number(discountPct) || 0, 0), 10);
    const discountAmount = Math.round((subtotal * dp) / 100 * 100) / 100;
    const taxable = Math.round((subtotal - discountAmount) * 100) / 100;
    const gp = Math.max(Number(gstPct) || 0, 0);
    const gstAmount = Math.round((taxable * gp) / 100 * 100) / 100;
    const shipment = Math.max(Number(shipmentCost) || 0, 0);
    const total = Math.round((taxable + gstAmount + shipment) * 100) / 100;
    return { subtotal, dp, discountAmount, taxable, gp, gstAmount, shipment, total };
  })();

  const saveQuote = async () => {
    if (!detail) return;
    setBusy(true);
    setMsg('');
    try {
      const data = await goroboApi.saveQuote(detail.id, {
        items: lines,
        discountPct: quote.dp,
        gstPct: quote.gp,
        shipmentCost: quote.shipment,
        notes,
      });
      setDetail(data.order);
      setMsg('Quote saved');
      fetchOrders();
      setTimeout(() => setMsg(''), 2000);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmOrder = async () => {
    if (!detail) return;
    if (!window.confirm('Confirm this quote? The customer will be billed this final amount.')) return;
    setBusy(true);
    setMsg('');
    try {
      const data = await goroboApi.confirmOrder(detail.id);
      setDetail(data.order);
      setMsg('Order confirmed');
      fetchOrders();
      setTimeout(() => setMsg(''), 2000);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const completeOrder = async () => {
    if (!detail) return;
    if (!window.confirm('Complete this order? Wallet entries (profit, GST, vendor cost) will be created.')) return;
    setBusy(true);
    setMsg('');
    try {
      const data = await goroboApi.completeOrder(detail.id);
      setDetail(data.order);
      setMsg('Order completed — wallet entries created');
      fetchOrders();
      setTimeout(() => setMsg(''), 2500);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = () => {
    if (!detail) return;
    downloadBomPdf(detail);
  };

  return (
    <div>
      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm backdrop-blur-xl flex items-center gap-2 ${
          msg.startsWith('Error')
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200/50 text-red-700 dark:text-red-400'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200/50 text-green-700 dark:text-green-400'
        }`}>
          {msg.startsWith('Error') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground placeholder-muted-foreground border-border/50 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.id || 'all'}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                statusFilter === tab.id ? 'bg-card shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <GlassCard padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Customer</th>
                  <th className="px-3 py-2 font-semibold">Phone</th>
                  <th className="px-3 py-2 font-semibold text-right">Lines</th>
                  <th className="px-3 py-2 font-semibold text-right">Total</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-border/30 hover:bg-accent/5 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("en-IN", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-foreground">{order.userName}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{order.phoneNumber}</td>
                    <td className="px-3 py-2.5 text-right">{order.items.length}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold">{formatINR(order.total)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <GlassButton size="sm" variant="ghost" onClick={() => openDetail(order.id)}>
                        <Eye className="w-3.5 h-3.5 mr-1" />View
                      </GlassButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <EmptyState icon={<Search className="w-10 h-10 text-muted-foreground/50 mb-2" />} title="No orders found" description="Orders placed from the GoRoBo storefront will appear here." />
          )}
        </GlassCard>
      )}

      <Modal isOpen={detailId !== null} onClose={closeDetail} title={detail ? `Order ${detail.id.slice(0, 8)} — ${detail.userName}` : 'Loading order...'} maxWidth="max-w-4xl" noPadding={false}>
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[detail.status]}`}>{detail.status}</span>
              <span className="text-muted-foreground">{detail.phoneNumber}</span>
              <span className="text-muted-foreground">Placed {new Date(detail.createdAt).toLocaleString("en-IN")}</span>
              <span className="flex-1" />
              <GlassButton size="sm" variant="secondary" onClick={downloadPdf}>
                <FileDown className="w-4 h-4 mr-1" />BOM PDF
              </GlassButton>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => {
                const lineTotal = Math.round((Number(line.unitPrice) || 0) * (Number(line.quantity) || 0) * 100) / 100;
                return (
                  <div key={idx} className="flex items-center gap-2 rounded-xl border border-border/50 p-2">
                    <div className="flex-1 min-w-0">
                      {line.custom ? (
                        <input
                          className="w-full px-2 py-1.5 rounded-lg border bg-background text-sm border-border/50 outline-none focus:ring-2 focus:ring-accent/20"
                          placeholder="Custom item name"
                          value={line.name || ''}
                          onChange={e => updateLine(idx, { name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm font-semibold text-foreground truncate">{line.name || line.itemId}</p>
                      )}
                      {!line.custom && (
                        <p className="text-[11px] text-muted-foreground">
                          margin {formatINR(line.margin ?? 0)}/unit
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        className="w-16 px-2 py-1.5 rounded-lg border bg-background text-sm text-right border-border/50 outline-none focus:ring-2 focus:ring-accent/20"
                        value={line.quantity}
                        onChange={e => updateLine(idx, { quantity: Number(e.target.value) })}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 px-2 py-1.5 rounded-lg border bg-background text-sm text-right border-border/50 outline-none focus:ring-2 focus:ring-accent/20"
                        value={line.unitPrice}
                        onChange={e => updateLine(idx, { unitPrice: Number(e.target.value) })}
                      />
                      <span className="w-24 text-right font-mono text-sm font-semibold">{formatINR(lineTotal)}</span>
                      <button onClick={() => removeLine(idx)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <GlassButton size="sm" variant="secondary" onClick={addCustomLine}>
                <Plus className="w-4 h-4 mr-1" />Add Item (not in inventory)
              </GlassButton>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <GlassInput
                label={`Discount % (max 10) — ${formatINR(quote.discountAmount)}`}
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={discountPct}
                onChange={e => setDiscountPct(e.target.value)}
              />
              <GlassInput
                label={`GST % — ${formatINR(quote.gstAmount)}`}
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={gstPct}
                onChange={e => setGstPct(e.target.value)}
              />
              <GlassInput
                label={`Shipment (Rs.) — ${formatINR(quote.shipment)}`}
                type="number"
                min="0"
                step="0.01"
                value={shipmentCost}
                onChange={e => setShipmentCost(e.target.value)}
              />
            </div>
            <GlassTextarea label="Notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />

            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{formatINR(quote.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount ({quote.dp}%)</span><span className="font-mono text-red-500 dark:text-red-400">− {formatINR(quote.discountAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Taxable</span><span className="font-mono">{formatINR(quote.taxable)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST ({quote.gp}%)</span><span className="font-mono">+ {formatINR(quote.gstAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipment</span><span className="font-mono">+ {formatINR(quote.shipment)}</span></div>
              <div className="flex justify-between border-t border-accent/20 pt-2 text-base font-bold">
                <span>Total (customer pays)</span>
                <span className="text-accent">{formatINR(quote.total)}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {detail.status === 'pending' && (
                <>
                  <GlassButton onClick={saveQuote} disabled={busy}>
                    <Save className="w-4 h-4 mr-1" />{busy ? 'Saving...' : 'Save Quote'}
                  </GlassButton>
<GlassButton variant="secondary" onClick={confirmOrder} disabled={busy}>
                    <BadgeCheck className="w-4 h-4 mr-1" />Confirm Quote
                  </GlassButton>
                </>
              )}
              {detail.status === 'confirmed' && (
                <GlassButton onClick={completeOrder} disabled={busy}>
                  <BadgeCheck className="w-4 h-4 mr-1" />{busy ? 'Working...' : 'Complete Order'}
                </GlassButton>
              )}
              {detail.status === 'completed' && (
                <span className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400">
                  <CheckCheck className="w-4 h-4" />Completed — wallet entries created
                </span>
              )}
              {detail.shipmentCost > 0 && detail.status !== 'pending' && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Truck className="w-3.5 h-3.5" />Shipment {formatINR(detail.shipmentCost)}
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
