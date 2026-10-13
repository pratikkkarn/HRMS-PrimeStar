import React from 'react';
import { Modal, Button } from '../common/UIComponents';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface MicrosoftSsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueDemoSSO: () => void;
}

export const MicrosoftSsoModal: React.FC<MicrosoftSsoModalProps> = ({
  isOpen,
  onClose,
  onContinueDemoSSO,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Microsoft Azure AD Single Sign-On"
      subtitle="Enterprise SSO Integration for Prime Star Consulting Services"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
          <div className="w-5 h-5 grid grid-cols-2 gap-0.5 shrink-0 mt-0.5">
            <div className="bg-[#F25022] rounded-[1px]"></div>
            <div className="bg-[#7FBA00] rounded-[1px]"></div>
            <div className="bg-[#00A4EF] rounded-[1px]"></div>
            <div className="bg-[#FFB900] rounded-[1px]"></div>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Microsoft Entra ID / Azure AD SSO</h4>
            <p className="text-slate-600 leading-relaxed">
              In production, clicking this button initiates OAuth 2.0 PKCE authentication against Prime Star’s Microsoft tenant (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">primestar.onmicrosoft.com</code>).
            </p>
          </div>
        </div>

        <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 text-indigo-900 leading-relaxed">
          <strong>Demo SSO Action:</strong> Would you like to simulate a successful Microsoft Azure AD Single Sign-On authentication for this session?
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => {
              onClose();
              onContinueDemoSSO();
            }}
          >
            Simulate Microsoft SSO Sign-In
          </Button>
        </div>
      </div>
    </Modal>
  );
};
