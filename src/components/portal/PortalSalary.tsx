import React from 'react';
import { useRole } from '../../context/RoleContext';
import { useData } from '../../context/DataContext';
import { Card } from '../common/UIComponents';
import { formatINR } from '../../lib/utils';
import { DollarSign, ShieldCheck } from 'lucide-react';

export const PortalSalary: React.FC = () => {
  const { currentUser } = useRole();
  const { employees } = useData();

  const employee = employees.find((e) => e.employeeId === currentUser.employeeId) || employees[0];
  const sal = employee.salaryStructure;

  return (
    <div className="space-y-6 text-xs">
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Current Salary Structure & CTC Breakdown</h2>
            <p className="text-slate-500">Effective Date: {sal.effectiveDate}</p>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 text-right">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Annual CTC</span>
            <span className="text-xl font-black font-mono text-indigo-900">{formatINR(sal.annualCtc)}</span>
          </div>
        </div>

        {/* MONTHLY BREAKDOWN */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-100 pb-1">
            Monthly Earnings & Allowances
          </h3>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-2.5">Component</th>
                <th className="p-2.5 text-right">Monthly (INR)</th>
                <th className="p-2.5 text-right">Annual (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5 font-medium text-slate-800">Basic Salary</td>
                <td className="p-2.5 text-right font-mono">{formatINR(sal.basicMonthly)}</td>
                <td className="p-2.5 text-right font-mono">{formatINR(sal.basicMonthly * 12)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-800">House Rent Allowance (HRA)</td>
                <td className="p-2.5 text-right font-mono">{formatINR(sal.hraMonthly)}</td>
                <td className="p-2.5 text-right font-mono">{formatINR(sal.hraMonthly * 12)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-800">Conveyance Allowance</td>
                <td className="p-2.5 text-right font-mono">{formatINR(sal.conveyanceMonthly)}</td>
                <td className="p-2.5 text-right font-mono">{formatINR(sal.conveyanceMonthly * 12)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-800">Special Allowance</td>
                <td className="p-2.5 text-right font-mono">{formatINR(sal.specialAllowanceMonthly)}</td>
                <td className="p-2.5 text-right font-mono">{formatINR(sal.specialAllowanceMonthly * 12)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-800">Project Delivery Allowance</td>
                <td className="p-2.5 text-right font-mono">{formatINR(sal.projectAllowanceMonthly)}</td>
                <td className="p-2.5 text-right font-mono">{formatINR(sal.projectAllowanceMonthly * 12)}</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="p-2.5 text-slate-900">Gross Monthly Salary</td>
                <td className="p-2.5 text-right font-mono text-indigo-700">{formatINR(sal.grossMonthly)}</td>
                <td className="p-2.5 text-right font-mono text-indigo-700">{formatINR(sal.grossMonthly * 12)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DEDUCTIONS */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-100 pb-1">
            Statutory Deductions
          </h3>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-2.5">Deduction Type</th>
                <th className="p-2.5 text-right">Monthly (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5 font-medium text-slate-800">Provident Fund (PF)</td>
                <td className="p-2.5 text-right font-mono text-red-600">{formatINR(sal.pfDeductionMonthly)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-800">Professional Tax (PT)</td>
                <td className="p-2.5 text-right font-mono text-red-600">{formatINR(sal.professionalTaxMonthly)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-800">TDS / Income Tax Withholding</td>
                <td className="p-2.5 text-right font-mono text-red-600">{formatINR(sal.tdsDeductionMonthly)}</td>
              </tr>
              <tr className="bg-emerald-50 font-bold">
                <td className="p-2.5 text-emerald-900">Monthly Net Disbursed Take-Home Pay</td>
                <td className="p-2.5 text-right font-mono text-emerald-800 text-sm">{formatINR(sal.netTakeHomeMonthly)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
