import React, { useState } from 'react';
import { Card, StatCard, Badge, Button } from '../../common/UIComponents';
import { formatINR, formatINRCompact, formatDate } from '../../../lib/utils';
import { useRole } from '../../../context/RoleContext';
import { useData } from '../../../context/DataContext';
import {
  PROJECT_CHART_DATA,
  STATUS_DISTRIBUTION_DATA,
  RECENT_PO_RECORDS,
} from '../../../services/dashboardData';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Eye,
  MoreVertical,
  Plus,
  DollarSign,
  Briefcase,
  Inbox,
  BarChart3,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AdminDashboardViewProps {
  onNavigate: (tab: string, params?: any) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const { currentUser } = useRole();
  const { purchaseOrders, projects } = useData();
  const [dateRange, setDateRange] = useState('This Quarter (Q3 2026)');
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Compute live summary from purchaseOrders
  const totalPOsCount = purchaseOrders.length;
  const activePOsCount = purchaseOrders.filter((p) => p.status === 'Active').length;
  const expiringSoonPOsCount = purchaseOrders.filter((p) => p.status === 'Expiring Soon').length;
  const lowBalancePOsCount = purchaseOrders.filter((p) => p.status === 'Low Balance').length;

  const totalPOValueNum = purchaseOrders.reduce((sum, p) => sum + (p.amountExclGst || 0), 0);
  const activePOValueNum = purchaseOrders
    .filter((p) => p.status === 'Active')
    .reduce((sum, p) => sum + (p.amountExclGst || 0), 0);
  const expiringValueNum = purchaseOrders
    .filter((p) => p.status === 'Expiring Soon')
    .reduce((sum, p) => sum + (p.amountExclGst || 0), 0);
  const lowBalanceValueNum = purchaseOrders
    .filter((p) => p.status === 'Low Balance')
    .reduce((sum, p) => sum + (p.amountExclGst || 0), 0);
  const remainingBalanceNum = purchaseOrders.reduce((sum, p) => sum + (p.remainingBalanceExclGst || 0), 0);

  const summary = {
    totalPOs: totalPOsCount,
    totalPOValueStr: formatINRCompact(totalPOValueNum),
    activePOs: activePOsCount,
    activePOValueStr: formatINRCompact(activePOValueNum),
    expiringSoonPOs: expiringSoonPOsCount,
    expiringValueStr: formatINRCompact(expiringValueNum),
    lowBalancePOs: lowBalancePOsCount,
    lowBalanceValueStr: formatINRCompact(lowBalanceValueNum),
    totalPOValueDisplay: formatINR(totalPOValueNum),
    remainingBalanceDisplay: formatINR(remainingBalanceNum),
  };

  // Dynamic Chart Data
  const dynamicProjectChartData = projects.map((p) => ({
    projectName: p.name,
    totalValue: p.totalPoValue || 0,
    remainingBalance: p.remainingBalance || 0,
  }));

  const statusCounts = {
    Active: purchaseOrders.filter((p) => p.status === 'Active').length,
    'Expiring Soon': purchaseOrders.filter((p) => p.status === 'Expiring Soon').length,
    'Low Balance': purchaseOrders.filter((p) => p.status === 'Low Balance').length,
    Expired: purchaseOrders.filter((p) => p.status === 'Expired').length,
    'Fully Utilized': purchaseOrders.filter((p) => p.status === 'Fully Utilized').length,
    Renewed: purchaseOrders.filter((p) => p.status === 'Renewed').length,
  };

  const dynamicStatusDistributionData = [
    { name: 'Active', value: statusCounts.Active, color: '#10B981' },
    { name: 'Expiring Soon', value: statusCounts['Expiring Soon'], color: '#F59E0B' },
    { name: 'Low Balance', value: statusCounts['Low Balance'], color: '#EF4444' },
    { name: 'Expired', value: statusCounts.Expired, color: '#6B7280' },
    { name: 'Fully Utilized', value: statusCounts['Fully Utilized'], color: '#8B5CF6' },
    { name: 'Renewed', value: statusCounts.Renewed, color: '#3B82F6' },
  ];

  // Dynamic Recent POs
  const recentPOs = purchaseOrders.slice(0, 5).map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    projectName: po.projectName,
    requester: po.poRequester,
    startDate: po.startDate,
    endDate: po.expiryDate,
    poValue: po.amountExclGst,
    remainingBalance: po.remainingBalanceExclGst,
    status: po.status,
  }));

  const userFirstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Vijay';

  const chartDataToUse = dynamicProjectChartData.length > 0 ? dynamicProjectChartData : PROJECT_CHART_DATA;
  const statusDataToUse = dynamicStatusDistributionData.some((s) => s.value > 0)
    ? dynamicStatusDistributionData
    : STATUS_DISTRIBUTION_DATA;

  const hasChartData = chartDataToUse.some((p) => p.totalValue > 0 || p.remainingBalance > 0);
  const hasStatusData = statusDataToUse.some((s) => s.value > 0);

  return (
    <div className="space-y-6 text-xs">
      {/* 3. DASHBOARD HEADER (DYNAMICALLY SYNCHRONIZED WITH ACTIVE ROLE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Good morning, {userFirstName} <span className="text-lg">👋</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here's an overview of your purchase orders and projects.
          </p>
        </div>

        {/* UPPER RIGHT DATE & RANGE SELECTOR */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Monday, 12 Oct 2026</span>
          </div>

          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="This Quarter (Q3 2026)">This Quarter (Q3 2026)</option>
              <option value="This Month (Oct 2026)">This Month (Oct 2026)</option>
              <option value="Financial Year 2026-27">Financial Year 2026-27</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. SUMMARY CARDS (DYNAMIC METRICS) */}
      <div className="space-y-4">
        {/* TOP FOUR COUNT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total POs"
            value={summary.totalPOs}
            subtitle={summary.totalPOValueStr}
            icon={<FileText className="w-4 h-4 text-blue-600" />}
            onClick={() => onNavigate('po-tracker', { statusFilter: 'ALL' })}
          />
          <StatCard
            title="Active POs"
            value={summary.activePOs}
            subtitle={summary.activePOValueStr}
            icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
            onClick={() => onNavigate('po-tracker', { statusFilter: 'Active' })}
          />
          <StatCard
            title="Expiring Soon"
            value={summary.expiringSoonPOs}
            subtitle={summary.expiringValueStr}
            icon={<Clock className="w-4 h-4 text-amber-600" />}
            onClick={() => onNavigate('po-tracker', { statusFilter: 'Expiring Soon' })}
          />
          <StatCard
            title="Low Balance"
            value={summary.lowBalancePOs}
            subtitle={summary.lowBalanceValueStr}
            icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
            onClick={() => onNavigate('po-tracker', { statusFilter: 'Low Balance' })}
          />
        </div>

        {/* TWO FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            onClick={() => onNavigate('po-tracker', { statusFilter: 'ALL' })}
            className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 border-blue-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  Total PO Value
                </span>
                <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                  {summary.totalPOValueDisplay}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Gross contractual commitment across active projects</p>
              </div>
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card
            onClick={() => onNavigate('po-tracker', { statusFilter: 'ALL' })}
            className="p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 border-emerald-200 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Remaining PO Balance
                </span>
                <span className="text-2xl font-black font-mono text-emerald-900 tabular-nums">
                  {summary.remainingBalanceDisplay}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Available unbilled balance for future invoicing</p>
              </div>
              <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 5. CHARTS SECTION (WITH ZERO DATA / EMPTY STATES) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT BAR CHART: PO VALUE BY PROJECT */}
        <Card className="lg:col-span-2 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">PO Value by Project</h3>
              <p className="text-[11px] text-slate-500">
                Comparison of Total Contract Value vs Remaining Balance (INR)
              </p>
            </div>
          </div>

          <div className="h-64 w-full text-xs relative flex items-center justify-center">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataToUse} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="projectName" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => formatINRCompact(v)} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), 'Amount']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="totalValue" fill="#2563EB" radius={[4, 4, 0, 0]} name="Total PO Value" />
                  <Bar dataKey="remainingBalance" fill="#10B981" radius={[4, 4, 0, 0]} name="Remaining Balance" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 space-y-2">
                <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No project data available yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Purchase orders and project financial metrics will appear here once connected to the backend.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* RIGHT DOUGHNUT CHART: PO STATUS DISTRIBUTION */}
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">PO Status Distribution</h3>
            <p className="text-[11px] text-slate-500">Breakdown across portfolio states</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center relative">
            {hasStatusData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDataToUse}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDataToUse.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-1">
                <PieIcon className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No PO data available yet</p>
                <p className="text-[10px] text-slate-400">All status counts are currently 0.</p>
              </div>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
              <span className="text-xl font-bold font-mono text-slate-900">{summary.totalPOs}</span>
              <span className="text-[9px] text-slate-400 uppercase font-semibold">Total POs</span>
            </div>
          </div>

          {/* LEGEND WITH COUNTS */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            {statusDataToUse.map((d) => (
              <div
                key={d.name}
                onClick={() => onNavigate('po-tracker', { statusFilter: d.name })}
                className="flex items-center justify-between p-1.5 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                  <span className="text-slate-600 truncate">{d.name}</span>
                </div>
                <strong className="text-slate-900 font-mono ml-1">{d.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 6. RECENT PURCHASE ORDERS TABLE (EMPTY STATE) */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Purchase Orders</h3>
            <p className="text-[11px] text-slate-500">
              Latest contractual commitments and status tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('po-tracker')}
            >
              Add PO
            </Button>
            <button
              onClick={() => onNavigate('po-tracker')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TABLE WITH EMPTY STATE */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">PO Number</th>
                <th className="p-3">Project</th>
                <th className="p-3">Requester</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3 text-right">PO Value (₹)</th>
                <th className="p-3 text-right">Balance (₹)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPOs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                    <h4 className="font-bold text-slate-800 text-sm">No purchase orders yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Purchase orders will appear here once they are added.
                    </p>
                  </td>
                </tr>
              ) : (
                recentPOs.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => onNavigate('po-tracker')}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-slate-900">{po.poNumber}</td>
                    <td className="p-3 font-medium text-slate-800">{po.projectName}</td>
                    <td className="p-3 text-slate-600">{po.requester}</td>
                    <td className="p-3 text-slate-600">{formatDate(po.startDate)}</td>
                    <td className="p-3 text-slate-600">{formatDate(po.endDate)}</td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatINR(po.poValue)}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                      {formatINR(po.remainingBalance)}
                    </td>
                    <td className="p-3">
                      <Badge status={po.status} />
                    </td>
                    <td className="p-3 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuOpenId(actionMenuOpenId === po.id ? null : po.id);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {actionMenuOpenId === po.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-3 top-8 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-left"
                        >
                          <button
                            onClick={() => {
                              setActionMenuOpenId(null);
                              onNavigate('po-tracker');
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-[11px] text-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Details</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
