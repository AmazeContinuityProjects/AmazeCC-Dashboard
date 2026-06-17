'use client';
import React, { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, Plus, CheckCircle, BookOpen, Trash2, 
  Upload, Save, Image, Sparkles, AlertCircle, FileText
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GlassCard, GlassButton, LoadingSpinner } from '@/components/custom/admin/AdminUI';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

interface Question {
  question_id: string;
  source_id: string;
  question_number: string;
  question_text: string;
  image_url: string | null;
  image_urls: string[] | null;
  question_type: 'MCQ' | 'DESCRIPTIVE' | 'NUMERICAL';
  options: Record<string, string> | null;
  correct_answer: string | null;
  marks: number;
  topic_name: string | null;
  status: string;
  metadata: any;
  has_diagram: boolean;
  page_number: number | null;
  source_pdf_page: number | null;
}

interface SplitScreenReviewProps {
  paper: any;
  onClose: () => void;
  onPublishSuccess?: () => void;
}

export default function SplitScreenReview({ paper, onClose, onPublishSuccess }: SplitScreenReviewProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [diagramUploadingMap, setDiagramUploadingMap] = useState<Record<string, boolean>>({});

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/qbank/admin/questions?paperId=${encodeURIComponent(paper.source_id)}`);
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
  }, [paper.source_id]);

  const handleUpdateQuestion = async (questionId: string, updates: any) => {
    try {
      // Map UI updates structure to API payload fields
      const apiPayload: Record<string, any> = { questionId };
      if ('questionText' in updates) apiPayload.questionText = updates.questionText;
      if ('questionNumber' in updates) apiPayload.questionNumber = updates.questionNumber;
      if ('marks' in updates) apiPayload.marks = updates.marks;
      if ('questionType' in updates) apiPayload.questionType = updates.questionType;
      if ('options' in updates) apiPayload.options = updates.options;
      if ('correctAnswer' in updates) apiPayload.correctAnswer = updates.correctAnswer;
      if ('topicName' in updates) apiPayload.topicName = updates.topicName;
      if ('hasDiagram' in updates) apiPayload.hasDiagram = updates.hasDiagram;
      if ('imageUrls' in updates) apiPayload.imageUrls = updates.imageUrls;
      if ('pageNumber' in updates) apiPayload.pageNumber = updates.pageNumber;
      if ('sourcePdfPage' in updates) apiPayload.sourcePdfPage = updates.sourcePdfPage;
      if ('metadata' in updates) apiPayload.metadata = updates.metadata;

      // Update state locally
      setQuestions(prev => prev.map(q => {
        if (q.question_id === questionId) {
          const updated = { ...q };
          if ('questionText' in updates) updated.question_text = updates.questionText;
          if ('questionNumber' in updates) updated.question_number = updates.questionNumber;
          if ('marks' in updates) updated.marks = updates.marks;
          if ('questionType' in updates) updated.question_type = updates.questionType;
          if ('options' in updates) updated.options = updates.options;
          if ('correctAnswer' in updates) updated.correct_answer = updates.correctAnswer;
          if ('topicName' in updates) updated.topic_name = updates.topicName;
          if ('hasDiagram' in updates) updated.has_diagram = updates.hasDiagram;
          if ('imageUrls' in updates) updated.image_urls = updates.imageUrls;
          if ('pageNumber' in updates) updated.page_number = updates.pageNumber;
          if ('sourcePdfPage' in updates) updated.source_pdf_page = updates.sourcePdfPage;
          if ('metadata' in updates) updated.metadata = updates.metadata;
          return updated;
        }
        return q;
      }));

      await apiFetch('/api/qbank/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });
    } catch (err) {
      console.error('Failed to update question:', err);
    }
  };

  const handleAddQuestion = async () => {
    try {
      const res = await apiFetch('/api/qbank/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.source_id })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setQuestions(prev => [...prev, json.data]);
      }
    } catch (err) {
      console.error('Failed to add question:', err);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      setQuestions(prev => prev.filter(q => q.question_id !== questionId));
      await apiFetch('/api/qbank/admin/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId })
      });
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const handleUploadDiagram = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDiagramUploadingMap(prev => ({ ...prev, [questionId]: true }));
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

      const question = questions.find(q => q.question_id === questionId);
      if (question) {
        const currentUrls = Array.isArray(question.image_urls) ? question.image_urls : (question.image_url ? [question.image_url] : []);
        const updatedUrls = [...currentUrls, json.url];

        await handleUpdateQuestion(questionId, {
          imageUrls: updatedUrls,
          hasDiagram: true
        });
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to upload diagram: ' + (err.message || ''));
    } finally {
      setDiagramUploadingMap(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleDeleteDiagram = async (questionId: string, urlToDelete: string) => {
    if (!confirm('Are you sure you want to remove this diagram?')) return;
    try {
      const question = questions.find(q => q.question_id === questionId);
      if (question) {
        const currentUrls = Array.isArray(question.image_urls) ? question.image_urls : (question.image_url ? [question.image_url] : []);
        const updatedUrls = currentUrls.filter((url: string) => url !== urlToDelete);

        await handleUpdateQuestion(questionId, {
          imageUrls: updatedUrls,
          hasDiagram: updatedUrls.length > 0
        });
      }
    } catch (err) {
      console.error('Failed to delete diagram:', err);
    }
  };

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        alert('JSON must be an array of questions.');
        return;
      }
      const res = await apiFetch('/api/qbank/admin/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.source_id, questions: parsed })
      });
      const data = await res.json();
      if (data.success) {
        fetchQuestions();
        setIsJsonModalOpen(false);
        setJsonInput('');
      } else {
        alert('Import failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Invalid JSON input: ' + err.message);
    }
  };

  const handlePublishPaper = async () => {
    try {
      const res = await apiFetch('/api/qbank/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.source_id })
      });
      const json = await res.json();
      if (json.success) {
        alert('Paper published successfully!');
        if (onPublishSuccess) onPublishSuccess();
        onClose();
      } else {
        alert('Failed to publish paper: ' + json.error);
      }
    } catch (err: any) {
      alert('Error publishing paper: ' + err.message);
    }
  };

  const formatPdfEmbedUrl = (url: string) => {
    if (!url) return '';
    // Convert Google Drive /view URLs to /preview for embedding
    if (url.includes('drive.google.com') && url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
    // For regular PDFs, ensure we suggest a toolbar
    if (!url.includes('drive.google.com') && !url.includes('#')) {
      return `${url}#toolbar=1`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 midnight:bg-black flex flex-col h-screen overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 dark:bg-blue-500/10 midnight:bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 midnight:bg-emerald-500/5 blur-[120px]" />
      </div>

      {/* Top Header */}
      <header className="h-20 shrink-0 bg-white/70 dark:bg-slate-900/80 midnight:bg-white/[0.02] backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 midnight:border-white/10 px-8 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 midnight:hover:bg-white/[0.06] rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-10 w-px bg-gray-200/50 dark:border-gray-800/50 midnight:border-white/5" />
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              <span>Admin</span>
              <span className="opacity-40">/</span>
              <span>Review</span>
              <span className="opacity-40">/</span>
              <span className="text-blue-600 dark:text-blue-400">{paper.course_code}</span>
            </nav>
            <h1 className="text-lg font-black text-gray-900 dark:text-white truncate max-w-xl leading-none uppercase tracking-tight">
              {paper.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton variant="secondary" onClick={() => setIsJsonModalOpen(true)}>
            <BookOpen className="w-4 h-4 inline mr-2" /> Bulk Import JSON
          </GlassButton>
          <GlassButton onClick={handlePublishPaper}>
            <CheckCircle className="w-4 h-4 inline mr-2" /> Publish to Q-Bank
          </GlassButton>
        </div>
      </header>

      {/* Split Screen Container */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Side: PDF Viewer */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-r border-gray-200/50 dark:border-gray-800/50 midnight:border-white/5 flex flex-col bg-gray-50/50 dark:bg-slate-950/40 midnight:bg-transparent">
          <div className="px-6 py-3 border-b border-gray-200/50 dark:border-gray-800/50 midnight:border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> PDF Document Source
          </div>
          <div className="flex-1 min-h-0 relative">
            {paper.file_url && paper.file_url !== 'DIRECT_JSON' ? (
              <iframe
                src={formatPdfEmbedUrl(paper.file_url)}
                className="w-full h-full border-none opacity-90 dark:opacity-100"
                title="Question Paper PDF"
                allow="autoplay"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-500">
                <AlertCircle className="w-12 h-12 text-gray-400 mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-wider">No PDF File Attached</p>
                <p className="text-xs text-gray-500 mt-2 max-w-xs leading-relaxed">
                  This paper is a direct JSON import or storage link is missing.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Question Editor */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-white/30 dark:bg-slate-900/30 midnight:bg-transparent backdrop-blur-sm">
          <div className="px-6 py-3 border-b border-gray-200/50 dark:border-gray-800/50 midnight:border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Question Editor ({questions.length})
            </span>
            <button 
              onClick={handleAddQuestion} 
              className="text-blue-600 dark:text-blue-400 font-black hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {loading ? (
              <div className="flex flex-col gap-4 justify-center items-center py-40">
                <LoadingSpinner size="lg" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Indexing Knowledge...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-32 border-2 border-dashed border-gray-200/50 dark:border-gray-800/50 rounded-[32px] bg-gray-50/30 dark:bg-white/[0.02]">
                <FileText className="w-16 h-16 text-gray-200 dark:text-gray-800 mx-auto mb-6" />
                <h4 className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight">Empty Workspace</h4>
                <p className="text-xs font-medium text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
                  No questions have been extracted from this source yet. 
                  Start by adding a manual entry or bulk importing data.
                </p>
                <GlassButton variant="secondary" size="md" onClick={handleAddQuestion} className="mt-8">
                  <Plus className="w-4 h-4 inline mr-2" /> Add First Question
                </GlassButton>
              </div>
            ) : (
              questions.map((q, idx) => (
                <GlassCard key={q.question_id || idx} innerGlow className="p-6 border-blue-500/5 dark:border-blue-400/5 !rounded-[32px] relative group/q">
                  {/* Top Editor bar */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center shadow-lg shadow-blue-500/10">
                      <span className="bg-blue-600 text-white px-3 py-2 text-xs font-black rounded-l-xl">Q</span>
                      <input 
                        type="text" 
                        className="w-14 px-3 py-2 text-xs font-black bg-white dark:bg-slate-950 border border-l-0 border-gray-200 dark:border-gray-800 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center" 
                        value={q.question_number} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, question_number: val } : item));
                        }} 
                        onBlur={(e) => handleUpdateQuestion(q.question_id, { questionNumber: e.target.value })} 
                        placeholder="#" 
                      />
                    </div>

                    <select 
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none min-w-[120px] text-center" 
                      value={q.question_type || "DESCRIPTIVE"} 
                      onChange={(e) => handleUpdateQuestion(q.question_id, { questionType: e.target.value })}
                    >
                      <option value="DESCRIPTIVE">Descriptive</option>
                      <option value="MCQ">Multiple Choice</option>
                      <option value="NUMERICAL">Numerical</option>
                    </select>

                    <input 
                      type="text" 
                      className="text-xs font-bold px-4 py-2 w-32 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="Topic/Module" 
                      value={q.topic_name || ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, topic_name: val } : item));
                      }} 
                      onBlur={(e) => handleUpdateQuestion(q.question_id, { topicName: e.target.value })} 
                    />
                    
                    <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-gray-200/50 dark:border-gray-800">
                      <span className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">Page</span>
                      <input 
                        type="number" 
                        className="w-10 bg-transparent text-xs font-bold focus:outline-none text-center" 
                        value={q.page_number ?? ""} 
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : "";
                          setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, page_number: val === "" ? null : val } : item));
                        }} 
                        onBlur={(e) => handleUpdateQuestion(q.question_id, { pageNumber: e.target.value ? parseInt(e.target.value) : null })} 
                      />
                    </div>

                    <div className="flex items-center ml-auto gap-3">
                      <div className="flex items-center shadow-lg shadow-emerald-500/5">
                        <input 
                          type="number" 
                          className="w-12 px-3 py-2 text-xs font-black text-center bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
                          value={q.marks || 0} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, marks: val } : item));
                          }} 
                          onBlur={(e) => handleUpdateQuestion(q.question_id, { marks: parseInt(e.target.value) || 0 })} 
                        />
                        <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-2 text-[10px] font-black border border-l-0 border-gray-200 dark:border-gray-800 rounded-r-xl">MARKS</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteQuestion(q.question_id)} 
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Delete question"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Question Content</p>
                    <textarea 
                      className="w-full p-4 border border-gray-200 dark:border-gray-800 rounded-2xl font-mono text-xs bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[120px] shadow-inner" 
                      value={q.question_text || ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, question_text: val } : item));
                      }} 
                      onBlur={(e) => handleUpdateQuestion(q.question_id, { questionText: e.target.value })} 
                      placeholder="Type question text here (LaTeX formula markup supported between $$ delimiters)" 
                    />
                  </div>

                  {/* LaTeX Math Preview */}
                  <div className="mt-4 p-5 bg-blue-50/30 dark:bg-blue-900/5 rounded-2xl border border-blue-100/30 dark:border-blue-800/20 shadow-inner">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 font-black mb-3 opacity-60">Visual Preview</p>
                    <div className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto min-h-[24px] leading-relaxed">
                      <Latex>{q.question_text || ""}</Latex>
                    </div>
                  </div>

                  {/* MCQ Options Block */}
                  {q.question_type === 'MCQ' && (
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/50 space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 pl-1">Multiple Choice Config</p>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className="flex items-center gap-3 group/opt">
                          <span className="w-6 text-xs font-black text-gray-300 dark:text-gray-700 group-hover/opt:text-blue-500 transition-colors">{opt}</span>
                          <input 
                            type="text" 
                            className="flex-1 px-4 py-2.5 text-xs font-medium bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" 
                            value={q.options?.[opt] || ""} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, options: { ...(item.options || {}), [opt]: val } } : item));
                            }} 
                            onBlur={() => handleUpdateQuestion(q.question_id, { options: q.options })} 
                            placeholder={`Description for option ${opt}`} 
                          />
                          <button
                            onClick={() => handleUpdateQuestion(q.question_id, { correctAnswer: opt })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              q.correct_answer === opt 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Non-MCQ Correct Answer */}
                  {q.question_type !== 'MCQ' && (
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 pl-1">Primary Answer / Solution Key</p>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 text-xs font-bold bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-inner" 
                        value={q.correct_answer || ""} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, correct_answer: val } : item));
                        }} 
                        onBlur={(e) => handleUpdateQuestion(q.question_id, { correctAnswer: e.target.value })} 
                        placeholder="Expected answer or grading hint..." 
                      />
                    </div>
                  )}

                  {/* Diagrams Area */}
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Visual Assets</p>
                        <label className="flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={q.has_diagram || false}
                            onChange={(e) => handleUpdateQuestion(q.question_id, { hasDiagram: e.target.checked })}
                            className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500/20 w-4 h-4"
                          />
                          <span>Requires Diagram</span>
                        </label>
                      </div>

                      <label className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/40 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all cursor-pointer shadow-sm">
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

                    {diagramUploadingMap[q.question_id] && (
                      <div className="mt-4 flex items-center gap-3 text-[11px] font-bold text-blue-500 uppercase tracking-widest animate-pulse">
                        <LoadingSpinner size="sm" /> Syncing with Cloud...
                      </div>
                    )}

                    {q.image_urls && q.image_urls.length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-6">
                        {q.image_urls.map((url: string, imgIdx: number) => (
                          <div key={imgIdx} className="relative group w-24 h-24 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-slate-950 shadow-md">
                            <img src={url} alt={`Diagram ${imgIdx + 1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => window.open(url, '_blank')}
                                className="p-1.5 bg-white text-blue-600 rounded-lg shadow-xl hover:scale-110 transition-transform"
                                title="Open full"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDiagram(q.question_id, url)}
                                className="p-1.5 bg-white text-red-600 rounded-lg shadow-xl hover:scale-110 transition-transform"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))
            )}
            
            {!loading && (
              <button 
                onClick={handleAddQuestion} 
                className="w-full py-8 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/5 dark:hover:bg-blue-900/5 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em]">Add Question Manually</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* JSON Import Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-2xl overflow-hidden !p-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-55/50 dark:bg-slate-900/50">
              <h3 className="text-md font-bold text-gray-900 dark:text-white">Import Questions (JSON Array)</h3>
              <button 
                onClick={() => setIsJsonModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-350 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              <textarea 
                className="w-full h-72 p-3 font-mono text-xs border border-gray-300 dark:border-gray-800 rounded-lg bg-white dark:bg-slate-950 focus:outline-none" 
                placeholder='[
  {
    "question_number": "1",
    "question_type": "MCQ",
    "marks": 2,
    "question_text": "What is the capital of France?",
    "options": {
      "A": "London",
      "B": "Paris",
      "C": "Berlin",
      "D": "Rome"
    },
    "correct_answer": "B"
  }
]' 
                value={jsonInput} 
                onChange={(e) => setJsonInput(e.target.value)} 
              />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <GlassButton variant="ghost" onClick={() => setIsJsonModalOpen(false)}>Cancel</GlassButton>
              <GlassButton onClick={handleBulkImport}>Import Now</GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// Simple internal helper icon
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={props.className}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
