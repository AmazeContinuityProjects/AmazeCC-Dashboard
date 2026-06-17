'use client';
import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, LayoutGrid, CheckCircle, Trash2, FileText,
  AlertCircle, HelpCircle, Check, X, Filter, FolderPlus, Tag, ArrowRightLeft,
  ChevronDown, ChevronUp, Image, Eye
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GlassCard, GlassButton, SectionHeader, LoadingSpinner } from '@/components/custom/admin/AdminUI';

interface Question {
  question_id: string;
  source_id: string;
  question_number: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string | null;
  marks: number;
  topic_name: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'REJECTED';
  metadata: any;
  has_diagram: boolean;
  image_urls: string[];
  page_number: number | null;
  source_pdf_page: number | null;
  course_code: string;
  exam_year: number;
  source_type: string;
  exam_semester: string | null;
  paper_title: string;
}

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Filters
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [diagramFilter, setDiagramFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');

  // Sorting
  const [sortBy, setSortBy] = useState<'created' | 'marks' | 'qnumber'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk input modals/states
  const [bulkActionType, setBulkActionType] = useState<'module' | 'topic' | 'subject' | null>(null);
  const [bulkActionValue, setBulkActionValue] = useState('');
  const [isPerformingBulk, setIsPerformingBulk] = useState(false);

  // Edit inline state
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    question_text: '',
    marks: 0,
    topic_name: '',
    module: '',
    question_type: 'DESCRIPTIVE'
  });

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredQuestions.map(q => q.question_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const executeBulkAction = async (action: string, val?: any) => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !confirm(`Are you sure you want to delete these ${selectedIds.length} questions?`)) return;

    try {
      setIsPerformingBulk(true);
      const res = await apiFetch('/api/qbank/admin/questions/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIds: selectedIds,
          action,
          value: val
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Bulk action executed successfully!');
        setSelectedIds([]);
        setBulkActionType(null);
        setBulkActionValue('');
        fetchQuestions();
      } else {
        alert('Bulk action failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsPerformingBulk(false);
    }
  };

  const handleSaveInline = async (qId: string) => {
    try {
      setQuestions(prev => prev.map(q => q.question_id === qId ? {
        ...q,
        question_text: editForm.question_text,
        marks: editForm.marks,
        topic_name: editForm.topic_name,
        question_type: editForm.question_type,
        metadata: { ...q.metadata, module: editForm.module }
      } : q));
      setEditingQId(null);

      await apiFetch('/api/qbank/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: qId,
          questionText: editForm.question_text,
          marks: editForm.marks,
          topicName: editForm.topic_name,
          questionType: editForm.question_type,
          metadata: { module: editForm.module }
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (q: Question) => {
    setEditingQId(q.question_id);
    setEditForm({
      question_text: q.question_text || '',
      marks: q.marks || 0,
      topic_name: q.topic_name || '',
      module: q.metadata?.module || '',
      question_type: q.question_type || 'DESCRIPTIVE'
    });
  };

  // Unique lists for filtering
  const subjects = Array.from(new Set(questions.map(q => q.course_code))).filter(Boolean);
  const years = Array.from(new Set(questions.map(q => q.exam_year))).filter(Boolean);

  // Sorting logic
  const sortQuestions = (a: Question, b: Question) => {
    let factor = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'marks') {
      return (a.marks - b.marks) * factor;
    }
    if (sortBy === 'qnumber') {
      return a.question_number.localeCompare(b.question_number) * factor;
    }
    // Default created/ID
    return a.question_id.localeCompare(b.question_id) * factor;
  };

  // Searching & Filtering
  const filteredQuestions = questions.filter(q => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      q.question_text?.toLowerCase().includes(query) ||
      q.course_code?.toLowerCase().includes(query) ||
      q.topic_name?.toLowerCase().includes(query) ||
      (q.metadata?.module && String(q.metadata.module).toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (subjectFilter !== 'ALL' && q.course_code !== subjectFilter) return false;
    if (typeFilter !== 'ALL' && q.question_type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
    if (yearFilter !== 'ALL' && q.exam_year !== parseInt(yearFilter)) return false;
    if (diagramFilter !== 'ALL') {
      const hasDiag = q.has_diagram || (q.image_urls && q.image_urls.length > 0);
      if (diagramFilter === 'YES' && !hasDiag) return false;
      if (diagramFilter === 'NO' && hasDiag) return false;
    }
    return true;
  }).sort(sortQuestions);

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Question Manager" 
        description="Search across subjects, course codes, modules, and topics. Apply advanced filters, manage individual question details, or use bulk actions."
      />

      {/* Filter and search bar */}
      <GlassCard className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search question text, module, topic, course code..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] text-gray-900 dark:text-gray-100 midnight:text-white placeholder-gray-400 dark:placeholder-gray-500 midnight:placeholder-gray-500 border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <GlassButton variant="secondary" onClick={fetchQuestions} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </GlassButton>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {/* Subject Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subject</label>
            <select 
              value={subjectFilter} 
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Type</label>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="DESCRIPTIVE">Descriptive</option>
              <option value="MCQ">MCQ</option>
              <option value="TRUE_FALSE">True / False</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Diagram Presence Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Diagram</label>
            <select 
              value={diagramFilter} 
              onChange={(e) => setDiagramFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All Questions</option>
              <option value="YES">Has Diagram</option>
              <option value="NO">No Diagram</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Year</label>
            <select 
              value={yearFilter} 
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All Years</option>
              {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Bulk actions floating bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-4 shadow-xl border border-slate-800 animate-slide-up">
          <span className="text-xs font-semibold">{selectedIds.length} questions selected</span>
          <div className="w-[1px] h-4 bg-slate-700" />
          
          <div className="flex gap-2 text-xs">
            <button 
              onClick={() => executeBulkAction('publish')}
              className="flex items-center gap-1 hover:text-blue-400 font-semibold px-2 py-1"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Publish
            </button>
            
            <button 
              onClick={() => setBulkActionType('module')}
              className="flex items-center gap-1 hover:text-indigo-400 font-semibold px-2 py-1"
            >
              <FolderPlus className="w-3.5 h-3.5" /> Assign Module
            </button>

            <button 
              onClick={() => setBulkActionType('topic')}
              className="flex items-center gap-1 hover:text-amber-400 font-semibold px-2 py-1"
            >
              <Tag className="w-3.5 h-3.5" /> Assign Topic
            </button>

            <button 
              onClick={() => setBulkActionType('subject')}
              className="flex items-center gap-1 hover:text-emerald-400 font-semibold px-2 py-1"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Move Subject
            </button>

            <button 
              onClick={() => executeBulkAction('delete')}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold px-2 py-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
          <button onClick={() => setSelectedIds([])} className="hover:bg-slate-800 p-1 rounded-full text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk inputs dialog overlay */}
      {bulkActionType && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 midnight:bg-slate-950 border dark:border-slate-800 midnight:border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white midnight:text-white capitalize">
              Assign {bulkActionType === 'subject' ? 'New Subject Code' : bulkActionType}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-300">
              Apply this change to all {selectedIds.length} selected questions.
            </p>
            <input 
              type="text" 
              placeholder={bulkActionType === 'subject' ? 'e.g. CSE1001' : `Enter ${bulkActionType} name`}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 uppercase"
              value={bulkActionValue}
              onChange={(e) => setBulkActionValue(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" size="sm" onClick={() => { setBulkActionType(null); setBulkActionValue(''); }}>
                Cancel
              </GlassButton>
              <GlassButton 
                variant="primary" 
                size="sm" 
                disabled={!bulkActionValue.trim() || isPerformingBulk}
                onClick={() => {
                  const actionMap = {
                    module: 'assign_module',
                    topic: 'assign_topic',
                    subject: 'move_subject'
                  };
                  executeBulkAction(actionMap[bulkActionType!], bulkActionValue.trim());
                }}
              >
                {isPerformingBulk ? 'Applying...' : 'Apply Action'}
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Sorting Controls */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 midnight:text-gray-300">
          Showing {filteredQuestions.length} of {questions.length} questions
        </span>
        <div className="flex gap-4 items-center text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-300">
          <span className="font-medium">Sort by:</span>
          <button 
            className={`font-semibold ${sortBy === 'created' ? 'text-blue-500' : ''}`}
            onClick={() => { if (sortBy === 'created') { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); } else { setSortBy('created'); setSortOrder('desc'); } }}
          >
            Date Added {sortBy === 'created' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`font-semibold ${sortBy === 'marks' ? 'text-blue-500' : ''}`}
            onClick={() => { if (sortBy === 'marks') { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); } else { setSortBy('marks'); setSortOrder('desc'); } }}
          >
            Marks {sortBy === 'marks' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`font-semibold ${sortBy === 'qnumber' ? 'text-blue-500' : ''}`}
            onClick={() => { if (sortBy === 'qnumber') { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); } else { setSortBy('qnumber'); setSortOrder('asc'); } }}
          >
            Q. Number {sortBy === 'qnumber' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Questions Table/Cards */}
      {loading ? (
        <div className="text-center py-20">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-300">Loading questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-800 midnight:border-white/10 rounded-2xl">
          <LayoutGrid className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-250 midnight:text-gray-100">No questions found</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-300 mt-1">Adjust search query or filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header Checkbox */}
          <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50/50 dark:bg-slate-900/50 midnight:bg-slate-950/40 rounded-xl border border-gray-150 dark:border-slate-800/80 midnight:border-white/10">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
              checked={selectedIds.length > 0 && selectedIds.length === filteredQuestions.length}
              onChange={handleSelectAll}
            />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 midnight:text-gray-300">Select All Filtered</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredQuestions.map(q => (
              <GlassCard key={q.question_id} className="relative overflow-hidden group border border-gray-100 dark:border-gray-800" hover>
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input 
                    type="checkbox" 
                    className="mt-1.5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer shrink-0"
                    checked={selectedIds.includes(q.question_id)}
                    onChange={() => handleSelectOne(q.question_id)}
                  />

                  {/* Question Details */}
                  <div className="flex-1 space-y-3">
                    {editingQId === q.question_id ? (
                      /* Inline Editor Form */
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Question Text</label>
                          <textarea 
                            rows={3}
                            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" 
                            value={editForm.question_text} 
                            onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })} 
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Marks</label>
                            <input 
                              type="number"
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" 
                              value={editForm.marks} 
                              onChange={(e) => setEditForm({ ...editForm, marks: parseInt(e.target.value) || 0 })} 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Topic</label>
                            <input 
                              type="text"
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" 
                              value={editForm.topic_name} 
                              onChange={(e) => setEditForm({ ...editForm, topic_name: e.target.value })} 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Module</label>
                            <input 
                              type="text"
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" 
                              value={editForm.module} 
                              onChange={(e) => setEditForm({ ...editForm, module: e.target.value })} 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Question Type</label>
                            <select 
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" 
                              value={editForm.question_type} 
                              onChange={(e) => setEditForm({ ...editForm, question_type: e.target.value })}
                            >
                              <option value="DESCRIPTIVE">Descriptive</option>
                              <option value="MCQ">MCQ</option>
                              <option value="TRUE_FALSE">True / False</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <GlassButton size="sm" onClick={() => handleSaveInline(q.question_id)}><Check className="w-3.5 h-3.5 inline mr-1" />Save</GlassButton>
                          <GlassButton variant="ghost" size="sm" onClick={() => setEditingQId(null)}><X className="w-3.5 h-3.5 inline mr-1" />Cancel</GlassButton>
                        </div>
                      </div>
                    ) : (
                      /* Display View */
                      <>
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1.5">
                            {/* Question number, subject, type, marks tags */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                Q{q.question_number}
                              </span>
                              <span className="text-gray-400 dark:text-gray-400 midnight:text-gray-300 text-xs font-semibold">
                                {q.course_code}
                              </span>
                              <span className="text-gray-300 dark:text-gray-800">&bull;</span>
                              <span className="text-gray-500 dark:text-gray-400 midnight:text-gray-300 text-[10px] font-semibold tracking-wider uppercase">
                                {q.question_type}
                              </span>
                              <span className="text-gray-300 dark:text-gray-800">&bull;</span>
                              <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/30">
                                {q.marks} Marks
                              </span>
                              <span className="text-gray-300 dark:text-gray-800">&bull;</span>
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                                q.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {q.status}
                              </span>
                            </div>
                            
                            <p className="text-gray-800 dark:text-gray-100 midnight:text-white text-sm font-medium leading-relaxed">
                              {q.question_text}
                            </p>
                          </div>

                          {/* Quick Action Edit Panel */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <GlassButton variant="secondary" size="sm" onClick={() => startEditing(q)}>
                              Edit
                            </GlassButton>
                          </div>
                        </div>

                        {/* Metadata fields like Module, Topic */}
                        {(q.topic_name || q.metadata?.module || q.has_diagram || (q.image_urls && q.image_urls.length > 0)) && (
                          <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 dark:border-slate-800/80 midnight:border-white/10 text-[11px] text-gray-500 dark:text-gray-400 midnight:text-gray-300">
                            {q.metadata?.module && (
                              <span>
                                <strong className="text-gray-400 dark:text-gray-400 midnight:text-gray-300 uppercase tracking-wider font-semibold mr-1">Module:</strong> 
                                <span className="text-gray-700 dark:text-gray-300 midnight:text-gray-200">{q.metadata.module}</span>
                              </span>
                            )}
                            {q.topic_name && (
                              <span>
                                <strong className="text-gray-400 dark:text-gray-400 midnight:text-gray-300 uppercase tracking-wider font-semibold mr-1">Topic:</strong> 
                                <span className="text-gray-700 dark:text-gray-300 midnight:text-gray-200">{q.topic_name}</span>
                              </span>
                            )}
                            {(q.has_diagram || (q.image_urls && q.image_urls.length > 0)) && (
                              <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                                <Image className="w-3.5 h-3.5" /> Diagram Attached ({q.image_urls?.length || 1})
                              </span>
                            )}
                            {q.paper_title && (
                              <span className="text-gray-400 italic">
                                From: {q.paper_title} ({q.exam_semester} {q.exam_year})
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
