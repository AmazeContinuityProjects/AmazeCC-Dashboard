'use client';
import React, { useState, useEffect } from 'react';
import { MessageSquare, Bus, FileText, ShieldCheck, TrendingUp, Clock, CheckCircle, AlertTriangle, Users, Bell } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GlassCard, SectionHeader, LoadingSpinner } from '@/components/custom/admin/AdminUI';

interface DashboardStats {
  queueCount: number;
  busRoutes: number;
  totalPapers: number;
  approvedPapers: number;
  pendingReview: number;
  failedOCR: number;
  activeUsers: number;
  vitolSubscribers: number;
}

interface AdminLandingPageProps {
  setActiveTab: (tab: string) => void;
  setActiveSubTab: (tab: string) => void;
  stats: DashboardStats;
}

export default function AdminLandingPage({ setActiveTab, setActiveSubTab, stats }: AdminLandingPageProps) {
  return (
    <div className="space-y-8">
      <SectionHeader title="Admin Dashboard" description="Overview of system health and pending tasks." />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button onClick={() => { setActiveTab('qbank'); setActiveSubTab('queue'); }} className="text-left">
          <GlassCard hover className="cursor-pointer h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50/80 dark:bg-blue-900/20 midnight:bg-blue-900/30 rounded-xl text-blue-500 dark:text-blue-400 midnight:text-blue-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white midnight:text-white">{stats.queueCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">Pending Queue</p>
              </div>
            </div>
          </GlassCard>
        </button>

        <button onClick={() => setActiveTab('buses')} className="text-left">
          <GlassCard hover className="cursor-pointer h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50/80 dark:bg-green-900/20 midnight:bg-green-900/30 rounded-xl text-green-500 dark:text-green-400 midnight:text-green-400">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white midnight:text-white">{stats.busRoutes}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">Bus Routes</p>
              </div>
            </div>
          </GlassCard>
        </button>

        <button onClick={() => { setActiveTab('qbank'); setActiveSubTab('courses'); }} className="text-left">
          <GlassCard hover className="cursor-pointer h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50/80 dark:bg-purple-900/20 midnight:bg-purple-900/30 rounded-xl text-purple-500 dark:text-purple-400 midnight:text-purple-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white midnight:text-white">{stats.totalPapers}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">Total Papers</p>
              </div>
            </div>
          </GlassCard>
        </button>

        <GlassCard hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50/80 dark:bg-amber-900/20 midnight:bg-amber-900/30 rounded-xl text-amber-500 dark:text-amber-400 midnight:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white midnight:text-white">{stats.pendingReview}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">Awaiting Review</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-900/20 midnight:bg-emerald-900/30 rounded-xl text-emerald-500 dark:text-emerald-400 midnight:text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white midnight:text-white">{stats.approvedPapers}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">Approved</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50/80 dark:bg-red-900/20 midnight:bg-red-900/30 rounded-xl text-red-500 dark:text-red-400 midnight:text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white midnight:text-white">{stats.failedOCR}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">Failed OCR</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-50/80 dark:bg-cyan-900/20 midnight:bg-cyan-900/30 rounded-xl text-cyan-500 dark:text-cyan-400 midnight:text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white midnight:text-white">{stats.activeUsers}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">Active Users</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50/80 dark:bg-indigo-900/20 midnight:bg-indigo-900/30 rounded-xl text-indigo-500 dark:text-indigo-400 midnight:text-indigo-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white midnight:text-white">{stats.vitolSubscribers}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">VTOL Subscribers</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white midnight:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={() => { setActiveTab('qbank'); setActiveSubTab('queue'); }} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 midnight:bg-blue-900/15 hover:bg-blue-100/80 dark:hover:bg-blue-900/20 midnight:hover:bg-blue-900/25 transition-colors text-left">
            <MessageSquare className="w-5 h-5 text-blue-500 dark:text-blue-400 midnight:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white midnight:text-white">Review Queue</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-400">{stats.queueCount} pending</p>
            </div>
          </button>
          <button onClick={() => setActiveTab('buses')} className="flex items-center gap-3 p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10 midnight:bg-green-900/15 hover:bg-green-100/80 dark:hover:bg-green-900/20 midnight:hover:bg-green-900/25 transition-colors text-left">
            <Bus className="w-5 h-5 text-green-500 dark:text-green-400 midnight:text-green-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white midnight:text-white">Manage Buses</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-400">{stats.busRoutes} routes</p>
            </div>
          </button>
          <button onClick={() => setActiveTab('push')} className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 midnight:bg-purple-900/15 hover:bg-purple-100/80 dark:hover:bg-purple-900/20 midnight:hover:bg-purple-900/25 transition-colors text-left">
            <ShieldCheck className="w-5 h-5 text-purple-500 dark:text-purple-400 midnight:text-purple-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white midnight:text-white">Push Broadcast</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-400">Send notification</p>
            </div>
          </button>
          <button onClick={() => { setActiveTab('qbank'); setActiveSubTab('courses'); }} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 midnight:bg-amber-900/15 hover:bg-amber-100/80 dark:hover:bg-amber-900/20 midnight:hover:bg-amber-900/25 transition-colors text-left">
            <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400 midnight:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white midnight:text-white">Q-Bank Courses</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-400">{stats.totalPapers} papers</p>
            </div>
          </button>
        </div>
      </GlassCard>

      {/* System Info */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white midnight:text-white mb-3">System Info</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400 midnight:text-gray-400">API Endpoint</p>
            <p className="font-mono text-gray-900 dark:text-white midnight:text-white">api.amazecc.com</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 midnight:text-gray-400">Environment</p>
            <p className="font-mono text-gray-900 dark:text-white midnight:text-white">Production</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}