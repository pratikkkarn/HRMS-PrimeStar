import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Modal, Input, Button } from '../../common/UIComponents';
import { PurchaseOrder } from '../../../types/domain';

interface POEmployeeAssignModalProps {
  po: PurchaseOrder;
  isOpen: boolean;
  onClose: () => void;
}

export const POEmployeeAssignModal: React.FC<POEmployeeAssignModalProps> = ({
  po,
  isOpen,
  onClose,
}) => {
  const { employees, assignEmployeeToPO } = useData();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.employeeId || '');
  const [billingRatePerMonth, setBillingRatePerMonth] = useState<number>(200000);
  const [assignedFrom, setAssignedFrom] = useState(po.startDate);
  const [assignedTo, setAssignedTo] = useState(po.expiryDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employeeId === selectedEmployeeId);
    if (!emp) return;

    assignEmployeeToPO(po.id, {
      employeeId: emp.employeeId,
      employeeName: emp.name,
      designation: emp.designation,
      billingRatePerMonth,
      assignedFrom,
      assignedTo,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Employee to PO — ${po.poNumber}`}
      subtitle={`Project: ${po.projectName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-slate-700 mb-1">Select Employee *</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
          >
            {employees.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.name} ({e.designation}) — {e.employeeId}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Billing Rate Per Month (INR) *"
            type="number"
            value={billingRatePerMonth}
            onChange={(e) => setBillingRatePerMonth(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Assignment From *"
            type="date"
            value={assignedFrom}
            onChange={(e) => setAssignedFrom(e.target.value)}
            required
          />
          <Input
            label="Assignment To *"
            type="date"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Tag Employee to PO
          </Button>
        </div>
      </form>
    </Modal>
  );
};
