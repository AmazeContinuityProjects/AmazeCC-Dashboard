'use client';
import React from 'react';
import { motion } from 'framer-motion';

export const GlassCard = ({ children, className = '', hover = false, padding = 'p-6', innerGlow = false }: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
  innerGlow?: boolean;
}) => (
  <motion.div
    className={`bg-white/60 dark:bg-slate-800/40 midnight:bg-white/[0.05] backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] midnight:shadow-[0_8px_30px_rgba(255,255,255,0.02)] rounded-3xl ${padding} ${hover ? 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:border-blue-200/50 dark:hover:border-blue-800/50 midnight:hover:border-blue-500/20 transition-all duration-300' : ''} ${innerGlow ? 'before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none' : ''} relative ${className}`}
    whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
  >
    {children}
  </motion.div>
);

export const GlassButton = ({ children, className = '', variant = 'primary', size = 'md', disabled, ...props }: {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg focus:ring-blue-500',
    secondary: 'bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.08] hover:bg-white dark:hover:bg-slate-700 midnight:hover:bg-white/[0.12] text-gray-700 dark:text-gray-200 midnight:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 shadow-md focus:ring-gray-500 backdrop-blur-xl',
    ghost: 'text-gray-600 dark:text-gray-300 midnight:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-800/50 midnight:hover:bg-white/[0.06] focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={props.onClick}
      type={props.type}
    >
      {children}
    </motion.button>
  );
};

export const GlassInput = ({ label, error, className = '', ...props }: {
  label?: string;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300">{label}</label>}
    <input
      className={`w-full px-4 py-3 rounded-xl border bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] backdrop-blur-xl text-gray-900 dark:text-gray-100 midnight:text-white placeholder-gray-400 dark:placeholder-gray-500 midnight:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
        error 
          ? 'border-red-300 dark:border-red-700 midnight:border-red-700 focus:ring-red-500/20 focus:border-red-500' 
          : 'border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300/50 dark:hover:border-gray-600/50 midnight:hover:border-white/20'
      } ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export const GlassTextarea = ({ label, error, className = '', ...props }: {
  label?: string;
  error?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300">{label}</label>}
    <textarea
      className={`w-full px-4 py-3 rounded-xl border bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] backdrop-blur-xl text-gray-900 dark:text-gray-100 midnight:text-white placeholder-gray-400 dark:placeholder-gray-500 midnight:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-y ${
        error 
          ? 'border-red-300 dark:border-red-700 midnight:border-red-700 focus:ring-red-500/20 focus:border-red-500' 
          : 'border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300/50 dark:hover:border-gray-600/50 midnight:hover:border-white/20'
      } ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export const GlassSelect = ({ label, error, className = '', options, ...props }: {
  label?: string;
  error?: string;
  className?: string;
  options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300">{label}</label>}
    <div className="relative">
      <select
        className={`w-full px-4 py-3 rounded-xl border bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] backdrop-blur-xl text-gray-900 dark:text-gray-100 midnight:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none ${
          error 
            ? 'border-red-300 dark:border-red-700 midnight:border-red-700 focus:ring-red-500/20 focus:border-red-500' 
            : 'border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300/50 dark:hover:border-gray-600/50 midnight:hover:border-white/20'
        } ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export const Breadcrumbs = ({ items }: { items: { label: string; href?: string; active?: boolean }[] }) => (
  <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
    {items.map((item, idx) => (
      <React.Fragment key={idx}>
        <span className={item.active ? 'text-blue-600 dark:text-blue-400' : ''}>
          {item.label}
        </span>
        {idx < items.length - 1 && <span className="opacity-40">/</span>}
      </React.Fragment>
    ))}
  </nav>
);

export const SectionHeader = ({ title, description, action, breadcrumbs }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string; active?: boolean }[];
}) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
    <div>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 midnight:text-white tracking-tight leading-tight">{title}</h2>
      {description && <p className="text-gray-500 dark:text-gray-400 midnight:text-gray-400 mt-2 max-w-2xl text-lg font-medium">{description}</p>}
    </div>
    {action && <div className="flex-shrink-0 sm:mt-0">{action}</div>}
  </div>
);

export const StatusBadge = ({ status, className = '' }: { 
  status: 'pending' | 'processing' | 'success' | 'error' | 'warning' | 'info';
  className?: string;
}) => {
  const styles = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 midnight:bg-amber-900/30 midnight:text-amber-400 border-amber-200/50 dark:border-amber-800/50 midnight:border-amber-800/50',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 midnight:bg-blue-900/30 midnight:text-blue-400 border-blue-200/50 dark:border-blue-800/50 midnight:border-blue-800/50 animate-pulse',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 midnight:bg-green-900/30 midnight:text-green-400 border-green-200/50 dark:border-green-800/50 midnight:border-green-800/50',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 midnight:bg-red-900/30 midnight:text-red-400 border-red-200/50 dark:border-red-800/50 midnight:border-red-800/50',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 midnight:bg-orange-900/30 midnight:text-orange-400 border-orange-200/50 dark:border-orange-800/50 midnight:border-orange-800/50',
    info: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 midnight:bg-gray-800/50 midnight:text-gray-300 border-gray-200/50 dark:border-gray-700/50 midnight:border-gray-700/50',
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
};

export const EmptyState = ({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="text-center py-16 px-6">
    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 midnight:bg-white/[0.06] rounded-2xl flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 midnight:text-white mb-2">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 midnight:text-gray-400 max-w-sm mx-auto mb-6">{description}</p>
    {action && <div>{action}</div>}
  </div>
);

export const LoadingSpinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizes = { sm: 'w-6 h-6 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' };
  return (
    <div className={`${sizes[size]} rounded-full border-t-transparent border-blue-500 animate-spin ${className}`} />
  );
};
