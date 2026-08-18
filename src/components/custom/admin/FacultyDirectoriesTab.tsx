'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Trash2, Edit2, Plus, Loader2, Save, X, Building2, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  Button, 
  Input, 
  SectionHeader, 
  EmptyState, 
  LoadingSpinner, 
  Badge, 
  Alert 
} from '@/components/custom/admin/AdminUI';

interface FacultyDirectory {
  id: string;
  school_name: string;
  url: string;
}

export default function FacultyDirectoriesTab() {
  const [directories, setDirectories] = useState<FacultyDirectory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({ id: '', school_name: '', url: '' });
  const [saving, setSaving] = useState(false);

  const fetchDirectories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/faculty-directories');
      const data = await res.json();
      if (data.success) {
        setDirectories(data.directories);
      } else {
        setError(data.error || 'Failed to fetch directories');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectories();
  }, []);

  const handleSave = async () => {
    if (!formData.id || !formData.school_name || !formData.url) {
      setError('All fields are required');
      return;
    }

    setSaving(true);
    setError(null);
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await apiFetch('/api/admin/faculty-directories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(null);
        setIsAdding(false);
        fetchDirectories();
      } else {
        setError(data.error || 'Failed to save directory');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty directory?')) return;
    
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/faculty-directories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDirectories();
      } else {
        setError(data.error || 'Failed to delete directory');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const startEdit = (dir: FacultyDirectory) => {
    setFormData(dir);
    setIsEditing(dir.id);
    setIsAdding(false);
  };

  const startAdd = () => {
    setFormData({ id: '', school_name: '', url: '' });
    setIsAdding(true);
    setIsEditing(null);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setIsAdding(false);
    setError(null);
  };

  if (loading && directories.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader 
        title="Faculty Directories"
        description="Manage the list of university school directories scraped by the student mobile client."
        icon={<Building2 className="w-6 h-6 text-primary" />}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDirectories}
              className="h-9 w-9 p-0 flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={startAdd}
              disabled={isAdding || !!isEditing}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add School
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="error">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {(isAdding || isEditing) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="col-span-1 md:col-span-2 lg:col-span-3"
            >
              <Card className="p-6 border-primary/20 bg-muted/10">
                <h3 className="text-base font-bold text-foreground mb-4">
                  {isEditing ? 'Edit School Directory' : 'Add New School Directory'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Input
                      label="School ID *"
                      type="text"
                      value={formData.id}
                      onChange={(e: any) => setFormData({ ...formData, id: e.target.value.toLowerCase() })}
                      disabled={!!isEditing}
                      placeholder="e.g. scope"
                    />
                  </div>
                  <div>
                    <Input
                      label="Display Name *"
                      type="text"
                      value={formData.school_name}
                      onChange={(e: any) => setFormData({ ...formData, school_name: e.target.value })}
                      placeholder="e.g. School of Computer Science (SCOPE)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Scrape URL *"
                      type="url"
                      value={formData.url}
                      onChange={(e: any) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://chennai.vit.ac.in/faculty/scope"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isEditing ? 'Update Directory' : 'Save Directory'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {directories.map((dir) => (
          <Card
            key={dir.id}
            hover
            className={`p-5 flex flex-col justify-between ${isEditing === dir.id ? 'border-primary shadow-md' : ''}`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <Badge variant="default" size="sm" className="uppercase font-mono font-bold">
                  {dir.id}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => startEdit(dir)}
                    disabled={isAdding || !!isEditing}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(dir.id)}
                    disabled={isAdding || !!isEditing}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <h3 className="text-base font-bold text-foreground line-clamp-1">{dir.school_name}</h3>
            </div>
            
            <div className="mt-4 pt-3 border-t border-border/50">
              <a 
                href={dir.url}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                title={dir.url}
              >
                <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{dir.url}</span>
              </a>
            </div>
          </Card>
        ))}

        {directories.length === 0 && !loading && !isAdding && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Card className="p-12 text-center">
              <EmptyState 
                icon={<Building2 className="w-12 h-12 text-muted-foreground/50 mb-3" />} 
                title="No faculty directories" 
                description="No faculty school directories have been configured yet." 
                action={
                  <Button onClick={startAdd} variant="outline" size="sm" className="mt-4">
                    Add one now
                  </Button>
                } 
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
