import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Badge, Modal, Input, Select } from '../common/UIComponents';
import { getInitials } from '../../types/roles';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Edit,
  Send,
  MapPin,
  FileText,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { ProfileChangeRequest } from '../../types/domain';

export const ProfileAccountView: React.FC = () => {
  const { currentRole, currentUser, permissions } = useRole();
  const {
    employees,
    profileRequests,
    createProfileChangeRequest,
    updateEmployeeProfile,
    reviewProfileChangeRequest,
  } = useData();

  // State to track selected employee record to view (defaults to signed in user)
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  // Find official employee record
  const currentEmpId = selectedEmpId || currentUser.employeeId || 'PS-001';
  const matchedEmp =
    employees.find((e) => e.employeeId === currentEmpId) ||
    employees.find((e) => e.email === currentUser.email) ||
    employees[0];

  // Request change modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>('phone');
  const [selectedFieldName, setSelectedFieldName] = useState<string>('Contact Phone Number');
  const [proposedValue, setProposedValue] = useState<string>('');
  const [changeReason, setChangeReason] = useState<string>('');

  // HR Direct Edit modal state
  const [directEditModalOpen, setDirectEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: matchedEmp.name,
    phone: matchedEmp.phone,
    designation: matchedEmp.designation,
    department: matchedEmp.department,
    location: matchedEmp.location,
    bankAccountDetails: matchedEmp.bankAccountDetails || '',
  });
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);

  // Review request modal state (for HR)
  const [reviewRequest, setReviewRequest] = useState<ProfileChangeRequest | null>(null);
  const [hrReviewComments, setHrReviewComments] = useState('');

  const userInitials = getInitials(currentUser.name);

  // Filter requests submitted by or for this employee
  const myRequests = profileRequests.filter(
    (r) => r.employeeId === matchedEmp.employeeId || r.requesterId === currentUser.id
  );

  // Field mapping options for profile change request
  const changeableFields = [
    { key: 'phone', name: 'Contact Phone Number', current: matchedEmp.phone },
    { key: 'location', name: 'Office Work Location', current: matchedEmp.location },
    { key: 'bankAccountDetails', name: 'Bank Account Details', current: matchedEmp.bankAccountDetails || 'N/A' },
    { key: 'designation', name: 'Official Designation', current: matchedEmp.designation },
    { key: 'department', name: 'Department', current: matchedEmp.department },
  ];

  const handleFieldChange = (key: string) => {
    const found = changeableFields.find((f) => f.key === key);
    if (found) {
      setSelectedFieldKey(found.key);
      setSelectedFieldName(found.name);
      setProposedValue('');
    }
  };

  const handleOpenRequestModal = (fieldKey?: string) => {
    if (fieldKey) {
      handleFieldChange(fieldKey);
    }
    setRequestModalOpen(true);
  };

  const handleSubmitChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedValue.trim() || !changeReason.trim()) return;

    const currentVal =
      changeableFields.find((f) => f.key === selectedFieldKey)?.current || 'N/A';

    createProfileChangeRequest({
      employeeId: matchedEmp.employeeId,
      employeeName: matchedEmp.name,
      fieldName: selectedFieldName,
      fieldKey: selectedFieldKey,
      currentValue: currentVal,
      proposedValue,
      reason: changeReason,
    });

    setRequestModalOpen(false);
    setProposedValue('');
    setChangeReason('');
  };

  const handleSaveDirectEdit = () => {
    updateEmployeeProfile(matchedEmp.employeeId, editFormData);
    setConfirmEditOpen(false);
    setDirectEditModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Profile & Account Information
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official employee details, role access rights, and profile modification management.
          </p>
        </div>

        {/* TOP ACTIONS BASED ON HR-CONTROLLED RULES */}
        <div className="flex flex-wrap items-center gap-3">
          {permissions.canDirectlyEditProfiles && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Viewing Employee:</span>
              <select
                value={matchedEmp.employeeId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {employees.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.name} ({e.employeeId} — {e.designation})
                  </option>
                ))}
              </select>
            </div>
          )}

          {permissions.canDirectlyEditProfiles ? (
            <Button
              variant="primary"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => {
                setEditFormData({
                  name: matchedEmp.name,
                  phone: matchedEmp.phone,
                  designation: matchedEmp.designation,
                  department: matchedEmp.department,
                  location: matchedEmp.location,
                  bankAccountDetails: matchedEmp.bankAccountDetails || '',
                });
                setDirectEditModalOpen(true);
              }}
            >
              Edit Employee Profile ({matchedEmp.employeeId})
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={<Send className="w-4 h-4" />}
              onClick={() => handleOpenRequestModal()}
            >
              Request Profile Change
            </Button>
          )}
        </div>
      </div>

      {/* USER HERO BANNER */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-0 shadow-lg">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white text-2xl font-black flex items-center justify-center border-2 border-indigo-400/30 shadow-xl">
              {userInitials}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full ring-2 ring-slate-900"></span>
          </div>

          <div className="flex-1 text-center md:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="text-xl font-bold">{matchedEmp.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                {matchedEmp.employeeId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                ACTIVE DEMO ROLE: {currentRole}
              </span>
            </div>

            <p className="text-xs text-indigo-200 font-medium">
              {matchedEmp.designation} · {matchedEmp.department}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                {matchedEmp.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                {matchedEmp.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {matchedEmp.location}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* DETAILED OFFICIAL PROFILE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: OFFICIAL DATA */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Official Personnel Information
              </h3>
              {!permissions.canDirectlyEditProfiles && (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-slate-400" /> HR Controlled Fields
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Full Legal Name</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{matchedEmp.name}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Employee ID</span>
                <span className="font-mono font-bold text-indigo-950 text-sm mt-0.5 block">
                  {matchedEmp.employeeId}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Official Designation</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{matchedEmp.designation}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Department</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{matchedEmp.department}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Reporting Manager</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{matchedEmp.managerName}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Date of Joining</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{matchedEmp.joiningDate}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Primary Project</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{matchedEmp.projectName}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Base Work Location</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{matchedEmp.location}</span>
              </div>
            </div>
          </Card>

          {/* BANK & COMPLIANCE DATA */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" /> Banking & Tax Verification Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 sm:col-span-3">
                <span className="text-[11px] text-slate-400 block font-medium">Salary Disbursement Account</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {matchedEmp.bankAccountDetails || 'Not configured'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">PAN Number</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                  {matchedEmp.panNumber || 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Aadhaar (Masked)</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                  {matchedEmp.aadhaarNumber || 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Verification Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>
          </Card>

          {/* MY PROFILE CHANGE REQUESTS HISTORY */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> Profile Change Requests History
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Status of official profile edit requests submitted to HR.
                </p>
              </div>

              {!permissions.canDirectlyEditProfiles && (
                <Button size="sm" variant="outline" onClick={() => handleOpenRequestModal()}>
                  + New Request
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Field</th>
                    <th className="p-2.5">Proposed Value</th>
                    <th className="p-2.5">Reason</th>
                    <th className="p-2.5">Submitted</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">HR Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No profile change requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    myRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-bold text-slate-900">{r.fieldName}</td>
                        <td className="p-2.5 font-semibold text-indigo-900">{r.proposedValue}</td>
                        <td className="p-2.5 text-slate-600 truncate max-w-xs">{r.reason}</td>
                        <td className="p-2.5 text-slate-500">{r.submittedAt}</td>
                        <td className="p-2.5">
                          {r.status === 'Pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> Pending HR
                            </span>
                          )}
                          {r.status === 'Approved' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {r.status === 'Rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-500 italic">
                          {r.reviewerComments || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: PERMISSIONS & HR CONTROL PANEL */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4 bg-slate-50/70 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" /> Active Role Governance Policy
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Direct Profile Modification</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {permissions.canDirectlyEditProfiles ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Authorized for direct employee profile updates.
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold flex items-center gap-1 mt-0.5">
                      <Lock className="w-3.5 h-3.5" /> HR Policy Restricted — Direct edits disabled. Changes require formal HR request.
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Profile Request Review Rights</div>
                <p className="text-[11px] text-slate-600">
                  {permissions.canReviewProfileChangeRequests ? (
                    <span className="text-emerald-700 font-semibold">
                      Authorized to approve/reject profile change requests.
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Non-reviewing role. Submitted requests are routed to HR Head / HR Executive.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>

          {/* HR REVIEW PANEL FOR HR ROLES */}
          {permissions.canReviewProfileChangeRequests && (
            <Card className="p-5 space-y-4 border-indigo-200 bg-indigo-50/20">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" /> Pending HR Change Requests
                </h3>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {profileRequests.filter((r) => r.status === 'Pending').length} Pending
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {profileRequests.filter((r) => r.status === 'Pending').length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center">
                    No pending profile change requests requiring HR approval.
                  </p>
                ) : (
                  profileRequests
                    .filter((r) => r.status === 'Pending')
                    .map((req) => (
                      <div
                        key={req.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{req.employeeName}</span>
                            <span className="block text-[10px] text-slate-500 font-medium">
                              Requester Role: {req.requesterRole} · {req.submittedAt}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            {req.fieldName}
                          </span>
                        </div>

                        <div className="p-2 bg-slate-50 rounded border border-slate-100 space-y-1 text-[11px]">
                          <div className="flex justify-between text-slate-500">
                            <span>Current:</span>
                            <span className="line-through text-slate-400 font-mono">{req.currentValue}</span>
                          </div>
                          <div className="flex justify-between font-bold text-indigo-900">
                            <span>Proposed:</span>
                            <span className="font-mono">{req.proposedValue}</span>
                          </div>
                          <div className="text-[10px] text-slate-600 italic pt-1 border-t border-slate-200/60">
                            "{req.reason}"
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setReviewRequest(req);
                              setHrReviewComments('');
                            }}
                          >
                            Review Request
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* MODAL 1: REQUEST PROFILE CHANGE FORM (FOR CEO, EMPLOYEE, PM, FINANCE, PO ADMIN) */}
      {requestModalOpen && (
        <Modal
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          title="Submit Profile Change Request"
        >
          <form onSubmit={handleSubmitChangeRequest} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>HR Governance Policy:</strong>
                <p className="text-[11px] mt-0.5">
                  Official employee details cannot be edited directly by non-HR roles. Your request will be transmitted to the HR Department for verification and formal approval.
                </p>
              </div>
            </div>

            <Select
              label="Select Field to Update *"
              value={selectedFieldKey}
              onChange={(e) => handleFieldChange(e.target.value)}
              options={changeableFields.map((f) => ({ value: f.key, label: f.name }))}
            />

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Current Official Value:</span>
              <div className="font-mono font-bold text-slate-800">
                {changeableFields.find((f) => f.key === selectedFieldKey)?.current || 'N/A'}
              </div>
            </div>

            <Input
              label="Proposed New Value *"
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              placeholder="Enter updated detail..."
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for Change Request *
              </label>
              <textarea
                rows={3}
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Explain why this profile change is required..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" icon={<Send className="w-3.5 h-3.5" />}>
                Submit Request to HR
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: DIRECT HR PROFILE EDIT FORM (FOR HR HEAD & HR EXECUTIVE) */}
      {directEditModalOpen && (
        <Modal
          isOpen={directEditModalOpen}
          onClose={() => setDirectEditModalOpen(false)}
          title={`Edit Employee Profile — ${matchedEmp.name} (${matchedEmp.employeeId})`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900">
              <strong className="block font-bold">HR Authorized Editing Mode</strong>
              <p className="text-[11px] mt-0.5">
                Modifications saved here directly update the official employee master record across all Prime Star HRMS modules.
              </p>
            </div>

            <Input
              label="Full Legal Name *"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Contact Phone *"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
              <Input
                label="Base Location *"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Official Designation *"
                value={editFormData.designation}
                onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
              />
              <Input
                label="Department *"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
              />
            </div>

            <Input
              label="Bank Account & IFSC Details"
              value={editFormData.bankAccountDetails}
              onChange={(e) => setEditFormData({ ...editFormData, bankAccountDetails: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setDirectEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setConfirmEditOpen(true)}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Save Official Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION MODAL BEFORE SAVING DIRECT EDITS */}
      {confirmEditOpen && (
        <Modal
          isOpen={confirmEditOpen}
          onClose={() => setConfirmEditOpen(false)}
          title="Confirm Profile Update"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-700 leading-relaxed">
              Are you sure you want to commit these updates to <strong>{matchedEmp.name}</strong>'s official master profile?
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 space-y-1 text-[11px]">
              <div><strong>Editor:</strong> {currentUser.name} ({currentRole})</div>
              <div><strong>Timestamp:</strong> {new Date().toLocaleString('en-IN')}</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmEditOpen(false)}>
                Go Back
              </Button>
              <Button variant="primary" onClick={handleSaveDirectEdit}>
                Confirm & Save Master Record
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: HR REVIEW CHANGE REQUEST */}
      {reviewRequest && (
        <Modal
          isOpen={!!reviewRequest}
          onClose={() => setReviewRequest(null)}
          title={`Review Change Request — ${reviewRequest.employeeName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-900">{reviewRequest.employeeName} ({reviewRequest.employeeId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Field:</span>
                <span className="font-bold text-indigo-900">{reviewRequest.fieldName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Value:</span>
                <span className="font-mono text-slate-700 line-through">{reviewRequest.currentValue}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800">
                <span>Proposed New Value:</span>
                <span className="font-mono">{reviewRequest.proposedValue}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block">Reason:</span>
                <p className="text-slate-800 italic mt-0.5">"{reviewRequest.reason}"</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                HR Reviewer Comments
              </label>
              <textarea
                rows={2}
                value={hrReviewComments}
                onChange={(e) => setHrReviewComments(e.target.value)}
                placeholder="Optional comments regarding approval or rejection..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="danger"
                onClick={() => {
                  reviewProfileChangeRequest(reviewRequest.id, 'reject', hrReviewComments);
                  setReviewRequest(null);
                }}
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  reviewProfileChangeRequest(reviewRequest.id, 'approve', hrReviewComments);
                  setReviewRequest(null);
                }}
              >
                Approve & Update Profile
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
