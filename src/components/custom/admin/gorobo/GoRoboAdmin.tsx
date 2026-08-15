'use client';
import React, { useState } from 'react';
import { Boxes, Receipt } from 'lucide-react';
import { SectionHeader } from '@/components/custom/admin/AdminUI';
import GoRoboInventory from './GoRoboInventory';
import GoRoboBillProcessor from './GoRoboBillProcessor';

const TABS = [
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'bill-processor', label: 'Bill Processor', icon: Receipt },
];

export default function GoRoboAdmin() {
  const [activeSection, setActiveSection] = useState('inventory');

  return (
    <div>
      <SectionHeader
        title="GoRoBo"
        description="Manage the GoRoBo inventory (base price + margin) and process customer orders into final quotes."
      />
      <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50 mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-all flex-1 ${
                activeSection === tab.id
                  ? 'bg-card shadow-sm text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" /> {/* icon left of label, natural flow */}
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeSection === 'inventory' && <GoRoboInventory />}
      {activeSection === 'bill-processor' && <GoRoboBillProcessor />}
    </div>
  );
}
