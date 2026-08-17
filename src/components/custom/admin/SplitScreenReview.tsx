'use client';
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, CheckCircle, BookOpen, Trash2, 
  Upload, Sparkles, AlertCircle, FileText, Check, Eye
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { 
  Card, 
  Button, 
  Input, 
  Textarea, 
  Select, 
  Modal, 
  LoadingSpinner, 
  Badge 
} from '@/components/custom/admin/AdminUI';
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
    let hostname: string;
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      return url;
    }
    const isDrive = hostname === 'drive.google.com' || hostname.endsWith('.drive.google.com');
    if (isDrive && url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
    if (!isDrive && !url.includes('#')) {
      return `${url}#toolbar=1`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="h-16 shrink-0 bg-card/80 backdrop-blur-2xl border-b border-border/50 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon-sm"
            onClick={onClose} 
            className="h-9 w-9"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-6 w-px bg-border/50" />
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Review</span>
              <span>/</span>
              <span className="text-primary font-bold">{paper.course_code}</span>
            </div>
            <h1 className="text-base font-bold text-foreground truncate max-w-xl leading-tight">
              {paper.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => setIsJsonModalOpen(true)} className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Bulk Import JSON
          </Button>
          <Button variant="primary" size="sm" onClick={handlePublishPaper} className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Publish to Q-Bank
          </Button>
        </div>
      </header>

      {/* Split Screen Container */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Side: PDF Viewer */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-r border-border/50 flex flex-col bg-muted/20">
          <div className="px-5 py-2.5 border-b border-border/50 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> PDF Document Source
          </div>
          <div className="flex-1 min-h-0 relative">
            {paper.file_url && paper.file_url !== 'DIRECT_JSON' ? (
              <iframe
                src={formatPdfEmbedUrl(paper.file_url)}
                className="w-full h-full border-none"
                title="Question Paper PDF"
                allow="autoplay"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-bold uppercase tracking-wider text-foreground">No PDF File Attached</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  This paper is a direct JSON import or storage document link is missing.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Question Editor */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-card/30">
          <div className="px-5 py-2.5 border-b border-border/50 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Extracted Questions ({questions.length})
            </span>
            <Button 
              size="sm"
              variant="ghost"
              onClick={handleAddQuestion} 
              className="text-primary hover:text-primary font-bold flex items-center gap-1.5 h-7 px-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add Question
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {loading ? (
              <div className="flex flex-col gap-3 justify-center items-center py-32">
                <LoadingSpinner size="lg" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Loading Questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <Card className="text-center py-20 p-6">
                <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-foreground">No Questions Extracted</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  No questions have been parsed from this source document yet.
                </p>
                <Button variant="outline" size="sm" onClick={handleAddQuestion} className="mt-4">
                  <Plus className="w-4 h-4 mr-1.5" /> Add First Question
                </Button>
              </Card>
            ) : (
              questions.map((q, idx) => (
                <Card key={q.question_id || idx} className="p-5 space-y-4 relative group">
                  {/* Top Editor bar */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center">
                      <span className="bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-black rounded-l-xl">Q</span>
                      <input 
                        type="text" 
                        className="w-12 px-2 py-1.5 text-xs font-bold bg-background border border-l-0 border-border rounded-r-xl outline-none text-center" 
                        value={q.question_number} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, question_number: val } : item));
                        }} 
                        onBlur={(e) => handleUpdateQuestion(q.question_id, { questionNumber: e.target.value })} 
                        placeholder="#" 
                      />
                    </div>

                    <div className="w-36">
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

                    <div className="flex-1 min-w-[120px]">
                      <Input 
                        placeholder="Topic/Module" 
                        value={q.topic_name || ''} 
                        onChange={(e: any) => {
                          const val = e.target.value;
                          setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, topic_name: val } : item));
                        }} 
                        onBlur={(e: any) => handleUpdateQuestion(q.question_id, { topicName: e.target.value })} 
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <input 
                          type="number" 
                          className="w-12 px-2 py-1.5 text-xs font-bold text-center bg-background border border-border rounded-l-xl outline-none" 
                          value={q.marks || 0} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, marks: val } : item));
                          }} 
                          onBlur={(e) => handleUpdateQuestion(q.question_id, { marks: parseInt(e.target.value) || 0 })} 
                        />
                        <span className="bg-muted px-2 py-1.5 text-[10px] font-bold border border-l-0 border-border rounded-r-xl text-muted-foreground uppercase">M</span>
                      </div>
                      <Button 
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(q.question_id)} 
                        className="text-destructive hover:bg-destructive/10"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Question Content</label>
                    <Textarea 
                      rows={3}
                      value={q.question_text || ''} 
                      onChange={(e: any) => {
                        const val = e.target.value;
                        setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, question_text: val } : item));
                      }} 
                      onBlur={(e: any) => handleUpdateQuestion(q.question_id, { questionText: e.target.value })} 
                      placeholder="Type question text here (LaTeX formula markup supported between $$ delimiters)" 
                    />
                  </div>

                  {/* LaTeX Math Preview */}
                  <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1.5 opacity-70">LaTeX Visual Preview</p>
                    <div className="text-sm text-foreground overflow-x-auto leading-relaxed">
                      <Latex>{q.question_text || ''}</Latex>
                    </div>
                  </div>

                  {/* MCQ Options Block */}
                  {q.question_type === 'MCQ' && (
                    <div className="pt-3 border-t border-border/50 space-y-2.5">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">MCQ Options & Answer Key</p>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                          <span className="w-5 text-xs font-bold text-muted-foreground">{opt}</span>
                          <Input 
                            className="flex-1"
                            value={q.options?.[opt] || ''} 
                            onChange={(e: any) => {
                              const val = e.target.value;
                              setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, options: { ...(item.options || {}), [opt]: val } } : item));
                            }} 
                            onBlur={() => handleUpdateQuestion(q.question_id, { options: q.options })} 
                            placeholder={`Option ${opt}`} 
                          />
                          <Button
                            size="icon-sm"
                            variant={q.correct_answer === opt ? 'primary' : 'outline'}
                            onClick={() => handleUpdateQuestion(q.question_id, { correctAnswer: opt })}
                            title="Mark as correct answer"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Non-MCQ Correct Answer */}
                  {q.question_type !== 'MCQ' && (
                    <div className="pt-3 border-t border-border/50">
                      <Input 
                        label="Solution Key / Expected Answer"
                        value={q.correct_answer || ''} 
                        onChange={(e: any) => {
                          const val = e.target.value;
                          setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, correct_answer: val } : item));
                        }} 
                        onBlur={(e: any) => handleUpdateQuestion(q.question_id, { correctAnswer: e.target.value })} 
                        placeholder="Expected numerical result or grading key..." 
                      />
                    </div>
                  )}

                  {/* Diagrams Area */}
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.has_diagram || false}
                          onChange={(e) => handleUpdateQuestion(q.question_id, { hasDiagram: e.target.checked })}
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                        />
                        <span>Requires Diagram</span>
                      </label>

                      <label className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-semibold cursor-pointer hover:bg-primary/20 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadDiagram(q.question_id, e)}
                        />
                      </label>
                    </div>

                    {diagramUploadingMap[q.question_id] && (
                      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-primary">
                        <LoadingSpinner size="sm" /> Uploading image to cloud...
                      </div>
                    )}

                    {q.image_urls && q.image_urls.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {q.image_urls.map((url: string, imgIdx: number) => (
                          <div key={imgIdx} className="relative group w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted/40">
                            <img src={url} alt={`Diagram ${imgIdx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => window.open(url, '_blank')}
                                title="Open full"
                                className="h-7 w-7"
                              >
                                <Eye className="w-3.5 h-3.5 text-primary" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => handleDeleteDiagram(q.question_id, url)}
                                title="Remove"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* JSON Import Modal */}
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
            placeholder='[
  {
    "question_number": "1",
    "question_type": "MCQ",
    "marks": 2,
    "question_text": "What is the primary function of an operational amplifier?",
    "options": {
      "A": "Signal amplification",
      "B": "Voltage conversion",
      "C": "Frequency modulation",
      "D": "Digital switching"
    },
    "correct_answer": "A"
  }
]'
            value={jsonInput} 
            onChange={(e: any) => setJsonInput(e.target.value)} 
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="ghost" onClick={() => setIsJsonModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleBulkImport}>Import Now</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
