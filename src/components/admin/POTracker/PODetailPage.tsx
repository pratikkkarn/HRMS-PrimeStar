import React, { useState, useEffect } from 'react';
import { PurchaseOrder, Invoice } from '../../../types/domain';
import { useData } from '../../../context/DataContext';
import { useRole } from '../../../context/RoleContext';
import { Badge, Button, Card, Modal } from '../../common/UIComponents';
import { formatINR, formatDate, getDaysRemaining } from '../../../lib/utils';
import { getPOCounts } from '../../../lib/poUtils';
import { downloadDocument, getDocumentSource } from '../../../lib/documentDownloader';
import { PdfViewer } from '../../common/PdfViewer';
import {
  FileText,
  DollarSign,
  Users,
  RefreshCw,
  Clock,
  Plus,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { POInvoiceModal } from './POInvoiceModal';
import { PORenewalModal } from './PORenewalModal';
import { POEmployeeAssignModal } from './POEmployeeAssignModal';

interface PODetailPageProps {
  po: PurchaseOrder;
  onBack: () => void;
}

export const PODetailPage: React.FC<PODetailPageProps> = ({ po, onBack }) => {
  const { cancelInvoice, updateInvoiceStatus, unassignEmployeeFromPO } = useData();
  const { permissions } = useRole();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'documents' | 'invoices' | 'employees' | 'renewal' | 'audit'
  >('overview');

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    type: 'sow' | 'po' | 'quotation' | 'invoice' | 'generic';
    invoice?: Invoice;
  } | null>(null);
  const [docSource, setDocSource] = useState<{
    url?: string;
    file?: Blob;
    isRealFile: boolean;
  } | null>(null);

  useEffect(() => {
    if (!previewDoc) {
      setDocSource(null);
      return;
    }

    const source = getDocumentSource({
      filename: previewDoc.name,
      documentType: previewDoc.type,
      po,
      sowNumber: po.sowNumber,
      quotationNumber: po.quotationNumber,
      invoiceNumber: previewDoc.invoice?.invoiceNumber,
      invoice: previewDoc.invoice,
      file: previewDoc.invoice?.fileData,
    });

    setDocSource(source);
  }, [previewDoc, po]);

  const daysLeft = getDaysRemaining(po.expiryDate);
  const counts = getPOCounts(po);

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={onBack}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              ← Back to PO Tracker
            </button>
            <span className="text-slate-300">|</span>
            <Badge status={po.status} />
            {daysLeft <= 60 && daysLeft > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                Expires in {daysLeft} days
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono">{po.poNumber}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Project: <strong className="text-slate-800 font-semibold">{po.projectName}</strong></span>
            <span>·</span>
            <span>PO Requester: <strong className="text-slate-800 font-semibold">{po.poRequester}</strong></span>
            <span>·</span>
            <div className="flex items-center gap-1">
              <span className="font-medium text-slate-600">Assigned Workforce:</span>
              {po.assignedEmployees && po.assignedEmployees.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {po.assignedEmployees.map((e) => (
                    <span key={e.employeeId} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold text-[10px]">
                      {e.employeeName} ({e.employeeId})
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 italic">None tagged</span>
              )}
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {permissions.canManageInvoices && po.status !== 'Renewed' && po.status !== 'Closed' && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setInvoiceModalOpen(true)}
            >
              Add Invoice
            </Button>
          )}

          {permissions.canAssignEmployeesToPO && (
            <Button
              variant="outline"
              size="sm"
              icon={<Users className="w-3.5 h-3.5" />}
              onClick={() => setAssignModalOpen(true)}
            >
              Tag Employee
            </Button>
          )}

          {permissions.canManagePOs && (
            <Button
              variant="primary"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => setRenewalModalOpen(true)}
            >
              Renew PO
            </Button>
          )}
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            PO Value (Excl. GST)
          </span>
          <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
            {formatINR(po.amountExclGst)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Incl. GST ({po.gstRate}%): {formatINR(po.amountInclGst)}
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Invoiced (Excl. GST)
          </span>
          <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
            {formatINR(po.invoicedExclGst)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {counts.taxInvoiceCount} Invoices Issued
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Credit Notes
          </span>
          <span className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
            {formatINR(po.creditNotesExclGst)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {counts.creditNoteCount} Credit Note(s) (Restores Balance)
          </span>
        </Card>

        <Card className="p-4 bg-indigo-50/50 border-indigo-200">
          <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider block mb-1">
            Remaining PO Balance
          </span>
          <span className="text-xl font-black font-mono text-indigo-900 tabular-nums">
            {formatINR(po.remainingBalanceExclGst)}
          </span>
          <span className="text-[11px] text-indigo-700 font-medium block mt-1">
            {((po.remainingBalanceExclGst / po.amountExclGst) * 100).toFixed(1)}% Available
          </span>
        </Card>
      </div>

      {/* TABS HEADER */}
      <div className="border-b border-slate-200 bg-white rounded-xl px-4 shadow-2xs">
        <nav className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'documents', label: 'Documents & SOW Chain', icon: FileSpreadsheet },
            {
              id: 'invoices',
              label: `Invoices & Balance (${po.invoices.length})`,
              icon: DollarSign,
            },
            {
              id: 'employees',
              label: `Assigned Employees (${po.assignedEmployees.length})`,
              icon: Users,
            },
            { id: 'renewal', label: 'Renewal & Related POs', icon: RefreshCw },
            {
              id: 'audit',
              label: `Audit Logs (${po.activityLogs.length})`,
              icon: Clock,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Purchase Order Metadata & Rules
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">PO Number</span>
                <span className="font-semibold text-slate-900 font-mono">{po.poNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Project Name</span>
                <span className="font-semibold text-slate-900">{po.projectName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">SOW Reference</span>
                <span className="font-medium text-slate-800 font-mono">
                  {po.sowNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Quotation Reference</span>
                <span className="font-medium text-slate-800 font-mono">
                  {po.quotationNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Start Date</span>
                <span className="font-medium text-slate-800">{formatDate(po.startDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Expiry Date</span>
                <span className="font-medium text-slate-800">{formatDate(po.expiryDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PO Requester</span>
                <span className="font-semibold text-slate-800">{po.poRequester}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned Workforce</span>
                {po.assignedEmployees && po.assignedEmployees.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {po.assignedEmployees.map((e) => (
                      <span key={e.employeeId} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold">
                        {e.employeeName} ({e.employeeId})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-medium text-slate-400 italic">No employees tagged</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block">GST Rate Applied</span>
                <span className="font-medium text-slate-800">{po.gstRate}%</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                Notes & Conditions
              </span>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                {po.notes || 'No special conditions attached to this PO.'}
              </p>
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Addresses & Contacts
            </h3>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                Billing Address
              </span>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {po.billingAddress}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                Shipping Address
              </span>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {po.shippingAddress}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* 2. DOCUMENTS & SOW CHAIN TAB */}
      {activeTab === 'documents' && (
        <Card className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Document Chain: SOW → PO → Quotation
            </h3>
            <p className="text-xs text-slate-500">
              Centralized document records linked to this purchase order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SOW RECORD */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  01. Statement of Work
                </span>
                <Badge status="Active" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 font-mono">
                {po.sowNumber || 'SOW-HDFC-2025-001'}
              </h4>
              <p className="text-[11px] text-slate-600">
                Primary statement of work governing cloud modernization & microservices.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() =>
                    setPreviewDoc({ name: 'Statement_of_Work_Document.pdf', type: 'sow' })
                  }
                >
                  View SOW
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() =>
                    downloadDocument({
                      filename: 'Statement_of_Work_Document.pdf',
                      documentType: 'sow',
                      po,
                      sowNumber: po.sowNumber,
                    })
                  }
                >
                  Download
                </Button>
              </div>
            </div>

            {/* PO RECORD */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  02. Purchase Order
                </span>
                <Badge status={po.status} />
              </div>
              <h4 className="text-xs font-bold text-indigo-900 font-mono">{po.poNumber}</h4>
              <p className="text-[11px] text-indigo-800">
                Official signed PO document uploaded by PO Admin.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() =>
                    setPreviewDoc({
                      name: po.poDocumentName || `${po.poNumber.replace(/\//g, '_')}.pdf`,
                      type: 'po',
                    })
                  }
                >
                  View PO Document
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() =>
                    downloadDocument({
                      filename: po.poDocumentName || `${po.poNumber.replace(/\//g, '_')}.pdf`,
                      documentType: 'po',
                      po,
                    })
                  }
                >
                  Download
                </Button>
              </div>
            </div>

            {/* QUOTATION RECORD */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  03. Quotation
                </span>
                <Badge status="Approved" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 font-mono">
                {po.quotationNumber || 'QUOT-PS-2025-089'}
              </h4>
              <p className="text-[11px] text-slate-600">
                Commercial quotation approved by client Finance.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() =>
                    setPreviewDoc({ name: 'Commercial_Quotation_Signed.pdf', type: 'quotation' })
                  }
                >
                  View Quotation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() =>
                    downloadDocument({
                      filename: 'Commercial_Quotation_Signed.pdf',
                      documentType: 'quotation',
                      po,
                      quotationNumber: po.quotationNumber,
                    })
                  }
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. INVOICES & BALANCE TAB */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* BALANCE BREAKDOWN STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total PO Commitment (Excl. GST)
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {formatINR(po.amountExclGst)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Incl. GST ({po.gstRate}%): {formatINR(po.amountInclGst)}
              </span>
            </Card>

            <Card className="p-4 border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Invoiced (Excl. GST)
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {formatINR(po.invoicedExclGst)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                {counts.taxInvoiceCount} Invoices Issued
              </span>
            </Card>

            <Card className="p-4 border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Credit Notes (Excl. GST)
              </span>
              <span className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
                + {formatINR(po.creditNotesExclGst)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                {counts.creditNoteCount} Credit Notes (Restores Balance)
              </span>
            </Card>

            <Card className="p-4 bg-indigo-50/60 border-indigo-200">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block mb-1">
                Remaining PO Balance (Excl. GST)
              </span>
              <span className="text-xl font-black font-mono text-indigo-900 tabular-nums">
                {formatINR(po.remainingBalanceExclGst)}
              </span>
              <div className="w-full bg-indigo-200/80 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        ((po.amountExclGst - po.remainingBalanceExclGst) / po.amountExclGst) * 100
                      )
                    )}%`,
                  }}
                ></div>
              </div>
              <span className="text-[10px] text-indigo-700 font-semibold block mt-1">
                {(((po.amountExclGst - po.remainingBalanceExclGst) / po.amountExclGst) * 100).toFixed(1)}% Billed · {((po.remainingBalanceExclGst / po.amountExclGst) * 100).toFixed(1)}% Available
              </span>
            </Card>
          </div>

          {/* INVOICES & CREDIT NOTES DATA TABLE */}
          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Invoices & Credit Notes Master Ledger</h3>
                <p className="text-xs text-slate-500">
                  Calculates remaining balance in real-time. Cancelled invoices do not reduce balance.
                </p>
              </div>
              {permissions.canManageInvoices && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setInvoiceModalOpen(true)}
                >
                  Add Invoice
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Invoice / Credit Note No.</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Assigned Employee(s)</th>
                    <th className="p-3">Dates (Issue / Due)</th>
                    <th className="p-3">Billing Period</th>
                    <th className="p-3 text-right">Excl. GST</th>
                    <th className="p-3 text-right font-mono">GST ({po.gstRate}%)</th>
                    <th className="p-3 text-right font-bold">Total Incl. GST</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Document & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {po.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        No invoices or credit notes issued yet for this PO.
                      </td>
                    </tr>
                  ) : (
                    po.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-900 block">{inv.invoiceNumber}</span>
                          {inv.notes && (
                            <span className="text-[11px] text-slate-500 block max-w-xs truncate">
                              {inv.notes}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {inv.isCreditNote ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Credit Note
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Tax Invoice
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
                        <td className="p-3 text-slate-600">
                          <span className="block font-medium">{formatDate(inv.invoiceDate)}</span>
                          {inv.dueDate && (
                            <span className="text-[10px] text-slate-400 block">Due: {formatDate(inv.dueDate)}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {formatDate(inv.billingPeriodStart)} – {formatDate(inv.billingPeriodEnd)}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                          {formatINR(inv.amountExclGst)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500 tabular-nums">
                          {formatINR(inv.gstAmount || inv.amountExclGst * (inv.gstRate / 100))}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-indigo-900 tabular-nums">
                          {formatINR(inv.totalAmountInclGst || inv.amountExclGst * (1 + inv.gstRate / 100))}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <Badge status={inv.status} />
                            {permissions.canManageInvoices && inv.status !== 'Cancelled' && (
                              <select
                                value={inv.status}
                                onChange={(e) => updateInvoiceStatus(po.id, inv.id, e.target.value as any)}
                                className="text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-700 font-medium cursor-pointer"
                              >
                                <option value="Issued">Issued</option>
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<Eye className="w-3.5 h-3.5" />}
                              onClick={() =>
                                setPreviewDoc({
                                  name: inv.documentName || `${inv.invoiceNumber.replace(/\//g, '_')}.pdf`,
                                  type: 'invoice',
                                  invoice: inv,
                                })
                              }
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<Download className="w-3.5 h-3.5" />}
                              onClick={() =>
                                downloadDocument({
                                  filename: inv.documentName || `${inv.invoiceNumber.replace(/\//g, '_')}.pdf`,
                                  documentType: 'invoice',
                                  po,
                                  invoice: inv,
                                  invoiceNumber: inv.invoiceNumber,
                                  file: inv.fileData,
                                })
                              }
                            >
                              PDF
                            </Button>
                            {inv.status !== 'Cancelled' && permissions.canManageInvoices && (
                              <button
                                onClick={() => cancelInvoice(po.id, inv.id)}
                                className="text-red-600 hover:text-red-800 text-[11px] font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                title="Cancel invoice and restore balance"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 4. ASSIGNED EMPLOYEES TAB */}
      {activeTab === 'employees' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Assigned Workforce to PO</h3>
              <p className="text-xs text-slate-500">
                Employees tagged to this PO for delivery, timesheet allocation & billing.
              </p>
            </div>
            {permissions.canAssignEmployeesToPO && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setAssignModalOpen(true)}
              >
                Tag Employee
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Employee ID</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3 text-right">Billing Rate / Mo</th>
                  <th className="p-3">Assignment Period</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {po.assignedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No employees tagged to this PO yet.
                    </td>
                  </tr>
                ) : (
                  po.assignedEmployees.map((emp) => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{emp.employeeName}</td>
                      <td className="p-3 font-mono text-slate-600">{emp.employeeId}</td>
                      <td className="p-3 text-slate-600">{emp.designation}</td>
                      <td className="p-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                        {formatINR(emp.billingRatePerMonth)}
                      </td>
                      <td className="p-3 text-slate-600">
                        {formatDate(emp.assignedFrom)} – {formatDate(emp.assignedTo)}
                      </td>
                      <td className="p-3 text-right">
                        {permissions.canAssignEmployeesToPO && (
                          <button
                            onClick={() => unassignEmployeeFromPO(po.id, emp.employeeId)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Untag
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. RENEWAL & RELATED POS TAB */}
      {activeTab === 'renewal' && (
        <Card className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">PO Successor & Predecessor Chain</h3>
            <p className="text-xs text-slate-500">
              Preserves audit continuity across PO renewals without overwriting exhausted original records.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            {po.renewedFromPoNumber && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Predecessor PO:</span>
                <span className="font-mono font-bold text-slate-900">{po.renewedFromPoNumber}</span>
                <Badge status="Renewed" />
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-indigo-50/60 rounded-lg border border-indigo-200">
              <span className="text-xs text-indigo-700 font-semibold">Current PO Record:</span>
              <span className="font-mono font-bold text-indigo-900">{po.poNumber}</span>
              <Badge status={po.status} />
              <span className="text-xs text-indigo-800 ml-auto">
                Value: {formatINR(po.amountExclGst)}
              </span>
            </div>

            {po.renewedToPoNumber && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Successor PO:</span>
                <span className="font-mono font-bold text-slate-900">{po.renewedToPoNumber}</span>
                <Badge status="Active" />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 6. AUDIT HISTORY TAB */}
      {activeTab === 'audit' && (
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">PO Activity & Audit Timeline</h3>

          <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 py-2">
            {po.activityLogs.map((log) => (
              <div key={log.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white"></div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700">{log.details}</p>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                    By: {log.userName} ({log.userRole})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODALS */}
      {invoiceModalOpen && (
        <POInvoiceModal
          po={po}
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
        />
      )}

      {renewalModalOpen && (
        <PORenewalModal
          po={po}
          isOpen={renewalModalOpen}
          onClose={() => setRenewalModalOpen(false)}
        />
      )}

      {assignModalOpen && (
        <POEmployeeAssignModal
          po={po}
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
        />
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Document Preview — ${previewDoc.name}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong className="text-slate-900">{previewDoc.name}</strong>
                  {docSource && !docSource.isRealFile && (
                    <span className="ml-2 px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded font-medium border border-amber-200">
                      Generated Vault Statement
                    </span>
                  )}
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() =>
                  downloadDocument({
                    filename: previewDoc.name,
                    documentType: previewDoc.type,
                    po,
                    sowNumber: po.sowNumber,
                    quotationNumber: po.quotationNumber,
                  })
                }
              >
                Download Document
              </Button>
            </div>

            <div className="w-full h-[620px] rounded-xl overflow-hidden shadow-inner">
              {docSource ? (
                <PdfViewer
                  pdfUrl={docSource.url}
                  fileData={docSource.file}
                  title={previewDoc.name}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  Loading document viewer...
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
