'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, X, Save, AlertCircle, CheckCircle, FileDown, Eye, Plus, Trash2,
  CheckCheck, BadgeCheck, Truck, MapPin, ArrowLeft, Receipt, User, Phone,
  Calendar, FileText, Sparkles, AlertTriangle, Archive, RotateCcw, MessageCircle,
  Printer, Split, Layers, ExternalLink, RefreshCw, ShoppingCart, ArrowRight,
  Boxes, ShieldCheck, Tag
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
  Modal
} from '@/components/custom/admin/AdminUI';
import {
  goroboApi,
  formatINR,
  type GoroboLine,
  type GoroboOrderJson,
  type GoroboItemJson,
  type GoroboBundleJson
} from './gorobo-api';
import { downloadBomPdf, downloadThermalReceiptPdf } from './gorobo-pdf';

const STATUS_TABS = [
  { id: '', label: 'All Orders' },
  { id: 'pending', label: 'Pending Quotes' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'processing', label: 'Packaging' },
  { id: 'ready', label: 'Ready for Pickup' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
];

export default function GoRoboBillProcessor() {
  const [orders, setOrders] = useState<GoroboOrderJson[]>([]);
  const [catalogItems, setCatalogItems] = useState<GoroboItemJson[]>([]);
  const [itemMap, setItemMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Full-Page Order Editor state
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GoroboOrderJson | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [lines, setLines] = useState<GoroboLine[]>([]);
  const [discountPct, setDiscountPct] = useState('0');
  const [gstPct, setGstPct] = useState('18');
  const [shipmentCost, setShipmentCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('normal');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);

  // Catalog Item Picker inside Order Editor
  const [catalogSearch, setCatalogSearch] = useState('');

  // Custom Item Modal inside Order Editor (with Save to Catalog toggle)
  const [addCustomModal, setAddCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Components');
  const [customPrice, setCustomPrice] = useState('');
  const [customBasePrice, setCustomBasePrice] = useState('');
  const [customMargin, setCustomMargin] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [saveToCatalog, setSaveToCatalog] = useState(false);
  const [customSku, setCustomSku] = useState('');
  const [customLocationBin, setCustomLocationBin] = useState('');

  // POS Create Order Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');
  const [posDeliveryMode, setPosDeliveryMode] = useState('counter_pickup');
  const [posLines, setPosLines] = useState<GoroboLine[]>([]);
  const [posDiscountPct, setPosDiscountPct] = useState('0');
  const [posGstPct, setPosGstPct] = useState('18');
  const [posShipmentCost, setPosShipmentCost] = useState('0');
  const [posNotes, setPosNotes] = useState('');
  const [posSearchItem, setPosSearchItem] = useState('');
  const [creatingPos, setCreatingPos] = useState(false);

  // Load catalog lookup
  const loadCatalog = useCallback(async () => {
    try {
      const res = await goroboApi.fetchItems('', undefined, undefined, 500);
      if (res.items && Array.isArray(res.items)) {
        setCatalogItems(res.items);
        const map = new Map<string, string>();
        res.items.forEach(it => {
          if (it.id && it.name) map.set(it.id, it.name);
        });
        setItemMap(map);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

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

  // Open Full-Page Order Editor
  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setLoadingDetail(true);
    setMsg(null);
    try {
      const data = await goroboApi.fetchOrder(id);
      const resolvedLines: GoroboLine[] = (data.order.items || []).map(l => {
        const resolvedName = (l.name && l.name.trim() && l.name !== l.itemId)
          ? l.name
          : (l.itemId && itemMap.get(l.itemId)) || l.name || l.itemId || 'Product Component';
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
      setDeliveryMode(data.order.deliveryMode || 'normal');
    } catch (err: any) {
      setMsg({ text: 'Error loading order: ' + err.message, variant: 'error' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
    setMsg(null);
    fetchOrders();
  };

  // Live Calculations for Quote in Editor
  const subtotal = useMemo(() => {
    return Math.round(lines.reduce((sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 1), 0) * 100) / 100;
  }, [lines]);

  const discountAmount = useMemo(() => {
    return Math.round(((subtotal * (Number(discountPct) || 0)) / 100) * 100) / 100;
  }, [subtotal, discountPct]);

  const taxable = useMemo(() => Math.round((subtotal - discountAmount) * 100) / 100, [subtotal, discountAmount]);

  const gstAmount = useMemo(() => {
    return Math.round(((taxable * (Number(gstPct) || 0)) / 100) * 100) / 100;
  }, [taxable, gstPct]);

  const grandTotal = useMemo(() => {
    return Math.round((taxable + gstAmount + (Number(shipmentCost) || 0)) * 100) / 100;
  }, [taxable, gstAmount, shipmentCost]);

  // Line Item actions
  const updateLineQty = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setLines(prev => prev.filter((_, i) => i !== index));
    } else {
      setLines(prev => prev.map((l, i) => i === index ? { ...l, quantity } : l));
    }
  };

  const updateLineUnitPrice = (index: number, price: number) => {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, unitPrice: Math.max(0, price) } : l));
  };

  const removeLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const addLineFromCatalog = (item: GoroboItemJson) => {
    setLines(prev => {
      const exists = prev.find(l => l.itemId === item.id);
      if (exists) {
        return prev.map(l => l.itemId === item.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
          basePrice: item.basePrice,
          margin: item.margin,
        }
      ];
    });
    setCatalogSearch('');
  };

  // Add Custom Line and Optionally Save to Catalog
  const addCustomLine = async () => {
    if (!customName.trim()) {
      setMsg({ text: 'Line description is required.', variant: 'error' });
      return;
    }

    const price = Math.max(0, Number(customPrice) || 0);
    const qty = Math.max(1, parseInt(customQty, 10) || 1);
    const basePrice = Math.max(0, Number(customBasePrice) || 0);
    const margin = Math.max(0, Number(customMargin) || (price - basePrice));

    let createdCatalogItemId: string | undefined = undefined;

    if (saveToCatalog) {
      try {
        const createRes = await goroboApi.createItem({
          name: customName.trim(),
          category: customCategory.trim() || 'Components',
          basePrice: basePrice > 0 ? basePrice : price,
          margin: margin > 0 ? margin : 0,
          inStock: true,
          stockQuantity: 10,
          sku: customSku.trim(),
          locationBin: customLocationBin.trim(),
        });
        if (createRes.success && createRes.item) {
          createdCatalogItemId = createRes.item.id;
          await loadCatalog();
        }
      } catch (err: any) {
        console.error('Failed to create catalog item:', err);
      }
    }

    setLines(prev => [
      ...prev,
      {
        itemId: createdCatalogItemId,
        custom: !createdCatalogItemId,
        name: customName.trim(),
        quantity: qty,
        unitPrice: price,
        basePrice,
        margin,
      }
    ]);

    setCustomName('');
    setCustomPrice('');
    setCustomBasePrice('');
    setCustomMargin('');
    setCustomQty('1');
    setCustomSku('');
    setCustomLocationBin('');
    setSaveToCatalog(false);
    setAddCustomModal(false);
    setMsg({
      text: createdCatalogItemId
        ? `Added "${customName}" to quote and created in Catalog!`
        : `Added custom line "${customName}" to quote.`,
      variant: 'success'
    });
    setTimeout(() => setMsg(null), 3000);
  };

  const saveQuote = async () => {
    if (!detailId) return;
    if (lines.length === 0) {
      setMsg({ text: 'Quote must have at least one line item.', variant: 'error' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await goroboApi.saveQuote(detailId, {
        items: lines,
        discountPct: Number(discountPct) || 0,
        gstPct: Number(gstPct) || 18,
        shipmentCost: Number(shipmentCost) || 0,
        notes,
      });
      setDetail(res.order);
      setMsg({ text: 'Quote saved and calculated successfully!', variant: 'success' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!detailId) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await goroboApi.updateOrderStatus(detailId, newStatus, notes, deliveryMode);
      setDetail(res.order);
      setMsg({ text: `Order status updated to "${newStatus.toUpperCase()}"`, variant: 'success' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // WhatsApp Messaging
  const sendWhatsAppQuote = () => {
    if (!detail) return;
    const cleanPhone = detail.phoneNumber.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const itemsList = lines.map(l => `• ${l.name || l.itemId} (x${l.quantity}) - ₹${(l.unitPrice * l.quantity).toFixed(2)}`).join('%0A');
    const text = `Hi ${encodeURIComponent(detail.userName)}! 👋%0A%0AYour GoRoBo Electronics quote for Order *#${detail.id.slice(0, 8).toUpperCase()}* is ready:%0A%0A${itemsList}%0A%0A*Subtotal:* ₹${subtotal.toFixed(2)}%0A*GST (${gstPct}%):* ₹${gstAmount.toFixed(2)}%0A*Total Amount:* ₹${grandTotal.toFixed(2)}%0A%0APlease confirm your order to proceed with packaging! 🚀`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  const sendWhatsAppReady = () => {
    if (!detail) return;
    const cleanPhone = detail.phoneNumber.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = `Hi ${encodeURIComponent(detail.userName)}! 🎉%0A%0AYour GoRoBo hardware order *#${detail.id.slice(0, 8).toUpperCase()}* (₹${detail.total}) is packed and ready for pickup at the Electronics Counter! 📦⚡`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  // Filter catalog items for in-editor search
  const filteredCatalogForEditor = useMemo(() => {
    if (!catalogSearch.trim()) return [];
    const q = catalogSearch.toLowerCase();
    return catalogItems.filter(it =>
      it.name.toLowerCase().includes(q) ||
      it.category.toLowerCase().includes(q) ||
      it.id.toLowerCase().includes(q) ||
      (it.sku && it.sku.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [catalogItems, catalogSearch]);

  // POS Order Creation Logic
  const posSubtotal = useMemo(() => {
    return Math.round(posLines.reduce((sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 1), 0) * 100) / 100;
  }, [posLines]);
  const posDiscountAmount = useMemo(() => {
    return Math.round(((posSubtotal * (Number(posDiscountPct) || 0)) / 100) * 100) / 100;
  }, [posSubtotal, posDiscountPct]);
  const posTaxable = useMemo(() => Math.round((posSubtotal - posDiscountAmount) * 100) / 100, [posSubtotal, posDiscountAmount]);
  const posGstAmount = useMemo(() => {
    return Math.round(((posTaxable * (Number(posGstPct) || 0)) / 100) * 100) / 100;
  }, [posTaxable, posGstPct]);
  const posTotal = useMemo(() => {
    return Math.round((posTaxable + posGstAmount + (Number(posShipmentCost) || 0)) * 100) / 100;
  }, [posTaxable, posGstAmount, posShipmentCost]);

  const addPosLine = (item: GoroboItemJson) => {
    setPosLines(prev => {
      const exists = prev.find(l => l.itemId === item.id);
      if (exists) {
        return prev.map(l => l.itemId === item.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
          basePrice: item.basePrice,
          margin: item.margin,
        }
      ];
    });
  };

  const createPosOrder = async (statusToSet: string = 'confirmed') => {
    if (!posCustomerName.trim() || !posCustomerPhone.trim()) {
      setMsg({ text: 'Customer name and phone number are required.', variant: 'error' });
      return;
    }
    if (posLines.length === 0) {
      setMsg({ text: 'Please add at least one component to the order.', variant: 'error' });
      return;
    }

    setCreatingPos(true);
    setMsg(null);
    try {
      const res = await goroboApi.createOrder({
        userName: posCustomerName.trim(),
        phoneNumber: posCustomerPhone.trim(),
        items: posLines,
        discountPct: Number(posDiscountPct) || 0,
        gstPct: Number(posGstPct) || 18,
        shipmentCost: Number(posShipmentCost) || 0,
        notes: posNotes.trim(),
        deliveryMode: posDeliveryMode,
        status: statusToSet,
      });

      setMsg({ text: `Order created successfully (#${res.order.id.slice(0, 8)})!`, variant: 'success' });
      setCreateModalOpen(false);
      setPosLines([]);
      setPosCustomerName('');
      setPosCustomerPhone('');
      fetchOrders();
      openDetail(res.order.id);
    } catch (err: any) {
      setMsg({ text: 'Error creating order: ' + err.message, variant: 'error' });
    } finally {
      setCreatingPos(false);
    }
  };

  const filteredCatalogForPos = useMemo(() => {
    if (!posSearchItem.trim()) return [];
    const q = posSearchItem.toLowerCase();
    return catalogItems.filter(it =>
      it.name.toLowerCase().includes(q) ||
      it.category.toLowerCase().includes(q) ||
      it.id.toLowerCase().includes(q) ||
      (it.sku && it.sku.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [catalogItems, posSearchItem]);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'completed': return <Badge variant="success" size="sm">Completed</Badge>;
      case 'confirmed': return <Badge variant="info" size="sm">Confirmed</Badge>;
      case 'processing': return <Badge variant="purple" size="sm">Packaging</Badge>;
      case 'ready': return <Badge variant="info" size="sm">Ready for Pickup</Badge>;
      case 'archived': return <Badge variant="default" size="sm">Archived</Badge>;
      case 'cancelled': return <Badge variant="danger" size="sm">Cancelled</Badge>;
      default: return <Badge variant="warning" size="sm">Pending Quote</Badge>;
    }
  };

  // ==========================================
  // FULL PAGE ORDER EDITOR VIEW
  // ==========================================
  if (detailId) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Top Back Navigation Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/70 backdrop-blur-md p-4 rounded-2xl border border-border/60 shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={closeDetail}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Orders</span>
            </Button>
            <div className="h-6 w-px bg-border/60 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-foreground">
                  Order #{detail?.id.slice(0, 8).toUpperCase() || detailId.slice(0, 8).toUpperCase()}
                </span>
                {detail && getStatusBadge(detail.status)}
              </div>
              {detail && (
                <p className="text-[11px] text-muted-foreground">
                  Placed by <span className="font-bold text-foreground">{detail.userName}</span> ({detail.phoneNumber}) on {new Date(detail.createdAt).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>

          {detail && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadBomPdf(detail, itemMap)}
                className="flex items-center gap-1.5 text-xs"
                title="Download A4 PDF Tax Invoice with GoRobo Logo"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Invoice PDF</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadThermalReceiptPdf(detail, itemMap)}
                className="flex items-center gap-1.5 text-xs"
                title="Print 80mm POS Thermal Slip"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>80mm Slip</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={sendWhatsAppQuote}
                className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Quote</span>
              </Button>
            </div>
          )}
        </div>

        {msg && (
          <Alert variant={msg.variant}>
            <span>{msg.text}</span>
          </Alert>
        )}

        {loadingDetail || !detail ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="mt-3 text-xs text-muted-foreground">Loading order details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Customer Info & Bill of Materials */}
            <div className="lg:col-span-8 space-y-6">
              {/* Customer Contact & Delivery Info */}
              <Card className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Customer Name</p>
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary" />
                      <span>{detail.userName}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</p>
                    <p className="text-sm font-mono font-bold text-foreground flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-primary" />
                      <span>{detail.phoneNumber}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Delivery Mode</p>
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-primary" />
                      <span className="capitalize">{detail.deliveryMode?.replace(/_/g, ' ') || 'Counter Pickup'}</span>
                    </p>
                  </div>
                </div>
              </Card>

              {/* Item Adder Tools (Catalog Search + Custom Line with Catalog Save) */}
              <Card className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-primary" />
                      <span>Add Components to Bill</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Search catalog or create new custom hardware (which can also be saved into the catalog).
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddCustomModal(true)}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>+ Custom / New Item</span>
                  </Button>
                </div>

                {/* Search Catalog Input & Dropdown */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Type to search and add components from catalog..."
                    value={catalogSearch}
                    onChange={(e: any) => setCatalogSearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                  {catalogSearch && (
                    <button
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {catalogSearch && (
                  <div className="p-2 bg-card border border-border/60 rounded-xl space-y-1 max-h-56 overflow-y-auto shadow-md">
                    {filteredCatalogForEditor.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">No matching components in catalog.</p>
                    ) : (
                      filteredCatalogForEditor.map(it => (
                        <div
                          key={it.id}
                          className="flex justify-between items-center p-2 hover:bg-muted/40 rounded-lg text-xs transition-colors"
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-foreground">{it.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="font-mono">{it.sku || `#${it.id}`}</span>
                              <span>•</span>
                              <span>{it.category}</span>
                              {it.locationBin && <span>• 📍 {it.locationBin}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-foreground">{formatINR(it.price)}</span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => addLineFromCatalog(it)}
                              className="h-7 text-xs px-2.5"
                            >
                              + Add to Bill
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>

              {/* Bill of Materials Line Items Table */}
              <Card className="p-0 overflow-hidden shadow-xs">
                <div className="p-4 bg-muted/20 border-b border-border/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Order Bill of Materials ({lines.length} components)
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground">
                    Subtotal: {formatINR(subtotal)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/30 border-b border-border/40">
                        <TableHead className="py-2.5 px-4 text-xs">Component</TableHead>
                        <TableHead className="py-2.5 px-4 text-xs text-center w-32">Quantity</TableHead>
                        <TableHead className="py-2.5 px-4 text-xs text-right w-32">Unit Price (₹)</TableHead>
                        <TableHead className="py-2.5 px-4 text-xs text-right w-32">Amount (₹)</TableHead>
                        <TableHead className="py-2.5 px-3 text-xs text-right w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                            No line items in this order. Add components using the search box above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        lines.map((line, idx) => (
                          <TableRow key={idx} className="border-b border-border/20 hover:bg-muted/15 transition-colors">
                            <TableCell className="py-3 px-4">
                              <p className="font-bold text-xs text-foreground truncate max-w-sm">
                                {line.name || line.itemId}
                              </p>
                              {line.custom && (
                                <Badge variant="default" size="sm" className="text-[10px] mt-0.5">
                                  Custom Item
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                                <button
                                  onClick={() => updateLineQty(idx, line.quantity - 1)}
                                  className="w-5 h-5 rounded bg-card text-xs font-bold hover:bg-muted cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs font-bold px-1.5 min-w-[2.5ch] text-center">
                                  {line.quantity}
                                </span>
                                <button
                                  onClick={() => updateLineQty(idx, line.quantity + 1)}
                                  className="w-5 h-5 rounded bg-card text-xs font-bold hover:bg-muted cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <Input
                                type="number"
                                className="h-8 text-xs text-right font-mono w-28 ml-auto"
                                value={line.unitPrice}
                                onChange={(e: any) => updateLineUnitPrice(idx, Number(e.target.value))}
                              />
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right font-mono font-bold text-xs text-foreground">
                              {formatINR(Number(line.unitPrice) * Number(line.quantity))}
                            </TableCell>
                            <TableCell className="py-3 px-3 text-right">
                              <button
                                onClick={() => removeLine(idx)}
                                className="text-destructive hover:text-destructive/80 p-1 cursor-pointer"
                                title="Remove line item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Right 4 Cols: Quote Pricing, Workflow & Status Actions */}
            <div className="lg:col-span-4 space-y-6">
              {/* Financial Calculation Matrix */}
              <Card className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border/50">
                  Quote Calculation Matrix
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">Student Discount % (0 - 10%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      className="mt-1 font-mono text-xs"
                      value={discountPct}
                      onChange={(e: any) => setDiscountPct(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Delivery / Packaging Fee (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      className="mt-1 font-mono text-xs"
                      value={shipmentCost}
                      onChange={(e: any) => setShipmentCost(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Internal Notes / Instructions</label>
                    <Textarea
                      rows={2}
                      className="mt-1 text-xs"
                      placeholder="Special instructions or lab bench notes..."
                      value={notes}
                      onChange={(e: any) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Live Summary Breakdown */}
                <div className="space-y-2 text-xs bg-muted/20 p-3.5 rounded-xl border border-border/50 font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount ({discountPct}%):</span>
                      <span>- {formatINR(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxable Amount:</span>
                    <span>{formatINR(taxable)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST ({gstPct}%):</span>
                    <span>+ {formatINR(gstAmount)}</span>
                  </div>
                  {Number(shipmentCost) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping Fee:</span>
                      <span>+ {formatINR(Number(shipmentCost))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-foreground pt-2.5 border-t border-border/60">
                    <span>Grand Total:</span>
                    <span className="text-primary font-black text-lg">{formatINR(grandTotal)}</span>
                  </div>
                </div>
              </Card>

              {/* Status Pipeline & Workflow Actions */}
              <Card className="p-5 space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border/50">
                  Fulfillment Actions
                </h3>

                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveQuote}
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Lock Quote</span>
                  </Button>

                  {detail.status === 'pending' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateStatus('confirmed')}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm Order</span>
                    </Button>
                  )}

                  {detail.status === 'confirmed' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateStatus('processing')}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-1.5 text-purple-600 dark:text-purple-400"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Move to Packaging</span>
                    </Button>
                  )}

                  {(detail.status === 'processing' || detail.status === 'confirmed') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        updateStatus('ready');
                        sendWhatsAppReady();
                      }}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Mark Ready & Notify WhatsApp</span>
                    </Button>
                  )}

                  {detail.status !== 'completed' && detail.status !== 'archived' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateStatus('completed')}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      <span>Complete & Fulfill</span>
                    </Button>
                  )}

                  {detail.status === 'archived' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus('pending')}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restore Order</span>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus('archived')}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-1.5 text-destructive"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Archive Order</span>
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Add Custom Item Modal (with Save to Catalog checkbox) */}
        {addCustomModal && (
          <Modal
            isOpen={addCustomModal}
            onClose={() => setAddCustomModal(false)}
            title="Add Custom Component or Service"
          >
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-foreground">Component / Service Name *</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. 3D Printing Service / Custom Wire Harness"
                  value={customName}
                  onChange={(e: any) => setCustomName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Customer Unit Price (₹) *</label>
                  <Input
                    type="number"
                    className="mt-1 font-mono"
                    placeholder="e.g. 150"
                    value={customPrice}
                    onChange={(e: any) => setCustomPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Quantity</label>
                  <Input
                    type="number"
                    className="mt-1 font-mono"
                    placeholder="1"
                    value={customQty}
                    onChange={(e: any) => setCustomQty(e.target.value)}
                  />
                </div>
              </div>

              {/* Option to Save directly into Catalog */}
              <div className="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveToCatalogCheck"
                    checked={saveToCatalog}
                    onChange={(e) => setSaveToCatalog(e.target.checked)}
                    className="rounded border-border text-primary cursor-pointer w-4 h-4"
                  />
                  <label htmlFor="saveToCatalogCheck" className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Also save this item to the permanent Inventory Catalog</span>
                  </label>
                </div>

                {saveToCatalog && (
                  <div className="space-y-3 pt-2 border-t border-border/40">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-foreground">Category</label>
                        <Input
                          className="mt-1 text-xs"
                          placeholder="e.g. Sensors, Tools"
                          value={customCategory}
                          onChange={(e: any) => setCustomCategory(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-foreground">SKU / Barcode</label>
                        <Input
                          className="mt-1 font-mono text-xs"
                          placeholder="e.g. TOOL-PRINT-01"
                          value={customSku}
                          onChange={(e: any) => setCustomSku(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-foreground">Vendor Cost (₹)</label>
                        <Input
                          type="number"
                          className="mt-1 font-mono text-xs"
                          placeholder="e.g. 100"
                          value={customBasePrice}
                          onChange={(e: any) => setCustomBasePrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-foreground">Bin Location</label>
                        <Input
                          className="mt-1 text-xs"
                          placeholder="e.g. Shelf 2"
                          value={customLocationBin}
                          onChange={(e: any) => setCustomLocationBin(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <Button variant="outline" onClick={() => setAddCustomModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={addCustomLine}>
                  Add to Bill {saveToCatalog && '& Create in Catalog'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ==========================================
  // ORDERS LIST OVERVIEW VIEW
  // ==========================================
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <SectionHeader
        title="GoRoBo Orders & BOM Quoter"
        description="Process customer BOM quote submissions, generate WhatsApp quotes, print POS receipts, and manage order fulfillment."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setPosLines([]);
              setPosCustomerName('');
              setPosCustomerPhone('');
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New POS / Counter Sale</span>
          </Button>
        }
      />

      {msg && (
        <Alert variant={msg.variant} className="mb-4">
          <span>{msg.text}</span>
        </Alert>
      )}

      {/* Orders Filter Tabs */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search orders by student name, phone number, or order ID..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-bold'
                    : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-xs text-muted-foreground">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<Receipt className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No orders found"
            description="No customer orders match the current filter."
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-muted/30">
                  <TableHead className="py-3 px-4 text-xs">Order ID</TableHead>
                  <TableHead className="py-3 px-4 text-xs">Customer</TableHead>
                  <TableHead className="py-3 px-4 text-xs">Status</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-right">Items</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-right">Total (₹)</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-right">Date</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow
                    key={order.id}
                    onClick={() => openDetail(order.id)}
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <TableCell className="py-3 px-4 font-mono text-xs font-bold text-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <p className="font-bold text-xs text-foreground">{order.userName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{order.phoneNumber}</p>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                      {order.items?.length || 0}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-mono font-bold text-sm text-foreground">
                      {formatINR(order.total)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <Button size="sm" variant="primary" className="h-7 text-xs px-3 shadow-2xs">
                        Open Editor →
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* POS / Walk-in Order Creation Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="⚡ Create New POS / Walk-in Counter Order"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Customer Full Name *</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Rahul Sharma"
                  value={posCustomerName}
                  onChange={(e: any) => setPosCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Phone Number (10 digits) *</label>
                <Input
                  className="mt-1 font-mono"
                  placeholder="e.g. 9876543210"
                  value={posCustomerPhone}
                  onChange={(e: any) => setPosCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Delivery / Pickup Method</label>
              <Select
                value={posDeliveryMode}
                onChange={(e: any) => setPosDeliveryMode(e.target.value)}
                options={[
                  { value: 'counter_pickup', label: '🏫 Counter / Lab Pickup' },
                  { value: 'hostel_delivery', label: '🛏️ Campus Hostel Delivery' },
                  { value: 'courier_shipment', label: '📦 Courier Shipment' },
                ]}
              />
            </div>

            {/* Component Search & Add */}
            <div className="space-y-2 border-t border-border/50 pt-3">
              <label className="text-xs font-bold text-foreground">Add Components ({posLines.length} selected)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search catalog by name, SKU, or category..."
                  value={posSearchItem}
                  onChange={(e: any) => setPosSearchItem(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {posSearchItem && (
                <div className="p-2 bg-card border border-border/60 rounded-xl space-y-1 max-h-36 overflow-y-auto shadow-sm">
                  {filteredCatalogForPos.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No matching components.</p>
                  ) : (
                    filteredCatalogForPos.map(it => (
                      <div key={it.id} className="flex justify-between items-center p-1.5 hover:bg-muted/40 rounded-lg text-xs">
                        <div>
                          <span className="font-bold text-foreground">{it.name}</span>
                          <span className="text-muted-foreground ml-2">({it.category})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{formatINR(it.price)}</span>
                          <Button size="sm" variant="secondary" onClick={() => addPosLine(it)} className="h-6 text-[11px] px-2">
                            + Add
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Selected POS Lines */}
              <div className="space-y-1.5 bg-muted/20 p-2.5 rounded-xl border border-border/50 max-h-40 overflow-y-auto">
                {posLines.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No components added yet.</p>
                ) : (
                  posLines.map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-1.5 bg-card rounded-lg border border-border/40 text-xs">
                      <span className="font-medium text-foreground truncate flex-1">{line.name || line.itemId}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground">{formatINR(line.unitPrice)} ea</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (line.quantity <= 1) setPosLines(prev => prev.filter((_, i) => i !== idx));
                              else setPosLines(prev => prev.map((l, i) => i === idx ? { ...l, quantity: l.quantity - 1 } : l));
                            }}
                            className="w-5 h-5 rounded bg-muted text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold text-foreground min-w-[2ch] text-center">{line.quantity}</span>
                          <button
                            onClick={() => setPosLines(prev => prev.map((l, i) => i === idx ? { ...l, quantity: l.quantity + 1 } : l))}
                            className="w-5 h-5 rounded bg-muted text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                        <button onClick={() => setPosLines(prev => prev.filter((_, i) => i !== idx))} className="text-destructive p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculations */}
            <div className="p-3 rounded-xl bg-muted/10 border border-border/50 flex justify-between items-center text-xs font-mono">
              <span className="text-muted-foreground">Order Total (with 18% GST):</span>
              <span className="text-base font-black text-primary">{formatINR(posTotal)}</span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button variant="secondary" onClick={() => createPosOrder('pending')} disabled={creatingPos}>
                Save as Pending Quote
              </Button>
              <Button variant="primary" onClick={() => createPosOrder('confirmed')} disabled={creatingPos}>
                Confirm & Create Order
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
