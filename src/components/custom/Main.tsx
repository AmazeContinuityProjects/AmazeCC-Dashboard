'use client';

import { useState, useEffect } from "react";
import { fetcher } from "@/lib/api";
import { signInInteractive, signOutApp, signOutDevice, getAccessTokenSync, ensureFreshAccessToken, getStoredUser, trySilentSignIn } from "@/lib/oauth2";
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { Button } from "@/components/custom/admin/AdminUI";

const AdminLayout = dynamic(() => import('@/components/custom/admin/AdminLayout'), { ssr: false });
const AdminLandingPage = dynamic(() => import('@/components/custom/admin/AdminLandingPage'), { ssr: false });
const AdminQueueTab = dynamic(() => import('@/components/custom/qbank/AdminQueueTab'), { ssr: false });
const PushBroadcastTab = dynamic(() => import('@/components/custom/admin/PushBroadcastTab'), { ssr: false });
const AdminUsersTab = dynamic(() => import('@/components/custom/admin/AdminUsersTab'), { ssr: false });
const PapersManager = dynamic(() => import('@/components/custom/admin/PapersManager'), { ssr: false });
const QuestionsManager = dynamic(() => import('@/components/custom/admin/QuestionsManager'), { ssr: false });
const DiagramsManager = dynamic(() => import('@/components/custom/admin/DiagramsManager'), { ssr: false });
const StorageManager = dynamic(() => import('@/components/custom/admin/StorageManager'), { ssr: false });
const AuditLogsManager = dynamic(() => import('@/components/custom/admin/AuditLogsManager'), { ssr: false });
const SettingsTab = dynamic(() => import('@/components/custom/admin/SettingsTab'), { ssr: false });
const FresherResourcesTab = dynamic(() => import('@/components/custom/admin/FresherResourcesTab'), { ssr: false });
const FacultyDirectoriesTab = dynamic(() => import('@/components/custom/admin/FacultyDirectoriesTab'), { ssr: false });
const ClubsManagementTab = dynamic(() => import('@/components/custom/admin/ClubsManagementTab'), { ssr: false });
const CabShareAdminTab = dynamic(() => import('@/components/custom/admin/CabShareAdminTab'), { ssr: false });
const TransportManager = dynamic(() => import('@/components/custom/admin/TransportManager'), { ssr: false });
const GoRoboAdmin = dynamic(() => import('@/components/custom/admin/gorobo/GoRoboAdmin'), { ssr: false });

const ALL_SECTIONS = ["dashboard","qbank","buses","transport","gorobo","clubs","cabshare","fresher-resources","faculty-directories","push","settings","storage","users","ocr","migrate","audit-logs"];

