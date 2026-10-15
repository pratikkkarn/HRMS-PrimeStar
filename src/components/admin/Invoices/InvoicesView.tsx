import React from 'react';
import { useData } from '../../../context/DataContext';
import { Card, Badge } from '../../common/UIComponents';
import { formatINR, formatDate } from '../../../lib/utils';
import { DollarSign } from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const { purchaseOrders } = useData();

  // Flatten all invoices across POs
  const allInvoices = purchaseOrders.flatMap((po) =>
    po.invoices.map((inv) => ({
      ...inv,
      poNumber: po.poNumber,
      projectName: po.projectName,
    }))
  );

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoices & Billing History</h1>
        <p className="text-slate-500 mt-0.5">
          Master ledger of issued invoices, credit notes & GST records across all active purchase orders.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">Invoice / Credit Note No.</th>
                <th className="p-3">PO Number & Project</th>
                <th className="p-3">Type</th>
                <th className="p-3">Assigned Employee(s)</th>
                <th className="p-3">Invoice Date</th>
                <th className="p-3 text-right">Amount (Excl. GST)</th>
                <th className="p-3 text-right">GST (18%)</th>
                <th className="p-3 text-right">Total (Incl. GST)</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No invoice records registered.
                  </td>
                </tr>
              ) : (
                allInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-3">
                      <span className="font-mono font-semibold text-slate-800 block">{inv.poNumber}</span>
                      <span className="text-[11px] text-slate-500">{inv.projectName}</span>
                    </td>
                    <td className="p-3">
                      {inv.isCreditNote ? (
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          Credit Note
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          Invoice
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {inv.employeeNames && inv.employeeNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {inv.employeeNames.map((name) => (
                            <span key={name} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold text-[10px]">
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : inv.employeeName ? (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold text-[10px]">
                          {inv.employeeName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatINR(inv.amountExclGst)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500 tabular-nums">
                      {formatINR(inv.gstAmount)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(inv.totalAmountInclGst)}
                    </td>
                    <td className="p-3">
                      <Badge status={inv.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
