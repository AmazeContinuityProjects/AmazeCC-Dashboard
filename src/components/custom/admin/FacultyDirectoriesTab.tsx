"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Trash2, Edit2, Plus, Loader2, Save, X, Building2, Link as LinkIcon, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, GlassButton, GlassInput, SectionHeader, EmptyState, LoadingSpinner } from "./AdminUI";
import { Badge } from "@amazecontinuityprojects/amazeui";

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
 <LoadingSpinner size="lg" />
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <SectionHeader 
  title="Faculty Directories"
  description="Manage the list of school URLs scraped dynamically by the student app."
  icon={<Building2 className="w-6 h-6 text-accent" />}
  action={
  <div className="flex items-center gap-2">
  <GlassButton
  variant="secondary"
  onClick={fetchDirectories}
  className="p-2.5"
  >
  <RefreshCw className="w-4 h-4 text-muted-foreground" />
  </GlassButton>
  <GlassButton
  onClick={startAdd}
  disabled={isAdding || !!isEditing}
  className="flex items-center gap-2"
  >
  <Plus className="w-4 h-4" />
  Add School
  </GlassButton>
  </div>
  }
 />

 {error && (
 <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm flex items-start gap-3">
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
 className="bg-accent/10 border border-accent/20 rounded-2xl p-5 shadow-sm col-span-1 md:col-span-2 lg:col-span-3"
 >
 <h3 className="text-lg font-bold text-foreground mb-4">
 {isEditing ? "Edit School Directory" : "Add New School Directory"}
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
 <div>
 <GlassInput
 label="School ID"
 type="text"
 value={formData.id}
 onChange={(e) => setFormData({ ...formData, id: e.target.value })}
 disabled={!!isEditing}
 placeholder="e.g. scope"
 />
 </div>
 <div>
 <GlassInput
 label="Display Name"
 type="text"
 value={formData.school_name}
 onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
 placeholder="e.g. SCOPE"
 />
 </div>
 <div className="md:col-span-3 relative">
 <GlassInput
 label="Scrape URL"
 type="url"
 value={formData.url}
 onChange={(e) => setFormData({ ...formData, url: e.target.value })}
 placeholder="https://chennai.vit.ac.in/..."
 className="pl-9"
 />
 <LinkIcon className="absolute left-3 top-[34px] w-4 h-4 text-muted-foreground z-10" />
 </div>
 </div>
 <div className="flex items-center justify-end gap-2">
 <GlassButton
 variant="secondary"
 onClick={cancelEdit}
 disabled={saving}
 >
 Cancel
 </GlassButton>
 <GlassButton
 onClick={handleSave}
 disabled={saving}
 className="flex items-center gap-2"
 >
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
 {isEditing ? "Update" : "Save"}
 </GlassButton>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {directories.map((dir) => (
 <GlassCard
 key={dir.id}
 className={`flex flex-col ${isEditing === dir.id ? 'border-accent shadow-md' : ''}`}
 hover
 padding="p-5"
 >
 <div className="flex items-start justify-between mb-4">
 <div>
 <Badge variant="default" className="mb-2 uppercase">ID: {dir.id}</Badge>
 <h3 className="text-lg font-bold text-foreground line-clamp-1">{dir.school_name}</h3>
 </div>
 <div className="flex items-center gap-1">
 <GlassButton
 variant="ghost"
 size="sm"
 onClick={() => startEdit(dir)}
 disabled={isAdding || !!isEditing}
 className="p-2"
 >
 <Edit2 className="w-4 h-4" />
 </GlassButton>
 <GlassButton
 variant="ghost"
 size="sm"
 onClick={() => handleDelete(dir.id)}
 disabled={isAdding || !!isEditing}
 className="p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
 >
 <Trash2 className="w-4 h-4" />
 </GlassButton>
 </div>
 </div>
 
 <div className="mt-auto pt-4 border-t border-border/50">
 <a 
 href={dir.url}
 target="_blank" 
 rel="noopener noreferrer"
 className="flex items-start gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
 title={dir.url}
 >
 <LinkIcon className="w-4 h-4 shrink-0 mt-0.5" />
 <span className="truncate">{dir.url}</span>
 </a>
 </div>
 </GlassCard>
 ))}

 {directories.length === 0 && !loading && !isAdding && (
 <div className="col-span-1 md:col-span-2 lg:col-span-3">
  <EmptyState 
    icon={<Building2 />} 
    title="No faculty directories" 
    description="No faculty directories configured." 
    action={
      <GlassButton onClick={startAdd} variant="ghost" className="text-accent hover:underline">
        Add one now
      </GlassButton>
    } 
  />
 </div>
 )}
 </div>
 </div>
 );
}
