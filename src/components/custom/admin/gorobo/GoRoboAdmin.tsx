'use client';
import React, { useState } from 'react';
import {
  Boxes, Receipt, Sparkles, Wallet, BarChart3, ShoppingBag
} from 'lucide-react';
import { SectionHeader, Button } from '@/components/custom/admin/AdminUI';
import GoRoboAnalytics from './GoRoboAnalytics';
import GoRoboInventory from './GoRoboInventory';
import GoRoboBillProcessor from './GoRoboBillProcessor';
import GoRoboBundles from './GoRoboBundles';
import AmazeWallet from './AmazeWallet';
import type { GoroboBundleJson } from './gorobo-api';

interface GoRoboAdminProps {
  initialTab?: string;
}

const TABS = [
  { id: 'analytics', label: 'Store Overview', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
  { id: 'orders', label: 'Orders & POS Quoter', icon: Receipt },
  { id: 'bundles', label: 'Project Kits & Bundles', icon: Sparkles },
  { id: 'wallet', label: 'Amaze Wallet Ledger', icon: Wallet },
];

export default function GoRoboAdmin({ initialTab = 'analytics' }: GoRoboAdminProps) {
  const [activeSection, setActiveSection] = useState(initialTab);

  const handleUseBundleInOrder = (bundle: GoroboBundleJson) => {
    setActiveSection('orders');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub-Navigation Hub */}
      <div className="flex gap-1.5 p-1.5 bg-muted/40 rounded-2xl border border-border/50 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 flex-1 justify-center whitespace-nowrap text-xs transition-all ${
                isActive ? 'shadow-2xs font-bold' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Module Views */}
      {activeSection === 'analytics' && (
        <GoRoboAnalytics
          onNavigateTab={setActiveSection}
          onOpenCreateOrder={() => setActiveSection('orders')}
          onOpenAddItem={() => setActiveSection('inventory')}
        />
      )}
      {activeSection === 'inventory' && <GoRoboInventory />}
      {activeSection === 'orders' && <GoRoboBillProcessor />}
      {activeSection === 'bundles' && <GoRoboBundles onUseBundleInOrder={handleUseBundleInOrder} />}
      {activeSection === 'wallet' && <AmazeWallet />}
    </div>
  );
}
