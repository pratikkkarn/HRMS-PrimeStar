import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Modal, Input, Button } from '../../common/UIComponents';
import { PurchaseOrder } from '../../../types/domain';
import { formatINR } from '../../../lib/utils';

interface POInvoiceModalProps {
  po: PurchaseOrder;
  isOpen: boolean;
  onClose: () => void;
}

export const POInvoiceModal: React.FC<POInvoiceModalProps> = ({ po, isOpen, onClose }) => {
  const { addInvoice } = useData();

  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV/PS/26-27/${Math.floor(100 + Math.random() * 900)}`
  );
  const [invoiceDate, setInvoiceDate] = useState('2026-10-13');
  const [billingPeriodStart, setBillingPeriodStart] = useState('2026-09-01');
  const [billingPeriodEnd, setBillingPeriodEnd] = useState('2026-09-30');
  const [amountExclGst, setAmountExclGst] = useState<number>(
    Math.min(1000000, po.remainingBalanceExclGst)
  );
  const [gstRate, setGstRate] = useState<number>(po.gstRate || 18);
  const [isCreditNote, setIsCreditNote] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const gstAmount = amountExclGst * (gstRate / 100);
  const totalInclGst = amountExclGst + gstAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amountExclGst <= 0) {
      setError('Invoice amount must be greater than 0');
      return;
    }

    if (!isCreditNote && amountExclGst > po.remainingBalanceExclGst) {
      setError(`Invoice amount (Excl. GST) cannot exceed remaining PO balance (${formatINR(po.remainingBalanceExclGst)})`);
      return;
    }

    addInvoice(po.id, {
      invoiceNumber,
      invoiceDate,
      billingPeriodStart,
      billingPeriodEnd,
      amountExclGst,
      gstRate,
      status: 'Issued',
      isCreditNote,
      notes,
      documentName: `${invoiceNumber.replace(/\//g, '_')}.pdf`,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Invoice / Credit Note — ${po.poNumber}`}
      subtitle={`Remaining PO Balance: ${formatINR(po.remainingBalanceExclGst)} (Excl. GST)`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCreditNote}
              onChange={(e) => setIsCreditNote(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-semibold text-slate-800">This is a Credit Note (Restores PO Balance)</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Invoice Number *"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
          />
          <Input
            label="Invoice Date *"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Billing Period Start *"
            type="date"
            value={billingPeriodStart}
            onChange={(e) => setBillingPeriodStart(e.target.value)}
            required
          />
          <Input
            label="Billing Period End *"
            type="date"
            value={billingPeriodEnd}
            onChange={(e) => setBillingPeriodEnd(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Amount Excl. GST (INR) *"
            type="number"
            value={amountExclGst}
            onChange={(e) => setAmountExclGst(Number(e.target.value))}
            required
          />
          <div>
            <label className="block font-medium text-slate-700 mb-1">GST Rate (%)</label>
            <input
              type="number"
              value={gstRate}
              onChange={(e) => setGstRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Total Incl. GST</label>
            <div className="px-3 py-2 bg-slate-100 font-mono font-bold text-slate-900 border border-slate-300 rounded-lg">
              {formatINR(totalInclGst)}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <Input
          label="Notes / Deliverable Description"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Monthly cloud migration milestone delivery"
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isCreditNote ? 'Save Credit Note' : 'Issue Invoice'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
