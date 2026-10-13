import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useRole } from '../../../context/RoleContext';
import { Card, Button, Badge, Modal, Input, Select, StatCard } from '../../common/UIComponents';
import { ProfileChangeRequest, ProfileChangeRequestStatus } from '../../../types/domain';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  Eye,
  Check,
  X,
  AlertTriangle,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Send,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Calendar,
} from 'lucide-react';

export const ProfileRequestsView: React.FC = () => {
  const { currentRole, currentUser, permissions } = useRole();
  const {
    profileRequests,
    employees,
    createProfileChangeRequest,
    reviewProfileChangeRequest,
  } = useData();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [fieldFilter, setFieldFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('All');

  // Modal States
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProfileChangeRequest | null>(null);

  // Form State for New Request
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formFieldKey, setFormFieldKey] = useState<string>('phone');
  const [formFieldName, setFormFieldName] = useState<string>('Phone Number');
  const [formProposedValue, setFormProposedValue] = useState<string>('');
  const [formReason, setFormReason] = useState<string>('');

  // Review Form State
  const [reviewerComments, setReviewerComments] = useState('');

  // Departments list for filter dropdown
  const departmentsList = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach((e) => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts).sort();
  }, [employees]);

  // Derived Summary Counts
  const totalCount = profileRequests.length;
  const pendingCount = profileRequests.filter((r) => r.status === 'Pending').length;
  const approvedCount = profileRequests.filter((r) => r.status === 'Approved').length;
  const rejectedCount = profileRequests.filter((r) => r.status === 'Rejected').length;

  // Selected Employee for New Request Modal
  const activeFormEmpId = formEmployeeId || currentUser.employeeId || employees[0]?.employeeId || 'PS-001';
  const selectedEmpRecord =
    employees.find((e) => e.employeeId === activeFormEmpId) ||
    employees.find((e) => e.email === currentUser.email) ||
    employees[0];

  // Map field keys to readable names and current values
  const availableFields = [
    { key: 'phone', name: 'Phone Number', current: selectedEmpRecord?.phone || 'N/A' },
    { key: 'email', name: 'Email Address', current: selectedEmpRecord?.email || 'N/A' },
    { key: 'location', name: 'Office Work Location', current: selectedEmpRecord?.location || 'N/A' },
    { key: 'bankAccountDetails', name: 'Bank Account Details', current: selectedEmpRecord?.bankAccountDetails || 'N/A' },
    { key: 'designation', name: 'Official Designation', current: selectedEmpRecord?.designation || 'N/A' },
    { key: 'department', name: 'Department', current: selectedEmpRecord?.department || 'N/A' },
    { key: 'panNumber', name: 'PAN Number', current: selectedEmpRecord?.panNumber || 'N/A' },
    { key: 'aadhaarNumber', name: 'Aadhaar Number', current: selectedEmpRecord?.aadhaarNumber || 'N/A' },
  ];

  const currentFieldValue =
    availableFields.find((f) => f.key === formFieldKey)?.current || 'N/A';

  // Filtered Profile Requests
  const filteredRequests = useMemo(() => {
    return profileRequests.filter((req) => {
      // 1. Text Search
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesSearch =
          req.id.toLowerCase().includes(query) ||
          req.employeeName.toLowerCase().includes(query) ||
          req.employeeId.toLowerCase().includes(query) ||
          req.fieldName.toLowerCase().includes(query) ||
          req.reason.toLowerCase().includes(query) ||
          (req.proposedValue && req.proposedValue.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'All' && req.status !== statusFilter) {
        return false;
      }

      // 3. Field / Category Filter
      if (fieldFilter !== 'All') {
        if (fieldFilter === 'Contact' && !['Phone Number', 'Email Address', 'phone', 'email'].includes(req.fieldKey) && !req.fieldName.toLowerCase().includes('phone') && !req.fieldName.toLowerCase().includes('email')) {
          return false;
        }
        if (fieldFilter === 'Location' && !['Office Work Location', 'Location', 'location'].includes(req.fieldKey) && !req.fieldName.toLowerCase().includes('location')) {
          return false;
        }
        if (fieldFilter === 'Financial' && !['Bank Account Details', 'bankAccountDetails', 'panNumber', 'aadhaarNumber'].includes(req.fieldKey) && !req.fieldName.toLowerCase().includes('bank') && !req.fieldName.toLowerCase().includes('pan')) {
          return false;
        }
        if (fieldFilter === 'Role' && !['Official Designation', 'Department', 'designation', 'department'].includes(req.fieldKey) && !req.fieldName.toLowerCase().includes('designation') && !req.fieldName.toLowerCase().includes('department')) {
          return false;
        }
      }

      // 4. Department Filter
      if (deptFilter !== 'All') {
        const emp = employees.find((e) => e.employeeId === req.employeeId);
        if (emp && emp.department !== deptFilter) {
          return false;
        }
      }

      // 5. Submission Date Filter
      if (dateRangeFilter !== 'All') {
        const subDate = new Date(req.submittedAt);
        const now = new Date();
        if (dateRangeFilter === 'Last 7 Days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (subDate < sevenDaysAgo) return false;
        } else if (dateRangeFilter === 'Last 30 Days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (subDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [profileRequests, searchQuery, statusFilter, fieldFilter, deptFilter, dateRangeFilter, employees]);

  // Open New Request Modal
  const handleOpenNewRequestModal = () => {
    setFormEmployeeId(selectedEmpRecord?.employeeId || '');
    setFormFieldKey('phone');
    setFormFieldName('Phone Number');
    setFormProposedValue('');
    setFormReason('');
    setNewRequestModalOpen(true);
  };

  // Field change in new request modal
  const handleFieldChange = (key: string) => {
    const found = availableFields.find((f) => f.key === key);
    setFormFieldKey(key);
    if (found) {
      setFormFieldName(found.name);
    }
  };

  // Submit New Request
  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProposedValue.trim() || !formReason.trim()) return;

    createProfileChangeRequest({
      employeeId: selectedEmpRecord.employeeId,
      employeeName: selectedEmpRecord.name,
      fieldName: formFieldName,
      fieldKey: formFieldKey,
      currentValue: currentFieldValue,
      proposedValue: formProposedValue.trim(),
      reason: formReason.trim(),
    });

    setNewRequestModalOpen(false);
    setFormProposedValue('');
    setFormReason('');
  };

  // Open Request Details / Review Modal
  const handleOpenDetailsModal = (req: ProfileChangeRequest) => {
    setSelectedRequest(req);
    setReviewerComments('');
    setDetailsModalOpen(true);
  };

  // Execute Review Action (Approve / Reject)
  const handleExecuteReview = (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;
    reviewProfileChangeRequest(
      selectedRequest.id,
      action,
      reviewerComments.trim() || (action === 'approve' ? 'Approved by HR review.' : 'Rejected upon HR review.')
    );
    setDetailsModalOpen(false);
    setSelectedRequest(null);
    setReviewerComments('');
  };

  // Status Badge Helper
  const renderStatusBadge = (status: ProfileChangeRequestStatus) => {
    switch (status) {
      case 'Approved':
        return <Badge status="approved">Approved</Badge>;
      case 'Rejected':
        return <Badge status="rejected">Rejected</Badge>;
      case 'Pending':
      default:
        return <Badge status="pending">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            Profile Change Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee record modification requests, review proposed changes, and audit approval logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenNewRequestModal}
          >
            New Change Request
          </Button>
        </div>
      </div>

      {/* SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={totalCount}
          subtitle="All profile change records"
          icon={<UserCheck className="w-5 h-5 text-indigo-600" />}
          onClick={() => setStatusFilter('All')}
          className={statusFilter === 'All' ? 'ring-2 ring-indigo-500/20 bg-indigo-50/20 border-indigo-300' : ''}
        />
        <StatCard
          title="Pending Review"
          value={pendingCount}
          subtitle="Awaiting HR review"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          onClick={() => setStatusFilter('Pending')}
          className={statusFilter === 'Pending' ? 'ring-2 ring-amber-500/20 bg-amber-50/20 border-amber-300' : ''}
        />
        <StatCard
          title="Approved"
          value={approvedCount}
          subtitle="Applied to employee profiles"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          onClick={() => setStatusFilter('Approved')}
          className={statusFilter === 'Approved' ? 'ring-2 ring-emerald-500/20 bg-emerald-50/20 border-emerald-300' : ''}
        />
        <StatCard
          title="Rejected"
          value={rejectedCount}
          subtitle="Declined requests"
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
          onClick={() => setStatusFilter('Rejected')}
          className={statusFilter === 'Rejected' ? 'ring-2 ring-rose-500/20 bg-rose-50/20 border-rose-300' : ''}
        />
      </div>

      {/* SEARCH AND MULTI-FACETED FILTERS BAR */}
      <Card className="p-3.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 w-full">
          {/* Search Input (~40% width on desktop) */}
          <div className="relative w-full lg:w-[38%] shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Request ID, Employee Name, ID, Field, or Reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 4 Dropdowns distributed equally across remaining width (~60% on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-1 w-full min-w-0">
            {/* Status Filter */}
            <div className="w-full min-w-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors h-9 cursor-pointer truncate"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Field Category Filter */}
            <div className="w-full min-w-0">
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors h-9 cursor-pointer truncate"
              >
                <option value="All">All Field Types</option>
                <option value="Contact">Contact Details</option>
                <option value="Location">Location & Address</option>
                <option value="Financial">Bank & Financial</option>
                <option value="Role">Role & Department</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="w-full min-w-0">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors h-9 cursor-pointer truncate"
              >
                <option value="All">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Submission Date Filter */}
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors h-9 cursor-pointer truncate"
            >
              <option value="All">All Submission Dates</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchQuery || statusFilter !== 'All' || fieldFilter !== 'All' || deptFilter !== 'All' || dateRangeFilter !== 'All') && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setFieldFilter('All');
                setDeptFilter('All');
                setDateRangeFilter('All');
              }}
              className="text-xs text-slate-600 hover:text-indigo-600 h-9 shrink-0 px-2.5 whitespace-nowrap"
            >
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* REQUESTS TABLE */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Request ID</th>
                <th className="py-3.5 px-4">Employee Details</th>
                <th className="py-3.5 px-4">Field / Change Type</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No profile change requests found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search query or filter selections.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const empRecord = employees.find((e) => e.employeeId === req.employeeId);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Request ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{req.id}</td>

                      {/* Employee Name & ID */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{req.employeeName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{req.employeeId}</div>
                      </td>

                      {/* Field / Change Type */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{req.fieldName}</span>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          Proposed: <span className="text-slate-600">{req.proposedValue}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-600">
                        {empRecord?.department || 'Operations'}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.submittedAt}</span>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-4 text-slate-600">
                        {req.reviewedAt ? (
                          <div>
                            <div className="font-medium text-slate-800">{req.reviewedAt}</div>
                            <div className="text-[10px] text-slate-400">{req.reviewedBy}</div>
                          </div>
                        ) : (
                          <span className="italic text-amber-600 text-[11px]">Pending Review</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">{renderStatusBadge(req.status)}</td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenDetailsModal(req)}
                        >
                          {req.status === 'Pending' && permissions.canReviewProfileChangeRequests
                            ? 'Review'
                            : 'Details'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL 1: NEW PROFILE CHANGE REQUEST */}
      {newRequestModalOpen && (
        <Modal
          isOpen={newRequestModalOpen}
          onClose={() => setNewRequestModalOpen(false)}
          title="Submit Profile Change Request"
        >
          <form onSubmit={handleSubmitNewRequest} className="space-y-4">
            {/* Employee Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Employee Profile
              </label>
              {permissions.canReviewProfileChangeRequests || permissions.canManageEmployees ? (
                <Select
                  value={selectedEmpRecord.employeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  options={employees.map((e) => ({
                    value: e.employeeId,
                    label: `${e.name} (${e.employeeId} — ${e.designation})`,
                  }))}
                  className="w-full text-xs"
                />
              ) : (
                <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200">
                  {selectedEmpRecord.name} ({selectedEmpRecord.employeeId})
                </div>
              )}
            </div>

            {/* Target Field Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Field To Update
              </label>
              <Select
                value={formFieldKey}
                onChange={(e) => handleFieldChange(e.target.value)}
                options={availableFields.map((f) => ({
                  value: f.key,
                  label: f.name,
                }))}
                className="w-full text-xs"
              />
            </div>

            {/* Current Value Display */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Current Official Value ({formFieldName})
              </span>
              <span className="text-xs font-semibold text-slate-800 block">
                {currentFieldValue}
              </span>
            </div>

            {/* Proposed New Value Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Proposed New Value <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder={`Enter new ${formFieldName}...`}
                value={formProposedValue}
                onChange={(e) => setFormProposedValue(e.target.value)}
                required
              />
            </div>

            {/* Reason for Change */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason For Request <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Provide a clear explanation for this request (e.g. relocation, SIM card update, bank account change)..."
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setNewRequestModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Send className="w-4 h-4" />}
                disabled={!formProposedValue.trim() || !formReason.trim()}
              >
                Submit Change Request
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: REQUEST DETAILS & REVIEW MODAL */}
      {detailsModalOpen && selectedRequest && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedRequest(null);
          }}
          title={`Profile Request Details — ${selectedRequest.id}`}
        >
          <div className="space-y-5">
            {/* Request Meta Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900">{selectedRequest.id}</span>
                  {renderStatusBadge(selectedRequest.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Submitted by <strong className="text-slate-800">{selectedRequest.requesterName}</strong> ({selectedRequest.requesterRole}) on {selectedRequest.submittedAt}
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">{selectedRequest.employeeName}</div>
                <div className="text-[11px] font-mono text-slate-500">{selectedRequest.employeeId}</div>
              </div>
            </div>

            {/* Comparison Side-by-Side Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Value */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Current Official Record ({selectedRequest.fieldName})
                </div>
                <div className="text-sm font-semibold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                  {selectedRequest.currentValue || 'N/A'}
                </div>
              </div>

              {/* Proposed Value */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-1 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> Proposed New Value
                </div>
                <div className="text-sm font-bold text-indigo-950 bg-white p-2.5 rounded-lg border border-indigo-200 shadow-xs">
                  {selectedRequest.proposedValue}
                </div>
              </div>
            </div>

            {/* Employee's Stated Reason */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Employee's Stated Reason
              </span>
              <p className="text-xs text-slate-700 italic">"{selectedRequest.reason}"</p>
            </div>

            {/* Review History / Action Form */}
            {selectedRequest.status !== 'Pending' ? (
              /* ALREADY REVIEWED HISTORY */
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  Review & Audit Log
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Reviewed By:</span>{' '}
                    <strong className="text-slate-800">{selectedRequest.reviewedBy}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Reviewed At:</span>{' '}
                    <strong className="text-slate-800">{selectedRequest.reviewedAt}</strong>
                  </div>
                </div>
                {selectedRequest.reviewerComments && (
                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 mt-2">
                    <span className="font-semibold text-slate-500 block mb-0.5">Reviewer Comments:</span>
                    {selectedRequest.reviewerComments}
                  </div>
                )}
              </div>
            ) : (
              /* PENDING REVIEW ACTION FORM */
              <div className="space-y-4 pt-2 border-t border-slate-100">
                {permissions.canReviewProfileChangeRequests ? (
                  <>
                    {/* Self-Request Notice Check */}
                    {(selectedRequest.requesterId === currentUser.id || selectedRequest.employeeId === currentUser.employeeId) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Self-Request Audit Notice:</strong> You submitted or are the subject of this change request. As an authorized reviewer, your decision will be recorded under your account ({currentUser.name}) in the audit log.
                        </div>
                      </div>
                    )}

                    {/* Reviewer Comments Textarea */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reviewer Comments / Approval Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Add optional notes for approval or mandatory explanation for rejection..."
                        value={reviewerComments}
                        onChange={(e) => setReviewerComments(e.target.value)}
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    {/* Action Confirmation Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setDetailsModalOpen(false)}
                      >
                        Close
                      </Button>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="danger"
                          icon={<X className="w-4 h-4" />}
                          onClick={() => handleExecuteReview('reject')}
                        >
                          Reject Request
                        </Button>
                        <Button
                          type="button"
                          variant="success"
                          icon={<Check className="w-4 h-4" />}
                          onClick={() => handleExecuteReview('approve')}
                        >
                          Approve & Update Profile
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 text-center italic">
                    This request is currently pending review by HR Management.
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
