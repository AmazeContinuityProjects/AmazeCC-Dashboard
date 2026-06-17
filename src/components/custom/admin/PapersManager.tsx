'use client';
import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, RefreshCw, Eye, Edit2, Play, Archive, Trash2, 
  CheckCircle, ArrowUpRight, CloudLightning, HelpCircle, HardDriveDownload, 
  AlertCircle, ChevronDown, Check, X, Info, Server, Upload
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GlassCard, GlassButton, SectionHeader, LoadingSpinner, StatusBadge } from '@/components/custom/admin/AdminUI';
import SplitScreenReview from './SplitScreenReview';

interface Paper {
  source_id: string;
  course_code: string;
  title: string;
  source_type: string;
  exam_year: number;
  file_url: string;
  source_url: string | null;
  uploader_reg_no: string;
  approval_status: 'PENDING' | 'OCR_QUEUED' | 'OCR_PROCESSING' | 'PENDING_Q_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'OCR_FAILED';
  ocr_logs: string | null;
  ocr_progress: number;
  ocr_model: string | null;
  file_size: number | null;
  storage_provider: string | null;
  created_at: string;
  exam_semester: string | null;
}

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Papers', color: 'border-blue-500' },
  { id: 'PENDING', label: 'Uploaded / New', color: 'border-yellow-500' },
  { id: 'OCR_PROCESSING', label: 'OCR Processing', color: 'border-indigo-500' },
  { id: 'PENDING_Q_APPROVAL', label: 'Pending Review', color: 'border-amber-500' },
  { id: 'APPROVED', label: 'Published', color: 'border-emerald-500' },
  { id: 'REJECTED', label: 'Rejected', color: 'border-red-500' },
  { id: 'ARCHIVED', label: 'Archived', color: 'border-gray-500' }
];

