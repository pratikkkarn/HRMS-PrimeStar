import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { useRole } from '../../../context/RoleContext';
import { StatCard, Badge, Button, Card } from '../../common/UIComponents';
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
} from 'lucide-react';
import { CandidateInviteModal } from './CandidateInviteModal';
import { CandidateReviewModal } from './CandidateReviewModal';
import { SalaryStructureBuilder } from './SalaryStructureBuilder';
import { OfferLetterModal } from './OfferLetterModal';
import { CandidateOnboarding } from '../../../types/domain';

export const OnboardingDashboard: React.FC = () => {
  const { candidates } = useData();
  const { permissions } = useRole();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [reviewCandidate, setReviewCandidate] = useState<CandidateOnboarding | null>(null);
  const [salaryCandidate, setSalaryCandidate] = useState<CandidateOnboarding | null>(null);
  const [offerCandidate, setOfferCandidate] = useState<CandidateOnboarding | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Metrics
  const totalCandidates = candidates.length;
  const inProgressCount = candidates.filter((c) => c.status === 'In Progress').length;
  const submittedCount = candidates.filter((c) => c.status === 'Submitted').length;
  const returnedCount = candidates.filter((c) => c.status === 'Returned for Correction').length;
  const offerReleasedCount = candidates.filter((c) => c.status === 'Offer Released').length;
  const joiningConfirmedCount = candidates.filter((c) => c.status === 'Joining Confirmed' || c.status === 'Joined').length;

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
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

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Candidates"
          value={totalCandidates}
          subtitle="Pipeline headcount"
          icon={<UserCheck className="w-4 h-4 text-indigo-600" />}
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          subtitle="Candidate filling form"
          icon={<Clock className="w-4 h-4 text-slate-500" />}
        />
        <StatCard
          title="Awaiting Review"
          value={submittedCount}
          subtitle="Pending HR check"
          icon={<FileText className="w-4 h-4 text-indigo-600" />}
          className={submittedCount > 0 ? 'bg-indigo-50/40 border-indigo-200' : ''}
        />
        <StatCard
          title="Returned Form"
          value={returnedCount}
          subtitle="Needs correction"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          title="Offers Released"
          value={offerReleasedCount}
          subtitle="Letter released"
          icon={<Send className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Joining Confirmed"
          value={joiningConfirmedCount}
          subtitle="Confirmed start date"
          icon={<UserCheck className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* SEARCH AND FILTERS */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, designation, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="ALL">All Onboarding Statuses</option>
              <option value="Invite Sent">Invite Sent</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Under HR Review">Under HR Review</option>
              <option value="Returned for Correction">Returned for Correction</option>
              <option value="Offer Released">Offer Released</option>
              <option value="Joining Confirmed">Joining Confirmed</option>
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
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No candidates found in onboarding pipeline.
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
                    <td className="p-3">
                      <Badge status={c.status} />
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={copiedToken === c.token ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        onClick={() => handleCopyLink(c.token)}
                      >
                        {copiedToken === c.token ? 'Copied' : 'Copy Link'}
                      </Button>

                      {permissions.canReviewCandidates && (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setReviewCandidate(c)}
                        >
                          Review Form
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODALS */}
      {inviteModalOpen && (
        <CandidateInviteModal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
      )}

      {reviewCandidate && (
        <CandidateReviewModal
          candidate={reviewCandidate}
          isOpen={!!reviewCandidate}
          onClose={() => setReviewCandidate(null)}
          onOpenOfferModal={() => setOfferCandidate(reviewCandidate)}
          onOpenSalaryBuilder={() => setSalaryCandidate(reviewCandidate)}
        />
      )}

      {salaryCandidate && (
        <SalaryStructureBuilder
          candidate={salaryCandidate}
          isOpen={!!salaryCandidate}
          onClose={() => setSalaryCandidate(null)}
        />
      )}

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
