'use client';
import React, { useState } from 'react';
import { 
  Settings, Server, Cloud, Shield, Database, Lock, Key, RefreshCcw,
  Bell, Trash2, Wrench, Timer, RotateCcw, Ban, FileClock, Megaphone,
  Eye, EyeOff, CheckCircle, AlertTriangle, Gauge, Calendar
} from 'lucide-react';
import { GlassCard, SectionHeader, GlassButton, StatusBadge } from '@/components/custom/admin/AdminUI';
import { ThemeSwitcher } from '@/components/custom/ThemeSwitcher';

export default function SettingsTab() {
  const [modelType, setModelType] = useState('qwen2.5vl:3b');
  const [confidenceThreshold, setConfidenceThreshold] = useState('0.75');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Site is under scheduled maintenance.');
  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    emailAlerts: false,
    ocrComplete: true,
    ocrFailure: true,
    newPaperUpload: false,
    dailyDigest: true,
  });
  const [cacheCleared, setCacheCleared] = useState<string | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState('24');
  const [rateLimit, setRateLimit] = useState('100');
  const [retentionDays, setRetentionDays] = useState('90');

  const clearCache = (type: string) => {
    setCacheCleared(type);
    setTimeout(() => setCacheCleared(null), 2000);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Admin Settings & Configurations" 
        description="Inspect cloud storage credentials, configure LLM extractor pipelines, and view active environment statuses."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LLM Pipeline Config */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" /> OCR & AI Parsing Config
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">OCR Processing Model</label>
              <select 
                value={modelType} 
                onChange={(e) => setModelType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none"
              >
                <option value="qwen2.5vl:3b">Qwen 2.5 VL (3B Parameter) - Fast</option>
                <option value="qwen2.5vl:7b">Qwen 2.5 VL (7B Parameter) - Medium</option>
                <option value="llama3-vision">Llama 3 Vision - Precise</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Warning Confidence Threshold</label>
              <input 
                type="number" 
                min="0.1" 
                max="1.0" 
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none"
              />
              <p className="text-[10px] text-gray-500 mt-1">OCR runs with confidence levels below this threshold trigger low-confidence warnings.</p>
            </div>
          </div>
        </GlassCard>

        {/* Storage Integrations */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-500" /> S3 Cloud Storage Details
          </h4>
          
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800/80">
              <span className="text-gray-500">Storage Provider</span>
              <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-500" /> Cloudflare R2
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800/80">
              <span className="text-gray-500">Bucket Name</span>
              <span className="font-mono font-semibold text-gray-900 dark:text-white">amazecc-pap</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800/80">
              <span className="text-gray-500">Service API Endpoint</span>
              <span className="font-mono text-gray-650 dark:text-gray-400 truncate max-w-[200px]" title="cb52977aee2b0c7693993aa0dc02b548.r2.cloudflarestorage.com">
                *.r2.cloudflarestorage.com
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">Security Credentials</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                Encrypted & Signed
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Database Status */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-500" /> PostgreSQL Database Status
          </h4>
          
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800/80">
              <span className="text-gray-500">Database Engine</span>
              <span className="font-semibold text-gray-900 dark:text-white">Supabase PostgreSQL 15+</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800/80">
              <span className="text-gray-500">Connection Pool</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Connected & Idle</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">Tables Synced</span>
              <span className="font-semibold text-gray-900 dark:text-white">10 Tables</span>
            </div>
          </div>
        </GlassCard>

        {/* Authentication Systems */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" /> Authentication Systems
          </h4>
          
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800/80">
              <span className="text-gray-500">Auth Token Method</span>
              <span className="font-semibold text-gray-900 dark:text-white">HMAC SHA-256 Signature</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800/80">
              <span className="text-gray-500">Token Validity Period</span>
              <span className="font-semibold text-gray-900 dark:text-white">7 Days</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">Secure Cookie Policies</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strict SameSite & HttpOnly</span>
            </div>
          </div>
        </GlassCard>

        {/* Theme Settings */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-pink-500" /> Theme & Appearance
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Theme Switcher</p>
                <p className="text-[10px] text-gray-500">Toggle between light and dark mode with accent colors</p>
              </div>
              <ThemeSwitcher />
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Current Mode</span>
                <span className="font-semibold text-gray-900 dark:text-white capitalize">
                  {typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'Dark' : 'Light'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Accent Profile</span>
                <span className="font-semibold text-gray-900 dark:text-white capitalize">
                  {typeof window !== 'undefined' && document.documentElement.getAttribute('data-accent') || 'Ocean'}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Cache & Performance */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-500" /> Cache & Performance
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800/80">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Questions Cache</p>
                <p className="text-[10px] text-gray-500">~2,400 entries | 12 MB</p>
              </div>
              <GlassButton 
                variant="secondary" 
                size="sm" 
                onClick={() => clearCache('questions')}
              >
                {cacheCleared === 'questions' ? (
                  <><CheckCircle className="w-3 h-3 mr-1 text-emerald-500" /> Cleared</>
                ) : (
                  <><Trash2 className="w-3 h-3 mr-1" /> Clear</>
                )}
              </GlassButton>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800/80">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Papers Cache</p>
                <p className="text-[10px] text-gray-500">~850 entries | 45 MB</p>
              </div>
              <GlassButton 
                variant="secondary" 
                size="sm" 
                onClick={() => clearCache('papers')}
              >
                {cacheCleared === 'papers' ? (
                  <><CheckCircle className="w-3 h-3 mr-1 text-emerald-500" /> Cleared</>
                ) : (
                  <><Trash2 className="w-3 h-3 mr-1" /> Clear</>
                )}
              </GlassButton>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Thumbnail Cache</p>
                <p className="text-[10px] text-gray-500">~320 entries | 8 MB</p>
              </div>
              <GlassButton 
                variant="secondary" 
                size="sm" 
                onClick={() => clearCache('thumbnails')}
              >
                {cacheCleared === 'thumbnails' ? (
                  <><CheckCircle className="w-3 h-3 mr-1 text-emerald-500" /> Cleared</>
                ) : (
                  <><Trash2 className="w-3 h-3 mr-1" /> Clear</>
                )}
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        {/* Notification Settings */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500" /> Notification Settings
          </h4>
          
          <div className="space-y-3">
            {[
              { key: 'pushEnabled' as const, label: 'Push Notifications', desc: 'Enable all push notifications' },
              { key: 'emailAlerts' as const, label: 'Email Alerts', desc: 'Send email for critical alerts' },
              { key: 'ocrComplete' as const, label: 'OCR Complete', desc: 'Notify when OCR finishes' },
              { key: 'ocrFailure' as const, label: 'OCR Failure', desc: 'Alert on OCR processing failure' },
              { key: 'newPaperUpload' as const, label: 'New Paper Upload', desc: 'Notify on new paper uploads' },
              { key: 'dailyDigest' as const, label: 'Daily Digest', desc: 'Send daily summary report' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800/80 last:border-b-0">
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{label}</p>
                  <p className="text-[10px] text-gray-500">{desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(key)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    notifications[key] ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      notifications[key] ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Maintenance Mode */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-500" /> Maintenance Mode
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Maintenance Mode</p>
                <p className="text-[10px] text-gray-500">Block public access during maintenance</p>
              </div>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  maintenanceMode ? 'bg-destructive' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    maintenanceMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {maintenanceMode && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Maintenance Message</label>
                <textarea
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none resize-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">This message will be shown to all users during maintenance.</p>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-slate-800/80">
              <span className="text-xs text-gray-500">Current Status</span>
              <StatusBadge status={maintenanceMode ? 'error' : 'success'} />
            </div>
          </div>
        </GlassCard>

        {/* Security & Session Policies */}
        <GlassCard className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-500" /> Security & Session Policies
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800/80">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Session Timeout</p>
                <p className="text-[10px] text-gray-500">Auto-logout after inactivity</p>
              </div>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="px-2 py-1 text-[10px] font-semibold bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg outline-none"
              >
                <option value="1">1 Hour</option>
                <option value="6">6 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours</option>
                <option value="48">48 Hours</option>
                <option value="72">72 Hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800/80">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">API Rate Limit</p>
                <p className="text-[10px] text-gray-500">Max requests per minute per IP</p>
              </div>
              <select
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                className="px-2 py-1 text-[10px] font-semibold bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg outline-none"
              >
                <option value="30">30/min</option>
                <option value="60">60/min</option>
                <option value="100">100/min</option>
                <option value="200">200/min</option>
                <option value="500">500/min</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">CORS Origin Policy</p>
                <p className="text-[10px] text-gray-500">Restrict API access by domain</p>
              </div>
              <span className="px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                Strict
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Data Retention & Cleanup - Full Width */}
      <GlassCard className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileClock className="w-4 h-4 text-cyan-500" /> Data Retention & Cleanup
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Audit Log Retention</label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none"
            >
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
              <option value="90">90 Days</option>
              <option value="180">180 Days</option>
              <option value="365">1 Year</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Failed OCR Retention</label>
            <select
              defaultValue="30"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none"
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <GlassButton variant="secondary" className="w-full">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Run Cleanup Now
            </GlassButton>
            <p className="text-[10px] text-gray-500 mt-1.5">Last cleanup: 2 days ago</p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Auto-cleanup scheduled daily at 03:00 AM
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-400" />
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" /> Estimated 2.4 GB recoverable
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
