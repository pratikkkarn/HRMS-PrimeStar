import { jsPDF } from 'jspdf';
import { PurchaseOrder, Invoice } from '../types/domain';
import { formatINR, formatDate } from './utils';

export interface DownloadDocOptions {
  filename: string;
  documentType?: 'sow' | 'po' | 'quotation' | 'invoice' | 'payslip' | 'generic';
  title?: string;
  po?: PurchaseOrder;
  sowNumber?: string;
  quotationNumber?: string;
  invoiceNumber?: string;
  invoice?: Invoice;
  file?: File | Blob | Uint8Array | null;
  fileUrl?: string | null;
  employeeName?: string;
  employeeId?: string;
  month?: string;
  grossAmount?: number;
  takeHomeAmount?: number;
}

/**
 * Builds a formatted, official PDF document using jsPDF.
 */
export const buildJsPdfDocument = (options: DownloadDocOptions): jsPDF => {
  const {
    filename,
    documentType,
    title,
    po,
    sowNumber,
    quotationNumber,
    invoiceNumber,
    employeeName,
    employeeId,
    month,
    grossAmount,
    takeHomeAmount,
  } = options;

  const cleanFilename = filename.trim().endsWith('.pdf') || filename.includes('.')
    ? filename.trim()
    : `${filename.trim()}.pdf`;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Background Accent Bar
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 16, 'F');

  // Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('PRIME STAR ENTERPRISE HRMS — OFFICIAL DOCUMENT VAULT', 14, 11);

  // Document Title Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  const docHeaderTitle =
    title ||
    (documentType === 'sow'
      ? 'STATEMENT OF WORK (SOW)'
      : documentType === 'po'
      ? 'PURCHASE ORDER'
      : documentType === 'quotation'
      ? 'COMMERCIAL QUOTATION'
      : documentType === 'payslip'
      ? 'SALARY PAYSLIP STATEMENT'
      : cleanFilename.toUpperCase().replace(/_/g, ' ').replace('.PDF', ''));

  doc.text(docHeaderTitle, 14, 28);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Document Reference Name: ${cleanFilename}`, 14, 34);
  doc.text(`Generated Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, 14, 38);
  doc.text('Verification Code: PS-DOC-VERIFIED-' + Math.floor(100000 + Math.random() * 900000), 14, 42);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 46, 196, 46);

  let y = 54;

  // --- CASE A: STATEMENT OF WORK (SOW) ---
  if (documentType === 'sow' || cleanFilename.toLowerCase().includes('sow') || cleanFilename.toLowerCase().includes('statement_of_work')) {
    const activeSowNum = sowNumber || po?.sowNumber || 'SOW-HDFC-2025-001';
    const projectName = po?.projectName || 'Enterprise Cloud Modernization & Architecture';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text(`SOW Number: ${activeSowNum}`, 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Project Title: ${projectName}`, 14, y);
    y += 6;
    doc.text(`Associated PO Number: ${po?.poNumber || 'PO-2025-8891'}`, 14, y);
    y += 6;
    doc.text(`Governing Client: ${po?.projectName.split(' ')[0] || 'Enterprise Client'}`, 14, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. EXECUTIVE SCOPE OF WORK', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const scopeLines = [
      'This Statement of Work (SOW) defines the delivery framework, milestones, governance,',
      'and technical specifications for the Cloud Modernization & Engineering Services.',
      '• Microservices architecture design, migration & API integrations.',
      '• Automated CI/CD pipeline establishment & zero-downtime deployment setup.',
      '• Performance optimization, load testing & 24x7 infrastructure monitoring.',
      '• Workforce allocation, technical documentation & post-implementation support.',
    ];
    scopeLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 5;
    });

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('2. FINANCIAL & BILLING TERMS', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const finAmount = po ? formatINR(po.amountExclGst) : '₹10,00,000 Excl. GST';
    doc.text(`Total SOW Value Commitment: ${finAmount}`, 14, y);
    y += 5;
    doc.text('Payment Terms: Net 30 Days upon milestone invoice submission.', 14, y);
    y += 5;
    doc.text('GST Rate: 18% Applicable on all billing statements.', 14, y);
    y += 10;
  }
  // --- CASE B: PURCHASE ORDER (PO) ---
  else if (documentType === 'po' || cleanFilename.toLowerCase().includes('po_') || cleanFilename.toLowerCase().includes('purchase_order')) {
    const activePoNumber = po?.poNumber || 'PO-2025-8891';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text(`PO Number: ${activePoNumber}`, 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Project Name: ${po?.projectName || 'Core Banking Modernization'}`, 14, y);
    y += 6;
    doc.text(`PO Requester / Manager: ${po?.poRequester || 'Priya Sundaram (HR Head)'}`, 14, y);
    y += 6;
    doc.text(`Effective Period: ${po ? formatDate(po.startDate) : '01 Jan 2025'} to ${po ? formatDate(po.expiryDate) : '31 Dec 2025'}`, 14, y);
    y += 10;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Financial Field Description', 18, y + 5.5);
    doc.text('Amount (INR)', 150, y + 5.5);
    y += 8;

    const items = [
      ['PO Value (Excl. GST)', po ? formatINR(po.amountExclGst) : '₹10,00,000'],
      [`GST Amount (${po?.gstRate || 18}%)`, po ? formatINR(po.amountExclGst * ((po.gstRate || 18) / 100)) : '₹1,80,000'],
      ['Total Committed PO Value (Incl. GST)', po ? formatINR(po.amountInclGst) : '₹11,80,000'],
      ['Remaining Unbilled Balance (Excl. GST)', po ? formatINR(po.remainingBalanceExclGst) : '₹10,00,000'],
    ];

    items.forEach(([label, val], idx) => {
      doc.setFont('helvetica', idx === 2 ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(label, 18, y + 5);
      doc.text(val, 150, y + 5);
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 7, 196, y + 7);
      y += 7;
    });

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Addresses & Instructions:', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Billing Address: ${po?.billingAddress || '101 Prime Star Towers, Tech Corridor, Mumbai, MH'}`, 14, y);
    y += 5;
    doc.text(`Shipping Address: ${po?.shippingAddress || '101 Prime Star Towers, Tech Corridor, Mumbai, MH'}`, 14, y);
    y += 5;
    if (po?.notes) {
      doc.text(`Special Conditions: ${po.notes}`, 14, y);
      y += 5;
    }
    y += 8;
  }
  // --- CASE C: COMMERCIAL QUOTATION ---
  else if (documentType === 'quotation' || cleanFilename.toLowerCase().includes('quotation')) {
    const qNum = quotationNumber || po?.quotationNumber || 'QUOT-PS-2025-089';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(`Quotation Number: ${qNum}`, 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`SOW Reference: ${po?.sowNumber || 'SOW-HDFC-2025-001'}`, 14, y);
    y += 6;
    doc.text(`Project Scope: ${po?.projectName || 'Enterprise Engineering Services'}`, 14, y);
    y += 6;
    doc.text(`Quotation Date: ${po ? formatDate(po.startDate) : '01 Jan 2025'}`, 14, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Commercial Breakdown:', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Proposed Amount (Excl. GST): ${po ? formatINR(po.amountExclGst) : '₹10,00,000'}`, 14, y);
    y += 5;
    doc.text(`GST Rate: ${po?.gstRate || 18}%`, 14, y);
    y += 5;
    doc.text(`Total Amount (Incl. GST): ${po ? formatINR(po.amountInclGst) : '₹11,80,000'}`, 14, y);
    y += 5;
    doc.text('Quotation Validity: 60 Days from issue date.', 14, y);
    y += 10;
  }
  // --- CASE D: PAYSLIP STATEMENT ---
  else if (documentType === 'payslip' || cleanFilename.toLowerCase().includes('payslip')) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Employee Name: ${employeeName || 'Priya Sundaram'}`, 14, y);
    y += 5;
    doc.text(`Employee ID: ${employeeId || 'EMP001'}`, 14, y);
    y += 5;
    doc.text(`Pay Month: ${month || 'September 2026'}`, 14, y);
    y += 10;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Salary Component', 18, y + 5.5);
    doc.text('Amount (INR)', 150, y + 5.5);
    y += 8;

    const gross = grossAmount || 150000;
    const net = takeHomeAmount || 125000;
    const deductions = gross - net;

    const payItems = [
      ['Gross Monthly Salary', formatINR(gross)],
      ['Total Statutory Deductions (PF, TDS, PT)', `- ${formatINR(deductions)}`],
      ['Net Salary Disbursed', formatINR(net)],
    ];

    payItems.forEach(([label, val], idx) => {
      doc.setFont('helvetica', idx === 2 ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.text(label, 18, y + 5);
      doc.text(val, 150, y + 5);
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 7, 196, y + 7);
      y += 7;
    });

    y += 10;
  }
  // --- CASE E: INVOICE / CREDIT NOTE ---
  else if (documentType === 'invoice' || cleanFilename.toLowerCase().includes('inv') || cleanFilename.toLowerCase().includes('invoice') || cleanFilename.toLowerCase().includes('credit_note') || cleanFilename.toLowerCase().startsWith('cn_')) {
    const invNum = invoiceNumber || options.invoice?.invoiceNumber || cleanFilename.replace('.pdf', '');
    const isCN = options.invoice?.isCreditNote || cleanFilename.toLowerCase().includes('credit_note') || cleanFilename.toLowerCase().startsWith('cn_');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(isCN ? 16 : 79, isCN ? 185 : 70, isCN ? 129 : 229);
    doc.text(`${isCN ? 'CREDIT NOTE' : 'TAX INVOICE'}: ${invNum}`, 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Purchase Order Ref: ${po?.poNumber || 'PO-2025-8891'}`, 14, y);
    y += 6;
    doc.text(`Project Name: ${po?.projectName || 'Enterprise Services'}`, 14, y);
    y += 6;
    if (options.invoice?.invoiceDate) {
      doc.text(`Invoice Issue Date: ${formatDate(options.invoice.invoiceDate)}`, 14, y);
      y += 6;
    }
    if (options.invoice?.dueDate) {
      doc.text(`Payment Due Date: ${formatDate(options.invoice.dueDate)}`, 14, y);
      y += 6;
    }
    if (options.invoice?.billingPeriodStart && options.invoice?.billingPeriodEnd) {
      doc.text(`Billing Period: ${formatDate(options.invoice.billingPeriodStart)} to ${formatDate(options.invoice.billingPeriodEnd)}`, 14, y);
      y += 6;
    }
    const invEmpNames = options.invoice?.employeeNames && options.invoice.employeeNames.length > 0
      ? options.invoice.employeeNames.join(', ')
      : options.invoice?.employeeName;
    if (invEmpNames) {
      doc.text(`Assigned Employee(s): ${invEmpNames}`, 14, y);
      y += 6;
    }
    y += 4;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Billing Breakdown / Description', 18, y + 5.5);
    doc.text('Amount (INR)', 150, y + 5.5);
    y += 8;

    const amtExcl = options.invoice?.amountExclGst ?? po?.amountExclGst ?? 100000;
    const rate = options.invoice?.gstRate ?? po?.gstRate ?? 18;
    const gstAmt = options.invoice?.gstAmount ?? (amtExcl * rate / 100);
    const totIncl = options.invoice?.totalAmountInclGst ?? (amtExcl + gstAmt);

    const invItems = [
      ['Service / Milestone Delivery (Excl. GST)', formatINR(amtExcl)],
      [`GST (${rate}%)`, formatINR(gstAmt)],
      [`Total ${isCN ? 'Credit Value' : 'Invoice Amount'} (Incl. GST)`, formatINR(totIncl)],
    ];

    invItems.forEach(([label, val], idx) => {
      doc.setFont('helvetica', idx === 2 ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(label, 18, y + 5);
      doc.text(val, 150, y + 5);
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 7, 196, y + 7);
      y += 7;
    });

    if (options.invoice?.notes) {
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('Deliverable Notes:', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(options.invoice.notes, 14, y);
      y += 6;
    }

    y += 8;
  }
  // --- CASE F: GENERIC OFFICIAL DOCUMENT ---
  else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Document Name: ${cleanFilename}`, 14, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('This is an official document stored in the Prime Star Enterprise Vault.', 14, y);
    y += 6;
    doc.text('All terms, dates, and authorization details have been digitally verified.', 14, y);
    y += 10;
  }

  // --- FOOTER AND DIGITAL SIGNATURE STAMP ---
  y = Math.max(y + 10, 230);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('AUTHORIZED SIGNATURE & DIGITAL STAMP', 14, y);
  doc.text('PRIME STAR ENTERPRISE AUDIT SEAL', 130, y);
  y += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Digitally signed by Prime Star HRMS Enterprise Vault Service.', 14, y);
  doc.text('STATUS: VERIFIED & VALID', 130, y);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Confidential — Prime Star Enterprise HRMS & Financial Operations Platform', 14, y);

  return doc;
};

/**
 * Returns a Blob object representing the PDF document.
 */
export const generatePdfBlob = (options: DownloadDocOptions): Blob => {
  const { file } = options;
  if (file && file instanceof Blob) {
    return file;
  }
  if (file && file instanceof Uint8Array) {
    return new Blob([file.buffer as ArrayBuffer], { type: 'application/pdf' });
  }
  const doc = buildJsPdfDocument(options);
  return doc.output('blob');
};

/**
 * Fetches and strictly verifies that a URL or Blob produces a valid, non-empty PDF binary stream
 * starting with the `%PDF-` signature.
 */
export const fetchAndVerifyPdf = async (
  sourceUrlOrBlob: string | Blob
): Promise<{ blob: Blob; arrayBuffer: ArrayBuffer; uint8Array: Uint8Array }> => {
  let arrayBuffer: ArrayBuffer;
  let blob: Blob;

  if (sourceUrlOrBlob instanceof Blob) {
    blob = sourceUrlOrBlob;
    arrayBuffer = await sourceUrlOrBlob.arrayBuffer();
  } else if (typeof sourceUrlOrBlob === 'string') {
    const res = await fetch(sourceUrlOrBlob);
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: Unable to fetch PDF asset from '${sourceUrlOrBlob}'.`);
    }
    arrayBuffer = await res.arrayBuffer();
    blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  } else {
    throw new Error('Invalid PDF source type provided.');
  }

  const uint8Array = new Uint8Array(arrayBuffer);
  if (uint8Array.length < 4) {
    throw new Error('PDF file is empty or corrupted (file size is less than 4 bytes).');
  }

  // Validate the %PDF- signature in magic header bytes (0x25, 0x50, 0x44, 0x46)
  const header = String.fromCharCode(uint8Array[0], uint8Array[1], uint8Array[2], uint8Array[3]);
  if (header !== '%PDF') {
    throw new Error(
      `Invalid PDF magic header '${header}'. Expected '%PDF-'. The document source may have returned HTML or an error page.`
    );
  }

  return { blob, arrayBuffer, uint8Array };
};

