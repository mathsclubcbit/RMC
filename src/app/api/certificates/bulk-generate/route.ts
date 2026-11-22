// ============================================================
// POST /api/certificates/bulk-generate
// ============================================================
// Bulk generate certificates from:
// 1. A Google Sheet (by URL/ID and Tab)
// 2. OR a direct list of participant records (from CSV/JSON)
//
// File naming: name_rollno.png
// Uploads to Google Drive (Certificates subfolder)
// Appends records to destination Google Sheet (Certificates tab)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import {
  generateCertificateImage,
  generateCertificateId,
  createCertificateRecord,
  batchCreateCertificateRecords,
  getTemplate,
  getVerificationUrl,
  getCertificateFileName,
} from '@/lib/certificates';
import { uploadToDrive, getOrCreateFolder } from '@/lib/google';
import { uploadCertificateToCloudinary } from '@/lib/certificates/cloudinary';
import type { CertificateRecord } from '@/types/certificate';

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
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
    return await auth.getClient();
  }
  throw new Error('Service account credentials required for Google Sheets access');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      templateId = 'mpl-participation',
      sheetIdOrUrl,
      targetSheetIdOrUrl, // Destination sheet where Certificates tab will be updated
      tabName = 'Sheet1',
      nameColumn = 'Participant Name',
      rollNoColumn = 'Roll No',
      collegeColumn = 'College',
      emailColumn = 'Email',
      defaultCollege = 'CBIT (A)',
      eventName = 'Maths Premier League (MPL)',
      eventDates = '25 September to 27 September 2026',
      issuedBy = 'Ramanujan Maths Club, CBIT',
      fontStyle = 'garet',
      canvaFontSize = '22',
      qrColor = '#0D9488',
      qrBorderColor = '#0D9488',
      qrBorderWidth = '4',
      qrSize = '280',
      directParticipants, // Optional: array of { participantName, rollNo, college, email, extraFields }
    } = body;

    try {
      getTemplate(templateId);
    } catch {
      return NextResponse.json(
        { error: `Template "${templateId}" not found` },
        { status: 404 }
      );
    }

    const defaultSpreadsheet =
      process.env.GOOGLE_CERTIFICATES_SHEET_ID ||
      process.env.GOOGLE_SHEET_ID ||
      '';
    const sourceSpreadsheetId = extractSheetId(sheetIdOrUrl || defaultSpreadsheet);
    const destSpreadsheetId =
      extractSheetId(targetSheetIdOrUrl || '') ||
      extractSheetId(process.env.GOOGLE_CERTIFICATES_SHEET_ID || '') ||
      sourceSpreadsheetId;

    let itemsToProcess: {
      name: string;
      rollNo: string;
      college: string;
      email: string;
      extra: Record<string, string>;
    }[] = [];

    // Case A: Direct array provided (e.g. from CSV upload or preview rows)
    if (Array.isArray(directParticipants) && directParticipants.length > 0) {
      itemsToProcess = directParticipants
        .map((p) => {
          const name = String(
            (nameColumn ? p[nameColumn] : '') ||
              p.participantName ||
              p.name ||
              p.fullName ||
              ''
          ).trim();
          const rollNo = String(
            (rollNoColumn ? p[rollNoColumn] : '') ||
              p.rollNo ||
              p.roll ||
              p.hallTicket ||
              ''
          ).trim();
          const college = String(
            (collegeColumn ? p[collegeColumn] : '') ||
              p.college ||
              defaultCollege ||
              'CBIT (A)'
          ).trim();
          const email = String(
            (emailColumn ? p[emailColumn] : '') || p.email || ''
          ).trim();

          return {
            name,
            rollNo,
            college,
            email,
            extra: p.extraFields || p || {},
          };
        })
        .filter((item) => Boolean(item.name));
    } else {
      // Case B: Fetch from Google Sheet
      if (!sourceSpreadsheetId) {
        return NextResponse.json(
          { error: 'No Google Sheet ID, URL, or participants list provided' },
          { status: 400 }
        );
      }

      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth: auth as any });

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sourceSpreadsheetId,
        range: `${tabName}!A1:Z5000`, // Support up to 5000 rows
      });

      const rows = res.data.values || [];
      if (rows.length <= 1) {
        return NextResponse.json(
          { error: `Tab "${tabName}" has no data rows.` },
          { status: 400 }
        );
      }

      const headers: string[] = (rows[0] || []).map((h: any) =>
        String(h || '').trim().toLowerCase()
      );

      // Find indices for mapped columns
      const nameIdx = headers.findIndex((h) => h === nameColumn.toLowerCase());
      const rollIdx = headers.findIndex(
        (h) => h === rollNoColumn.toLowerCase() || /roll\s*no|roll|hall\s*ticket|id/i.test(h)
      );
      const collegeIdx = headers.findIndex((h) => h === collegeColumn.toLowerCase());
      const emailIdx = headers.findIndex((h) => h === emailColumn.toLowerCase());

      if (nameIdx === -1) {
        return NextResponse.json(
          {
            error: `Name column "${nameColumn}" not found in sheet headers: ${rows[0].join(', ')}`,
          },
          { status: 400 }
        );
      }

      const dataRows = rows.slice(1);
      for (const row of dataRows) {
        const name = String(row[nameIdx] || '').trim();
        if (!name) continue;

        const rollNo = rollIdx !== -1 && row[rollIdx] ? String(row[rollIdx]).trim() : '';
        const collegeVal =
          collegeIdx !== -1 && row[collegeIdx]
            ? String(row[collegeIdx]).trim()
            : defaultCollege;

        const emailVal =
          emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : '';

        // Gather all other columns as extra fields
        const extra: Record<string, string> = {};
        headers.forEach((h, idx) => {
          if (
            idx !== nameIdx &&
            idx !== rollIdx &&
            idx !== collegeIdx &&
            idx !== emailIdx &&
            row[idx]
          ) {
            extra[rows[0][idx]] = String(row[idx]).trim();
          }
        });

        itemsToProcess.push({
          name,
          rollNo,
          college: collegeVal,
          email: emailVal,
          extra,
        });
      }
    }

    if (itemsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'No valid participants found with non-empty names.' },
        { status: 400 }
      );
    }

    // Google Drive folder
    const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    let certFolderId: string | null = null;
    if (driveFolderId) {
      try {
        certFolderId = await getOrCreateFolder('Certificates', driveFolderId);
      } catch (e: any) {
        console.warn('[Bulk Generate] Drive folder skipped:', e.message);
      }
    }

    // Process participants in concurrent batches (8 at a time) for speed without hitting memory or rate limits
    const results: {
      name: string;
      rollNo: string;
      fileName: string;
      certificateId: string;
      verificationUrl: string;
      downloadUrl: string;
      driveUrl: string;
      status: 'success' | 'error';
      error?: string;
    }[] = [];

    const recordsToAppend: CertificateRecord[] = [];
    const BATCH_SIZE = 8;

    for (let i = 0; i < itemsToProcess.length; i += BATCH_SIZE) {
      const chunk = itemsToProcess.slice(i, i + BATCH_SIZE);
      await Promise.all(
        chunk.map(async (item) => {
          try {
            const certId = generateCertificateId();
            const fileName = getCertificateFileName(item.name, item.rollNo, certId);

            const certData = {
              participantName: item.name,
              college: item.college,
              eventName,
              eventDates,
              fontStyle,
              canvaFontSize,
              qrColor,
              qrBorderColor,
              qrBorderWidth,
              qrSize,
              ...item.extra,
            };

            // Render certificate image
            const imageBuffer = await generateCertificateImage(
              templateId,
              certData,
              certId
            );

            // Upload to Google Drive as name_rollno.png (optional / best-effort)
            let certificateUrl = '';
            if (certFolderId) {
              try {
                const driveFile = await uploadToDrive(
                  Buffer.from(imageBuffer),
                  'image/png',
                  fileName,
                  certFolderId
                );
                certificateUrl = driveFile.webViewLink || '';
              } catch (uploadErr) {
                // Non-critical
              }
            }

            // Fallback 1: Cloudinary Upload (permanent CDN image URL, bypasses Google Drive quota issues)
            if (!certificateUrl) {
              const cdnUrl = await uploadCertificateToCloudinary(
                Buffer.from(imageBuffer),
                fileName
              );
              if (cdnUrl) {
                certificateUrl = cdnUrl;
              }
            }

            // Fallback 2: Direct server download URL
            const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://rmccbit.in';
            if (!certificateUrl) {
              certificateUrl = `${siteBase}/api/certificates/${certId}/download`;
            }

            // Prepare record for batch insert into Google Sheets
            const record: CertificateRecord = {
              certificateId: certId,
              templateName: templateId,
              participantName: item.name,
              email: item.email,
              eventName,
              dateIssued: new Date().toISOString(),
              status: 'ACTIVE',
              extraFields: {
                rollNo: item.rollNo,
                college: item.college,
                eventDates,
                fileName,
                ...item.extra,
              },
              certificateUrl,
              issuedBy,
              verifiedCount: 0,
              lastVerifiedAt: '',
            };

            recordsToAppend.push(record);

            results.push({
              name: item.name,
              rollNo: item.rollNo,
              fileName,
              certificateId: certId,
              verificationUrl: getVerificationUrl(certId),
              downloadUrl: `/api/certificates/${certId}/download`,
              driveUrl: certificateUrl,
              status: 'success',
            });
          } catch (err: any) {
            results.push({
              name: item.name,
              rollNo: item.rollNo,
              fileName: '',
              certificateId: '',
              verificationUrl: '',
              downloadUrl: '',
              driveUrl: '',
              status: 'error',
              error: err.message,
            });
          }
        })
      );
    }

    // Append all generated certificate records to destination Google Sheet in 1 single batch API call
    if (recordsToAppend.length > 0) {
      await batchCreateCertificateRecords(recordsToAppend, destSpreadsheetId);
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      totalProcessed: itemsToProcess.length,
      successCount,
      errorCount,
      destinationSheetId: destSpreadsheetId,
      results,
    });
  } catch (error: any) {
    console.error('[Bulk Generate] Error:', error);
    return NextResponse.json(
      { error: 'Bulk generation failed', details: error.message },
      { status: 500 }
    );
  }
}
