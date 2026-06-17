'use client';
import React, { useState, useEffect } from 'react';
import { 
  History, Search, RefreshCw, User, Calendar, Tag, Shield
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GlassCard, GlassButton, SectionHeader, LoadingSpinner } from '@/components/custom/admin/AdminUI';

interface AuditLog {
  id: number;
  admin_user: string;
  action: string;
  target_resource: string;
  timestamp: string;
}

export default function AuditLogsManager() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/stats');
      const json = await res.json();
      if (json.success && json.data && json.data.recentLogs) {
        setLogs(json.data.recentLogs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter actions list
  const actionsList = Array.from(new Set(logs.map(l => l.action))).filter(Boolean);

  const filteredLogs = logs.filter(l => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      l.admin_user?.toLowerCase().includes(query) ||
      l.action?.toLowerCase().includes(query) ||
      l.target_resource?.toLowerCase().includes(query);

    if (!matchesSearch) return false;
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Admin Activity Audit Logs" 
        description="Trace administrative actions including paper uploads, OCR triggers, bulk modifications, and publishing releases."
      />

      {/* Filters & Search */}
      <GlassCard className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search logs by admin user, action, resource..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] text-gray-900 dark:text-gray-100 placeholder-gray-400 border-gray-200/50 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none"
          >
            <option value="ALL">All Actions</option>
            {actionsList.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <GlassButton variant="secondary" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </GlassButton>
        </div>
      </GlassCard>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-20">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-500">Loading audit trail...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <History className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-gray-850 dark:text-gray-200">No activity logged</h4>
          <p className="text-xs text-gray-500 mt-1">Admin actions will appear here as they occur.</p>
        </div>
      ) : (
        <GlassCard className="!p-0 overflow-hidden border border-gray-150 dark:border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-6">Timestamp</th>
                  <th className="p-4">Admin User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4 pr-6">Target Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                {filteredLogs.map(l => {
                  let badgeColor = 'bg-gray-100 text-gray-700';
                  if (l.action.startsWith('Paper Status')) badgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400';
                  else if (l.action.includes('Publish')) badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
                  else if (l.action.includes('Upload') || l.action.includes('Import')) badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
                  else if (l.action.includes('Delete') || l.action.includes('Rejected')) badgeColor = 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30';
                  else if (l.action.includes('Edit')) badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';

                  return (
                    <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 pl-6 text-gray-500 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{l.timestamp}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span>{l.admin_user}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-gray-700 dark:text-gray-300 font-medium max-w-xs truncate" title={l.target_resource}>
                        {l.target_resource}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
