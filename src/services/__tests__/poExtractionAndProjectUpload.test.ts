import { describe, it, expect } from 'vitest';
import {
  validatePOFile,
  extractDataFromText,
  normalizeDateStr,
} from '../../lib/poExtractionUtils';

describe('Upload PO Reference & Document Extraction Utilities', () => {
  describe('1. File Validation (validatePOFile)', () => {
    it('should validate supported file formats (PDF, Excel, CSV, Word, Images, Text)', () => {
      const validPdf = new File(['dummy content'], 'Client_PO_Reference.pdf', { type: 'application/pdf' });
      const validXlsx = new File(['dummy content'], 'HDFC_PO_2025.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const validCsv = new File(['dummy content'], 'PO_Data.csv', { type: 'text/csv' });
      const validDocx = new File(['dummy content'], 'SOW_Agreement.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      expect(validatePOFile(validPdf).isValid).toBe(true);
      expect(validatePOFile(validXlsx).isValid).toBe(true);
      expect(validatePOFile(validCsv).isValid).toBe(true);
      expect(validatePOFile(validDocx).isValid).toBe(true);
    });

    it('should reject unsupported file extensions', () => {
      const invalidExe = new File(['dummy'], 'malicious.exe', { type: 'application/x-msdownload' });
      const res = validatePOFile(invalidExe);

      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Unsupported file format ".exe"');
    });

    it('should reject files exceeding 10 MB size limit', () => {
      const hugeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'Large_PO_Scan.pdf', { type: 'application/pdf' });
      const res = validatePOFile(hugeFile);

      expect(res.isValid).toBe(false);
      expect(res.error).toContain('exceeds maximum allowed limit of 10 MB');
    });
  });

  describe('2. Date Normalization (normalizeDateStr)', () => {
    it('should normalize various date formats to YYYY-MM-DD', () => {
      expect(normalizeDateStr('2026-10-15')).toBe('2026-10-15');
      expect(normalizeDateStr('15/10/2026')).toBe('2026-10-15');
      expect(normalizeDateStr('01-04-2025')).toBe('2025-04-01');
      expect(normalizeDateStr('October 15, 2026')).toBe('2026-10-15');
    });
  });

  describe('3. Text Pattern Extraction (extractDataFromText)', () => {
    it('should extract Project Name, Client, PO Number, Dates, and Amounts from plain text', () => {
      const samplePoText = `
Purchase Order Reference
PO Ref: PO/2026/HDFC/8849
Project Name: Core Banking API Modernization
Client Name: HDFC Bank Ltd
Project ID: PRJ-9921
Start Date: 2026-04-01
End Date: 2027-03-31
PO Amount: ₹ 75,00,000
GST Rate: 18%
Description: Development and deployment of cloud-native REST APIs for mobile banking.
      `;

      const extracted = extractDataFromText(samplePoText);

      expect(extracted.poNumber).toBe('PO/2026/HDFC/8849');
      expect(extracted.projectName).toBe('Core Banking API Modernization');
      expect(extracted.clientName).toBe('HDFC Bank Ltd');
      expect(extracted.projectCode).toBe('PRJ-9921');
      expect(extracted.startDate).toBe('2026-04-01');
      expect(extracted.endDate).toBe('2027-03-31');
      expect(extracted.amountExclGst).toBe(7500000);
      expect(extracted.gstRate).toBe(18);
      expect(extracted.gstAmount).toBe(1350000);
      expect(extracted.totalAmountInclGst).toBe(8850000);
      expect(extracted.description).toContain('Development and deployment');
    });

    it('should detect ambiguous data such as multiple PO numbers or invalid date order', () => {
      const ambiguousText = `
PO #: PO-1001
Reference PO #: PO-1002
Start Date: 2027-05-01
End Date: 2026-05-01
      `;

      const extracted = extractDataFromText(ambiguousText);

      expect(extracted.isAmbiguous).toBe(true);
      expect(extracted.ambiguityReasons.length).toBeGreaterThan(0);
    });
  });
});
