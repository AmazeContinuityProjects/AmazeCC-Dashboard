'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, X, Save, AlertCircle, CheckCircle, Pencil, PackageSearch, Tag, Image as ImageIcon,
  Trash2, FileDown, Upload, ExternalLink, MapPin, AlertTriangle, ShieldCheck, Filter, ArrowUpDown,
  LayoutGrid, List, Boxes, Layers, Check, Sparkles, ArrowLeft, Eye, Link as LinkIcon, DollarSign,
  TrendingUp, BarChart2, CheckSquare, RefreshCw, FileText
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Switch,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
  SectionHeader
} from '@/components/custom/admin/AdminUI';
import { goroboApi, formatINR, type GoroboItemJson } from './gorobo-api';

interface ItemForm {
  name: string;
  description: string;
  category: string;
  basePrice: string;
  margin: string;
  inStock: boolean;
  image: string;
  sku: string;
  stockQuantity: string;
  lowStockThreshold: string;
  locationBin: string;
  datasheetUrl: string;
  tags: string;
}

const emptyForm: ItemForm = {
  name: '',
  description: '',
  category: '',
  basePrice: '',
  margin: '',
  inStock: true,
  image: '',
  sku: '',
  stockQuantity: '10',
  lowStockThreshold: '5',
  locationBin: '',
  datasheetUrl: '',
  tags: '',
};

const POPULAR_CATEGORIES = [
  'Microcontrollers',
  'Sensors & Modules',
  'Robotics Kits',
  'Motors & Actuators',
  'Wireless & IoT',
  'Power & Batteries',
  'Displays & LEDs',
  'Tools & Accessories',
  'Passive Components'
];

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type ViewMode = 'table' | 'grid';

