import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Modal, Button, Badge } from '../../common/UIComponents';
import { CandidateOnboarding } from '../../../types/domain';
import { formatINR, formatDate } from '../../../lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  UserCheck,
  Building,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertCircle,
  User,
  Sparkles,
} from 'lucide-react';

interface CandidateReviewModalProps {
  candidate: CandidateOnboarding;
  isOpen: boolean;
  onClose: () => void;
  onOpenOfferModal?: () => void;
  onOpenSalaryBuilder?: () => void;
}

const DEFAULT_CHECKLIST_ITEMS = [
  { id: 'item_id_proof', label: 'Identity Proof (Aadhaar / PAN / Passport) Verified' },
  { id: 'item_education', label: 'Academic Qualification Marksheets & Degree Certificates Verified' },
  { id: 'item_employment', label: 'Prior Employment Relieving Letters & Payslips Verified' },
  { id: 'item_address_emergency', label: 'Residential Address Proof & Emergency Contacts Verified' },
  { id: 'item_bank_payroll', label: 'Bank Account & Statutory Payroll Details Verified' },
  { id: 'item_declaration', label: 'Offer Letter Acceptance & Code of Conduct Declaration Verified' },
];

export const CandidateReviewModal: React.FC<CandidateReviewModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onOpenOfferModal,
  onOpenSalaryBuilder,
}) => {
  const {
    reviewCandidateForm,
    confirmCandidateJoining,
    completeOnboarding,
    updateCandidateChecklist,
  } = useData();

  const [hrComments, setHrComments] = useState(candidate.hrComments || '');
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);

  // Local checklist state initialized from candidate or defaults
  const [checklist, setChecklist] = useState<Record<string, 'Pending' | 'Verified' | 'Waived'>>(() => {
    if (candidate.checklistState && Object.keys(candidate.checklistState).length > 0) {
      return candidate.checklistState;
    }
    // Auto-derive defaults from candidate submitted docs
    const initial: Record<string, 'Pending' | 'Verified' | 'Waived'> = {};
    const hasId = !!(candidate.identityDocs?.panNumber || candidate.identityDocs?.aadhaarNumber);
    const hasEdu = candidate.educationList.length > 0;
    const hasEmp = !candidate.isExperienced || candidate.employmentList.length > 0;
    const hasAddr = !!candidate.residentialAddress && candidate.emergencyContacts.length > 0;
    const hasDecl = candidate.hasAcceptedDeclaration;

    initial.item_id_proof = hasId ? 'Verified' : 'Pending';
    initial.item_education = hasEdu ? 'Verified' : 'Pending';
    initial.item_employment = hasEmp ? 'Verified' : 'Pending';
    initial.item_address_emergency = hasAddr ? 'Verified' : 'Pending';
    initial.item_bank_payroll = 'Pending';
    initial.item_declaration = hasDecl ? 'Verified' : 'Pending';
    return initial;
  });

  const toggleChecklist = (id: string) => {
    const current = checklist[id] || 'Pending';
    const next: 'Pending' | 'Verified' | 'Waived' =
      current === 'Pending' ? 'Verified' : current === 'Verified' ? 'Waived' : 'Pending';
    const updated: Record<string, 'Pending' | 'Verified' | 'Waived'> = { ...checklist, [id]: next };
    setChecklist(updated);
    updateCandidateChecklist(candidate.id, updated);
  };

  // Missing documents calculations
  const missingDocs: string[] = [];
  if (!candidate.identityDocs?.aadhaarNumber && !candidate.identityDocs?.aadhaarDoc) {
    missingDocs.push('Aadhaar Card');
  }
  if (!candidate.identityDocs?.panNumber && !candidate.identityDocs?.panDoc) {
    missingDocs.push('PAN Card');
  }
  if (candidate.educationList.length === 0) {
    missingDocs.push('Degree / Education Certificates');
  }
  if (candidate.isExperienced && candidate.employmentList.length === 0) {
    missingDocs.push('Prior Employment Relieving Letter');
  }
  if (!candidate.residentialAddress) {
    missingDocs.push('Address Details');
  }
  if (candidate.emergencyContacts.length === 0) {
    missingDocs.push('Emergency Contact Details');
  }

  // Completion Percentage calculation
  const totalChecklistCount = DEFAULT_CHECKLIST_ITEMS.length;
  const verifiedCount = DEFAULT_CHECKLIST_ITEMS.filter(
    (item) => checklist[item.id] === 'Verified' || checklist[item.id] === 'Waived'
  ).length;

  const rawDocCompletion = missingDocs.length === 0 ? 100 : Math.max(20, 100 - missingDocs.length * 15);
  const checklistCompletion = Math.round((verifiedCount / totalChecklistCount) * 100);
  const totalCompletionPercentage = Math.round((rawDocCompletion * 0.4) + (checklistCompletion * 0.6));

  const handleApprove = () => {
    reviewCandidateForm(candidate.id, 'approve', hrComments || 'All documents and details verified by HR.');
    onClose();
  };

  const handleReturn = () => {
    if (!hrComments.trim()) {
      alert('Please specify HR comments explaining what needs correction by the candidate.');
      return;
    }
    reviewCandidateForm(candidate.id, 'return_for_correction', hrComments);
    onClose();
  };

  const handleConfirmJoining = () => {
    confirmCandidateJoining(candidate.id);
    onClose();
  };

  const handleFinalizeCompleteOnboarding = () => {
    completeOnboarding(candidate.id);
    setConfirmCompleteOpen(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`HR Candidate Onboarding Review — ${candidate.candidateName}`}
      subtitle={`Designation: ${candidate.designation} · Status: ${candidate.status}`}
      maxWidth="4xl"
    >
      <div className="space-y-6 text-xs">
        {/* TOP OVERVIEW CARD */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{candidate.candidateName}</h3>
                <Badge status={candidate.status} />
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                {candidate.designation} · {candidate.proposedDepartment}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] text-indigo-300 block uppercase font-medium">Verified Onboarding Progress</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{totalCompletionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 transition-all duration-500 ${
                totalCompletionPercentage >= 90
                  ? 'bg-emerald-500'
                  : totalCompletionPercentage >= 50
                  ? 'bg-amber-400'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${totalCompletionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1 border-t border-slate-800 text-slate-300">
            <div>
              <span className="text-slate-400 block">Offered CTC:</span>
              <span className="font-semibold text-white font-mono">{formatINR(candidate.offeredCtc)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Joining Date:</span>
              <span className="font-semibold text-white">{formatDate(candidate.joiningDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Assigned HR Lead:</span>
              <span className="font-semibold text-white">{candidate.assignedHr || 'Priya Sharma (HR Lead)'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Contact & Email:</span>
              <span className="font-semibold text-white truncate block">{candidate.email}</span>
            </div>
          </div>
        </div>

        {/* MISSING DOCUMENTS INDICATORS */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Document Submission Status
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {missingDocs.length === 0 ? 'All Key Documents Uploaded' : `${missingDocs.length} Requirements Pending`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {missingDocs.length === 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> All required candidate records are present
              </span>
            ) : (
              missingDocs.map((doc, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-medium text-[11px]"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Missing: {doc}
                </span>
              ))
            )}
          </div>
        </div>

        {/* SECTION 1: CONFIGURABLE ONBOARDING CHECKLIST */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Structured HR Onboarding Verification Checklist ({verifiedCount}/{totalChecklistCount})
            </h4>
            <span className="text-[11px] text-slate-500">Click item badge to change verification state</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEFAULT_CHECKLIST_ITEMS.map((item) => {
              const state = checklist[item.id] || 'Pending';
              return (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    state === 'Verified'
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : state === 'Waived'
                      ? 'bg-slate-50 border-slate-200 text-slate-600'
                      : 'bg-amber-50/40 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {state === 'Verified' ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="font-medium text-[11px]">{item.label}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      state === 'Verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : state === 'Waived'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {state}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: PERSONAL ADDRESS & CONTACT DETAILS */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
          <h4 className="font-bold text-slate-900 pb-1 border-b border-slate-100 uppercase tracking-wider text-[11px] text-slate-500">
            01. Residential Address & Personal Details
          </h4>
          <p className="text-slate-800 leading-relaxed">
            {candidate.residentialAddress || 'Address details not submitted by candidate.'}
          </p>
          <div className="flex flex-wrap gap-4 pt-1 text-slate-600 text-[11px]">
            <span>Phone: <strong>{candidate.phone}</strong></span>
            {candidate.alternatePhone && <span>Alternate: <strong>{candidate.alternatePhone}</strong></span>}
            <span>Email: <strong>{candidate.email}</strong></span>
          </div>
        </div>

        {/* SECTION 3: EDUCATIONAL QUALIFICATIONS */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-900 pb-1 border-b border-slate-100 uppercase tracking-wider text-[11px] text-slate-500">
            02. Educational Qualification Records ({candidate.educationList.length})
          </h4>
          {candidate.educationList.length === 0 ? (
            <p className="text-slate-400 italic">No education records uploaded.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {candidate.educationList.map((edu, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-900">{edu.qualification}</div>
                    <div className="text-slate-500 text-[11px]">
                      {edu.institution} ({edu.boardOrUniversity}) · Passed {edu.yearOfPassing} · Grade: {edu.percentageOrCgpa}
                    </div>
                  </div>
                  {edu.documentName && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewDoc(edu.documentName || 'Education_Doc.pdf')}
                    >
                      View Document
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: PRIOR EMPLOYMENT */}
        {candidate.isExperienced && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 pb-1 border-b border-slate-100 uppercase tracking-wider text-[11px] text-slate-500">
              03. Prior Employment History ({candidate.employmentList.length})
            </h4>
            {candidate.employmentList.length === 0 ? (
              <p className="text-slate-400 italic">No prior employment records uploaded.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {candidate.employmentList.map((emp, idx) => (
                  <div key={idx} className="py-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{emp.companyName} — {emp.designation}</span>
                      <span className="font-mono text-slate-500 text-[11px]">Last CTC: {formatINR(emp.lastDrawnCtc)}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Period: {formatDate(emp.startDate)} to {formatDate(emp.endDate)} · Reason for leaving: {emp.reasonForLeaving}
                    </p>
                    {emp.relievingLetterDoc && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewDoc(emp.relievingLetterDoc || 'Relieving_Letter.pdf')}
                      >
                        View Relieving Letter
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 5: REFERENCES & EMERGENCY CONTACTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[11px] text-slate-500">
              Professional & Personal References ({candidate.references.length})
            </h4>
            {candidate.references.length === 0 ? (
              <p className="text-slate-400 italic">No reference details submitted.</p>
            ) : (
              candidate.references.map((ref, i) => (
                <div key={i} className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="font-bold text-slate-900">{ref.name} ({ref.type})</div>
                  <div>{ref.designationOrRelation}</div>
                  <div>Phone: {ref.contactNumber} · Email: {ref.email}</div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[11px] text-slate-500">
              Emergency Contacts ({candidate.emergencyContacts.length})
            </h4>
            {candidate.emergencyContacts.length === 0 ? (
              <p className="text-slate-400 italic">No emergency contacts submitted.</p>
            ) : (
              candidate.emergencyContacts.map((e, i) => (
                <div key={i} className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="font-bold text-slate-900">{e.name} ({e.relationship})</div>
                  <div>Phone: {e.phone}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* HR COMMENTS & WORKFLOW ACTIONS */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <label className="font-bold text-slate-900 block">HR Review Remarks & Verification Notes:</label>
          <textarea
            rows={2}
            value={hrComments}
            onChange={(e) => setHrComments(e.target.value)}
            placeholder="Enter HR verification remarks or specify corrections needed before returning form to candidate..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenSalaryBuilder && (
                <Button variant="outline" size="sm" onClick={onOpenSalaryBuilder}>
                  Build Salary Structure
                </Button>
              )}
              {onOpenOfferModal && (
                <Button variant="outline" size="sm" onClick={onOpenOfferModal}>
                  Offer Letter Preview
                </Button>
              )}
              {candidate.status === 'Offer Released' && (
                <Button variant="outline" size="sm" onClick={handleConfirmJoining}>
                  Confirm Candidate Joining
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                onClick={handleReturn}
              >
                Return for Correction
              </Button>

              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={handleApprove}
              >
                Approve & Mark Verified
              </Button>

              {candidate.status !== 'Joined' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<UserCheck className="w-3.5 h-3.5" />}
                  onClick={() => setConfirmCompleteOpen(true)}
                >
                  Complete Onboarding
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM COMPLETE ONBOARDING MODAL */}
      {confirmCompleteOpen && (
        <Modal
          isOpen={confirmCompleteOpen}
          onClose={() => setConfirmCompleteOpen(false)}
          title="Complete Onboarding & Create/Link Employee Record"
          subtitle={`Candidate: ${candidate.candidateName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Finalize Employee Onboarding
              </p>
              <p>
                Completing onboarding will set the candidate status to <strong>Joined</strong> and create or link an active
                Employee Profile (with salary structure and official ID) in the master Prime Star employee registry.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-slate-700">
              <div><strong>Name:</strong> {candidate.candidateName}</div>
              <div><strong>Email:</strong> {candidate.email}</div>
              <div><strong>Designation:</strong> {candidate.designation}</div>
              <div><strong>Department:</strong> {candidate.proposedDepartment}</div>
              <div><strong>Offered CTC:</strong> {formatINR(candidate.offeredCtc)}</div>
              <div><strong>Joining Date:</strong> {formatDate(candidate.joiningDate)}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setConfirmCompleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<UserCheck className="w-4 h-4" />}
                onClick={handleFinalizeCompleteOnboarding}
              >
                Complete & Generate Employee Record
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* PREVIEW DOCUMENT MODAL */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Document Preview — ${previewDoc}`}
          maxWidth="xl"
        >
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <FileText className="w-12 h-12 text-indigo-600 mx-auto" />
            <h4 className="font-bold text-slate-900">{previewDoc}</h4>
            <p className="text-xs text-slate-500">Verified document uploaded by candidate.</p>
            <Button
              variant="primary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => alert(`Downloading ${previewDoc}`)}
            >
              Download
            </Button>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
