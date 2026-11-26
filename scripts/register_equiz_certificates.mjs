#!/usr/bin/env node
/** Register generated e-quiz IDs in the existing Certificates Google Sheet. */

import fs from 'node:fs/promises';
import process from 'node:process';
import path from 'node:path';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config({ path: '.env.local' });
dotenv.config();

const HEADERS = [
  'Certificate ID', 'Template Name', 'Participant Name', 'Email',
  'Event Name', 'Date Issued', 'Status', 'Extra Fields',
  'Certificate URL', 'Issued By', 'Verified Count', 'Last Verified At',
];

function arg(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

async function authClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is required to register certificates');
  }
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ],
  });
  return auth.getClient();
}

async function attachDriveLinks(drive, manifest, folderId) {
  if (!folderId) return;
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,webViewLink,webContentLink)',
    pageSize: 1000,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const filesByName = new Map((response.data.files || []).map((file) => [file.name, file]));
  for (const item of manifest) {
    const file = filesByName.get(path.basename(item.filename));
    if (file) {
      item.drive_file_id = file.id || '';
      item.drive_url = file.webViewLink || file.webContentLink || '';
      item.drive_folder_id = folderId;
    }
  }
}

async function main() {
  const input = arg('--input', 'output/pdf/equiz/manifest.json');
  const spreadsheetId = arg(
    '--spreadsheet-id',
    process.env.GOOGLE_CERTIFICATES_SHEET_ID || process.env.GOOGLE_SHEET_ID || ''
  );
  const driveFolderId = arg('--drive-folder-id', process.env.GOOGLE_EQUIZ_DRIVE_FOLDER_ID || '');
  if (!spreadsheetId) throw new Error('GOOGLE_CERTIFICATES_SHEET_ID or GOOGLE_SHEET_ID is required');

  const manifest = JSON.parse(await fs.readFile(input, 'utf8'));
  if (!Array.isArray(manifest) || manifest.length === 0) throw new Error('Manifest has no certificates');

  const auth = await authClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });
  await attachDriveLinks(drive, manifest, driveFolderId);
  await fs.writeFile(input, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const tab = 'Certificates';
  const exists = (metadata.data.sheets || []).some((item) => item.properties?.title === tab);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tab, gridProperties: { rowCount: 2000, columnCount: 12 } } } }] },
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A1:L1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [HEADERS] },
  });

  const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${tab}!A2:A` });
  const existingIds = new Set((existing.data.values || []).flat().map((value) => String(value).trim()));
  const fresh = manifest.filter((item) => !existingIds.has(String(item.certificate_id).trim()));
  if (fresh.length > 0) {
    const rows = fresh.map((item) => [
      item.certificate_id,
      item.template_name || 'equiz-certificate',
      item.participant_name,
      item.email || '',
      item.event_name || 'National Level E-Quiz',
      item.date_issued || new Date().toISOString(),
      item.status || 'ACTIVE',
      JSON.stringify({ eventDates: item.event_dates || '', filename: item.filename || '' }),
      item.drive_url || '',
      item.issued_by || 'Ramanujan Maths Club, CBIT',
      '0',
      '',
    ]);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tab}!A1`,
      insertDataOption: 'INSERT_ROWS',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });
  }
  console.log(JSON.stringify({ registered: fresh.length, skipped_existing: manifest.length - fresh.length, tab }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
