'use client';
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import AdminDashboard from "@/components/custom/dayscholar/AdminDashboard";
import AdminLayout from "@/components/custom/admin/AdminLayout";

export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('qbank');

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem("admin_token")));
    setIsCheckingAuth(false);
  }, []);

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
    setIsAuthenticated(false);
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
        <div className="w-full max-w-md bg-white dark:bg-slate-800 midnight:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 midnight:border-gray-800 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 midnight:text-white">
              Admin Portal
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Enter your VTOP credentials to access the admin dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                VTOP ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 midnight:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Enter admin VTOP ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 midnight:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors shadow-md disabled:bg-gray-400"
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
        onLogout={handleLogout}
        username="Admin"
      >
        <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      </AdminLayout>
    </motion.div>
  );
}