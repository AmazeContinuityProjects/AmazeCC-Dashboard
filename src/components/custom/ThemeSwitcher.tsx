"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Star } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-1.5 rounded-xl bg-white/60 dark:bg-slate-900/60 midnight:bg-black/60 backdrop-blur-md">
        <div className="w-5 h-5" />
      </div>
    );
  }

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleSelect = (newTheme: string) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  const getIcon = () => {
    if (theme === "dark") return <Moon className="w-4 h-4 text-gray-300" />;
    if (theme === "midnight") return <Star className="w-4 h-4 text-purple-400" />;
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="flex items-center justify-center p-2 rounded-xl bg-white/60 dark:bg-slate-800/60 midnight:bg-white/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 hover:bg-gray-100 dark:hover:bg-slate-700/60 midnight:hover:bg-white/20 transition-all shadow-sm"
        title="Change theme"
      >
        {getIcon()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 mt-1 w-36 rounded-2xl bg-white/80 dark:bg-slate-900/80 midnight:bg-black/80 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 shadow-xl overflow-hidden z-50 flex flex-col p-1"
          >
            <button
              onClick={() => handleSelect("light")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${theme === 'light' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Sun className="w-4 h-4" /> Light
            </button>
            <button
              onClick={() => handleSelect("dark")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-slate-800 text-blue-400' : 'text-gray-300 hover:bg-slate-800/50'}`}
            >
              <Moon className="w-4 h-4" /> Dark
            </button>
            <button
              onClick={() => handleSelect("midnight")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${theme === 'midnight' ? 'bg-white/10 text-purple-400' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Star className="w-4 h-4" /> Midnight
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
