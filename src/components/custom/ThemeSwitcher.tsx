"use client";

import * as React from "react";
import { Moon, Sun, Droplets, Leaf, Sparkles, Flame } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

const accents = [
 { id: "ocean", label: "Ocean", icon: Droplets },
 { id: "forest", label: "Forest", icon: Leaf },
 { id: "lavender", label: "Lavender", icon: Sparkles },
 { id: "sunset", label: "Sunset", icon: Flame },
];

export function ThemeSwitcher() {
 const { theme, setTheme } = useTheme();
 const [mounted, setMounted] = React.useState(false);
 const [isOpen, setIsOpen] = React.useState(false);
 const [accent, setAccent] = React.useState("ocean");

 React.useEffect(() => {
 setMounted(true);
 const saved = localStorage.getItem("accent");
 if (saved) {
 setAccent(saved);
 document.documentElement.setAttribute("data-accent", saved);
 }
 }, []);

 if (!mounted) {
 return (
 <div className="p-1.5 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
 <div className="w-5 h-5" />
 </div>
 );
 }

 const toggleOpen = () => setIsOpen(!isOpen);

 const handleThemeSelect = (newTheme: string) => {
 setTheme(newTheme);
 setIsOpen(false);
 };

 const handleAccentSelect = (newAccent: string) => {
 setAccent(newAccent);
 document.documentElement.setAttribute("data-accent", newAccent);
 localStorage.setItem("accent", newAccent);
 setIsOpen(false);
 };

 const getIcon = () => {
 if (theme === "dark") return <Moon className="w-4 h-4" />;
 return <Sun className="w-4 h-4" />;
 };

 return (
 <div className="relative">
 <button
 onClick={toggleOpen}
 className="flex items-center justify-center p-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-all shadow-sm"
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
  className="absolute left-1/2 -translate-x-1/2 top-12 mt-1 w-44 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden z-50 flex flex-col p-2 gap-1"
 >
 <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 pt-1">Mode</p>
 <div className="flex gap-1">
 <button
 onClick={() => handleThemeSelect("light")}
 className={`flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
 theme === 'light' ? 'bg-accent text-accent-foreground' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
 }`}
 >
 <Sun className="w-4 h-4" /> Light
 </button>
 <button
 onClick={() => handleThemeSelect("dark")}
 className={`flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
 theme === 'dark' ? 'bg-accent text-accent-foreground' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
 }`}
 >
 <Moon className="w-4 h-4" /> Dark
 </button>
 </div>

 <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

 <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 pt-1">Accent</p>
 <div className="grid grid-cols-2 gap-1">
 {accents.map(({ id, label, icon: Icon }) => (
 <button
 key={id}
 onClick={() => handleAccentSelect(id)}
 className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
 accent === id ? 'bg-accent text-accent-foreground' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
 }`}
 >
 <Icon className="w-4 h-4" /> {label}
 </button>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
