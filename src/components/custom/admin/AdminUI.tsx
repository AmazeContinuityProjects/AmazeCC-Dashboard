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

export const GlassCard = ({ children, className = '', hover = true, padding = 'p-6', innerGlow = false }: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
  innerGlow?: boolean;
}) => (
  <div
    className={`relative rounded-3xl border border-border/50 bg-card/70 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 ${padding} ${
      hover ? 'hover:border-accent/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5' : ''
    } ${
      innerGlow ? 'before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-accent/5 before:via-transparent before:to-transparent before:pointer-events-none' : ''
    } ${className}`}
  >
    {children}
  </div>
);

export const GlassButton = ({ children, className = '', variant = 'primary', size = 'md', disabled, ...props }: {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
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
      className={`font-semibold cursor-pointer active:scale-[0.98] transition-all rounded-xl ${className}`}
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
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
      {breadcrumbs && <AmazeBreadcrumbs items={breadcrumbs} />}
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2.5 rounded-2xl bg-accent/10 border border-accent/20 text-accent shrink-0 shadow-xs">
            {icon}
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight font-display">
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm font-medium leading-relaxed">
          {description}
        </p>
      )}
    </div>
    {action && <div className="flex-shrink-0 sm:mt-0 flex items-center gap-2">{action}</div>}
  </div>
);

export const StatusBadge = AmazeStatusBadge;

export const EmptyState = ({ icon, title, description, action, className }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) => (
  <AmazeEmptyState icon={icon} title={title} description={description} action={action} className={className} />
);

export const LoadingSpinner = ({ size = 'md', className, label }: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}) => (
  <AmazeLoadingSpinner size={size} className={className as any} label={label} />
);
