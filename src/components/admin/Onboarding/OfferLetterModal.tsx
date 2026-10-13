import React from 'react';
import { CandidateOnboarding } from '../../../types/domain';
import { useData } from '../../../context/DataContext';
import { Modal, Button } from '../../common/UIComponents';
import { formatINR, formatDate } from '../../../lib/utils';
import { Download, CheckCircle2, FileText } from 'lucide-react';

interface OfferLetterModalProps {
  candidate: CandidateOnboarding;
  isOpen: boolean;
  onClose: () => void;
}

export const OfferLetterModal: React.FC<OfferLetterModalProps> = ({
  candidate,
  isOpen,
  onClose,
}) => {
  const { releaseOfferLetter } = useData();

  const handleRelease = () => {
    releaseOfferLetter(candidate.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Offer Letter Preview — ${candidate.candidateName}`}
      subtitle="Generated from candidate submitted details and verified compensation terms."
      maxWidth="3xl"
    >
      <div className="space-y-6 text-xs">
        {/* OFFICIAL OFFER LETTER TEMPLATE PREVIEW */}
        <div className="p-8 bg-white border border-slate-300 rounded-xl shadow-xs space-y-6 text-slate-800 leading-relaxed font-sans">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="font-black text-slate-900 text-lg tracking-tight">
                PRIME STAR CONSULTING SERVICES
              </div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Tower B, Electronic City Phase 1, Bengaluru 560100
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              Date: <strong className="text-slate-900">{formatDate(new Date().toISOString())}</strong>
              <br />
              Ref: <strong className="text-slate-900 font-mono">OFFER/PS/2026/{candidate.id}</strong>
            </div>
          </div>

          {/* LETTER BODY */}
          <div className="space-y-3">
            <p className="font-bold text-slate-900">To,</p>
            <p className="font-semibold text-slate-900">{candidate.candidateName}</p>
            <p className="text-slate-600">{candidate.residentialAddress || 'Bengaluru, India'}</p>

            <p className="pt-2 font-bold text-slate-900 underline">
              Subject: Letter of Offer for Employment as {candidate.designation}
            </p>

            <p>Dear {candidate.candidateName},</p>

            <p>
              We are pleased to offer you employment with Prime Star Consulting Services in the role of{' '}
              <strong>{candidate.designation}</strong> within our{' '}
              <strong>{candidate.proposedDepartment}</strong> department.
            </p>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 font-mono">
              <div className="flex justify-between">
                <span>Annual Total Compensation (CTC):</span>
                <strong className="text-indigo-900">{formatINR(candidate.offeredCtc)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Confirmed Target Joining Date:</span>
                <strong className="text-slate-900">{formatDate(candidate.joiningDate)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Primary Work Location:</span>
                <span>Bengaluru Headquarters / Client Office</span>
              </div>
            </div>

            <p>
              This offer is conditional upon satisfactory background verification, identity check, and receipt of relieving
              letters from previous employers.
            </p>

            <p className="pt-4">
              Yours sincerely,
              <br />
              <strong className="text-slate-900">Priya Sundaram</strong>
              <br />
              Head of Human Resources — Prime Star Consulting Services
            </p>
          </div>
        </div>

        {/* WORKFLOW ACTIONS */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => alert('Downloading Offer Letter PDF...')}
          >
            Download Draft PDF
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={handleRelease}
            >
              Confirm & Release Offer Letter
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
