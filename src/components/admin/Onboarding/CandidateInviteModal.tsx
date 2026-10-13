import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Modal, Input, Button } from '../../common/UIComponents';
import { Copy, Check } from 'lucide-react';

interface CandidateInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateInviteModal: React.FC<CandidateInviteModalProps> = ({ isOpen, onClose }) => {
  const { inviteCandidate } = useData();

  const [candidateName, setCandidateName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Senior Cloud Engineer');
  const [proposedDepartment, setProposedDepartment] = useState('Technology Consulting');
  const [offeredCtc, setOfferedCtc] = useState<number>(1800000);
  const [joiningDate, setJoiningDate] = useState('2026-11-15');
  const [isExperienced, setIsExperienced] = useState(true);

  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cand = inviteCandidate({
      candidateName,
      email,
      phone,
      designation,
      proposedDepartment,
      offeredCtc,
      joiningDate,
      isExperienced,
    });
    setGeneratedToken(cand.token);
  };

  const shareableUrl = generatedToken
    ? `${window.location.origin}?token=${generatedToken}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Candidate Onboarding Link"
      subtitle="Candidates access their secure onboarding wizard through this personal link without requiring an initial password."
      maxWidth="lg"
    >
      {!generatedToken ? (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Candidate Full Name *"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              required
              placeholder="e.g. Aditya Sen"
            />
            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="aditya.sen@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+91 98765 43210"
            />
            <Input
              label="Designation Offered *"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Proposed Department *"
              value={proposedDepartment}
              onChange={(e) => setProposedDepartment(e.target.value)}
              required
            />
            <Input
              label="Offered CTC (Annual INR) *"
              type="number"
              value={offeredCtc}
              onChange={(e) => setOfferedCtc(Number(e.target.value))}
              required
            />
            <Input
              label="Target Joining Date *"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={isExperienced}
                onChange={(e) => setIsExperienced(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Experienced Hire (Requires Employment History & Relieving Letters)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Generate Link & Create Candidate
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 text-xs py-2">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 space-y-1">
            <h4 className="font-bold">Onboarding Record Created Successfully!</h4>
            <p>
              Personal onboarding invitation link generated for <strong>{candidateName}</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Unique Candidate Link:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-mono text-xs text-slate-800"
              />
              <Button
                variant="primary"
                size="sm"
                icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={onClose}>
              Close Window
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
