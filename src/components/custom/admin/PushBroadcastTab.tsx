'use client';
import React, { useState } from 'react';
import { 
  Send, 
  ShieldCheck, 
  Smartphone, 
  Bell, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Radio, 
  Clock, 
  Users, 
  Info 
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { 
  Card, 
  Button, 
  Input, 
  Textarea, 
  Select, 
  SectionHeader, 
  Badge, 
  Alert 
} from '@/components/custom/admin/AdminUI';

export default function PushBroadcastTab() {
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [category, setCategory] = useState('general');
  const [audience, setAudience] = useState('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setIsBroadcasting(true);
    setBroadcastResult(null);

    try {
      const res = await apiFetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: broadcastTitle.trim(), 
          body: broadcastBody.trim(),
          category,
          audience
        })
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastResult({ 
          success: true, 
          message: 'Broadcast notification dispatched successfully to subscribed devices!' 
        });
        setBroadcastTitle('');
        setBroadcastBody('');
      } else {
        throw new Error(data.error || 'Failed to dispatch broadcast');
      }
    } catch (err: any) {
      setBroadcastResult({ 
        success: false, 
        message: err.message || 'An error occurred dispatching broadcast.' 
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader 
        title="Push Broadcast Center" 
        description="Dispatch instant web and mobile push notifications to active students with real-time lockscreen preview."
        breadcrumbs={[{ label: 'Admin', href: '#' }, { label: 'System', href: '#' }, { label: 'Push Broadcast', active: true }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Composer Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Compose Notification</h3>
                  <p className="text-xs text-muted-foreground">Draft and configure broadcast parameters</p>
                </div>
              </div>
              <Badge variant="info" size="sm" className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Live Service
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-foreground">Notification Title *</label>
                  <span className={`text-[10px] ${broadcastTitle.length > 50 ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                    {broadcastTitle.length}/60
                  </span>
                </div>
                <Input 
                  placeholder="e.g. Bus Route 14 Diversion or VITOL Class Alert" 
                  value={broadcastTitle} 
                  maxLength={60}
                  onChange={(e: any) => setBroadcastTitle(e.target.value)} 
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-foreground">Message Content *</label>
                  <span className={`text-[10px] ${broadcastBody.length > 180 ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                    {broadcastBody.length}/240
                  </span>
                </div>
                <Textarea 
                  placeholder="Enter detailed message text. Keep it concise so it fits comfortably on lockscreens without truncation..." 
                  value={broadcastBody} 
                  maxLength={240}
                  onChange={(e: any) => setBroadcastBody(e.target.value)} 
                  rows={4} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Category / Type</label>
                  <Select 
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    options={[
                      { value: 'general', label: '📢 General Campus Notice' },
                      { value: 'transport', label: '🚌 Transport / Bus Update' },
                      { value: 'academic', label: '📚 Exam & Academic Alert' },
                      { value: 'emergency', label: '🚨 High Priority Alert' }
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Target Audience</label>
                  <Select 
                    value={audience}
                    onChange={(e: any) => setAudience(e.target.value)}
                    options={[
                      { value: 'all', label: '👥 All Registered Students' },
                      { value: 'dayscholars', label: '🚍 Day Scholars Only' },
                      { value: 'hostellers', label: '🏢 Hostellers Only' },
                      { value: 'vitol', label: '💻 VITOL Online Class Enrollees' }
                    ]}
                  />
                </div>
              </div>

              {broadcastResult && (
                <Alert variant={broadcastResult.success ? 'success' : 'error'} className="mt-2">
                  <div className="flex items-center gap-2">
                    {broadcastResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    <span className="text-xs font-medium">{broadcastResult.message}</span>
                  </div>
                </Alert>
              )}

              <div className="pt-2">
                <Button 
                  variant="primary"
                  onClick={handleSendBroadcast} 
                  disabled={isBroadcasting || !broadcastTitle.trim() || !broadcastBody.trim()} 
                  className="w-full flex items-center justify-center gap-2 h-11 text-sm font-bold shadow-md shadow-primary/20"
                >
                  {isBroadcasting ? (
                    'Broadcasting Notification...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Global Push Broadcast
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Device Lockscreen Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 bg-gradient-to-b from-card/80 to-muted/40 border border-border/60">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Live Device Lockscreen Preview
              </h4>
            </div>

            {/* Mock Smartphone Frame */}
            <div className="w-full max-w-[320px] mx-auto bg-slate-950 text-white rounded-[38px] p-3 shadow-2xl border-4 border-slate-800 relative overflow-hidden">
              {/* Dynamic Island / Speaker Notch */}
              <div className="w-24 h-4 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              </div>

              {/* Time & Date Header */}
              <div className="text-center my-3 space-y-0.5">
                <p className="text-3xl font-extrabold font-display tracking-tight text-white/90">09:41</p>
                <p className="text-[10px] text-white/60 font-medium">Monday, August 24</p>
              </div>

              {/* Lockscreen Notification Card */}
              <div className="mt-6 mb-12 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-md bg-info flex items-center justify-center text-white text-[9px] font-black">
                      A
                    </div>
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide">AmazeCC</span>
                  </div>
                  <span className="text-[9px] text-white/50 font-medium">now</span>
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white leading-tight truncate">
                    {broadcastTitle.trim() || 'Notification Title Preview'}
                  </p>
                  <p className="text-[11px] text-white/80 leading-snug line-clamp-3">
                    {broadcastBody.trim() || 'Your broadcast message preview will appear right here as you type in the editor.'}
                  </p>
                </div>
              </div>

              {/* Mock Home Bar */}
              <div className="w-28 h-1 bg-white/40 rounded-full mx-auto mt-4" />
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-xl border border-border/50 flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Messages are routed via Web Push API to all active service workers on registered devices.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
