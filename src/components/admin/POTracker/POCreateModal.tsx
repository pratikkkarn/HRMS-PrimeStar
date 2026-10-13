import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { useRole } from '../../../context/RoleContext';
import { Modal, Input, Select, Button } from '../../common/UIComponents';
import { formatINR } from '../../../lib/utils';

interface POCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export const POCreateModal: React.FC<POCreateModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
}) => {
  const { projects, createPO, addProject, sows } = useData();
  const { currentUser } = useRole();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || (projects[0]?.id || 'new')
  );
  const [customProjectName, setCustomProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [poNumber, setPoNumber] = useState(`PO/2026/PS/${Math.floor(1000 + Math.random() * 9000)}`);
  const [sowNumber, setSowNumber] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [poRequester, setPoRequester] = useState(currentUser.name);
  const [startDate, setStartDate] = useState('2026-04-01');
  const [expiryDate, setExpiryDate] = useState('2027-03-31');
  const [amountExclGst, setAmountExclGst] = useState<number>(10000000); // 1 Crore default
  const [gstRate, setGstRate] = useState<number>(18);
  const [billingAddress, setBillingAddress] = useState(
    'Prime Star Consulting Services, Tower B, Electronic City, Bengaluru 560100'
  );
  const [shippingAddress, setShippingAddress] = useState(
    'Prime Star Consulting Services, Tower B, Electronic City, Bengaluru 560100'
  );
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amountInclGst = amountExclGst * (1 + gstRate / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!poNumber.trim()) newErrors.poNumber = 'PO Number is required';
    if (selectedProjectId === 'new' && !customProjectName.trim()) {
      newErrors.customProjectName = 'Please enter project name';
    }
    if (amountExclGst <= 0) newErrors.amountExclGst = 'Amount must be greater than 0';
    if (!startDate) newErrors.startDate = 'Start date required';
    if (!expiryDate) newErrors.expiryDate = 'Expiry date required';
    if (startDate && expiryDate && new Date(startDate) >= new Date(expiryDate)) {
      newErrors.expiryDate = 'Expiry date must be after Start date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let targetProjectId = selectedProjectId;
    let targetProjectName = projects.find((p) => p.id === selectedProjectId)?.name || '';

    // Handle manually entered new project
    if (selectedProjectId === 'new') {
      const proj = addProject({
        name: customProjectName,
        clientName: clientName || 'Client Entity',
        code: `PRJ-${customProjectName.substring(0, 4).toUpperCase()}`,
        projectManager: currentUser.name,
        startDate,
        endDate: expiryDate,
        status: 'Active',
      });
      targetProjectId = proj.id;
      targetProjectName = proj.name;
    }

    createPO({
      poNumber,
      projectId: targetProjectId,
      projectName: targetProjectName,
      sowNumber: sowNumber || undefined,
      quotationNumber: quotationNumber || undefined,
      poRequester,
      startDate,
      expiryDate,
      amountExclGst,
      gstRate,
      billingAddress,
      shippingAddress,
      notes,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Purchase Order (PO)" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* PROJECT SELECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Project Selection <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.clientName})
                </option>
              ))}
              <option value="new">+ Enter New Project Manually</option>
            </select>
          </div>

          <div>
            <Input
              label="PO Number *"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              error={errors.poNumber}
              placeholder="PO/2026/CLIENT/001"
            />
          </div>
        </div>

        {selectedProjectId === 'new' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
            <Input
              label="Manual Project Name *"
              value={customProjectName}
              onChange={(e) => setCustomProjectName(e.target.value)}
              error={errors.customProjectName}
              placeholder="e.g. HDFC Core Migration Phase 2"
            />
            <Input
              label="Client Company Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. HDFC Bank Ltd."
            />
          </div>
        )}

        {/* SOW & QUOTATION REFERENCES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="SOW Reference Number"
            value={sowNumber}
            onChange={(e) => setSowNumber(e.target.value)}
            placeholder="SOW-HDFC-2025-001"
          />
          <Input
            label="Quotation Reference Number"
            value={quotationNumber}
            onChange={(e) => setQuotationNumber(e.target.value)}
            placeholder="QUOT-PS-2025-089"
          />
        </div>

        {/* DATES & REQUESTER */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="PO Start Date *"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.startDate}
          />
          <Input
            label="PO Expiry Date *"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            error={errors.expiryDate}
          />
          <Input
            label="PO Requester"
            value={poRequester}
            onChange={(e) => setPoRequester(e.target.value)}
          />
        </div>

        {/* FINANCIAL CALCULATIONS */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Financial & GST Details
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="Amount Excl. GST (INR) *"
                type="number"
                value={amountExclGst}
                onChange={(e) => setAmountExclGst(Number(e.target.value))}
                error={errors.amountExclGst}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">GST Rate (%)</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value={18}>18% (Standard GST)</option>
                <option value={12}>12%</option>
                <option value={5}>5%</option>
                <option value={0}>0% (Exempt)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Calculated Total Incl. GST
              </label>
              <div className="px-3 py-2 text-xs font-bold font-mono text-indigo-700 bg-white border border-slate-300 rounded-lg">
                {formatINR(amountInclGst)}
              </div>
            </div>
          </div>
        </div>

        {/* ADDRESSES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Billing Address</label>
            <textarea
              rows={2}
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Shipping Address</label>
            <textarea
              rows={2}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">PO Notes / Comments</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Milestone billing upon 30% deliverables complete."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Purchase Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};
