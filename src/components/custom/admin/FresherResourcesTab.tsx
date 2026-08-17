'use client';
import React, { useState, useEffect } from 'react';
import { Link, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { 
  Card, 
  Button, 
  Input, 
  Textarea, 
  SectionHeader, 
  LoadingSpinner, 
  EmptyState, 
  Badge, 
  Switch, 
  Alert 
} from '@/components/custom/admin/AdminUI';

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
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader
        title="Fresher Resources"
        description="Links, onboarding documents, and academic survival guides presented to first-year students on their home screen."
        action={
          <Button 
            variant="primary"
            onClick={() => { 
              setShowAddForm(!showAddForm); 
              setEditingId(null); 
              setForm({ title: '', description: '', url: '', icon: 'ExternalLink', sort_order: 0, is_active: true }); 
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </Button>
        }
      />

      {error && (
        <Alert variant="error">
          <span>{error}</span>
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success">
          <span>{successMsg}</span>
        </Alert>
      )}

      {/* Add Form Card */}
      {showAddForm && (
        <Card className="p-6 border-primary/20 bg-muted/10">
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-border/50">
            <h3 className="text-base font-bold text-foreground">New Fresher Resource</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input 
              label="Title *" 
              placeholder="e.g. Campus Navigation & Bus Guide" 
              value={form.title} 
              onChange={(e: any) => setForm(p => ({ ...p, title: e.target.value }))} 
            />
            <Input 
              label="Resource URL *" 
              placeholder="https://..." 
              value={form.url} 
              onChange={(e: any) => setForm(p => ({ ...p, url: e.target.value }))} 
            />
            <Input 
              label="Icon (Lucide Name)" 
              placeholder="ExternalLink, Bus, BookOpen..." 
              value={form.icon} 
              onChange={(e: any) => setForm(p => ({ ...p, icon: e.target.value }))} 
            />
            <Input 
              label="Sort Priority Order" 
              type="number" 
              value={form.sort_order.toString()} 
              onChange={(e: any) => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} 
            />
          </div>
          <Textarea 
            label="Description" 
            placeholder="Brief overview of what this link contains..." 
            value={form.description} 
            onChange={(e: any) => setForm(p => ({ ...p, description: e.target.value }))} 
            rows={2} 
          />
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground">Active for Freshers</span>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked: boolean) => setForm(p => ({ ...p, is_active: checked }))}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAdd}>
                Create Resource
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Resource List */}
      {resources.length === 0 && !showAddForm ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<Link className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No resources yet"
            description="Add orientation links and guides for freshers to see on their student portal."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {resources.map((r) => (
            <Card key={r.id} hover className={`p-5 ${!r.is_active ? 'opacity-60' : ''}`}>
              {editingId === r.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Title" value={form.title} onChange={(e: any) => setForm(p => ({ ...p, title: e.target.value }))} />
                    <Input label="URL" value={form.url} onChange={(e: any) => setForm(p => ({ ...p, url: e.target.value }))} />
                    <Input label="Icon" value={form.icon} onChange={(e: any) => setForm(p => ({ ...p, icon: e.target.value }))} />
                    <Input label="Sort Order" type="number" value={form.sort_order.toString()} onChange={(e: any) => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <Textarea label="Description" value={form.description} onChange={(e: any) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-foreground">Active</span>
                      <Switch
                        checked={form.is_active}
                        onCheckedChange={(checked: boolean) => setForm(p => ({ ...p, is_active: checked }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleUpdate(r.id)} className="flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Save Updates
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground text-base">{r.title}</h4>
                      <Badge variant={r.is_active ? 'success' : 'default'} size="sm">
                        {r.is_active ? 'Active' : 'Hidden'}
                      </Badge>
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground mb-1 leading-relaxed">{r.description}</p>}
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block font-mono">
                      {r.url}
                    </a>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Order: {r.sort_order}</span>
                      <span>&bull;</span>
                      <span>Icon: {r.icon}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="icon-sm" variant="ghost" onClick={() => startEdit(r)} title="Edit Resource">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(r.id)} title="Delete Resource" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
