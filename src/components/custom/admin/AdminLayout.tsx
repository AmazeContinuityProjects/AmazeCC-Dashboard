'use client';
import React, { useState } from 'react';
import { 
  RefreshCcw, User, Users, LayoutGrid, MessageSquare, Bus, ShieldCheck, LogOut, 
  Menu, BarChart3, ChevronDown, FileText, Database, History, 
  Image, Settings, GraduationCap, Building2, Cpu, Wallet, Boxes, Receipt
} from 'lucide-react';
import { 
  Sidebar as ReusableSidebar, 
  SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarFooter, ThemeSwitcher
} from "@amazecontinuityprojects/amazeui";

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
    label: 'GoRoBo',
    items: [
      { id: 'gorobo-inventory', label: 'Inventory', icon: Boxes, requiredPermission: 'gorobo' },
      { id: 'gorobo-orders', label: 'Orders', icon: Receipt, requiredPermission: 'gorobo' },
      { id: 'gorobo-wallet', label: 'Amaze Wallet', icon: Wallet, requiredPermission: 'gorobo' },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'storage', label: 'Storage', icon: Database, requiredPermission: null },
      { id: 'buses', label: 'Transport', icon: Bus, requiredPermission: 'transport' },
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

const navItemClass = (isActive: boolean) =>
  `relative flex items-center w-full gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
    isActive
      ? 'text-primary bg-primary/10 font-semibold shadow-xs border border-primary/20 dark:bg-primary/15'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent active:scale-[0.99]'
  }`;

const subTabClass = (isActive: boolean) =>
  `flex items-center gap-2.5 text-xs py-2 px-3 w-full text-left transition-all duration-150 rounded-lg cursor-pointer ${
    isActive
      ? 'text-primary font-semibold bg-primary/10'
      : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted/40'
  }`;

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

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden relative">

      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm animate-fadeIn" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <ReusableSidebar isOpen={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <SidebarHeader>
          <div className="flex flex-row items-center gap-2.5 w-full">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center text-info font-bold shadow-sm shrink-0">
                <span className="text-sm">A</span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground tracking-tight truncate">AmazeCC</p>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold truncate">Admin Portal</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isCollapsed && <ThemeSwitcher className="" />}
              <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors text-muted-foreground">
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {filteredNavGroups.map((group, gIdx) => (
            <SidebarGroup key={gIdx}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'gorobo-inventory' && activeTab === 'gorobo');
                return (
                  <div key={item.id} className="w-full">
                    <button
                      onClick={() => { 
                        setActiveTab(item.id); 
                        if (item.subTabs && item.subTabs[0]) setActiveSubTab(item.subTabs[0].id); 
                      }}
                      className={navItemClass(isActive)}
                      title={isCollapsed ? item.label : ''}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground'}`} />
                      {!isCollapsed && (
                        <span className="text-sm flex-1 text-left truncate">
                          {item.label}
                        </span>
                      )}
                      {isActive && !isCollapsed && item.subTabs && (
                        <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      )}
                    </button>

                    {isActive && item.subTabs && !isCollapsed && (
                      <div className="ml-8 border-l border-border/50 space-y-0.5 mt-0.5 pl-2">
                        {item.subTabs.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setActiveSubTab(sub.id)}
                            className={subTabClass(activeSubTab === sub.id)}
                          >
                            {activeSubTab === sub.id ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                            )}
                            <span className="truncate">{sub.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-4 hidden group-hover:block z-50 px-3 py-1.5 rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs font-medium whitespace-nowrap shadow-xl">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45" />
                      </div>
                    )}
                  </div>
                );
              })}
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          {!isCollapsed && (
            <div className="bg-muted/50 rounded-lg p-3 border border-border/50 w-full">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{username}</p>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold truncate">{userRole}</p>
                </div>
              </div>
            </div>
          )}
          <button 
            onClick={onLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-danger hover:bg-danger/10 transition-all font-semibold w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </SidebarFooter>
      </ReusableSidebar>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 h-14 bg-card/85 backdrop-blur-2xl border border-border/60 shadow-xl rounded-2xl flex items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'gorobo-inventory' && activeTab === 'gorobo');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-card rounded-t-3xl p-5 shadow-2xl border-t border-border max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-6" />
          <div className="space-y-6">
            {filteredNavGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{group.label}</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || (item.id === 'gorobo-inventory' && activeTab === 'gorobo');
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setIsMobileOpen(false); }}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary/10 border-primary/30 text-primary font-bold shadow-xs'
                            : 'bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-semibold text-center leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              onClick={onLogout}
              className="w-full py-3.5 rounded-xl bg-destructive/10 text-destructive font-bold border border-destructive/20 hover:bg-destructive/20 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 transition-all duration-300 md:ml-[280px] md:mr-4 pb-20 md:pb-0`}>
        <div className="w-full p-4 md:p-6 lg:p-8 animate-fadeIn">
          {/* Mobile Sub-tabs */}
          <div className="md:hidden mb-4">
            {filteredNavGroups.flatMap(g => g.items).map(item => {
              if (activeTab === item.id && item.subTabs) {
                return (
                  <div key={item.id} className="flex gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {item.subTabs.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubTab(sub.id)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-all flex-1 cursor-pointer ${
                          activeSubTab === sub.id ? 'bg-card shadow-xs text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
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
