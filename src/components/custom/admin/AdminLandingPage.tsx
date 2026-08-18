'use client';
import React, { useState, useEffect } from 'react';
import { 
  FileText, LayoutGrid, Cpu, Clock, AlertTriangle, 
  Database, RefreshCw, TrendingUp, ListFilter, Server, Plus, ArrowUpRight
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  Card, 
  Button, 
  SectionHeader, 
  LoadingSpinner, 
  StatusBadge, 
  Badge, 
  Alert 
} from '@/components/custom/admin/AdminUI';
import UploadPaperModal from '@/components/custom/qbank/UploadPaperModal';

interface StatsData {
  papers: {
    total: number;
    approved: number;
    pending: number;
    pendingReview: number;
    failedOcr: number;
    pendingOcr: number;
    rejected: number;
    archived: number;
    courses: number;
  };
  questions: {
    total: number;
    published: number;
    draft: number;
    rejected: number;
  };
  busRoutes: number;
  activeUsers: number;
  vitolSubscribers: number;
  storage: {
    totalSize: number;
    r2Count: number;
    supabaseCount: number;
    diagramCount: number;
  };
  analytics: {
    weeklyQuestions: Array<{ week: string; count: number }>;
    monthlyPapers: Array<{ month: string; count: number }>;
    topSubjects: Array<{ subject: string; count: number }>;
    ocrSuccessRate: number;
  };
}

interface AdminLandingPageProps {
  setActiveTab: (tab: string) => void;
  setActiveSubTab: (tab: string) => void;
}

