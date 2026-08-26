'use client';
import React, { useEffect, useState } from 'react';
import { 
  Command, 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem, 
  CommandSeparator 
} from '@/components/ui/command';
import { 
  BarChart3, 
  FileText, 
  RefreshCcw, 
  LayoutGrid, 
  Image, 
  Boxes, 
  Receipt, 
  Wallet, 
  Database, 
  Bus, 
  ShieldCheck, 
  Users, 
  Settings, 
  GraduationCap, 
  Building2, 
  History, 
  Plus, 
  Upload, 
  SunMoon, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { useTheme } from '@amazecontinuityprojects/amazeui';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  setActiveSubTab?: (subTab: string) => void;
  onLogout?: () => void;
  onOpenUpload?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  setActiveTab,
  setActiveSubTab,
  onLogout,
  onOpenUpload
}: CommandPaletteProps) {
  const { theme, setTheme } = useTheme();

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Handled by parent or caller
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);

  const handleSelect = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <div className="flex items-center px-3 border-b border-border/50 bg-card/90 backdrop-blur-xl">
        <CommandInput 
          placeholder="Search tabs, actions, or jump anywhere... (Cmd+K)" 
          className="h-12 text-sm bg-transparent border-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 text-foreground"
        />
      </div>
      <CommandList className="max-h-[380px] overflow-y-auto p-2 bg-card/90 backdrop-blur-2xl text-foreground">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          No matching commands or pages found.
        </CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions" className="text-xs font-bold text-muted-foreground uppercase px-2 py-1.5">
          {onOpenUpload && (
            <CommandItem
              onSelect={() => handleSelect(onOpenUpload)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
            >
              <div className="p-1 rounded-lg bg-primary/10 text-primary">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium flex-1">Upload New Exam Paper</span>
              <span className="text-[10px] text-muted-foreground font-mono">Q-Bank</span>
            </CommandItem>
          )}
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('push'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <div className="p-1 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium flex-1">Send Push Broadcast</span>
            <span className="text-[10px] text-muted-foreground font-mono">Notifications</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <div className="p-1 rounded-lg bg-primary/10 text-primary">
              <SunMoon className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium flex-1">Toggle Dark / Light Theme</span>
            <span className="text-[10px] text-muted-foreground font-mono">Theme</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1 border-border/40" />

        {/* Academic & Question Bank Content */}
        <CommandGroup heading="Content & Papers" className="text-xs font-bold text-muted-foreground uppercase px-2 py-1.5">
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('papers'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Papers Directory</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => {
              setActiveTab('qbank');
              if (setActiveSubTab) setActiveSubTab('queue');
            })}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <RefreshCcw className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">OCR Processing Queue</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('questions'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Question Bank Browser</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('diagrams'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <Image className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Diagrams & Asset Manager</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1 border-border/40" />

        {/* GoRoBo Commerce */}
        <CommandGroup heading="GoRoBo Electronics Store" className="text-xs font-bold text-muted-foreground uppercase px-2 py-1.5">
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('gorobo-analytics'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Store Overview & Metrics</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('gorobo-inventory'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <Boxes className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Inventory & Stock Manager</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('gorobo-orders'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Orders & POS BOM Quoter</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('gorobo-bundles'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Project Kits & Bundles</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('gorobo-wallet'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Amaze Wallet Ledger</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1 border-border/40" />

        {/* System & Campus Services */}
        <CommandGroup heading="Campus & System" className="text-xs font-bold text-muted-foreground uppercase px-2 py-1.5">
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('dashboard'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">System Overview & Analytics</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('buses'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <Bus className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Transport & Bus Manager</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('fresher-resources'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Fresher Resources</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('faculty-directories'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Faculty Directories</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('storage'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Storage & Quotas</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('audit_logs'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Audit Logs</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('users'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">User & Role Management</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setActiveTab('settings'))}
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors aria-selected:bg-primary/15 aria-selected:text-primary"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium flex-1">Settings & Configurations</span>
          </CommandItem>
        </CommandGroup>

        {onLogout && (
          <>
            <CommandSeparator className="my-1 border-border/40" />
            <CommandGroup heading="Session" className="text-xs font-bold text-muted-foreground uppercase px-2 py-1.5">
              <CommandItem
                onSelect={() => handleSelect(onLogout)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors aria-selected:bg-destructive/15 aria-selected:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium flex-1">Sign Out</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
