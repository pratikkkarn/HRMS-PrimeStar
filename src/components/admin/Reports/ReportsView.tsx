import React from 'react';
import { useData } from '../../../context/DataContext';
import { Card, Button } from '../../common/UIComponents';
import { formatINR, formatINRCompact } from '../../../lib/utils';
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react';

interface ReportsViewProps {
  onNavigate?: (tab: string, params?: any) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigate }) => {
  const { purchaseOrders, projects, employees, candidates } = useData();

  const totalPOValue = purchaseOrders.reduce((s, p) => s + p.amountExclGst, 0);
  const totalInvoiced = purchaseOrders.reduce((s, p) => s + p.invoicedExclGst, 0);
  const totalUnbilled = purchaseOrders.reduce((s, p) => s + p.remainingBalanceExclGst, 0);

  const handleExportCSV = () => {
    const csvContent =
      'PO Number,Project Name,PO Amount Excl GST,Invoiced Excl GST,Remaining Balance,Status\n' +
      purchaseOrders
        .map(
          (p) =>
            `"${p.poNumber}","${p.projectName}",${p.amountExclGst},${p.invoicedExclGst},${p.remainingBalanceExclGst},"${p.status}"`
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PrimeStar_PO_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Reports & Audits</h1>
          <p className="text-slate-500 mt-0.5">
            Consolidated PO utilization, client financial commitments & workforce analytics export.
          </p>
        </div>

        <Button variant="primary" icon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>
          Export PO Financials CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          onClick={() => onNavigate?.('po-tracker', { statusFilter: 'ALL' })}
          className="p-4 space-y-2 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all"
        >
          <span className="text-slate-500 text-[11px] font-semibold uppercase">Gross PO Portfolio Value</span>
          <div className="text-2xl font-bold font-mono text-slate-900">{formatINR(totalPOValue)}</div>
        </Card>
        <Card
          onClick={() => onNavigate?.('invoices')}
          className="p-4 space-y-2 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all"
        >
          <span className="text-slate-500 text-[11px] font-semibold uppercase">Total Invoiced & Collected</span>
          <div className="text-2xl font-bold font-mono text-emerald-700">{formatINR(totalInvoiced)}</div>
        </Card>
        <Card
          onClick={() => onNavigate?.('po-tracker', { statusFilter: 'ALL' })}
          className="p-4 space-y-2 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all"
        >
          <span className="text-slate-500 text-[11px] font-semibold uppercase">Total Unbilled Balance Available</span>
          <div className="text-2xl font-bold font-mono text-indigo-700">{formatINR(totalUnbilled)}</div>
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Project-wise Utilization Breakdown</h3>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-3">Project Name</th>
              <th className="p-3">Client</th>
              <th className="p-3 text-right">PO Total (Excl. GST)</th>
              <th className="p-3 text-right">Invoiced</th>
              <th className="p-3 text-right">Remaining Balance</th>
              <th className="p-3 text-right">% Utilized</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((p) => {
              const pPOs = purchaseOrders.filter((po) => po.projectId === p.id);
              const val = pPOs.reduce((s, po) => s + po.amountExclGst, 0);
              const inv = pPOs.reduce((s, po) => s + po.invoicedExclGst, 0);
              const rem = pPOs.reduce((s, po) => s + po.remainingBalanceExclGst, 0);
              const utilPct = val > 0 ? ((inv / val) * 100).toFixed(1) : '0.0';

              return (
                <tr
                  key={p.id}
                  onClick={() => onNavigate?.('po-tracker', { projectFilter: p.id })}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                  <td className="p-3 text-slate-600">{p.clientName}</td>
                  <td className="p-3 text-right font-mono font-medium text-slate-900 tabular-nums">{formatINR(val)}</td>
                  <td className="p-3 text-right font-mono text-emerald-700 tabular-nums">{formatINR(inv)}</td>
                  <td className="p-3 text-right font-mono text-indigo-700 tabular-nums">{formatINR(rem)}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">{utilPct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
