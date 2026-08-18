'use client';
import React, { useState } from 'react';
import { 
  Settings, Server, Cloud, Shield, Database, Lock, Key, RefreshCcw,
  Bell, Trash2, Wrench, Timer, RotateCcw, Ban, FileClock, Megaphone,
  Eye, CheckCircle, AlertTriangle, Gauge, Calendar
} from 'lucide-react';
import { 
  Card, 
  Button, 
  Input, 
  Textarea, 
  Select, 
  Switch, 
  SectionHeader, 
  StatusBadge, 
  Badge 
} from '@/components/custom/admin/AdminUI';
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

  const toggleNotification = (key: keyof typeof notifications, newVal: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: newVal }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader 
        title="Admin Settings & Configurations" 
        description="Inspect cloud storage credentials, configure LLM extractor pipelines, and view active environment statuses."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LLM Pipeline Config */}
        <Card className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> OCR & AI Parsing Config
          </h4>
          
          <div className="space-y-3">
            <Select 
              label="OCR Processing Model"
              value={modelType} 
              onChange={(e: any) => setModelType(e.target.value)}
              options={[
                { value: 'qwen2.5vl:3b', label: 'Qwen 2.5 VL (3B Parameter) - Fast' },
                { value: 'qwen2.5vl:7b', label: 'Qwen 2.5 VL (7B Parameter) - Medium' },
                { value: 'llama3-vision', label: 'Llama 3 Vision - Precise' }
              ]}
            />

            <div>
              <Input 
                label="Warning Confidence Threshold"
                type="number" 
                min="0.1" 
                max="1.0" 
                step="0.05"
                value={confidenceThreshold}
                onChange={(e: any) => setConfidenceThreshold(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">OCR runs with confidence levels below this threshold trigger low-confidence warnings.</p>
            </div>
          </div>
        </Card>

        {/* Storage Integrations */}
        <Card className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> S3 Cloud Storage Details
          </h4>
          
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Storage Provider</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Cloudflare R2
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Bucket Name</span>
              <span className="font-mono font-semibold text-foreground">amazecc-pap</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Service API Endpoint</span>
              <span className="font-mono text-muted-foreground truncate max-w-[200px]" title="cb52977aee2b0c7693993aa0dc02b548.r2.cloudflarestorage.com">
                *.r2.cloudflarestorage.com
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Security Credentials</span>
              <Badge variant="success" size="sm">Encrypted & Signed</Badge>
            </div>
          </div>
        </Card>

        {/* Database Status */}
        <Card className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" /> PostgreSQL Database Status
          </h4>
          
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Database Engine</span>
              <span className="font-semibold text-foreground">Supabase PostgreSQL 15+</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Connection Pool</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Connected & Idle</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Tables Synced</span>
              <span className="font-semibold text-foreground">10 Tables</span>
            </div>
          </div>
        </Card>

        {/* Authentication Systems */}
        <Card className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Authentication Systems
          </h4>
          
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Auth Token Method</span>
              <span className="font-semibold text-foreground">HMAC SHA-256 Signature</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Token Validity Period</span>
              <span className="font-semibold text-foreground">7 Days</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Secure Cookie Policies</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strict SameSite & HttpOnly</span>
            </div>
          </div>
        </Card>

        {/* Theme Settings */}
        <Card className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-pink-600 dark:text-pink-400" /> Theme & Appearance
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold text-foreground">Theme Switcher</p>
                <p className="text-[11px] text-muted-foreground">Toggle between light and dark mode with accent colors</p>
              </div>
              <ThemeSwitcher />
            </div>

            <div className="pt-3 border-t border-border/50 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Current Mode</span>
                <span className="font-semibold text-foreground capitalize">
                  {typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'Dark' : 'Light'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Cache & Performance */}
        <Card className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-500" /> Cache & Performance
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-xs font-semibold text-foreground">Questions Cache</p>
                <p className="text-[11px] text-muted-foreground">~2,400 entries | 12 MB</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => clearCache('questions')}
                className="h-8"
              >
                {cacheCleared === 'questions' ? (
                  <span className="flex items-center text-emerald-600"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Cleared</span>
                ) : (
                  <span className="flex items-center"><Trash2 className="w-3.5 h-3.5 mr-1" /> Clear</span>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-xs font-semibold text-foreground">Papers Cache</p>
                <p className="text-[11px] text-muted-foreground">~850 entries | 45 MB</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => clearCache('papers')}
                className="h-8"
              >
                {cacheCleared === 'papers' ? (
                  <span className="flex items-center text-emerald-600"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Cleared</span>
                ) : (
                  <span className="flex items-center"><Trash2 className="w-3.5 h-3.5 mr-1" /> Clear</span>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold text-foreground">Thumbnail Cache</p>
                <p className="text-[11px] text-muted-foreground">~320 entries | 8 MB</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => clearCache('thumbnails')}
                className="h-8"
              >
                {cacheCleared === 'thumbnails' ? (
                  <span className="flex items-center text-emerald-600"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Cleared</span>
                ) : (
                  <span className="flex items-center"><Trash2 className="w-3.5 h-3.5 mr-1" /> Clear</span>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
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
              <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                <div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={notifications[key]}
                  onCheckedChange={(checked: boolean) => toggleNotification(key, checked)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Maintenance Mode */}
        <Card className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-500" /> Maintenance Mode
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold text-foreground">Maintenance Mode</p>
                <p className="text-[11px] text-muted-foreground">Block public access during maintenance</p>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={(checked: boolean) => setMaintenanceMode(checked)}
              />
            </div>

            {maintenanceMode && (
              <Textarea
                label="Maintenance Notice"
                value={maintenanceMessage}
                onChange={(e: any) => setMaintenanceMessage(e.target.value)}
                rows={3}
              />
            )}

            <div className="flex items-center justify-between py-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Current Status</span>
              <StatusBadge status={maintenanceMode ? 'error' : 'success'} />
            </div>
          </div>
        </Card>
      </div>

      {/* Data Retention & Cleanup */}
      <Card className="p-5 space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileClock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Data Retention & Cleanup Policy
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Audit Log Retention"
            value={retentionDays}
            onChange={(e: any) => setRetentionDays(e.target.value)}
            options={[
              { value: '30', label: '30 Days' },
              { value: '60', label: '60 Days' },
              { value: '90', label: '90 Days' },
              { value: '180', label: '180 Days' },
              { value: '365', label: '1 Year' }
            ]}
          />

          <Select
            label="Failed OCR Retention"
            defaultValue="30"
            options={[
              { value: '7', label: '7 Days' },
              { value: '14', label: '14 Days' },
              { value: '30', label: '30 Days' },
              { value: '60', label: '60 Days' }
            ]}
          />

          <div className="flex flex-col justify-end">
            <Button variant="outline" className="w-full flex items-center justify-center gap-1.5">
              <RotateCcw className="w-4 h-4" /> Run Cleanup Now
            </Button>
            <p className="text-[11px] text-muted-foreground mt-1 text-center">Last cleanup: 2 days ago</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
