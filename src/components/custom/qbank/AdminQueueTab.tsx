"use client";

import React, { useState, useEffect, useCallback } from "react";
import 'katex/dist/katex.min.css';
import Latex from "react-latex-next";
import { CheckCircle, Clock, FileText, Settings, ArrowRight, ArrowLeft, Eye, Trash2, Plus, RotateCcw, AlertTriangle, ChevronDown, Edit, Search, Filter, Save, X, RefreshCw, Zap, BookOpen, Image, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { GlassCard, GlassButton, GlassInput, StatusBadge, LoadingSpinner, EmptyState } from "@/components/custom/admin/AdminUI";

const STATUS_FILTERS = [
 { id: 'ALL', label: 'All', color: 'text-gray-600 dark:text-gray-400 ' },
 { id: 'PENDING', label: 'Pending', color: 'text-amber-600 dark:text-amber-400 ' },
 { id: 'OCR_QUEUED', label: 'OCR Queued', color: 'text-blue-600 dark:text-blue-400 ' },
 { id: 'OCR_PROCESSING', label: 'Processing', color: 'text-purple-600 dark:text-purple-400 ' },
 { id: 'PENDING_Q_APPROVAL', label: 'Review Ready', color: 'text-emerald-600 dark:text-emerald-400 ' },
 { id: 'APPROVED', label: 'Approved', color: 'text-green-600 dark:text-green-400 ' },
 { id: 'REJECTED', label: 'Rejected', color: 'text-red-600 dark:text-red-400 ' },
 { id: 'OCR_FAILED', label: 'Failed', color: 'text-red-600 dark:text-red-400 ' },
];

const statusBadge = (s: string) => {
 const map: Record<string, { bg: string; text: string }> = {
 PENDING: { bg: 'bg-amber-100/80 dark:bg-amber-900/30 ', text: 'text-amber-700 dark:text-amber-400 ' },
 OCR_QUEUED: { bg: 'bg-blue-100/80 dark:bg-blue-900/30 ', text: 'text-blue-700 dark:text-blue-400 ' },
 OCR_PROCESSING: { bg: 'bg-purple-100/80 dark:bg-purple-900/30 ', text: 'text-purple-700 dark:text-purple-400 ' },
 PENDING_Q_APPROVAL: { bg: 'bg-emerald-100/80 dark:bg-emerald-900/30 ', text: 'text-emerald-700 dark:text-emerald-400 ' },
 APPROVED: { bg: 'bg-green-100/80 dark:bg-green-900/30 ', text: 'text-green-700 dark:text-green-400 ' },
 REJECTED: { bg: 'bg-red-100/80 dark:bg-red-900/30 ', text: 'text-red-700 dark:text-red-400 ' },
 OCR_FAILED: { bg: 'bg-red-100/80 dark:bg-red-900/30 ', text: 'text-red-700 dark:text-red-400 ' },
 };
 const s2 = map[s] || map.PENDING;
 return `${s2.bg} ${s2.text}`;
};

export default function AdminQueueTab() {
 const [papers, setPapers] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [processingId, setProcessingId] = useState<string | null>(null);
 const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
 const [questions, setQuestions] = useState<any[]>([]);
 const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
 const [jsonInput, setJsonInput] = useState("");
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
 const res = await apiFetch("/api/admin/ocr", { 
 method: "POST", 
 headers: { "Content-Type": "application/json" }, 
 body: JSON.stringify({ paperId, model }) 
 });
 const data = await res.json();
 if (data.success) fetchQueue();
 else alert("OCR Error: " + data.error);
 } catch (err) { console.error(err); }
 finally { setProcessingId(null); }
 };

 const handleResetOCR = async (paperId: string) => {
 try {
 await apiFetch("/api/admin/ocr/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId }) });
 fetchQueue();
 } catch (err) { console.error(err); }
 };

 const handleReject = async (paperId: string) => {
 if (!confirm("Reject this paper?")) return;
 try { await apiFetch("/api/qbank/admin/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId }) }); fetchQueue(); }
 catch (err) { console.error(err); }
 };

 const handlePublish = async (paperId: string) => {
 try { await apiFetch("/api/qbank/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId }) }); fetchQueue(); }
 catch (err) { console.error(err); }
 };

 const handleSavePaper = async (paperId: string) => {
 try {
 await apiFetch("/api/qbank/admin/queue", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId, ...editForm }) });
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
 if (!confirm("Delete this question?")) return;
 try { setQuestions(prev => prev.filter(q => q.question_id !== questionId)); await apiFetch("/api/qbank/admin/questions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId }) }); }
 catch (err) { console.error(err); }
 };

 const handleUploadDiagram = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 try {
 const formData = new FormData();
 formData.append("file", file);

 const res = await apiFetch("/api/qbank/admin/upload-diagram", {
 method: "POST",
 body: formData,
 });

 const json = await res.json();
 if (!res.ok || !json.success) {
 throw new Error(json.error || "Upload failed");
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
 alert("Failed to upload diagram: " + (err.message || "Unknown error"));
 }
 };

 const handleDeleteDiagram = async (questionId: string, urlToDelete: string) => {
 if (!confirm("Remove this diagram?")) return;

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
 if (!Array.isArray(parsed)) { alert("JSON must be an array."); return; }
 const res = await apiFetch("/api/qbank/admin/questions/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId: selectedPaper.source_id, questions: parsed }) });
 const data = await res.json();
 if (data.success) { fetchQuestions(selectedPaper.source_id); setIsJsonModalOpen(false); setJsonInput(""); }
 else alert("Failed: " + data.error);
 } catch (err: any) { alert("Invalid JSON: " + err.message); }
 };

 const statusCounts = papers.reduce((acc, p) => { acc[p.approval_status] = (acc[p.approval_status] || 0) + 1; return acc; }, {} as Record<string, number>);

 // ─── REVIEW VIEW ───
 if (selectedPaper) {
 return (
 <div className="flex flex-col h-full p-4">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <GlassButton variant="ghost" size="sm" onClick={() => setSelectedPaper(null)}><ArrowLeft className="w-5 h-5" /></GlassButton>
 <div>
 <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ">{selectedPaper.title}</h1>
 <p className="text-sm text-gray-500 dark:text-gray-400 ">{selectedPaper.course_code}</p>
 </div>
 </div>
 <GlassButton onClick={() => handlePublish(selectedPaper.source_id)}><CheckCircle className="w-4 h-4 inline mr-2" />Publish</GlassButton>
 </div>

 <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)]">
 {/* Left Pane */}
 <GlassCard className="w-full lg:w-1/2 flex flex-col overflow-hidden !p-0">
 <div className="p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 ">
 <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Source Document</h3>
 </div>
 <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
 {selectedPaper.file_url ? (
 <>
 <FileText className="w-16 h-16 text-blue-500 mb-4 opacity-80" />
 <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">Open the document in a new tab to extract questions.</p>
 <GlassButton onClick={() => window.open(selectedPaper.file_url, '_blank')}><Eye className="w-4 h-4 inline mr-2" />View PDF</GlassButton>
 </>
 ) : <p className="text-gray-500 dark:text-gray-400 text-sm">No PDF attached.</p>}
 </div>
 </GlassCard>

 {/* Right Pane: Question Editor */}
 <div className="w-full lg:w-1/2 flex flex-col rounded-xl overflow-hidden">
 <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-20">
 {questions.length === 0 ? (
 <EmptyState icon={<FileText className="w-10 h-10" />} title="No questions yet" description="Add questions manually or import JSON." />
 ) : questions.map((q, idx) => (
 <GlassCard key={q.question_id || idx} className="p-4 !rounded-xl">
 <div className="flex flex-wrap items-center gap-2 mb-3">
 <div className="flex items-center">
 <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 px-2 py-1.5 text-xs font-bold rounded-l-md">Q.</span>
 <input type="text" className="w-12 px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-r-md focus:outline-none focus:ring-1 focus:ring-blue-500" value={q.question_number} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, question_number: e.target.value } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { questionNumber: e.target.value })} placeholder="#" />
 </div>
 <select className="text-xs px-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-500" value={q.question_type || "DESCRIPTIVE"} onChange={(e) => handleUpdateQuestion(q.question_id, { questionType: e.target.value })}>
 <option value="DESCRIPTIVE">Descriptive</option><option value="MCQ">MCQ</option><option value="NUMERICAL">Numerical</option>
 </select>
 <input type="text" className="text-xs px-2 py-1.5 w-24 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-500" placeholder="Module" value={q.topic_name || ""} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, topic_name: e.target.value } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { topicName: e.target.value })} />
 
 <div className="flex items-center gap-1">
 <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Pg</span>
 <input type="number" className="w-10 px-1.5 py-1 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-500 text-center" placeholder="Pg" value={q.page_number !== null && q.page_number !== undefined ? q.page_number : ""} onChange={(e) => {
 const val = e.target.value ? parseInt(e.target.value) : "";
 setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, page_number: val === "" ? null : val } : item));
 }} onBlur={(e) => handleUpdateQuestion(q.question_id, { pageNumber: e.target.value ? parseInt(e.target.value) : null })} />
 </div>
 <div className="flex items-center gap-1">
 <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">PDF</span>
 <input type="number" className="w-10 px-1.5 py-1 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-500 text-center" placeholder="PDF" value={q.source_pdf_page !== null && q.source_pdf_page !== undefined ? q.source_pdf_page : ""} onChange={(e) => {
 const val = e.target.value ? parseInt(e.target.value) : "";
 setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, source_pdf_page: val === "" ? null : val } : item));
 }} onBlur={(e) => handleUpdateQuestion(q.question_id, { sourcePdfPage: e.target.value ? parseInt(e.target.value) : null })} />
 </div>

 <div className="flex items-center ml-auto gap-2">
 <div className="flex items-center">
 <input type="number" className="w-12 px-2 py-1 text-xs text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-l-md focus:outline-none focus:border-blue-500" value={q.marks || 0} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, marks: parseInt(e.target.value) || 0 } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { marks: parseInt(e.target.value) || 0 })} />
 <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 text-xs border border-l-0 border-gray-200 dark:border-gray-700 rounded-r-md">M</span>
 </div>
 <button onClick={() => handleDeleteQuestion(q.question_id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>
 <textarea className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px]" value={q.question_text || ""} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, question_text: e.target.value } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { questionText: e.target.value })} placeholder="Type question text. Use $$ for LaTeX..." />
 <div className="mt-3 p-3 bg-blue-50/80 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-800/30 space-y-2">
 <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold mb-1">Preview</p>
 <div className="text-sm overflow-x-auto min-h-[24px]"><Latex>{q.question_text || ""}</Latex></div>
 {q.image_urls && q.image_urls.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-blue-100/30 dark:border-blue-900/30">
 {q.image_urls.map((url: string, imgIdx: number) => (
 <div key={imgIdx} className="max-w-[150px] max-h-[150px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 flex items-center justify-center p-1">
 <img src={url} alt={`Preview Diagram ${imgIdx + 1}`} className="max-w-full max-h-[140px] object-contain" />
 </div>
 ))}
 </div>
 )}
 </div>
 {q.question_type === 'MCQ' && (
 <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
 <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 ">MCQ Options</p>
 {['A', 'B', 'C', 'D'].map(opt => (
 <div key={opt} className="flex items-center gap-2">
 <span className="w-6 text-sm font-bold text-gray-500 text-center">{opt}.</span>
 <input type="text" className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-500" value={q.options?.[opt] || ""} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, options: { ...(item.options || {}), [opt]: e.target.value } } : item))} onBlur={() => handleUpdateQuestion(q.question_id, { options: q.options })} placeholder={`Option ${opt}`} />
 <input type="radio" name={`correct_${q.question_id}`} checked={q.correct_answer === opt} onChange={() => handleUpdateQuestion(q.question_id, { correctAnswer: opt })} className="w-4 h-4 text-blue-600" title={`Set ${opt} as Correct`} />
 </div>
 ))}
 </div>
 )}
 {(q.question_type === 'NUMERICAL' || q.question_type === 'DESCRIPTIVE') && (
 <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 ">
 <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Answer / Hints</p>
 <input type="text" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-500" value={q.correct_answer || ""} onChange={(e) => setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, correct_answer: e.target.value } : item))} onBlur={(e) => handleUpdateQuestion(q.question_id, { correctAnswer: e.target.value })} placeholder="Answer..." />
 </div>
 )}

 {/* Diagram Upload & List */}
 <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
 <div className="flex items-center justify-between">
 <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
 <input
 type="checkbox"
 checked={q.has_diagram || false}
 onChange={(e) => {
 const val = e.target.checked;
 setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, has_diagram: val } : item));
 handleUpdateQuestion(q.question_id, { hasDiagram: val });
 }}
 className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
 />
 <span className="flex items-center gap-1">
 <Image className="w-3.5 h-3.5" /> Has Diagram
 </span>
 </label>

 <label className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/35 cursor-pointer transition-colors border border-blue-100 dark:border-blue-800/50">
 <Upload className="w-3.5 h-3.5" />
 <span>Upload Diagram</span>
 <input
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => handleUploadDiagram(q.question_id, e)}
 />
 </label>
 </div>

 {q.image_urls && q.image_urls.length > 0 ? (
 <div className="flex flex-wrap gap-2">
 {q.image_urls.map((url: string, imgIdx: number) => (
 <div key={imgIdx} className="relative group w-20 h-20 rounded-lg border border-gray-200 dark:border-gray-805 overflow-hidden bg-gray-50 dark:bg-slate-900 ">
 <img src={url} alt={`Diagram ${imgIdx + 1}`} className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
 <button
 type="button"
 onClick={() => handleDeleteDiagram(q.question_id, url)}
 className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
 title="Delete diagram"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 ))}
 </div>
 ) : (
 q.has_diagram && (
 <p className="text-xs text-amber-600 dark:text-amber-400 italic">No diagram images uploaded yet.</p>
 )
 )}
 </div>
 </GlassCard>
 ))}
 <div className="flex flex-col sm:flex-row gap-3 mt-4">
 <GlassButton variant="ghost" onClick={handleAddQuestion} className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500"><Plus className="w-4 h-4 inline mr-2" />Add Question</GlassButton>
 <GlassButton variant="secondary" onClick={() => setIsJsonModalOpen(true)} className="flex-1"><BookOpen className="w-4 h-4 inline mr-2" />Import JSON</GlassButton>
 </div>
 </div>
 </div>
 </div>

 {/* JSON Import Modal */}
 {isJsonModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <GlassCard className="w-full max-w-2xl overflow-hidden !p-0">
 <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
 <h3 className="text-lg font-bold text-gray-900 dark:text-white ">Import Questions</h3>
 <button onClick={() => setIsJsonModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 text-xl">&times;</button>
 </div>
 <div className="p-4">
 <textarea className="w-full h-64 p-3 font-mono text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder='[{"question_number":"1","question_type":"MCQ","marks":2,"question_text":"...","options":{"A":"..."},"correct_answer":"A"}]' value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} />
 </div>
 <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-end gap-3">
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
 <div className="w-full max-w-6xl mx-auto space-y-6">
 {/* Status Filter Tabs */}
 <div className="flex flex-wrap gap-2">
 {STATUS_FILTERS.map(f => {
 const count = f.id === 'ALL' ? papers.length : (statusCounts[f.id] || 0);
 return (
 <button key={f.id} onClick={() => setStatusFilter(f.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${statusFilter === f.id ? 'bg-white/80 dark:bg-slate-800/80 shadow-md border border-gray-200/50 dark:border-gray-700/50 ' + f.color : 'text-gray-500 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-slate-800/40 '}`}>
 {f.label}
 {count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === f.id ? 'bg-gray-100 dark:bg-gray-700 ' : 'bg-gray-200/50 dark:bg-gray-700/50 '}`}>{count}</span>}
 </button>
 );
 })}
 </div>

 {/* Search & Refresh */}
 <div className="flex items-center gap-3">
 <div className="relative max-w-md flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input type="text" placeholder="Search by title, course, or uploader..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 border-gray-200/50 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
 </div>
 <span title="Refresh Queue">
 <GlassButton variant="secondary" onClick={fetchQueue} disabled={loading}>
 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
 </GlassButton>
 </span>
 </div>

 {/* Paper List */}
 {loading ? (
 <div className="text-center py-20"><LoadingSpinner /><p className="mt-4 text-sm text-gray-500 dark:text-gray-400 ">Loading queue...</p></div>
 ) : filteredPapers.length === 0 ? (
 <EmptyState icon={<FileText className="w-10 h-10" />} title="No papers found" description={statusFilter !== 'ALL' ? "No papers match this filter." : "Papers uploaded by students will appear here."} />
 ) : (
 <div className="space-y-3">
 {filteredPapers.map((p) => (
 <GlassCard key={p.source_id} className="!p-0 overflow-hidden" hover>
 <div className="flex flex-col md:flex-row">
 {/* Status bar */}
 <div className={`w-full md:w-1.5 shrink-0 ${statusBadge(p.approval_status).split(' ')[0]}`} />

 <div className="flex-1 p-4">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
 {/* Paper Info */}
 <div className="flex-1 min-w-0">
 {editingPaper === p.source_id ? (
 <div className="grid grid-cols-2 gap-2">
 <input className="col-span-2 px-3 py-1.5 text-sm font-semibold bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Paper title" />
 <input className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" value={editForm.course_code || ''} onChange={(e) => setEditForm({ ...editForm, course_code: e.target.value })} placeholder="Course code" />
 <input className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" value={editForm.source_type || ''} onChange={(e) => setEditForm({ ...editForm, source_type: e.target.value })} placeholder="Type" />
 <input type="number" className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" value={editForm.exam_year || ''} onChange={(e) => setEditForm({ ...editForm, exam_year: parseInt(e.target.value) })} placeholder="Year" />
 <input className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" value={editForm.exam_semester || ''} onChange={(e) => setEditForm({ ...editForm, exam_semester: e.target.value })} placeholder="Semester" />
 <div className="col-span-2 flex gap-2">
 <GlassButton size="sm" onClick={() => handleSavePaper(p.source_id)}><Save className="w-3 h-3 inline mr-1" />Save</GlassButton>
 <GlassButton variant="ghost" size="sm" onClick={() => setEditingPaper(null)}><X className="w-3 h-3 inline mr-1" />Cancel</GlassButton>
 </div>
 </div>
 ) : (
 <>
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{p.title}</h3>
 <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200/30 dark:border-gray-700/30 ${statusBadge(p.approval_status)}`}>
 {p.approval_status?.replace(/_/g, ' ')}
 </span>
 </div>
 <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
 <span className="font-medium">{p.course_code}</span>
 <span>&bull;</span>
 <span>{p.source_type} {p.exam_semester} {p.exam_year}</span>
 <span>&bull;</span>
 <span>by {p.uploader_reg_no}</span>
 </div>
 </>
 )}
 </div>

 {/* Actions */}
 {editingPaper !== p.source_id && (
 <div className="flex items-center gap-2 flex-shrink-0">
 <span title="Edit details"><GlassButton variant="ghost" size="sm" onClick={() => startEditing(p)}><Edit className="w-3.5 h-3.5" /></GlassButton></span>

 {p.approval_status === 'PENDING' && (
 <>
 <select 
 value={selectedModels[p.source_id] || p.ocr_model || "qwen2.5vl:3b"} 
 onChange={(e) => {
 setSelectedModels(prev => ({ ...prev, [p.source_id]: e.target.value }));
 }}
 className="relative z-10 cursor-pointer pointer-events-auto shrink-0 min-w-[140px] text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-gray-100 "
 >
 <option value="qwen2.5vl:3b" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 ">Qwen 3B (Precise)</option>
 <option value="moondream" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 ">Moondream (Fast)</option>
 </select>
 <GlassButton variant="secondary" size="sm" onClick={() => handleStartOCR(p.source_id, selectedModels[p.source_id] || p.ocr_model || "qwen2.5vl:3b")} disabled={processingId === p.source_id}>
 <Zap className={`w-3.5 h-3.5 inline mr-1 ${processingId === p.source_id ? 'animate-spin' : ''}`} />OCR
 </GlassButton>
 <GlassButton size="sm" onClick={() => handleReview(p)}><Eye className="w-3.5 h-3.5 inline mr-1" />Review</GlassButton>
 <button onClick={() => handleReject(p.source_id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
 </>
 )}

 {(p.approval_status === 'OCR_QUEUED' || p.approval_status === 'OCR_PROCESSING') && (
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-medium animate-pulse">
 <Clock className="w-3 h-3" /> {p.approval_status === 'OCR_QUEUED' ? 'Queued' : 'Processing'}
 </div>
 <span title="Reset to Pending"><GlassButton variant="ghost" size="sm" onClick={() => handleResetOCR(p.source_id)}><RotateCcw className="w-3.5 h-3.5" /></GlassButton></span>
 </div>
 )}

 {p.approval_status === 'PENDING_Q_APPROVAL' && (
 <>
 <select 
 value={selectedModels[p.source_id] || p.ocr_model || "qwen2.5vl:3b"} 
 onChange={(e) => {
 setSelectedModels(prev => ({ ...prev, [p.source_id]: e.target.value }));
 }}
 className="relative z-10 cursor-pointer pointer-events-auto shrink-0 min-w-[140px] text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-gray-100 "
 >
 <option value="qwen2.5vl:3b" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 ">Qwen 3B (Precise)</option>
 <option value="moondream" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 ">Moondream (Fast)</option>
 </select>
 <GlassButton variant="secondary" size="sm" onClick={() => handleStartOCR(p.source_id, selectedModels[p.source_id] || p.ocr_model || "qwen2.5vl:3b")} disabled={processingId === p.source_id}>
 <Zap className={`w-3.5 h-3.5 inline mr-1 ${processingId === p.source_id ? 'animate-spin' : ''}`} />Re-run OCR
 </GlassButton>
 <GlassButton size="sm" onClick={() => handleReview(p)}><CheckCircle className="w-3.5 h-3.5 inline mr-1" />Review</GlassButton>
 <span title="Reset to Pending"><GlassButton variant="ghost" size="sm" onClick={() => handleResetOCR(p.source_id)}><RotateCcw className="w-3.5 h-3.5" /></GlassButton></span>
 </>
 )}

 {p.approval_status === 'APPROVED' && (
 <>
 <select 
 value={selectedModels[p.source_id] || p.ocr_model || "qwen2.5vl:3b"} 
 onChange={(e) => {
 setSelectedModels(prev => ({ ...prev, [p.source_id]: e.target.value }));
 }}
 className="relative z-10 cursor-pointer pointer-events-auto shrink-0 min-w-[140px] text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-gray-100 "
 >
 <option value="qwen2.5vl:3b" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 ">Qwen 3B (Precise)</option>
 <option value="moondream" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 ">Moondream (Fast)</option>
 </select>
 <GlassButton variant="secondary" size="sm" onClick={() => handleStartOCR(p.source_id, selectedModels[p.source_id] || p.ocr_model || "qwen2.5vl:3b")} disabled={processingId === p.source_id}>
 <Zap className={`w-3.5 h-3.5 inline mr-1 ${processingId === p.source_id ? 'animate-spin' : ''}`} />Re-run OCR
 </GlassButton>
 <GlassButton variant="ghost" size="sm" onClick={() => handleReview(p)}><Eye className="w-3.5 h-3.5 inline mr-1" />View</GlassButton>
 <span title="Reset to Pending"><GlassButton variant="ghost" size="sm" onClick={() => handleResetOCR(p.source_id)}><RotateCcw className="w-3.5 h-3.5" /></GlassButton></span>
 </>
 )}

 {p.approval_status === 'REJECTED' && (
 <GlassButton variant="ghost" size="sm" onClick={() => { apiFetch("/api/admin/ocr/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paperId: p.source_id }) }).then(() => fetchQueue()); }}><RotateCcw className="w-3.5 h-3.5 inline mr-1" />Restore</GlassButton>
 )}

 {p.approval_status === 'OCR_FAILED' && (
 <>
 <GlassButton variant="ghost" size="sm" onClick={() => handleResetOCR(p.source_id)}><RotateCcw className="w-3.5 h-3.5 inline mr-1" />Retry</GlassButton>
 <GlassButton variant="ghost" size="sm" onClick={() => handleReject(p.source_id)}><Trash2 className="w-3.5 h-3.5" /></GlassButton>
 </>
 )}
 </div>
 )}
 </div>

 {/* Progress bar for running OCR */}
 {(p.approval_status === 'OCR_QUEUED' || p.approval_status === 'OCR_PROCESSING') && p.ocr_progress !== undefined && (
 <div className="mt-3">
 <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
 <span>OCR Progress</span>
 <span className="font-semibold">{p.ocr_progress}%</span>
 </div>
 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
 <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${p.ocr_progress}%` }}></div>
 </div>
 </div>
 )}

 {/* Logs toggle button and logs content */}
 {p.ocr_logs && (
 <div className="mt-3 border-t border-gray-200/20 dark:border-gray-700/20 pt-2">
 <button 
 onClick={() => setOpenLogId(openLogId === p.source_id ? null : p.source_id)}
 className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1 focus:outline-none cursor-pointer"
 >
 {openLogId === p.source_id ? 'Hide Logs' : 'View OCR Logs'}
 </button>
 
 {openLogId === p.source_id && (
 <pre className="mt-2 p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap border border-slate-800">
 {p.ocr_logs}
 </pre>
 )}
 </div>
 )}
 </div>
 </div>
 </GlassCard>
 ))}
 </div>
 )}
 </div>
 );
}