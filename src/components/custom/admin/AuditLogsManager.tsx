'use client';
import React, { useState, useEffect } from 'react';
import { 
  History, Search, RefreshCw, User, Calendar, Shield
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  SectionHeader, 
  LoadingSpinner, 
  Badge, 
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/custom/admin/AdminUI';

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

  const getActionBadgeVariant = (action: string): 'success' | 'danger' | 'warning' | 'info' | 'default' => {
    if (action.includes('Publish')) return 'success';
    if (action.includes('Delete') || action.includes('Reject')) return 'danger';
    if (action.includes('Edit') || action.includes('Update')) return 'warning';
    if (action.includes('Upload') || action.includes('Import') || action.includes('Status')) return 'info';
    return 'default';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader 
        title="Admin Activity Audit Trail" 
        description="Trace administrative actions including document uploads, OCR pipeline runs, metadata adjustments, and publishing events."
      />

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search logs by admin user, action type, or target resource..." 
              className="pl-9 w-full" 
              value={searchQuery} 
              onChange={(e: any) => setSearchQuery(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <div className="w-48">
              <Select 
                value={actionFilter} 
                onChange={(e: any) => setActionFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Actions' },
                  ...actionsList.map(a => ({ value: a, label: a }))
                ]}
              />
            </div>
            <Button variant="outline" onClick={fetchLogs} disabled={loading} className="shrink-0 flex items-center gap-1.5">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-20">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-muted-foreground">Loading audit trail...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<History className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No activity recorded"
            description="Administrative actions and pipeline events will appear here as they occur."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-muted/40">
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Admin User</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Action</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Target Resource</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(l => (
                  <TableRow key={l.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{l.timestamp}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 font-bold text-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>{l.admin_user}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge variant={getActionBadgeVariant(l.action)} size="sm">
                        {l.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-muted-foreground max-w-xs">
                      <span className="truncate block" title={l.target_resource}>
                        {l.target_resource}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
