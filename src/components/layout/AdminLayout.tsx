import React, { useState, ReactNode } from 'react';
import { useRole } from '../../context/RoleContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types/roles';
import {
  FileText,
  Briefcase,
  Users,
  Building2,
  DollarSign,
  UserCheck,
  Clock,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Shield,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentTab, onNavigate, children }) => {
  const { currentRole, currentUser, permissions, switchRole, allDemoUsers } = useRole();
  const { notifications, markNotificationRead } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, visible: true },
    { id: 'po-tracker', label: 'PO Tracker', icon: FileText, visible: permissions.canViewPODashboard },
    { id: 'projects', label: 'Projects', icon: Briefcase, visible: permissions.canViewPODashboard },
    { id: 'invoices', label: 'Invoices & Billing', icon: DollarSign, visible: permissions.canViewFinancials },
    { id: 'onboarding', label: 'Onboarding', icon: UserCheck, visible: permissions.canViewOnboarding },
    { id: 'employees', label: 'Employee Directory', icon: Users, visible: permissions.canViewEmployeeDirectory },
    { id: 'salary-structures', label: 'Salary Structures', icon: Building2, visible: permissions.canManageSalaryStructures },
    { id: 'joining-pipeline', label: 'Joining Pipeline', icon: Layers, visible: permissions.canViewOnboarding },
    { id: 'timesheets', label: 'Timesheet Admin', icon: Clock, visible: permissions.canApproveTimesheets },
    { id: 'reports', label: 'Reports', icon: BarChart3, visible: permissions.canViewReports },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* DEV ROLE SWITCHER BANNER */}
      <div className="bg-slate-900 text-slate-100 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-slate-800 gap-2 shrink-0 z-40">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 uppercase tracking-wider text-[10px]">
            <Shield className="w-3 h-3" /> DEMO MODE
          </span>
          <span className="text-slate-300">Active Role:</span>
          <strong className="text-white font-medium">{currentRole}</strong>
          <span className="text-slate-400 hidden sm:inline">({currentUser.name} — {currentUser.designation})</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-700 text-xs font-medium transition-colors"
          >
            <span>Switch Role ({currentRole})</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Select Frontend Role View
              </div>
              {allDemoUsers.map((user) => (
                <button
                  key={user.role}
                  onClick={() => {
                    switchRole(user.role as UserRole);
                    setRoleDropdownOpen(false);
                    if (user.role === 'Employee') {
                      onNavigate('portal');
                    }
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors',
                    currentRole === user.role && 'bg-indigo-50 font-semibold text-indigo-700'
                  )}
                >
                  <div>
                    <div className="font-medium text-slate-900">{user.role}</div>
                    <div className="text-[11px] text-slate-500">{user.name}</div>
                  </div>
                  {currentRole === user.role && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 flex-col shrink-0 z-30">
          {/* BRAND ZONE */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg tracking-tight shadow-sm">
                ★
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                  PRIME STAR
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase block">
                  HRMS Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left whitespace-nowrap shrink-0',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </nav>

          {/* USER FOOTER */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{currentUser.role}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* HEADER BAR */}
          <header className="h-14 bg-white border-b border-slate-200/80 px-4 lg:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* BREADCRUMBS */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-700">Prime Star HRMS</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900 capitalize">
                  {currentTab.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-3 shrink-0">
              {/* NOTIFICATION CENTER DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg relative transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600"></span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">System Notifications</span>
                      <span className="text-[11px] text-slate-500">{unreadNotifs.length} new</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={cn(
                            'p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors',
                            !n.isRead && 'bg-indigo-50/40 font-medium'
                          )}
                        >
                          <div className="flex items-center justify-between text-slate-900 mb-1">
                            <span className="font-semibold">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK PORTAL SWITCH */}
              <button
                onClick={() => onNavigate('portal')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>Employee Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* MAIN PAGE VIEWPORT */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/60">
            {children}
          </main>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative flex-1 max-w-xs w-full bg-white flex flex-col p-4 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-bold text-slate-900">PRIME STAR HRMS</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems
                .filter((item) => item.visible)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left',
                        currentTab === item.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
