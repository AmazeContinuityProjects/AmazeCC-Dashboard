"use client";

import React, { useState, useEffect } from "react";
import 'katex/dist/katex.min.css';
import Latex from "react-latex-next";
import { CheckCircle, Clock, FileText, Settings, ArrowRight, ArrowLeft, Eye, Trash2, Plus, RotateCcw, AlertTriangle, ChevronDown, Edit } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { GlassCard, GlassButton, GlassInput, GlassTextarea, StatusBadge, LoadingSpinner, EmptyState } from "@/components/custom/admin/AdminUI";

export default function AdminQueueTab() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  useEffect(() => { fetchQueue(); }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/qbank/admin/queue');
      const json = await res.json();
      if (json.success && json.data) setPapers(json.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleReview = (paper: any) => { setSelectedPaper(paper); fetchQuestions(paper.source_id); };

  const handleStartOCR = async (paperId: string) => {
    setProcessingId(paperId);
    try {
      const res = await apiFetch("/api/admin/ocr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId }) });
      const data = await res.json();
      if (data.success) fetchQueue();
      else alert("OCR Error: " + data.error);
    } catch (err) { console.error(err); }
    finally { setProcessingId(null); }
  };

  const handleUpdateStatus = async (paperId: string, status: string) => {
    try {
      const res = await apiFetch("/api/qbank/admin/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId, status }) });
      const data = await res.json();
      if (data.success) fetchQueue();
      else alert("Status Update Error: " + data.error);
    } catch (err) { console.error(err); }
  };

  const handleUpdateUrl = async (paperId: string) => {
    const newUrl = prompt("Enter the new public PDF URL:");
    if (!newUrl) return;
    try {
      const res = await apiFetch("/api/admin/ocr/update-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId, fileUrl: newUrl }) });
      const data = await res.json();
      if (data.success) fetchQueue();
      else alert("Update Error: " + data.error);
    } catch (err) { console.error(err); }
  };

  const fetchQuestions = async (paperId: string) => {
    try {
      const res = await apiFetch('/api/qbank/admin/questions?paperId=' + encodeURIComponent(paperId));
      const json = await res.json();
      if (json.success && json.data) setQuestions(json.data);
    } catch (err) { console.error(err); }
  };

  const handleReject = async (paperId: string) => {
    if (!confirm("Are you sure you want to reject this paper?")) return;
    try { await apiFetch("/api/qbank/admin/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId }) }); fetchQueue(); }
    catch (err) { console.error(err); }
  };

  const handlePublish = async () => {
    if (!selectedPaper) return;
    try { await apiFetch("/api/qbank/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId: selectedPaper.source_id }) }); setSelectedPaper(null); fetchQueue(); }
    catch (err) { console.error(err); }
  };

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) { alert("JSON must be an array of questions."); return; }
      const res = await apiFetch("/api/qbank/admin/questions/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId: selectedPaper.source_id, questions: parsed }) });
      const data = await res.json();
      if (data.success) { fetchQuestions(selectedPaper.source_id); setIsJsonModalOpen(false); setJsonInput(""); }
      else alert("Failed: " + data.error);
    } catch (err: any) { alert("Invalid JSON: " + err.message); }
  };

  const handleUpdateQuestion = async (questionId: string, updates: any) => {
    try {
      setQuestions(prev => prev.map(q => q.question_id === questionId ? { ...q, ...updates } : q));
      await apiFetch("/api/qbank/admin/questions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId, ...updates }) });
    } catch (err) { console.error(err); }
  };

  const handleAddQuestion = async () => {
    if (!selectedPaper) return;
    try {
      const res = await apiFetch("/api/qbank/admin/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId: selectedPaper.source_id }) });
      const json = await res.json();
      if (json.success) setQuestions(prev => [...prev, json.data]);
    } catch (err) { console.error(err); }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try { setQuestions(prev => prev.filter(q => q.question_id !== questionId)); await apiFetch("/api/qbank/admin/questions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId }) }); }
    catch (err) { console.error(err); }
  };

  const statusColor = (s: string) => {
    if (s === 'PENDING') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 midnight:bg-amber-900/30 midnight:text-amber-400';
    if (s.startsWith('OCR')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 midnight:bg-blue-900/30 midnight:text-blue-400';
    if (s === 'APPROVED') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 midnight:bg-green-900/30 midnight:text-green-400';
    if (s === 'REJECTED') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 midnight:bg-red-900/30 midnight:text-red-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 midnight:bg-gray-900/30 midnight:text-gray-400';
  };

  // ─── REVIEW VIEW (Split Pane) ───
  if (selectedPaper) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GlassButton variant="ghost" size="sm" onClick={() => setSelectedPaper(null)}><ArrowLeft className="w-5 h-5" /></GlassButton>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white midnight:text-white">{selectedPaper.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">{selectedPaper.course_code}</p>
            </div>
          </div>
          <GlassButton onClick={handlePublish}><CheckCircle className="w-4 h-4 inline mr-2" />Publish</GlassButton>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)]">
          {/* Left Pane */}
          <GlassCard className="w-full lg:w-1/2 flex flex-col overflow-hidden">
            <div className="p-3 bg-white/60 dark:bg-slate-800/60 midnight:bg-white/[0.06] backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 midnight:text-gray-200 text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Source Document</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              {selectedPaper.file_url ? (
                <>
                  <FileText className="w-16 h-16 text-blue-500 mb-4 opacity-80" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400 mb-6 max-w-sm">Open the document in a new tab to extract questions.</p>
                  <GlassButton onClick={() => window.open(selectedPaper.file_url, '_blank')}><Eye className="w-4 h-4 inline mr-2" />View PDF</GlassButton>
                </>
              ) : <p className="text-gray-500 dark:text-gray-400 midnight:text-gray-400 text-sm">No PDF attached.</p>}
            </div>
          </GlassCard>

          {/* Right Pane: Question Editor */}
          <div className="w-full lg:w-1/2 flex flex-col rounded-xl overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-20">
              {questions.length === 0 ? (
                <EmptyState icon={<FileText className="w-10 h-10" />} title="No questions yet" description="Add questions manually or import JSON." />
              ) : questions.map((q, idx) => (
                <GlassCard key={q.question_id || idx} className="p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="flex items-center">
                      <span className="bg-blue-100 dark:bg-blue-900/40 midnight:bg-blue-900/40 text-blue-800 dark:text-blue-400 midnight:text-blue-400 px-2 py-1.5 text-xs font-bold rounded-l-md">Q.</span>
                      <input type="text" className="w-12 px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 midnight:bg-black border border-blue-200 dark:border-blue-800 midnight:border-blue-900 rounded-r-md focus:outline-none focus:ring-1 focus:ring-blue-500" value={q.question_number} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, question_number: e.target.value } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { questionNumber: e.target.value })} placeholder="#" />
                    </div>
                    <select className="text-xs px-2 py-1.5 bg-white dark:bg-slate-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-gray-800 rounded-md focus:outline-none focus:border-blue-500" value={q.question_type || "DESCRIPTIVE"} onChange={(e) => handleUpdateQuestion(q.question_id, { questionType: e.target.value })}>
                      <option value="DESCRIPTIVE">Descriptive</option><option value="MCQ">MCQ</option><option value="NUMERICAL">Numerical</option>
                    </select>
                    <input type="text" className="text-xs px-2 py-1.5 w-24 bg-white dark:bg-slate-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-gray-800 rounded-md focus:outline-none focus:border-blue-500" placeholder="Module" value={q.topic_name || ""} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, topic_name: e.target.value } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { topicName: e.target.value })} />
                    <div className="flex items-center ml-auto gap-2">
                      <div className="flex items-center">
                        <input type="number" className="w-12 px-2 py-1 text-xs text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-l-md focus:outline-none focus:border-blue-500" value={q.marks || 0} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, marks: parseInt(e.target.value) || 0 } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { marks: parseInt(e.target.value) || 0 })} />
                        <span className="bg-gray-100 dark:bg-gray-800 midnight:bg-gray-800 text-gray-600 dark:text-gray-400 midnight:text-gray-400 px-2 py-1 text-xs border border-l-0 border-gray-200 dark:border-gray-700 midnight:border-gray-800 rounded-r-md">M</span>
                      </div>
                      <button onClick={() => handleDeleteQuestion(q.question_id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 midnight:hover:bg-red-900/30 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <textarea className="w-full p-3 border border-gray-200 dark:border-gray-700 midnight:border-gray-800 rounded-lg font-mono text-sm bg-white dark:bg-slate-900 midnight:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px]" value={q.question_text || ""} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, question_text: e.target.value } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { questionText: e.target.value })} placeholder="Type question text. Use $$ for LaTeX..." />

                  <div className="mt-3 p-3 bg-blue-50/80 dark:bg-blue-900/10 midnight:bg-blue-900/15 rounded-lg border border-blue-100/50 dark:border-blue-800/30 midnight:border-blue-800/30">
                    <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 midnight:text-blue-400 font-bold mb-1">Preview</p>
                    <div className="text-sm overflow-x-auto min-h-[24px]"><Latex>{q.question_text || ""}</Latex></div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 midnight:border-gray-800/50 space-y-2">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 midnight:text-gray-400">Image URL (Optional)</label>
                    <input type="url" placeholder="https://i.imgur.com/..." className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-gray-800 rounded-md focus:outline-none focus:border-blue-500" value={q.image_url || ""} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, image_url: e.target.value } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { imageUrl: e.target.value || null })} />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 midnight:text-gray-400">Upload to <a href="https://imgur.com/upload" target="_blank" className="text-blue-500 hover:underline">Imgur</a> and paste the direct link.</p>
                  </div>

                  {q.question_type === 'MCQ' && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 midnight:border-gray-800/50 space-y-3">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 midnight:text-gray-400">MCQ Options</p>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                          <span className="w-6 text-sm font-bold text-gray-500 text-center">{opt}.</span>
                          <input type="text" className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-gray-800 rounded-md focus:outline-none focus:border-blue-500" value={q.options?.[opt] || ""} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, options: { ...(item.options || {}), [opt]: e.target.value } } : item))} onBlur={() => handleUpdateQuestion(q.question_id, { options: q.options })} placeholder={`Option ${opt}`} />
                          <input type="radio" name={`correct_${q.question_id}`} checked={q.correct_answer === opt} onChange={() => handleUpdateQuestion(q.question_id, { correctAnswer: opt })} className="w-4 h-4 text-blue-600" title={`Set ${opt} as Correct`} />
                        </div>
                      ))}
                    </div>
                  )}

                  {(q.question_type === 'NUMERICAL' || q.question_type === 'DESCRIPTIVE') && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 midnight:border-gray-800/50">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 midnight:text-gray-400 mb-2">Answer / Hints</p>
                      <input type="text" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-gray-800 rounded-md focus:outline-none focus:border-blue-500" value={q.correct_answer || ""} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, correct_answer: e.target.value } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { correctAnswer: e.target.value })} placeholder={q.question_type === 'NUMERICAL' ? "e.g. 42.5" : "Answer hint..."} />
                    </div>
                  )}
                </GlassCard>
              ))}

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <GlassButton variant="ghost" onClick={handleAddQuestion} className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 midnight:border-white/20 hover:border-blue-500"><Plus className="w-4 h-4 inline mr-2" />Add Question</GlassButton>
                <GlassButton variant="secondary" onClick={() => setIsJsonModalOpen(true)} className="flex-1"><FileText className="w-4 h-4 inline mr-2" />Import JSON</GlassButton>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Import Modal */}
        {isJsonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <GlassCard className="w-full max-w-2xl overflow-hidden p-0">
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white midnight:text-white">Import Questions</h3>
                <button onClick={() => setIsJsonModalOpen(false)} className="text-gray-500 dark:text-gray-400 midnight:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 midnight:hover:text-white text-xl">&times;</button>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-400 mb-3">Paste a JSON array. This will overwrite existing questions.</p>
                <details className="bg-blue-50/80 dark:bg-slate-800/40 midnight:bg-white/[0.04] border border-blue-200/50 dark:border-gray-700/50 midnight:border-white/10 rounded-lg p-3 mb-3">
                  <summary className="text-xs font-bold text-blue-700 dark:text-blue-400 midnight:text-blue-400 cursor-pointer">AI Prompt Guide</summary>
                  <pre className="mt-3 whitespace-pre-wrap font-mono text-[10px] text-gray-800 dark:text-gray-200 midnight:text-gray-200 overflow-x-auto">{`Convert this exam paper into a JSON array. Wrap equations in $$, double-escape backslashes.
[{ "question_number": "1", "question_type": "MCQ", "topic_name": "Module 1", "marks": 2,
  "question_text": "Capital of France?", "options": {"A":"London","B":"Paris","C":"Berlin","D":"Rome"},
  "correct_answer": "B" }]`}</pre>
                </details>
                <textarea className="w-full h-64 p-3 font-mono text-xs border border-gray-300 dark:border-gray-700 midnight:border-gray-800 rounded-lg bg-white dark:bg-slate-900 midnight:bg-black focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder='[{"question_number":"1","question_type":"MCQ","marks":2,"question_text":"...","options":{"A":"..."},"correct_answer":"A"}]' value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} />
              </div>
              <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 flex justify-end gap-3">
                <GlassButton variant="ghost" onClick={() => setIsJsonModalOpen(false)}>Cancel</GlassButton>
                <GlassButton onClick={handleBulkImport}>Import</GlassButton>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    );
  }

  // ─── QUEUE VIEW ───
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {loading ? (
        <div className="text-center py-20"><LoadingSpinner /><p className="mt-4 text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">Loading queue...</p></div>
      ) : papers.length === 0 ? (
        <EmptyState icon={<FileText className="w-10 h-10" />} title="No papers in queue" description="Papers uploaded by students will appear here." />
      ) : (
        <div className="space-y-4">
          {papers.map((p) => (
            <GlassCard key={p.source_id} className="p-5" hover>
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50/80 dark:bg-blue-900/20 midnight:bg-blue-900/30 rounded-xl text-blue-500 dark:text-blue-400 midnight:text-blue-400 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white midnight:text-white">{p.title}</h3>
                    <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400 mt-1">
                      <span className="font-medium">{p.course_code}</span>
                      <span>&bull;</span>
                      <span>by {p.uploader_reg_no}</span>
                      <span>&bull;</span>
                      <span>{p.source_type} {p.exam_semester} {p.exam_year}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-3">
                  <div className="relative">
                    <select className={`appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-semibold border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${statusColor(p.approval_status)}`} value={p.approval_status} onChange={(e) => handleUpdateStatus(p.source_id, e.target.value)}>
                      <option value="PENDING">Pending</option><option value="OCR_QUEUED">OCR Queued</option><option value="OCR_PROCESSING">OCR Processing</option><option value="PENDING_Q_APPROVAL">Review Ready</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="OCR_FAILED">OCR Failed</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400 midnight:text-gray-400" />
                  </div>

                  <div className="flex items-center gap-2">
                    {p.approval_status === "PENDING" && (
                      <>
                        <GlassButton variant="secondary" size="sm" onClick={() => handleStartOCR(p.source_id)} disabled={processingId === p.source_id}>
                          <Settings className={`w-4 h-4 inline mr-1 ${processingId === p.source_id ? 'animate-spin' : ''}`} />OCR
                        </GlassButton>
                        <GlassButton size="sm" onClick={() => handleReview(p)}>
                          <FileText className="w-4 h-4 inline mr-1" />Review
                        </GlassButton>
                        <button onClick={() => handleReject(p.source_id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 midnight:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                    {(p.approval_status === "OCR_QUEUED" || p.approval_status === "OCR_PROCESSING") && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 midnight:bg-amber-900/30 midnight:text-amber-400 rounded-lg text-sm font-medium animate-pulse">
                        <Clock className="w-4 h-4" /> {p.approval_status === "OCR_QUEUED" ? "Queued..." : "Processing..."}
                      </div>
                    )}
                    {p.approval_status === "OCR_FAILED" && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400 midnight:bg-red-900/30 midnight:text-red-400 rounded-lg text-xs font-medium"><AlertTriangle className="w-4 h-4" />Failed</div>
                        <GlassButton variant="ghost" size="sm" onClick={() => handleUpdateUrl(p.source_id)}><Edit className="w-4 h-4 inline mr-1" />Edit</GlassButton>
                        <GlassButton variant="ghost" size="sm" onClick={() => handleUpdateStatus(p.source_id, 'PENDING')}><RotateCcw className="w-4 h-4 inline mr-1" />Retry</GlassButton>
                      </div>
                    )}
                    {p.approval_status === "PENDING_Q_APPROVAL" && (
                      <GlassButton size="sm" onClick={() => handleReview(p)}><CheckCircle className="w-4 h-4 inline mr-1" />Review</GlassButton>
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