import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '25mb' }));

  // Helper to initialize Gemini SDK
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // AI-Assisted PO Reference Extraction Endpoint
  app.post('/api/extract-po-reference', async (req, res) => {
    try {
      const { documentText, base64Data, mimeType, filename } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.status(503).json({
          success: false,
          error: 'AI extraction service unavailable. GEMINI_API_KEY environment variable is not configured.',
          useLocalFallback: true,
        });
      }

      const promptText = `
You are an expert enterprise HRMS and Procurement Data Extraction Assistant for Prime Star Consulting Services.
Analyze the provided Purchase Order / SOW reference document (filename: "${filename || 'PO_Reference'}") and extract project and PO metadata into structured JSON format.

RULES:
1. Extract values strictly present in the text or document image.
2. DO NOT invent or fabricate missing values. If a field is absent, return null.
3. DO NOT confuse PO Number with Project ID.
4. DO NOT treat document creation or sign-off date as Project Start Date unless explicitly stated as the contractual commencement date.
5. Identify any ambiguities (such as multiple PO numbers, conflicting start/end dates, or multiple distinct project scopes) and flag them.
6. All dates must be returned in standard YYYY-MM-DD format.

Extract these fields:
- projectName: Name of the project or scope of work.
- clientName: Name of the client company or buyer organization.
- projectCode: Explicit project ID / code if explicitly mentioned in document; otherwise null.
- poNumber: Client Purchase Order number / reference.
- startDate: Project / PO start or commencement date (YYYY-MM-DD).
- endDate: Project / PO completion or expiry date (YYYY-MM-DD).
- description: Project summary, scope of work, or key deliverables.
- billingAddress: Client billing address.
- shippingAddress: Client service or shipping address.
- amountExclGst: Contractual amount before tax / GST (number).
- gstRate: Applicable GST percentage rate (number, e.g. 18).
- gstAmount: Total GST amount (number).
- totalAmountInclGst: Total contractual amount including GST (number).
- currency: Currency code (e.g. INR, USD, EUR).
- poRequester: PO requester or primary client contact person / email.
- isAmbiguous: boolean true if multiple projects, multiple POs, or conflicting dates/amounts are found.
- ambiguityReasons: array of strings describing any ambiguity or review warnings.
- confidenceScore: number from 0 to 1 indicating overall extraction confidence.
`;

      let contentsPayload: any;

      if (base64Data && mimeType && (mimeType.startsWith('image/') || mimeType === 'application/pdf')) {
        contentsPayload = {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: promptText,
            },
          ],
        };
      } else {
        contentsPayload = `${promptText}\n\nDOCUMENT TEXT CONTENT:\n${documentText || 'No text extracted.'}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contentsPayload,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectName: { type: Type.STRING, description: 'Project name or null if missing' },
              clientName: { type: Type.STRING, description: 'Client company name or null if missing' },
              projectCode: { type: Type.STRING, description: 'Explicit project code or null' },
              poNumber: { type: Type.STRING, description: 'Client Purchase Order number' },
              startDate: { type: Type.STRING, description: 'Start date in YYYY-MM-DD format or null' },
              endDate: { type: Type.STRING, description: 'End/expiry date in YYYY-MM-DD format or null' },
              description: { type: Type.STRING, description: 'Project summary, scope, or deliverables' },
              billingAddress: { type: Type.STRING, description: 'Client billing address' },
              shippingAddress: { type: Type.STRING, description: 'Client shipping address' },
              amountExclGst: { type: Type.NUMBER, description: 'Amount before GST' },
              gstRate: { type: Type.NUMBER, description: 'GST rate percentage' },
              gstAmount: { type: Type.NUMBER, description: 'GST tax amount' },
              totalAmountInclGst: { type: Type.NUMBER, description: 'Total amount including GST' },
              currency: { type: Type.STRING, description: 'Currency code e.g. INR' },
              poRequester: { type: Type.STRING, description: 'PO requester or client contact' },
              isAmbiguous: { type: Type.BOOLEAN, description: 'True if conflicting dates or multiple POs detected' },
              ambiguityReasons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of review warnings',
              },
              confidenceScore: { type: Type.NUMBER, description: 'Extraction confidence 0 to 1' },
            },
          },
        },
      });

      let jsonStr = response.text?.trim() || '{}';
      const extractedData = JSON.parse(jsonStr);

      return res.json({
        success: true,
        extractedData,
        source: 'gemini-3.8-flash',
      });
    } catch (err: any) {
      console.error('Error in /api/extract-po-reference:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to extract structured data from document.',
        useLocalFallback: true,
      });
    }
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