export default function AdminLandingPage({ setActiveTab, setActiveSubTab }: AdminLandingPageProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      } else {
        setError(json.error || 'Failed to load statistics');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-sm text-muted-foreground">Loading system metrics...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] px-4">
        <Card className="max-w-md w-full border-destructive/20 p-6 text-center bg-destructive/5 space-y-4">
          <div className="w-12 h-12 mx-auto bg-destructive/10 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground tracking-tight">Failed to Load Dashboard Overview</h3>
            <p className="text-sm font-medium text-muted-foreground mt-1 leading-relaxed">{error}</p>
          </div>
          <Button onClick={fetchStats} variant="primary" className="w-full flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  const s = stats || ({} as any);
  const papers = s.papers || { total: 0, approved: 0, pending: 0, pendingReview: 0, failedOcr: 0, pendingOcr: 0, rejected: 0, archived: 0, courses: 0 };
  const questions = s.questions || { total: 0, published: 0, draft: 0, rejected: 0 };
  const storage = s.storage || { totalSize: 0, r2Count: 0, supabaseCount: 0, diagramCount: 0 };
  const analytics = s.analytics || { weeklyQuestions: [], monthlyPapers: [], topSubjects: [], ocrSuccessRate: 100 };

  const formatBytes = (bytes: any, decimals = 2) => {
    const num = Number(bytes);
    if (isNaN(num) || num <= 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    if (i < 0) return '0 Bytes';
    return parseFloat((num / Math.pow(k, i)).toFixed(dm)) + ' ' + (sizes[i] || 'Bytes');
  };

  const weeklyQuestions = analytics.weeklyQuestions || [];
  const monthlyPapers = analytics.monthlyPapers || [];
  const topSubjects = analytics.topSubjects || [];
  
  const maxWeeklyCount = Math.max(...weeklyQuestions.map((w: any) => w?.count || 0), 1);
  const maxMonthlyCount = Math.max(...monthlyPapers.map((m: any) => m?.count || 0), 1);
  const maxSubjectCount = Math.max(...topSubjects.map((t: any) => t?.count || 0), 1);

  return (
    <div className="space-y-8 animate-fadeIn">
      <SectionHeader 
        title="Admin Overview" 
        description="Monitor system metrics, queue pipelines, question bank volume, and storage utilization." 
        breadcrumbs={[{ label: 'Admin', href: '#' }, { label: 'Dashboard', active: true }]}
        action={
          <Button 
            variant="outline"
            size="sm"
            onClick={() => fetchStats()} 
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        }
      />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Papers */}
        <div onClick={() => setActiveTab('papers')} className="cursor-pointer">
          <Card hover className="h-full relative overflow-hidden group p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Papers</p>
              <h3 className="text-3xl font-black font-display text-foreground mt-0.5 tabular-nums">{papers.total || 0}</h3>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex gap-3 items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-emerald-600 dark:text-emerald-400">{papers.approved || 0} Published</span>
              <span className="text-border">|</span>
              <span className="text-muted-foreground">{papers.courses || 0} Courses</span>
            </div>
          </Card>
        </div>

        {/* Total Questions */}
        <div onClick={() => setActiveTab('questions')} className="cursor-pointer">
          <Card hover className="h-full relative overflow-hidden group p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Questions</p>
              <h3 className="text-3xl font-black font-display text-foreground mt-0.5 tabular-nums">{questions.total || 0}</h3>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex gap-3 items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-primary">{questions.published || 0} Published</span>
              <span className="text-border">|</span>
              <span className="text-muted-foreground">{questions.draft || 0} Draft</span>
            </div>
          </Card>
        </div>

        {/* Pending Review */}
        <div onClick={() => { setActiveTab('qbank'); setActiveSubTab('queue'); }} className="cursor-pointer">
          <Card hover className="h-full relative overflow-hidden group p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Review</p>
              <h3 className="text-3xl font-black font-display text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">{papers.pendingReview || 0}</h3>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex gap-3 items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-primary">{papers.pendingOcr || 0} Processing</span>
              <span className="text-border">|</span>
              <span className="text-destructive">{papers.failedOcr || 0} Fails</span>
            </div>
          </Card>
        </div>

        {/* Storage Used */}
        <div onClick={() => setActiveTab('storage')} className="cursor-pointer">
          <Card hover className="h-full relative overflow-hidden group p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <Database className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Storage Used</p>
              <h3 className="text-3xl font-black font-display text-foreground mt-0.5 tabular-nums">
                {formatBytes(storage?.totalSize || 0)}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex gap-3 items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-emerald-600 dark:text-emerald-400">{storage?.r2Count || 0} Files</span>
              <span className="text-border">|</span>
              <span className="text-muted-foreground">{storage?.diagramCount || 0} Assets</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Action Dashboard Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button 
          variant="outline"
          onClick={() => setIsUploadModalOpen(true)}
          className="h-auto flex flex-col items-center justify-center gap-2 p-4 rounded-2xl group border-border/50 hover:border-primary/40"
        >
          <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">Upload Paper</span>
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => { setActiveTab('qbank'); setActiveSubTab('queue'); }}
          className="h-auto flex flex-col items-center justify-center gap-2 p-4 rounded-2xl group border-border/50 hover:border-primary/40"
        >
          <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">OCR Queue</span>
        </Button>

        <Button 
          variant="outline"
          onClick={() => setActiveTab('questions')}
          className="h-auto flex flex-col items-center justify-center gap-2 p-4 rounded-2xl group border-border/50 hover:border-primary/40"
        >
          <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
            <ListFilter className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">Questions</span>
        </Button>

        <Button 
          variant="outline"
          onClick={() => setActiveTab('storage')}
          className="h-auto flex flex-col items-center justify-center gap-2 p-4 rounded-2xl group border-border/50 hover:border-primary/40"
        >
          <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">Storage</span>
        </Button>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions Added Per Week */}
        <Card className="col-span-1 lg:col-span-2 flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Extraction Velocity
            </h4>
            <StatusBadge status="success" />
          </div>
          
          {weeklyQuestions.length > 0 ? (
            <div className="w-full flex-1 flex flex-col justify-end">
              <div className="relative h-52 w-full bg-muted/40 rounded-2xl p-4 flex items-end overflow-hidden border border-border/50">
                <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                  <line x1="0" y1="25" x2="400" y2="25" stroke="currentColor" className="text-border/50" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="75" x2="400" y2="75" stroke="currentColor" className="text-border/50" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="125" x2="400" y2="125" stroke="currentColor" className="text-border/50" strokeWidth="1" strokeDasharray="4" />
                  
                  <path
                    d={`${weeklyQuestions.map((w: any, idx: number) => {
                      const x = (idx / Math.max(weeklyQuestions.length - 1, 1)) * 400;
                      const y = 140 - ((w?.count || 0) / maxWeeklyCount) * 110;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')} L 400 150 L 0 150 Z`}
                    className="fill-primary/10"
                  />
                  
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    d={weeklyQuestions.map((w: any, idx: number) => {
                      const x = (idx / Math.max(weeklyQuestions.length - 1, 1)) * 400;
                      const y = 140 - ((w?.count || 0) / maxWeeklyCount) * 110;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="var(--accent-color, #3b82f6)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {weeklyQuestions.map((w: any, idx: number) => {
                    const x = (idx / Math.max(weeklyQuestions.length - 1, 1)) * 400;
                    const y = 140 - ((w?.count || 0) / maxWeeklyCount) * 110;
                    return (
                      <circle key={idx} cx={x} cy={y} r="4" fill="var(--accent-color, #3b82f6)" stroke="var(--background)" strokeWidth="2" />
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-3 px-2">
                {weeklyQuestions.map((w: any, idx: number) => (
                  <span key={idx}>{w?.week?.slice(5) || ''}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-16">No extraction history available.</p>
          )}
        </Card>

        {/* OCR Success Rate */}
        <Card className="col-span-1 flex flex-col items-center justify-center text-center p-6">
          <h4 className="text-xs font-bold text-foreground self-start mb-6 uppercase tracking-wider">OCR Quality</h4>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="66" stroke="currentColor" className="text-muted/40" strokeWidth="12" fill="transparent" />
              <motion.circle
                initial={{ strokeDashoffset: 2 * Math.PI * 66 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 66 * (1 - (analytics.ocrSuccessRate || 0) / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="80" cy="80" r="66"
                stroke="var(--accent-color, #3b82f6)" strokeWidth="12"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 66}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-foreground tabular-nums">{analytics.ocrSuccessRate || 0}%</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Accuracy</span>
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-6 max-w-[200px] leading-relaxed">
            Computed by comparing approved papers against OCR processing failures.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Subjects by Question Count */}
        <Card className="p-5">
          <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Top Subjects by Question Count</h4>
          {topSubjects.length > 0 ? (
            <div className="space-y-3">
              {topSubjects.map((sub: any, idx: number) => {
                const widthPercent = ((sub?.count || 0) / maxSubjectCount) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-foreground">
                      <span>{sub?.subject || 'Unknown'}</span>
                      <span className="text-muted-foreground">{sub?.count || 0} q</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${widthPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-8">No question data available.</p>
          )}
        </Card>

        {/* Papers Uploaded per Month */}
        <Card className="p-5">
          <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Papers Uploaded per Month</h4>
          {monthlyPapers.length > 0 ? (
            <div className="h-36 flex items-end justify-around gap-1.5 px-1">
              {monthlyPapers.map((mon: any, idx: number) => {
                const heightPercent = ((mon?.count || 0) / maxMonthlyCount) * 85;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mb-0.5 font-semibold">
                      {mon?.count || 0}
                    </div>
                    <div className="w-full bg-primary/70 hover:bg-primary rounded-t-sm transition-all" style={{ height: `${Math.max(heightPercent, 4)}%` }} />
                    <span className="text-[10px] text-muted-foreground mt-1.5 truncate max-w-full">
                      {mon?.month?.slice(5) || ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-8">No upload history available.</p>
          )}
        </Card>
      </div>

      {/* Database Status & Migration */}
      <DatabaseSection />

      <UploadPaperModal 
        isOpen={isUploadModalOpen} 
        onClose={() => {
          setIsUploadModalOpen(false);
          fetchStats();
        }} 
        courses={[]} 
        username="admin" 
        isAdmin={true} 
      />
    </div>
  );
}

function DatabaseSection() {
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; db?: string; tables?: string[]; serverTime?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [msg, setMsg] = useState('');

  const checkDb = async () => {
    setLoading(true); setMsg('');
    try {
      const res = await apiFetch('/api/admin/migrate');
      const data = await res.json();
      if (res.ok) setDbStatus(data);
      else setDbStatus({ connected: false, error: data.error || 'Failed to check' });
    } catch (e: any) {
      setDbStatus({ connected: false, error: e.message });
    } finally { setLoading(false); }
  };

  const runMigration = async () => {
    setMigrating(true); setMsg('');
    try {
      const res = await apiFetch('/api/admin/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.success) { setMsg('Migration completed: ' + data.message); await checkDb(); }
      else setMsg(data.error || 'Migration failed');
    } catch (e: any) {
      setMsg(e.message);
    } finally { setMigrating(false); }
  };

  useEffect(() => { checkDb(); }, []);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Database Connectivity & Schema</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={checkDb} disabled={loading} className="h-8">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="primary" size="sm" onClick={runMigration} disabled={migrating} className="flex items-center gap-1.5 h-8 text-xs">
            <Server className="w-3.5 h-3.5" />
            {migrating ? 'Migrating...' : 'Run Migration'}
          </Button>
        </div>
      </div>
      {msg && (
        <Alert variant={msg.includes('failed') ? 'error' : 'success'} className="mb-3">
          <span>{msg}</span>
        </Alert>
      )}
      {dbStatus === null && loading ? (
        <div className="flex justify-center py-3"><LoadingSpinner size="sm" /></div>
      ) : dbStatus?.connected ? (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500' : 'bg-destructive'}`} />
            <span className="text-muted-foreground font-medium">Connected to PostgreSQL</span>
            {dbStatus.db && <span className="font-mono text-muted-foreground">({dbStatus.db})</span>}
            <span className="text-muted-foreground ml-auto text-xs">{dbStatus.serverTime ? new Date(dbStatus.serverTime).toLocaleString('en-IN') : ''}</span>
          </div>
          {dbStatus.tables && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tables ({dbStatus.tables.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {dbStatus.tables.map((t: string) => (
                  <Badge key={t} variant="default" size="sm" className="font-mono text-[11px]">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-destructive">{dbStatus?.error || 'Could not connect to database'}</p>
      )}
    </Card>
  );
}