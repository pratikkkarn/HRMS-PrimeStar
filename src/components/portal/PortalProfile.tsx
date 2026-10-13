import React from 'react';
import { useRole } from '../../context/RoleContext';
import { useData } from '../../context/DataContext';
import { Card } from '../common/UIComponents';
import { formatDate } from '../../lib/utils';
import { User, ShieldCheck, Building2, CreditCard } from 'lucide-react';

export const PortalProfile: React.FC = () => {
  const { currentUser } = useRole();
  const { employees } = useData();

  const employee = employees.find((e) => e.employeeId === currentUser.employeeId) || employees[0];

  return (
    <div className="space-y-6 text-xs">
      <Card className="space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-indigo-600 text-white font-black text-xl flex items-center justify-center">
            {employee.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{employee.name}</h2>
            <p className="text-slate-500 font-medium">
              {employee.designation} · {employee.department}
            </p>
            <span className="inline-block mt-1 text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Employee ID: {employee.employeeId}
            </span>
          </div>
        </div>

        {/* WORK & ORGANIZATION INFORMATION */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-100 pb-1">
            01. Employment & Organizational Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Date of Joining</span>
              <span className="font-bold text-slate-900">{formatDate(employee.joiningDate)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Reporting Manager</span>
              <span className="font-bold text-slate-900">{employee.managerName}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Assigned Delivery Project</span>
              <span className="font-bold text-slate-900">{employee.projectName}</span>
            </div>
          </div>
        </div>

        {/* CONTACT & IDENTITY DETAILS */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-100 pb-1">
            02. Contact & Verified Identity Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Official Email</span>
              <span className="font-semibold text-slate-900">{employee.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Phone Number</span>
              <span className="font-semibold text-slate-900">{employee.phone}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">PAN Number</span>
              <span className="font-mono font-semibold text-slate-900">{employee.panNumber}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Aadhaar (Masked)</span>
              <span className="font-mono font-semibold text-slate-900">{employee.aadhaarNumber}</span>
            </div>
          </div>
        </div>

        {/* BANK ACCOUNT */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-100 pb-1">
            03. Payroll Direct Bank Deposit Information
          </h3>
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Direct Payroll Account</span>
            </div>
            <p className="text-indigo-800 font-mono font-medium">{employee.bankAccountDetails}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
