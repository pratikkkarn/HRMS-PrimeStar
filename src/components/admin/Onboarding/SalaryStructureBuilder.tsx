import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Modal, Input, Button } from '../../common/UIComponents';
import { CandidateOnboarding, EmployeeProfile } from '../../../types/domain';
import { formatINR } from '../../../lib/utils';

interface SalaryStructureBuilderProps {
  candidate?: CandidateOnboarding;
  employee?: EmployeeProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const SalaryStructureBuilder: React.FC<SalaryStructureBuilderProps> = ({
  candidate,
  employee,
  isOpen,
  onClose,
}) => {
  const { updateSalaryStructure } = useData();

  const name = candidate?.candidateName || employee?.name || 'Employee';
  const designation = candidate?.designation || employee?.designation || 'Specialist';
  const initialCtc = candidate?.offeredCtc || employee?.salaryStructure.annualCtc || 1800000;

  const [annualCtc, setAnnualCtc] = useState<number>(initialCtc);

  // Default salary formula calculations:
  // Basic: 40% of CTC
  // HRA: 20% of CTC
  // Conveyance: ₹8,000 / mo
  // Special Allowance: Remaining to match Gross CTC
  const basicMonthly = Math.round((annualCtc * 0.4) / 12);
  const hraMonthly = Math.round((annualCtc * 0.2) / 12);
  const conveyanceMonthly = 8000;
  const projectAllowanceMonthly = 10000;
  const grossMonthlyTarget = Math.round(annualCtc / 12);
  const specialAllowanceMonthly = Math.max(
    0,
    grossMonthlyTarget - (basicMonthly + hraMonthly + conveyanceMonthly + projectAllowanceMonthly)
  );

  const grossMonthly =
    basicMonthly + hraMonthly + conveyanceMonthly + specialAllowanceMonthly + projectAllowanceMonthly;

  // Standard deductions
  const pfDeductionMonthly = Math.min(1800, Math.round(basicMonthly * 0.12));
  const professionalTaxMonthly = 200;
  const tdsDeductionMonthly = Math.round(grossMonthly * 0.1);
  const totalDeductionsMonthly = pfDeductionMonthly + professionalTaxMonthly + tdsDeductionMonthly;

  const netTakeHomeMonthly = grossMonthly - totalDeductionsMonthly;

  const handleSave = () => {
    if (employee) {
      updateSalaryStructure(employee.employeeId, {
        annualCtc,
        basicMonthly,
        hraMonthly,
        conveyanceMonthly,
        specialAllowanceMonthly,
        projectAllowanceMonthly,
        grossMonthly,
        pfDeductionMonthly,
        professionalTaxMonthly,
        tdsDeductionMonthly,
        totalDeductionsMonthly,
        netTakeHomeMonthly,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Salary Structure Builder — ${name}`}
      subtitle={`Designation: ${designation}`}
      maxWidth="3xl"
    >
      <div className="space-y-6 text-xs">
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Total Annual CTC (INR)</label>
            <input
              type="number"
              value={annualCtc}
              onChange={(e) => setAnnualCtc(Number(e.target.value))}
              className="px-3 py-1.5 text-base font-bold font-mono text-indigo-900 bg-white border border-indigo-300 rounded-lg"
            />
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-medium">
              Monthly Net Take-Home Pay
            </span>
            <span className="text-2xl font-black font-mono text-emerald-700">
              {formatINR(netTakeHomeMonthly)}
            </span>
          </div>
        </div>

        {/* EARNINGS TABLE */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-100 pb-1">
            01. Monthly & Annual Gross Earnings Components
          </h4>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-2.5">Salary Component</th>
                <th className="p-2.5">Calculation Rule</th>
                <th className="p-2.5 text-right">Monthly (INR)</th>
                <th className="p-2.5 text-right">Annualized (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">Basic Salary</td>
                <td className="p-2.5 text-slate-500">40% of Annual CTC</td>
                <td className="p-2.5 text-right font-mono">{formatINR(basicMonthly)}</td>
                <td className="p-2.5 text-right font-mono">{formatINR(basicMonthly * 12)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">House Rent Allowance (HRA)</td>
                <td className="p-2.5 text-slate-500">50% of Basic Salary</td>
                <td className="p-2.5 text-right font-mono">{formatINR(hraMonthly)}</td>
                <td className="p-2.5 text-right font-mono">{formatINR(hraMonthly * 12)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">Conveyance Allowance</td>
                <td className="p-2.5 text-slate-500">Fixed Monthly Component</td>
                <td className="p-2.5 text-right font-mono">{formatINR(conveyanceMonthly)}</td>
                <td className="p-2.5 text-right font-mono">{formatINR(conveyanceMonthly * 12)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">Project Allowance</td>
                <td className="p-2.5 text-slate-500">Consulting Delivery Allowance</td>
                <td className="p-2.5 text-right font-mono">{formatINR(projectAllowanceMonthly)}</td>
                <td className="p-2.5 text-right font-mono">{formatINR(projectAllowanceMonthly * 12)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">Special Allowance</td>
                <td className="p-2.5 text-slate-500">Balancing Monthly Component</td>
                <td className="p-2.5 text-right font-mono">{formatINR(specialAllowanceMonthly)}</td>
                <td className="p-2.5 text-right font-mono">{formatINR(specialAllowanceMonthly * 12)}</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td colSpan={2} className="p-2.5 text-slate-900">Total Monthly Gross Earnings</td>
                <td className="p-2.5 text-right font-mono text-indigo-700">{formatINR(grossMonthly)}</td>
                <td className="p-2.5 text-right font-mono text-indigo-700">{formatINR(grossMonthly * 12)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DEDUCTIONS TABLE */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-100 pb-1">
            02. Statutory & Tax Deductions
          </h4>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-2.5">Deduction Type</th>
                <th className="p-2.5">Statutory Standard</th>
                <th className="p-2.5 text-right">Monthly Deduction (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5 font-medium text-slate-800">Provident Fund (PF) — Employee Share</td>
                <td className="p-2.5 text-slate-500">12% of Basic (capped at ₹1,800)</td>
                <td className="p-2.5 text-right font-mono text-red-600">{formatINR(pfDeductionMonthly)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-800">Professional Tax (PT)</td>
                <td className="p-2.5 text-slate-500">Karnataka Slab (₹200 / mo)</td>
                <td className="p-2.5 text-right font-mono text-red-600">{formatINR(professionalTaxMonthly)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-800">Income Tax Withholding (TDS)</td>
                <td className="p-2.5 text-slate-500">Estimated Income Tax Slab</td>
                <td className="p-2.5 text-right font-mono text-red-600">{formatINR(tdsDeductionMonthly)}</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td colSpan={2} className="p-2.5 text-slate-900">Total Monthly Deductions</td>
                <td className="p-2.5 text-right font-mono text-red-600">{formatINR(totalDeductionsMonthly)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Salary Structure
          </Button>
        </div>
      </div>
    </Modal>
  );
};
