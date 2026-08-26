'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Plus,
  Trash2,
  Edit2,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  Tag,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Modal,
  LoadingSpinner,
  EmptyState,
  Alert,
  SectionHeader
} from '@/components/custom/admin/AdminUI';
import {
  goroboApi,
  formatINR,
  type GoroboBundleJson,
  type GoroboItemJson,
  type GoroboLine
} from './gorobo-api';

interface GoRoboBundlesProps {
  onUseBundleInOrder?: (bundle: GoroboBundleJson) => void;
}

export default function GoRoboBundles({ onUseBundleInOrder }: GoRoboBundlesProps) {
  const [bundles, setBundles] = useState<GoroboBundleJson[]>([]);
  const [items, setItems] = useState<GoroboItemJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Robotics Kits');
  const [bundlePrice, setBundlePrice] = useState('');
  const [discountPct, setDiscountPct] = useState('0');
  const [image, setImage] = useState('');
  const [bundleLines, setBundleLines] = useState<GoroboLine[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bundlesRes, itemsRes] = await Promise.all([
        goroboApi.fetchBundles(),
        goroboApi.fetchItems(),
      ]);
      setBundles(bundlesRes.bundles || []);
      setItems(itemsRes.items || []);
    } catch (err: any) {
      setMsg({ text: 'Error loading kits: ' + err.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const categories = ['ALL', ...Array.from(new Set(bundles.map(b => b.category))).filter(Boolean)];

  const openAdd = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setCategory('Robotics Kits');
    setBundlePrice('');
    setDiscountPct('0');
    setImage('');
    setBundleLines([]);
    setMsg(null);
    setModalOpen(true);
  };

  const openEdit = (b: GoroboBundleJson) => {
    setEditId(b.id);
    setName(b.name);
    setDescription(b.description || '');
    setCategory(b.category || 'Robotics Kits');
    setBundlePrice(String(b.bundlePrice));
    setDiscountPct(String(b.discountPct ?? 0));
    setImage(b.image || '');
    setBundleLines(b.items || []);
    setMsg(null);
    setModalOpen(true);
  };

  const addLineFromItem = (item: GoroboItemJson) => {
    setBundleLines(prev => {
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

  const updateLineQty = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setBundleLines(prev => prev.filter((_, i) => i !== index));
    } else {
      setBundleLines(prev => prev.map((l, i) => i === index ? { ...l, quantity } : l));
    }
  };

  const removeLine = (index: number) => {
    setBundleLines(prev => prev.filter((_, i) => i !== index));
  };

  // Compute standard individual price sum
  const sumPrice = bundleLines.reduce((acc, l) => acc + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 1), 0);

  const saveBundle = async () => {
    if (!name.trim()) {
      setMsg({ text: 'Kit name is required', variant: 'error' });
      return;
    }
    if (bundleLines.length === 0) {
      setMsg({ text: 'Please add at least one component to the kit', variant: 'error' });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const finalPrice = Number(bundlePrice) > 0 ? Number(bundlePrice) : sumPrice;
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        items: bundleLines,
        bundlePrice: finalPrice,
        discountPct: Number(discountPct) || 0,
        image: image.trim(),
      };

      if (editId) {
        await goroboApi.updateBundle(editId, payload);
      } else {
        await goroboApi.createBundle(payload);
      }

      setMsg({ text: editId ? 'Kit updated successfully!' : 'Kit created successfully!', variant: 'success' });
      setModalOpen(false);
      fetchAll();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteBundle = async (id: string, kitName: string) => {
    if (!confirm(`Are you sure you want to delete the kit "${kitName}"?`)) return;
    try {
      await goroboApi.deleteBundle(id);
      setBundles(prev => prev.filter(b => b.id !== id));
      setMsg({ text: `Kit "${kitName}" deleted successfully`, variant: 'success' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error deleting kit: ' + err.message, variant: 'error' });
    }
  };

  const filtered = bundles.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase()) ||
      b.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || b.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredItemsForAdd = items.filter(it =>
    it.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    it.category.toLowerCase().includes(itemSearch.toLowerCase()) ||
    it.id.toLowerCase().includes(itemSearch.toLowerCase())
  ).slice(0, 6);

  return (
    <div className="space-y-6 animate-fadeIn">
      {msg && (
        <Alert variant={msg.variant}>
          <span>{msg.text}</span>
        </Alert>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Project Kits & Pre-Configured Bundles</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create reusable bill-of-materials packages for student projects (IoT, Robotics, Drones, Starter Kits).
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd} className="flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Create Project Kit</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search kits by name, category, or components..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                    : 'bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Kits Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<Layers className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No project kits found"
            description="Create pre-configured component bundles to speed up quoting and walk-in sales."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(bundle => {
            const rawSum = (bundle.items || []).reduce((sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 1), 0);
            const savings = Math.max(0, rawSum - bundle.bundlePrice);

            return (
              <Card key={bundle.id} className="p-0 overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all shadow-xs group">
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="default" size="sm" className="font-semibold text-xs">
                      {bundle.category}
                    </Badge>
                    <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(bundle)} title="Edit Kit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => deleteBundle(bundle.id, bundle.name)} className="text-destructive hover:bg-destructive/10" title="Delete Kit">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground leading-snug">{bundle.name}</h3>
                    {bundle.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bundle.description}</p>
                    )}
                  </div>

                  {/* Included Items Preview */}
                  <div className="space-y-1.5 bg-muted/20 p-3 rounded-xl border border-border/40">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Included BOM ({bundle.items?.length || 0} components)
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {bundle.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs py-0.5 border-b border-border/20 last:border-0">
                          <span className="text-foreground truncate max-w-[180px] font-medium" title={item.name}>
                            {item.name || item.itemId}
                          </span>
                          <span className="font-mono text-muted-foreground font-bold shrink-0">
                            ×{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer with Price & Quick Action */}
                <div className="p-4 border-t border-border/50 bg-muted/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-foreground">{formatINR(bundle.bundlePrice)}</span>
                      {rawSum > bundle.bundlePrice && (
                        <span className="text-xs text-muted-foreground line-through">{formatINR(rawSum)}</span>
                      )}
                    </div>
                    {savings > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Saves {formatINR(savings)}
                      </span>
                    )}
                  </div>

                  {onUseBundleInOrder && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onUseBundleInOrder(bundle)}
                      className="flex items-center gap-1 text-xs shadow-2xs"
                    >
                      <span>Quote Kit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Bundle Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editId ? "Edit Project Kit" : "Create New Project Kit"}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Kit Name *</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. IoT Weather Station Starter Kit"
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Category</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Robotics Kits, IoT, Drones"
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Description</label>
              <Textarea
                className="mt-1"
                placeholder="Details on what this kit accomplishes and who it is suitable for..."
                rows={2}
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
              />
            </div>

            {/* Component Picker */}
            <div className="space-y-2 border-t border-border/50 pt-3">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Add Components from Inventory ({bundleLines.length} selected)</span>
                <span className="text-xs text-muted-foreground font-mono">
                  BOM Sum: {formatINR(sumPrice)}
                </span>
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search catalog to add components..."
                  value={itemSearch}
                  onChange={(e: any) => setItemSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {itemSearch && (
                <div className="p-2 bg-card border border-border/60 rounded-xl space-y-1 max-h-36 overflow-y-auto shadow-sm">
                  {filteredItemsForAdd.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No matching components in catalog.</p>
                  ) : (
                    filteredItemsForAdd.map(it => (
                      <div key={it.id} className="flex justify-between items-center p-1.5 hover:bg-muted/40 rounded-lg text-xs">
                        <div>
                          <span className="font-bold text-foreground">{it.name}</span>
                          <span className="text-muted-foreground ml-2">({it.category})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{formatINR(it.price)}</span>
                          <Button size="sm" variant="secondary" onClick={() => addLineFromItem(it)} className="h-6 text-[11px] px-2">
                            + Add
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Selected Lines List */}
              <div className="space-y-1.5 bg-muted/20 p-2.5 rounded-xl border border-border/50 max-h-40 overflow-y-auto">
                {bundleLines.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No components added yet. Use the search above.</p>
                ) : (
                  bundleLines.map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-1.5 bg-card rounded-lg border border-border/40 text-xs">
                      <span className="font-medium text-foreground truncate flex-1">{line.name || line.itemId}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground">{formatINR(line.unitPrice)} ea</span>
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="outline" onClick={() => updateLineQty(idx, line.quantity - 1)} className="h-6 w-6 text-xs">-</Button>
                          <span className="font-bold text-foreground min-w-[2ch] text-center">{line.quantity}</span>
                          <Button size="icon-sm" variant="outline" onClick={() => updateLineQty(idx, line.quantity + 1)} className="h-6 w-6 text-xs">+</Button>
                        </div>
                        <Button size="icon-sm" variant="ghost" onClick={() => removeLine(idx)} className="h-6 w-6 text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
              <div>
                <label className="text-xs font-bold text-foreground">Special Bundle Price (₹)</label>
                <Input
                  type="number"
                  placeholder={`Default: ₹${sumPrice}`}
                  value={bundlePrice}
                  onChange={(e: any) => setBundlePrice(e.target.value)}
                  className="mt-1"
                />
                <span className="text-[10px] text-muted-foreground">Leave blank to use exact component sum ({formatINR(sumPrice)})</span>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Discount % (Optional)</label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  value={discountPct}
                  onChange={(e: any) => setDiscountPct(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={saveBundle} disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Update Kit' : 'Create Kit'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
