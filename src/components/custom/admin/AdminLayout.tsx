'use client';
import React, { useState } from 'react';
import { 
  RefreshCcw, User, Users, LayoutGrid, Bus, ShieldCheck, LogOut, 
  Menu, BarChart3, ChevronDown, FileText, Database, History, 
  Image, Settings, GraduationCap, Building2, Wallet, Boxes, Receipt, X
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
    label: 'Content Management',
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
    label: 'GoRoBo Services',
    items: [
      { id: 'gorobo-inventory', label: 'Inventory', icon: Boxes, requiredPermission: 'gorobo' },
      { id: 'gorobo-orders', label: 'Orders', icon: Receipt, requiredPermission: 'gorobo' },
      { id: 'gorobo-wallet', label: 'Amaze Wallet', icon: Wallet, requiredPermission: 'gorobo' },
    ]
  },
  {
    label: 'System & Utilities',
    items: [
      { id: 'storage', label: 'Storage', icon: Database, requiredPermission: null },
      { id: 'buses', label: 'Transport', icon: Bus, requiredPermission: 'transport' },
      { id: 'cabshare', label: 'Cab Share', icon: Bus, requiredPermission: null },
      { id: 'push', label: 'Push Broadcast', icon: ShieldCheck, requiredPermission: null },
      { id: 'users', label: 'User Management', icon: Users, requiredPermission: 'manage_users' },
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
  `relative flex items-center w-full gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer group ${
    isActive
      ? 'text-accent font-semibold bg-accent/10 border border-accent/25 shadow-sm'
      : 'text-muted-foreground hover:text-foreground hover:bg-card/80 border border-transparent active:scale-[0.98]'
  }`;

const subTabClass = (isActive: boolean) =>
  `flex items-center gap-2.5 text-xs py-2 px-3 w-full text-left transition-all duration-150 rounded-lg cursor-pointer ${
    isActive
      ? 'text-accent font-semibold bg-accent/15'
      : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted/40'
  }`;

export default function AdminLayout({
  children,
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  onLogout,
  username = 'Admin',
  userRole = 'admin',
  stats,
  userPermissions = []
}: AdminLayoutProps) {
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
    const contentItems = filteredNavGroups.find(g => g.label.includes('Content'))?.items || [];
    const systemItems = filteredNavGroups.find(g => g.label.includes('System'))?.items || [];
    return overviewItems.slice(0, 1).concat(contentItems.slice(0, 2), systemItems.slice(0, 1));
  })();

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden relative transition-colors duration-300">

      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-accent/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-info/5 blur-[130px]" />
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-md animate-fadeIn" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* Desktop Sidebar */}
      <ReusableSidebar isOpen={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <SidebarHeader>
          <div className="flex flex-row items-center justify-between w-full">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-card border border-border/60 flex items-center justify-center shadow-sm p-1.5 shrink-0 hover:scale-105 transition-transform">
                <img src="/logo.png" alt="AmazeCC Logo" className="w-full h-full object-contain" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground tracking-tight truncate font-display">
                    Amaze<span className="text-accent">CC</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate">
                    Admin Dashboard
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isCollapsed && <ThemeSwitcher />}
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                className="p-1.5 rounded-lg hover:bg-card border border-transparent hover:border-border/50 transition-all text-muted-foreground hover:text-foreground cursor-pointer"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {filteredNavGroups.map((group, gIdx) => (
            <SidebarGroup key={gIdx}>
              <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-3 py-1">
                {group.label}
              </SidebarGroupLabel>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'gorobo-inventory' && activeTab === 'gorobo');
                return (
                  <div key={item.id} className="w-full relative group">
                    <button
                      onClick={() => { 
                        setActiveTab(item.id); 
                        if (item.subTabs && item.subTabs[0]) setActiveSubTab(item.subTabs[0].id); 
                      }}
                      className={navItemClass(isActive)}
                      title={isCollapsed ? item.label : ''}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent rounded-r-full shadow-sm" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      {!isCollapsed && (
                        <span className="text-sm flex-1 text-left truncate font-medium">
                          {item.label}
                        </span>
                      )}
                      {isActive && !isCollapsed && item.subTabs && (
                        <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      )}
                    </button>

                    {isActive && item.subTabs && !isCollapsed && (
                      <div className="ml-7 border-l border-border/60 space-y-0.5 mt-1 pl-2">
                        {item.subTabs.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setActiveSubTab(sub.id)}
                            className={subTabClass(activeSubTab === sub.id)}
                          >
                            {activeSubTab === sub.id ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                            )}
                            <span className="truncate">{sub.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-3 hidden group-hover:block z-50 px-3 py-1.5 rounded-xl bg-card border border-border/80 text-foreground text-xs font-semibold whitespace-nowrap shadow-xl">
                        {item.label}
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
            <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-3 border border-border/60 w-full shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <User className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{username}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate">{userRole}</p>
                </div>
              </div>
            </div>
          )}
          <button 
            onClick={onLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all font-semibold w-full cursor-pointer active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-sm font-semibold">Sign Out</span>}
          </button>
        </SidebarFooter>
      </ReusableSidebar>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 h-14 bg-card/90 backdrop-blur-2xl border border-border/60 shadow-2xl rounded-2xl flex items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'gorobo-inventory' && activeTab === 'gorobo');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent text-accent-foreground shadow-md scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2.5 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-card/95 backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl border-t border-border/60 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="AmazeCC" className="w-6 h-6 object-contain" />
              <span className="font-bold text-foreground">Navigation Menu</span>
            </div>
            <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-6">
            {filteredNavGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{group.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || (item.id === 'gorobo-inventory' && activeTab === 'gorobo');
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setIsMobileOpen(false); }}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-accent/15 border-accent/30 text-accent font-bold shadow-sm'
                            : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
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
              className="w-full py-3 rounded-2xl bg-destructive/10 text-destructive font-bold border border-destructive/20 hover:bg-destructive/20 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 transition-all duration-300 md:ml-[280px] md:mr-4 pb-20 md:pb-0">
        <div className="w-full p-4 md:p-6 lg:p-8 animate-fadeIn">
          {/* Mobile Sub-tabs */}
          <div className="md:hidden mb-4">
            {filteredNavGroups.flatMap(g => g.items).map(item => {
              if (activeTab === item.id && item.subTabs) {
                return (
                  <div key={item.id} className="flex gap-1.5 p-1 bg-card/80 backdrop-blur-xl rounded-xl border border-border/50 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {item.subTabs.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubTab(sub.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex-1 cursor-pointer ${
                          activeSubTab === sub.id ? 'bg-accent text-accent-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
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
