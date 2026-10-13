import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Card, Button, Badge } from '../../common/UIComponents';
import { formatINR, formatDate } from '../../../lib/utils';
import { Users, Eye, Building2 } from 'lucide-react';
import { SalaryStructureBuilder } from '../Onboarding/SalaryStructureBuilder';
import { EmployeeProfile } from '../../../types/domain';

export const EmployeesView: React.FC = () => {
  const { employees } = useData();
  const [selectedEmp, setSelectedEmp] = useState<EmployeeProfile | null>(null);

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
        <p className="text-slate-500 mt-0.5">
          Master registry of active Prime Star consultants, architects & delivery engineers.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Designation & Department</th>
                <th className="p-3">Assigned Delivery Project</th>
                <th className="p-3">Joining Date</th>
                <th className="p-3 text-right">Annual CTC</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((e) => (
                <tr key={e.employeeId} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">
                    {e.name}
                    <span className="block text-[10px] text-slate-500 font-mono font-normal">{e.employeeId}</span>
                  </td>
                  <td className="p-3 text-slate-700">
                    {e.designation}
                    <span className="block text-[10px] text-slate-500">{e.department}</span>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{e.projectName}</td>
                  <td className="p-3 text-slate-600">{formatDate(e.joiningDate)}</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-900 tabular-nums">
                    {formatINR(e.salaryStructure.annualCtc)}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Building2 className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedEmp(e)}
                    >
                      Salary Structure
                    </Button>
                  </td>
                </tr>
              ))}
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
