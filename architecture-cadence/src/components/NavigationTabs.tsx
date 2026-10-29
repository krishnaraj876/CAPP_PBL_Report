/**
 * Architecture Cadence - Primary Workbench Navigation Tabs
 * Signal Blue active indicator (#0284C7) and Technical Cyan accents.
 */

import React from 'react';
import {
  GitCommit,
  Database,
  Layers,
  ShieldAlert,
  Code,
} from 'lucide-react';

export type TabId = 'pipeline' | 'registers' | 'cache' | 'hazards' | 'assembler';

interface NavigationTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hazardCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  hazardCount,
}) => {
  const tabs = [
    {
      id: 'pipeline' as TabId,
      label: 'Pipeline Datapath & Timing',
      icon: GitCommit,
      badge: '5-Stage',
    },
    {
      id: 'registers' as TabId,
      label: 'Registers & Memory Bus',
      icon: Database,
      badge: 'R0-R31',
    },
    {
      id: 'cache' as TabId,
      label: 'Cache Mapping & Telemetry',
      icon: Layers,
      badge: 'L1 Data',
    },
    {
      id: 'hazards' as TabId,
      label: 'Hazard Detection Matrix',
      icon: ShieldAlert,
      badge: hazardCount > 0 ? `${hazardCount} Active` : 'Clear',
      badgeColor: hazardCount > 0 ? 'bg-[#ffdad6] text-[#93000a] border-[#ffdad6]' : undefined,
    },
    {
      id: 'assembler' as TabId,
      label: 'Program Lab & Assembler',
      icon: Code,
      badge: 'RV32I',
    },
  ];

  return (
    <nav className="bg-white border-b border-[#e2e8f0] px-4 shadow-[0_1px_2px_rgba(15,42,74,0.03)]" aria-label="Workbench screens">
      <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-[1px] ${
                isActive
                  ? 'border-[#0284c7] text-[#0f2a4a] bg-[#eff4ff]/60'
                  : 'border-transparent text-[#475569] hover:text-[#0f2a4a] hover:bg-[#f8f9ff]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#0284c7]' : 'text-[#64748b]'}`} />
              <span className="font-heading tracking-tight">{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    tab.badgeColor
                      ? tab.badgeColor
                      : isActive
                      ? 'bg-[#cce5ff] text-[#004b73] border-[#93ccff]'
                      : 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
