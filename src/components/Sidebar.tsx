import React from 'react';
import {
  AlertTriangle,
  Archive,
  ClipboardList,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { DashboardSummary } from '../../shared/types';

export type WorkspaceSection = 'all' | 'needs_followup' | 'refunded' | 'settings';

interface SidebarProps {
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  summary: DashboardSummary;
  thresholdDays: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  summary,
  thresholdDays,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems: Array<{
    id: WorkspaceSection;
    label: string;
    count?: number;
    urgent?: boolean;
    icon: React.ReactNode;
  }> = [
    {
      id: 'all',
      label: 'All Cancellations',
      count: summary.totalCount,
      icon: <ClipboardList className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    {
      id: 'needs_followup',
      label: 'Needs Follow-Up',
      count: summary.staleCount,
      urgent: summary.staleCount > 0,
      icon: <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    {
      id: 'refunded',
      label: 'Refunded Archive',
      count: summary.refundedCount,
      icon: <Archive className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    {
      id: 'settings',
      label: 'Follow-Up Rules',
      icon: <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
  ];

  const handleSelect = (section: WorkspaceSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <span className="font-display font-bold text-[15px] tracking-tight text-slate-900 whitespace-nowrap">
          Cancellation Tracker
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Workspace navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <span
                  className={
                    isActive
                      ? 'text-white'
                      : item.urgent
                      ? 'text-red-600'
                      : 'text-slate-400'
                  }
                >
                  {item.icon}
                </span>
                <span className="whitespace-nowrap truncate">{item.label}</span>
              </span>
              {item.count !== undefined && (
                <span
                  className={`font-mono text-xs tabular-nums shrink-0 ${
                    isActive
                      ? 'text-slate-200'
                      : item.urgent
                      ? 'text-red-700 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-200 shrink-0">
        <p className="text-xs font-medium text-slate-500">Active Escalation Window</p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {thresholdDays} {thresholdDays === 1 ? 'day' : 'days'}
          </span>
          <button
            type="button"
            onClick={() => handleSelect('settings')}
            className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
          >
            Adjust
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
          Active cancellations without an update past {thresholdDays}{' '}
          {thresholdDays === 1 ? 'day' : 'days'} are flagged for follow-up.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:sticky lg:top-0 lg:h-screen w-60 shrink-0">
        {navContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-64 max-w-[82vw] h-full">{navContent}</div>
        </div>
      )}
    </>
  );
};
