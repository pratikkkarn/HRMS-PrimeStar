import React from 'react';
import { useData } from '../../../context/DataContext';
import { useRole } from '../../../context/RoleContext';
import { StatCard, Card, Badge, Button } from '../../common/UIComponents';
import { formatINRCompact, formatINR, formatDate } from '../../../lib/utils';
import {
  DollarSign,
  Briefcase,
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
} from 'lucide-react';

export const AdminDashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { purchaseOrders, projects, candidates, employees, timesheets } = useData();
  const { currentUser } = useRole();

  const totalPoValue = purchaseOrders.reduce((s, p) => s + p.amountExclGst, 0);
  const remainingPoVal = purchaseOrders.reduce((s, p) => s + p.remainingBalanceExclGst, 0);
  const activeCount = purchaseOrders.filter((p) => p.status === 'Active').length;
  const expiringCount = purchaseOrders.filter((p) => p.status === 'Expiring Soon').length;
  const awaitingReviewCount = candidates.filter((c) => c.status === 'Submitted').length;
  const pendingTimesheets = timesheets.filter((t) => t.status === 'Submitted').length;

  return (
    <div className="space-y-6">
      {/* WELCOME BANNER */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            PRIME STAR HRMS & FINANCIALS
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Executive Control Center
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Role: <strong>{currentUser.role}</strong> ({currentUser.name}) · Centralized PO Tracking, Onboarding & Workforce Portal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('po-tracker')}
          >
            Launch PO Tracker
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-white border-slate-700 hover:bg-slate-800"
            onClick={() => onNavigate('onboarding')}
          >
            Onboarding Pipeline
          </Button>
        </div>
      </div>

      {/* METRIC STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total PO Portfolio"
          value={formatINRCompact(totalPoValue)}
          subtitle={`${purchaseOrders.length} PO Records`}
          icon={<DollarSign className="w-4 h-4 text-indigo-600" />}
        />
        <StatCard
          title="Unbilled Balance"
          value={formatINRCompact(remainingPoVal)}
          subtitle="Remaining INR"
          icon={<Briefcase className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Active POs"
          value={activeCount}
          subtitle="Nominal state"
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Expiring / Low"
          value={expiringCount}
          subtitle="Requires attention"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          className={expiringCount > 0 ? 'bg-amber-50/40 border-amber-200' : ''}
        />
        <StatCard
          title="Candidates Review"
          value={awaitingReviewCount}
          subtitle="Submitted forms"
          icon={<UserCheck className="w-4 h-4 text-indigo-600" />}
        />
        <StatCard
          title="Timesheets Pending"
          value={pendingTimesheets}
          subtitle="Awaiting PM check"
          icon={<Clock className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* QUICK WORKFLOW TILES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
              PRIORITY ONE
            </span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">PO Tracker & Financials</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Centralized purchase order management, SOW linkages, quotation chains, credit notes & balance tracking for Prime Star clients.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onNavigate('po-tracker')}
          >
            Open PO Tracker
          </Button>
        </Card>

        <Card className="p-5 space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
              PRIORITY TWO
            </span>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Candidate Onboarding</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-step candidate onboarding, personal link invitations, HR verification, salary structure builder & offer letters.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onNavigate('onboarding')}
          >
            Manage Onboarding
          </Button>
        </Card>

        <Card className="p-5 space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
              PRIORITY THREE
            </span>
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Employee Self-Service</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Personal profiles, monthly payslips, CTC breakdown, weekly timesheets & unlock approvals.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onNavigate('portal')}
          >
            Switch to Employee Portal
          </Button>
        </Card>
      </div>
    </div>
  );
};