export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('queue');
  const [userRole, setUserRole] = useState<'superadmin' | 'admin' | 'user'>('user');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [signOutMenuOpen, setSignOutMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hasAnyCredential =
        !!getAccessTokenSync() ||
        (typeof window !== "undefined" && !!localStorage.getItem("amaze_oidc_refresh_token"));

      if (hasAnyCredential) {
        await ensureFreshAccessToken();
        const stored = getStoredUser();
        if (stored && !cancelled) {
          setUserRole(stored.role);
          setUserPermissions(stored.role === "superadmin" ? ALL_SECTIONS : stored.permissions);
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          return;
        }
        // Refresh failed and was cleared - show the sign-in button.
      } else if (trySilentSignIn()) {
        // Signed in at auth.amazecc.com? The browser is being sent through the
        // authorize hop (prompt=none); this component unmounts on redirect.
        return;
      }
      if (!cancelled) setIsCheckingAuth(false);
    })().catch(() => {
      if (!cancelled) setIsCheckingAuth(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { data: statsData, error: statsError } = useSWR(isAuthenticated ? '/api/admin/stats' : null, fetcher, {
  refreshInterval: 30000,
  revalidateOnFocus: true,
  });

  const stats = statsData?.success && statsData?.data ? {
  queueCount: statsData.data.papers.pending + (statsData.data.papers.total - statsData.data.papers.approved - statsData.data.papers.pending - statsData.data.papers.pendingReview - statsData.data.papers.failedOcr),
  busRoutes: statsData.data.busRoutes,
  totalPapers: statsData.data.papers.total,
  approvedPapers: statsData.data.papers.approved,
  pendingReview: statsData.data.papers.pendingReview,
  failedOCR: statsData.data.papers.failedOcr,
  activeUsers: statsData.data.activeUsers,
  vitolSubscribers: statsData.data.vitolSubscribers,
  } : { queueCount: 0, busRoutes: 0, totalPapers: 0, approvedPapers: 0, pendingReview: 0, failedOCR: 0, activeUsers: 0, vitolSubscribers: 0 };

  const handleLogout = () => setSignOutMenuOpen(true);

  const handleAppSignOut = () => {
    // Revokes this app's tokens at the IdP (verified). IdP session stays.
    signOutApp().finally(() => {
      setSignOutMenuOpen(false);
      setIsAuthenticated(false);
      setActiveTab("dashboard");
    });
  };

  const handleDeviceSignOut = () => {
    // Revokes this app's tokens, then ends the IdP session - every AmazeCC
    // app on this device signs out (via the IdP's RP-Initiated Logout).
    signOutDevice();
  };

  if (isCheckingAuth) {
  return (
  <div className="min-h-screen bg-background animate-fadeIn flex items-center justify-center">
  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-info"></div>
  </div>
  );
  }

  if (!isAuthenticated) {
  return (
  <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fadeIn">
  <div className="w-full max-w-md bg-card/60 backdrop-blur-2xl border border-border/50 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-8 space-y-6">
  <div className="text-center space-y-2">
  <img src="/logo.png" alt="AmazeCC Logo" className="w-16 h-16 mx-auto mb-4 object-contain drop-shadow-md" />
  <h2 className="text-2xl font-black text-foreground tracking-tight font-display">Admin Portal</h2>
  <p className="text-sm text-muted-foreground">Sign in with your Amaze ID to continue</p>
  </div>

  <button
  type="button"
  onClick={() => signInInteractive()}
  className="w-full h-12 rounded-xl font-semibold text-sm bg-amber-400 hover:bg-amber-300 text-amber-950 transition-colors flex items-center justify-center gap-2"
  >
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M4 12a8 8 0 0 1 16 0"/><path d="M2 12a10 10 0 0 1 20 0"/></svg>
  Sign in with Amaze ID
  </button>

  <p className="text-xs text-muted-foreground text-center leading-relaxed">
  One Amaze ID for every AmazeCC app.{' '}
  <a href="https://auth.amazecc.com/sign-up" target="_blank" rel="noreferrer" className="text-amber-600 hover:underline font-medium">
  Create an account
  </a>
  </p>
  </div>
  </div>
  );
  }

  return (
  <div className="min-h-screen bg-background flex flex-col text-foreground animate-fadeIn">
  <AdminLayout
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  activeSubTab={activeSubTab}
  setActiveSubTab={setActiveSubTab}
  onLogout={handleLogout}
  username="Admin"
  userRole={userRole}
  userPermissions={userPermissions}
  stats={stats}
  >
  {activeTab === 'dashboard' && (
  <AdminLandingPage setActiveTab={setActiveTab} setActiveSubTab={setActiveSubTab} />
  )}
  {activeTab === 'qbank' && (
  <AdminQueueTab />
  )}
  {activeTab === 'push' && (
  <PushBroadcastTab />
  )}
  {activeTab === 'buses' && (
  <TransportManager />
  )}
  {(activeTab === 'gorobo' || activeTab === 'gorobo-inventory' || activeTab === 'gorobo-orders' || activeTab === 'gorobo-billing' || activeTab === 'gorobo-wallet' || activeTab === 'gorobo-bundles' || activeTab === 'gorobo-analytics') && (
    <GoRoboAdmin
      initialTab={
        activeTab === 'gorobo-inventory' ? 'inventory' :
        activeTab === 'gorobo-orders' || activeTab === 'gorobo-billing' ? 'orders' :
        activeTab === 'gorobo-wallet' ? 'wallet' :
        activeTab === 'gorobo-bundles' ? 'bundles' : 'analytics'
      }
    />
  )}
  {activeTab === 'papers' && (
  <PapersManager />
  )}
  {activeTab === 'questions' && (
  <QuestionsManager />
  )}
  {activeTab === 'diagrams' && (
  <DiagramsManager />
  )}
  {activeTab === 'storage' && (
  <StorageManager />
  )}
  {activeTab === 'audit_logs' && (
  <AuditLogsManager />
  )}
  {activeTab === 'fresher-resources' && (
  <FresherResourcesTab />
  )}
  {activeTab === 'faculty-directories' && (
  <FacultyDirectoriesTab />
  )}
  {activeTab === 'users' && (
  <AdminUsersTab currentUserRole={userRole} />
  )}
  {activeTab === 'settings' && (
  <SettingsTab />
  )}
  {activeTab === 'clubs' && (
  <ClubsManagementTab />
  )}
  {activeTab === 'cabshare' && (
  <CabShareAdminTab />
  )}
  {activeTab === 'profile' && (
  <div className="space-y-6">
  <div className="flex items-center gap-4">
  <div className="w-16 h-16 flex items-center justify-center bg-card border border-border/50 rounded-full shadow-sm">
  <img src="/logo.png" alt="Admin Profile" className="w-10 h-10 object-contain drop-shadow-sm" />
  </div>
  <div>
  <h2 className="text-2xl font-bold text-foreground">Admin</h2>
  <p className="text-sm text-muted-foreground">System Administrator</p>
  </div>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div className="bg-card/60 backdrop-blur-2xl border border-border/50 rounded-2xl p-6">
  <h3 className="text-lg font-semibold text-foreground mb-4">Account</h3>
  <div className="space-y-3 text-sm">
  <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="text-foreground font-medium">Administrator</span></div>
  <div className="flex justify-between"><span className="text-muted-foreground">Access Level</span><span className="text-foreground font-medium">Full</span></div>
  </div>
  </div>
  <div className="bg-card/60 backdrop-blur-2xl border border-border/50 rounded-2xl p-6">
  <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
  <Button variant="destructive" onClick={handleLogout} className="w-full">
    Logout
  </Button>
  </div>
  </div>
  </div>
  )}
  </AdminLayout>

  {signOutMenuOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <button
    type="button"
    aria-label="Cancel"
    onClick={() => setSignOutMenuOpen(false)}
    className="absolute inset-0 bg-background/70 backdrop-blur-sm cursor-default"
    />
    <div className="relative w-full max-w-md bg-card border border-border/60 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.35)] p-6 space-y-5 animate-fadeIn">
    <div className="space-y-1.5">
      <h3 className="text-xl font-black text-foreground tracking-tight font-display">Sign out</h3>
      <p className="text-sm text-muted-foreground">Choose how you want to sign out.</p>
    </div>

    <button
      type="button"
      onClick={handleAppSignOut}
      className="w-full text-left rounded-2xl border border-border/60 bg-muted/40 hover:bg-muted/70 transition-colors p-4 space-y-1 cursor-pointer"
    >
      <span className="block text-sm font-bold text-foreground">Sign out of Admin Portal</span>
      <span className="block text-xs text-muted-foreground leading-relaxed">Revokes this app&apos;s tokens at Amaze ID. Your Amaze ID stays signed in for other AmazeCC apps.</span>
    </button>

    <button
      type="button"
      onClick={handleDeviceSignOut}
      className="w-full text-left rounded-2xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors p-4 space-y-1 cursor-pointer"
    >
      <span className="block text-sm font-bold text-destructive">Sign out of Amaze ID on this device</span>
      <span className="block text-xs text-muted-foreground leading-relaxed">Ends your Amaze ID session at auth.amazecc.com. Every AmazeCC app on this device signs out immediately - revokes all session tokens.</span>
    </button>

    <button
      type="button"
      onClick={() => setSignOutMenuOpen(false)}
      className="w-full h-10 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
    >
      Cancel
    </button>
    </div>
  </div>
  )}
  </div>
  );
}
