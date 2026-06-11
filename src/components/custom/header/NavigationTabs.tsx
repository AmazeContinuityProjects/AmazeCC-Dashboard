"use client";
import React from "react";
import { useState } from "react";
import { RefreshCcw, User, LayoutGrid, MessageSquare, Bus, ShieldCheck } from "lucide-react";

const adminTabs = [
  { id: "queue", label: "Q‑Bank Queue", icon: MessageSquare },
  { id: "bus", label: "Bus Database", icon: Bus },
  { id: "broadcast", label: "Push Broadcast", icon: ShieldCheck },
];

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

  const desktopTabClass = (isActive: boolean) =>
    `flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
      isActive
        ? "bg-white/80 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 shadow-lg backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/50"
        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
    }`;

  const mobileTabClass = (isActive: boolean) =>
    `flex items-center justify-center flex-1 py-2.5 rounded-full transition-all duration-200 cursor-pointer ${
      isActive
        ? "bg-blue-500/90 text-white shadow-lg shadow-blue-500/25"
        : "text-gray-500 dark:text-gray-400"
    }`;

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex fixed top-4 left-4 z-40 flex-col h-[calc(100vh-2rem)] bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl transition-all duration-300 ${
          settings.isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className={`flex flex-col w-full p-4 border-b border-gray-200 dark:border-gray-800 pt-6 ${settings.isSidebarCollapsed ? "items-center" : ""}`}>
          <div className={`flex ${settings.isSidebarCollapsed ? "flex-col gap-4" : "justify-between items-center"} mb-4 w-full`}>
            {!settings.isSidebarCollapsed && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">AmazeCC</h2>
                <p className="text-xs text-gray-500 truncate max-w-[120px]">{username}</p>
              </div>
            )}
            <div className={`flex ${settings.isSidebarCollapsed ? "flex-col" : "items-center"} gap-2`}>
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
              {!settings.isSidebarCollapsed && (
                <>
                  <button onClick={handleReloadClick} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Reload Data">
                    <RefreshCcw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isSpinning ? "animate-spin" : ""}`} />
                  </button>
                  <button onClick={handleLogOutRequest} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Log Out">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-2 py-3 flex-1">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={desktopTabClass(activeTab === tab.id)}
              title={tab.label}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
              {!settings.isSidebarCollapsed && <span className="text-sm font-medium">{tab.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Floating Pill */}
      <div className="md:hidden fixed bottom-5 left-4 right-4 z-40 flex items-center gap-1.5 p-1.5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-gray-200/40 dark:border-gray-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.18)] rounded-full">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={mobileTabClass(activeTab === tab.id)}
            title={tab.label}
          >
            <tab.icon className="w-5 h-5" />
          </button>
        ))}
        <button
          onClick={handleLogOutRequest}
          className="flex items-center justify-center flex-1 py-2.5 rounded-full text-gray-500 dark:text-gray-400 transition-all duration-200"
          title="Log Out"
        >
          <User className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}
