'use client';
import React, { useState } from 'react';
import { LayoutGrid, MessageSquare, Bus, ShieldCheck, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const adminTabs = [
  { id: 'qbank', label: 'Q-Bank Queue', icon: MessageSquare },
  { id: 'buses', label: 'Bus Database', icon: Bus },
  { id: 'push', label: 'Push Broadcast', icon: ShieldCheck },
];

const adminTabClass = (isActive: boolean, isCollapsed: boolean) =>
  `flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
    isActive
      ? 'bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] text-blue-600 dark:text-blue-400 midnight:text-blue-400 shadow-lg backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/50 midnight:border-blue-500/20'
      : 'text-gray-600 dark:text-gray-300 midnight:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 midnight:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 midnight:hover:bg-white/[0.04]'
  } ${isCollapsed ? 'justify-center' : ''}`;

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  username?: string;
}

export default function AdminLayout({ children, activeTab, setActiveTab, onLogout, username = 'Admin' }: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 midnight:bg-black flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isMobileMenuOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed md:relative z-50 w-64 flex flex-col ${
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } h-screen bg-white/60 dark:bg-slate-900/50 midnight:bg-white/[0.03] backdrop-blur-2xl border-r border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300`}
      >
        {/* Logo / Header */}
        <div className={`flex flex-col w-full p-4 mb-2 border-b border-gray-200 dark:border-gray-800 midnight:border-white/10 pt-6 ${isSidebarCollapsed ? 'items-center' : ''}`}>
          <div className={`flex justify-between items-center mb-4 w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-xl font-bold text-gray-900 dark:text-gray-100 midnight:text-white transition-opacity ${isSidebarCollapsed ? 'hidden md:block' : ''}`}
            >
              AmazeCC
            </motion.h2>
            {!isSidebarCollapsed && (
              <p className="text-xs text-gray-500 dark:text-gray-400 midnight:text-gray-400 truncate max-w-[120px]">{username}</p>
            )}
          </div>
          <div className="flex gap-2 w-full justify-center">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 midnight:hover:bg-white/[0.06] transition-colors"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <LayoutGrid className="w-5 h-5 text-gray-600 dark:text-gray-300 midnight:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
          {adminTabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={adminTabClass(activeTab === tab.id, isSidebarCollapsed)}
              title={tab.label}
              whileHover={{ scale: isSidebarCollapsed ? 1.1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">{tab.label}</span>}
            </motion.button>
          ))}
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 midnight:border-white/10">
          <motion.button
            onClick={onLogout}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 midnight:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 midnight:hover:bg-red-900/20 transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <div className="w-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed bottom-6 right-6 md:hidden z-50 p-3 bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 rounded-2xl shadow-lg"
        aria-label="Open menu"
      >
        <LayoutGrid className="w-6 h-6 text-gray-600 dark:text-gray-300 midnight:text-gray-300" />
      </button>
    </div>
  );
}