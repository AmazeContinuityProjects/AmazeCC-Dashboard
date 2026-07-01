'use client';
import React, { useState, useEffect } from 'react';
import { 
 MessageSquare, Bus, ShieldCheck, Users, Bell,
 FileText, LayoutGrid, Cpu, Clock, CheckCircle, AlertTriangle, 
 Database, RefreshCw, BarChart3, TrendingUp, Archive, BookOpen, 
 HelpCircle, ArrowUpRight, Plus, ListFilter, Server
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import { GlassCard, SectionHeader, LoadingSpinner, StatusBadge, GlassButton } from '@/components/custom/admin/AdminUI';
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
 const interval = setInterval(fetchStats, 30000); // refresh every 30s
 return () => clearInterval(interval);
 }, []);

 if (!stats && !error) {
 return (
  <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
  <LoadingSpinner />
  <p className="mt-3 text-sm text-muted-foreground">Loading system metrics...</p>
  </div>
 );
 }

  if (error && !stats) {
  return (
  <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] px-4">
  <GlassCard innerGlow className="max-w-md w-full border-destructive/20 p-6 text-center bg-destructive/5">
  <div className="w-12 h-12 mx-auto mb-4 bg-destructive/10 rounded-sm flex items-center justify-center">
  <AlertTriangle className="w-6 h-6 text-destructive" />
  </div>
  <h3 className="text-lg font-black text-foreground tracking-tight">Failed to Load Dashboard Overview</h3>
  <p className="text-sm font-medium text-muted-foreground mt-1 mb-6 leading-relaxed">{error}</p>
  <GlassButton onClick={fetchStats} variant="primary">
  <RefreshCw className="w-4 h-4 inline mr-2" /> Retry Connection
  </GlassButton>
  </GlassCard>
  </div>
  );
  }

 const s = stats || {} as any;
 const papers = s.papers || { total: 0, approved: 0, pending: 0, pendingReview: 0, failedOcr: 0, pendingOcr: 0, rejected: 0, archived: 0, courses: 0 };
 const questions = s.questions || { total: 0, published: 0, draft: 0, rejected: 0 };
 const storage = s.storage || { totalSize: 0, r2Count: 0, supabaseCount: 0, diagramCount: 0 };
 const analytics = s.analytics || { weeklyQuestions: [], monthlyPapers: [], topSubjects: [], ocrSuccessRate: 100 };

 // Format bytes to human readable format
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

 // Safe variables for SVG charts
 const weeklyQuestions = analytics.weeklyQuestions || [];
 const monthlyPapers = analytics.monthlyPapers || [];
 const topSubjects = analytics.topSubjects || [];
 
 const maxWeeklyCount = Math.max(...weeklyQuestions.map((w: any) => w?.count || 0), 1);
 const maxMonthlyCount = Math.max(...monthlyPapers.map((m: any) => m?.count || 0), 1);
 const maxSubjectCount = Math.max(...topSubjects.map((t: any) => t?.count || 0), 1);

 return (
 <div className="space-y-10 animate-fade-in">
 <SectionHeader 
 title="Admin Overview" 
 description="Monitor system metrics, queue pipelines, question bank volume, and storage utilization." 
 breadcrumbs={[{ label: 'Admin', href: '#' }, { label: 'Dashboard', active: true }]}
 action={
 <button 
 onClick={() => fetchStats()} 
 className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
 >
 <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
 </button>
 }
 />

  {/* Main Stats Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Total Papers */}
  <div onClick={() => setActiveTab('papers')} className="cursor-pointer">
  <GlassCard hover innerGlow className="h-full relative overflow-hidden group">
  <div className="flex justify-between items-start mb-3">
  <div className="p-2.5 bg-accent/10 rounded-sm text-accent group-hover:scale-110 transition-transform duration-300">
  <FileText className="w-5 h-5" />
  </div>
  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
  <div>
  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Papers</p>
  <h3 className="text-3xl font-black font-display text-foreground mt-0.5 tabular-nums">{papers.total || 0}</h3>
  </div>
  <div className="mt-4 pt-3 border-t border-border/50 flex gap-3 items-center text-[10px] font-bold uppercase tracking-widest">
  <span className="text-[var(--semantic-success)]">{papers.approved || 0} Published</span>
  <span className="text-border">|</span>
  <span className="text-muted-foreground">{papers.courses || 0} Courses</span>
  </div>
  </GlassCard>
  </div>

  {/* Total Questions */}
  <div onClick={() => setActiveTab('questions')} className="cursor-pointer">
  <GlassCard hover innerGlow className="h-full relative overflow-hidden group">
  <div className="flex justify-between items-start mb-3">
  <div className="p-2.5 bg-accent/10 rounded-sm text-accent group-hover:scale-110 transition-transform duration-300">
  <LayoutGrid className="w-5 h-5" />
  </div>
  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
  <div>
  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Questions</p>
  <h3 className="text-3xl font-black font-display text-foreground mt-0.5 tabular-nums">{questions.total || 0}</h3>
  </div>
  <div className="mt-4 pt-3 border-t border-border/50 flex gap-3 items-center text-[10px] font-bold uppercase tracking-widest">
  <span className="text-accent">{questions.published || 0} Published</span>
  <span className="text-border">|</span>
  <span className="text-muted-foreground">{questions.draft || 0} Draft</span>
  </div>
  </GlassCard>
  </div>

  {/* Pending Review */}
  <div onClick={() => { setActiveTab('qbank'); setActiveSubTab('queue'); }} className="cursor-pointer">
  <GlassCard hover innerGlow className="h-full relative overflow-hidden group">
  <div className="flex justify-between items-start mb-3">
  <div className="p-2.5 bg-accent/10 rounded-sm text-accent group-hover:scale-110 transition-transform duration-300">
  <Clock className="w-5 h-5" />
  </div>
  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
  <div>
  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending Review</p>
  <h3 className="text-3xl font-black font-display text-accent mt-0.5 tabular-nums">{papers.pendingReview || 0}</h3>
  </div>
  <div className="mt-4 pt-3 border-t border-border/50 flex gap-3 items-center text-[10px] font-bold uppercase tracking-widest">
  <span className="text-accent">{papers.pendingOcr || 0} Processing</span>
  <span className="text-border">|</span>
  <span className="text-destructive">{papers.failedOcr || 0} Fails</span>
  </div>
  </GlassCard>
  </div>

  {/* Storage Used */}
  <div onClick={() => setActiveTab('storage')} className="cursor-pointer">
  <GlassCard hover innerGlow className="h-full relative overflow-hidden group">
  <div className="flex justify-between items-start mb-3">
  <div className="p-2.5 bg-accent/10 rounded-sm text-accent group-hover:scale-110 transition-transform duration-300">
  <Database className="w-5 h-5" />
  </div>
  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
  <div>
  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Storage Used</p>
  <h3 className="text-3xl font-black font-display text-foreground mt-0.5 tabular-nums">
  {formatBytes(storage?.totalSize || 0)}
  </h3>
  </div>
  <div className="mt-4 pt-3 border-t border-border/50 flex gap-3 items-center text-[10px] font-bold uppercase tracking-widest">
  <span className="text-[var(--semantic-success)]">{storage?.r2Count || 0} Files</span>
  <span className="text-border">|</span>
  <span className="text-muted-foreground">{storage?.diagramCount || 0} Assets</span>
  </div>
  </GlassCard>
  </div>
  </div>

  {/* Quick Action Dashboard Buttons */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <button 
  onClick={() => setIsUploadModalOpen(true)}
  className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-sm bg-card/80 border border-border/50 hover:bg-accent hover:text-accent-foreground text-foreground transition-all duration-200 group shadow-small"
  >
  <div className="p-2.5 bg-accent/10 rounded-sm group-hover:bg-white/20 transition-colors">
  <Plus className="w-5 h-5 text-accent group-hover:text-accent-foreground" />
  </div>
  <span className="text-[10px] font-bold uppercase tracking-widest">Upload Paper</span>
  </button>
  
  <button 
  onClick={() => { setActiveTab('qbank'); setActiveSubTab('queue'); }}
  className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-sm bg-card/80 border border-border/50 hover:bg-accent hover:text-accent-foreground text-foreground transition-all duration-200 group shadow-small"
  >
  <div className="p-2.5 bg-accent/10 rounded-sm group-hover:bg-white/20 transition-colors">
  <Cpu className="w-5 h-5 text-accent group-hover:text-accent-foreground" />
  </div>
  <span className="text-[10px] font-bold uppercase tracking-widest">OCR Queue</span>
  </button>

  <button 
  onClick={() => setActiveTab('questions')}
  className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-sm bg-card/80 border border-border/50 hover:bg-accent hover:text-accent-foreground text-foreground transition-all duration-200 group shadow-small"
  >
  <div className="p-2.5 bg-accent/10 rounded-sm group-hover:bg-white/20 transition-colors">
  <ListFilter className="w-5 h-5 text-accent group-hover:text-accent-foreground" />
  </div>
  <span className="text-[10px] font-bold uppercase tracking-widest">Questions</span>
  </button>

  <button 
  onClick={() => setActiveTab('storage')}
  className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-sm bg-card/80 border border-border/50 hover:bg-accent hover:text-accent-foreground text-foreground transition-all duration-200 group shadow-small"
  >
  <div className="p-2.5 bg-accent/10 rounded-sm group-hover:bg-white/20 transition-colors">
  <Database className="w-5 h-5 text-accent group-hover:text-accent-foreground" />
  </div>
  <span className="text-[10px] font-bold uppercase tracking-widest">Storage</span>
  </button>
  </div>

  {/* Analytics Charts */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Questions Added Per Week */}
  <GlassCard className="col-span-1 lg:col-span-2 flex flex-col">
  <div className="flex justify-between items-center mb-6">
  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
  <TrendingUp className="w-3.5 h-3.5 text-accent" /> Extraction Velocity
  </h4>
  <StatusBadge status="success" className="opacity-80" />
  </div>
  
  {weeklyQuestions.length > 0 ? (
  <div className="w-full flex-1 flex flex-col justify-end">
  <div className="relative h-52 w-full bg-muted/50 rounded-sm p-4 flex items-end overflow-hidden border border-border/50">
  <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
  <line x1="0" y1="25" x2="400" y2="25" stroke="currentColor" className="text-border" strokeWidth="1" strokeDasharray="4" />
  <line x1="0" y1="75" x2="400" y2="75" stroke="currentColor" className="text-border" strokeWidth="1" strokeDasharray="4" />
  <line x1="0" y1="125" x2="400" y2="125" stroke="currentColor" className="text-border" strokeWidth="1" strokeDasharray="4" />
  
  <path
  d={`${weeklyQuestions.map((w: any, idx: number) => {
  const x = (idx / Math.max(weeklyQuestions.length - 1, 1)) * 400;
  const y = 140 - ((w?.count || 0) / maxWeeklyCount) * 110;
  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ')} L 400 150 L 0 150 Z`}
  className="fill-accent/10"
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
  stroke="var(--accent-color)"
  strokeWidth="4"
  strokeLinecap="round"
  strokeLinejoin="round"
  />
  
  {weeklyQuestions.map((w: any, idx: number) => {
  const x = (idx / Math.max(weeklyQuestions.length - 1, 1)) * 400;
  const y = 140 - ((w?.count || 0) / maxWeeklyCount) * 110;
  return (
  <circle key={idx} cx={x} cy={y} r="5" fill="var(--accent-color)" stroke="var(--background)" strokeWidth="2" />
  );
  })}
  </svg>
  </div>
  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3 px-2">
  {weeklyQuestions.map((w: any, idx: number) => (
  <span key={idx}>{w?.week?.slice(5) || ''}</span>
  ))}
  </div>
  </div>
  ) : (
  <p className="text-sm text-muted-foreground italic text-center py-16">No extraction history available.</p>
  )}
  </GlassCard>

  {/* OCR Success Rate */}
  <GlassCard className="col-span-1 flex flex-col items-center justify-center text-center">
  <h4 className="text-xs font-bold text-foreground self-start mb-6 uppercase tracking-widest">OCR Quality</h4>
  <div className="relative w-40 h-40 flex items-center justify-center">
  <svg className="w-full h-full transform -rotate-90">
  <circle cx="80" cy="80" r="66" stroke="currentColor" className="text-muted" strokeWidth="14" fill="transparent" />
  <motion.circle
  initial={{ strokeDashoffset: 2 * Math.PI * 66 }}
  animate={{ strokeDashoffset: 2 * Math.PI * 66 * (1 - (analytics.ocrSuccessRate || 0) / 100) }}
  transition={{ duration: 1.5, ease: "easeOut" }}
  cx="80" cy="80" r="66"
  stroke="var(--accent-color)" strokeWidth="14"
  fill="transparent"
  strokeDasharray={2 * Math.PI * 66}
  strokeLinecap="round"
  />
  </svg>
  <div className="absolute flex flex-col items-center">
  <span className="text-4xl font-black text-foreground tabular-nums">{analytics.ocrSuccessRate || 0}%</span>
  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Accuracy</span>
  </div>
  </div>
  <p className="text-xs font-medium text-muted-foreground mt-6 max-w-[200px] leading-relaxed">
  Computed by comparing approved papers against OCR processing failures.
  </p>
  </GlassCard>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Top Subjects by Question Count */}
  <GlassCard>
  <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-widest">Top Subjects by Question Count</h4>
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
  <div className="w-full bg-muted rounded-full h-1.5">
  <div className="bg-accent h-1.5 rounded-full" style={{ width: `${widthPercent}%` }} />
  </div>
  </div>
  );
  })}
  </div>
  ) : (
  <p className="text-sm text-muted-foreground italic text-center py-8">No question data available.</p>
  )}
  </GlassCard>

  {/* Papers Uploaded per Month */}
  <GlassCard>
  <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-widest">Papers Uploaded per Month</h4>
  {monthlyPapers.length > 0 ? (
  <div className="h-36 flex items-end justify-around gap-1.5 px-1">
  {monthlyPapers.map((mon: any, idx: number) => {
  const heightPercent = ((mon?.count || 0) / maxMonthlyCount) * 85;
  return (
  <div key={idx} className="flex flex-col items-center flex-1 group">
  <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mb-0.5 font-semibold">
  {mon?.count || 0}
  </div>
  <div className="w-full bg-accent/70 hover:bg-accent rounded-t-sm transition-all" style={{ height: `${Math.max(heightPercent, 4)}%` }} />
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
  </GlassCard>
  </div>

  {/* System Info */}
  <GlassCard>
  <h3 className="text-sm font-semibold text-foreground mb-3">System Info</h3>
  <div className="grid grid-cols-2 gap-4 text-sm">
  <div>
  <p className="text-muted-foreground">API Endpoint</p>
  <p className="font-mono text-foreground">api.amazecc.com</p>
  </div>
  <div>
  <p className="text-muted-foreground">Environment</p>
  <p className="font-mono text-foreground">Production</p>
  </div>
  </div>
  </GlassCard>

  {/* Database Status & Migration */}
  <DatabaseSection />

 <UploadPaperModal 
 isOpen={isUploadModalOpen} 
 onClose={() => {
 setIsUploadModalOpen(false);
 fetchStats(); // update stats after upload
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
 <GlassCard>
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 bg-accent/10 rounded-sm text-accent">
 <Database className="w-4 h-4" />
 </div>
 <h3 className="text-sm font-semibold text-foreground">Database</h3>
 </div>
 <div className="flex gap-1.5">
 <GlassButton variant="ghost" size="sm" onClick={checkDb} disabled={loading}>
 <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
 </GlassButton>
 <GlassButton variant="primary" size="sm" onClick={runMigration} disabled={migrating}>
 <Server className="w-3.5 h-3.5 inline mr-1" />
 {migrating ? 'Migrating...' : 'Run Migration'}
 </GlassButton>
 </div>
 </div>
 {msg && (
 <p className="text-sm mb-2 text-foreground">{msg}</p>
 )}
 {dbStatus === null && loading ? (
 <div className="flex justify-center py-3"><LoadingSpinner size="sm" /></div>
 ) : dbStatus?.connected ? (
 <div className="space-y-2 text-sm">
 <div className="flex items-center gap-2">
 <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-[var(--semantic-success)]' : 'bg-destructive'}`} />
 <span className="text-muted-foreground">Connected</span>
 {dbStatus.db && <span className="font-mono text-muted-foreground">({dbStatus.db})</span>}
 <span className="text-muted-foreground ml-auto">{dbStatus.serverTime ? new Date(dbStatus.serverTime).toLocaleString() : ''}</span>
 </div>
 {dbStatus.tables && (
 <div>
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tables ({dbStatus.tables.length})</p>
 <div className="flex flex-wrap gap-1.5">
 {dbStatus.tables.map((t: string) => (
 <span key={t} className="px-2 py-0.5 text-[10px] font-medium rounded-sm bg-muted text-muted-foreground">{t}</span>
 ))}
 </div>
 </div>
 )}
 </div>
 ) : (
 <p className="text-sm text-destructive">{dbStatus?.error || 'Could not connect to database'}</p>
 )}
 </GlassCard>
 );
}