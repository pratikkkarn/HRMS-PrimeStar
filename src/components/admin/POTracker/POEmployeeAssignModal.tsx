import React, { useState, useEffect } from 'react';
import { useData } from '../../../context/DataContext';
import { Modal, Input, Button } from '../../common/UIComponents';
import { PurchaseOrder } from '../../../types/domain';
import { AlertCircle, Info, CheckCircle2 } from 'lucide-react';

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

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [billingRatePerMonth, setBillingRatePerMonth] = useState<number>(200000);
  const [assignedFrom, setAssignedFrom] = useState(po.startDate);
  const [assignedTo, setAssignedTo] = useState(po.expiryDate);
  const [error, setError] = useState('');

  // Reset or initialize when modal opens or employee changes
  useEffect(() => {
    if (!isOpen) return;
    setError('');

    // Default selection if none set or not in employees
    let initialEmpId = selectedEmployeeId;
    if (!initialEmpId || !employees.some((e) => e.employeeId === initialEmpId)) {
      initialEmpId = employees[0]?.employeeId || '';
      setSelectedEmployeeId(initialEmpId);
    }

    const existingAssigned = po.assignedEmployees.find((e) => e.employeeId === initialEmpId);
    if (existingAssigned) {
      setBillingRatePerMonth(existingAssigned.billingRatePerMonth || 200000);
      setAssignedFrom(existingAssigned.assignedFrom || po.startDate);
      setAssignedTo(existingAssigned.assignedTo || po.expiryDate);
    } else {
      setBillingRatePerMonth(200000);
      setAssignedFrom(po.startDate);
      setAssignedTo(po.expiryDate);
    }
  }, [isOpen, selectedEmployeeId, po]);

  const handleEmployeeSelectChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    setError('');

    const existingAssigned = po.assignedEmployees.find((e) => e.employeeId === empId);
    if (existingAssigned) {
      setBillingRatePerMonth(existingAssigned.billingRatePerMonth || 200000);
      setAssignedFrom(existingAssigned.assignedFrom || po.startDate);
      setAssignedTo(existingAssigned.assignedTo || po.expiryDate);
    } else {
      setBillingRatePerMonth(200000);
      setAssignedFrom(po.startDate);
      setAssignedTo(po.expiryDate);
    }
  };

  const selectedEmp = employees.find((e) => e.employeeId === selectedEmployeeId);
  const existingAssigned = po.assignedEmployees.find((e) => e.employeeId === selectedEmployeeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedEmp) {
      setError('Please select a valid employee.');
      return;
    }

    if (isNaN(billingRatePerMonth) || billingRatePerMonth <= 0) {
      setError('Billing rate per month must be greater than ₹0.');
      return;
    }

    if (new Date(assignedTo) < new Date(assignedFrom)) {
      setError('Assignment End Date cannot be earlier than Assignment Start Date.');
      return;
    }

    assignEmployeeToPO(po.id, {
      employeeId: selectedEmp.employeeId,
      employeeName: selectedEmp.name,
      designation: selectedEmp.designation,
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
      subtitle={`Project: ${po.projectName} · PO Requester: ${po.poRequester}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Select Employee *</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => handleEmployeeSelectChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
          >
            {employees.map((e) => {
              const isTagged = po.assignedEmployees.some((a) => a.employeeId === e.employeeId);
              return (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.name} ({e.designation}) — {e.employeeId} {isTagged ? '★ [Already Tagged]' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {existingAssigned ? (
          <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[11px]">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>{selectedEmp?.name}</strong> is currently tagged to this PO. Submitting will update their billing rate and assignment dates.
            </span>
          </div>
        ) : (
          selectedEmp && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                New assignment for <strong>{selectedEmp.name}</strong> ({selectedEmp.designation}).
              </span>
            </div>
          )
        )}

        <div>
          <Input
            label="Billing Rate Per Month (INR) *"
            type="number"
            min="1"
            value={billingRatePerMonth || ''}
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

        {error && (
          <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px]">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {existingAssigned ? 'Update Tagged Employee' : 'Tag Employee to PO'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
