import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Modal, Button, Badge } from '../../common/UIComponents';
import { CandidateOnboarding } from '../../../types/domain';
import { formatINR, formatDate } from '../../../lib/utils';
import { CheckCircle2, AlertTriangle, FileText, Download, UserCheck, Lock } from 'lucide-react';

interface CandidateReviewModalProps {
  candidate: CandidateOnboarding;
  isOpen: boolean;
  onClose: () => void;
  onOpenOfferModal?: () => void;
  onOpenSalaryBuilder?: () => void;
}

export const CandidateReviewModal: React.FC<CandidateReviewModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onOpenOfferModal,
  onOpenSalaryBuilder,
}) => {
  const { reviewCandidateForm } = useData();
  const [hrComments, setHrComments] = useState(candidate.hrComments || '');
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`HR Candidate Onboarding Review — ${candidate.candidateName}`}
      subtitle={`Designation: ${candidate.designation} · Status: ${candidate.status}`}
      maxWidth="3xl"
    >
      <div className="space-y-6 text-xs">
        {/* SUMMARY BAR */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-slate-500 block">Candidate Name</span>
            <span className="font-bold text-slate-900">{candidate.candidateName}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Contact & Email</span>
            <span className="font-semibold text-slate-900">{candidate.phone}</span>
            <span className="text-slate-500 block text-[11px] truncate">{candidate.email}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Offered CTC</span>
            <span className="font-bold font-mono text-indigo-700">{formatINR(candidate.offeredCtc)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Confirmed Joining Date</span>
            <span className="font-semibold text-slate-900">{formatDate(candidate.joiningDate)}</span>
          </div>
        </div>

        {/* SECTION 1: PERSONAL INFORMATION */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
          <h4 className="font-bold text-slate-900 pb-1 border-b border-slate-100 uppercase tracking-wider text-[11px] text-slate-500">
            01. Residential Address & Personal Info
          </h4>
          <p className="text-slate-800 leading-relaxed">
            {candidate.residentialAddress || 'Not submitted yet'}
          </p>
        </div>

        {/* SECTION 2: EDUCATION RECORDS */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-900 pb-1 border-b border-slate-100 uppercase tracking-wider text-[11px] text-slate-500">
            02. Educational Qualification Records ({candidate.educationList.length})
          </h4>
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
        </div>

        {/* SECTION 3: EMPLOYMENT HISTORY */}
        {candidate.isExperienced && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 pb-1 border-b border-slate-100 uppercase tracking-wider text-[11px] text-slate-500">
              03. Prior Employment History ({candidate.employmentList.length})
            </h4>
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
          </div>
        )}

        {/* SECTION 4: REFERENCES & EMERGENCY CONTACTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[11px] text-slate-500">
              References ({candidate.references.length})
            </h4>
            {candidate.references.map((ref, i) => (
              <div key={i} className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                <div className="font-bold text-slate-900">{ref.name} ({ref.type})</div>
                <div>{ref.designationOrRelation}</div>
                <div>Phone: {ref.contactNumber} · Email: {ref.email}</div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[11px] text-slate-500">
              Emergency Contacts ({candidate.emergencyContacts.length})
            </h4>
            {candidate.emergencyContacts.map((e, i) => (
              <div key={i} className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                <div className="font-bold text-slate-900">{e.name} ({e.relationship})</div>
                <div>Phone: {e.phone}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HR COMMENTS & WORKFLOW ACTIONS */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <label className="font-bold text-slate-900 block">HR Review Notes / Correction Remarks:</label>
          <textarea
            rows={2}
            value={hrComments}
            onChange={(e) => setHrComments(e.target.value)}
            placeholder="Enter HR verification remarks or specify corrections needed before returning form to candidate..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
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
            </div>

            <div className="flex items-center gap-2">
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
            </div>
          </div>
        </div>
      </div>

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
