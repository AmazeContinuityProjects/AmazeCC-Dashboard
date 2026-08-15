'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, X, Save, AlertCircle, CheckCircle, Pencil, PackageSearch
} from 'lucide-react';
import { Modal } from '@amazecontinuityprojects/amazeui';
import {
  GlassCard, GlassButton, GlassInput, GlassSelect, LoadingSpinner, EmptyState
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
  const [msg, setMsg] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goroboApi.fetchItems(search, category || undefined);
      setItems(data.items);
      setCategories(prev =>
        prev.length === 0 ? Array.from(new Set(data.items.map(i => i.category))).sort() : prev
      );
    } catch (err: any) {
      setMsg('Error: ' + err.message);
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
    setMsg('');
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
    setMsg('');
    setModalOpen(true);
  };

  const computedPrice = (Number(form.basePrice) || 0) + (Number(form.margin) || 0);

  const save = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      setMsg('Error: name and category are required');
      return;
    }
    if (Number(form.basePrice) < 0 || Number(form.margin) < 0) {
      setMsg('Error: base price and margin must be >= 0');
      return;
    }
    setSaving(true);
    setMsg('');
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
      setMsg(editId ? 'Item updated successfully' : 'Item added successfully');
      setModalOpen(false);
      const data = await goroboApi.fetchItems(search, category || undefined);
      setItems(data.items);
      setTimeout(() => setMsg(''), 2000);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" style={{ verticalAlign: 'middle' }} />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground placeholder-muted-foreground border-border/50 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
            placeholder="Search items by name or id..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <GlassSelect
          className="sm:w-56"
          options={[{ value: '', label: 'All categories' }, ...categories.map(c => ({ value: c, label: c }))]}
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
        <GlassButton onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" />Add Item
        </GlassButton>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <GlassCard padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold text-right">Base (Rs.)</th>
                  <th className="px-3 py-2 font-semibold text-right">Margin (Rs.)</th>
                  <th className="px-3 py-2 font-semibold text-right">Price (Rs.)</th>
                  <th className="px-3 py-2 font-semibold">Stock</th>
                  <th className="px-3 py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-b border-border/30 hover:bg-accent/5 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted/50 overflow-hidden shrink-0">
                          <PackageSearch className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[260px]">{item.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[260px]">{item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">{item.category}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatINR(item.basePrice)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-green-600 dark:text-green-400">{formatINR(item.margin)}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold">{formatINR(item.price)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.inStock
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.inStock ? 'In stock' : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <GlassButton size="sm" variant="ghost" onClick={() => openEdit(item)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" />Edit
                      </GlassButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <EmptyState icon={<Search className="w-10 h-10 text-muted-foreground/50 mb-2" />} title="No items found" description={search ? 'Try a different search term.' : 'No items in inventory yet. Click "Add Item" to create one.'} />
          )}
        </GlassCard>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Item' : 'Add Item'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassInput label="Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <GlassInput label="Category *" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
          </div>
          <GlassInput label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <GlassInput
              label="Base price (raw cost, Rs.)"
              type="number"
              min="0"
              step="0.01"
              value={form.basePrice}
              onChange={e => setForm(p => ({ ...p, basePrice: e.target.value }))}
            />
            <GlassInput
              label="Margin (profit, Rs.)"
              type="number"
              min="0"
              step="0.01"
              value={form.margin}
              onChange={e => setForm(p => ({ ...p, margin: e.target.value }))}
            />
          </div>
          <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Selling price: </span>
            <span className="font-bold text-accent">{formatINR(computedPrice)}</span>
            <span className="text-muted-foreground text-xs ml-2">= base + margin (auto-computed)</span>
          </div>
          <GlassInput label="Image path (e.g. /images/products/xyz.png)" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={e => setForm(p => ({ ...p, inStock: e.target.checked }))}
              className="w-4 h-4 accent-accent"
            />
            In stock (visible in the storefront)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton variant="ghost" onClick={() => setModalOpen(false)}>
              <X className="w-4 h-4 mr-1" style={{ verticalAlign: 'middle' }} />Cancel
            </GlassButton>
            <GlassButton onClick={save} disabled={saving}>
              <Save className="w-4 h-4 mr-1" style={{ verticalAlign: 'middle' }} />{saving ? 'Saving...' : 'Save'}
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
