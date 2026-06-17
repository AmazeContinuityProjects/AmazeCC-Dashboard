'use client';
import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, HardDrive, FileText, Image, Trash2, 
  Search, ShieldAlert, Sparkles, HelpCircle, Server, AlertTriangle
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GlassCard, GlassButton, SectionHeader, LoadingSpinner } from '@/components/custom/admin/AdminUI';

interface StorageStats {
  totalSize: number;
  r2Count: number;
  otherCount: number;
  jsonCount: number;
  diagramCount: number;
  largestFiles: Array<{
    source_id: string;
    course_code: string;
    title: string;
    file_size: number;
    storage_provider: string;
    created_at: string;
    file_url: string;
  }>;
  recentUploads: Array<{
    source_id: string;
    course_code: string;
    title: string;
    file_size: number;
    storage_provider: string;
    created_at: string;
    file_url: string;
  }>;
}

export default function StorageManager() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [missingReport, setMissingReport] = useState<any[] | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/storage');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch storage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const runAction = async (action: 'rebuild_metadata' | 'delete_orphaned' | 'find_missing') => {
    if (action === 'delete_orphaned' && !confirm('Are you sure you want to permanently delete rejected paper files from Cloudflare R2? This action is irreversible.')) {
      return;
    }
    
    setActioning(action);
    setMissingReport(null);
    try {
      const res = await apiFetch('/api/admin/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      
      if (json.success) {
        if (action === 'find_missing') {
          setMissingReport(json.missing || []);
          alert(`Check complete. Found ${json.missingCount} items with missing file paths.`);
        } else {
          alert(json.message || 'Action executed successfully.');
          fetchStats();
        }
      } else {
        alert('Action failed: ' + json.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActioning(null);
    }
  };

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

  if (!stats) {
    return (
      <div className="text-center py-20 min-h-[60vh] flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-gray-500">
          {loading ? 'Loading storage analysis...' : 'Failed to load storage analysis. Please check authentication.'}
        </p>
      </div>
    );
  }

  const s = stats || {
    totalSize: 0,
    r2Count: 0,
    otherCount: 0,
    jsonCount: 0,
    diagramCount: 0,
    largestFiles: [],
    recentUploads: []
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Storage & Asset Manager" 
        description="Monitor system storage quotas, manage S3 integrations, analyze largest PDF uploads, and prune orphaned files."
      />

      {/* Grid of Storage metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Storage Size usage */}
        <GlassCard className="flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Disk Storage Used</span>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {formatBytes(s?.totalSize || 0)}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800/80 mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Quota limit: None</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Operational</span>
          </div>
        </GlassCard>

        {/* Cloudflare R2 count */}
        <GlassCard className="flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Cloudflare R2 Files</span>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {s?.r2Count || 0} <span className="text-sm font-semibold text-gray-400">PDFs</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800/80 mt-4 text-xs text-gray-500 flex justify-between">
            <span>Bucket: amazecc-pap</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">Private Bucket</span>
          </div>
        </GlassCard>

        {/* Diagrams / Assets count */}
        <GlassCard className="flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Supabase Assets</span>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {s?.diagramCount || 0} <span className="text-sm font-semibold text-gray-400">diagrams</span>
              </h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl">
              <Image className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800/80 mt-4 text-xs text-gray-500 flex justify-between">
            <span>Bucket: qbank (Supabase)</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">Public CDN</span>
          </div>
        </GlassCard>
      </div>

      {/* Storage Providers Breakdown */}
      <GlassCard className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Storage Provider Breakdown</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Cloudflare R2</span>
            <p className="text-xl font-extrabold mt-1 text-gray-950 dark:text-white">{s?.r2Count || 0} files</p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Google Drive / Other</span>
            <p className="text-xl font-extrabold mt-1 text-gray-950 dark:text-white">{s?.otherCount || 0} links</p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase">JSON / Text Only</span>
            <p className="text-xl font-extrabold mt-1 text-gray-950 dark:text-white">{s?.jsonCount || 0} entries</p>
          </div>
        </div>
      </GlassCard>

      {/* Storage Maintenance Actions */}
      <GlassCard className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Storage Maintenance Actions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            onClick={() => runAction('delete_orphaned')}
            disabled={actioning !== null}
            className="flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> 
            {actioning === 'delete_orphaned' ? 'Deleting...' : 'Prune Rejected Files'}
          </button>
          
          <button 
            onClick={() => runAction('find_missing')}
            disabled={actioning !== null}
            className="flex items-center justify-center gap-2 p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" /> 
            {actioning === 'find_missing' ? 'Checking...' : 'Find Missing Files'}
          </button>

          <button 
            onClick={() => runAction('rebuild_metadata')}
            disabled={actioning !== null}
            className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> 
            {actioning === 'rebuild_metadata' ? 'Rebuilding...' : 'Rebuild Metadata'}
          </button>
        </div>

        {/* Missing Files Report Display */}
        {missingReport && (
          <div className="p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2">
            <h5 className="text-xs font-bold text-gray-850 dark:text-gray-200">Missing File Reference Audit Report</h5>
            {missingReport.length === 0 ? (
              <p className="text-xs text-green-600 dark:text-green-400">All database paper records reference valid files or direct JSON.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {missingReport.map((m, idx) => (
                  <div key={idx} className="flex justify-between text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                    <span className="font-semibold text-gray-900 dark:text-white">{m.course_code} - {m.title}</span>
                    <span className="text-red-500">Missing URL</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Lists Section: Largest and Recent files */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Largest Files */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Largest Files in Storage
          </h4>
          <div className="space-y-2.5">
            {s.largestFiles && s.largestFiles.length > 0 ? (
              s.largestFiles.map(f => (
                <div key={f.source_id} className="flex items-center justify-between text-xs p-3 bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800/80 rounded-xl hover:bg-gray-100/50 transition-colors">
                  <div className="space-y-0.5 max-w-[70%]">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{f.title}</p>
                    <p className="text-[10px] text-gray-500">{f.course_code} &bull; {f.storage_provider}</p>
                  </div>
                  <span className="font-bold text-gray-700 dark:text-gray-300">{formatBytes(f.file_size)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-6">No large files found.</p>
            )}
          </div>
        </GlassCard>

        {/* Recent Uploads */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" /> Recent Uploaded Papers
          </h4>
          <div className="space-y-2.5">
            {s.recentUploads && s.recentUploads.length > 0 ? (
              s.recentUploads.map(f => (
                <div key={f.source_id} className="flex items-center justify-between text-xs p-3 bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800/80 rounded-xl hover:bg-gray-100/50 transition-colors">
                  <div className="space-y-0.5 max-w-[70%]">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{f.title}</p>
                    <p className="text-[10px] text-gray-500">{new Date(f.created_at).toLocaleDateString()} &bull; {f.course_code}</p>
                  </div>
                  <span className="text-gray-500 font-semibold">{f.file_size ? formatBytes(f.file_size) : 'Link'}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-6">No recent uploads available.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
