import { PurchaseOrder, Project, Invoice } from '../types/domain';

export interface POCounts {
  taxInvoiceCount: number;
  creditNoteCount: number;
  cancelledCount: number;
  totalLedgerCount: number;
}

/**
 * Calculates standardized invoice and credit note counts for a Purchase Order.
 * Tax invoices are counted separately from credit notes.
 */
export const getPOCounts = (po: PurchaseOrder): POCounts => {
  const taxInvoiceCount = po.invoices.filter((i) => !i.isCreditNote && i.status !== 'Cancelled').length;
  const creditNoteCount = po.invoices.filter((i) => i.isCreditNote && i.status !== 'Cancelled').length;
  const cancelledCount = po.invoices.filter((i) => i.status === 'Cancelled').length;
  const totalLedgerCount = po.invoices.length;

  return {
    taxInvoiceCount,
    creditNoteCount,
    cancelledCount,
    totalLedgerCount,
  };
};

/**
 * Recalculates PO financial balances based strictly on PO-specific invoices & credit notes.
 * Status rules:
 * - 'Issued' or 'Paid': Active transactions. Mutate net invoiced totals and PO balance.
 * - 'Pending': Draft/unapproved. Zero financial effect until approved/issued.
 * - 'Cancelled': Voided. Zero financial effect.
 *
 * Formula:
 * - Gross Invoiced (excl GST) = sum of all active tax invoices (!isCreditNote && (status === 'Issued' || status === 'Paid'))
 * - Credit Notes (excl GST) = sum of all active credit notes (isCreditNote && (status === 'Issued' || status === 'Paid'))
 * - Remaining PO Balance (excl GST) = PO Amount - Gross Invoiced + Credit Notes
 */
export const recalculatePOBalances = (po: PurchaseOrder): PurchaseOrder => {
  let invoicedExclGst = 0;
  let creditNotesExclGst = 0;

  po.invoices.forEach((inv) => {
    // Only Issued or Paid invoices/credit notes affect active financial totals
    if (inv.status === 'Issued' || inv.status === 'Paid') {
      if (inv.isCreditNote) {
        creditNotesExclGst += Math.abs(inv.amountExclGst);
      } else {
        invoicedExclGst += Math.abs(inv.amountExclGst);
      }
    }
  });

  const remainingBalanceExclGst = Math.max(0, po.amountExclGst - invoicedExclGst + creditNotesExclGst);

  let status = po.status;
  if (status !== 'Renewed' && status !== 'Closed') {
    if (remainingBalanceExclGst === 0) {
      status = 'Fully Utilized';
    } else if (remainingBalanceExclGst / po.amountExclGst <= 0.15) {
      status = 'Low Balance';
    } else {
      const expDate = new Date(po.expiryDate);
      const now = new Date();
      const diffDays = (expDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
      if (diffDays <= 0) {
        status = 'Expired';
      } else if (diffDays <= 60) {
        status = 'Expiring Soon';
      } else {
        status = 'Active';
      }
    }
  }

  return {
    ...po,
    invoicedExclGst,
    creditNotesExclGst,
    remainingBalanceExclGst,
    status,
  };
};

/**
 * Validates whether a new tax invoice amount exceeds the available PO balance.
 */
export const validateNewInvoiceAmount = (po: PurchaseOrder, newAmountExclGst: number): { valid: boolean; error?: string } => {
  const recalculated = recalculatePOBalances(po);
  if (newAmountExclGst <= 0) {
    return { valid: false, error: 'Invoice amount must be greater than zero.' };
  }
  if (newAmountExclGst > recalculated.remainingBalanceExclGst) {
    return {
      valid: false,
      error: `Invoice amount (₹${newAmountExclGst.toLocaleString('en-IN')}) exceeds available remaining PO balance (₹${recalculated.remainingBalanceExclGst.toLocaleString('en-IN')}).`,
    };
  }
  return { valid: true };
};

/**
 * Validates whether a new credit note is eligible based on gross active previously invoiced tax totals for the PO.
 * Rule: Eligible Amount to Credit = Gross Active Tax Invoiced - Existing Active Credit Notes.
 * Credit notes are NOT rejected simply because the remaining PO balance is low or zero.
 */
export const validateNewCreditNoteAmount = (po: PurchaseOrder, creditAmountExclGst: number): { valid: boolean; error?: string } => {
  const recalculated = recalculatePOBalances(po);
  if (creditAmountExclGst <= 0) {
    return { valid: false, error: 'Credit note amount must be greater than zero.' };
  }
  const eligibleAmount = recalculated.invoicedExclGst - recalculated.creditNotesExclGst;
  if (eligibleAmount <= 0) {
    return { valid: false, error: 'No active previously invoiced amounts exist on this PO to issue a credit note against.' };
  }
  if (creditAmountExclGst > eligibleAmount) {
    return {
      valid: false,
      error: `Credit note amount (₹${creditAmountExclGst.toLocaleString('en-IN')}) exceeds eligible net invoiced amount (₹${eligibleAmount.toLocaleString('en-IN')}).`,
    };
  }
  return { valid: true };
};

/**
 * Recalculates Project financial totals based on PO-specific active purchase orders.
 */
export const recalculateProjectBalances = (projects: Project[], purchaseOrders: PurchaseOrder[]): Project[] => {
  return projects.map((proj) => {
    const projPOs = purchaseOrders.filter((p) => p.projectId === proj.id);
    const totalPoValue = projPOs.reduce((sum, p) => sum + (p.amountExclGst || 0), 0);
    const remainingBalance = projPOs.reduce((sum, p) => sum + (p.remainingBalanceExclGst || 0), 0);
    return {
      ...proj,
      totalPoValue,
      remainingBalance,
    };
  });
};

