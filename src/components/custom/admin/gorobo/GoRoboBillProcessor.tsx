'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, X, Save, AlertCircle, CheckCircle, FileDown, Eye, Plus, Trash2,
  CheckCheck, BadgeCheck, Truck, MapPin, ArrowLeft, Receipt, User, Phone,
  Calendar, FileText, Sparkles, AlertTriangle, Archive, RotateCcw
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Alert,
  EmptyState,
  LoadingSpinner,
  SectionHeader,
  Breadcrumbs
} from '@/components/custom/admin/AdminUI';
import { goroboApi, formatINR, type GoroboLine, type GoroboOrderJson } from './gorobo-api';
import { downloadBomPdf } from './gorobo-pdf';

const STATUS_TABS = [
  { id: '', label: 'All Orders' },
  { id: 'pending', label: 'Pending Quotes' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
];

export default function GoRoboBillProcessor() {
  const [orders, setOrders] = useState<GoroboOrderJson[]>([]);
  const [itemMap, setItemMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GoroboOrderJson | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [lines, setLines] = useState<GoroboLine[]>([]);
  const [discountPct, setDiscountPct] = useState('0');
  const [gstPct, setGstPct] = useState('18');
  const [shipmentCost, setShipmentCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);

  // Load catalog to ensure item IDs are always resolved to human-readable product names
  useEffect(() => {
    goroboApi.fetchItems()
      .then(res => {
        if (res.items && Array.isArray(res.items)) {
          const map = new Map<string, string>();
          res.items.forEach(it => {
            if (it.id && it.name) map.set(it.id, it.name);
          });
          setItemMap(map);
        }
      })
      .catch(() => {});
  }, []);

  const getItemName = (item: GoroboLine): string => {
    if (item.name && item.name.trim()) return item.name;
    if (item.itemId && itemMap.has(item.itemId)) return itemMap.get(item.itemId)!;
    return item.itemId || 'Product Item';
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goroboApi.fetchOrders(statusFilter || undefined, search || undefined);
      setOrders(data.orders);
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
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
    setLoadingDetail(true);
    setMsg(null);
    try {
      // Ensure itemMap is loaded
      let currentMap = itemMap;
      if (currentMap.size === 0) {
        try {
          const catRes = await goroboApi.fetchItems();
          if (catRes.items && Array.isArray(catRes.items)) {
            currentMap = new Map<string, string>();
            catRes.items.forEach(it => {
              if (it.id && it.name) currentMap.set(it.id, it.name);
            });
            setItemMap(currentMap);
          }
        } catch {}
      }

      const data = await goroboApi.fetchOrder(id);
      const resolvedLines: GoroboLine[] = (data.order.items || []).map(l => {
        const resolvedName = (l.name && l.name.trim() && l.name !== l.itemId)
          ? l.name
          : (l.itemId && currentMap.get(l.itemId)) || l.name || l.itemId || 'Product Component';
        return {
          ...l,
          name: resolvedName,
        };
      });

      const resolvedOrder: GoroboOrderJson = {
        ...data.order,
        items: resolvedLines,
      };

      setDetail(resolvedOrder);
      setLines(resolvedLines);
      setDiscountPct(String(data.order.discountPct ?? 0));
      setGstPct(String(data.order.gstPct ?? 18));
      setShipmentCost(String(data.order.shipmentCost ?? 0));
      setNotes(data.order.notes || '');
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
      setDetailId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
    fetchOrders();
  };

  const updateLine = (idx: number, patch: Partial<GoroboLine>) => {
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addCustomLine = () => {
    setLines(prev => [
      ...prev,
      { custom: true, name: '', quantity: 1, unitPrice: 0, basePrice: 0, margin: 0 }
    ]);
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
    setMsg(null);
    try {
      const payloadItems = lines.map(l => ({
        ...l,
        name: getItemName(l),
      }));
      const data = await goroboApi.saveQuote(detail.id, {
        items: payloadItems,
        discountPct: quote.dp,
        gstPct: quote.gp,
        shipmentCost: quote.shipment,
        notes,
      });
      const resolvedSavedOrder: GoroboOrderJson = {
        ...data.order,
        items: data.order.items.map(l => ({
          ...l,
          name: getItemName(l),
        })),
      };
      setDetail(resolvedSavedOrder);
      setLines(resolvedSavedOrder.items);
      setMsg({ text: 'Quote and product details saved successfully!', variant: 'success' });
      fetchOrders();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error saving quote: ' + err.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const confirmOrder = async () => {
    if (!detail) return;
    if (!window.confirm('Confirm this quote? The customer will be billed this final amount.')) return;
    setBusy(true);
    setMsg(null);
    try {
      const data = await goroboApi.confirmOrder(detail.id);
      const resolvedOrder: GoroboOrderJson = {
        ...data.order,
        items: data.order.items.map(l => ({
          ...l,
          name: getItemName(l),
        })),
      };
      setDetail(resolvedOrder);
      setLines(resolvedOrder.items);
      setMsg({ text: 'Order quote confirmed successfully!', variant: 'success' });
      fetchOrders();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error confirming order: ' + err.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const completeOrder = async () => {
    if (!detail) return;
    if (!window.confirm('Complete this order? Wallet entries (profit, GST, vendor cost) will be created.')) return;
    setBusy(true);
    setMsg(null);
    try {
      const data = await goroboApi.completeOrder(detail.id);
      const resolvedOrder: GoroboOrderJson = {
        ...data.order,
        items: data.order.items.map(l => ({
          ...l,
          name: getItemName(l),
        })),
      };
      setDetail(resolvedOrder);
      setLines(resolvedOrder.items);
      setMsg({ text: 'Order completed — wallet entries created successfully!', variant: 'success' });
      fetchOrders();
      setTimeout(() => setMsg(null), 3500);
    } catch (err: any) {
      setMsg({ text: 'Error completing order: ' + err.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = () => {
    if (!detail) return;
    const resolvedOrder: GoroboOrderJson = {
      ...detail,
      items: lines.map(l => ({
        ...l,
        name: getItemName(l),
      })),
      discountPct: quote.dp,
      discountAmount: quote.discountAmount,
      taxable: quote.taxable,
      gstPct: quote.gp,
      gstAmount: quote.gstAmount,
      shipmentCost: quote.shipment,
      total: quote.total,
      notes,
    };
    downloadBomPdf(resolvedOrder, itemMap);
  };

  const archiveOrder = async (orderId?: string) => {
    const targetId = orderId || detail?.id;
    if (!targetId) return;
    const reason = window.prompt('Reason for archiving this unfinalised bill / quote (optional):', 'Customer cancelled / abandoned');
    if (reason === null) return;

    setBusy(true);
    setMsg(null);
    try {
      await goroboApi.archiveOrder(targetId, reason);
      setMsg({ text: 'Customer bill / unfinalised quote archived successfully!', variant: 'success' });
      if (detail && detail.id === targetId) {
        setDetail(prev => prev ? { ...prev, status: 'archived' } : null);
      }
      fetchOrders();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error archiving bill: ' + err.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const unarchiveOrder = async (orderId?: string) => {
    const targetId = orderId || detail?.id;
    if (!targetId) return;
    if (!window.confirm('Restore this bill back to pending status?')) return;

    setBusy(true);
    setMsg(null);
    try {
      await goroboApi.unarchiveOrder(targetId);
      setMsg({ text: 'Bill restored to pending status successfully!', variant: 'success' });
      if (detail && detail.id === targetId) {
        setDetail(prev => prev ? { ...prev, status: 'pending' } : null);
      }
      fetchOrders();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error restoring bill: ' + err.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const getStatusBadgeVariant = (status: string): 'warning' | 'info' | 'success' | 'danger' | 'default' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'completed': return 'success';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  // ==========================================
  // FULL PAGE VIEW: Order / Bill Edit Workflow
  // ==========================================
  if (detailId !== null) {
    if (loadingDetail || !detail) {
      return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading order details...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Full-Page Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={closeDetail} className="h-8 px-2.5 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Orders
              </Button>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                Bill Processor & Quote Editor
              </h1>
              <Badge variant={getStatusBadgeVariant(detail.status)} size="md" className="capitalize">
                {detail.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Order #{detail.id} &bull; Created {new Date(detail.createdAt).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {detail.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => archiveOrder(detail.id)}
                disabled={busy}
                className="text-destructive hover:bg-destructive/10 flex items-center gap-1.5"
              >
                <Archive className="w-4 h-4" />
                Archive Bill
              </Button>
            )}
            {detail.status === 'archived' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => unarchiveOrder(detail.id)}
                disabled={busy}
                className="text-primary flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Restore Bill
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={downloadPdf} className="flex items-center gap-1.5">
              <FileDown className="w-4 h-4" />
              Download BOM PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={closeDetail}>
              Close
            </Button>
          </div>
        </div>

        {detail.status === 'archived' && (
          <Alert variant="warning">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-warning shrink-0" />
                <span>This customer bill is currently <strong>Archived</strong> and was not finalised.</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => unarchiveOrder(detail.id)}
                disabled={busy}
                className="shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Restore to Pending
              </Button>
            </div>
          </Alert>
        )}

        {msg && (
          <Alert variant={msg.variant === 'error' ? 'error' : 'success'}>
            <div className="flex items-center gap-2">
              {msg.variant === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span>{msg.text}</span>
            </div>
          </Alert>
        )}

        {/* Customer & Delivery Context Card */}
        <Card className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Customer</p>
                <p className="font-bold text-foreground truncate">{detail.userName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Phone Number</p>
                <p className="font-bold text-foreground font-mono truncate">{detail.phoneNumber || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Delivery Mode</p>
                <p className="font-bold text-foreground capitalize">
                  {detail.deliveryMode === 'buzz' || detail.deliveryMode === 'bolt' ? '⚡ Buzz Delivery (Chennai)' : 'Standard Courier'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Location Map</p>
                {detail.mapsUrl ? (
                  <a href={detail.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-1 text-xs">
                    View Google Map Pin
                  </a>
                ) : (
                  <span className="text-muted-foreground text-xs">No GPS pin specified</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Main 2-Column Full-Page Invoice Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Column 1: Line Items Table (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-0 overflow-hidden">
              <CardHeader className="p-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Line Items & Components ({lines.length})</CardTitle>
                    <CardDescription className="text-xs">Edit quantities, custom names, and prices for this order.</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={addCustomLine} className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    Add Custom Component
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-b border-border/50 bg-muted/30">
                        <TableHead className="py-2.5 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Product Name & Description</TableHead>
                        <TableHead className="py-2.5 px-3 text-center text-xs uppercase font-semibold text-muted-foreground w-24">Qty</TableHead>
                        <TableHead className="py-2.5 px-3 text-right text-xs uppercase font-semibold text-muted-foreground w-32">Unit Price (₹)</TableHead>
                        <TableHead className="py-2.5 px-4 text-right text-xs uppercase font-semibold text-muted-foreground w-32">Total (₹)</TableHead>
                        <TableHead className="py-2.5 px-2 text-center w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, idx) => {
                        const lineTotal = Math.round((Number(line.unitPrice) || 0) * (Number(line.quantity) || 0) * 100) / 100;
                        const productName = getItemName(line);
                        return (
                          <TableRow key={idx} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                            <TableCell className="py-3 px-4">
                              {line.custom ? (
                                <div className="space-y-1">
                                  <Input
                                    placeholder="Enter custom component name..."
                                    value={line.name || ''}
                                    onChange={(e: any) => updateLine(idx, { name: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                  <Badge variant="warning" size="sm" className="text-[10px]">
                                    Custom Component
                                  </Badge>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-foreground text-sm">{productName}</p>
                                    {line.itemId && (
                                      <Badge variant="default" size="sm" className="text-[10px] font-mono">
                                        SKU: {line.itemId}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    {line.basePrice !== undefined && line.basePrice > 0 && (
                                      <span>Base: {formatINR(line.basePrice)}</span>
                                    )}
                                    {line.margin !== undefined && line.margin > 0 && (
                                      <span>&bull; Margin: +{formatINR(line.margin)}/unit</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="py-3 px-3 text-center">
                              <Input
                                type="number"
                                min="1"
                                max="999"
                                value={line.quantity}
                                onChange={(e: any) => updateLine(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="h-8 text-center text-sm font-semibold font-mono w-20 mx-auto"
                              />
                            </TableCell>

                            <TableCell className="py-3 px-3 text-right">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.unitPrice}
                                onChange={(e: any) => updateLine(idx, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                                className="h-8 text-right text-sm font-semibold font-mono w-28 ml-auto"
                              />
                            </TableCell>

                            <TableCell className="py-3 px-4 text-right font-mono text-sm font-bold text-foreground">
                              {formatINR(lineTotal)}
                            </TableCell>

                            <TableCell className="py-3 px-2 text-center">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => removeLine(idx)}
                                className="text-destructive hover:bg-destructive/10 h-7 w-7"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card className="p-4">
              <Textarea
                label="Order Notes / Customer Instructions"
                placeholder="Include any project requirements, custom assembly notes, or courier tracking details..."
                rows={3}
                value={notes}
                onChange={(e: any) => setNotes(e.target.value)}
              />
            </Card>
          </div>

          {/* Column 2: Bill Summary & Workflow Actions (1 col) */}
          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <CardTitle className="text-base font-bold pb-2 border-b border-border/50 flex items-center justify-between">
                <span>Invoice Computation</span>
                <Receipt className="w-4 h-4 text-primary" />
              </CardTitle>

              {/* Adjustments inputs */}
              <div className="space-y-3">
                <Input
                  label={`Discount % (Max 10%) — Minus ${formatINR(quote.discountAmount)}`}
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={discountPct}
                  onChange={(e: any) => setDiscountPct(e.target.value)}
                />

                <Input
                  label={`GST Tax % — Plus ${formatINR(quote.gstAmount)}`}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={gstPct}
                  onChange={(e: any) => setGstPct(e.target.value)}
                />

                <Input
                  label={`Shipping / Delivery Cost (₹)`}
                  type="number"
                  min="0"
                  step="1"
                  value={shipmentCost}
                  onChange={(e: any) => setShipmentCost(e.target.value)}
                />
              </div>

              {/* Live Price Calculation Summary */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatINR(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount ({quote.dp}%)</span>
                  <span className="font-mono text-destructive">− {formatINR(quote.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxable Amount</span>
                  <span className="font-mono">{formatINR(quote.taxable)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST ({quote.gp}%)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">+ {formatINR(quote.gstAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipment</span>
                  <span className="font-mono">+ {formatINR(quote.shipment)}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2.5 text-base font-bold">
                  <span className="text-foreground">Total Payable</span>
                  <span className="text-primary font-mono text-lg">{formatINR(quote.total)}</span>
                </div>
              </div>

              {/* Actions Box */}
              <div className="space-y-2 pt-2">
                {detail.status === 'pending' && (
                  <>
                    <Button onClick={saveQuote} disabled={busy} variant="primary" className="w-full flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" />
                      {busy ? 'Saving...' : 'Save Updated Quote'}
                    </Button>
                    <Button onClick={confirmOrder} disabled={busy} variant="secondary" className="w-full flex items-center justify-center gap-2">
                      <BadgeCheck className="w-4 h-4" />
                      Confirm & Finalize Quote
                    </Button>
                    <Button
                      onClick={() => archiveOrder(detail.id)}
                      disabled={busy}
                      variant="ghost"
                      className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 text-xs font-semibold pt-1"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Archive Unfinalised Quote
                    </Button>
                  </>
                )}

                {detail.status === 'confirmed' && (
                  <Button onClick={completeOrder} disabled={busy} variant="primary" className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <BadgeCheck className="w-4 h-4" />
                    {busy ? 'Completing...' : 'Complete Order (Credit Wallet)'}
                  </Button>
                )}

                {detail.status === 'completed' && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 shrink-0" />
                    <span>Order Complete. Wallet profit & GST entries have been recorded.</span>
                  </div>
                )}

                {detail.status === 'archived' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/60 text-muted-foreground border border-border/50 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Archive className="w-4 h-4 shrink-0" />
                      <span>This bill is archived and was not finalised.</span>
                    </div>
                    <Button
                      onClick={() => unarchiveOrder(detail.id)}
                      disabled={busy}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore Bill to Pending
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ORDERS LIST VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Bill Processor & Orders"
        description="Process orders from the GoRoBo storefront, adjust component lines, apply custom quotes, and finalize invoices."
      />

      {msg && (
        <Alert variant={msg.variant === 'error' ? 'error' : 'success'} className="mb-4">
          <div className="flex items-center gap-2">
            {msg.variant === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full"
              placeholder="Search by customer name or phone number..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50">
            {STATUS_TABS.map(tab => (
              <Button
                key={tab.id || 'all'}
                variant={statusFilter === tab.id ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(tab.id)}
                className="text-xs font-semibold"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<Receipt className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No orders found"
            description={search || statusFilter ? 'Try adjusting your status filter or search query.' : 'Orders placed from the GoRoBo storefront will appear here.'}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-muted/40">
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Date</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground min-w-[240px]">Ordered Products</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                  <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Total Amount</TableHead>
                  <TableHead className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString("en-IN", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{order.userName}</span>
                        {(order.deliveryMode === 'buzz' || order.deliveryMode === 'bolt') && (
                          <Badge variant="warning" size="sm" className="text-[10px] font-bold">
                            ⚡ Buzz
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      {order.items && order.items.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {order.items.slice(0, 3).map((item, idx) => {
                              const prodName = getItemName(item);
                              return (
                                <Badge
                                  key={idx}
                                  variant="default"
                                  size="sm"
                                  className="text-xs font-semibold max-w-[220px]"
                                >
                                  <span className="truncate" title={prodName}>
                                    {prodName} {item.quantity > 1 ? `(${item.quantity}x)` : ''}
                                  </span>
                                </Badge>
                              );
                            })}
                            {order.items.length > 3 && (
                              <span className="text-[11px] text-muted-foreground font-semibold px-1">
                                +{order.items.length - 3} more
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {order.items.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0)} component(s) total
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No products</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {order.phoneNumber || '—'}
                    </TableCell>

                    <TableCell className="py-3 px-4 text-right font-mono text-sm font-bold text-foreground whitespace-nowrap">
                      {formatINR(order.total)}
                    </TableCell>

                    <TableCell className="py-3 px-4 text-center">
                      <Badge variant={getStatusBadgeVariant(order.status)} size="sm" className="capitalize">
                        {order.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 px-4 text-right">
                      {order.status === 'pending' ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button size="sm" variant="outline" onClick={() => openDetail(order.id)} className="h-8 px-2.5">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Process
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => archiveOrder(order.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : order.status === 'archived' ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button size="sm" variant="outline" onClick={() => openDetail(order.id)} className="h-8 px-2.5">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => unarchiveOrder(order.id)}
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => openDetail(order.id)} className="h-8 px-3">
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          {order.status === 'completed' ? 'View Bill' : 'Process Bill'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
