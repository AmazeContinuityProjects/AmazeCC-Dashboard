'use client';
import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Image, Upload, Trash2, Eye, Plus, Check, X, AlertCircle
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GlassCard, GlassButton, SectionHeader, LoadingSpinner } from '@/components/custom/admin/AdminUI';

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
      const json = await res.json();
      if (json.success && json.data) {
        setQuestions(json.data);
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

      // 1. Upload file to Supabase storage
      const uploadRes = await apiFetch('/api/qbank/admin/upload-diagram', {
        method: 'POST',
        body: formData // Body is FormData, so fetch handles multipart headers
      });
      const uploadJson = await uploadRes.json();

      if (!uploadJson.success) {
        throw new Error(uploadJson.error || 'Failed to upload image');
      }

      const newImageUrl = uploadJson.url;

      // Find the question and update its image_urls
      const question = questions.find(q => q.question_id === questionId);
      if (!question) return;

      let updatedUrls = [...(question.image_urls || [])];
      if (replaceIdx !== undefined && replaceIdx >= 0 && replaceIdx < updatedUrls.length) {
        updatedUrls[replaceIdx] = newImageUrl;
      } else {
        updatedUrls.push(newImageUrl);
      }

      // 2. Save updated diagram state to question
      const patchRes = await apiFetch('/api/qbank/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          imageUrls: updatedUrls,
          hasDiagram: true,
          imageUrl: updatedUrls[0] // fallback compatibility for single imageUrl field
        })
      });

      const patchJson = await patchRes.json();
      if (patchJson.success) {
        // Update local state
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
        title="Diagrams Directory" 
        description="Inspect diagrams, view image uploads, or replace/remove question illustration media."
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setFilterMode('HAS_DIAGRAM')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterMode === 'HAS_DIAGRAM' 
              ? 'bg-white dark:bg-slate-900 shadow border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Has Diagram ({questions.filter(q => q.has_diagram || (q.image_urls && q.image_urls.length > 0)).length})
        </button>
        <button 
          onClick={() => setFilterMode('NO_DIAGRAM')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterMode === 'NO_DIAGRAM' 
              ? 'bg-white dark:bg-slate-900 shadow border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          No Diagram ({questions.filter(q => !q.has_diagram && (!q.image_urls || q.image_urls.length === 0)).length})
        </button>
        <button 
          onClick={() => setFilterMode('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterMode === 'ALL' 
              ? 'bg-white dark:bg-slate-900 shadow border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          All Questions ({questions.length})
        </button>
      </div>

      {/* Search and refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search questions by text or course code..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] text-gray-900 dark:text-gray-100 placeholder-gray-400 border-gray-200/50 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <GlassButton variant="secondary" onClick={fetchQuestions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </GlassButton>
      </div>

      {/* Grid of Diagrams */}
      {loading ? (
        <div className="text-center py-20">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-500">Loading diagrams...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <Image className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">No matching questions found</h4>
          <p className="text-xs text-gray-500 mt-1">Try another tab or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.map(q => {
            const urls = q.image_urls || (q.image_url ? [q.image_url] : []);
            return (
              <GlassCard key={q.question_id} className="flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Q{q.question_number}
                    </span>
                    <span className="text-xs font-bold text-gray-500">{q.course_code}</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium line-clamp-3">
                    {q.question_text}
                  </p>
                </div>

                {/* Diagrams list */}
                <div className="space-y-3">
                  {urls.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {urls.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 aspect-video bg-gray-50/50 flex items-center justify-center">
                          <img 
                            src={url} 
                            alt={`diagram-${idx}`} 
                            className="object-contain w-full h-full cursor-pointer hover:scale-105 transition-transform" 
                            onClick={() => setPreviewImageUrl(url)}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => setPreviewImageUrl(url)} 
                              className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <label 
                              className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
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
                            <button 
                              onClick={() => handleDeleteDiagram(q.question_id, url)} 
                              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/20">
                      <Image className="w-6 h-6 text-gray-300 dark:text-gray-700 mx-auto mb-1" />
                      <span className="text-[10px] font-semibold text-gray-400">No illustrations attached</span>
                    </div>
                  )}

                  {/* Add Diagram Button */}
                  <div className="flex justify-end pt-1">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
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
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Preview Image Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <img 
              src={previewImageUrl} 
              alt="Preview" 
              className="object-contain max-w-full max-h-full rounded-2xl shadow-2xl" 
            />
            <button 
              onClick={() => setPreviewImageUrl(null)} 
              className="absolute top-4 right-4 p-2 bg-slate-900/60 text-white rounded-full hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
