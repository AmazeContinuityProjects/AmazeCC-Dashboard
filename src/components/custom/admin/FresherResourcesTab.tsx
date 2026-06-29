'use client';
import React, { useState, useEffect } from 'react';
import { Link, Plus, Pencil, Trash2, X, Check, GripVertical } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GlassCard, GlassButton, GlassInput, GlassTextarea, SectionHeader, LoadingSpinner, EmptyState } from '@/components/custom/admin/AdminUI';

interface FresherResource {
  id: number;
  title: string;
  description: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export default function FresherResourcesTab() {
  const [resources, setResources] = useState<FresherResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', description: '', url: '', icon: 'ExternalLink', sort_order: 0, is_active: true });
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/admin/fresher-resources');
      const data = await res.json();
      if (data.success) setResources(data.resources || []);
      else throw new Error(data.error || 'Failed to load');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const handleAdd = async () => {
    if (!form.title || !form.url) return;
    try {
      const res = await apiFetch('/api/admin/fresher-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setResources(prev => [...prev, data.resource]);
        setForm({ title: '', description: '', url: '', icon: 'ExternalLink', sort_order: 0, is_active: true });
        setShowAddForm(false);
        showSuccess('Resource added');
      } else throw new Error(data.error);
    } catch (err: any) { setError(err.message); }
  };

  const handleUpdate = async (id: number) => {
    try {
      const res = await apiFetch(`/api/admin/fresher-resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setResources(prev => prev.map(r => r.id === id ? { ...r, ...data.resource } : r));
        setEditingId(null);
        showSuccess('Resource updated');
      } else throw new Error(data.error);
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this resource?')) return;
    try {
      const res = await apiFetch(`/api/admin/fresher-resources/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setResources(prev => prev.filter(r => r.id !== id));
        showSuccess('Resource deleted');
      } else throw new Error(data.error);
    } catch (err: any) { setError(err.message); }
  };

  const startEdit = (r: FresherResource) => {
    setForm({ title: r.title, description: r.description, url: r.url, icon: r.icon, sort_order: r.sort_order, is_active: r.is_active });
    setEditingId(r.id);
    setShowAddForm(false);
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <SectionHeader
        title="Fresher Resources"
        description="Links and guides shown to freshers on their welcome screen."
        action={
          <GlassButton onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setForm({ title: '', description: '', url: '', icon: 'ExternalLink', sort_order: 0, is_active: true }); }}>
            <Plus className="w-4 h-4 inline mr-2" />Add Resource
          </GlassButton>
        }
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 midnight:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 midnight:border-red-800/50 rounded-xl text-red-700 dark:text-red-400 midnight:text-red-400 text-sm">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 midnight:bg-green-900/20 border border-green-200/50 dark:border-green-800/50 midnight:border-green-800/50 rounded-xl text-green-700 dark:text-green-400 midnight:text-green-400 text-sm">{successMsg}</div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <GlassCard className="mb-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 midnight:text-white">New Resource</h3>
            <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 midnight:hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <GlassInput label="Title *" placeholder="e.g. Transport & Bus Guide" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <GlassInput label="URL *" placeholder="https://..." value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
            <GlassInput label="Icon (lucide name)" placeholder="ExternalLink, Bus, BookOpen..." value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
            <GlassInput label="Sort Order" type="number" value={form.sort_order.toString()} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
          </div>
          <GlassTextarea label="Description" placeholder="Brief description of this resource" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 midnight:text-gray-300">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded" />
              Active
            </label>
            <GlassButton onClick={handleAdd}>Add Resource</GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Resource List */}
      {resources.length === 0 && !showAddForm ? (
        <EmptyState
          icon={<Link className="w-8 h-8 text-gray-400" />}
          title="No resources yet"
          description="Add links and guides for freshers to see on their welcome screen."
        />
      ) : (
        <div className="space-y-4">
          {resources.map((r) => (
            <GlassCard key={r.id} className={!r.is_active ? 'opacity-60' : ''}>
              {editingId === r.id ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <GlassInput label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                    <GlassInput label="URL" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
                    <GlassInput label="Icon" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
                    <GlassInput label="Sort Order" type="number" value={form.sort_order.toString()} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <GlassTextarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                  <div className="flex items-center gap-4 mt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 midnight:text-gray-300">
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                      Active
                    </label>
                    <GlassButton variant="primary" onClick={() => handleUpdate(r.id)}><Check className="w-4 h-4 inline mr-2" />Save</GlassButton>
                    <GlassButton variant="ghost" onClick={() => setEditingId(null)}>Cancel</GlassButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 midnight:text-white">{r.title}</h4>
                      {!r.is_active && <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-800 midnight:bg-white/10 rounded-full text-gray-500">Inactive</span>}
                    </div>
                    {r.description && <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400 mb-1">{r.description}</p>}
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 midnight:text-blue-400 hover:underline truncate block">{r.url}</a>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500 midnight:text-gray-500">
                      <span>Sort: {r.sort_order}</span>
                      <span>Icon: {r.icon}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(r)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 midnight:hover:bg-white/10 text-gray-500 hover:text-blue-600 transition"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 midnight:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
