'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, Plus, X, Save, AlertCircle, CheckCircle, Pencil, PackageSearch, Tag, Image as ImageIcon,
  Trash2, FileDown, Upload, ExternalLink, MapPin, AlertTriangle, ShieldCheck, Filter, ArrowUpDown,
  LayoutGrid, List, Boxes, Layers, Check, Sparkles
} from 'lucide-react';
import {
  Modal,
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
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
    setMsg(null);
    setModalOpen(true);
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
      image: item.image,
      sku: item.sku || '',
      stockQuantity: String(item.stockQuantity ?? 0),
      lowStockThreshold: String(item.lowStockThreshold ?? 5),
      locationBin: item.locationBin || '',
      datasheetUrl: item.datasheetUrl || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    });
    setMsg(null);
    setModalOpen(true);
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
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error deleting item: ' + err.message, variant: 'error' });
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      setMsg({ text: 'Name and category are required.', variant: 'error' });
      return;
    }
    if (Number(form.basePrice) < 0 || Number(form.margin) < 0) {
      setMsg({ text: 'Base price and margin must be greater than or equal to 0.', variant: 'error' });
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
      setMsg({ text: editId ? 'Item updated successfully!' : 'Item created successfully!', variant: 'success' });
      setModalOpen(false);
      fetchItems();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // CSV Export
  const exportCsv = () => {
    const headers = ['ID', 'SKU', 'Name', 'Category', 'BasePrice', 'Margin', 'FinalPrice', 'StockQty', 'Threshold', 'LocationBin', 'InStock'];
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
      i.inStock ? 'YES' : 'NO'
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

  // Quick stats computed from current view
  const lowStockCount = useMemo(() => {
    return items.filter(i => Number(i.stockQuantity ?? 0) <= Number(i.lowStockThreshold ?? 5) && Number(i.stockQuantity ?? 0) > 0).length;
  }, [items]);

  const outOfStockCount = useMemo(() => {
    return items.filter(i => Number(i.stockQuantity ?? 0) === 0 || !i.inStock).length;
  }, [items]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Stats */}
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
            <span>Add Component</span>
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
                    <Button size="icon-sm" variant="ghost" onClick={() => openEdit(item)}>
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
                          <Button size="icon-sm" variant="ghost" onClick={() => openEdit(item)} title="Edit Component">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => deleteItem(item.id, item.name)}
                            className="text-destructive hover:bg-destructive/10"
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

      {/* Add / Edit Component Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editId ? 'Edit Electronic Component' : 'Add New Electronic Component'}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-foreground">Component Name *</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. ESP32-WROOM-32 Development Board"
                  value={form.name}
                  onChange={(e: any) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">SKU / Barcode</label>
                <Input
                  className="mt-1 font-mono text-xs"
                  placeholder="e.g. MCU-ESP32-01"
                  value={form.sku}
                  onChange={(e: any) => setForm(f => ({ ...f, sku: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Category *</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Microcontrollers, Sensors, Motors"
                  value={form.category}
                  onChange={(e: any) => setForm(f => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Physical Bin / Drawer Location</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Bin A-14, Shelf 3, Drawer B"
                  value={form.locationBin}
                  onChange={(e: any) => setForm(f => ({ ...f, locationBin: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Description & Technical Highlights</label>
              <Textarea
                className="mt-1"
                placeholder="Pinout notes, operating voltage (3.3V/5V), features..."
                rows={2}
                value={form.description}
                onChange={(e: any) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Pricing Section */}
            <div className="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pricing Breakdown</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Vendor Cost (₹)</label>
                  <Input
                    type="number"
                    className="mt-1 font-mono"
                    placeholder="e.g. 250"
                    value={form.basePrice}
                    onChange={(e: any) => setForm(f => ({ ...f, basePrice: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Margin Profit (₹)</label>
                  <Input
                    type="number"
                    className="mt-1 font-mono text-emerald-600 dark:text-emerald-400"
                    placeholder="e.g. 50"
                    value={form.margin}
                    onChange={(e: any) => setForm(f => ({ ...f, margin: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Customer Price</label>
                  <div className="mt-1 h-9 flex items-center px-3 bg-card rounded-lg border border-border/60 font-mono font-bold text-sm text-foreground">
                    {formatINR(computedPrice)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Level Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Current Stock Quantity</label>
                <Input
                  type="number"
                  className="mt-1 font-mono"
                  placeholder="e.g. 25"
                  value={form.stockQuantity}
                  onChange={(e: any) => setForm(f => ({ ...f, stockQuantity: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Low Stock Alert Threshold</label>
                <Input
                  type="number"
                  className="mt-1 font-mono"
                  placeholder="Default: 5"
                  value={form.lowStockThreshold}
                  onChange={(e: any) => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Datasheet / Manual URL</label>
                <Input
                  className="mt-1"
                  placeholder="https://..."
                  value={form.datasheetUrl}
                  onChange={(e: any) => setForm(f => ({ ...f, datasheetUrl: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Image Asset URL</label>
                <Input
                  className="mt-1"
                  placeholder="https://..."
                  value={form.image}
                  onChange={(e: any) => setForm(f => ({ ...f, image: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.inStock}
                  onCheckedChange={(checked: boolean) => setForm(f => ({ ...f, inStock: checked }))}
                />
                <span className="text-xs font-bold text-foreground">Active for Storefront Orders</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving...' : editId ? 'Update Item' : 'Create Item'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
