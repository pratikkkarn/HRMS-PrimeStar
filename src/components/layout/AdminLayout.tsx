import React, { useState, ReactNode } from 'react';
import { useRole } from '../../context/RoleContext';
import { useData } from '../../context/DataContext';
import { UserRole, getInitials } from '../../types/roles';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  DollarSign,
  FolderKanban,
  Users,
  UserPlus,
  Building2,
  Clock,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Search,
  User,
  Shield,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onSignOut: () => void;
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onNavigate,
  onSignOut,
  children,
}) => {
  const { currentRole, currentUser, permissions, switchRole, allDemoUsers } = useRole();
  const { notifications, markNotificationRead } = useData();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const unreadNotifs = notifications.filter((n) => !n.isRead);
  const userInitials = getInitials(currentUser.name);

  // Grouped Navigation Items matching role permissions
  const navGroups = [
    {
      groupTitle: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
      ],
    },
    {
      groupTitle: 'PO MANAGEMENT',
      items: [
        { id: 'projects', label: 'Projects', icon: Briefcase, visible: permissions.canViewPODashboard },
        { id: 'po-tracker', label: 'Purchase Orders', icon: FileText, visible: permissions.canViewPODashboard },
        { id: 'invoices', label: 'Invoices', icon: DollarSign, visible: permissions.canViewFinancials },
        { id: 'proforma-invoices', label: 'Proforma Invoices', icon: FileSpreadsheet, visible: permissions.canViewFinancials || permissions.canManageInvoices },
        { id: 'documents', label: 'Documents', icon: FolderKanban, visible: permissions.canViewPODashboard },
        { id: 'assignments', label: 'Employee Assignments', icon: Users, visible: permissions.canAssignEmployeesToPO },
      ],
    },
    {
      groupTitle: 'HUMAN RESOURCES',
      items: [
        { id: 'onboarding', label: 'Onboarding', icon: UserPlus, visible: permissions.canViewOnboarding },
        { id: 'profile-requests', label: 'Profile Requests', icon: UserCheck, visible: permissions.canReviewProfileChangeRequests },
        { id: 'employees', label: 'Employees', icon: Users, visible: permissions.canViewEmployeeDirectory },
        { id: 'salary-structures', label: 'Salary Structure', icon: Building2, visible: permissions.canManageSalaryStructures },
        { id: 'timesheets', label: 'Timesheets', icon: Clock, visible: permissions.canApproveTimesheets },
      ],
    },
    {
      groupTitle: 'OTHER',
      items: [
        { id: 'reports', label: 'Reports', icon: BarChart3, visible: permissions.canViewReports },
        { id: 'notifications', label: 'Notifications', icon: Bell, visible: true },
        { id: 'settings', label: 'Settings', icon: Settings, visible: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* DEMO ROLE SWITCHER BANNER */}
      <div className="bg-[#050A18] text-slate-200 px-4 py-1 text-xs flex flex-wrap items-center justify-between border-b border-slate-800 gap-2 shrink-0 z-40">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 uppercase tracking-wider text-[10px]">
            <Shield className="w-3 h-3" /> DEMO MODE
          </span>
          <span className="text-slate-400">Active View Role:</span>
          <strong className="text-white font-semibold">{currentRole}</strong>
          <span className="text-slate-400 hidden sm:inline">({currentUser.name})</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-0.5 rounded border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Switch Role ({currentRole})</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {roleSwitcherOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Select Active Development Role
              </div>
              {allDemoUsers.map((u) => (
                <button
                  key={u.role}
                  onClick={() => {
                    switchRole(u.role as UserRole);
                    setRoleSwitcherOpen(false);
                    if (u.role === 'Employee') {
                      onNavigate('portal');
                    }
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer',
                    currentRole === u.role && 'bg-blue-50 font-semibold text-blue-700'
                  )}
                >
                  <div>
                    <div className="font-bold text-slate-900">{u.role}</div>
                    <div className="text-[10px] text-slate-500">{u.name}</div>
                  </div>
                  {currentRole === u.role && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR (~250px WIDE, DARK NAVY) */}
        <aside className="hidden lg:flex w-[250px] bg-[#070E20] text-slate-300 border-r border-slate-800/80 flex-col shrink-0 z-30 select-none">
          {/* BRAND LOGO HEADER */}
          <div className="p-4 border-b border-slate-800/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
              ★
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block leading-none">
                PRIME STAR
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                HR MANAGEMENT SYSTEM
              </span>
            </div>
          </div>

          {/* GROUPED SIDEBAR NAVIGATION */}
          <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((item) => item.visible);
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.groupTitle} className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    {group.groupTitle}
                  </div>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left whitespace-nowrap cursor-pointer',
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                        )}
                      >
                        <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* SIDEBAR FOOTER (USER BRANDING SYNCHRONIZED WITH CURRENT USER) */}
          <div className="p-3 border-t border-slate-800/80 bg-[#050A18]">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.role}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* WHITE TOP NAVIGATION BAR */}
          <header className="h-14 bg-white border-b border-slate-200/90 px-4 lg:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
            {/* LEFT: BREADCRUMBS & MOBILE MENU TRIGGER */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-semibold text-slate-900 capitalize">
                  {currentTab === 'dashboard'
                    ? 'Dashboard'
                    : currentTab === 'po-tracker'
                    ? 'PO Management / Purchase Orders'
                    : currentTab === 'documents'
                    ? 'PO Management / Documents'
                    : currentTab === 'assignments'
                    ? 'PO Management / Employee Assignments'
                    : currentTab.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* CENTER: GLOBAL SEARCH INPUT */}
            <div className="hidden md:flex items-center relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Search anything... (Ctrl + K)"
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* RIGHT: NOTIFICATIONS & USER PROFILE MENU */}
            <div className="flex items-center gap-3 shrink-0">
              {/* NOTIFICATION BELL */}
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-900">Notifications</span>
                      <span className="text-[11px] text-blue-600 font-semibold">{unreadNotifs.length} Unread</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={cn(
                            'p-3 hover:bg-slate-50 cursor-pointer transition-colors',
                            !n.isRead && 'bg-blue-50/30'
                          )}
                        >
                          <div className="flex items-center justify-between text-slate-900 mb-0.5">
                            <span className="font-bold">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SYNCHRONIZED USER PROFILE DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                    {userInitials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{currentUser.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-blue-700 font-semibold">{currentUser.role}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{currentUser.email}</div>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Profile & Account</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onNavigate('settings');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Settings</span>
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* MAIN PAGE VIEWPORT */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-100/70">
            {children}
          </main>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative flex-1 max-w-xs w-full bg-[#070E20] text-slate-200 flex flex-col p-4 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="font-bold text-white text-sm">PRIME STAR HRMS</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-4 overflow-y-auto">
              {navGroups.map((group) => {
                const visibleItems = group.items.filter((item) => item.visible);
                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.groupTitle} className="space-y-1">
                    <div className="px-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      {group.groupTitle}
                    </div>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left cursor-pointer',
                            currentTab === item.id ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300'
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
