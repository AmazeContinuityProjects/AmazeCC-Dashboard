'use client';
import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, Send, Download, FileUp } from 'lucide-react';
import AdminQueueTab from '@/components/custom/qbank/AdminQueueTab';
import UploadPaperModal from '@/components/custom/qbank/UploadPaperModal';
import { apiFetch } from '@/lib/api';
import { 
  Card, 
  Button, 
  Input, 
  Textarea, 
  SectionHeader, 
  LoadingSpinner, 
  Alert 
} from '@/components/custom/admin/AdminUI';

interface BusRoute {
  id: string; type: string; route: string; boardingPoints: string[];
  driverPhone: string; driverName: string; whatsappGroup: string; busLocation: string;
}

interface AdminDashboardProps {
  activeTab: string;
  activeSubTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, activeSubTab, onLogout }) => {
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
      .catch(err => console.error('Failed to fetch buses:', err));
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
        } else throw new Error('Invalid JSON structure.');
      } catch (err: any) { setErrorMsg('Upload failed: ' + err.message); setSuccessMsg(''); }
      finally { setIsUploading(false); }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(buses, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'buses_template.json');
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
      <div className="space-y-6 animate-fadeIn">
        <SectionHeader
          title="Q-Bank Processing Queue"
          description="Manage uploaded past examination papers, execute AI vision OCR pipelines, and review LaTeX formatted questions before public release."
          action={
            <Button variant="primary" onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2">
              <FileUp className="w-4 h-4" />
              Upload Paper
            </Button>
          }
        />
        <UploadPaperModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} courses={[]} username="admin" isAdmin={true} />
        <AdminQueueTab />
      </div>
    );
  }

  if (activeTab === 'push') {
    return (
      <div className="space-y-6 animate-fadeIn">
        <SectionHeader 
          title="Push Notification Broadcast" 
          description="Send an instant broadcast push notification to all registered student mobile applications." 
        />
        <Card className="max-w-2xl p-6">
          <div className="space-y-5">
            <Input 
              label="Broadcast Title *" 
              placeholder="e.g. Bus Route Diversion / Academic Announcement" 
              value={broadcastTitle} 
              onChange={(e: any) => setBroadcastTitle(e.target.value)} 
            />
            <Textarea 
              label="Notification Body *" 
              placeholder="Enter message details that will appear on students' lock screens..." 
              value={broadcastBody} 
              onChange={(e: any) => setBroadcastBody(e.target.value)} 
              rows={4} 
            />
            {broadcastMsg && (
              <Alert variant={broadcastMsg.startsWith('Error') ? 'error' : 'success'}>
                <span>{broadcastMsg}</span>
              </Alert>
            )}
            <Button 
              variant="primary"
              onClick={handleSendBroadcast} 
              disabled={isBroadcasting || !broadcastTitle || !broadcastBody} 
              className="w-full flex items-center justify-center gap-2"
            >
              {isBroadcasting ? 'Broadcasting...' : <><Send className="w-4 h-4" />Send Global Push Notification</>}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default AdminDashboard;