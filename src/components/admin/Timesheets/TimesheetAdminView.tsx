import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useRole } from '../../../context/RoleContext';
import { Card, Button, Badge, Modal, Input, Select, StatCard } from '../../common/UIComponents';
import { formatDate } from '../../../lib/utils';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Unlock,
  Lock,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  FileText,
  UserCheck,
  Calendar,
  X,
  History,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  calculateTimesheetMetrics,
  calculateCategoryBreakdown,
  filterTimesheets,
  exportTimesheetsToCsv,
} from '../../../lib/timesheetUtils';
import { TimesheetEntry, DailyTimesheet } from '../../../types/domain';

export const TimesheetAdminView: React.FC = () => {
  const {
    timesheets,
    employees,
    projects,
    approveTimesheet,
    rejectTimesheet,
    approveUnlockTimesheet,
    rejectUnlockTimesheet,
    bulkApproveTimesheets,
    bulkRejectTimesheets,
    createTimesheet,
  } = useData();

  const { currentUser, permissions } = useRole();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  // Multi-selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [inspectTsId, setInspectTsId] = useState<string | null>(null);
  const [rejectionModalTsId, setRejectionModalTsId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [unlockModalTsId, setUnlockModalTsId] = useState<string | null>(null);
  const [unlockNote, setUnlockNote] = useState('');

  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTsEmployeeId, setNewTsEmployeeId] = useState('');
  const [newTsProjectName, setNewTsProjectName] = useState('');
  const [newTsStartDate, setNewTsStartDate] = useState('');
  const [newTsEndDate, setNewTsEndDate] = useState('');
  const [newTsLogs, setNewTsLogs] = useState<DailyTimesheet[]>([
    {
      date: new Date().toISOString().split('T')[0],
      hoursSpent: 8,
      taskDescription: 'Project task execution & technical delivery',
      category: 'Project Delivery',
    },
  ]);

  // Overall metrics calculation across all timesheets
  const overallMetrics = useMemo(() => calculateTimesheetMetrics(timesheets), [timesheets]);

  // Filtered timesheets list
  const filteredTimesheets = useMemo(() => {
    return filterTimesheets(timesheets, {
      searchQuery,
      statusFilter,
      projectFilter,
      departmentFilter,
    });
  }, [timesheets, searchQuery, statusFilter, projectFilter, departmentFilter]);

  // Filtered metrics calculation
  const filteredMetrics = useMemo(() => calculateTimesheetMetrics(filteredTimesheets), [filteredTimesheets]);

  // Unique lists for select dropdowns
  const projectOptions = useMemo(() => {
    const list = new Set<string>();
    timesheets.forEach((ts) => list.add(ts.projectName));
    projects.forEach((p) => list.add(p.name));
    return ['All', ...Array.from(list)];
  }, [timesheets, projects]);

  const departmentOptions = useMemo(() => {
    const list = new Set<string>();
    timesheets.forEach((ts) => {
      if (ts.department) list.add(ts.department);
    });
    employees.forEach((e) => {
      if (e.department) list.add(e.department);
    });
    return ['All', ...Array.from(list)];
  }, [timesheets, employees]);

  // Active inspected timesheet
  const activeInspectTs = useMemo(() => {
    return timesheets.find((ts) => ts.id === inspectTsId) || null;
  }, [timesheets, inspectTsId]);

  // Bulk selection toggles
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredTimesheets.map((ts) => ts.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV Export
  const handleExportCsv = () => {
    const csvData = exportTimesheetsToCsv(filteredTimesheets);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PrimeStar_Timesheets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Single Rejection Handler
  const handleSingleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectionModalTsId && rejectionReason.trim()) {
      rejectTimesheet(rejectionModalTsId, rejectionReason.trim());
      setRejectionModalTsId(null);
      setRejectionReason('');
      if (inspectTsId === rejectionModalTsId) {
        setInspectTsId(null);
      }
    }
  };

  // Unlock Approve/Reject Handler
  const handleApproveUnlock = (tsId: string) => {
    approveUnlockTimesheet(tsId, unlockNote || undefined);
    setUnlockModalTsId(null);
    setUnlockNote('');
  };

  const handleDeclineUnlock = (tsId: string) => {
    if (!unlockNote.trim()) {
      alert('Please specify a reason for declining the unlock request.');
      return;
    }
    rejectUnlockTimesheet(tsId, unlockNote.trim());
    setUnlockModalTsId(null);
    setUnlockNote('');
  };

  // Bulk Approve Handler
  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    const approveableIds = timesheets
      .filter((ts) => selectedIds.includes(ts.id) && (ts.status === 'Submitted' || ts.status === 'Unlock Requested'))
      .map((ts) => ts.id);

    if (approveableIds.length === 0) {
      alert('None of the selected timesheets are currently pending approval or unlock.');
      return;
    }

    if (confirm(`Are you sure you want to approve ${approveableIds.length} selected timesheets?`)) {
      bulkApproveTimesheets(approveableIds);
      setSelectedIds([]);
    }
  };

  // Bulk Reject Handler
  const handleBulkRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkRejectReason.trim() || selectedIds.length === 0) return;
    bulkRejectTimesheets(selectedIds, bulkRejectReason.trim());
    setBulkRejectModalOpen(false);
    setBulkRejectReason('');
    setSelectedIds([]);
  };

  // Create New Timesheet Handler
  const handleCreateTimesheetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employeeId === newTsEmployeeId);
    if (!emp) {
      alert('Please select a valid employee.');
      return;
    }

    const totalHours = newTsLogs.reduce((acc, log) => acc + (Number(log.hoursSpent) || 0), 0);

    createTimesheet({
      employeeId: emp.employeeId,
      employeeName: emp.name,
      department: emp.department,
      designation: emp.designation,
      projectName: newTsProjectName || emp.projectName || 'Internal Operations',
      periodStartDate: newTsStartDate,
      periodEndDate: newTsEndDate,
      totalHours,
      status: 'Submitted',
      submittedAt: new Date().toLocaleString('en-IN'),
      dailyLogs: newTsLogs,
    });

    setCreateModalOpen(false);
    setNewTsEmployeeId('');
    setNewTsProjectName('');
    setNewTsStartDate('');
    setNewTsEndDate('');
  };

  const handleAddDailyLog = () => {
    setNewTsLogs((prev) => [
      ...prev,
      {
        date: new Date().toISOString().split('T')[0],
        hoursSpent: 8,
        taskDescription: '',
        category: 'Project Delivery',
      },
    ]);
  };

  const handleRemoveDailyLog = (index: number) => {
    setNewTsLogs((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-6 text-xs">
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Timesheet Administration</h1>
            <Badge status="info">Enterprise HRMS</Badge>
          </div>
          <p className="text-slate-500 mt-0.5">
            Approve consultant weekly timesheets, inspect logged deliverable hours, audit category allocations & handle unlock requests.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>

          {permissions.canApproveTimesheets && (
            <Button
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setCreateModalOpen(true)}
            >
              Log New Timesheet
            </Button>
          )}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Logged Hours"
          value={`${filteredMetrics.totalHours} hrs`}
          subtitle={`${filteredMetrics.billablePercentage}% Billable`}
          icon={<Clock className="w-4 h-4 text-indigo-600" />}
          onClick={() => setStatusFilter('All')}
          className={statusFilter === 'All' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''}
        />

        <StatCard
          title="Pending Approvals"
          value={overallMetrics.pendingApprovals}
          subtitle="Awaiting PM review"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          onClick={() => setStatusFilter('Submitted')}
          className={statusFilter === 'Submitted' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''}
        />

        <StatCard
          title="Approved"
          value={overallMetrics.approvedCount}
          subtitle="Locked & Verified"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          onClick={() => setStatusFilter('Approved')}
          className={statusFilter === 'Approved' ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''}
        />

        <StatCard
          title="Unlock Requests"
          value={overallMetrics.unlockRequestsCount}
          subtitle="Requested by staff"
          icon={<Unlock className="w-4 h-4 text-purple-600" />}
          onClick={() => setStatusFilter('Unlock Requested')}
          className={
            statusFilter === 'Unlock Requested'
              ? 'ring-2 ring-purple-500 bg-purple-50/20'
              : overallMetrics.unlockRequestsCount > 0
              ? 'border-purple-300 bg-purple-50/10'
              : ''
          }
        />

        <StatCard
          title="Returned / Rejected"
          value={overallMetrics.rejectedCount}
          subtitle="Awaiting revision"
          icon={<FileText className="w-4 h-4 text-red-600" />}
          onClick={() => setStatusFilter('Rejected')}
          className={statusFilter === 'Rejected' ? 'ring-2 ring-red-500 bg-red-50/20' : ''}
        />

        <StatCard
          title="Active Consultants"
          value={filteredMetrics.activeConsultantsCount}
          subtitle="Unique logged staff"
          icon={<UserCheck className="w-4 h-4 text-blue-600" />}
        />
      </div>

      {/* FILTER & SEARCH BAR */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, ID, project..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <Select
            label=""
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Submitted', label: 'Submitted (Pending Review)' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Unlock Requested', label: 'Unlock Requested' },
              { value: 'Rejected', label: 'Rejected / Returned' },
              { value: 'Draft', label: 'Draft' },
            ]}
          />

          <Select
            label=""
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            options={projectOptions.map((p) => ({
              value: p,
              label: p === 'All' ? 'All Projects' : p,
            }))}
          />

          <Select
            label=""
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={departmentOptions.map((d) => ({
              value: d,
              label: d === 'All' ? 'All Departments' : d,
            }))}
          />
        </div>

        {(searchQuery || statusFilter !== 'All' || projectFilter !== 'All' || departmentFilter !== 'All') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-800">{filteredTimesheets.length}</strong> of{' '}
              <strong className="text-slate-800">{timesheets.length}</strong> timesheets
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setProjectFilter('All');
                setDepartmentFilter('All');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </Card>

      {/* BULK ACTIONS TOOLBAR */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2 font-medium text-indigo-900">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>
              <strong>{selectedIds.length}</strong> timesheets selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {permissions.canApproveTimesheets && (
              <>
                <Button size="sm" variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={handleBulkApprove}>
                  Approve Selected
                </Button>
                <Button size="sm" variant="danger" icon={<X className="w-3.5 h-3.5" />} onClick={() => setBulkRejectModalOpen(true)}>
                  Return Selected
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* MAIN MASTER TIMESHEET TABLE */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredTimesheets.length > 0 && selectedIds.length === filteredTimesheets.length
                    }
                    onChange={handleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-3">Consultant / Staff</th>
                <th className="p-3">Project</th>
                <th className="p-3">Billing Period</th>
                <th className="p-3 text-right">Hours Logged</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions & Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No timesheets match your criteria.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try clearing filters or searching for another consultant.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map((ts) => {
                  const breakdown = calculateCategoryBreakdown(ts);
                  const isSelected = selectedIds.includes(ts.id);

                  return (
                    <tr
                      key={ts.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(ts.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Employee Info */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200 text-[11px]">
                            {ts.employeeName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{ts.employeeName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {ts.employeeId} {ts.department ? `• ${ts.department}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Project Info */}
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{ts.projectName}</div>
                      </td>

                      {/* Period */}
                      <td className="p-3 text-slate-600">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {formatDate(ts.periodStartDate)} – {formatDate(ts.periodEndDate)}
                          </span>
                        </div>
                      </td>

                      {/* Hours Logged */}
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                          {ts.totalHours} hrs
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Delivery: {breakdown['Project Delivery'] || 0}h
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <Badge status={ts.status} />
                          {ts.status === 'Unlock Requested' && (
                            <div className="text-[10px] font-medium text-purple-700 flex items-center gap-1">
                              <Unlock className="w-3 h-3 text-purple-600" /> Unlock Needed
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setInspectTsId(ts.id)}
                        >
                          Inspect Log
                        </Button>

                        {permissions.canApproveTimesheets && ts.status === 'Submitted' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              onClick={() => approveTimesheet(ts.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setRejectionModalTsId(ts.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {permissions.canApproveTimesheets && ts.status === 'Unlock Requested' && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<Unlock className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setUnlockModalTsId(ts.id);
                              setUnlockNote(ts.unlockReason || '');
                            }}
                          >
                            Review Unlock
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL 1: DETAILED LOG INSPECTION & AUDIT MODAL */}
      {activeInspectTs && (
        <Modal
          isOpen={!!activeInspectTs}
          onClose={() => setInspectTsId(null)}
          title={`Timesheet Inspection — ${activeInspectTs.employeeName}`}
          subtitle={`Period: ${formatDate(activeInspectTs.periodStartDate)} to ${formatDate(
            activeInspectTs.periodEndDate
          )} • Project: ${activeInspectTs.projectName}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* TOP METRICS & STATUS BANNER */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Status</span>
                <div className="mt-1">
                  <Badge status={activeInspectTs.status} />
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total Hours Logged</span>
                <div className="mt-1 font-mono font-bold text-slate-900 text-sm">
                  {activeInspectTs.totalHours} hrs
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Submitted At</span>
                <div className="mt-1 font-mono text-slate-700">
                  {activeInspectTs.submittedAt || 'Not Submitted'}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Approver / Reviewer</span>
                <div className="mt-1 font-semibold text-slate-800">
                  {activeInspectTs.approverName || '—'}
                </div>
              </div>
            </div>

            {/* UNLOCK REQUEST ALERT BANNER IF APPLICABLE */}
            {activeInspectTs.status === 'Unlock Requested' && (
              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-800">
                  <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Timesheet Unlock Requested by Consultant</span>
                </div>
                <p className="text-purple-800 bg-white/80 p-2.5 rounded-lg border border-purple-100 font-mono">
                  "{activeInspectTs.unlockReason}"
                </p>
                {permissions.canApproveTimesheets && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Unlock className="w-3.5 h-3.5" />}
                      onClick={() => handleApproveUnlock(activeInspectTs.id)}
                    >
                      Approve Unlock & Allow Edits
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = prompt('Enter reason for declining unlock request:');
                        if (reason) rejectUnlockTimesheet(activeInspectTs.id, reason);
                      }}
                    >
                      Decline Unlock Request
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* REJECTION REASON BANNER IF APPLICABLE */}
            {activeInspectTs.status === 'Rejected' && activeInspectTs.rejectionReason && (
              <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Returned for Revision Reason</span>
                </div>
                <p className="text-red-800 bg-white/80 p-2.5 rounded-lg border border-red-100 font-mono">
                  "{activeInspectTs.rejectionReason}"
                </p>
              </div>
            )}

            {/* DAILY ITEMIZATION TABLE */}
            <div>
              <h3 className="font-bold text-slate-900 text-xs mb-2 flex items-center justify-between">
                <span>Itemized Daily Task Logs</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {activeInspectTs.dailyLogs?.length || 0} days recorded
                </span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Task Description</th>
                      <th className="p-2.5 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeInspectTs.dailyLogs?.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-semibold text-slate-900">
                          {formatDate(log.date)}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              log.category === 'Project Delivery'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : log.category === 'Client Meeting'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : log.category === 'Training'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {log.category}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">{log.taskDescription}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {log.hoursSpent} hrs
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={3} className="p-2.5 text-slate-900">
                        Total Weekly Hours
                      </td>
                      <td className="p-2.5 text-right font-mono text-indigo-700 text-sm">
                        {activeInspectTs.totalHours} hrs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AUDIT LOG TIMELINE */}
            {activeInspectTs.auditTrail && activeInspectTs.auditTrail.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" /> Audit History & Activity Trail
                </h3>
                <div className="space-y-2">
                  {activeInspectTs.auditTrail.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg flex items-start justify-between text-[11px]"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{log.action}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-normal">
                            by {log.actorName} {log.actorRole ? `(${log.actorRole})` : ''}
                          </span>
                        </div>
                        {log.comments && (
                          <div className="text-slate-600 mt-0.5 font-mono bg-white p-1.5 rounded border border-slate-200/60">
                            "{log.comments}"
                          </div>
                        )}
                      </div>
                      <div className="text-slate-400 font-mono shrink-0 ml-3">{log.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODAL FOOTER */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setInspectTsId(null)}>
                Close
              </Button>

              {permissions.canApproveTimesheets && activeInspectTs.status === 'Submitted' && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setRejectionModalTsId(activeInspectTs.id);
                    }}
                  >
                    Return for Revision
                  </Button>
                  <Button
                    variant="success"
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      approveTimesheet(activeInspectTs.id);
                      setInspectTsId(null);
                    }}
                  >
                    Approve Timesheet
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: SINGLE REJECTION REASON MODAL */}
      {rejectionModalTsId && (
        <Modal
          isOpen={!!rejectionModalTsId}
          onClose={() => setRejectionModalTsId(null)}
          title="Return Timesheet for Revision"
          subtitle="Please specify what revisions or additional details are required from the employee."
          maxWidth="md"
        >
          <form onSubmit={handleSingleRejectSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Reason for Return / Rejection *
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please clarify task descriptions for Oct 08 and log billable client meeting hours separately..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setRejectionModalTsId(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger">
                Return Timesheet to Consultant
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: UNLOCK HANDLING MODAL */}
      {unlockModalTsId && (
        <Modal
          isOpen={!!unlockModalTsId}
          onClose={() => setUnlockModalTsId(null)}
          title="Review Unlock Request"
          subtitle="A consultant requested to unlock their submitted timesheet to make edits."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="font-semibold text-slate-700">Request Note:</span>
              <p className="font-mono text-slate-800">{unlockNote || 'No specific note provided.'}</p>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Review Comments / Decision Note
              </label>
              <textarea
                rows={3}
                value={unlockNote}
                onChange={(e) => setUnlockNote(e.target.value)}
                placeholder="Optional notes for approval or required reason for decline..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setUnlockModalTsId(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => handleDeclineUnlock(unlockModalTsId)}
              >
                Decline Request
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={<Unlock className="w-3.5 h-3.5" />}
                onClick={() => handleApproveUnlock(unlockModalTsId)}
              >
                Approve Unlock & Revert to Draft
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: BULK REJECTION MODAL */}
      {bulkRejectModalOpen && (
        <Modal
          isOpen={bulkRejectModalOpen}
          onClose={() => setBulkRejectModalOpen(false)}
          title={`Return ${selectedIds.length} Selected Timesheets`}
          subtitle="Provide a mandatory reason that will be attached to all selected returned timesheets."
          maxWidth="md"
        >
          <form onSubmit={handleBulkRejectSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Bulk Rejection / Return Reason *
              </label>
              <textarea
                rows={4}
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                placeholder="Specify reason for returning these selected timesheets..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setBulkRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger">
                Return Selected Timesheets
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 5: LOG NEW TIMESHEET (ADMIN) */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Log New Timesheet on Behalf of Staff"
          subtitle="Record weekly consultant hours and deliverables directly into Prime Star HRMS."
          maxWidth="xl"
        >
          <form onSubmit={handleCreateTimesheetSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Select Consultant / Employee *"
                value={newTsEmployeeId}
                onChange={(e) => {
                  const empId = e.target.value;
                  setNewTsEmployeeId(empId);
                  const emp = employees.find((x) => x.employeeId === empId);
                  if (emp && emp.projectName) {
                    setNewTsProjectName(emp.projectName);
                  }
                }}
                options={[
                  { value: '', label: 'Select Employee...' },
                  ...employees.map((emp) => ({
                    value: emp.employeeId,
                    label: `${emp.name} (${emp.employeeId} - ${emp.department})`,
                  })),
                ]}
                required
              />

              <Input
                label="Project Name *"
                value={newTsProjectName}
                onChange={(e) => setNewTsProjectName(e.target.value)}
                placeholder="e.g. HDFC Bank Core Cloud Migration"
                required
              />

              <Input
                label="Period Start Date *"
                type="date"
                value={newTsStartDate}
                onChange={(e) => setNewTsStartDate(e.target.value)}
                required
              />

              <Input
                label="Period End Date *"
                type="date"
                value={newTsEndDate}
                onChange={(e) => setNewTsEndDate(e.target.value)}
                required
              />
            </div>

            {/* DAILY ITEMIZATION LOGS */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900">Daily Deliverables & Hours</span>
                <Button type="button" size="sm" variant="outline" onClick={handleAddDailyLog}>
                  + Add Day Entry
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {newTsLogs.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                  >
                    <div className="md:col-span-3">
                      <input
                        type="date"
                        value={log.date}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewTsLogs((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, date: val } : item))
                          );
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded"
                        required
                      />
                    </div>

                    <div className="md:col-span-3">
                      <select
                        value={log.category}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setNewTsLogs((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, category: val } : item))
                          );
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded"
                      >
                        <option value="Project Delivery">Project Delivery</option>
                        <option value="Client Meeting">Client Meeting</option>
                        <option value="Internal Operations">Internal Operations</option>
                        <option value="Training">Training</option>
                        <option value="Leave">Leave</option>
                      </select>
                    </div>

                    <div className="md:col-span-4">
                      <input
                        type="text"
                        value={log.taskDescription}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewTsLogs((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, taskDescription: val } : item))
                          );
                        }}
                        placeholder="Task description..."
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={log.hoursSpent}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setNewTsLogs((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, hoursSpent: val } : item))
                          );
                        }}
                        className="w-16 px-2 py-1.5 text-xs border border-slate-300 rounded text-right font-mono"
                        required
                      />
                      <span className="text-slate-500 font-mono text-[10px]">hrs</span>

                      {newTsLogs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDailyLog(index)}
                          className="text-red-500 hover:text-red-700 ml-auto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save & Submit Timesheet
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
