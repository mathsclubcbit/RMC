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
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
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
    const tabName = body.tabName || 'Sheet1';

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'No spreadsheet ID provided' }, { status: 400 });
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: auth as any });

    const sampleData = [
      ['Name', 'Roll No', 'College', 'Email', 'Event Name', 'Event Dates'],
      ['Adithya Vardhan Vemula', '160122733001', 'CBIT (A)', 'adithya@example.com', 'Maths Premier League (MPL)', '25 September to 27 September 2026'],
      ['B. Sai Teja', '160122733015', 'CBIT (A)', 'saiteja@example.com', 'Maths Premier League (MPL)', '25 September to 27 September 2026'],
      ['K. Sneha Reddy', '160122733042', 'CBIT (A)', 'sneha@example.com', 'Maths Premier League (MPL)', '25 September to 27 September 2026'],
      ['M. Rahul Sharma', '160122733088', 'CBIT (A)', 'rahul@example.com', 'Maths Premier League (MPL)', '25 September to 27 September 2026'],
      ['P. Ananya Rao', '160122733104', 'CBIT (A)', 'ananya@example.com', 'Maths Premier League (MPL)', '25 September to 27 September 2026'],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1:F${sampleData.length}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: sampleData,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${sampleData.length - 1} sample participant rows into tab "${tabName}".`,
      tabName,
      count: sampleData.length - 1,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to seed sample participant rows' },
      { status: 500 }
    );
  }
}

