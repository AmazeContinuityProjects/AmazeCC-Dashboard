'use client';
import React, { useState } from 'react';
import { Boxes, Receipt } from 'lucide-react';
import { SectionHeader, Button } from '@/components/custom/admin/AdminUI';
import GoRoboInventory from './GoRoboInventory';
import GoRoboBillProcessor from './GoRoboBillProcessor';

const TABS = [
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'bill-processor', label: 'Bill Processor', icon: Receipt },
];

export default function GoRoboAdmin() {
  const [activeSection, setActiveSection] = useState('inventory');

  return (
    <div className="space-y-6">
      <SectionHeader
        title="GoRoBo"
        description="Manage the GoRoBo inventory (base price + margin) and process customer orders into final quotes."
      />
      <div className="flex gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/50">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeSection === tab.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection(tab.id)}
              className="flex items-center gap-2 flex-1 justify-center"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>
      {activeSection === 'inventory' && <GoRoboInventory />}
      {activeSection === 'bill-processor' && <GoRoboBillProcessor />}
    </div>
  );
}
