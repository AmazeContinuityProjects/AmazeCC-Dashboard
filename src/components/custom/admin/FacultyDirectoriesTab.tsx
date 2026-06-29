"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Trash2, Edit2, Plus, Loader2, Save, X, Building2, Link as LinkIcon, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  
  const [formData, setFormData] = useState({ id: "", school_name: "", url: "" });
  const [saving, setSaving] = useState(false);

  const fetchDirectories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/admin/faculty-directories");
      const data = await res.json();
      if (data.success) {
        setDirectories(data.directories);
      } else {
        setError(data.error || "Failed to fetch directories");
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
      setError("All fields are required");
      return;
    }

    setSaving(true);
    setError(null);
    
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await apiFetch("/api/admin/faculty-directories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(null);
        setIsAdding(false);
        fetchDirectories();
      } else {
        setError(data.error || "Failed to save directory");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this directory?")) return;
    
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/faculty-directories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDirectories();
      } else {
        setError(data.error || "Failed to delete directory");
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
    setFormData({ id: "", school_name: "", url: "" });
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white midnight:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            Faculty Directories
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400 mt-1">
            Manage the list of school URLs scraped dynamically by the student app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDirectories}
            className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 midnight:bg-white/[0.03] border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={startAdd}
            disabled={isAdding || !!isEditing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add School
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 midnight:bg-red-900/20 text-red-600 dark:text-red-400 midnight:text-red-400 border border-red-200/50 dark:border-red-800/50 midnight:border-red-800/50 rounded-xl text-sm flex items-start gap-3">
          <X className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-semibold block mb-0.5">Error</span>
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {(isAdding || isEditing) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-blue-50 dark:bg-blue-900/10 midnight:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 midnight:border-blue-800/50 rounded-2xl p-5 shadow-sm col-span-1 md:col-span-2 lg:col-span-3"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white midnight:text-white mb-4">
                {isEditing ? "Edit School Directory" : "Add New School Directory"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 midnight:text-gray-400 uppercase tracking-wider mb-2">School ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!isEditing}
                    placeholder="e.g. scope"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 midnight:bg-white/[0.06] border border-gray-200 dark:border-gray-700 midnight:border-white/10 text-gray-900 dark:text-white midnight:text-white rounded-lg text-sm disabled:opacity-50 outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 midnight:text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    placeholder="e.g. SCOPE"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 midnight:bg-white/[0.06] border border-gray-200 dark:border-gray-700 midnight:border-white/10 text-gray-900 dark:text-white midnight:text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 midnight:text-gray-400 uppercase tracking-wider mb-2">Scrape URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://chennai.vit.ac.in/..."
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 midnight:bg-white/[0.06] border border-gray-200 dark:border-gray-700 midnight:border-white/10 text-gray-900 dark:text-white midnight:text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 midnight:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 midnight:hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {directories.map((dir) => (
          <div
            key={dir.id}
            className={`bg-white/60 dark:bg-slate-900/60 midnight:bg-white/[0.03] backdrop-blur-xl border ${isEditing === dir.id ? 'border-blue-400 dark:border-blue-500 shadow-md' : 'border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 shadow-sm'} rounded-2xl p-5 flex flex-col hover:border-gray-300 dark:hover:border-gray-600 transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-block px-2.5 py-1 bg-gray-100 dark:bg-gray-800 midnight:bg-white/10 text-gray-600 dark:text-gray-300 midnight:text-gray-300 text-xs font-bold rounded-md uppercase tracking-wider mb-2">
                  ID: {dir.id}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white midnight:text-white line-clamp-1">{dir.school_name}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(dir)}
                  disabled={isAdding || !!isEditing}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 midnight:hover:bg-blue-900/40 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(dir.id)}
                  disabled={isAdding || !!isEditing}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 midnight:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 midnight:border-white/10">
              <a 
                href={dir.url}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 midnight:hover:text-blue-400 transition-colors"
                title={dir.url}
              >
                <LinkIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="truncate">{dir.url}</span>
              </a>
            </div>
          </div>
        ))}

        {directories.length === 0 && !loading && !isAdding && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-800 midnight:border-white/10 rounded-2xl">
            <Building2 className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">No faculty directories configured.</p>
            <button onClick={startAdd} className="mt-4 text-sm text-blue-500 hover:underline">Add one now</button>
          </div>
        )}
      </div>
    </div>
  );
}
