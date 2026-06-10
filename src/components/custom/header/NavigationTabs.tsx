"use client";
import React from "react";
import { useState } from "react";
import { RefreshCcw, User, LayoutGrid, MessageSquare, Bus, ShieldCheck } from "lucide-react";

// Admin-specific tabs configuration
const adminTabs = [
  { id: "queue", label: "Q‑Bank Queue", icon: MessageSquare },
  { id: "bus", label: "Bus Database", icon: Bus },
  { id: "broadcast", label: "Push Broadcast", icon: ShieldCheck },
];

const adminTabClass = (isActive) =>
  `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
    isActive
      ? "bg-white/80 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 shadow-lg backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/50"
      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
  }`;

export default function NavigationTabs({
  activeTab,
  setActiveTab,
  handleLogOutRequest,
  handleReloadRequest,
  username,
  settings,
  setSettings,
  setIsReloading,
}) {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleReloadClick = async () => {
    setIsSpinning(true);
    await handleReloadRequest();
    setTimeout(() => setIsSpinning(false), 600);
  };

  const navItemClass = (isActive) =>
    `flex items-center justify-center py-2 px-3 rounded-md transition-colors cursor-pointer ${
      isActive ? "bg-blue-100 dark:bg-slate-800" : "hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  return (
    <>
      <div
        className={`fixed bottom-6 md:top-4 left-4 right-4 md:left-4 md:right-auto z-40 flex items-center md:items-start justify-around md:justify-start w-auto ${
          settings.isSidebarCollapsed ? "md:w-20" : "md:w-64"
        } md:h-[calc(100vh-2rem)] md:flex-col bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full md:rounded-3xl overflow-y-auto transition-all duration-300 py-1 md:py-0 px-2 md:px-0`}
      >
        {/* Profile / Logout */}
        <div className="hidden md:flex flex-col w-full p-4 mb-2 border-b border-gray-200 dark:border-gray-800 pt-6">
          <div className="flex justify-between items-center mb-4 w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">AmazeCC</h2>
            <p className="text-xs text-gray-500 truncate max-w-[120px]">{username}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSettings(prev => ({ ...prev, isSidebarCollapsed: !prev.isSidebarCollapsed }));
                localStorage.setItem("settings", JSON.stringify({ ...settings, isSidebarCollapsed: !settings.isSidebarCollapsed }));
              }}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle Sidebar"
            >
              <LayoutGrid className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button onClick={handleReloadClick} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Reload Data">
              <RefreshCcw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isSpinning ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleLogOutRequest} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Log Out">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
        {/* Admin Tabs - Glassmorphism Style */}
        <div className="flex flex-col gap-1.5 md:px-2">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={adminTabClass(activeTab === tab.id)}
              title={tab.label}
            >
              {React.createElement(tab.icon, { className: "w-5 h-5 shrink-0" })}
              <span className="hidden md:block text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
