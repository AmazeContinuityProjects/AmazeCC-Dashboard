'use client';
import React from 'react';
import { 
  Button,
  Input, 
  Textarea, 
  Select, 
  StatusBadge as AmazeStatusBadge, 
  Breadcrumbs as AmazeBreadcrumbs, 
  EmptyState as AmazeEmptyState, 
  LoadingSpinner as AmazeLoadingSpinner
} from '@amazecontinuityprojects/amazeui';

export const GlassCard = ({ children, className = '', hover = false, padding = 'p-5', innerGlow = false }: {
 children: React.ReactNode;
 className?: string;
 hover?: boolean;
 padding?: string;
 innerGlow?: boolean;
}) => (
 <div
   className={`relative rounded-3xl border border-border/50 bg-card/60 backdrop-blur-2xl shadow-sm ${padding} ${hover ? 'transition-colors hover:border-accent/40' : ''} ${innerGlow ? 'before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-accent/5 before:to-transparent before:pointer-events-none' : ''} ${className}`}
 >
 {children}
 </div>
);

export const GlassButton = ({ children, className = '', variant = 'primary', size = 'md', disabled, ...props }: {
 children: React.ReactNode;
 className?: string;
 variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
 size?: 'sm' | 'md' | 'lg';
 disabled?: boolean;
 onClick?: () => void;
 type?: 'button' | 'submit' | 'reset';
 form?: string;
}) => {
 const mappedVariant = variant === 'danger' ? 'destructive' : variant === 'primary' ? 'default' : variant;
 
 return (
 <Button
   variant={mappedVariant as any}
   size={size === 'md' ? 'default' : size}
   className={className}
   disabled={disabled}
   onClick={props.onClick}
   type={props.type}
   form={props.form}
 >
 {children}
 </Button>
 );
};

export const GlassInput = Input;
export const GlassTextarea = Textarea;
export const GlassSelect = Select;

export const Breadcrumbs = AmazeBreadcrumbs;

export const SectionHeader = ({ title, description, action, breadcrumbs, icon }: {
 title: string;
 description?: string;
 action?: React.ReactNode;
 breadcrumbs?: { label: string; href?: string; active?: boolean }[];
 icon?: React.ReactNode;
}) => (
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
 <div>
 {breadcrumbs && <AmazeBreadcrumbs items={breadcrumbs} />}
 <div className="flex items-center gap-3">
   {icon && <div className="shrink-0">{icon}</div>}
   <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight font-display">{title}</h2>
 </div>
 {description && <p className="text-muted-foreground mt-1 max-w-2xl text-sm font-medium">{description}</p>}
 </div>
 {action && <div className="flex-shrink-0 sm:mt-0">{action}</div>}
 </div>
);

export const StatusBadge = AmazeStatusBadge;

// amazeui's EmptyState type requires action/className; make them optional.
export const EmptyState = ({ icon, title, description, action, className }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) => (
  <AmazeEmptyState icon={icon} title={title} description={description} action={action} className={className} />
);

// The amazeui LoadingSpinner types require className/label, but most call
// sites use it bare. Wrap it so those props stay optional.
export const LoadingSpinner = ({ size = 'md', className, label }: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}) => (
  <AmazeLoadingSpinner size={size} className={className as any} label={label} />
);
