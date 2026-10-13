import React, { useState } from 'react';
import { CandidateLayout } from '../layout/CandidateLayout';
import { useData } from '../../context/DataContext';
import { Card, Button, Input, Badge } from '../common/UIComponents';
import { CandidateOnboarding } from '../../types/domain';
import { formatINR, formatDate } from '../../lib/utils';
import {
  CheckCircle2,
  FileText,
  Upload,
  Plus,
  Trash2,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const CandidateOnboardingForm: React.FC<{ token: string }> = ({ token }) => {
  const { candidates, updateCandidateOnboarding } = useData();

  // Find candidate by token
  const candidate = candidates.find((c) => c.token === token) || candidates[0];

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CandidateOnboarding>({ ...candidate });

  const [saveToast, setSaveToast] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(candidate.status === 'Submitted');

  const isFormLocked = candidate.status === 'Submitted' || candidate.status === 'Under HR Review' || candidate.status === 'Offer Released';

  const handleSaveProgress = () => {
    updateCandidateOnboarding(token, formData);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleNext = () => {
    handleSaveProgress();
    if (currentStep < 6) setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmitFinal = () => {
    const updated = {
      ...formData,
      status: 'Submitted' as const,
      submittedAt: new Date().toLocaleString('en-IN'),
    };
    updateCandidateOnboarding(token, updated);
    setSubmittedSuccess(true);
  };

  if (submittedSuccess && isFormLocked) {
    return (
      <CandidateLayout>
        <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Onboarding Form Submitted!</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Thank you, <strong>{candidate.candidateName}</strong>. Your onboarding information and identity verification documents have been securely transmitted to the Prime Star HR Team for review.
          </p>
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Form Status:</span>
              <Badge status={candidate.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Candidate Email:</span>
              <span className="font-semibold text-slate-800">{candidate.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Designation:</span>
              <span className="font-semibold text-slate-800">{candidate.designation}</span>
            </div>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div className="space-y-6">
        {/* WELCOME HEADER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                OFFICIAL CANDIDATE WIZARD
              </span>
              <Badge status={candidate.status} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Welcome, {candidate.candidateName}!
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Offered Role: <strong>{candidate.designation}</strong> ({candidate.proposedDepartment}) · Target Joining Date: {formatDate(candidate.joiningDate)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveProgress}>
              {saveToast ? 'Progress Saved!' : 'Save & Resume Later'}
            </Button>
          </div>
        </div>

        {/* STEPPER PROGRESS BAR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-semibold">
            {[
              { step: 1, label: '01. Personal' },
              { step: 2, label: '02. Education' },
              { step: 3, label: '03. Employment' },
              { step: 4, label: '04. Identity Docs' },
              { step: 5, label: '05. References' },
              { step: 6, label: '06. Review & Submit' },
            ].map((s) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`py-2 px-3 rounded-lg text-center transition-all ${
                  currentStep === s.step
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : currentStep > s.step
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1: PERSONAL INFORMATION */}
        {currentStep === 1 && (
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              01. Personal Details & Residential Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Candidate Name *"
                value={formData.candidateName}
                onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                required
              />
              <Input
                label="Email Address *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Primary Contact Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                label="Alternate Contact Phone"
                value={formData.alternatePhone || ''}
                onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Residential Address *
              </label>
              <textarea
                rows={3}
                value={formData.residentialAddress}
                onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                placeholder="Door/Flat No, Street, Layout, City, State, Pincode"
                required
              />
            </div>
          </Card>
        )}

        {/* STEP 2: EDUCATION */}
        {currentStep === 2 && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                02. Educational Qualification Records
              </h3>
              <Button
                size="sm"
                variant="outline"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() =>
                  setFormData({
                    ...formData,
                    educationList: [
                      ...formData.educationList,
                      {
                        qualification: 'B.Tech / Degree',
                        institution: '',
                        boardOrUniversity: '',
                        yearOfPassing: 2022,
                        percentageOrCgpa: '',
                      },
                    ],
                  })
                }
              >
                Add Qualification
              </Button>
            </div>

            {formData.educationList.map((edu, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Qualification Degree *"
                    value={edu.qualification}
                    onChange={(e) => {
                      const updated = [...formData.educationList];
                      updated[idx].qualification = e.target.value;
                      setFormData({ ...formData, educationList: updated });
                    }}
                  />
                  <Input
                    label="Institution / College Name *"
                    value={edu.institution}
                    onChange={(e) => {
                      const updated = [...formData.educationList];
                      updated[idx].institution = e.target.value;
                      setFormData({ ...formData, educationList: updated });
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Board / University *"
                    value={edu.boardOrUniversity}
                    onChange={(e) => {
                      const updated = [...formData.educationList];
                      updated[idx].boardOrUniversity = e.target.value;
                      setFormData({ ...formData, educationList: updated });
                    }}
                  />
                  <Input
                    label="Year of Passing *"
                    type="number"
                    value={edu.yearOfPassing}
                    onChange={(e) => {
                      const updated = [...formData.educationList];
                      updated[idx].yearOfPassing = Number(e.target.value);
                      setFormData({ ...formData, educationList: updated });
                    }}
                  />
                  <Input
                    label="Percentage / CGPA *"
                    value={edu.percentageOrCgpa}
                    onChange={(e) => {
                      const updated = [...formData.educationList];
                      updated[idx].percentageOrCgpa = e.target.value;
                      setFormData({ ...formData, educationList: updated });
                    }}
                  />
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* STEP 3: EMPLOYMENT */}
        {currentStep === 3 && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                03. Prior Employment History
              </h3>
            </div>

            {!formData.isExperienced ? (
              <p className="text-xs text-slate-500 p-4 bg-slate-50 rounded-lg border border-slate-200">
                You are registered as a Fresh Graduate. No prior employment records required.
              </p>
            ) : (
              <div className="space-y-4">
                {formData.employmentList.map((emp, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Company / Employer Name *"
                        value={emp.companyName}
                        onChange={(e) => {
                          const updated = [...formData.employmentList];
                          updated[idx].companyName = e.target.value;
                          setFormData({ ...formData, employmentList: updated });
                        }}
                      />
                      <Input
                        label="Designation Held *"
                        value={emp.designation}
                        onChange={(e) => {
                          const updated = [...formData.employmentList];
                          updated[idx].designation = e.target.value;
                          setFormData({ ...formData, employmentList: updated });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* STEP 4: IDENTITY DOCUMENTS */}
        {currentStep === 4 && (
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              04. Identity Verification Documents
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Aadhaar Card Number *"
                value={formData.identityDocs.aadhaarNumber || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identityDocs: { ...formData.identityDocs, aadhaarNumber: e.target.value },
                  })
                }
                placeholder="XXXX-XXXX-1234"
              />
              <Input
                label="PAN Card Number *"
                value={formData.identityDocs.panNumber || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identityDocs: { ...formData.identityDocs, panNumber: e.target.value },
                  })
                }
                placeholder="ABCPS1234F"
              />
            </div>
          </Card>
        )}

        {/* STEP 5: REFERENCES & EMERGENCY */}
        {currentStep === 5 && (
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              05. Professional References & Emergency Contacts
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800">Professional Reference 1</h4>
                <Input
                  label="Name *"
                  value={formData.references[0]?.name || ''}
                  onChange={(e) => {
                    const refs = [...formData.references];
                    refs[0] = { ...refs[0], name: e.target.value, type: 'Professional' };
                    setFormData({ ...formData, references: refs });
                  }}
                />
                <Input
                  label="Contact Phone *"
                  value={formData.references[0]?.contactNumber || ''}
                  onChange={(e) => {
                    const refs = [...formData.references];
                    refs[0] = { ...refs[0], contactNumber: e.target.value };
                    setFormData({ ...formData, references: refs });
                  }}
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800">Emergency Contact</h4>
                <Input
                  label="Name *"
                  value={formData.emergencyContacts[0]?.name || ''}
                  onChange={(e) => {
                    const em = [...formData.emergencyContacts];
                    em[0] = { ...em[0], name: e.target.value };
                    setFormData({ ...formData, emergencyContacts: em });
                  }}
                />
                <Input
                  label="Relationship *"
                  value={formData.emergencyContacts[0]?.relationship || ''}
                  onChange={(e) => {
                    const em = [...formData.emergencyContacts];
                    em[0] = { ...em[0], relationship: e.target.value };
                    setFormData({ ...formData, emergencyContacts: em });
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* STEP 6: REVIEW & SUBMIT */}
        {currentStep === 6 && (
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              06. Declaration & Final Submission
            </h3>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
              <h4 className="font-bold text-slate-900">Candidate Declaration:</h4>
              <p>
                I hereby declare that all details, educational marks, employment dates, and identity documents submitted in this onboarding form are accurate to the best of my knowledge. I understand that any false declaration will result in termination of offer.
              </p>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900 pt-2">
                <input
                  type="checkbox"
                  checked={formData.hasAcceptedDeclaration}
                  onChange={(e) =>
                    setFormData({ ...formData, hasAcceptedDeclaration: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>I accept the candidate declaration terms.</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={handlePrev}>
                Previous Step
              </Button>
              <Button
                variant="primary"
                disabled={!formData.hasAcceptedDeclaration}
                onClick={handleSubmitFinal}
              >
                Submit Completed Onboarding Form
              </Button>
            </div>
          </Card>
        )}

        {/* BOTTOM NAVIGATION CONTROLS */}
        {currentStep < 6 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              disabled={currentStep === 1}
              icon={<ArrowLeft className="w-3 h-3" />}
              onClick={handlePrev}
            >
              Previous Step
            </Button>

            <Button
              variant="primary"
              icon={<ArrowRight className="w-3 h-3" />}
              onClick={handleNext}
            >
              Next Step
            </Button>
          </div>
        )}
      </div>
    </CandidateLayout>
  );
};
