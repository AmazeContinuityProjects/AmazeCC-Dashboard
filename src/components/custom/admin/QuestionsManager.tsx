'use client';
import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, LayoutGrid, CheckCircle, Trash2,
  Check, X, FolderPlus, Tag, ArrowRightLeft, Image as ImageIcon, Pencil
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { 
  Card, 
  Button, 
  Input, 
  Textarea, 
  Select, 
  SectionHeader, 
  LoadingSpinner, 
  Badge, 
  EmptyState,
  Modal 
} from '@/components/custom/admin/AdminUI';

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

  // Bulk modal state
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

  const subjects = Array.from(new Set(questions.map(q => q.course_code))).filter(Boolean);
  const years = Array.from(new Set(questions.map(q => q.exam_year))).filter(Boolean);

  const sortQuestions = (a: Question, b: Question) => {
    const factor = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'marks') {
      return (a.marks - b.marks) * factor;
    }
    if (sortBy === 'qnumber') {
      return a.question_number.localeCompare(b.question_number) * factor;
    }
    return a.question_id.localeCompare(b.question_id) * factor;
  };

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
        title="Question Bank Directory" 
        description="Search across subjects, course codes, modules, and topics. Apply advanced filters, manage individual question details, or use bulk actions."
      />

      {/* Filter and search bar */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search question text, module, topic, course code..." 
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

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div>
            <Select 
              label="Subject"
              value={subjectFilter} 
              onChange={(e: any) => setSubjectFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Subjects' },
                ...subjects.map(s => ({ value: s, label: s }))
              ]}
            />
          </div>

          <div>
            <Select 
              label="Type"
              value={typeFilter} 
              onChange={(e: any) => setTypeFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Types' },
                { value: 'DESCRIPTIVE', label: 'Descriptive' },
                { value: 'MCQ', label: 'MCQ' },
                { value: 'TRUE_FALSE', label: 'True / False' }
              ]}
            />
          </div>

          <div>
            <Select 
              label="Status"
              value={statusFilter} 
              onChange={(e: any) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PUBLISHED', label: 'Published' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'REJECTED', label: 'Rejected' }
              ]}
            />
          </div>

          <div>
            <Select 
              label="Diagram"
              value={diagramFilter} 
              onChange={(e: any) => setDiagramFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Questions' },
                { value: 'YES', label: 'Has Diagram' },
                { value: 'NO', label: 'No Diagram' }
              ]}
            />
          </div>

          <div>
            <Select 
              label="Year"
              value={yearFilter} 
              onChange={(e: any) => setYearFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Years' },
                ...years.map(y => ({ value: String(y), label: String(y) }))
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-border animate-slideUp">
          <span className="text-xs font-semibold">{selectedIds.length} selected</span>
          <div className="w-[1px] h-4 bg-background/20" />
          
          <div className="flex gap-1 text-xs">
            <Button 
              size="sm"
              variant="ghost"
              onClick={() => executeBulkAction('publish')}
              className="text-emerald-400 hover:text-emerald-300 h-8"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Publish
            </Button>
            
            <Button 
              size="sm"
              variant="ghost"
              onClick={() => setBulkActionType('module')}
              className="text-primary hover:text-primary/80 h-8"
            >
              <FolderPlus className="w-3.5 h-3.5 mr-1" /> Module
            </Button>

            <Button 
              size="sm"
              variant="ghost"
              onClick={() => setBulkActionType('topic')}
              className="text-amber-400 hover:text-amber-300 h-8"
            >
              <Tag className="w-3.5 h-3.5 mr-1" /> Topic
            </Button>

            <Button 
              size="sm"
              variant="ghost"
              onClick={() => setBulkActionType('subject')}
              className="text-blue-400 hover:text-blue-300 h-8"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Move Subject
            </Button>

            <Button 
              size="sm"
              variant="ghost"
              onClick={() => executeBulkAction('delete')}
              className="text-destructive hover:text-destructive/80 h-8"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={() => setSelectedIds([])} className="h-7 w-7 text-background/60 hover:text-background">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Bulk Action Modal */}
      <Modal
        isOpen={bulkActionType !== null}
        onClose={() => { setBulkActionType(null); setBulkActionValue(''); }}
        title={`Assign ${bulkActionType === 'subject' ? 'New Subject Code' : bulkActionType}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Apply this change to all {selectedIds.length} selected questions.
          </p>
          <Input 
            placeholder={bulkActionType === 'subject' ? 'e.g. CSE1001' : `Enter ${bulkActionType} name`}
            className="uppercase"
            value={bulkActionValue}
            onChange={(e: any) => setBulkActionValue(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => { setBulkActionType(null); setBulkActionValue(''); }}>
              Cancel
            </Button>
            <Button 
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
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sorting Controls */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-semibold text-muted-foreground">
          Showing {filteredQuestions.length} of {questions.length} questions
        </span>
        <div className="flex gap-2 items-center text-xs text-muted-foreground">
          <span className="font-medium mr-1">Sort by:</span>
          <Button 
            variant={sortBy === 'created' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => { if (sortBy === 'created') { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); } else { setSortBy('created'); setSortOrder('desc'); } }}
          >
            Date Added {sortBy === 'created' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button 
            variant={sortBy === 'marks' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => { if (sortBy === 'marks') { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); } else { setSortBy('marks'); setSortOrder('desc'); } }}
          >
            Marks {sortBy === 'marks' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button 
            variant={sortBy === 'qnumber' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => { if (sortBy === 'qnumber') { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); } else { setSortBy('qnumber'); setSortOrder('asc'); } }}
          >
            Q. Number {sortBy === 'qnumber' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
        </div>
      </div>

      {/* Questions Table/Cards */}
      {loading ? (
        <div className="text-center py-20">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-muted-foreground">Loading questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card className="text-center py-20 p-6">
          <EmptyState
            icon={<LayoutGrid className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No questions found"
            description="Adjust your search query or filters to discover questions in the directory."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 px-4 py-2 bg-muted/40 rounded-xl border border-border/50">
            <input 
              type="checkbox" 
              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              checked={selectedIds.length > 0 && selectedIds.length === filteredQuestions.length}
              onChange={handleSelectAll}
            />
            <span className="text-xs font-semibold text-muted-foreground">Select All ({filteredQuestions.length})</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredQuestions.map(q => (
              <Card key={q.question_id} hover className="p-5 relative group">
                <div className="flex items-start gap-4">
                  <input 
                    type="checkbox" 
                    className="mt-1 rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer shrink-0"
                    checked={selectedIds.includes(q.question_id)}
                    onChange={() => handleSelectOne(q.question_id)}
                  />

                  <div className="flex-1 space-y-3">
                    {editingQId === q.question_id ? (
                      <div className="space-y-3 pt-1">
                        <Textarea 
                          label="Question Content"
                          rows={3}
                          value={editForm.question_text} 
                          onChange={(e: any) => setEditForm({ ...editForm, question_text: e.target.value })} 
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <Input 
                            label="Marks" 
                            type="number"
                            value={editForm.marks} 
                            onChange={(e: any) => setEditForm({ ...editForm, marks: parseInt(e.target.value) || 0 })} 
                          />
                          <Input 
                            label="Topic" 
                            value={editForm.topic_name} 
                            onChange={(e: any) => setEditForm({ ...editForm, topic_name: e.target.value })} 
                          />
                          <Input 
                            label="Module" 
                            value={editForm.module} 
                            onChange={(e: any) => setEditForm({ ...editForm, module: e.target.value })} 
                          />
                          <Select 
                            label="Question Type"
                            value={editForm.question_type} 
                            onChange={(e: any) => setEditForm({ ...editForm, question_type: e.target.value })}
                            options={[
                              { value: 'DESCRIPTIVE', label: 'Descriptive' },
                              { value: 'MCQ', label: 'MCQ' },
                              { value: 'TRUE_FALSE', label: 'True / False' }
                            ]}
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="primary" onClick={() => handleSaveInline(q.question_id)}>
                            <Check className="w-3.5 h-3.5 mr-1.5" /> Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingQId(null)}>
                            <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="default" size="sm" className="font-bold uppercase">
                                Q{q.question_number}
                              </Badge>
                              <span className="text-xs font-bold text-primary">
                                {q.course_code}
                              </span>
                              <span className="text-muted-foreground/60">&bull;</span>
                              <span className="text-xs text-muted-foreground font-semibold uppercase">
                                {q.question_type}
                              </span>
                              <span className="text-muted-foreground/60">&bull;</span>
                              <Badge variant="success" size="sm">
                                {q.marks} Marks
                              </Badge>
                              <span className="text-muted-foreground/60">&bull;</span>
                              <Badge variant={q.status === 'PUBLISHED' ? 'success' : 'default'} size="sm">
                                {q.status}
                              </Badge>
                            </div>
                            
                            <p className="text-foreground text-sm font-medium leading-relaxed pt-1">
                              {q.question_text}
                            </p>
                          </div>

                          <Button size="sm" variant="ghost" onClick={() => startEditing(q)} className="h-8">
                            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                          </Button>
                        </div>

                        {(q.topic_name || q.metadata?.module || q.has_diagram || (q.image_urls && q.image_urls.length > 0)) && (
                          <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/50 text-xs text-muted-foreground">
                            {q.metadata?.module && (
                              <span>
                                <strong className="text-muted-foreground font-semibold mr-1">Module:</strong> 
                                <span className="text-foreground font-medium">{q.metadata.module}</span>
                              </span>
                            )}
                            {q.topic_name && (
                              <span>
                                <strong className="text-muted-foreground font-semibold mr-1">Topic:</strong> 
                                <span className="text-foreground font-medium">{q.topic_name}</span>
                              </span>
                            )}
                            {(q.has_diagram || (q.image_urls && q.image_urls.length > 0)) && (
                              <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
                                <ImageIcon className="w-3.5 h-3.5" /> Diagram Attached ({q.image_urls?.length || 1})
                              </span>
                            )}
                            {q.paper_title && (
                              <span className="text-muted-foreground/80 italic">
                                From: {q.paper_title} ({q.exam_semester} {q.exam_year})
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
