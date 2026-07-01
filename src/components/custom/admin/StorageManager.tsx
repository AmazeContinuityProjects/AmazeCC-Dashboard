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

const isRemoteUrl = (url: string) => {
  if (!url || url === 'DIRECT_JSON') return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('drive.google') ||
    lowerUrl.includes('onedrive') ||
    lowerUrl.includes('dropbox') ||
    lowerUrl.includes('sharepoint') ||
    lowerUrl.includes('live.com') ||
    lowerUrl.includes('docs.google')
  );
};

export default function StorageManager() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [missingReport, setMissingReport] = useState<any[] | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<{
    status: 'idle' | 'scanning' | 'migrating' | 'completed';
    current: number;
    total: number;
    currentTitle: string;
    errors: string[];
  }>({
    status: 'idle',
    current: 0,
    total: 0,
    currentTitle: '',
    errors: []
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try fetching from the storage API
      const res = await apiFetch('/api/admin/storage');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
          return;
        }
      }

      // Fallback: Calculate stats client-side by querying existing queue and questions APIs
      console.log('Production /api/admin/storage returned error or is missing. Running client-side stats calculation fallback...');
      
      const queueRes = await apiFetch('/api/qbank/admin/queue');
      if (!queueRes.ok) {
        throw new Error(`Failed to load storage data (API returned ${res.status}, and fallback queue returned ${queueRes.status})`);
      }
      const queueJson = await queueRes.json();
      if (!queueJson.success) {
        throw new Error(queueJson.error || 'Failed to fetch queue for fallback stats');
      }

      const allPapers = queueJson.data || [];
      const r2Papers = allPapers.filter((p: any) => !isRemoteUrl(p.file_url) && p.file_url !== 'DIRECT_JSON');
      const otherPapers = allPapers.filter((p: any) => isRemoteUrl(p.file_url));
      const jsonPapers = allPapers.filter((p: any) => p.file_url === 'DIRECT_JSON');

      const totalSize = r2Papers.reduce((sum: number, p: any) => sum + (Number(p.file_size) || 0), 0);

      const largestFiles = [...allPapers]
        .filter((p: any) => p.file_size)
        .sort((a: any, b: any) => (Number(b.file_size) || 0) - (Number(a.file_size) || 0))
        .slice(0, 5)
        .map((p: any) => ({
          source_id: p.source_id,
          course_code: p.course_code,
          title: p.title,
          file_size: Number(p.file_size) || 0,
          storage_provider: p.storage_provider,
          created_at: p.created_at,
          file_url: p.file_url
        }));

      const recentUploads = [...allPapers]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((p: any) => ({
          source_id: p.source_id,
          course_code: p.course_code,
          title: p.title,
          file_size: Number(p.file_size) || 0,
          storage_provider: p.storage_provider,
          created_at: p.created_at,
          file_url: p.file_url
        }));

      let diagramCount = 0;
      try {
        const questionsRes = await apiFetch('/api/qbank/admin/questions');
        if (questionsRes.ok) {
          const qJson = await questionsRes.json();
          if (qJson.success && qJson.data) {
            diagramCount = qJson.data.filter((q: any) => q.diagram_url).length;
          }
        }
      } catch (e) {
        console.error('Failed to fetch diagram count fallback:', e);
      }

      setStats({
        totalSize,
        r2Count: r2Papers.length,
        otherCount: otherPapers.length,
        jsonCount: jsonPapers.length,
        diagramCount,
        largestFiles,
        recentUploads
      });
    } catch (err: any) {
      console.error('Failed to fetch storage stats:', err);
      setError(err.message || 'An unexpected error occurred');
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

  const migrateRemoteFiles = async () => {
    setMigrationStatus({
      status: 'scanning',
      current: 0,
      total: 0,
      currentTitle: 'Scanning database for remote links...',
      errors: []
    });
    setActioning('migrate_remote');

    try {
      const res = await apiFetch('/api/qbank/admin/queue');
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to scan papers');
      }

      const allPapers = json.data || [];
      const remotePapers = allPapers.filter((p: any) => 
        isRemoteUrl(p.file_url)
      );

      if (remotePapers.length === 0) {
        alert('No papers with remote drive links found. All papers are already on Cloudflare R2 or DIRECT_JSON.');
        setMigrationStatus({ status: 'idle', current: 0, total: 0, currentTitle: '', errors: [] });
        setActioning(null);
        return;
      }

      const confirmMigration = confirm(`Found ${remotePapers.length} paper(s) hosted on Google Drive or other external drives.\n\nWould you like to download and migrate them to our local Cloudflare R2 database now?`);
      if (!confirmMigration) {
        setMigrationStatus({ status: 'idle', current: 0, total: 0, currentTitle: '', errors: [] });
        setActioning(null);
        return;
      }

      setMigrationStatus({
        status: 'migrating',
        current: 0,
        total: remotePapers.length,
        currentTitle: 'Starting migration...',
        errors: []
      });

      let successCount = 0;
      const errorsList: string[] = [];

      for (let i = 0; i < remotePapers.length; i++) {
        const paper = remotePapers[i];
        setMigrationStatus(prev => ({
          ...prev,
          current: i + 1,
          currentTitle: `${paper.course_code} - ${paper.title}`
        }));

        try {
          const importRes = await apiFetch('/api/qbank/admin/import-to-storage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paperId: paper.source_id })
          });
          const importJson = await importRes.json();
          if (importJson.success) {
            successCount++;
          } else {
            errorsList.push(`${paper.course_code}: ${importJson.error || 'Unknown error'}`);
          }
        } catch (err: any) {
          errorsList.push(`${paper.course_code}: ${err.message || 'Network error'}`);
        }
      }

      setMigrationStatus({
        status: 'completed',
        current: successCount,
        total: remotePapers.length,
        currentTitle: `Migration finished. Successfully migrated ${successCount} of ${remotePapers.length} papers.`,
        errors: errorsList
      });

      fetchStats();
    } catch (err: any) {
      alert('Migration failed: ' + err.message);
      setMigrationStatus({ status: 'idle', current: 0, total: 0, currentTitle: '', errors: [] });
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

  if (loading && !stats) {
    return (
      <div className="text-center py-20 min-h-[60vh] flex flex-col items-center justify-center space-y-4 animate-fadeIn">
        <LoadingSpinner />
        <p className="text-sm text-gray-500 animate-pulse">Loading storage analysis...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 min-h-[60vh] flex flex-col items-center justify-center space-y-6 max-w-md mx-auto px-4 animate-fadeIn">
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Unable to load storage data</h3>
          <p className="text-sm text-gray-550 dark:text-gray-400 leading-relaxed">
            {error || 'Failed to load storage analysis. Please verify your administrative credentials and connection.'}
          </p>
        </div>
        <GlassButton onClick={fetchStats} variant="secondary" className="px-6 py-2.5 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </GlassButton>
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
  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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

  <button 
  onClick={migrateRemoteFiles}
  disabled={actioning !== null}
  className="flex items-center justify-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
  >
  <HardDrive className="w-4 h-4" /> 
  {actioning === 'migrate_remote' ? 'Migrating...' : 'Migrate Drive Links'}
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

  {/* Google Drive Migration Status */}
  {migrationStatus.status !== 'idle' && (
  <div className="p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 animate-fadeIn">
  <div className="flex justify-between items-center">
  <h5 className="text-xs font-bold text-gray-855 dark:text-gray-205 uppercase tracking-wider flex items-center gap-2">
  {migrationStatus.status === 'scanning' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />}
  {migrationStatus.status === 'migrating' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-500" />}
  {migrationStatus.status === 'completed' && <Database className="w-3.5 h-3.5 text-green-500" />}
  Google Drive Migration Status
  </h5>
  {migrationStatus.status === 'completed' && (
  <button 
  onClick={() => setMigrationStatus({ status: 'idle', current: 0, total: 0, currentTitle: '', errors: [] })}
  className="text-[10px] bg-gray-250 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg hover:bg-gray-300 transition-colors"
  >
  Dismiss
  </button>
  )}
  </div>

  <div className="space-y-2">
  <div className="flex justify-between text-xs text-gray-500">
  <span className="truncate max-w-[70%]">{migrationStatus.currentTitle || (migrationStatus.status === 'scanning' ? 'Scanning papers...' : 'Waiting...')}</span>
  {migrationStatus.total > 0 && (
  <span>{migrationStatus.current} / {migrationStatus.total} ({Math.round((migrationStatus.current / migrationStatus.total) * 100)}%)</span>
  )}
  </div>

  {migrationStatus.total > 0 && (
  <div className="w-full bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
  <div 
  className={`h-full transition-all duration-350 ${migrationStatus.status === 'completed' ? 'bg-green-500' : 'bg-purple-600'}`}
  style={{ width: `${(migrationStatus.current / migrationStatus.total) * 100}%` }}
  />
  </div>
  )}
  </div>

  {migrationStatus.errors.length > 0 && (
  <div className="space-y-1.5 pt-2 border-t border-gray-150 dark:border-gray-800">
  <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Migration Issues ({migrationStatus.errors.length})</p>
  <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
  {migrationStatus.errors.map((err, idx) => (
  <p key={idx} className="text-[10px] text-red-400 font-mono leading-normal">{err}</p>
  ))}
  </div>
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
