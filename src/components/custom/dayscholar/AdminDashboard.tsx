'use client';
import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, Send, Download, FileUp } from 'lucide-react';
import AdminQueueTab from '@/components/custom/qbank/AdminQueueTab';
import UploadPaperModal from '@/components/custom/qbank/UploadPaperModal';
import { apiFetch } from '@/lib/api';
import { GlassCard, GlassButton, GlassInput, GlassTextarea, SectionHeader, LoadingSpinner } from '@/components/custom/admin/AdminUI';

interface BusRoute {
  id: string; type: string; route: string; boardingPoints: string[];
  driverPhone: string; driverName: string; whatsappGroup: string; busLocation: string;
}

interface AdminDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, onLogout }) => {
  const [buses, setBuses] = useState<BusRoute[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');

  useEffect(() => {
    apiFetch('/api/buses')
      .then(res => res.json())
      .then(data => { if (data.success && data.buses) setBuses(data.buses); })
      .catch(err => console.error("Failed to fetch buses:", err));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].route) {
          setIsUploading(true);
          setErrorMsg('');
          setSuccessMsg('Uploading to database...');
          const res = await apiFetch('/api/admin/buses', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed),
          });
          const data = await res.json();
          if (data.success) { setBuses(parsed); setSuccessMsg(`Successfully imported ${parsed.length} routes!`); }
          else throw new Error(data.message || 'Failed to update database');
        } else throw new Error("Invalid JSON structure.");
      } catch (err: any) { setErrorMsg("Upload failed: " + err.message); setSuccessMsg(''); }
      finally { setIsUploading(false); }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(buses, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "buses_template.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastBody) return;
    setIsBroadcasting(true);
    setBroadcastMsg('');
    try {
      const res = await apiFetch('/api/admin/push', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: broadcastTitle, body: broadcastBody })
      });
      const data = await res.json();
      if (data.success) { setBroadcastMsg('Broadcast sent successfully!'); setBroadcastTitle(''); setBroadcastBody(''); }
      else throw new Error(data.error || 'Failed to send broadcast');
    } catch (err: any) { setBroadcastMsg('Error: ' + err.message); }
    finally { setIsBroadcasting(false); }
  };

  if (activeTab === 'qbank') {
    return (
      <>
        <SectionHeader
          title="Q-Bank Queue"
          description="Manage uploaded papers, extract questions, and review before publishing."
          action={<GlassButton onClick={() => setIsUploadModalOpen(true)}><FileUp className="w-4 h-4 inline mr-2" />Upload QP</GlassButton>}
        />
        <UploadPaperModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} courses={[]} username="admin" isAdmin={true} />
        <AdminQueueTab />
      </>
    );
  }

  if (activeTab === 'buses') {
    return (
      <>
        <SectionHeader title="Bus Database" description="Upload JSON to update bus routes, driver details, and WhatsApp links." />
        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 midnight:bg-green-900/20 border border-green-200/50 dark:border-green-800/50 midnight:border-green-800/50 rounded-xl text-green-700 dark:text-green-400 midnight:text-green-400 text-sm backdrop-blur-xl">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 midnight:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 midnight:border-red-800/50 rounded-xl text-red-700 dark:text-red-400 midnight:text-red-400 text-sm backdrop-blur-xl">
            {errorMsg}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard hover>
            <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${isUploading ? 'opacity-50 border-gray-300 dark:border-gray-700 midnight:border-white/20' : 'border-gray-300/50 dark:border-gray-700/50 midnight:border-white/10 hover:border-blue-400/50 dark:hover:border-blue-600/50 midnight:hover:border-blue-500/30'}`}>
              <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 midnight:text-gray-500 mb-3" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 midnight:text-gray-200 mb-1">Upload buses.json</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-400 mb-4">This will override the database directly.</p>
              <GlassButton disabled={isUploading}>
                {isUploading ? <><LoadingSpinner size="sm" /><span className="ml-2">Uploading...</span></> : 'Select File'}
              </GlassButton>
              <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} disabled={isUploading} id="bus-upload" />
              <label htmlFor="bus-upload" className="cursor-pointer" />
            </div>
          </GlassCard>
          <GlassCard hover>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300 midnight:text-gray-200">
              <Download size={16} /> Need a template?
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-400 mb-3">Download the current database schema to edit manually.</p>
            <GlassButton variant="secondary" onClick={downloadTemplate}>Download buses_template.json</GlassButton>
          </GlassCard>
        </div>
        <GlassCard className="mt-6 border-l-4 border-l-blue-500">
          <div className="flex gap-3 text-sm text-blue-800 dark:text-blue-200 midnight:text-blue-300">
            <AlertCircle className="shrink-0 mt-0.5" />
            <div><strong>Note:</strong> Changes reflect immediately in PostgreSQL for all students.</div>
          </div>
        </GlassCard>
      </>
    );
  }

  if (activeTab === 'push') {
    return (
      <>
        <SectionHeader title="Push Broadcast" description="Send a push notification to all subscribed users. This cannot be undone." />
        <GlassCard className="max-w-2xl">
          <div className="space-y-5">
            <GlassInput label="Notification Title" placeholder="e.g. Server Maintenance, Urgent Notice" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} />
            <GlassTextarea label="Notification Body" placeholder="Type your message here..." value={broadcastBody} onChange={(e) => setBroadcastBody(e.target.value)} rows={4} />
            {broadcastMsg && (
              <div className={`p-4 rounded-xl text-sm backdrop-blur-xl ${
                broadcastMsg.startsWith('Error')
                  ? 'bg-red-50 dark:bg-red-900/20 midnight:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 midnight:border-red-800/50 text-red-700 dark:text-red-400 midnight:text-red-400'
                  : 'bg-green-50 dark:bg-green-900/20 midnight:bg-green-900/20 border border-green-200/50 dark:border-green-800/50 midnight:border-green-800/50 text-green-700 dark:text-green-400 midnight:text-green-400'
              }`}>
                {broadcastMsg}
              </div>
            )}
            <GlassButton onClick={handleSendBroadcast} disabled={isBroadcasting || !broadcastTitle || !broadcastBody} className="w-full">
              {isBroadcasting ? 'Sending...' : <><Send className="w-4 h-4 inline mr-2" />Send Global Broadcast</>}
            </GlassButton>
          </div>
        </GlassCard>
      </>
    );
  }

  return null;
};

export default AdminDashboard;