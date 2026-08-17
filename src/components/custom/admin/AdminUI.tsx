'use client';
import React from 'react';
import { 
  Button as AmazeButton,
  buttonVariants,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input, 
  Textarea, 
  Select,
  Label,
  Checkbox,
  Switch,
  Modal,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DataTable,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  StatusBadge, 
  IconBadge,
  Breadcrumbs, 
  PageHeader,
  SectionHeader as AmazeSectionHeader,
  SubpageLayout,
  SubTabStrip,
  EmptyState as AmazeEmptyState, 
  LoadingSpinner as AmazeLoadingSpinner,
  LoadingScreen,
  Progress,
  ProgressBar,
  CircularProgress,
  SearchInput,
  ViewModeToggle,
  ExpandableSection,
  Alert,
  cn
} from '@amazecontinuityprojects/amazeui';

// Robust Button wrapper that guarantees horizontal inline-flex layout with proper icon alignment
export interface ButtonProps extends React.ComponentPropsWithoutRef<typeof AmazeButton> {
  children?: React.ReactNode;
  className?: string;
  variant?: "link" | "default" | "primary" | "destructive" | "danger" | "success" | "outline" | "secondary" | "ghost" | null;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | null;
  onClick?: (event: any) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  [key: string]: any;
}

export const Button = React.forwardRef<any, ButtonProps>(({ className, children, ...props }, ref) => {
  const hasCustomFlex = className?.includes('flex-col');
  return (
    <AmazeButton
      ref={ref}
      className={cn(
        !hasCustomFlex && "!flex-row !items-center !justify-center gap-2",
        className
      )}
      {...(props as any)}
    >
      {children}
    </AmazeButton>
  );
});
Button.displayName = 'Button';

export {
  buttonVariants,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Select,
  Label,
  Checkbox,
  Switch,
  Modal,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DataTable,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  StatusBadge,
  IconBadge,
  Breadcrumbs,
  PageHeader,
  SubpageLayout,
  SubTabStrip,
  LoadingScreen,
  Progress,
  ProgressBar,
  CircularProgress,
  SearchInput,
  ViewModeToggle,
  ExpandableSection,
  Alert,
  cn
};

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
} from '@/components/ui/table';

// Backward-compatible GlassCard using AmazeUI Card & tokens
export const GlassCard = ({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'p-5', 
  innerGlow = false,
  onClick,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
  innerGlow?: boolean;
  onClick?: () => void;
  [key: string]: any;
}) => (
  <Card
    hover={hover}
    onClick={onClick}
    className={`relative rounded-3xl border border-border/50 bg-card/60 backdrop-blur-2xl shadow-sm ${padding} ${hover ? 'transition-all hover:border-accent/40' : ''} ${innerGlow ? 'before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-accent/5 before:to-transparent before:pointer-events-none' : ''} ${className}`}
    {...props}
  >
    {children}
  </Card>
);

// Backward-compatible GlassButton wrapping AmazeUI Button cleanly
export const GlassButton = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  disabled, 
  type = 'button',
  onClick,
  ...props 
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive' | 'outline' | 'default' | 'link' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'default' | 'icon' | 'icon-sm' | 'icon-lg';
  disabled?: boolean;
  onClick?: (e?: any) => void;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  [key: string]: any;
}) => {
  const mappedVariant = 
    variant === 'danger' ? 'destructive' : 
    variant === 'primary' ? 'primary' : 
    variant;
  
  const mappedSize = 
    size === 'md' ? 'default' : 
    size;

  return (
    <Button
      variant={mappedVariant as any}
      size={mappedSize as any}
      className={className}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </Button>
  );
};

export const GlassInput = Input;
export const GlassTextarea = Textarea;
export const GlassSelect = Select;

export const SectionHeader = ({ 
  title, 
  description, 
  action, 
  breadcrumbs, 
  icon 
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string; active?: boolean }[];
  icon?: React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
    <div>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-2" />}
      <div className="flex items-center gap-3">
        {icon && <div className="shrink-0">{icon}</div>}
        <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight font-display">{title}</h2>
      </div>
      {description && <p className="text-muted-foreground mt-1 max-w-2xl text-sm font-medium">{description}</p>}
    </div>
    {action && <div className="flex-shrink-0 sm:mt-0">{action}</div>}
  </div>
);

// AmazeUI EmptyState wrapper
export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) => (
  <AmazeEmptyState icon={icon} title={title} description={description} action={action} className={className} />
);

// AmazeUI LoadingSpinner wrapper
export const LoadingSpinner = ({ 
  size = 'md', 
  className, 
  label 
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}) => (
  <AmazeLoadingSpinner size={size} className={className as any} label={label} />
);
