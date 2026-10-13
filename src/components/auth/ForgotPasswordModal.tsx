import React, { useState } from 'react';
import { Modal, Input, Button } from '../common/UIComponents';
import { CheckCircle2, KeyRound } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid Prime Star email address');
      return;
    }

    setSubmitted(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSubmitted(false);
        setEmail('');
        setError('');
        onClose();
      }}
      title="Reset Your Password"
      subtitle="Enter your work email address to receive password recovery instructions."
      maxWidth="md"
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Work Email Address *"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="yourname@primestar.com"
            error={error}
            required
          />

          <p className="text-slate-500 text-[11px] leading-relaxed">
            If an active Prime Star HRMS account exists for this email, password reset instructions will be dispatched to your inbox.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<KeyRound className="w-3.5 h-3.5" />}>
              Send Reset Link
            </Button>
          </div>
        </form>
      ) : (
        <div className="py-4 text-center space-y-4 text-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Reset Link Dispatched!</h4>
            <p className="text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
              We have sent password recovery instructions to <strong>{email}</strong>. Please check your inbox and follow the steps.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="mt-2">
            Return to Sign In
          </Button>
        </div>
      )}
    </Modal>
  );
};
