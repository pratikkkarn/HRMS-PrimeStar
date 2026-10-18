import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker URL for browser environment
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ExtractedPOData {
  projectName?: string | null;
  clientName?: string | null;
  projectCode?: string | null;
  poNumber?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  amountExclGst?: number | null;
  gstRate?: number | null;
  gstAmount?: number | null;
  totalAmountInclGst?: number | null;
  currency?: string | null;
  poRequester?: string | null;
  isAmbiguous?: boolean;
  ambiguityReasons?: string[];
  confidenceScore?: number;
  extractionMethod?: 'ai' | 'local';
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  formatLabel: string;
  extension: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const SUPPORTED_EXTENSIONS_MAP: Record<string, string> = {
  pdf: 'PDF Document',
  xls: 'Excel 97-2003 Workbook',
  xlsx: 'Excel Workbook',
  xlsm: 'Excel Macro-Enabled Workbook (Macros Disabled)',
  csv: 'Comma Separated Values',
  doc: 'Word Document',
  docx: 'Word Document (OpenXML)',
  txt: 'Plain Text File',
  png: 'PNG Image',
  jpg: 'JPEG Image',
  jpeg: 'JPEG Image',
};

/**
 * Validates uploaded file extension, size, and MIME type.
 */
export function validatePOFile(file: File): FileValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file selected.', formatLabel: 'Unknown', extension: '' };
  }

  const nameParts = file.name.split('.');
  const extension = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : '';

  if (!extension || !SUPPORTED_EXTENSIONS_MAP[extension]) {
    return {
      isValid: false,
      error: `Unsupported file format ".${extension}". Supported formats: PDF, XLSX, XLS, XLSM, CSV, DOC, DOCX, TXT, PNG, JPG.`,
      formatLabel: 'Unsupported',
      extension,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 10 MB.`,
      formatLabel: SUPPORTED_EXTENSIONS_MAP[extension],
      extension,
    };
  }

  return {
    isValid: true,
    formatLabel: SUPPORTED_EXTENSIONS_MAP[extension],
    extension,
  };
}

/**
 * Normalizes dates into standard YYYY-MM-DD format.
 */
export function normalizeDateStr(rawDate: string): string | null {
  if (!rawDate) return null;
  const clean = rawDate.trim().replace(/,/g, '');

  // 1. Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // 2. Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = String(dmyMatch[1]).padStart(2, '0');
    const month = String(dmyMatch[2]).padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 3. Try standard JS Date parsing (e.g., "October 15, 2026" or "15 Oct 2026")
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

/**
 * Deterministic local pattern extractor for document plain text.
 */
export function extractDataFromText(text: string): ExtractedPOData {
  if (!text || text.trim().length === 0) {
    return {
      projectName: null,
      clientName: null,
      projectCode: null,
      poNumber: null,
      startDate: null,
      endDate: null,
      description: null,
      billingAddress: null,
      shippingAddress: null,
      amountExclGst: null,
      gstRate: 18,
      gstAmount: null,
      totalAmountInclGst: null,
      currency: 'INR',
      poRequester: null,
      isAmbiguous: false,
      ambiguityReasons: [],
      confidenceScore: 0,
      extractionMethod: 'local',
    };
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const ambiguityReasons: string[] = [];

  // 1. PO Number Extraction
  const poMatches = text.match(/(?:PO Ref|PO #|PO Number|Purchase Order No|Purchase Order #|Ref No|PO)[\s:#\-\/]*([A-Z0-9\/\-]{4,30})/gi) || [];
  const uniquePoNumbers = Array.from(
    new Set(
      poMatches
        .map((m) => m.replace(/(?:PO Ref|PO #|PO Number|Purchase Order No|Purchase Order #|Ref No|PO|Purchase Order)[\s:#\-\/]*/i, '').trim())
        .filter((val) => val.length >= 3 && /\d/.test(val) && !/^(Date|Number|No|Name|Reference|Document|Details|Order|Header|Notice|Summary)$/i.test(val))
    )
  );

  let poNumber: string | null = uniquePoNumbers[0] || null;
  if (uniquePoNumbers.length > 1) {
    ambiguityReasons.push(`Multiple PO numbers detected (${uniquePoNumbers.slice(0, 3).join(', ')})`);
  }

  // 2. Project Name Extraction
  let projectName: string | null = null;
  const projNameMatch = text.match(/(?:Project Name|Project Title|Scope of Work|Project|Subject)[\s:]+([^\n\r]{3,80})/i);
  if (projNameMatch) {
    projectName = projNameMatch[1].trim();
  }

  // 3. Client Name Extraction
  let clientName: string | null = null;
  const clientMatch = text.match(/(?:Client Company|Client Name|Billed To|Bill To|Customer|Client)[\s:]+([^\n\r]{3,80})/i);
  if (clientMatch) {
    clientName = clientMatch[1].replace(/^(Name|Address|Inc|Ltd)?[:\s]*/i, '').trim();
  }

  // 4. Project ID / Code Extraction (Explicit only)
  let projectCode: string | null = null;
  const codeMatch = text.match(/(?:Project ID|Project Code|PRJ Code|Code)[\s:]+([A-Z0-9\-\/]{3,20})/i);
  if (codeMatch) {
    projectCode = codeMatch[1].trim();
  }

  // 5. Dates Extraction
  let startDate: string | null = null;
  let endDate: string | null = null;

  const startMatch = text.match(/(?:Start Date|Commencement Date|Effective Date|PO Start Date|Valid From)[\s:]+([0-9A-Za-z\/\-\s,]{6,25})/i);
  if (startMatch) {
    startDate = normalizeDateStr(startMatch[1]);
  }

  const endMatch = text.match(/(?:End Date|Expiry Date|Completion Date|Valid Until|PO Expiry Date)[\s:]+([0-9A-Za-z\/\-\s,]{6,25})/i);
  if (endMatch) {
    endDate = normalizeDateStr(endMatch[1]);
  }

  // If start or end date missing, look for generic dates
  if (!startDate || !endDate) {
    const allDates = text.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|[A-Z][a-z]+\s+\d{1,2},\s+\d{4})\b/g) || [];
    const normalizedAll = Array.from(new Set(allDates.map(normalizeDateStr).filter(Boolean) as string[]));
    if (normalizedAll.length >= 2) {
      normalizedAll.sort();
      if (!startDate) startDate = normalizedAll[0];
      if (!endDate) endDate = normalizedAll[normalizedAll.length - 1];
    }
  }

  if (startDate && endDate && startDate > endDate) {
    ambiguityReasons.push(`Extracted start date (${startDate}) is later than end date (${endDate}). Please review.`);
  }

  // 6. Financial Amounts Extraction
  let amountExclGst: number | null = null;
  let gstRate: number | null = 18;
  let gstAmount: number | null = null;
  let totalAmountInclGst: number | null = null;

  const amountExclMatch = text.match(/(?:PO Amount|Amount Excl GST|Subtotal|Net Value|Base Amount)[\s:₹$]*([0-9,]+(?:\.\d{1,2})?)/i);
  if (amountExclMatch) {
    const num = parseFloat(amountExclMatch[1].replace(/,/g, ''));
    if (!isNaN(num) && num > 0) amountExclGst = num;
  }

  const gstRateMatch = text.match(/(?:GST Rate|GST @|GST)[\s:]*(\d{1,2})%/i);
  if (gstRateMatch) {
    const r = parseFloat(gstRateMatch[1]);
    if (!isNaN(r)) gstRate = r;
  }

  const gstAmtMatch = text.match(/(?:GST Amount|Tax Amount|CGST\+SGST)[\s:₹$]*([0-9,]+(?:\.\d{1,2})?)/i);
  if (gstAmtMatch) {
    const num = parseFloat(gstAmtMatch[1].replace(/,/g, ''));
    if (!isNaN(num) && num > 0) gstAmount = num;
  }

  const totalMatch = text.match(/(?:Total Amount|Total Incl GST|Grand Total|Net Payable)[\s:₹$]*([0-9,]+(?:\.\d{1,2})?)/i);
  if (totalMatch) {
    const num = parseFloat(totalMatch[1].replace(/,/g, ''));
    if (!isNaN(num) && num > 0) totalAmountInclGst = num;
  }

  // Calculate missing financial components if 2 of 3 present
  if (amountExclGst && gstRate && !gstAmount) {
    gstAmount = Math.round(amountExclGst * (gstRate / 100));
  }
  if (amountExclGst && gstAmount && !totalAmountInclGst) {
    totalAmountInclGst = amountExclGst + gstAmount;
  }
  if (totalAmountInclGst && !amountExclGst && gstRate) {
    amountExclGst = Math.round(totalAmountInclGst / (1 + gstRate / 100));
    gstAmount = totalAmountInclGst - amountExclGst;
  }

  // Currency
  let currency = 'INR';
  if (/USD|\$|Dollars/i.test(text)) currency = 'USD';
  else if (/EUR|€|Euros/i.test(text)) currency = 'EUR';
  else if (/GBP|£/i.test(text)) currency = 'GBP';

  // 7. PO Requester
  let poRequester: string | null = null;
  const requesterMatch = text.match(/(?:PO Requester|Requested By|Contact Person|Buyer Contact)[\s:]+([^\n\r]{3,60})/i);
  if (requesterMatch) {
    poRequester = requesterMatch[1].trim();
  }

  // 8. Addresses
  let billingAddress: string | null = null;
  const billAddrMatch = text.match(/(?:Billing Address|Billed To)[\s:]+([^\n\r]+(?:\n[^\n\r]+){0,2})/i);
  if (billAddrMatch) {
    billingAddress = billAddrMatch[1].trim();
  }

  let shippingAddress: string | null = null;
  const shipAddrMatch = text.match(/(?:Shipping Address|Service Address|Site Address)[\s:]+([^\n\r]+(?:\n[^\n\r]+){0,2})/i);
  if (shipAddrMatch) {
    shippingAddress = shipAddrMatch[1].trim();
  }

  // 9. Description / Scope
  let description: string | null = null;
  const descMatch = text.match(/(?:Description|Scope of Work|Deliverables|Overview)[\s:]+([^\n\r]+(?:\n[^\n\r]+){0,3})/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  const confidenceScore = (projectName ? 0.3 : 0) + (clientName ? 0.3 : 0) + (poNumber ? 0.2 : 0) + (amountExclGst ? 0.2 : 0);

  return {
    projectName,
    clientName,
    projectCode,
    poNumber,
    startDate,
    endDate,
    description,
    billingAddress,
    shippingAddress,
    amountExclGst,
    gstRate,
    gstAmount,
    totalAmountInclGst,
    currency,
    poRequester,
    isAmbiguous: ambiguityReasons.length > 0,
    ambiguityReasons,
    confidenceScore: Math.min(1, confidenceScore),
    extractionMethod: 'local',
  };
}

/**
 * Parses XLSX / XLS / XLSM / CSV array buffer using SheetJS.
 * XLSM files are read as pure data worksheets (macros are never executed).
 */
export async function extractFromExcel(file: File): Promise<{ text: string; data: ExtractedPOData }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  let fullText = '';
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
      const csv = XLSX.utils.sheet_to_csv(sheet);
      fullText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
    }
  });

  const extracted = extractDataFromText(fullText);
  return { text: fullText, data: extracted };
}

/**
 * Parses PDF ArrayBuffer text content using PDF.js.
 */
export async function extractFromPdf(file: File): Promise<{ text: string; data: ExtractedPOData }> {
  const buffer = await file.arrayBuffer();
  let fullText = '';

  try {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdfDoc = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
    }
  } catch (err) {
    console.warn('PDF.js client extraction warning:', err);
  }

  const extracted = extractDataFromText(fullText);
  return { text: fullText, data: extracted };
}

/**
 * Main dispatcher to parse file and attempt server AI extraction with local fallback.
 */
export async function processPOReferenceFile(file: File): Promise<{
  data: ExtractedPOData;
  rawText: string;
  source: 'ai' | 'local';
}> {
  const val = validatePOFile(file);
  if (!val.isValid) {
    throw new Error(val.error || 'Invalid file format');
  }

  const ext = val.extension;
  let rawText = '';
  let localExtracted: ExtractedPOData = { extractionMethod: 'local' };

  // 1. Read document locally based on format
  if (ext === 'csv' || ext === 'txt') {
    rawText = await file.text();
    localExtracted = extractDataFromText(rawText);
  } else if (ext === 'xls' || ext === 'xlsx' || ext === 'xlsm') {
    const result = await extractFromExcel(file);
    rawText = result.text;
    localExtracted = result.data;
  } else if (ext === 'pdf') {
    const result = await extractFromPdf(file);
    rawText = result.text;
    localExtracted = result.data;
  } else if (ext === 'docx' || ext === 'doc') {
    rawText = await file.text().catch(() => '');
    localExtracted = extractDataFromText(rawText);
  }

  // 2. Attempt AI-Assisted Server Extraction via /api/extract-po-reference
  try {
    let base64Data: string | undefined = undefined;
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'pdf') {
      const buffer = await file.arrayBuffer();
      base64Data = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
    }

    const mimeType = file.type || (ext === 'pdf' ? 'application/pdf' : 'application/octet-stream');

    const res = await fetch('/api/extract-po-reference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentText: rawText,
        base64Data,
        mimeType,
        filename: file.name,
      }),
    });

    if (res.ok) {
      const resData = await res.json();
      if (resData.success && resData.extractedData) {
        return {
          data: {
            ...resData.extractedData,
            extractionMethod: 'ai',
          },
          rawText,
          source: 'ai',
        };
      }
    }
  } catch (e) {
    console.info('Server AI extraction unavailable, utilizing working local extraction path:', e);
  }

  // Return working local extraction path
  return {
    data: localExtracted,
    rawText,
    source: 'local',
  };
}
