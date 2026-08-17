'use client';

import React, { useState, useEffect, useCallback } from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { 
  CheckCircle, Clock, FileText, ArrowLeft, Eye, Trash2, Plus, 
  RotateCcw, Search, Save, X, RefreshCw, Zap, BookOpen, Image, Upload 
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Textarea, 
  Badge, 
  StatusBadge, 
  LoadingSpinner, 
  EmptyState, 
  Modal, 
  ProgressBar 
} from '@/components/custom/admin/AdminUI';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'OCR_QUEUED', label: 'OCR Queued' },
  { id: 'OCR_PROCESSING', label: 'Processing' },
  { id: 'PENDING_Q_APPROVAL', label: 'Review Ready' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'OCR_FAILED', label: 'Failed' },
];

const getStatusBadgeVariant = (s: string): 'warning' | 'info' | 'success' | 'danger' | 'default' => {
  switch (s) {
    case 'PENDING': return 'warning';
    case 'OCR_QUEUED': return 'info';
    case 'OCR_PROCESSING': return 'info';
    case 'PENDING_Q_APPROVAL': return 'success';
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'danger';
    case 'OCR_FAILED': return 'danger';
    default: return 'default';
  }
};

export default function AdminQueueTab() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPaper, setEditingPaper] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [openLogId, setOpenLogId] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/qbank/admin/queue');
      const json = await res.json();
      if (json.success && json.data) setPapers(json.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const filteredPapers = papers.filter(p => {
    if (statusFilter !== 'ALL' && p.approval_status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (p.title || '').toLowerCase().includes(q) || (p.course_code || '').toLowerCase().includes(q) || (p.uploader_reg_no || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleStartOCR = async (paperId: string, model?: string) => {
    setProcessingId(paperId);
    try {
      const res = await apiFetch('/api/admin/ocr', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ paperId, model }) 
      });
      const data = await res.json();
      if (data.success) fetchQueue();
      else alert('OCR Error: ' + data.error);
    } catch (err) { console.error(err); }
    finally { setProcessingId(null); }
  };

  const handleResetOCR = async (paperId: string) => {
    try {
      await apiFetch('/api/admin/ocr/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paperId }) });
      fetchQueue();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (paperId: string) => {
    if (!confirm('Reject this paper?')) return;
    try { 
      await apiFetch('/api/qbank/admin/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paperId }) }); 
      fetchQueue(); 
    } catch (err) { console.error(err); }
  };

  const handlePublish = async (paperId: string) => {
    try { 
      await apiFetch('/api/qbank/admin/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paperId }) }); 
      fetchQueue(); 
    } catch (err) { console.error(err); }
  };

  const handleSavePaper = async (paperId: string) => {
    try {
      await apiFetch('/api/qbank/admin/queue', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paperId, ...editForm }) });
      setEditingPaper(null);
      fetchQueue();
    } catch (err) { console.error(err); }
  };

  const startEditing = (paper: any) => {
    setEditingPaper(paper.source_id);
    setEditForm({ title: paper.title, course_code: paper.course_code, source_type: paper.source_type, exam_year: paper.exam_year, exam_semester: paper.exam_semester });
  };

  const fetchQuestions = async (paperId: string) => {
    try {
      const res = await apiFetch('/api/qbank/admin/questions?paperId=' + encodeURIComponent(paperId));
      const json = await res.json();
      if (json.success && json.data) setQuestions(json.data);
    } catch (err) { console.error(err); }
  };

  const handleReview = (paper: any) => { setSelectedPaper(paper); fetchQuestions(paper.source_id); };

  const handleUpdateQuestion = async (questionId: string, updates: any) => {
    try {
      setQuestions(prev => prev.map(q => q.question_id === questionId ? { ...q, ...updates } : q));
      await apiFetch('/api/qbank/admin/questions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId, ...updates }) });
    } catch (err) { console.error(err); }
  };

  const handleAddQuestion = async () => {
    if (!selectedPaper) return;
    try {
      const res = await apiFetch('/api/qbank/admin/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paperId: selectedPaper.source_id }) });
      const json = await res.json();
      if (json.success) setQuestions(prev => [...prev, json.data]);
    } catch (err) { console.error(err); }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    try { 
      setQuestions(prev => prev.filter(q => q.question_id !== questionId)); 
      await apiFetch('/api/qbank/admin/questions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId }) }); 
    } catch (err) { console.error(err); }
  };

  const handleUploadDiagram = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      setQuestions(prev => prev.map(q => {
        if (q.question_id === questionId) {
          const currentUrls = Array.isArray(q.image_urls) ? q.image_urls : (q.image_url ? [q.image_url] : []);
          const updatedUrls = [...currentUrls, json.url];
          
          handleUpdateQuestion(questionId, { 
            imageUrls: updatedUrls,
            hasDiagram: true
          });

          return { 
            ...q, 
            image_urls: updatedUrls,
            has_diagram: true
          };
        }
        return q;
      }));

    } catch (err: any) {
      console.error(err);
      alert('Failed to upload diagram: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteDiagram = async (questionId: string, urlToDelete: string) => {
    if (!confirm('Remove this diagram?')) return;

    try {
      setQuestions(prev => prev.map(q => {
        if (q.question_id === questionId) {
          const currentUrls = Array.isArray(q.image_urls) ? q.image_urls : (q.image_url ? [q.image_url] : []);
          const updatedUrls = currentUrls.filter((url: string) => url !== urlToDelete);
          
          handleUpdateQuestion(questionId, { 
            imageUrls: updatedUrls,
            hasDiagram: updatedUrls.length > 0
          });

          return { 
            ...q, 
            image_urls: updatedUrls,
            has_diagram: updatedUrls.length > 0
          };
        }
        return q;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) { alert('JSON must be an array.'); return; }
      const res = await apiFetch('/api/qbank/admin/questions/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paperId: selectedPaper.source_id, questions: parsed }) });
      const data = await res.json();
      if (data.success) { fetchQuestions(selectedPaper.source_id); setIsJsonModalOpen(false); setJsonInput(''); }
      else alert('Failed: ' + data.error);
    } catch (err: any) { alert('Invalid JSON: ' + err.message); }
  };

  const statusCounts = papers.reduce((acc, p) => { acc[p.approval_status] = (acc[p.approval_status] || 0) + 1; return acc; }, {} as Record<string, number>);

  // ─── REVIEW VIEW ───
  if (selectedPaper) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setSelectedPaper(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">{selectedPaper.title}</h1>
              <p className="text-xs text-muted-foreground">{selectedPaper.course_code}</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => handlePublish(selectedPaper.source_id)} className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Publish to Q-Bank
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-220px)]">
          {/* Left Pane */}
          <Card className="flex flex-col overflow-hidden p-0">
            <div className="p-3 border-b border-border/50 bg-muted/20 font-bold text-xs text-muted-foreground uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Source Document
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              {selectedPaper.file_url ? (
                <>
                  <FileText className="w-16 h-16 text-primary mb-3 opacity-80" />
                  <p className="text-xs text-muted-foreground mb-4 max-w-sm">Open the document to inspect and verify OCR extractions.</p>
                  <Button variant="outline" onClick={() => window.open(selectedPaper.file_url, '_blank')} className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" /> View PDF
                  </Button>
                </>
              ) : <p className="text-muted-foreground text-xs">No PDF attached.</p>}
            </div>
          </Card>

          {/* Right Pane: Question Editor */}
          <div className="flex flex-col rounded-xl overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {questions.length === 0 ? (
                <Card className="p-8 text-center">
                  <EmptyState icon={<FileText className="w-10 h-10 text-muted-foreground/50 mb-2" />} title="No questions yet" description="Add questions manually or import via JSON." />
                </Card>
              ) : questions.map((q, idx) => (
                <Card key={q.question_id || idx} className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center">
                      <span className="bg-primary/20 text-primary px-2 py-1 text-xs font-bold rounded-l-md">Q</span>
                      <input type="text" className="w-12 px-2 py-1 text-xs font-bold bg-background border border-border rounded-r-md outline-none text-center" value={q.question_number} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, question_number: e.target.value } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { questionNumber: e.target.value })} placeholder="#" />
                    </div>
                    <div className="w-32">
                      <Select 
                        value={q.question_type || 'DESCRIPTIVE'} 
                        onChange={(e: any) => handleUpdateQuestion(q.question_id, { questionType: e.target.value })}
                        options={[
                          { value: 'DESCRIPTIVE', label: 'Descriptive' },
                          { value: 'MCQ', label: 'MCQ' },
                          { value: 'NUMERICAL', label: 'Numerical' }
                        ]}
                      />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <Input placeholder="Module" value={q.topic_name || ''} onChange={(e: any) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, topic_name: e.target.value } : item))} onBlur={(e: any) => handleUpdateQuestion(q.question_id, { topicName: e.target.value })} />
                    </div>

                    <div className="flex items-center ml-auto gap-2">
                      <div className="flex items-center">
                        <input type="number" className="w-12 px-2 py-1 text-xs text-center bg-background border border-border rounded-l-md outline-none" value={q.marks || 0} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, marks: parseInt(e.target.value) || 0 } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { marks: parseInt(e.target.value) || 0 })} />
                        <span className="bg-muted text-muted-foreground px-2 py-1 text-xs border border-l-0 border-border rounded-r-md font-bold">M</span>
                      </div>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleDeleteQuestion(q.question_id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea rows={3} value={q.question_text || ''} onChange={(e: any) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, question_text: e.target.value } : item))} onBlur={(e: any) => handleUpdateQuestion(q.question_id, { questionText: e.target.value })} placeholder="Question text. Use $$ for LaTeX..." />
                  
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Latex Preview</p>
                    <div className="text-xs overflow-x-auto"><Latex>{q.question_text || ''}</Latex></div>
                  </div>

                  {/* Diagram area */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.has_diagram || false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, has_diagram: val } : item));
                          handleUpdateQuestion(q.question_id, { hasDiagram: val });
                        }}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <span>Has Diagram</span>
                    </label>

                    <label className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 cursor-pointer border border-primary/20">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadDiagram(q.question_id, e)}
                      />
                    </label>
                  </div>

                  {q.image_urls && q.image_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {q.image_urls.map((url: string, imgIdx: number) => (
                        <div key={imgIdx} className="relative group w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
                          <img src={url} alt={`Diagram ${imgIdx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleDeleteDiagram(q.question_id, url)}
                              className="text-white hover:bg-destructive/80 h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleAddQuestion} className="flex-1 flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Question
                </Button>
                <Button variant="secondary" onClick={() => setIsJsonModalOpen(true)} className="flex-1 flex items-center justify-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Import JSON
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Modal */}
        <Modal
          isOpen={isJsonModalOpen}
          onClose={() => setIsJsonModalOpen(false)}
          title="Import Questions (JSON Array)"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <Textarea 
              rows={10} 
              className="font-mono text-xs" 
              placeholder='[{"question_number":"1","question_type":"MCQ","marks":2,"question_text":"...","options":{"A":"..."},"correct_answer":"A"}]' 
              value={jsonInput} 
              onChange={(e: any) => setJsonInput(e.target.value)} 
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button variant="ghost" onClick={() => setIsJsonModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleBulkImport}>Import</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── QUEUE VIEW ───
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => {
          const count = f.id === 'ALL' ? papers.length : (statusCounts[f.id] || 0);
          return (
            <Button
              key={f.id}
              variant={statusFilter === f.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(f.id)}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <span>{f.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === f.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Search & Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search by title, course, or uploader..." 
            className="pl-9 w-full" 
            value={searchQuery} 
            onChange={(e: any) => setSearchQuery(e.target.value)} 
          />
        </div>
        <Button variant="outline" onClick={fetchQueue} disabled={loading} className="shrink-0 flex items-center gap-1.5">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Paper List */}
      {loading ? (
        <div className="text-center py-20"><LoadingSpinner size="lg" /><p className="mt-4 text-sm text-muted-foreground">Loading queue...</p></div>
      ) : filteredPapers.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState icon={<FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />} title="No papers found" description={statusFilter !== 'ALL' ? 'No papers match this filter state.' : 'Uploaded question papers will appear in this processing queue.'} />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPapers.map((p) => (
            <Card key={p.source_id} hover className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Paper Info */}
                <div className="flex-1 min-w-0">
                  {editingPaper === p.source_id ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="col-span-2" value={editForm.title || ''} onChange={(e: any) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Paper title" />
                      <Input value={editForm.course_code || ''} onChange={(e: any) => setEditForm({ ...editForm, course_code: e.target.value })} placeholder="Course code" />
                      <Input value={editForm.source_type || ''} onChange={(e: any) => setEditForm({ ...editForm, source_type: e.target.value })} placeholder="Type" />
                      <Input type="number" value={editForm.exam_year || ''} onChange={(e: any) => setEditForm({ ...editForm, exam_year: parseInt(e.target.value) })} placeholder="Year" />
                      <Input value={editForm.exam_semester || ''} onChange={(e: any) => setEditForm({ ...editForm, exam_semester: e.target.value })} placeholder="Semester" />
                      <div className="col-span-2 flex gap-2 pt-1">
                        <Button size="sm" variant="primary" onClick={() => handleSavePaper(p.source_id)}><Save className="w-3 h-3 mr-1" />Save</Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingPaper(null)}><X className="w-3 h-3 mr-1" />Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-sm">{p.title}</h3>
                        <Badge variant={getStatusBadgeVariant(p.approval_status)} size="sm">
                          {p.approval_status?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                        <span className="font-semibold text-foreground">{p.course_code}</span>
                        <span>&bull;</span>
                        <span>{p.source_type} {p.exam_semester} {p.exam_year}</span>
                        <span>&bull;</span>
                        <span>by {p.uploader_reg_no}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingPaper !== p.source_id && (
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Button variant="outline" size="sm" onClick={() => startEditing(p)}>
                      Edit
                    </Button>

                    {p.approval_status === 'PENDING' && (
                      <>
                        <div className="w-36">
                          <Select 
                            value={selectedModels[p.source_id] || p.ocr_model || 'qwen2.5vl:3b'} 
                            onChange={(e: any) => {
                              setSelectedModels(prev => ({ ...prev, [p.source_id]: e.target.value }));
                            }}
                            options={[
                              { value: 'qwen2.5vl:3b', label: 'Qwen 3B (Fast)' },
                              { value: 'llama3-vision', label: 'Llama Vision' }
                            ]}
                          />
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => handleStartOCR(p.source_id, selectedModels[p.source_id] || p.ocr_model || 'qwen2.5vl:3b')} disabled={processingId === p.source_id} className="flex items-center gap-1">
                          <Zap className={`w-3.5 h-3.5 ${processingId === p.source_id ? 'animate-spin' : ''}`} />OCR
                        </Button>
                        <Button size="sm" variant="primary" onClick={() => handleReview(p)} className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />Review
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => handleReject(p.source_id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}

                    {(p.approval_status === 'OCR_QUEUED' || p.approval_status === 'OCR_PROCESSING') && (
                      <div className="flex items-center gap-2">
                        <Badge variant="info" size="sm" className="animate-pulse flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {p.approval_status === 'OCR_QUEUED' ? 'Queued' : 'Processing'}
                        </Badge>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleResetOCR(p.source_id)} title="Reset to Pending">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}

                    {p.approval_status === 'PENDING_Q_APPROVAL' && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => handleStartOCR(p.source_id, selectedModels[p.source_id] || p.ocr_model || 'qwen2.5vl:3b')} disabled={processingId === p.source_id} className="flex items-center gap-1">
                          <Zap className={`w-3.5 h-3.5 ${processingId === p.source_id ? 'animate-spin' : ''}`} />Re-run
                        </Button>
                        <Button size="sm" variant="primary" onClick={() => handleReview(p)} className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />Review
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleResetOCR(p.source_id)} title="Reset to Pending">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}

                    {p.approval_status === 'APPROVED' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleReview(p)} className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />View
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleResetOCR(p.source_id)} title="Reset to Pending">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}

                    {p.approval_status === 'REJECTED' && (
                      <Button variant="outline" size="sm" onClick={() => { apiFetch('/api/admin/ocr/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paperId: p.source_id }) }).then(() => fetchQueue()); }} className="flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" />Restore
                      </Button>
                    )}

                    {p.approval_status === 'OCR_FAILED' && (
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleResetOCR(p.source_id)} className="flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5" />Retry
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => handleReject(p.source_id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress bar for running OCR */}
              {(p.approval_status === 'OCR_QUEUED' || p.approval_status === 'OCR_PROCESSING') && p.ocr_progress !== undefined && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>OCR Progress</span>
                    <span className="font-semibold">{p.ocr_progress}%</span>
                  </div>
                  <ProgressBar value={p.ocr_progress} color="blue" size="sm" />
                </div>
              )}

              {/* Logs toggle button and logs content */}
              {p.ocr_logs && (
                <div className="mt-3 border-t border-border/40 pt-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenLogId(openLogId === p.source_id ? null : p.source_id)}
                    className="text-xs text-primary h-6 px-2"
                  >
                    {openLogId === p.source_id ? 'Hide OCR Logs' : 'View OCR Logs'}
                  </Button>
                  
                  {openLogId === p.source_id && (
                    <pre className="mt-2 p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                      {p.ocr_logs}
                    </pre>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}