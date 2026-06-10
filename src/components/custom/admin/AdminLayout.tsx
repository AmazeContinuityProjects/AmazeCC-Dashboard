'use client';
import React, { useState } from 'react';
import { RefreshCcw, User, LayoutGrid, MessageSquare, Bus, ShieldCheck, LogOut, Menu, BarChart3, ChevronDown, Users } from 'lucide-react';
import { IconToggle } from '@/components/custom/toggle';

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'qbank', label: 'Q-Bank', icon: MessageSquare, subTabs: [{ id: 'queue', label: 'Queue' }, { id: 'courses', label: 'Courses' }] },
  { id: 'buses', label: 'Bus Database', icon: Bus },
  { id: 'push', label: 'Push Broadcast', icon: ShieldCheck },
  { id: 'users', label: 'Users', icon: Users },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  onLogout: () => void;
  username?: string;
  userRole?: 'superadmin' | 'admin';
  stats?: { queueCount: number; busRoutes: number; totalPapers: number; activeUsers: number };
}

export default function AdminLayout({ children, activeTab, setActiveTab, activeSubTab, setActiveSubTab, onLogout, username = 'Admin', userRole = 'admin', stats }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItemClass = (isActive: boolean) =>
    `flex flex-col md:flex-row items-center justify-center flex-1 md:flex-none w-full py-2 md:py-4 ${
      isCollapsed ? 'md:px-0 md:justify-center md:space-x-0' : 'md:px-6 md:justify-start md:space-x-4'
    } space-y-1 md:space-y-0 transition-colors cursor-pointer md:border-l-4 rounded-full md:rounded-none ${
      isActive
        ? 'text-blue-600 dark:text-blue-400 midnight:text-blue-400 bg-blue-50/50 dark:bg-slate-800/50 midnight:bg-gray-900/50 border-transparent md:border-blue-600 dark:md:border-blue-400 midnight:md:border-blue-400'
        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 midnight:text-gray-400 midnight:hover:text-gray-200 border-transparent'
    }`;

  const subTabClass = (isActive: boolean) =>
    `text-left text-sm py-1.5 transition-colors ${
      isActive ? 'text-blue-600 dark:text-blue-400 midnight:text-blue-400 font-medium' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 midnight:hover:text-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 midnight:bg-black flex">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed bottom-6 md:top-4 left-4 right-4 md:left-4 md:right-auto z-40 flex items-center md:items-start justify-around md:justify-start w-auto ${isCollapsed ? 'md:w-20' : 'md:w-64'} md:h-[calc(100vh-2rem)] md:flex-col bg-white/60 dark:bg-slate-900/50 midnight:bg-white/[0.02] backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] midnight:shadow-[0_8px_30px_rgba(255,255,255,0.05)] rounded-full md:rounded-3xl md:overflow-y-auto transition-all duration-300 py-1 md:py-0 px-2 md:px-0`}
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Header */}
        <div className={`hidden md:flex flex-col w-full p-4 mb-2 border-b border-gray-200 dark:border-gray-800 midnight:border-gray-800 pt-6 ${isCollapsed ? 'items-center' : ''}`}>
          <div className={`flex ${isCollapsed ? 'flex-col gap-4' : 'justify-between items-center'} mb-4 w-full`}>
            {!isCollapsed && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 midnight:text-white tracking-tight">AmazeCC</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-400 truncate max-w-[120px]">{username}</p>
              </div>
            )}
            <div className={`flex ${isCollapsed ? 'flex-col' : 'items-center'} gap-2`}>
              <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 midnight:hover:bg-gray-800 transition-colors" title="Toggle Sidebar">
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300 midnight:text-gray-300" />
              </button>
              {!isCollapsed && (
                <>
                  <IconToggle />
                  <button onClick={() => setActiveTab('profile')} className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 midnight:hover:bg-gray-800 transition-colors ${activeTab === 'profile' ? 'bg-blue-50 dark:bg-slate-800/50 midnight:bg-gray-900/50' : ''}`} title="Profile">
                    <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400 midnight:text-blue-400' : 'text-gray-600 dark:text-gray-300 midnight:text-gray-300'}`} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          {!isCollapsed && stats && (
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 midnight:bg-gray-800/50 border border-gray-100 dark:border-gray-800 midnight:border-gray-700">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5 font-medium">Queue</span>
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100 midnight:text-gray-100">{stats.queueCount}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 midnight:bg-gray-800/50 border border-gray-100 dark:border-gray-800 midnight:border-gray-700">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5 font-medium">Users</span>
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100 midnight:text-gray-100">{stats.activeUsers}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 midnight:bg-gray-800/50 border border-gray-100 dark:border-gray-800 midnight:border-gray-700">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5 font-medium">Routes</span>
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100 midnight:text-gray-100">{stats.busRoutes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex md:flex-col flex-1 md:overflow-y-auto w-full gap-1 md:py-2 overflow-y-auto md:snap-none" style={{ scrollbarWidth: 'none' }}>
          {adminNavItems.map((item) => (
            <React.Fragment key={item.id}>
              <button onClick={() => { setActiveTab(item.id); if (item.subTabs && item.subTabs[0]) setActiveSubTab(item.subTabs[0].id); }} className={navItemClass(activeTab === item.id)} title={item.label}>
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className={`text-[10px] md:text-sm font-medium ${isCollapsed ? '!hidden' : ''}`}>{item.label}</span>}
              </button>
              {activeTab === item.id && item.subTabs && !isCollapsed && (
                <div className="hidden md:flex flex-col w-full pl-12 pr-4 py-1 space-y-1 bg-white dark:bg-slate-900 midnight:bg-black">
                  {item.subTabs.map((sub) => (
                    <button key={sub.id} onClick={() => setActiveSubTab(sub.id)} className={subTabClass(activeSubTab === sub.id)}>
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Bottom - Profile (mobile) */}
        <div className="hidden md:block w-full flex-grow" />
        <button onClick={() => setActiveTab('profile')} className={`${navItemClass(activeTab === 'profile')} md:hidden`}>
          <User className="w-5 h-5 shrink-0" />
          <span className="hidden md:block text-[10px] md:text-sm font-medium">Profile</span>
        </button>
        <div className="hidden md:block p-4 border-t border-gray-200 dark:border-gray-800 midnight:border-gray-800 w-full">
          <button onClick={onLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 midnight:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 midnight:hover:bg-red-900/20 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <div className="w-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}