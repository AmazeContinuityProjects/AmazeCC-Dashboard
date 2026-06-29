'use client';
import React from 'react';
import { BarChart3, MessageSquare, Bus, ShieldCheck, LogOut, User, Users, GraduationCap, Building2 } from 'lucide-react';
import { ThemeSwitcher } from '@/components/custom/ThemeSwitcher';

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, requiredPermission: null },
  { id: 'qbank', label: 'Q-Bank', icon: MessageSquare, requiredPermission: null, subTabs: [{ id: 'queue', label: 'Queue' }, { id: 'courses', label: 'Courses' }] },
  { id: 'buses', label: 'Bus Database', icon: Bus, requiredPermission: null },
  { id: 'push', label: 'Push Broadcast', icon: ShieldCheck, requiredPermission: null },
  { id: 'fresher-resources', label: 'Fresher Resources', icon: GraduationCap, requiredPermission: 'fresher-resources' },
  { id: 'faculty-directories', label: 'Faculty Directories', icon: Building2, requiredPermission: 'faculty-directories' },
  { id: 'users', label: 'Users', icon: Users, requiredPermission: 'manage_users' },
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
  const filteredNavItems = adminNavItems.filter(item => {
    if (!item.requiredPermission) return true;
    if (userRole === 'superadmin') return true;
    return userPermissions.includes(item.requiredPermission);
  });

  const desktopNavItemClass = (isActive: boolean) =>
    `flex items-center w-full py-3 px-4 space-x-3 transition-all cursor-pointer rounded-2xl ${
      isActive
        ? 'text-white bg-blue-600 shadow-md shadow-blue-500/20'
        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 midnight:text-gray-400 midnight:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/50 midnight:hover:bg-white/[0.04]'
    }`;

  const desktopSubTabClass = (isActive: boolean) =>
    `text-left text-sm py-2 px-4 transition-colors rounded-xl w-full ${
      isActive ? 'text-blue-600 dark:text-blue-400 midnight:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-900/20 midnight:bg-blue-900/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 midnight:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 midnight:hover:bg-white/[0.02]'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 midnight:bg-black flex relative">
      
      {/* Top Header (Desktop & Mobile) */}
      <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-white/70 dark:bg-slate-900/70 midnight:bg-black/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 midnight:border-white/10 flex items-center justify-between px-4 md:px-6 transition-colors">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="AmazeCC Logo" className="w-8 h-8 object-contain drop-shadow-md" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white midnight:text-white tracking-tight">AmazeCC</h2>
          <span className="hidden md:inline-block px-2.5 py-1 bg-gray-100/80 dark:bg-slate-800/80 midnight:bg-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 midnight:text-gray-300 ml-2">
            {username}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <button onClick={() => setActiveTab('profile')} className={`p-2 rounded-xl transition-all border shadow-sm ${activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-900/40 midnight:bg-blue-900/40 text-blue-600 dark:text-blue-400 midnight:text-blue-400 border-blue-200 dark:border-blue-800 midnight:border-blue-800/50' : 'bg-white/60 dark:bg-slate-800/60 midnight:bg-white/10 text-gray-600 dark:text-gray-300 midnight:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/60 midnight:hover:bg-white/20 border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10'}`} title="Profile">
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Floating Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed left-6 top-24 bottom-6 z-30 bg-white/70 dark:bg-slate-900/70 midnight:bg-white/[0.04] backdrop-blur-3xl border border-gray-200/50 dark:border-gray-800/50 midnight:border-white/10 rounded-3xl shadow-xl overflow-hidden transition-colors">
        {/* Stats Grid inside Sidebar */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 p-5 border-b border-gray-200/50 dark:border-gray-800/50 midnight:border-white/10 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-slate-800/20 midnight:to-transparent">
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/60 dark:bg-slate-800/60 midnight:bg-white/5 border border-gray-100/50 dark:border-gray-700/50 midnight:border-white/5 shadow-sm">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 midnight:text-gray-400 uppercase tracking-wider mb-1 font-semibold">Queue</span>
              <span className="font-bold text-base text-gray-900 dark:text-white midnight:text-white">{stats.queueCount}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/60 dark:bg-slate-800/60 midnight:bg-white/5 border border-gray-100/50 dark:border-gray-700/50 midnight:border-white/5 shadow-sm">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 midnight:text-gray-400 uppercase tracking-wider mb-1 font-semibold">Users</span>
              <span className="font-bold text-base text-gray-900 dark:text-white midnight:text-white">{stats.activeUsers}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/60 dark:bg-slate-800/60 midnight:bg-white/5 border border-gray-100/50 dark:border-gray-700/50 midnight:border-white/5 shadow-sm">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 midnight:text-gray-400 uppercase tracking-wider mb-1 font-semibold">Routes</span>
              <span className="font-bold text-base text-gray-900 dark:text-white midnight:text-white">{stats.busRoutes}</span>
            </div>
          </div>
        )}
        
        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto w-full py-5 px-4 space-y-2" style={{ scrollbarWidth: 'none' }}>
          {filteredNavItems.map((item) => (
            <div key={item.id} className="w-full">
              <button 
                onClick={() => { 
                  setActiveTab(item.id); 
                  if (item.subTabs && item.subTabs[0]) setActiveSubTab(item.subTabs[0].id); 
                }} 
                className={desktopNavItemClass(activeTab === item.id)} 
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold tracking-wide">{item.label}</span>
              </button>
              
              {activeTab === item.id && item.subTabs && (
                <div className="flex flex-col mt-2 mb-3 ml-11 pr-2 space-y-1">
                  {item.subTabs.map((sub) => (
                    <button 
                      key={sub.id} 
                      onClick={() => setActiveSubTab(sub.id)} 
                      className={desktopSubTabClass(activeSubTab === sub.id)}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50 midnight:border-white/10 bg-gray-50/50 dark:bg-slate-800/30 midnight:bg-transparent">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-red-600 dark:text-red-400 midnight:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 midnight:hover:bg-red-900/30 transition-all font-semibold text-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/50 midnight:hover:border-red-900/50">
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Floating Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-white/80 dark:bg-slate-900/80 midnight:bg-black/60 backdrop-blur-3xl border border-gray-200/50 dark:border-gray-800/50 midnight:border-white/10 rounded-3xl shadow-2xl flex items-center justify-around p-2 transition-colors">
        {filteredNavItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => { setActiveTab(item.id); if(item.subTabs) setActiveSubTab(item.subTabs[0].id); }} 
            className={`p-3.5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' : 'text-gray-500 dark:text-gray-400 midnight:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 midnight:hover:bg-white/10'}`}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
        {/* Sub-tabs modal / secondary nav could be added for mobile if needed, but for now we'll keep it simple */}
        <button onClick={onLogout} className="p-3.5 rounded-2xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 midnight:hover:bg-red-900/20 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full min-h-screen pt-24 md:pl-[18rem] pb-28 md:pb-6 overflow-y-auto overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full">
          
          {/* Mobile Sub-tabs (only visible on mobile if active tab has subtabs) */}
          <div className="md:hidden mb-6">
            {filteredNavItems.map(item => {
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