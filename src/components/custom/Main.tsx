'use client';
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import AdminDashboard from "@/components/custom/dayscholar/AdminDashboard";
import AdminLayout from "@/components/custom/admin/AdminLayout";
import AdminLandingPage from "@/components/custom/admin/AdminLandingPage";
import AdminUsersTab from "@/components/custom/admin/AdminUsersTab";

export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('queue');
  const [userRole, setUserRole] = useState<'superadmin' | 'admin'>('admin');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [stats, setStats] = useState({ queueCount: 0, busRoutes: 0, totalPapers: 0, approvedPapers: 0, pendingReview: 0, failedOCR: 0, activeUsers: 0, vitolSubscribers: 0 });

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const storedRole = localStorage.getItem("admin_role") as 'superadmin' | 'admin' | null;
    const storedPerms = localStorage.getItem("admin_permissions");
    
    setIsAuthenticated(Boolean(token));
    if (storedRole) setUserRole(storedRole);
    if (storedPerms) {
      try {
        setUserPermissions(JSON.parse(storedPerms));
      } catch {}
    }
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiFetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setStats({
            queueCount: d.data.papers.pending + (d.data.papers.total - d.data.papers.approved - d.data.papers.pending - d.data.papers.pendingReview - d.data.papers.failedOcr),
            busRoutes: d.data.busRoutes,
            totalPapers: d.data.papers.total,
            approvedPapers: d.data.papers.approved,
            pendingReview: d.data.papers.pendingReview,
            failedOCR: d.data.papers.failedOcr,
            activeUsers: d.data.activeUsers,
            vitolSubscribers: d.data.vitolSubscribers,
          });
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_role', data.role);
        localStorage.setItem('admin_permissions', JSON.stringify(data.permissions));
        setUserRole(data.role);
        setUserPermissions(data.permissions);
        setIsAuthenticated(true);
      } else {
        setError(data.error || data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_permissions");
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setUserRole('admin');
    setUserPermissions([]);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 midnight:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <motion.div
        className="min-h-screen bg-gray-50 dark:bg-gray-900 midnight:bg-black flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full max-w-md bg-white/60 dark:bg-slate-900/60 midnight:bg-white/[0.03] backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 midnight:text-white">
              Admin Portal
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400 mt-2">
              Enter your VTOP credentials to access the admin dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-2">VTOP ID</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] backdrop-blur-xl text-gray-900 dark:text-gray-100 midnight:text-white placeholder-gray-400 border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="Enter admin VTOP ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] backdrop-blur-xl text-gray-900 dark:text-gray-100 midnight:text-white placeholder-gray-400 border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50/80 dark:bg-red-900/20 midnight:bg-red-900/20 text-red-600 dark:text-red-400 midnight:text-red-400 border border-red-200/50 dark:border-red-800/50 midnight:border-red-800/50 rounded-xl text-sm text-center backdrop-blur-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 midnight:bg-black flex flex-col text-gray-900 dark:text-gray-100 midnight:text-gray-100 transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AdminLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        onLogout={handleLogout}
        username="Admin"
        userRole={userRole}
        stats={stats}
      >
        {activeTab === 'dashboard' && (
          <AdminLandingPage setActiveTab={setActiveTab} setActiveSubTab={setActiveSubTab} stats={stats} />
        )}
        {(activeTab === 'qbank' || activeTab === 'buses' || activeTab === 'push') && (
          <AdminDashboard activeTab={activeTab} activeSubTab={activeSubTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
        )}
        {activeTab === 'users' && (
          <AdminUsersTab currentUserRole={userRole} />
        )}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 midnight:bg-blue-900/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 midnight:text-blue-400">A</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white midnight:text-white">Admin</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">System Administrator</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/60 dark:bg-slate-900/60 midnight:bg-white/[0.03] backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white midnight:text-white mb-4">Account</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 midnight:text-gray-400">Role</span><span className="text-gray-900 dark:text-white midnight:text-white font-medium">Administrator</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 midnight:text-gray-400">Access Level</span><span className="text-gray-900 dark:text-white midnight:text-white font-medium">Full</span></div>
                </div>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/60 midnight:bg-white/[0.03] backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white midnight:text-white mb-4">Actions</h3>
                <button onClick={handleLogout} className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </motion.div>
  );
}