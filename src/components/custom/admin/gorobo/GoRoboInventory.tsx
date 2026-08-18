'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, X, Save, AlertCircle, CheckCircle, Pencil, PackageSearch, Tag, Image as ImageIcon
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
}

const emptyForm: ItemForm = {
  name: '',
  description: '',
  category: '',
  basePrice: '',
  margin: '',
  inStock: true,
  image: '',
};

export default function GoRoboInventory() {
  const [items, setItems] = useState<GoroboItemJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goroboApi.fetchItems(search, category || undefined);
      setItems(data.items);
      setCategories(prev =>
        prev.length === 0 ? Array.from(new Set(data.items.map(i => i.category))).filter(Boolean).sort() : prev
      );
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, category]);

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
    });
    setMsg(null);
    setModalOpen(true);
  };

  const computedPrice = (Number(form.basePrice) || 0) + (Number(form.margin) || 0);

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
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        basePrice: Number(form.basePrice) || 0,
        margin: Number(form.margin) || 0,
        inStock: form.inStock,
        image: form.image.trim(),
      };
      if (editId) {
        await goroboApi.updateItem(editId, payload);
      } else {
        await goroboApi.createItem(payload);
      }
      setMsg({ text: editId ? 'Item updated successfully!' : 'Item created successfully!', variant: 'success' });
      setModalOpen(false);
      const data = await goroboApi.fetchItems(search, category || undefined);
      setItems(data.items);
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="GoRoBo Inventory"
        description="Manage electronic components, robotics kits, sensors, base pricing, profit margins, and storefront stock availability."
        action={
          <Button onClick={openAdd} variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        }
      />

      {msg && (
        <Alert variant={msg.variant === 'error' ? 'error' : 'success'} className="mb-4">
          <div className="flex items-center gap-2">
            {msg.variant === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        </Alert>
      )}

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full"
              placeholder="Search items by name or SKU ID..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-60">
            <Select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(c => ({ value: c, label: c }))
              ]}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<PackageSearch className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No items found"
            description={search ? 'Try adjusting your search query or category filter.' : 'No components in inventory yet. Click "Add Item" to create your first component.'}
            action={
              <Button onClick={openAdd} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-muted/40">
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Component</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Category</TableHead>
                  <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Base Cost</TableHead>
                  <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Margin</TableHead>
                  <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Selling Price</TableHead>
                  <TableHead className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Stock Status</TableHead>
                  <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                          ) : (
                            <PackageSearch className="w-5 h-5 text-muted-foreground/60" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[240px] text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-[240px]">ID: {item.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge variant="default" className="text-[11px] font-medium">
                        {item.category || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-mono text-sm text-muted-foreground">
                      {formatINR(item.basePrice)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{formatINR(item.margin)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-mono text-sm font-bold text-foreground">
                      {formatINR(item.price)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <Badge variant={item.inStock ? 'success' : 'danger'} size="sm">
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="h-8 px-2.5">
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Improved Edit / Add Item Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editId ? 'Edit Inventory Component' : 'Add New Component'} 
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input 
                label="Component Name *" 
                placeholder="e.g. Arduino Uno R3, Ultrasonic Sensor HC-SR04"
                value={form.name} 
                onChange={(e: any) => setForm(p => ({ ...p, name: e.target.value }))} 
              />
            </div>
            <div>
              <Input 
                label="Category *" 
                placeholder="e.g. Microcontrollers, Sensors, Motors"
                value={form.category} 
                onChange={(e: any) => setForm(p => ({ ...p, category: e.target.value }))} 
              />
            </div>
          </div>

          <div>
            <Textarea 
              label="Description / Specifications" 
              placeholder="Provide technical specifications, operating voltage, pinouts, etc."
              rows={2}
              value={form.description} 
              onChange={(e: any) => setForm(p => ({ ...p, description: e.target.value }))} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Base Cost (Vendor / Raw Price in ₹) *"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.basePrice}
              onChange={(e: any) => setForm(p => ({ ...p, basePrice: e.target.value }))}
            />
            <Input
              label="Profit Margin (Markup in ₹) *"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.margin}
              onChange={(e: any) => setForm(p => ({ ...p, margin: e.target.value }))}
            />
          </div>

          {/* Live Price Calculator Badge Card */}
          <Card className="bg-primary/5 border border-primary/20 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Final Customer Price</p>
                <p className="text-2xl font-black text-primary font-mono mt-0.5">{formatINR(computedPrice)}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <span className="font-mono">{formatINR(Number(form.basePrice) || 0)}</span> (cost) + <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{formatINR(Number(form.margin) || 0)}</span> (profit)
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Input 
              label="Image URL or Path" 
              placeholder="https://example.com/item.png or /images/products/sensor.png"
              value={form.image} 
              onChange={(e: any) => setForm(p => ({ ...p, image: e.target.value }))} 
            />
            {form.image && (
              <div className="flex items-center gap-3 p-2 bg-muted/40 rounded-xl border border-border/50">
                <div className="w-12 h-12 rounded-lg bg-background overflow-hidden shrink-0 border border-border/50 flex items-center justify-center">
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                </div>
                <div className="min-w-0 text-xs">
                  <p className="font-semibold text-foreground">Image Preview</p>
                  <p className="text-muted-foreground truncate">{form.image}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3.5 bg-muted/30 rounded-2xl border border-border/50">
            <div>
              <p className="text-sm font-semibold text-foreground">Available In Stock</p>
              <p className="text-xs text-muted-foreground">Toggle visibility in the GoRoBo customer storefront</p>
            </div>
            <Switch
              checked={form.inStock}
              onCheckedChange={(checked: boolean) => setForm(p => ({ ...p, inStock: checked }))}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} variant="primary" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : editId ? 'Update Component' : 'Create Component'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
