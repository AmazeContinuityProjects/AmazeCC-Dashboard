'use client';

import { useState, useEffect } from "react";
import { apiFetch, fetcher } from "@/lib/api";
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { Sparkles, Info } from "lucide-react";

import LoginForm from "./loginForm";

const AdminLayout = dynamic(() => import('@/components/custom/admin/AdminLayout'), { ssr: false });
const AdminLandingPage = dynamic(() => import('@/components/custom/admin/AdminLandingPage'), { ssr: false });
const AdminDashboard = dynamic(() => import('@/components/custom/dayscholar/AdminDashboard'), { ssr: false });
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
const GoRoboInventory = dynamic(() => import('@/components/custom/admin/gorobo/GoRoboInventory'), { ssr: false });
const GoRoboBillProcessor = dynamic(() => import('@/components/custom/admin/gorobo/GoRoboBillProcessor'), { ssr: false });
const AmazeWallet = dynamic(() => import('@/components/custom/admin/gorobo/AmazeWallet'), { ssr: false });

export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [residentialStatus, setResidentialStatus] = useState<'hosteller' | 'dayscholar'>('hosteller');
  const [isDayscholarWithBus, setIsDayscholarWithBus] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('queue');
  const [userRole, setUserRole] = useState<'superadmin' | 'admin'>('admin');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    const demo = localStorage.getItem("admin_demo_mode");
    const token = localStorage.getItem("admin_token");
    const storedRole = localStorage.getItem("admin_role") as 'superadmin' | 'admin' | null;
    const storedPermissions = localStorage.getItem("admin_permissions");
    
    if (demo === "true") {
      setIsDemoMode(true);
      setIsAuthenticated(true);
      setUserRole("superadmin");
      setUserPermissions(["*"]);
    } else if (token) {
      setIsAuthenticated(true);
      if (storedRole) {
        setUserRole(storedRole);
      }
      if (storedPermissions) {
        try {
          setUserPermissions(JSON.parse(storedPermissions));
        } catch (e) {
          console.error("Failed to parse stored permissions:", e);
        }
      }
    }
    setIsCheckingAuth(false);
  }, []);

  const { data: statsData } = useSWR(
    isAuthenticated && !isDemoMode ? '/api/admin/stats' : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  const demoStats = {
    queueCount: 14,
    busRoutes: 36,
    totalPapers: 1420,
    approvedPapers: 1385,
    pendingReview: 18,
    failedOCR: 3,
    activeUsers: 842,
    vitolSubscribers: 1280,
  };

  const stats = isDemoMode
    ? demoStats
    : statsData?.success && statsData?.data
    ? {
        queueCount:
          statsData.data.papers.pending +
          (statsData.data.papers.total -
            statsData.data.papers.approved -
            statsData.data.papers.pending -
            statsData.data.papers.pendingReview -
            statsData.data.papers.failedOcr),
        busRoutes: statsData.data.busRoutes,
        totalPapers: statsData.data.papers.total,
        approvedPapers: statsData.data.papers.approved,
        pendingReview: statsData.data.papers.pendingReview,
        failedOCR: statsData.data.papers.failedOcr,
        activeUsers: statsData.data.activeUsers,
        vitolSubscribers: statsData.data.vitolSubscribers,
      }
    : {
        queueCount: 0,
        busRoutes: 0,
        totalPapers: 0,
        approvedPapers: 0,
        pendingReview: 0,
        failedOCR: 0,
        activeUsers: 0,
        vitolSubscribers: 0,
      };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await apiFetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("admin_role", data.role || "admin");
        localStorage.setItem('admin_permissions', JSON.stringify(data.permissions));
        setUserRole(data.role || "admin");
        setUserPermissions(data.permissions || []);
        setIsAuthenticated(true);
        setIsDemoMode(false);
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Failed to connect to authentication server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem("admin_demo_mode", "true");
      setIsDemoMode(true);
      setIsAuthenticated(true);
      setUserRole("superadmin");
      setUserPermissions(["*"]);
      setIsLoading(false);
    }, 350);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_permissions");
    localStorage.removeItem("admin_demo_mode");
    setIsDemoMode(false);
    setIsAuthenticated(false);
    setActiveTab("dashboard");
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
      <LoginForm
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
        error={error}
        handleFormSubmit={handleLogin}
        residentialStatus={residentialStatus}
        setResidentialStatus={setResidentialStatus}
        isDayscholarWithBus={isDayscholarWithBus}
        setIsDayscholarWithBus={setIsDayscholarWithBus}
        handleDemoClick={handleDemoClick}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground animate-fadeIn">
      {/* Demo Mode Top Banner */}
      {isDemoMode && (
        <div className="w-full bg-accent/15 border-b border-accent/30 text-accent-foreground px-4 py-2 text-xs font-medium flex items-center justify-between backdrop-blur-xl z-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span>
              <strong>Demo Mode Active:</strong> Data shown is mock data for demonstration purposes only.
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-accent/20 hover:bg-accent/30 text-accent font-semibold rounded-lg transition-colors text-xs"
          >
            Exit Demo Mode
          </button>
        </div>
      )}

      <AdminLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        onLogout={handleLogout}
        username={isDemoMode ? "Demo Superadmin" : "Admin"}
        userRole={userRole}
        userPermissions={userPermissions}
        stats={stats}
      >
        {activeTab === 'dashboard' && (
          <AdminLandingPage setActiveTab={setActiveTab} setActiveSubTab={setActiveSubTab} />
        )}
        {(activeTab === 'qbank' || activeTab === 'push') && (
          <AdminDashboard activeTab={activeTab} activeSubTab={activeSubTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
        )}
        {activeTab === 'buses' && (
          <TransportManager />
        )}
        {(activeTab === 'gorobo' || activeTab === 'gorobo-inventory') && (
          <GoRoboInventory />
        )}
        {(activeTab === 'gorobo-orders' || activeTab === 'gorobo-billing') && (
          <GoRoboBillProcessor />
        )}
        {activeTab === 'gorobo-wallet' && (
          <AmazeWallet />
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
                <h2 className="text-2xl font-bold text-foreground">
                  {isDemoMode ? "Demo Superadmin" : "Admin"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isDemoMode ? "Demonstration Administrator" : "System Administrator"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card/60 backdrop-blur-2xl border border-border/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Account</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <span className="text-foreground font-medium">
                      {isDemoMode ? "Demo Superadmin" : "Administrator"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Access Level</span>
                    <span className="text-foreground font-medium">Full Access</span>
                  </div>
                </div>
              </div>
              <div className="bg-card/60 backdrop-blur-2xl border border-border/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 bg-danger hover:bg-danger/90 text-white font-medium rounded-xl transition-colors"
                >
                  {isDemoMode ? "Exit Demo Mode" : "Logout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </div>
  );
}
