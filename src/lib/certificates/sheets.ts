// ============================================================
// Certificate Google Sheets CRUD
// ============================================================
// Manages the "Certificates" tab in the existing Google Sheet.
// Uses the same auth infrastructure from @/lib/google.
// ============================================================

import { google } from 'googleapis';
import type { CertificateRecord, CertificateStatus } from '@/types/certificate';

const CERT_SHEET_TAB = 'Certificates';
const certRange = (a1: string) => `${CERT_SHEET_TAB}!${a1}`;

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

// ── Auth (reuse logic from @/lib/google) ─────────────────────

async function getAuthClient() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
      return await auth.getClient();
    } catch (err: any) {
      console.warn(`[Cert Sheets] Service Account auth failed: ${err.message}`);
    }
  }

  if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID) {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const { credentials } = await oauth2.refreshAccessToken();
    oauth2.setCredentials(credentials);
    return oauth2;
  }

  throw new Error('Missing Google credentials for certificate sheet access');
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_CERTIFICATES_SHEET_ID || process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error('GOOGLE_SHEET_ID or GOOGLE_CERTIFICATES_SHEET_ID env var not set');
  return id;
}

// ── Helpers ──────────────────────────────────────────────────

const normalizeCell = (value: unknown) => String(value ?? '').trim();

function parseExtraFields(raw: string): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function rowToRecord(row: any[]): CertificateRecord {
  return {
    certificateId: normalizeCell(row[0]),       // A
    templateName: normalizeCell(row[1]),         // B
    participantName: normalizeCell(row[2]),      // C
    email: normalizeCell(row[3]),                // D
    eventName: normalizeCell(row[4]),            // E
    dateIssued: normalizeCell(row[5]),           // F
    status: (normalizeCell(row[6]) || 'ACTIVE') as CertificateStatus, // G
    extraFields: parseExtraFields(normalizeCell(row[7])), // H
    certificateUrl: normalizeCell(row[8]),       // I
    issuedBy: normalizeCell(row[9]),             // J
    verifiedCount: parseInt(normalizeCell(row[10])) || 0, // K
    lastVerifiedAt: normalizeCell(row[11]),      // L
  };
}

// ── Sheet Setup ──────────────────────────────────────────────

const HEADERS = [
  'Certificate ID',   // A
  'Template Name',    // B
  'Participant Name', // C
  'Email',            // D
  'Event Name',       // E
  'Date Issued',      // F
  'Status',           // G
  'Extra Fields',     // H — JSON
  'Certificate URL',  // I
  'Issued By',        // J
  'Verified Count',   // K
  'Last Verified At', // L
];

const ensuredSheets = new Set<string>();

export async function ensureCertificateSheet(targetSpreadsheetId?: string): Promise<void> {
  const spreadsheetId = targetSpreadsheetId || getSpreadsheetId();
  if (ensuredSheets.has(spreadsheetId)) return;

  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });

  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const exists = res.data.sheets?.some(
      (s) => s.properties?.title === CERT_SHEET_TAB
    );

    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: CERT_SHEET_TAB,
                  gridProperties: { rowCount: 2000, columnCount: 12 },
                },
              },
            },
          ],
        },
      });
    }

    // Enforce headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: certRange('A1:L1'),
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [HEADERS] },
    });

    ensuredSheets.add(spreadsheetId);
  } catch (err) {
    console.error('[Cert Sheets] ensureCertificateSheet error:', err);
  }
}

// ── CRUD Operations ──────────────────────────────────────────

/**
 * Generate a unique certificate ID.
 * Format: CERT-YYYYMMDD-XXXX (4-char alphanumeric suffix)
 */
