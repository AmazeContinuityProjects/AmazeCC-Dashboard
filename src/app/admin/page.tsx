"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/custom/dayscholar/AdminDashboard";
import AdminLayout from "@/components/custom/admin/AdminLayout";
import AdminLandingPage from "@/components/custom/admin/AdminLandingPage";
import LoginForm from "./LoginForm";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("queue");
  const [stats, setStats] = useState({ queueCount: 0, busRoutes: 0, totalPapers: 0, approvedPapers: 0, pendingReview: 0, failedOCR: 0, activeUsers: 0, vitolSubscribers: 0 });

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem("admin_token")));
    setIsCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setActiveTab("dashboard");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 midnight:bg-black p-4">
        <LoginForm onAuthenticated={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} onLogout={handleLogout} username="Admin" stats={stats}>
      {activeTab === 'dashboard' && (
        <AdminLandingPage setActiveTab={setActiveTab} setActiveSubTab={setActiveSubTab} stats={stats} />
      )}
      {(activeTab === 'qbank' || activeTab === 'buses' || activeTab === 'push') && (
        <AdminDashboard activeTab={activeTab} activeSubTab={activeSubTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      )}
    </AdminLayout>
  );
}