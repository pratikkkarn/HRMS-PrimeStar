import { PurchaseOrder, Project } from '../types/domain';

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
 * Formula:
 * - Gross Invoiced (excl GST) = sum of all active tax invoices (!isCreditNote && status !== 'Cancelled')
 * - Credit Notes (excl GST) = sum of all active credit notes (isCreditNote && status !== 'Cancelled')
 * - Remaining PO Balance (excl GST) = PO Amount - Gross Invoiced + Credit Notes
 *   (Credit Notes restore the available PO balance exactly once)
 */
export const recalculatePOBalances = (po: PurchaseOrder): PurchaseOrder => {
  let invoicedExclGst = 0;
  let creditNotesExclGst = 0;

  po.invoices.forEach((inv) => {
    if (inv.status !== 'Cancelled') {
      if (inv.isCreditNote) {
        creditNotesExclGst += inv.amountExclGst;
      } else {
        invoicedExclGst += inv.amountExclGst;
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