export default function PapersManager() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [importingPaperId, setImportingPaperId] = useState<string | null>(null);
  const [uploadingFileId, setUploadingFileId] = useState<string | null>(null);
  
  // Review split-screen state
  const [selectedPaperForReview, setSelectedPaperForReview] = useState<Paper | null>(null);
  
  // Metadata edit state
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    course_code: '',
    source_type: '',
    exam_year: 2026,
    exam_semester: 'Fall',
    file_url: '',
    source_url: ''
  });

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/qbank/admin/queue');
      const json = await res.json();
      if (json.success && json.data) {
        setPapers(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch papers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleUpdateStatus = async (paperId: string, status: string) => {
    try {
      setPapers(prev => prev.map(p => p.source_id === paperId ? { ...p, approval_status: status as any } : p));
      await apiFetch('/api/qbank/admin/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, approvalStatus: status })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMetadata = async (paperId: string) => {
    try {
      setPapers(prev => prev.map(p => p.source_id === paperId ? { ...p, ...editForm } : p));
      setEditingPaperId(null);
      await apiFetch('/api/qbank/admin/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId,
          title: editForm.title,
          course_code: editForm.course_code,
          source_type: editForm.source_type,
          exam_year: editForm.exam_year,
          exam_semester: editForm.exam_semester,
          fileUrl: editForm.file_url,
          sourceUrl: editForm.source_url
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadReplacement = async (paperId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFileId(paperId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the new PDF to the storage bucket
      const res = await apiFetch('/api/qbank/admin/upload-diagram', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Upload failed');
      }

      setEditForm(prev => ({ ...prev, file_url: json.url }));
    } catch (err: any) {
      console.error(err);
      alert('Failed to upload file: ' + (err.message || ''));
    } finally {
      setUploadingFileId(null);
    }
  };

  const handleStartOCR = async (paperId: string) => {
    try {
      setPapers(prev => prev.map(p => p.source_id === paperId ? { ...p, approval_status: 'OCR_QUEUED' } : p));
      await apiFetch('/api/admin/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, model: 'qwen2.5vl:3b' })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to permanently delete this paper and all its extracted questions?')) return;
    try {
      setPapers(prev => prev.filter(p => p.source_id !== paperId));
      await apiFetch('/api/qbank/admin/reject', { // Rejects / deletes
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportToStorage = async (paperId: string) => {
    setImportingPaperId(paperId);
    try {
      const res = await apiFetch('/api/qbank/admin/import-to-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId })
      });
      const json = await res.json();
      if (json.success) {
        alert('Successfully imported remote PDF to Cloudflare R2 local storage!');
        setPapers(prev => prev.map(p => {
          if (p.source_id === paperId) {
            return {
              ...p,
              file_url: json.fileUrl,
              file_size: json.fileSize,
              storage_provider: 'R2',
              source_type: 'UPLOAD'
            };
          }
          return p;
        }));
      } else {
        alert('Import failed: ' + json.error);
      }
    } catch (err: any) {
      alert('Error importing file: ' + err.message);
    } finally {
      setImportingPaperId(null);
    }
  };

  const startEditing = (p: Paper) => {
    setEditingPaperId(p.source_id);
    setEditForm({
      title: p.title || '',
      course_code: p.course_code || '',
      source_type: p.source_type || '',
      exam_year: p.exam_year || 2026,
      exam_semester: p.exam_semester || 'Fall',
      file_url: p.file_url || '',
      source_url: p.source_url || ''
    });
  };

  // Filtering
  const filteredPapers = papers.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      p.title?.toLowerCase().includes(query) || 
      p.course_code?.toLowerCase().includes(query) || 
      p.uploader_reg_no?.toLowerCase().includes(query);
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'OCR_PROCESSING') {
      return matchesSearch && (p.approval_status === 'OCR_QUEUED' || p.approval_status === 'OCR_PROCESSING' || p.approval_status === 'OCR_FAILED');
    }
    return matchesSearch && p.approval_status === statusFilter;
  });

  if (selectedPaperForReview) {
    return (
      <SplitScreenReview 
        paper={selectedPaperForReview} 
        onClose={() => {
          setSelectedPaperForReview(null);
          fetchPapers();
        }}
        onPublishSuccess={() => fetchPapers()}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader 
        title="Papers Directory" 
        description="Search, view metadata, re-run OCR pipelines, archive/delete papers, and import link-based documents directly to Cloudflare R2 storage."
        breadcrumbs={[{ label: 'Admin', href: '#' }, { label: 'Content', href: '#' }, { label: 'Papers', active: true }]}
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/50 dark:bg-white/[0.03] rounded-2xl border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
        {STATUS_FILTERS.map(f => {
          const count = f.id === 'ALL' 
            ? papers.length 
            : f.id === 'OCR_PROCESSING' 
            ? papers.filter(p => p.approval_status === 'OCR_QUEUED' || p.approval_status === 'OCR_PROCESSING' || p.approval_status === 'OCR_FAILED').length
            : papers.filter(p => p.approval_status === f.id).length;

          return (
            <button 
              key={f.id} 
              onClick={() => setStatusFilter(f.id)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === f.id 
                  ? 'bg-white dark:bg-slate-900 shadow-lg text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>{f.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                statusFilter === f.id 
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' 
                  : 'bg-gray-200/50 dark:bg-gray-800 text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-lg flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by title, course code, or uploader..." 
            className="w-full pl-12 pr-4 py-3 rounded-2xl border bg-white dark:bg-slate-900/40 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-800/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all shadow-inner" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <button 
          onClick={fetchPapers} 
          disabled={loading}
          className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Papers List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scanning Repository...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="text-center py-32 border-2 border-dashed border-gray-200/50 dark:border-gray-800/50 rounded-[32px] bg-gray-50/30 dark:bg-white/[0.02]">
          <FileText className="w-16 h-16 text-gray-200 dark:text-gray-800 mx-auto mb-6" />
          <h4 className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight">No Papers Found</h4>
          <p className="text-xs font-medium text-gray-500 mt-2 max-w-xs mx-auto">
            Your current filters or search query didn't return any results.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPapers.map(p => (
            <GlassCard key={p.source_id} innerGlow className="!p-0 overflow-hidden relative group border-gray-100/50 dark:border-gray-800/50 hover:scale-[1.01] transition-transform" hover>
              <div className="flex flex-col md:flex-row min-h-[120px]">
                {/* Status indicator bar */}
                <div className={`w-full md:w-2 shrink-0 ${
                  p.approval_status === 'APPROVED' ? 'bg-emerald-500' :
                  p.approval_status === 'PENDING_Q_APPROVAL' ? 'bg-amber-500' :
                  p.approval_status === 'PENDING' ? 'bg-yellow-500' :
                  p.approval_status === 'REJECTED' ? 'bg-red-500' : 'bg-indigo-500'
                }`} />

                <div className="flex-1 p-6 flex flex-col justify-center">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Metadata View / Form */}
                    {editingPaperId === p.source_id ? (
                      <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fade-in">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Document Title</label>
                          <input 
                            className="w-full px-4 py-2 text-xs font-bold bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                            value={editForm.title} 
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Code</label>
                          <input 
                            className="w-full px-4 py-2 text-xs font-bold bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none uppercase" 
                            value={editForm.course_code} 
                            onChange={(e) => setEditForm({ ...editForm, course_code: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Year</label>
                          <input 
                            type="number" 
                            className="w-full px-4 py-2 text-xs font-bold bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                            value={editForm.exam_year} 
                            onChange={(e) => setEditForm({ ...editForm, exam_year: parseInt(e.target.value) || 2026 })} 
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Document URL / File Replacement</label>
                          <div className="flex gap-2">
                            <input 
                              className="flex-1 px-4 py-2 text-xs font-bold bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                              value={editForm.file_url} 
                              onChange={(e) => setEditForm({ ...editForm, file_url: e.target.value })} 
                              placeholder="Direct PDF URL"
                            />
                            <label className={`flex-shrink-0 cursor-pointer flex items-center justify-center px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors ${uploadingFileId === p.source_id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}>
                                {uploadingFileId === p.source_id ? <LoadingSpinner size="sm" className="mr-2" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                                {uploadingFileId === p.source_id ? 'Uploading...' : 'Upload PDF'}
                                <input type="file" accept="application/pdf" className="hidden" disabled={uploadingFileId === p.source_id} onChange={(e) => handleUploadReplacement(p.source_id, e)} />
                            </label>
                          </div>
                        </div>
                        <div className="sm:col-span-4 flex gap-3 mt-2">
                          <GlassButton size="sm" onClick={() => handleSaveMetadata(p.source_id)}><Check className="w-3.5 h-3.5 inline mr-1" /> Save Updates</GlassButton>
                          <GlassButton variant="ghost" size="sm" onClick={() => setEditingPaperId(null)}>Discard</GlassButton>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-black text-gray-900 dark:text-white text-xl tracking-tight leading-none">{p.title}</h3>
                          <StatusBadge 
                            status={
                              p.approval_status === 'APPROVED' ? 'success' : 
                              p.approval_status === 'REJECTED' ? 'error' : 
                              p.approval_status === 'PENDING' ? 'pending' : 
                              p.approval_status === 'PENDING_Q_APPROVAL' ? 'warning' : 'processing'
                            } 
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                          <span className="text-blue-600 dark:text-blue-400">{p.course_code}</span>
                          <span className="opacity-40">&bull;</span>
                          <span>{p.source_type} &bull; {p.exam_semester} {p.exam_year}</span>
                          <span className="opacity-40">&bull;</span>
                          <span>{p.uploader_reg_no}</span>
                          <span className="opacity-40">&bull;</span>
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="pt-2 flex flex-wrap gap-2">
                          {p.storage_provider === 'R2' ? (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40 uppercase tracking-widest">
                              <Server className="w-3 h-3" /> Cloudflare R2
                            </span>
                          ) : p.file_url === 'DIRECT_JSON' ? (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-gray-500 bg-gray-50 dark:bg-white/[0.03] px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-800 uppercase tracking-widest">
                              No Document
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40 uppercase tracking-widest">
                              External Link
                            </span>
                          )}

                          {p.file_size && (
                            <span className="text-[9px] font-black text-gray-400 bg-gray-50 dark:bg-white/[0.03] px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-800 uppercase tracking-widest">
                              {(p.file_size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Paper Action Panel */}
                    {editingPaperId !== p.source_id && (
                      <div className="flex flex-wrap items-center gap-2">
                        <GlassButton size="sm" onClick={() => setSelectedPaperForReview(p)} className="font-black uppercase tracking-widest text-[10px]">
                          <Eye className="w-3.5 h-3.5 inline mr-1.5" /> Review
                        </GlassButton>

                        {p.storage_provider !== 'R2' && p.file_url !== 'DIRECT_JSON' && (
                          <GlassButton 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleImportToStorage(p.source_id)}
                            disabled={importingPaperId === p.source_id}
                            className="text-[10px] font-black uppercase tracking-widest"
                          >
                            {importingPaperId === p.source_id ? 'Syncing...' : 'Sync R2'}
                          </GlassButton>
                        )}

                        <div className="flex items-center gap-1 ml-2 pl-4 border-l border-gray-200/50 dark:border-gray-800/50">
                          <button onClick={() => startEditing(p)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          {p.approval_status !== 'APPROVED' && (
                            <button onClick={() => handleUpdateStatus(p.source_id, 'APPROVED')} className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl text-gray-400 hover:text-emerald-500 transition-all" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button onClick={() => handleDeletePaper(p.source_id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-gray-400 hover:text-red-500 transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
