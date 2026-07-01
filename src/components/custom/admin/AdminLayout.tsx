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
      { id: 'qbank', label: 'OCR Queue', icon: RefreshCcw, requiredPermission: null, subTabs: [{ id: 'queue', label: 'Queue' }, { id: 'courses', label: 'Courses' }] },
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
      { id: 'cabshare', label: 'Cab Share', icon: Bus, requiredPermission: null },
      { id: 'push', label: 'Push Broadcast', icon: ShieldCheck, requiredPermission: null },
      { id: 'users', label: 'Users', icon: Users, requiredPermission: 'manage_users' },
      { id: 'clubs', label: 'Clubs & Chapters', icon: Building2, requiredPermission: null },
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
  `relative flex items-center w-full gap-2.5 px-3 py-2 rounded-sm transition-all duration-150 group ${
  isActive
  ? 'text-accent bg-accent/10 shadow-small'
  : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
  }`;

 const subTabClass = (isActive: boolean) =>
  `flex items-center gap-2 text-sm py-1.5 pl-4 transition-colors ${
  isActive ? 'text-accent font-medium' : 'text-muted-foreground hover:text-foreground'
  }`;

 return (
  <div className="min-h-screen bg-background flex overflow-x-hidden relative">
  {/* Ambient Background Glows */}
  <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]" />
  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
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
  animate={{ width: isCollapsed ? 80 : 260 }}
  className={`fixed left-0 top-0 bottom-0 z-50 hidden md:flex flex-col bg-card/80 backdrop-blur-2xl border-r border-border/50 transition-all duration-300 ease-in-out`}
  >
  {/* Sidebar Header */}
  <div className="p-5 flex items-center justify-between border-b border-border/50">
  <AnimatePresence mode="wait">
  {!isCollapsed && (
  <motion.div
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -10 }}
  className="flex items-center gap-2"
  >
  <div className="w-8 h-8 rounded-sm bg-accent flex items-center justify-center text-accent-foreground font-bold shadow-small">
  A
  </div>
  <div>
  <h2 className="text-lg font-bold text-foreground tracking-tight leading-none">AmazeCC</h2>
  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest font-bold opacity-60">Admin Portal</p>
  </div>
  </motion.div>
  )}
  </AnimatePresence>
  <button 
  onClick={() => setIsCollapsed(!isCollapsed)} 
  className="p-1.5 rounded-sm hover:bg-accent/10 transition-colors text-muted-foreground"
  >
  <Menu className="w-4 h-4" />
  </button>
  </div>

  {/* Navigation Content */}
  <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6 no-scrollbar">
  {filteredNavGroups.map((group, gIdx) => (
  <div key={gIdx} className="space-y-1.5">
  {!isCollapsed && (
  <motion.p 
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
  >
  {group.label}
  </motion.p>
  )}
  <div className="space-y-0.5">
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
  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-muted-foreground'}`} />
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
  <ChevronDown className="w-3 h-3 opacity-50" />
  )}
  </button>

  <AnimatePresence>
  {isActive && item.subTabs && !isCollapsed && (
  <motion.div 
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  className="overflow-hidden ml-8 border-l border-border space-y-0.5 mt-0.5"
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
  <div className="p-3 border-t border-border/50 space-y-3">
  {!isCollapsed && (
  <div className="bg-muted/50 rounded-sm p-3 border border-border/50">
  <div className="flex items-center gap-2.5">
  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
  <User className="w-4 h-4" />
  </div>
  <div className="flex-1 min-w-0">
  <p className="text-sm font-bold text-foreground truncate">{username}</p>
  <p className="text-[10px] text-muted-foreground truncate uppercase font-bold">{userRole}</p>
  </div>
  </div>
  <div className="mt-3 flex items-center justify-between">
  <IconToggle />
  </div>
  </div>
  )}
  
  <button 
  onClick={onLogout} 
  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-destructive hover:bg-destructive/10 transition-all font-semibold ${isCollapsed ? 'justify-center' : ''}`}
  >
  <LogOut className="w-4 h-4 shrink-0" />
  {!isCollapsed && <span className="text-sm">Sign Out</span>}
  </button>
  </div>
 </motion.div>

  {/* Mobile Bottom Navigation */}
  <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 h-14 bg-card/80 backdrop-blur-2xl border border-border/50 shadow-medium rounded-md flex items-center justify-around px-1">
  {mobileNavItems.map((item) => (
  <button 
  key={item.id}
  onClick={() => setActiveTab(item.id)}
  className={`p-2 rounded-sm transition-all ${activeTab === item.id ? 'bg-accent text-accent-foreground shadow-small scale-110 -translate-y-1' : 'text-muted-foreground'}`}
  >
  <item.icon className="w-5 h-5" />
  </button>
  ))}
  <button 
  onClick={() => setIsMobileOpen(true)}
  className="p-2 text-muted-foreground"
  >
  <Menu className="w-5 h-5" />
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
  className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-card rounded-t-lg p-5 shadow-large border-t border-border/50 max-h-[80vh] overflow-y-auto"
  >
  <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
  <div className="space-y-6">
  {filteredNavGroups.map((group, gIdx) => (
  <div key={gIdx} className="space-y-3">
  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{group.label}</p>
  <div className="grid grid-cols-2 gap-3">
  {group.items.map((item) => (
  <button
  key={item.id}
  onClick={() => { setActiveTab(item.id); setIsMobileOpen(false); }}
  className={`flex flex-col items-center gap-2.5 p-3 rounded-sm border transition-all ${
  activeTab === item.id 
  ? 'bg-accent/10 border-accent/30 text-accent' 
  : 'bg-muted/50 border-border/50 text-muted-foreground'
  }`}
  >
  <item.icon className="w-5 h-5" />
  <span className="text-xs font-bold">{item.label}</span>
  </button>
  ))}
  </div>
  </div>
  ))}
  <button 
  onClick={onLogout}
  className="w-full py-3 rounded-sm bg-destructive/10 text-destructive font-bold border border-destructive/20 mt-3"
  >
  Sign Out
  </button>
  </div>
  </motion.div>
  )}
  </AnimatePresence>

  {/* Main Content Area */}
  <main 
  className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-[260px]'} pb-20 md:pb-0`}
  >
  <div className="w-full p-4 md:p-6 lg:p-8 animate-fadeIn">
  {/* Mobile Sub-tabs (only visible on mobile if active tab has subtabs) */}
  <div className="md:hidden mb-4">
  {filteredNavGroups.flatMap(g => g.items).map(item => {
  if (activeTab === item.id && item.subTabs) {
  return (
  <div key={item.id} className="flex gap-1.5 p-1 bg-muted/50 rounded-sm border border-border/50 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
  {item.subTabs.map(sub => (
  <button
  key={sub.id}
  onClick={() => setActiveSubTab(sub.id)}
  className={`px-3 py-1.5 text-sm font-semibold rounded-sm whitespace-nowrap transition-all flex-1 ${activeSubTab === sub.id ? 'bg-card shadow-small text-accent' : 'text-muted-foreground hover:text-foreground'}`}
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
