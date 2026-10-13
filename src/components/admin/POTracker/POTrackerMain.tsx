import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { useRole } from '../../../context/RoleContext';
import { StatCard, Badge, Button, Card } from '../../common/UIComponents';
import { formatINR, formatINRCompact, formatDate, getDaysRemaining } from '../../../lib/utils';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  Building2,
  DollarSign,
  Briefcase,
  Users,
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
import { POCreateModal } from './POCreateModal';
import { PODetailPage } from './PODetailPage';
import { PurchaseOrder, POStatus } from '../../../types/domain';

export const POTrackerMain: React.FC<{ selectedPoId?: string }> = ({ selectedPoId }) => {
  const { purchaseOrders, projects } = useData();
  const { permissions } = useRole();

  const [activePoId, setActivePoId] = useState<string | null>(selectedPoId || null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(projects[0]?.id || null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  // Summary Metrics calculations
  const totalPOs = purchaseOrders.length;
  const activePOs = purchaseOrders.filter((p) => p.status === 'Active').length;
  const expiringSoonPOs = purchaseOrders.filter((p) => p.status === 'Expiring Soon').length;
  const lowBalancePOs = purchaseOrders.filter((p) => p.status === 'Low Balance').length;
  const expiredPOs = purchaseOrders.filter(
    (p) => p.status === 'Expired' || p.status === 'Fully Utilized'
  ).length;

  const totalPoValueExclGst = purchaseOrders.reduce((sum, p) => sum + p.amountExclGst, 0);
  const totalRemainingBalance = purchaseOrders.reduce((sum, p) => sum + p.remainingBalanceExclGst, 0);

  // Chart data preparation
  const chartData = projects.map((p) => {
    const projPOs = purchaseOrders.filter((po) => po.projectId === p.id);
    const totalVal = projPOs.reduce((sum, po) => sum + po.amountExclGst, 0);
    const remBal = projPOs.reduce((sum, po) => sum + po.remainingBalanceExclGst, 0);
    return {
      name: p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name,
      TotalPOValue: totalVal,
      RemainingBalance: remBal,
    };
  });

  const pieData = [
    { name: 'Active', value: activePOs, color: '#10B981' },
    { name: 'Expiring Soon', value: expiringSoonPOs, color: '#F59E0B' },
    { name: 'Low Balance', value: lowBalancePOs, color: '#EF4444' },
    { name: 'Expired/Closed', value: expiredPOs, color: '#6B7280' },
  ].filter((d) => d.value > 0);

  // Filtering POs
  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.poRequester.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    const matchesProject = projectFilter === 'ALL' || po.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  // If viewing a single PO detail
  const currentViewingPO = purchaseOrders.find((p) => p.id === activePoId);
  if (currentViewingPO) {
    return <PODetailPage po={currentViewingPO} onBack={() => setActivePoId(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchase Order (PO) Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track purchase orders, SOW chains, monthly billing deductions & expiry alerts for Prime Star clients.
          </p>
        </div>

        {permissions.canManagePOs && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Purchase Order
          </Button>
        )}
      </div>

      {/* 6.1 PO SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total PO Value"
          value={formatINRCompact(totalPoValueExclGst)}
          subtitle={`${totalPOs} Purchase Orders`}
          icon={<DollarSign className="w-4 h-4 text-indigo-600" />}
        />
        <StatCard
          title="Remaining Balance"
          value={formatINRCompact(totalRemainingBalance)}
          subtitle="Available for billing"
          icon={<Briefcase className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Active POs"
          value={activePOs}
          subtitle="Nominal status"
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Expiring Soon"
          value={expiringSoonPOs}
          subtitle="Within 60 days"
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          className={expiringSoonPOs > 0 ? 'bg-amber-50/40 border-amber-200' : ''}
        />
        <StatCard
          title="Low Balance"
          value={lowBalancePOs}
          subtitle="< 15% remaining"
          icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
          className={lowBalancePOs > 0 ? 'bg-red-50/40 border-red-200' : ''}
        />
        <StatCard
          title="Exhausted / Closed"
          value={expiredPOs}
          subtitle="Requires renewal"
          icon={<FileText className="w-4 h-4 text-slate-500" />}
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Project PO Value vs. Remaining Balance (INR)
            </h3>
          </div>
          <div className="h-56 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => formatINRCompact(v)} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), 'Amount']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="TotalPOValue" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Total PO Value" />
                <Bar dataKey="RemainingBalance" fill="#10B981" radius={[4, 4, 0, 0]} name="Remaining Balance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            PO Portfolio Status Distribution
          </h3>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                <span className="text-slate-600 truncate">{d.name}:</span>
                <strong className="text-slate-900 font-mono">{d.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 6.2 SEARCH & FILTERS BAR */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* SEARCH INPUT */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search PO number, project or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="ALL">All PO Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Low Balance">Low Balance</option>
              <option value="Fully Utilized">Fully Utilized</option>
              <option value="Renewed">Renewed</option>
            </select>

            {(searchTerm || statusFilter !== 'ALL' || projectFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setProjectFilter('ALL');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* GROUPED PROJECT TABLE */}
        <div className="space-y-4 pt-2">
          {projects.map((project) => {
            const projectPOs = filteredPOs.filter((po) => po.projectId === project.id);
            if (projectFilter !== 'ALL' && projectFilter !== project.id) return null;
            if (projectPOs.length === 0 && (searchTerm || statusFilter !== 'ALL')) return null;

            const isExpanded = expandedProjectId === project.id;
            const totalProjectPoVal = projectPOs.reduce((s, po) => s + po.amountExclGst, 0);
            const totalProjectRemBal = projectPOs.reduce((s, po) => s + po.remainingBalanceExclGst, 0);

            return (
              <div
                key={project.id}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
              >
                {/* PROJECT HEADER ROW */}
                <div
                  onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                  className="p-4 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors border-b border-slate-200/60"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-500">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{project.name}</h3>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          {project.code}
                        </span>
                        <Badge status={project.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Client: <strong className="text-slate-800">{project.clientName}</strong> · PM:{' '}
                        {project.projectManager}
                      </p>
                    </div>
                  </div>

                  {/* PROJECT METRICS */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">POs</span>
                      <strong className="text-slate-900">{projectPOs.length} POs</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Total Value</span>
                      <strong className="text-slate-900">{formatINRCompact(totalProjectPoVal)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Remaining</span>
                      <strong className="text-indigo-700">{formatINRCompact(totalProjectRemBal)}</strong>
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE PO LIST */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/60 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">PO Number</th>
                          <th className="p-3">SOW Ref</th>
                          <th className="p-3">Requester</th>
                          <th className="p-3 text-right">PO Amount (Excl. GST)</th>
                          <th className="p-3 text-right">Remaining Balance</th>
                          <th className="p-3">Expiry Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {projectPOs.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-4 text-center text-slate-400">
                              No purchase orders match current search filters for this project.
                            </td>
                          </tr>
                        ) : (
                          projectPOs.map((po) => {
                            const daysLeft = getDaysRemaining(po.expiryDate);
                            return (
                              <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono font-bold text-slate-900">
                                  {po.poNumber}
                                </td>
                                <td className="p-3 font-mono text-slate-600">
                                  {po.sowNumber || '—'}
                                </td>
                                <td className="p-3 text-slate-700">{po.poRequester}</td>
                                <td className="p-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                                  {formatINR(po.amountExclGst)}
                                </td>
                                <td className="p-3 text-right font-mono font-semibold text-indigo-700 tabular-nums">
                                  {formatINR(po.remainingBalanceExclGst)}
                                </td>
                                <td className="p-3 text-slate-700">
                                  {formatDate(po.expiryDate)}
                                  {daysLeft <= 60 && daysLeft > 0 && (
                                    <span className="block text-[10px] text-amber-600 font-semibold">
                                      ({daysLeft}d remaining)
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <Badge status={po.status} />
                                </td>
                                <td className="p-3 text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    icon={<Eye className="w-3.5 h-3.5" />}
                                    onClick={() => setActivePoId(po.id)}
                                  >
                                    View PO
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* CREATE PO MODAL */}
      {createModalOpen && (
        <POCreateModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      )}
    </div>
  );
};
