import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Card, Button } from '../../common/UIComponents';
import { formatINR } from '../../../lib/utils';
import { SalaryStructureBuilder } from '../Onboarding/SalaryStructureBuilder';
import { EmployeeProfile } from '../../../types/domain';

export const SalaryStructuresView: React.FC = () => {
  const { employees } = useData();
  const [selectedEmp, setSelectedEmp] = useState<EmployeeProfile | null>(null);

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Salary Structures & Payroll CTC Breakdown</h1>
        <p className="text-slate-500 mt-0.5">
          Centralized compensation matrix, statutory deductions (PF, PT, TDS) & net take-home calculations.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">Employee Name</th>
                <th className="p-3">Designation</th>
                <th className="p-3 text-right">Annual CTC</th>
                <th className="p-3 text-right">Basic / Mo</th>
                <th className="p-3 text-right">Gross / Mo</th>
                <th className="p-3 text-right">Deductions / Mo</th>
                <th className="p-3 text-right">Net Take-Home</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((e) => {
                const s = e.salaryStructure;
                return (
                  <tr key={e.employeeId} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{e.name}</td>
                    <td className="p-3 text-slate-600">{e.designation}</td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-900 tabular-nums">
                      {formatINR(s.annualCtc)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatINR(s.basicMonthly)}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatINR(s.grossMonthly)}
                    </td>
                    <td className="p-3 text-right font-mono text-red-600 tabular-nums">
                      {formatINR(s.totalDeductionsMonthly)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {formatINR(s.netTakeHomeMonthly)}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedEmp(e)}>
                        Edit CTC
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedEmp && (
        <SalaryStructureBuilder
          employee={selectedEmp}
          isOpen={!!selectedEmp}
          onClose={() => setSelectedEmp(null)}
        />
      )}
    </div>
  );
};
