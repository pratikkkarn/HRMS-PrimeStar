import React from 'react';
import { useRole } from '../../context/RoleContext';
import { useData } from '../../context/DataContext';
import { Card, StatCard, Badge, Button } from '../common/UIComponents';
import { formatINR, formatDate } from '../../lib/utils';
import { Megaphone, Calendar, FileText, Clock, User, Briefcase, ArrowRight } from 'lucide-react';

export const PortalDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser } = useRole();
  const { employees, timesheets } = useData();

  const employee = employees.find((e) => e.employeeId === currentUser.employeeId) || employees[0];
  const userTimesheets = timesheets.filter((t) => t.employeeId === employee.employeeId);
  const latestTimesheet = userTimesheets[0];

  return (
    <div className="space-y-6">
      {/* WELCOME BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            PRIME STAR EMPLOYEE SELF-SERVICE
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Welcome back, {employee.name}!
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            {employee.designation} · Assigned Project: <strong>{employee.projectName}</strong> (Manager: {employee.managerName})
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('portal-timesheets')}
          >
            My Timesheets
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-white border-slate-700 hover:bg-slate-800"
            onClick={() => onNavigate('portal-payslips')}
          >
            View Payslips
          </Button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Employee ID"
          value={employee.employeeId}
          subtitle={`Joined ${formatDate(employee.joiningDate)}`}
          icon={<User className="w-4 h-4 text-indigo-600" />}
          onClick={() => onNavigate('portal-profile')}
        />
        <StatCard
          title="Monthly Net Take-Home"
          value={formatINR(employee.salaryStructure.netTakeHomeMonthly)}
          subtitle="Direct Bank Deposit"
          icon={<FileText className="w-4 h-4 text-emerald-600" />}
          onClick={() => onNavigate('portal-salary')}
        />
        <StatCard
          title="Assigned Project"
          value={employee.projectName.split(' ')[0]}
          subtitle={`Manager: ${employee.managerName}`}
          icon={<Briefcase className="w-4 h-4 text-indigo-600" />}
          onClick={() => onNavigate('portal-profile')}
        />
        <StatCard
          title="Current Timesheet Status"
          value={latestTimesheet?.status || 'Draft'}
          subtitle={`Week ending ${latestTimesheet?.periodEndDate || 'Oct 19'}`}
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          onClick={() => onNavigate('portal-timesheets')}
        />
      </div>

      {/* ANNOUNCEMENTS & QUICK SHORTCUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              Company Announcements & Policy Updates
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900">Diwali Holiday & Year-End Payroll Schedule</span>
                <span className="text-[10px] text-indigo-600 font-mono">12 Oct 2026</span>
              </div>
              <p className="text-indigo-800 leading-relaxed">
                Company offices will remain closed on Oct 24 & Oct 25 for Diwali celebrations. October payroll will be disbursed on Oct 29.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Weekly Timesheet Submission Reminder</span>
                <span className="text-[10px] text-slate-500 font-mono">08 Oct 2026</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                All consultants assigned to HDFC & TATA projects must submit weekly timesheets before Monday 10:00 AM IST for billing validation.
              </p>
            </div>
          </div>
        </Card>

        {/* QUICK SHORTCUTS CARD */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Employee Shortcuts
          </h3>

          <div className="space-y-2">
            {[
              { id: 'portal-profile', label: 'My Personal & Bank Details', icon: User },
              { id: 'portal-payslips', label: 'Download October Payslip', icon: FileText },
              { id: 'portal-salary', label: 'View Salary CTC Breakdown', icon: FileText },
              { id: 'portal-timesheets', label: 'Log Weekly Hours & Tasks', icon: Clock },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => onNavigate(s.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-indigo-600" />
                    <span>{s.label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
