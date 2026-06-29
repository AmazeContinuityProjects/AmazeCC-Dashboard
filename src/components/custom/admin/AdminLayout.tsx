'use client';
import React, { useState } from 'react';
import { 
  RefreshCcw, User, LayoutGrid, MessageSquare, Bus, ShieldCheck, LogOut, 
  Menu, BarChart3, ChevronDown, Users, FileText, Database, History, 
  Image, Settings, Circle, ChevronRight, GraduationCap, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconToggle } from '@/components/custom/toggle';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Overview', icon: BarChart3, requiredPermission: null },
      { id: 'audit_logs', label: 'Audit Logs', icon: History, requiredPermission: null },
    ]
  },
  {
    label: 'Content',
    items: [
      { id: 'papers', label: 'Papers', icon: FileText, requiredPermission: null },
      { id: 'qbank', label: 'OCR Queue', icon: RefreshCcw, requiredPermission: null, subTabs: [{ id: 'queue', label: 'Queue' }] },
      { id: 'questions', label: 'Questions', icon: LayoutGrid, requiredPermission: null },
      { id: 'diagrams', label: 'Diagrams', icon: Image, requiredPermission: null },
      { id: 'fresher-resources', label: 'Fresher Resources', icon: GraduationCap, requiredPermission: 'fresher-resources' },
      { id: 'faculty-directories', label: 'Faculty Directories', icon: Building2, requiredPermission: 'faculty-directories' },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'storage', label: 'Storage', icon: Database, requiredPermission: null },
      { id: 'buses', label: 'Bus Database', icon: Bus, requiredPermission: null },
      { id: 'push', label: 'Push Broadcast', icon: ShieldCheck, requiredPermission: null },
      { id: 'users', label: 'Users', icon: Users, requiredPermission: 'manage_users' },
      { id: 'settings', label: 'Settings', icon: Settings, requiredPermission: null },
    ]
  }
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
  userPermissions?: string[];
}

export default function AdminLayout({ children, activeTab, setActiveTab, activeSubTab, setActiveSubTab, onLogout, username = 'Admin', userRole = 'admin', stats, userPermissions = [] }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.requiredPermission) return true;
      if (userRole === 'superadmin') return true;
      return userPermissions.includes(item.requiredPermission);
    })
  })).filter(group => group.items.length > 0);

  const mobileNavItems = (() => {
    const overviewItems = filteredNavGroups.find(g => g.label === 'Overview')?.items || [];
    const contentItems = filteredNavGroups.find(g => g.label === 'Content')?.items || [];
    const systemItems = filteredNavGroups.find(g => g.label === 'System')?.items || [];
    return overviewItems.slice(0, 1).concat(contentItems.slice(0, 2), systemItems.slice(0, 1));
  })();

  const navItemClass = (isActive: boolean) =>
    `relative flex items-center w-full gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
      isActive
        ? 'text-blue-600 dark:text-blue-400 midnight:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20 midnight:bg-blue-900/10 shadow-sm shadow-blue-500/5'
        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 midnight:text-gray-400 midnight:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/40 midnight:hover:bg-white/[0.04]'
    }`;

  const subTabClass = (isActive: boolean) =>
    `flex items-center gap-2 text-sm py-1.5 pl-4 transition-colors ${
      isActive ? 'text-blue-600 dark:text-blue-400 midnight:text-blue-400 font-medium' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 midnight:hover:text-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 midnight:bg-black flex overflow-x-hidden relative">
      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 dark:bg-blue-500/10 midnight:bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 midnight:bg-emerald-500/5 blur-[120px]" />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm" 
            onClick={() => setIsMobileOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.div
        animate={{ width: isCollapsed ? 80 : 280 }}
        className={`fixed left-0 top-0 bottom-0 z-50 hidden md:flex flex-col bg-white/70 dark:bg-slate-900/80 midnight:bg-white/[0.02] backdrop-blur-2xl border-r border-gray-200/50 dark:border-gray-800/50 midnight:border-white/10 transition-all duration-300 ease-in-out`}
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-200/50 dark:border-gray-800/50 midnight:border-white/5">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                  A
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 midnight:text-white tracking-tight leading-none">AmazeCC</h2>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold opacity-60">Admin Portal</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 no-scrollbar">
          {filteredNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {!isCollapsed && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"
                >
                  {group.label}
                </motion.p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <div key={item.id} className="relative">
                      <button 
                        onClick={() => { 
                          setActiveTab(item.id); 
                          if (item.subTabs && item.subTabs[0]) setActiveSubTab(item.subTabs[0].id); 
                        }} 
                        className={navItemClass(isActive)}
                        title={isCollapsed ? item.label : ''}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                        {!isCollapsed && (
                          <motion.span 
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-sm font-medium flex-1 text-left"
                          >
                            {item.label}
                          </motion.span>
                        )}
                        {isActive && !isCollapsed && item.subTabs && (
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isActive && item.subTabs && !isCollapsed && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden ml-9 border-l border-gray-200 dark:border-gray-800 space-y-1 mt-1"
                          >
                            {item.subTabs.map((sub) => (
                              <button 
                                key={sub.id} 
                                onClick={() => setActiveSubTab(sub.id)} 
                                className={subTabClass(activeSubTab === sub.id)}
                              >
                                {activeSubTab === sub.id && <Circle className="w-1.5 h-1.5 fill-current" />}
                                {sub.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50 midnight:border-white/5 space-y-4">
          {!isCollapsed && (
            <div className="bg-gray-50/50 dark:bg-slate-800/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{username}</p>
                  <p className="text-[10px] text-gray-500 truncate uppercase font-bold">{userRole}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <IconToggle />
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          <button 
            onClick={onLogout} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-semibold ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </motion.div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 h-16 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-2xl flex items-center justify-around px-2">
        {mobileNavItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-110 -translate-y-2' : 'text-gray-500'}`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-3 text-gray-500"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-white dark:bg-slate-900 rounded-t-[32px] p-6 shadow-2xl border-t border-gray-200 dark:border-gray-800 max-h-[80vh] overflow-y-auto"
          >
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-8" />
            <div className="space-y-8">
              {filteredNavGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-4">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{group.label}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setIsMobileOpen(false); }}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                          activeTab === item.id 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' 
                            : 'bg-gray-50 dark:bg-slate-800/40 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button 
                onClick={onLogout}
                className="w-full py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-800 mt-4"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main 
        className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-[280px]'} pb-24 md:pb-0`}
      >
        <div className="w-full p-4 md:p-8 lg:p-12 animate-fadeIn">
          {/* Mobile Sub-tabs (only visible on mobile if active tab has subtabs) */}
          <div className="md:hidden mb-6">
            {filteredNavGroups.flatMap(g => g.items).map(item => {
              if (activeTab === item.id && item.subTabs) {
                return (
                  <div key={item.id} className="flex gap-2 p-1 bg-white/60 dark:bg-slate-900/60 midnight:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 midnight:border-white/10 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {item.subTabs.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubTab(sub.id)}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all flex-1 ${activeSubTab === sub.id ? 'bg-white dark:bg-slate-800 midnight:bg-white/10 shadow-sm text-blue-600 dark:text-blue-400 midnight:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                );
              }
              return null;
            })}
          </div>
          {children}
        </div>
      </main>

    </div>
  );
}