export function generateCertificateId(): string {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CERT-${date}-${suffix}`;
}

// In-memory cache to provide instant lookups and fallback if sheet operations are slow or offline
const certMemoryStore = new Map<string, CertificateRecord>();

/**
 * Append a new certificate record to the sheet.
 */
export async function createCertificateRecord(
  record: CertificateRecord,
  targetSpreadsheetId?: string
): Promise<void> {
  // Always cache locally first
  certMemoryStore.set(record.certificateId.trim(), record);

  const spreadsheetId = targetSpreadsheetId || getSpreadsheetId();

  try {
    await ensureCertificateSheet(spreadsheetId);
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: auth as any });

    const row = [
      record.certificateId,
      record.templateName,
      record.participantName,
      record.email,
      record.eventName,
      record.dateIssued,
      record.status,
      JSON.stringify(record.extraFields || {}),
      record.certificateUrl,
      record.issuedBy,
      String(record.verifiedCount || 0),
      record.lastVerifiedAt || '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: certRange('A1'),
      insertDataOption: 'INSERT_ROWS',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });
  } catch (err: any) {
    console.warn('[Cert Sheets] Could not append to Google Sheet, kept in memory store:', err.message);
  }
}

/**
 * Batch append multiple certificate records to the sheet in a single API call.
 * Avoids per-row API rate limits and drastically accelerates bulk generation.
 */
export async function batchCreateCertificateRecords(
  records: CertificateRecord[],
  targetSpreadsheetId?: string
): Promise<void> {
  if (records.length === 0) return;

  // Cache locally
  records.forEach((r) => certMemoryStore.set(r.certificateId.trim(), r));

  const spreadsheetId = targetSpreadsheetId || getSpreadsheetId();

  try {
    await ensureCertificateSheet(spreadsheetId);
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: auth as any });

    const rows = records.map((record) => [
      record.certificateId,
      record.templateName,
      record.participantName,
      record.email,
      record.eventName,
      record.dateIssued,
      record.status,
      JSON.stringify(record.extraFields || {}),
      record.certificateUrl,
      record.issuedBy,
      String(record.verifiedCount || 0),
      record.lastVerifiedAt || '',
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: certRange('A1'),
      insertDataOption: 'INSERT_ROWS',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });
  } catch (err: any) {
    console.warn('[Cert Sheets] Could not batch append to Google Sheet:', err.message);
  }
}

/**
 * Find a certificate by its ID.
 * Looks first in the dedicated GOOGLE_CERTIFICATES_SHEET_ID,
 * with fallback to the main project sheet and in-memory store.
 */
export async function getCertificateById(
  certificateId: string
): Promise<CertificateRecord | null> {
  const normalizedId = certificateId.trim();

  const primaryId = getSpreadsheetId();
  const sheetsToCheck = [primaryId];
  if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SHEET_ID !== primaryId) {
    sheetsToCheck.push(process.env.GOOGLE_SHEET_ID);
  }

  for (const sheetId of sheetsToCheck) {
    try {
      await ensureCertificateSheet(sheetId);
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth: auth as any });

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: certRange('A:L'),
      });

      const rows = res.data.values;
      if (rows && rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          if (normalizeCell(rows[i][0]) === normalizedId) {
            const rec = rowToRecord(rows[i]);
            certMemoryStore.set(normalizedId, rec);
            return rec;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Cert Sheets] Google Sheet fetch failed on ${sheetId}:`, err.message);
    }
  }

  // Fallback to in-memory store
  return certMemoryStore.get(normalizedId) || null;
}

/**
 * Get all certificate records.
 */
export async function getAllCertificates(): Promise<CertificateRecord[]> {
  await ensureCertificateSheet();
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: certRange('A:L'),
  });

  const rows = res.data.values;
  if (!rows || rows.length <= 1) return [];

  return rows.slice(1).map(rowToRecord);
}

/**
 * Update a certificate's URL after generation.
 */
export async function updateCertificateUrl(
  certificateId: string,
  url: string
): Promise<boolean> {
  return updateCertificateColumn(certificateId, 8, url); // Column I (0-indexed: 8)
}

/**
 * Increment verification count and update last verified timestamp.
 */
export async function recordVerification(
  certificateId: string
): Promise<boolean> {
  const primaryId = getSpreadsheetId();
  const sheetsToCheck = [primaryId];
  if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SHEET_ID !== primaryId) {
    sheetsToCheck.push(process.env.GOOGLE_SHEET_ID);
  }

  for (const spreadsheetId of sheetsToCheck) {
    try {
      await ensureCertificateSheet(spreadsheetId);
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth: auth as any });

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: certRange('A:L'),
      });

      const rows = res.data.values;
      if (!rows || rows.length <= 1) continue;

      for (let i = 1; i < rows.length; i++) {
        if (normalizeCell(rows[i][0]) === certificateId.trim()) {
          const rowNum = i + 1; // 1-indexed
          const currentCount = parseInt(normalizeCell(rows[i][10])) || 0;

          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: {
              valueInputOption: 'USER_ENTERED',
              data: [
                {
                  range: certRange(`K${rowNum}`),
                  values: [[String(currentCount + 1)]],
                },
                {
                  range: certRange(`L${rowNum}`),
                  values: [[new Date().toISOString()]],
                },
              ],
            },
          });
          return true;
        }
      }
    } catch (err: any) {
      console.warn(`[Cert Sheets] recordVerification failed on ${spreadsheetId}:`, err.message);
    }
  }

  return false;
}

/**
 * Revoke a certificate.
 */
export async function revokeCertificate(
  certificateId: string
): Promise<boolean> {
  return updateCertificateColumn(certificateId, 6, 'REVOKED'); // Column G
}

// ── Internal helper ──────────────────────────────────────────

async function updateCertificateColumn(
  certificateId: string,
  colIndex: number,
  value: string
): Promise<boolean> {
  await ensureCertificateSheet();
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: certRange('A:A'),
  });

  const rows = res.data.values;
  if (!rows || rows.length <= 1) return false;

  for (let i = 1; i < rows.length; i++) {
    if (normalizeCell(rows[i][0]) === certificateId.trim()) {
      const rowNum = i + 1;
      const colLetter = String.fromCharCode(65 + colIndex); // A=65

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: certRange(`${colLetter}${rowNum}`),
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[value]] },
      });
      return true;
    }
  }
  return false;
}

