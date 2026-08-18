'use client';
import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, RefreshCw, Eye, Edit2, Archive, Trash2, 
  CheckCircle, ArrowUpRight, CloudLightning, HardDriveDownload, 
  AlertCircle, Check, X, Server, Upload, Plus
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { 
  Card, 
  Button, 
  Input, 
  SectionHeader, 
  LoadingSpinner, 
  StatusBadge, 
  Badge, 
  EmptyState 
} from '@/components/custom/admin/AdminUI';
import SplitScreenReview from './SplitScreenReview';
import { isRemoteUrl } from '@/lib/url';

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
  { id: 'ALL', label: 'All Papers' },
  { id: 'PENDING', label: 'Uploaded / New' },
  { id: 'OCR_PROCESSING', label: 'OCR Processing' },
  { id: 'PENDING_Q_APPROVAL', label: 'Pending Review' },
  { id: 'APPROVED', label: 'Published' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'ARCHIVED', label: 'Archived' }
];

export default function PapersManager() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [importingPaperId, setImportingPaperId] = useState<string | null>(null);
  const [uploadingFileId, setUploadingFileId] = useState<string | null>(null);
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

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to permanently delete this paper and all its extracted questions?')) return;
    try {
      setPapers(prev => prev.filter(p => p.source_id !== paperId));
      await apiFetch('/api/qbank/admin/reject', {
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
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader 
        title="Papers Directory" 
        description="Search, view metadata, re-run OCR pipelines, archive/delete papers, and import link-based documents directly to Cloudflare R2 storage."
        breadcrumbs={[{ label: 'Admin', href: '#' }, { label: 'Content', href: '#' }, { label: 'Papers', active: true }]}
      />

      {/* Filter Tabs */}
      <Card className="p-2">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(f => {
            const count = f.id === 'ALL' 
              ? papers.length 
              : f.id === 'OCR_PROCESSING' 
              ? papers.filter(p => p.approval_status === 'OCR_QUEUED' || p.approval_status === 'OCR_PROCESSING' || p.approval_status === 'OCR_FAILED').length
              : papers.filter(p => p.approval_status === f.id).length;

            return (
              <Button 
                key={f.id} 
                variant={statusFilter === f.id ? 'primary' : 'ghost'} 
                size="sm"
                onClick={() => setStatusFilter(f.id)} 
                className="flex items-center gap-2 text-xs font-semibold"
              >
                <span>{f.label}</span>
                <Badge variant={statusFilter === f.id ? 'default' : 'info'} size="sm">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search by title, course code, or uploader registration..." 
            className="pl-9 w-full" 
            value={searchQuery} 
            onChange={(e: any) => setSearchQuery(e.target.value)} 
          />
        </div>
        <Button 
          variant="outline"
          onClick={fetchPapers} 
          disabled={loading}
          className="flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Papers List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scanning Repository...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <Card className="text-center py-20 p-6">
          <EmptyState
            icon={<FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No Papers Found"
            description="Your current filters or search query didn't return any matching question papers."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPapers.map(p => (
            <Card key={p.source_id} hover className="overflow-hidden p-0">
              <div className="flex flex-col md:flex-row min-h-[110px]">
                {/* Status indicator bar */}
                <div className={`w-full md:w-2 shrink-0 ${
                  p.approval_status === 'APPROVED' ? 'bg-emerald-500' :
                  p.approval_status === 'PENDING_Q_APPROVAL' ? 'bg-amber-500' :
                  p.approval_status === 'PENDING' ? 'bg-yellow-500' :
                  p.approval_status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-500'
                }`} />

                <div className="flex-1 p-5 flex flex-col justify-center">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Metadata View / Form */}
                    {editingPaperId === p.source_id ? (
                      <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fadeIn">
                        <div className="sm:col-span-2">
                          <Input 
                            label="Document Title" 
                            value={editForm.title} 
                            onChange={(e: any) => setEditForm({ ...editForm, title: e.target.value })} 
                          />
                        </div>
                        <div>
                          <Input 
                            label="Course Code" 
                            className="uppercase"
                            value={editForm.course_code} 
                            onChange={(e: any) => setEditForm({ ...editForm, course_code: e.target.value })} 
                          />
                        </div>
                        <div>
                          <Input 
                            label="Year" 
                            type="number"
                            value={editForm.exam_year} 
                            onChange={(e: any) => setEditForm({ ...editForm, exam_year: parseInt(e.target.value) || 2026 })} 
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <Input 
                            label="Document URL"
                            value={editForm.file_url} 
                            onChange={(e: any) => setEditForm({ ...editForm, file_url: e.target.value })} 
                            placeholder="Direct PDF URL"
                          />
                        </div>
                        <div className="sm:col-span-4 flex gap-2 mt-1">
                          <Button size="sm" variant="primary" onClick={() => handleSaveMetadata(p.source_id)}>
                            <Check className="w-3.5 h-3.5 mr-1.5" /> Save Updates
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingPaperId(null)}>
                            Discard
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-bold text-foreground text-lg tracking-tight leading-tight">{p.title}</h3>
                          <StatusBadge 
                            status={
                              p.approval_status === 'APPROVED' ? 'success' : 
                              p.approval_status === 'REJECTED' ? 'error' : 
                              p.approval_status === 'PENDING' ? 'pending' : 
                              p.approval_status === 'PENDING_Q_APPROVAL' ? 'warning' : 'processing'
                            } 
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
                          <span className="font-bold text-primary">{p.course_code}</span>
                          <span>&bull;</span>
                          <span>{p.source_type} &bull; {p.exam_semester} {p.exam_year}</span>
                          <span>&bull;</span>
                          <span>{p.uploader_reg_no}</span>
                          <span>&bull;</span>
                          <span>{new Date(p.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        
                        <div className="pt-1 flex flex-wrap gap-2">
                          {p.storage_provider === 'R2' ? (
                            <Badge variant="success" size="sm" className="flex items-center gap-1">
                              <Server className="w-3 h-3" /> Cloudflare R2
                            </Badge>
                          ) : p.file_url === 'DIRECT_JSON' ? (
                            <Badge variant="default" size="sm">
                              No Document
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              Pending
                            </Badge>
                          )}

                          {p.file_size && (
                            <Badge variant="default" size="sm">
                              {(p.file_size / (1024 * 1024)).toFixed(2)} MB
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Panel */}
                    {editingPaperId !== p.source_id && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button size="sm" variant="primary" onClick={() => setSelectedPaperForReview(p)} className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> Review Paper
                        </Button>

                        {isRemoteUrl(p.file_url) && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleImportToStorage(p.source_id)}
                            disabled={importingPaperId === p.source_id}
                          >
                            {importingPaperId === p.source_id ? 'Syncing...' : 'Sync R2'}
                          </Button>
                        )}

                        <Button size="icon-sm" variant="ghost" onClick={() => startEditing(p)} title="Edit Metadata">
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        
                        {p.approval_status !== 'APPROVED' && (
                          <Button size="icon-sm" variant="ghost" onClick={() => handleUpdateStatus(p.source_id, 'APPROVED')} title="Quick Approve">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </Button>
                        )}

                        <Button size="icon-sm" variant="ghost" onClick={() => handleDeletePaper(p.source_id)} title="Delete Paper">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
