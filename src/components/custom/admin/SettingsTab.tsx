'use client';
import React, { useState } from 'react';
import { 
  Settings, Server, Cloud, Shield, Database, Lock, Key, RefreshCcw
} from 'lucide-react';
import { GlassCard, SectionHeader } from '@/components/custom/admin/AdminUI';

export default function SettingsTab() {
  const [modelType, setModelType] = useState('qwen2.5vl:3b');
  const [confidenceThreshold, setConfidenceThreshold] = useState('0.75');

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

        {/* API Authentication */}
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
      </div>
    </div>
  );
}