export default function GoRoboInventory() {
  const [items, setItems] = useState<GoroboItemJson[]>([]);
  const [totalCatalogCount, setTotalCatalogCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Subpage Item Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const isLowStock = stockFilter === 'LOW_STOCK';
      const data = await goroboApi.fetchItems(
        search.trim() || undefined,
        category || undefined,
        isLowStock || undefined,
        220
      );
      setItems(data.items);
      setTotalCatalogCount(data.totalCount || data.items.length);
      setHasMore(Boolean(data.hasMore));
      if (categories.length === 0) {
        const uniqueCats = Array.from(new Set(data.items.map(i => i.category))).filter(Boolean).sort();
        setCategories(uniqueCats);
      }
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, category, stockFilter, categories.length]);

  useEffect(() => {
    const t = setTimeout(fetchItems, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchItems]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setImageLoadError(false);
    setMsg(null);
    setIsEditing(true);
  };

  const openEdit = (item: GoroboItemJson) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      basePrice: String(item.basePrice),
      margin: String(item.margin),
      inStock: item.inStock,
      image: item.image || '',
      sku: item.sku || '',
      stockQuantity: String(item.stockQuantity ?? 0),
      lowStockThreshold: String(item.lowStockThreshold ?? 5),
      locationBin: item.locationBin || '',
      datasheetUrl: item.datasheetUrl || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    });
    setImageLoadError(false);
    setMsg(null);
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setEditId(null);
    setMsg(null);
    fetchItems();
  };

  const quickAdjustStock = async (itemId: string, delta: number) => {
    setAdjustingId(itemId);
    try {
      const res = await goroboApi.adjustStock(itemId, delta);
      if (res.success && res.item) {
        setItems(prev => prev.map(i => i.id === itemId ? res.item : i));
      }
    } catch (err: any) {
      setMsg({ text: 'Failed to adjust stock: ' + err.message, variant: 'error' });
    } finally {
      setAdjustingId(null);
    }
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;
    try {
      await goroboApi.deleteItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setTotalCatalogCount(prev => Math.max(0, prev - 1));
      setMsg({ text: `"${name}" removed from inventory.`, variant: 'success' });
      if (isEditing) {
        closeEditor();
      } else {
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err: any) {
      setMsg({ text: 'Error deleting item: ' + err.message, variant: 'error' });
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      setMsg({ text: 'Component Name and Category are required.', variant: 'error' });
      return;
    }
    if (Number(form.basePrice) < 0 || Number(form.margin) < 0) {
      setMsg({ text: 'Vendor Base Price and Margin must be numbers >= 0.', variant: 'error' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const tagsArray = form.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        basePrice: Number(form.basePrice) || 0,
        margin: Number(form.margin) || 0,
        inStock: form.inStock && Number(form.stockQuantity) > 0,
        image: form.image.trim(),
        sku: form.sku.trim(),
        stockQuantity: Math.max(0, parseInt(form.stockQuantity, 10) || 0),
        lowStockThreshold: Math.max(0, parseInt(form.lowStockThreshold, 10) || 5),
        locationBin: form.locationBin.trim(),
        datasheetUrl: form.datasheetUrl.trim(),
        tags: tagsArray,
      };

      if (editId) {
        await goroboApi.updateItem(editId, payload);
      } else {
        await goroboApi.createItem(payload);
      }

      setMsg({ text: editId ? `"${form.name}" updated successfully!` : `"${form.name}" added to catalog!`, variant: 'success' });
      setIsEditing(false);
      setEditId(null);
      fetchItems();
      setTimeout(() => setMsg(null), 3500);
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // CSV Export
  const exportCsv = () => {
    const headers = ['ID', 'SKU', 'Name', 'Category', 'BasePrice', 'Margin', 'FinalPrice', 'StockQty', 'Threshold', 'LocationBin', 'InStock', 'Image', 'Datasheet'];
    const rows = items.map(i => [
      i.id,
      `"${i.sku || ''}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.basePrice,
      i.margin,
      i.price,
      i.stockQuantity ?? 0,
      i.lowStockThreshold ?? 5,
      `"${i.locationBin || ''}"`,
      i.inStock ? 'YES' : 'NO',
      `"${i.image || ''}"`,
      `"${i.datasheetUrl || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gorobo_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = useMemo(() => {
    return items.filter(i => {
      const qty = Number(i.stockQuantity ?? 0);
      const threshold = Number(i.lowStockThreshold ?? 5);

      if (stockFilter === 'IN_STOCK') return qty > threshold && i.inStock;
      if (stockFilter === 'LOW_STOCK') return qty <= threshold && qty > 0;
      if (stockFilter === 'OUT_OF_STOCK') return qty === 0 || !i.inStock;
      return true;
    });
  }, [items, stockFilter]);

  const computedPrice = (Number(form.basePrice) || 0) + (Number(form.margin) || 0);
  const marginPercent = computedPrice > 0 ? ((Number(form.margin) || 0) / computedPrice * 100).toFixed(1) : '0.0';

  const lowStockCount = useMemo(() => {
    return items.filter(i => Number(i.stockQuantity ?? 0) <= Number(i.lowStockThreshold ?? 5) && Number(i.stockQuantity ?? 0) > 0).length;
  }, [items]);

  const outOfStockCount = useMemo(() => {
    return items.filter(i => Number(i.stockQuantity ?? 0) === 0 || !i.inStock).length;
  }, [items]);

  // =========================================================================
  // FULL SUBPAGE COMPONENT EDITOR / CREATOR (UN-CRAMPED, SPACIOUS, MODERN)
  // =========================================================================
  if (isEditing) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Top Sticky Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/80 backdrop-blur-md p-4 rounded-2xl border border-border/60 shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={closeEditor}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </Button>
            <div className="h-6 w-px bg-border/60 hidden sm:block" />
            <div>
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <span>{editId ? `Editing: ${form.name || 'Component'}` : '✨ Add New Electronic Component'}</span>
                {form.sku && (
                  <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md font-semibold">
                    {form.sku}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {editId ? `Component ID #${editId}` : 'Configure hardware specifications, stock thresholds, vendor pricing, and link media.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {editId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteItem(editId, form.name)}
                className="text-destructive hover:bg-destructive/10 text-xs"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                <span>Delete Component</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={closeEditor} className="text-xs">
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={save} disabled={saving} className="flex items-center gap-1.5 text-xs shadow-sm">
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : editId ? 'Update Component' : 'Create Component'}</span>
            </Button>
          </div>
        </div>

        {msg && (
          <Alert variant={msg.variant}>
            <span>{msg.text}</span>
          </Alert>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 Cols): Specifications, Pricing, Stock */}
          <div className="lg:col-span-7 space-y-6">
            {/* General Information Card */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                <Boxes className="w-4 h-4 text-primary" />
                <span>General Hardware Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Component Full Name *</label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. ESP32-WROOM-32 Development Board"
                    value={form.name}
                    onChange={(e: any) => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">SKU / Barcode ID</label>
                  <Input
                    className="mt-1 font-mono text-xs"
                    placeholder="e.g. MCU-ESP32-01"
                    value={form.sku}
                    onChange={(e: any) => setForm(f => ({ ...f, sku: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Category *</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Microcontrollers, Sensors, Motors"
                  value={form.category}
                  onChange={(e: any) => setForm(f => ({ ...f, category: e.target.value }))}
                />
                {/* Popular category quick selector chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] text-muted-foreground self-center mr-1">Quick Select:</span>
                  {POPULAR_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        form.category === cat
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
                          : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/70'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Technical Highlights & Pinout Description</label>
                <Textarea
                  className="mt-1 text-xs"
                  placeholder="Details on pin count, operating voltage (3.3V/5V), interface (I2C/SPI/UART), microcontroller cores..."
                  rows={4}
                  value={form.description}
                  onChange={(e: any) => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Tags (comma-separated)</label>
                <Input
                  className="mt-1 text-xs"
                  placeholder="e.g. wifi, bluetooth, dual-core, 3.3v, robotics"
                  value={form.tags}
                  onChange={(e: any) => setForm(f => ({ ...f, tags: e.target.value }))}
                />
              </div>
            </Card>

            {/* Pricing & Profit Margin Matrix Card */}
            <Card className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Pricing & Profit Matrix</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {marginPercent}% Margin
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">Vendor Base Cost (₹) *</label>
                  <p className="text-[10px] text-muted-foreground mb-1">What GoRobo pays the supplier</p>
                  <Input
                    type="number"
                    className="font-mono text-sm"
                    placeholder="e.g. 250"
                    value={form.basePrice}
                    onChange={(e: any) => setForm(f => ({ ...f, basePrice: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Store Profit Margin (₹) *</label>
                  <p className="text-[10px] text-muted-foreground mb-1">Amaze retained profit pool</p>
                  <Input
                    type="number"
                    className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-bold"
                    placeholder="e.g. 50"
                    value={form.margin}
                    onChange={(e: any) => setForm(f => ({ ...f, margin: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Final Selling Price (₹)</label>
                  <p className="text-[10px] text-muted-foreground mb-1">Computed: Base + Margin</p>
                  <div className="h-10 flex items-center justify-between px-3 bg-muted/30 rounded-xl border border-primary/30 font-mono font-black text-base text-primary shadow-2xs">
                    <span>{formatINR(computedPrice)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Warehouse & Inventory Management Card */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Inventory & Lab Location</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">Physical Stock Quantity</label>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      type="number"
                      className="font-mono text-sm"
                      placeholder="e.g. 25"
                      value={form.stockQuantity}
                      onChange={(e: any) => setForm(f => ({ ...f, stockQuantity: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Low Stock Alert Threshold</label>
                  <Input
                    type="number"
                    className="mt-1 font-mono text-sm"
                    placeholder="Default: 5"
                    value={form.lowStockThreshold}
                    onChange={(e: any) => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Lab Bin / Shelf Location</label>
                  <Input
                    className="mt-1 text-xs"
                    placeholder="e.g. Bin A-14, Drawer 3B"
                    value={form.locationBin}
                    onChange={(e: any) => setForm(f => ({ ...f, locationBin: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-muted/20 rounded-xl border border-border/50 mt-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">Active on Storefront</span>
                  <p className="text-[11px] text-muted-foreground">Allows students to browse and request quotes for this component.</p>
                </div>
                <Switch
                  checked={form.inStock}
                  onCheckedChange={(checked: boolean) => setForm(f => ({ ...f, inStock: checked }))}
                />
              </div>
            </Card>
          </div>

          {/* Right Column (5 Cols): Image Linking, Datasheet, Live Card Preview */}
          <div className="lg:col-span-5 space-y-6">
            {/* Image Linking & Live Preview Card */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>Component Image Asset</span>
              </h3>

              <div>
                <label className="text-xs font-bold text-foreground">Direct Image URL</label>
                <div className="relative mt-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9 text-xs"
                    placeholder="https://... or /images/..."
                    value={form.image}
                    onChange={(e: any) => {
                      setImageLoadError(false);
                      setForm(f => ({ ...f, image: e.target.value }));
                    }}
                  />
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, image: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Paste any public image URL (PNG/JPG/WEBP/SVG) or relative campus asset path.
                </p>
              </div>

              {/* Live Image Box */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Live Preview</span>
                <div className="w-full h-56 rounded-2xl bg-muted/30 border-2 border-dashed border-border/60 flex flex-col items-center justify-center p-4 overflow-hidden relative group">
                  {form.image && !imageLoadError ? (
                    <img
                      src={form.image}
                      alt={form.name || 'Component Preview'}
                      className="w-full h-full object-contain transition-transform group-hover:scale-105"
                      onError={() => setImageLoadError(true)}
                    />
                  ) : (
                    <div className="text-center space-y-2 p-4">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                      <p className="text-xs font-semibold text-muted-foreground">
                        {imageLoadError ? '⚠️ Image failed to load. Check URL.' : 'No image linked yet'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 max-w-xs">
                        Enter a valid URL above to preview the component photo.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Datasheet & Documentation Card */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                <FileText className="w-4 h-4 text-primary" />
                <span>Datasheet & Documentation</span>
              </h3>

              <div>
                <label className="text-xs font-bold text-foreground">Datasheet / Manual URL</label>
                <div className="relative mt-1">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9 text-xs"
                    placeholder="https://... (PDF, manufacturer specs)"
                    value={form.datasheetUrl}
                    onChange={(e: any) => setForm(f => ({ ...f, datasheetUrl: e.target.value }))}
                  />
                </div>
              </div>

              {form.datasheetUrl && (
                <a
                  href={form.datasheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold border border-primary/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Test & Open Datasheet in New Tab</span>
                </a>
              )}
            </Card>

            {/* Live Storefront Preview Badge Card */}
            <Card className="p-5 space-y-3 bg-gradient-to-br from-card to-muted/30 border-primary/30">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Storefront Card Preview</span>
              </span>

              <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <Badge variant="default" size="sm" className="text-[10px]">
                    {form.category || 'Category'}
                  </Badge>
                  <span className="font-mono text-sm font-black text-foreground">
                    {formatINR(computedPrice)}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-foreground line-clamp-1">
                  {form.name || 'Component Name'}
                </h4>
                {form.locationBin && (
                  <p className="text-[10px] text-muted-foreground font-mono">
                    📍 {form.locationBin}
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN INVENTORY CATALOG VIEW (TABLE / GRID)
  // =========================================================================
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner with Stats & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span>📦 GoRoBo Hardware Catalog</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Physical stock tracking, SKU bin locations, base price margin matrix, and live availability.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportCsv} variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
            <FileDown className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
          <Button onClick={openAdd} variant="primary" size="sm" className="flex items-center gap-1.5 shadow-sm text-xs">
            <Plus className="w-4 h-4" />
            <span>Add New Component</span>
          </Button>
        </div>
      </div>

      {msg && (
        <Alert variant={msg.variant} className="mb-4">
          <span>{msg.text}</span>
        </Alert>
      )}

      {/* Control Bar: Search + Category + View Mode Toggle */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full text-xs"
              placeholder="Search components by name, SKU barcode, ID, or bin location..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="w-full sm:w-56">
            <Select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(c => ({ value: c, label: c }))
              ]}
            />
          </div>
          <div className="flex items-center gap-1 border border-border/50 rounded-xl p-1 bg-muted/20">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stock Filter Chips & 220 Item Notice */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-border/40">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                stockFilter === 'ALL'
                  ? 'bg-card text-foreground border-primary shadow-2xs'
                  : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                  : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                stockFilter === 'LOW_STOCK'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold'
                  : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60'
              }`}
            >
              ⚠️ Low Stock Alert ({lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                stockFilter === 'OUT_OF_STOCK'
                  ? 'bg-destructive/15 text-destructive border-destructive/30 font-bold'
                  : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground font-medium">
            Showing <span className="font-bold text-foreground">{items.length}</span> of <span className="font-bold text-foreground">{totalCatalogCount || items.length}</span> components.
            {hasMore && (
              <span className="text-primary font-semibold ml-1">(Use search to query remaining catalog)</span>
            )}
          </p>
        </div>
      </Card>

      {/* Main Catalog View: Table or Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-xs text-muted-foreground">Loading catalog items...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<PackageSearch className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No inventory items match criteria"
            description="Try changing your search keywords or stock filters."
          />
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => {
            const qty = Number(item.stockQuantity ?? 0);
            const threshold = Number(item.lowStockThreshold ?? 5);
            const isLow = qty <= threshold && qty > 0;
            const isOut = qty === 0 || !item.inStock;

            return (
              <Card key={item.id} className="p-4 flex flex-col justify-between hover:border-primary/40 transition-all shadow-xs group">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[11px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                      {item.sku || `#${item.id}`}
                    </span>
                    <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'} size="sm" className="text-[10px]">
                      {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 leading-snug">
                      <span>{item.name}</span>
                      {item.datasheetUrl && (
                        <a href={item.datasheetUrl} target="_blank" rel="noreferrer" className="text-primary shrink-0" title="Datasheet">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="default" size="sm" className="text-[10px]">
                      {item.category}
                    </Badge>
                    {item.locationBin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        <MapPin className="w-2.5 h-2.5" />
                        {item.locationBin}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-base font-black text-foreground font-mono">{formatINR(item.price)}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Cost: {formatINR(item.basePrice)} (+{formatINR(item.margin)})
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="inline-flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
                      <button
                        onClick={() => quickAdjustStock(item.id, -1)}
                        disabled={adjustingId === item.id || qty <= 0}
                        className="w-5 h-5 flex items-center justify-center rounded bg-card text-xs font-bold hover:bg-muted disabled:opacity-30 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold px-1 text-center min-w-[2ch]">{qty}</span>
                      <button
                        onClick={() => quickAdjustStock(item.id, 1)}
                        disabled={adjustingId === item.id}
                        className="w-5 h-5 flex items-center justify-center rounded bg-card text-xs font-bold hover:bg-muted cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <Button size="icon-sm" variant="primary" onClick={() => openEdit(item)} title="Open Full Editor">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="p-0 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-muted/30">
                  <TableHead className="py-3 px-4 text-xs">SKU / ID</TableHead>
                  <TableHead className="py-3 px-4 text-xs">Component</TableHead>
                  <TableHead className="py-3 px-4 text-xs">Category</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-right">Vendor Cost</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-right">Margin</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-right font-bold">Selling Price</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-center">Stock Level</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-center">Bin Location</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => {
                  const qty = Number(item.stockQuantity ?? 0);
                  const threshold = Number(item.lowStockThreshold ?? 5);
                  const isLow = qty <= threshold && qty > 0;
                  const isOut = qty === 0 || !item.inStock;

                  return (
                    <TableRow key={item.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <TableCell className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {item.sku || `#${item.id}`}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.datasheetUrl && (
                              <a
                                href={item.datasheetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:text-primary/80"
                                title="View Datasheet"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">{item.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge variant="default" size="sm" className="text-[10px]">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                        {formatINR(item.basePrice)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        +{formatINR(item.margin)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-mono text-sm font-bold text-foreground">
                        {formatINR(item.price)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40">
                          <button
                            onClick={() => quickAdjustStock(item.id, -1)}
                            disabled={adjustingId === item.id || qty <= 0}
                            className="w-5 h-5 flex items-center justify-center rounded-md bg-card border border-border/50 text-xs font-bold hover:bg-muted cursor-pointer disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className={`text-xs font-bold px-1.5 min-w-[2.5ch] text-center ${
                            isOut ? 'text-destructive font-black' : isLow ? 'text-amber-500 font-bold' : 'text-foreground'
                          }`}>
                            {qty}
                          </span>
                          <button
                            onClick={() => quickAdjustStock(item.id, 1)}
                            disabled={adjustingId === item.id}
                            className="w-5 h-5 flex items-center justify-center rounded-md bg-card border border-border/50 text-xs font-bold hover:bg-muted cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        {item.locationBin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            <MapPin className="w-3 h-3" />
                            {item.locationBin}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="primary" onClick={() => openEdit(item)} className="h-7 text-xs px-2.5 shadow-2xs" title="Open Full Editor">
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => deleteItem(item.id, item.name)}
                            className="text-destructive hover:bg-destructive/10 h-7 w-7"
                            title="Delete Component"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
