'use client';
import React from 'react';
import { motion } from 'framer-motion';

export const GlassCard = ({ children, className = '', hover = false, padding = 'p-5', innerGlow = false }: {
 children: React.ReactNode;
 className?: string;
 hover?: boolean;
 padding?: string;
 innerGlow?: boolean;
}) => (
 <motion.div
 className={`bg-card/80 backdrop-blur-2xl border border-border/50 shadow-small rounded-md ${padding} ${hover ? 'hover:shadow-medium hover:border-accent/30 transition-all duration-300' : ''} ${innerGlow ? 'before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-accent/5 before:to-transparent before:pointer-events-none' : ''} relative ${className}`}
 whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
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
 const baseStyles = 'font-semibold rounded-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
 
 const variants = {
 primary: 'bg-accent text-accent-foreground hover:brightness-110 shadow-small focus:ring-accent',
 secondary: 'bg-card/80 hover:bg-accent/10 text-foreground border border-border/50 shadow-small focus:ring-ring backdrop-blur-xl',
 ghost: 'text-muted-foreground hover:bg-accent/10 hover:text-accent focus:ring-ring',
 danger: 'bg-destructive text-white hover:brightness-110 shadow-small focus:ring-destructive',
 };

 const sizes = {
 sm: 'px-2.5 py-1.5 text-xs',
 md: 'px-3.5 py-2 text-sm',
 lg: 'px-5 py-2.5 text-sm',
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
 {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
 <input
 className={`w-full px-3.5 py-2.5 rounded-sm border bg-background text-foreground placeholder-muted-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm ${
 error 
 ? 'border-destructive focus:ring-destructive/30' 
 : 'border-input focus:ring-accent/30 hover:border-ring'
 } ${className}`}
 {...props}
 />
 {error && <p className="text-sm text-destructive">{error}</p>}
 </div>
);

export const GlassTextarea = ({ label, error, className = '', ...props }: {
 label?: string;
 error?: string;
 className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
 <div className="space-y-1.5">
 {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
 <textarea
 className={`w-full px-3.5 py-2.5 rounded-sm border bg-background text-foreground placeholder-muted-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-y text-sm ${
 error 
 ? 'border-destructive focus:ring-destructive/30' 
 : 'border-input focus:ring-accent/30 hover:border-ring'
 } ${className}`}
 {...props}
 />
 {error && <p className="text-sm text-destructive">{error}</p>}
 </div>
);

export const GlassSelect = ({ label, error, className = '', options, ...props }: {
 label?: string;
 error?: string;
 className?: string;
 options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) => (
 <div className="space-y-1.5">
 {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
 <div className="relative">
 <select
 className={`w-full px-3.5 py-2.5 rounded-sm border bg-background text-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none text-sm ${
 error 
 ? 'border-destructive focus:ring-destructive/30' 
 : 'border-input focus:ring-accent/30 hover:border-ring'
 } ${className}`}
 {...props}
 >
 {options.map(opt => (
 <option key={opt.value} value={opt.value} className="bg-background text-foreground">{opt.label}</option>
 ))}
 </select>
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
 </div>
 </div>
 {error && <p className="text-sm text-destructive">{error}</p>}
 </div>
);

export const Breadcrumbs = ({ items }: { items: { label: string; href?: string; active?: boolean }[] }) => (
 <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
 {items.map((item, idx) => (
 <React.Fragment key={idx}>
 <span className={item.active ? 'text-accent' : ''}>
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
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
 <div>
 {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
 <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight font-display">{title}</h2>
 {description && <p className="text-muted-foreground mt-1 max-w-2xl text-sm font-medium">{description}</p>}
 </div>
 {action && <div className="flex-shrink-0 sm:mt-0">{action}</div>}
 </div>
);

export const StatusBadge = ({ status, className = '' }: { 
 status: 'pending' | 'processing' | 'success' | 'error' | 'warning' | 'info';
 className?: string;
}) => {
 const styles = {
 pending: 'bg-[var(--semantic-warning)]/15 text-[var(--semantic-warning)] border-[var(--semantic-warning)]/20',
 processing: 'bg-accent/15 text-accent border-accent/20 animate-pulse',
 success: 'bg-[var(--semantic-success)]/15 text-[var(--semantic-success)] border-[var(--semantic-success)]/20',
 error: 'bg-destructive/15 text-destructive border-destructive/20',
 warning: 'bg-[var(--semantic-warning)]/15 text-[var(--semantic-warning)] border-[var(--semantic-warning)]/20',
 info: 'bg-muted text-muted-foreground border-border/50',
 };
 
 return (
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]} ${className}`}>
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
 <div className="text-center py-12 px-6">
 <div className="w-14 h-14 mx-auto mb-4 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
 {icon}
 </div>
 <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
 <p className="text-muted-foreground max-w-sm mx-auto mb-4 text-sm">{description}</p>
 {action && <div>{action}</div>}
 </div>
);

export const LoadingSpinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
 const sizes = { sm: 'w-5 h-5 border-2', md: 'w-7 h-7 border-2', lg: 'w-10 h-10 border-3' };
 return (
 <div className={`${sizes[size]} rounded-full border-t-transparent border-accent animate-spin ${className}`} />
 );
};
