import React, { ReactNode } from 'react';
import { useRole } from '../../context/RoleContext';
import { UserRole } from '../../types/roles';
import { User, FileText, DollarSign, Clock, Shield, LogOut, ChevronRight, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PrimeStarLogo } from '../common/PrimeStarLogo';

interface PortalLayoutProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  children: ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ currentTab, onNavigate, children }) => {
  const { currentRole, currentUser, switchRole, allDemoUsers } = useRole();

  const navItems = [
    { id: 'portal-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'portal-profile', label: 'My Profile', icon: User },
    { id: 'portal-payslips', label: 'Payslips', icon: FileText },
    { id: 'portal-salary', label: 'Salary Structure', icon: DollarSign },
    { id: 'portal-timesheets', label: 'My Timesheets', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* DEV ROLE SWITCHER BANNER */}
      <div className="bg-slate-900 text-slate-100 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-slate-800 gap-2 shrink-0 z-40">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 uppercase tracking-wider text-[10px]">
            EMPLOYEE SELF SERVICE
          </span>
          <span className="text-slate-300">Logged in as:</span>
          <strong className="text-white font-medium">{currentUser.name}</strong>
          <span className="text-slate-400 hidden sm:inline">({currentUser.designation})</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={currentRole}
            onChange={(e) => {
              const r = e.target.value as UserRole;
              switchRole(r);
              if (r !== 'Employee') {
                onNavigate('po-tracker');
              }
            }}
            className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-2 py-1 rounded focus:outline-none"
          >
            {allDemoUsers.map((u) => (
              <option key={u.role} value={u.role}>
                Role: {u.role} ({u.name})
              </option>
            ))}
          </select>

          {currentRole !== 'Employee' && (
            <button
              onClick={() => onNavigate('po-tracker')}
              className="text-indigo-400 hover:text-indigo-300 font-medium text-xs flex items-center gap-1"
            >
              <span>Back to Admin App</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* PORTAL HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PrimeStarLogo size="md" />
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <h1 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                EMPLOYEE PORTAL
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">Self-Service Workforce Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500">{currentUser.employeeId || 'PS-108'} · {currentUser.department}</div>
            </div>
          </div>
        </div>

        {/* PORTAL SUBNAV TABS */}
        <div className="max-w-6xl mx-auto px-4 lg:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer',
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* PORTAL MAIN CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 lg:p-6 my-2">
        {children}
      </main>

      <footer className="py-4 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        © 2026 Prime Star Consulting Services — Internal Employee Portal
      </footer>
    </div>
  );
};
