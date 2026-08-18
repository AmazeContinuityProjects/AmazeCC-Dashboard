'use client';
import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Image as ImageIcon, Upload, Trash2, Eye, Plus, Check, X, AlertCircle
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { 
  Card, 
  Button, 
  Input, 
  SectionHeader, 
  LoadingSpinner, 
  Badge, 
  EmptyState,
  Modal 
} from '@/components/custom/admin/AdminUI';

interface Question {
  question_id: string;
  question_number: string;
  question_text: string;
  course_code: string;
  has_diagram: boolean;
  image_urls: string[];
  image_url: string | null;
}

export default function DiagramsManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'HAS_DIAGRAM' | 'NO_DIAGRAM'>('HAS_DIAGRAM');
  const [uploadingQId, setUploadingQId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/qbank/admin/questions');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setQuestions(json.data);
          return;
        }
      }

      // Fallback: If global list endpoint requires paperId, aggregate questions per paper from queue
      const queueRes = await apiFetch('/api/qbank/admin/queue');
      if (queueRes.ok) {
        const queueJson = await queueRes.json();
        if (queueJson.success && Array.isArray(queueJson.data)) {
          const allQuestions: Question[] = [];
          for (const paper of queueJson.data.slice(0, 10)) {
            try {
              const qRes = await apiFetch(`/api/qbank/admin/questions?paperId=${encodeURIComponent(paper.source_id)}`);
              if (qRes.ok) {
                const qData = await qRes.json();
                if (qData.success && Array.isArray(qData.data)) {
                  allQuestions.push(...qData.data);
                }
              }
            } catch {}
          }
          if (allQuestions.length > 0) {
            setQuestions(allQuestions);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleUploadDiagram = async (e: React.ChangeEvent<HTMLInputElement>, questionId: string, replaceIdx?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQId(questionId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await apiFetch('/api/qbank/admin/upload-diagram', {
        method: 'POST',
        body: formData
      });
      const uploadJson = await uploadRes.json();

      if (!uploadJson.success) {
        throw new Error(uploadJson.error || 'Failed to upload image');
      }

      const newImageUrl = uploadJson.url;

      const question = questions.find(q => q.question_id === questionId);
      if (!question) return;

      const updatedUrls = [...(question.image_urls || [])];
      if (replaceIdx !== undefined && replaceIdx >= 0 && replaceIdx < updatedUrls.length) {
        updatedUrls[replaceIdx] = newImageUrl;
      } else {
        updatedUrls.push(newImageUrl);
      }

      const patchRes = await apiFetch('/api/qbank/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          imageUrls: updatedUrls,
          hasDiagram: true,
          imageUrl: updatedUrls[0]
        })
      });

      const patchJson = await patchRes.json();
      if (patchJson.success) {
        setQuestions(prev => prev.map(q => q.question_id === questionId ? {
          ...q,
          image_urls: updatedUrls,
          has_diagram: true,
          image_url: updatedUrls[0]
        } : q));
        alert('Diagram uploaded successfully!');
      } else {
        alert('Failed to save diagram update: ' + patchJson.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUploadingQId(null);
    }
  };

  const handleDeleteDiagram = async (questionId: string, urlToDelete: string) => {
    if (!confirm('Are you sure you want to remove this diagram?')) return;

    const question = questions.find(q => q.question_id === questionId);
    if (!question) return;

    const updatedUrls = (question.image_urls || []).filter(u => u !== urlToDelete);
    const hasDiag = updatedUrls.length > 0;

    try {
      const patchRes = await apiFetch('/api/qbank/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          imageUrls: updatedUrls,
          hasDiagram: hasDiag,
          imageUrl: hasDiag ? updatedUrls[0] : null
        })
      });

      const patchJson = await patchRes.json();
      if (patchJson.success) {
        setQuestions(prev => prev.map(q => q.question_id === questionId ? {
          ...q,
          image_urls: updatedUrls,
          has_diagram: hasDiag,
          image_url: hasDiag ? updatedUrls[0] : null
        } : q));
      } else {
        alert('Failed to delete diagram: ' + patchJson.error);
      }
    } catch (err: any) {
      alert('Error deleting diagram: ' + err.message);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      q.question_text?.toLowerCase().includes(query) ||
      q.course_code?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    const hasDiag = q.has_diagram || (q.image_urls && q.image_urls.length > 0);
    if (filterMode === 'HAS_DIAGRAM' && !hasDiag) return false;
    if (filterMode === 'NO_DIAGRAM' && hasDiag) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Diagrams & Visual Media Directory" 
        description="Inspect diagrams, view image uploads, or replace/remove question illustration media."
      />

      {/* Tabs */}
      <Card className="p-2">
        <div className="flex flex-wrap gap-1.5">
          <Button 
            variant={filterMode === 'HAS_DIAGRAM' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setFilterMode('HAS_DIAGRAM')}
            className="text-xs font-semibold"
          >
            Has Diagram ({questions.filter(q => q.has_diagram || (q.image_urls && q.image_urls.length > 0)).length})
          </Button>
          <Button 
            variant={filterMode === 'NO_DIAGRAM' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setFilterMode('NO_DIAGRAM')}
            className="text-xs font-semibold"
          >
            No Diagram ({questions.filter(q => !q.has_diagram && (!q.image_urls || q.image_urls.length === 0)).length})
          </Button>
          <Button 
            variant={filterMode === 'ALL' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setFilterMode('ALL')}
            className="text-xs font-semibold"
          >
            All Questions ({questions.length})
          </Button>
        </div>
      </Card>

      {/* Search and refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search questions by text or course code..." 
            className="pl-9 w-full" 
            value={searchQuery} 
            onChange={(e: any) => setSearchQuery(e.target.value)} 
          />
        </div>
        <Button variant="outline" onClick={fetchQuestions} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Grid of Diagrams */}
      {loading ? (
        <div className="text-center py-20">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-muted-foreground">Loading diagrams...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card className="text-center py-20 p-6">
          <EmptyState
            icon={<ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No matching questions found"
            description="Try selecting another filter tab or entering a different search query."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.map(q => {
            const urls = q.image_urls || (q.image_url ? [q.image_url] : []);
            return (
              <Card key={q.question_id} className="flex flex-col justify-between p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" size="sm" className="font-bold">
                      Q{q.question_number}
                    </Badge>
                    <span className="text-xs font-bold text-primary">{q.course_code}</span>
                  </div>
                  <p className="text-xs text-foreground font-medium line-clamp-3 leading-relaxed">
                    {q.question_text}
                  </p>
                </div>

                {/* Diagrams list */}
                <div className="space-y-3">
                  {urls.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {urls.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-border/60 aspect-video bg-muted/40 flex items-center justify-center">
                          <img 
                            src={url} 
                            alt={`diagram-${idx}`} 
                            className="object-contain w-full h-full cursor-pointer hover:scale-105 transition-transform" 
                            onClick={() => setPreviewImageUrl(url)}
                          />
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <Button 
                              size="icon-sm"
                              variant="secondary"
                              onClick={() => setPreviewImageUrl(url)} 
                              title="Preview"
                              className="h-7 w-7"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <label 
                              className="p-1.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                              title="Replace"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleUploadDiagram(e, q.question_id, idx)}
                                disabled={uploadingQId !== null}
                              />
                            </label>
                            <Button 
                              size="icon-sm"
                              variant="destructive"
                              onClick={() => handleDeleteDiagram(q.question_id, url)} 
                              title="Delete"
                              className="h-7 w-7"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center border border-dashed border-border/60 rounded-xl bg-muted/20">
                      <ImageIcon className="w-6 h-6 text-muted-foreground/50 mx-auto mb-1" />
                      <span className="text-[11px] font-semibold text-muted-foreground">No illustrations attached</span>
                    </div>
                  )}

                  {/* Add Diagram Button */}
                  <div className="flex justify-end pt-1">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                      <Plus className="w-3.5 h-3.5" /> 
                      {uploadingQId === q.question_id ? 'Uploading...' : 'Add Diagram'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleUploadDiagram(e, q.question_id)}
                        disabled={uploadingQId !== null}
                      />
                    </label>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Image Modal */}
      <Modal
        isOpen={previewImageUrl !== null}
        onClose={() => setPreviewImageUrl(null)}
        title="Diagram Asset Preview"
        maxWidth="max-w-4xl"
      >
        <div className="flex items-center justify-center p-2">
          {previewImageUrl && (
            <img 
              src={previewImageUrl} 
              alt="Preview" 
              className="object-contain max-w-full max-h-[70vh] rounded-xl shadow-lg" 
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