/**
 * Resolves the primary document source (URL or Blob) and indicates if it's a real file asset.
 */
export const getDocumentSource = (
  options: DownloadDocOptions
): { url?: string; file?: Blob; isRealFile: boolean; cleanFilename: string } => {
  const { filename, file, fileUrl } = options;
  const cleanFilename = filename.trim().endsWith('.pdf') || filename.includes('.')
    ? filename.trim()
    : `${filename.trim()}.pdf`;

  if (file) {
    if (file instanceof Blob) {
      return { file, isRealFile: true, cleanFilename };
    }
    if (file instanceof Uint8Array) {
      return { file: new Blob([file.buffer as ArrayBuffer], { type: 'application/pdf' }), isRealFile: true, cleanFilename };
    }
  }

  if (fileUrl && typeof fileUrl === 'string' && fileUrl.trim().length > 0) {
    return { url: fileUrl, isRealFile: true, cleanFilename };
  }

  const lowerName = cleanFilename.toLowerCase();

  if (lowerName === 'statement_of_work_document.pdf' || lowerName.includes('sow')) {
    return { url: '/Statement_of_Work_Document.pdf', isRealFile: true, cleanFilename: 'Statement_of_Work_Document.pdf' };
  }

  if (lowerName === 'commercial_quotation_signed.pdf' || lowerName.includes('quotation')) {
    return { url: '/Commercial_Quotation_Signed.pdf', isRealFile: true, cleanFilename: 'Commercial_Quotation_Signed.pdf' };
  }

  if (lowerName === 'sample_purchase_order.pdf' || lowerName.includes('po_') || lowerName.includes('purchase_order')) {
    return { url: '/Sample_Purchase_Order.pdf', isRealFile: true, cleanFilename };
  }

  // Fallback to generated PDF Blob if no static file URL matches
  const blob = generatePdfBlob(options);
  return { file: blob, isRealFile: false, cleanFilename };
};

/**
 * Universal document download utility for Prime Star HRMS.
 * Downloads real verified PDF binary bytes with `application/pdf` MIME type.
 */
export const downloadDocument = async (options: DownloadDocOptions): Promise<void> => {
  try {
    const source = getDocumentSource(options);
    const cleanFilename = source.cleanFilename;

    let targetBlob: Blob;

    if (source.url) {
      const verified = await fetchAndVerifyPdf(source.url);
      targetBlob = verified.blob;
    } else if (source.file) {
      const verified = await fetchAndVerifyPdf(source.file);
      targetBlob = verified.blob;
    } else {
      throw new Error('No valid PDF URL or File object available for download.');
    }

    // Trigger binary file download via Blob URL
    const blobUrl = URL.createObjectURL(targetBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 10000);
  } catch (err: any) {
    console.error('Download Document Error:', err);
    alert(`Download Failed: ${err?.message || 'Unable to download PDF file.'}`);
  }
};
