// ============================================================
// GET & POST /api/certificates/sheets
// ============================================================
// Inspects a Google Sheet (by URL or ID), lists available tabs,
// and fetches rows for live preview before batch certificate generation.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

function extractSheetId(input: string): string {
  if (!input) return '';
  const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return input.trim();
}

async function getAuthClient() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return await auth.getClient();
  }
  throw new Error('Service account credentials missing');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawInput =
      body.sheetIdOrUrl ||
      process.env.GOOGLE_CERTIFICATES_SHEET_ID ||
      process.env.GOOGLE_SHEET_ID;
    const spreadsheetId = extractSheetId(rawInput);
    const requestedTab = body.tabName;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'No Google Sheet ID or URL provided.' },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: auth as any });

    // 1. Get spreadsheet metadata (available tabs)
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const availableTabs = (meta.data.sheets || [])
      .map((s) => s.properties?.title)
      .filter((title): title is string => Boolean(title));

    if (availableTabs.length === 0) {
      return NextResponse.json(
        { error: 'Spreadsheet has no tabs or is inaccessible.' },
        { status: 400 }
      );
    }

    // Pick active tab
    const activeTab =
      requestedTab && availableTabs.includes(requestedTab)
        ? requestedTab
        : availableTabs[0];

    // 2. Fetch rows from the active tab (up to 5000 rows)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${activeTab}!A1:Z5000`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({
        spreadsheetId,
        availableTabs,
        activeTab,
        headers: [],
        rows: [],
        totalRows: 0,
        message: 'Tab is empty',
      });
    }

    const headers: string[] = (rows[0] || []).map((h: any) => String(h || '').trim());
    const dataRows = rows.slice(1).map((r: any[]) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h) {
          obj[h] = String(r[idx] || '').trim();
        }
      });
      return obj;
    });

    // Auto-detect common column headers
    let suggestedNameCol = headers.find((h) =>
      /participant\s*name|^name$|student\s*name/i.test(h)
    ) || headers[0] || '';

    let suggestedRollNoCol = headers.find((h) =>
      /roll\s*no|roll|hall\s*ticket|registration\s*id/i.test(h)
    ) || '';

    let suggestedCollegeCol = headers.find((h) =>
      /college|institution|department|branch/i.test(h)
    ) || '';

    let suggestedEmailCol = headers.find((h) =>
      /email|mail/i.test(h)
    ) || '';

    let suggestedEventCol = headers.find((h) =>
      /event\s*name|^event$/i.test(h)
    ) || '';

    return NextResponse.json({
      spreadsheetId,
      availableTabs,
      activeTab,
      headers,
      sampleRows: dataRows.slice(0, 15),
      totalRows: dataRows.length,
      suggestions: {
        nameColumn: suggestedNameCol,
        rollNoColumn: suggestedRollNoCol,
        collegeColumn: suggestedCollegeCol,
        emailColumn: suggestedEmailCol,
        eventColumn: suggestedEventCol,
      },
    });
  } catch (error: any) {
    console.error('[Sheets API] Error inspecting sheet:', error.message);
    return NextResponse.json(
      {
        error:
          'Could not read spreadsheet. Please ensure the Google Sheet is shared with the service account email (or public with link): ' +
          (process.env.GOOGLE_SERVICE_ACCOUNT_JSON
            ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON).client_email
            : ''),
        details: error.message,
      },
      { status: 500 }
    );
  }
}

