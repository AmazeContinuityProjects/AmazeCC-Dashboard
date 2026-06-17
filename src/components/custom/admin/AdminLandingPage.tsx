'use client';
import React, { useState, useEffect } from 'react';
import { 
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
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-300">Loading system metrics...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] px-4">
        <GlassCard innerGlow className="max-w-md w-full border-red-500/10 dark:border-red-500/10 p-8 text-center bg-red-50/50 dark:bg-red-950/20 midnight:bg-red-950/10">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/40 rounded-3xl flex items-center justify-center shadow-inner shadow-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Failed to Load Dashboard Overview</h3>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 mb-8 leading-relaxed">
            {error}
          </p>
          <GlassButton onClick={fetchStats} variant="primary" className="w-full sm:w-auto">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Papers */}
        <div onClick={() => setActiveTab('papers')} className="cursor-pointer">
          <GlassCard hover innerGlow className="h-full relative overflow-hidden group border-blue-500/10 dark:border-blue-400/10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50/80 dark:bg-blue-900/20 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Papers</p>
              <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1 tabular-nums">{papers.total || 0}</h3>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex gap-4 items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-emerald-500">{papers.approved || 0} Published</span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="text-gray-500">{papers.courses || 0} Courses</span>
            </div>
          </GlassCard>
        </div>

        {/* Total Questions */}
        <div onClick={() => setActiveTab('questions')} className="cursor-pointer">
          <GlassCard hover innerGlow className="h-full relative overflow-hidden group border-purple-500/10 dark:border-purple-400/10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50/80 dark:bg-purple-900/20 rounded-2xl text-purple-500 group-hover:scale-110 transition-transform duration-300">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Questions</p>
              <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1 tabular-nums">{questions.total || 0}</h3>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex gap-4 items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-blue-500">{questions.published || 0} Published</span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="text-gray-500">{questions.draft || 0} Draft</span>
            </div>
          </GlassCard>
        </div>

        {/* Pending Review */}
        <div onClick={() => { setActiveTab('qbank'); setActiveSubTab('queue'); }} className="cursor-pointer">
          <GlassCard hover innerGlow className="h-full relative overflow-hidden group border-amber-500/10 dark:border-amber-400/10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50/80 dark:bg-amber-900/20 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pending Review</p>
              <h3 className="text-4xl font-extrabold text-amber-600 dark:text-amber-500 mt-1 tabular-nums">{papers.pendingReview || 0}</h3>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex gap-4 items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-blue-600 dark:text-blue-400">{papers.pendingOcr || 0} Processing</span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="text-red-500">{papers.failedOcr || 0} Fails</span>
            </div>
          </GlassCard>
        </div>

        {/* Storage Used */}
        <div onClick={() => setActiveTab('storage')} className="cursor-pointer">
          <GlassCard hover innerGlow className="h-full relative overflow-hidden group border-emerald-500/10 dark:border-emerald-400/10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform duration-300">
                <Database className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Storage Used</p>
              <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1 tabular-nums">
                {formatBytes(storage?.totalSize || 0)}
              </h3>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex gap-4 items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-emerald-500">{storage?.r2Count || 0} Files</span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="text-gray-500">{storage?.diagramCount || 0} Assets</span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Quick Action Dashboard Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-white/50 dark:bg-slate-900/40 border border-gray-200/50 dark:border-gray-800/50 hover:bg-blue-600 dark:hover:bg-blue-600 text-gray-900 dark:text-white hover:text-white transition-all duration-300 group shadow-lg shadow-gray-200/20 dark:shadow-none"
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl group-hover:bg-white/20 transition-colors">
            <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Upload Paper</span>
        </button>
        
        <button 
          onClick={() => { setActiveTab('qbank'); setActiveSubTab('queue'); }}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-white/50 dark:bg-slate-900/40 border border-gray-200/50 dark:border-gray-800/50 hover:bg-purple-600 dark:hover:bg-purple-600 text-gray-900 dark:text-white hover:text-white transition-all duration-300 group shadow-lg shadow-gray-200/20 dark:shadow-none"
        >
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl group-hover:bg-white/20 transition-colors">
            <Cpu className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">OCR Queue</span>
        </button>

        <button 
          onClick={() => setActiveTab('questions')}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-white/50 dark:bg-slate-900/40 border border-gray-200/50 dark:border-gray-800/50 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-gray-900 dark:text-white hover:text-white transition-all duration-300 group shadow-lg shadow-gray-200/20 dark:shadow-none"
        >
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl group-hover:bg-white/20 transition-colors">
            <ListFilter className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Questions</span>
        </button>

        <button 
          onClick={() => setActiveTab('storage')}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-white/50 dark:bg-slate-900/40 border border-gray-200/50 dark:border-gray-800/50 hover:bg-amber-600 dark:hover:bg-amber-600 text-gray-900 dark:text-white hover:text-white transition-all duration-300 group shadow-lg shadow-gray-200/20 dark:shadow-none"
        >
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl group-hover:bg-white/20 transition-colors">
            <Database className="w-6 h-6 text-amber-600 dark:text-amber-500 group-hover:text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Storage</span>
        </button>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Questions Added Per Week */}
        <GlassCard className="col-span-1 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Extraction Velocity
            </h4>
            <StatusBadge status="success" className="opacity-80" />
          </div>
          
          {weeklyQuestions.length > 0 ? (
            <div className="w-full flex-1 flex flex-col justify-end">
              {/* Premium custom SVG line chart */}
              <div className="relative h-64 w-full bg-gray-50/50 dark:bg-slate-950/40 rounded-3xl p-6 flex items-end overflow-hidden border border-gray-100 dark:border-gray-800">
                <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="400" y2="25" stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="75" x2="400" y2="75" stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="125" x2="400" y2="125" stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="1" strokeDasharray="4" />
                  
                  {/* Area fill */}
                  <path
                    d={`${weeklyQuestions.map((w: any, idx: number) => {
                      const x = (idx / Math.max(weeklyQuestions.length - 1, 1)) * 400;
                      const y = 140 - ((w?.count || 0) / maxWeeklyCount) * 110;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')} L 400 150 L 0 150 Z`}
                    className="fill-blue-500/10 dark:fill-blue-500/5"
                  />
                  
                  {/* Line Path */}
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
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Points */}
                  {weeklyQuestions.map((w: any, idx: number) => {
                    const x = (idx / Math.max(weeklyQuestions.length - 1, 1)) * 400;
                    const y = 140 - ((w?.count || 0) / maxWeeklyCount) * 110;
                    return (
                      <circle key={idx} cx={x} cy={y} r="5" fill="rgb(59, 130, 246)" stroke="white" strokeWidth="2" className="dark:stroke-slate-900" />
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 px-2">
                {weeklyQuestions.map((w: any, idx: number) => (
                  <span key={idx}>{w?.week?.slice(5) || ''}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-20">No extraction history available.</p>
          )}
        </GlassCard>

        {/* OCR Success Rate */}
        <GlassCard className="col-span-1 flex flex-col items-center justify-center text-center">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white self-start mb-8 uppercase tracking-widest">OCR Quality</h4>
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                className="text-gray-100 dark:text-gray-800"
                strokeWidth="16"
                fill="transparent"
              />
              <motion.circle
                initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - (analytics.ocrSuccessRate || 0) / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="96"
                cy="96"
                r="80"
                stroke="rgb(59, 130, 246)"
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 80}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black text-gray-900 dark:text-white tabular-nums">{analytics.ocrSuccessRate || 0}%</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Accuracy</span>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 mt-8 max-w-[220px] leading-relaxed">
            Computed by comparing approved papers against OCR processing failures.
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Subjects by Question Count */}
        <GlassCard>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top Subjects by Question Count</h4>
          {topSubjects.length > 0 ? (
            <div className="space-y-4">
              {topSubjects.map((sub: any, idx: number) => {
                const widthPercent = ((sub?.count || 0) / maxSubjectCount) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-800 dark:text-gray-300">
                      <span>{sub?.subject || 'Unknown'}</span>
                      <span>{sub?.count || 0} questions</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                      <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" style={{ width: `${widthPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-10">No question data available.</p>
          )}
        </GlassCard>

        {/* Papers Uploaded per Month */}
        <GlassCard>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Papers Uploaded per Month</h4>
          {monthlyPapers.length > 0 ? (
            <div className="h-40 flex items-end justify-around gap-2 px-2">
              {monthlyPapers.map((mon: any, idx: number) => {
                const heightPercent = ((mon?.count || 0) / maxMonthlyCount) * 85;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    <div className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-semibold">
                      {mon?.count || 0}
                    </div>
                    <div className="w-full bg-blue-500/80 hover:bg-blue-600 rounded-t-md transition-all" style={{ height: `${Math.max(heightPercent, 5)}%` }} />
                    <span className="text-[10px] text-gray-500 mt-2 truncate max-w-full">
                      {mon?.month?.slice(5) || ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-10">No upload history available.</p>
          )}
        </GlassCard>
      </div>

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