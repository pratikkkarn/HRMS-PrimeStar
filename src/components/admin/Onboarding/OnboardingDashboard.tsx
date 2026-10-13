import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { useRole } from '../../../context/RoleContext';
import { StatCard, Badge, Button, Card, Modal } from '../../common/UIComponents';
import { formatINR, formatDate } from '../../../lib/utils';
import {
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Eye,
  Copy,
  Check,
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
  Send,
  ExternalLink,
  Pencil,
  Trash2,
  Calendar,
  Building,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { CandidateInviteModal } from './CandidateInviteModal';
import { CandidateReviewModal } from './CandidateReviewModal';
import { SalaryStructureBuilder } from './SalaryStructureBuilder';
import { OfferLetterModal } from './OfferLetterModal';
import { CandidateOnboarding } from '../../../types/domain';

export const OnboardingDashboard: React.FC = () => {
  const { candidates, editCandidateDetails, cancelCandidateOnboarding } = useData();
  const { permissions } = useRole();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [reviewCandidate, setReviewCandidate] = useState<CandidateOnboarding | null>(null);
  const [salaryCandidate, setSalaryCandidate] = useState<CandidateOnboarding | null>(null);
  const [offerCandidate, setOfferCandidate] = useState<CandidateOnboarding | null>(null);

  // Edit & Cancel Modals state
  const [editCandidate, setEditCandidate] = useState<CandidateOnboarding | null>(null);
  const [cancelCandidate, setCancelCandidate] = useState<CandidateOnboarding | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [designationFilter, setDesignationFilter] = useState('ALL');
  const [hrFilter, setHrFilter] = useState('ALL');
  const [joiningDateFilter, setJoiningDateFilter] = useState('');

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Derive unique dropdown options dynamically
  const uniqueDepartments = Array.from(
    new Set(candidates.map((c) => c.proposedDepartment).filter(Boolean))
  );
  const uniqueDesignations = Array.from(
    new Set(candidates.map((c) => c.designation).filter(Boolean))
  );
  const uniqueHrs = Array.from(
    new Set(candidates.map((c) => c.assignedHr || 'Priya Sharma (HR Lead)').filter(Boolean))
  );

  // Consistent, non-overlapping 6 Summary Metrics
  const totalCandidates = candidates.length;
  const notStartedCount = candidates.filter((c) => c.status === 'Invite Sent').length;
  const inProgressCount = candidates.filter((c) => c.status === 'In Progress').length;
  const awaitingReviewCount = candidates.filter((c) =>
    ['Submitted', 'Under HR Review', 'Returned for Correction'].includes(c.status)
  ).length;
  const offerReleasedCount = candidates.filter((c) => c.status === 'Offer Released').length;
  const completedCount = candidates.filter((c) =>
    ['Joining Confirmed', 'Joined'].includes(c.status)
  ).length;

  // Filter candidates logic
  const filteredCandidates = candidates.filter((c) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.candidateName.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.designation.toLowerCase().includes(query) ||
      c.proposedDepartment.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Not Started' && c.status === 'Invite Sent') ||
      (statusFilter === 'In Progress' && c.status === 'In Progress') ||
      (statusFilter === 'Awaiting Review' &&
        ['Submitted', 'Under HR Review', 'Returned for Correction'].includes(c.status)) ||
      (statusFilter === 'Offers Released' && c.status === 'Offer Released') ||
      (statusFilter === 'Completed' && ['Joining Confirmed', 'Joined'].includes(c.status)) ||
      c.status === statusFilter;

    const matchesDept = departmentFilter === 'ALL' || c.proposedDepartment === departmentFilter;
    const matchesDesig = designationFilter === 'ALL' || c.designation === designationFilter;
    const matchesHr =
      hrFilter === 'ALL' || (c.assignedHr || 'Priya Sharma (HR Lead)') === hrFilter;
    const matchesJoiningDate = !joiningDateFilter || c.joiningDate.includes(joiningDateFilter);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDept &&
      matchesDesig &&
      matchesHr &&
      matchesJoiningDate
    );
  });

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleSaveEditCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCandidate) return;
    editCandidateDetails(editCandidate.id, {
      candidateName: editCandidate.candidateName,
      email: editCandidate.email,
      phone: editCandidate.phone,
      designation: editCandidate.designation,
      proposedDepartment: editCandidate.proposedDepartment,
      offeredCtc: Number(editCandidate.offeredCtc),
      joiningDate: editCandidate.joiningDate,
      assignedHr: editCandidate.assignedHr,
    });
    setEditCandidate(null);
  };

  const handleConfirmCancelCandidate = () => {
    if (!cancelCandidate) return;
    cancelCandidateOnboarding(cancelCandidate.id, cancelReason);
    setCancelCandidate(null);
    setCancelReason('');
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Employee Onboarding Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage candidate invitations, document verification, salary structures & offer letter pipeline.
          </p>
        </div>

        {permissions.canManageOnboarding && (
          <Button
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setInviteModalOpen(true)}
          >
            Invite New Candidate
          </Button>
        )}
      </div>

      {/* METRIC CARDS (6 Consistent Categories) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Candidates"
          value={totalCandidates}
          subtitle="Pipeline headcount"
          icon={<UserCheck className="w-4 h-4 text-indigo-600" />}
        />
        <StatCard
          title="Not Started"
          value={notStartedCount}
          subtitle="Invite sent to candidate"
          icon={<Clock className="w-4 h-4 text-slate-400" />}
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          subtitle="Candidate filling form"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <StatCard
          title="Awaiting Review"
          value={awaitingReviewCount}
          subtitle="Submitted / HR review"
          icon={<FileText className="w-4 h-4 text-indigo-600" />}
          className={awaitingReviewCount > 0 ? 'bg-indigo-50/40 border-indigo-200' : ''}
        />
        <StatCard
          title="Offers Released"
          value={offerReleasedCount}
          subtitle="Letter released"
          icon={<Send className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Completed"
          value={completedCount}
          subtitle="Confirmed / Joined"
          icon={<UserCheck className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* SEARCH AND MULTI-FACET FILTERS */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* SEARCH INPUT */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, email, designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          {/* STATUS FILTER */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Not Started">Not Started (Invite Sent)</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Review">Awaiting Review</option>
              <option value="Offers Released">Offers Released</option>
              <option value="Completed">Completed (Joined)</option>
              <option value="Returned for Correction">Returned for Correction</option>
              <option value="Declined">Declined / Cancelled</option>
            </select>
          </div>

          {/* DEPARTMENT FILTER */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="ALL">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* DESIGNATION FILTER */}
          <div>
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="ALL">All Designations</option>
              {uniqueDesignations.map((desig) => (
                <option key={desig} value={desig}>
                  {desig}
                </option>
              ))}
            </select>
          </div>

          {/* ASSIGNED HR FILTER */}
          <div>
            <select
              value={hrFilter}
              onChange={(e) => setHrFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="ALL">All Assigned HRs</option>
              {uniqueHrs.map((hr) => (
                <option key={hr} value={hr}>
                  {hr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CANDIDATES TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Candidate Name</th>
                <th className="p-3">Designation & Department</th>
                <th className="p-3">Offered CTC</th>
                <th className="p-3">Target Joining Date</th>
                <th className="p-3">Assigned HR</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No candidates found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">
                      {c.candidateName}
                      <span className="block text-[10px] text-slate-500 font-normal">{c.email}</span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {c.designation}
                      <span className="block text-[10px] text-slate-500">{c.proposedDepartment}</span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-indigo-900 tabular-nums">
                      {formatINR(c.offeredCtc)}
                    </td>
                    <td className="p-3 text-slate-700">{formatDate(c.joiningDate)}</td>
                    <td className="p-3 text-slate-600">{c.assignedHr || 'Priya Sharma (HR Lead)'}</td>
                    <td className="p-3">
                      <Badge status={c.status} />
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={copiedToken === c.token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        onClick={() => handleCopyLink(c.token)}
                        title="Copy Candidate Form Link"
                      >
                        {copiedToken === c.token ? 'Copied' : 'Link'}
                      </Button>

                      {permissions.canReviewCandidates && (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setReviewCandidate(c)}
                        >
                          Review
                        </Button>
                      )}

                      {permissions.canManageOnboarding && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => setEditCandidate(c)}
                            title="Edit Candidate Details"
                          >
                            Edit
                          </Button>

                          {c.status !== 'Joined' && c.status !== 'Declined' && (
                            <Button
                              size="sm"
                              variant="danger"
                              icon={<XCircle className="w-3.5 h-3.5" />}
                              onClick={() => setCancelCandidate(c)}
                              title="Cancel / Archive Onboarding"
                            >
                              Cancel
                            </Button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* EDIT CANDIDATE MODAL */}
      {editCandidate && (
        <Modal
          isOpen={!!editCandidate}
          onClose={() => setEditCandidate(null)}
          title={`Edit Candidate Details — ${editCandidate.candidateName}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEditCandidate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  value={editCandidate.candidateName}
                  onChange={(e) => setEditCandidate({ ...editCandidate, candidateName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editCandidate.email}
                  onChange={(e) => setEditCandidate({ ...editCandidate, email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={editCandidate.phone}
                  onChange={(e) => setEditCandidate({ ...editCandidate, phone: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Designation *</label>
                <input
                  type="text"
                  required
                  value={editCandidate.designation}
                  onChange={(e) => setEditCandidate({ ...editCandidate, designation: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proposed Department *</label>
                <input
                  type="text"
                  required
                  value={editCandidate.proposedDepartment}
                  onChange={(e) => setEditCandidate({ ...editCandidate, proposedDepartment: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Offered Annual CTC (₹) *</label>
                <input
                  type="number"
                  required
                  value={editCandidate.offeredCtc}
                  onChange={(e) => setEditCandidate({ ...editCandidate, offeredCtc: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Joining Date *</label>
                <input
                  type="date"
                  required
                  value={editCandidate.joiningDate}
                  onChange={(e) => setEditCandidate({ ...editCandidate, joiningDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned HR Lead</label>
                <input
                  type="text"
                  value={editCandidate.assignedHr || 'Priya Sharma (HR Lead)'}
                  onChange={(e) => setEditCandidate({ ...editCandidate, assignedHr: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="outline" size="sm" type="button" onClick={() => setEditCandidate(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Candidate Details
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CANCEL / ARCHIVE CANDIDATE CONFIRMATION MODAL */}
      {cancelCandidate && (
        <Modal
          isOpen={!!cancelCandidate}
          onClose={() => setCancelCandidate(null)}
          title="Cancel Candidate Onboarding"
          subtitle={`Candidate: ${cancelCandidate.candidateName}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Confirm Cancellation
              </p>
              <p>
                Are you sure you want to cancel or archive onboarding for <strong>{cancelCandidate.candidateName}</strong>? This
                will update status to <strong>Declined</strong>.
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reason for Cancellation (Optional):</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Candidate declined offer, failed verification, or withdrawn..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setCancelCandidate(null)}>
                Keep Active
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmCancelCandidate}>
                Cancel Onboarding
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* INVITE MODAL */}
      {inviteModalOpen && (
        <CandidateInviteModal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
      )}

      {/* REVIEW FORM MODAL */}
      {reviewCandidate && (
        <CandidateReviewModal
          candidate={reviewCandidate}
          isOpen={!!reviewCandidate}
          onClose={() => setReviewCandidate(null)}
          onOpenOfferModal={() => setOfferCandidate(reviewCandidate)}
          onOpenSalaryBuilder={() => setSalaryCandidate(reviewCandidate)}
        />
      )}

      {/* SALARY BUILDER MODAL */}
      {salaryCandidate && (
        <SalaryStructureBuilder
          candidate={salaryCandidate}
          isOpen={!!salaryCandidate}
          onClose={() => setSalaryCandidate(null)}
        />
      )}

      {/* OFFER LETTER MODAL */}
      {offerCandidate && (
        <OfferLetterModal
          candidate={offerCandidate}
          isOpen={!!offerCandidate}
          onClose={() => setOfferCandidate(null)}
        />
      )}
    </div>
  );
};
