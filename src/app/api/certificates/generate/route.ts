// ============================================================
// POST /api/certificates/generate
// ============================================================
// Generate a certificate for a single participant.
// Reads template config, generates image + QR, saves to sheet.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  generateCertificateImage,
  generateCertificateId,
  createCertificateRecord,
  getTemplate,
  getVerificationUrl,
  getCertificateFileName,
} from '@/lib/certificates';
import { uploadToDrive, getOrCreateFolder } from '@/lib/google';
import { uploadCertificateToCloudinary } from '@/lib/certificates/cloudinary';
import type { CertificateRecord, GenerateCertificatePayload } from '@/types/certificate';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateCertificatePayload = await request.json();

    // Validate required fields
    if (!body.templateId || !body.participantName || !body.eventName) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, participantName, eventName' },
        { status: 400 }
      );
    }

    // Validate template exists
    try {
      getTemplate(body.templateId);
    } catch {
      return NextResponse.json(
        { error: `Template "${body.templateId}" not found` },
        { status: 404 }
      );
    }

    // Generate unique cert ID
    const certId = generateCertificateId();

    // Build data map for placeholder substitution
    const data: Record<string, string> = {
      participantName: body.participantName,
      eventName: body.eventName,
      fontStyle: (body as any).fontStyle || body.extraFields?.fontStyle || 'garet',
      canvaFontSize: (body as any).canvaFontSize || body.extraFields?.canvaFontSize || '22',
      qrSize: (body as any).qrSize || body.extraFields?.qrSize || '280',
      qrColor: (body as any).qrColor || body.extraFields?.qrColor || '#0D9488',
      qrBorderColor: (body as any).qrBorderColor || body.extraFields?.qrBorderColor || '#0D9488',
      qrBorderWidth: (body as any).qrBorderWidth || body.extraFields?.qrBorderWidth || '4',
      ...(body.extraFields || {}),
    };

    // Generate the certificate image
    const imageBuffer = await generateCertificateImage(
      body.templateId,
      data,
      certId
    );

    // Upload to Google Drive (optional / best-effort)
    const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    let certificateUrl = '';

    if (driveFolderId) {
      try {
        const certFolderId = await getOrCreateFolder('Certificates', driveFolderId);
        const rollNo = (body as any).rollNo || body.extraFields?.rollNo || body.extraFields?.roll;
        const fileName = getCertificateFileName(body.participantName, rollNo, certId);
        const driveFile = await uploadToDrive(
          Buffer.from(imageBuffer),
          'image/png',
          fileName,
          certFolderId
        );
        certificateUrl = driveFile.webViewLink || '';
      } catch (uploadErr: any) {
        console.warn('[Certificate Generate] Google Drive upload skipped/failed:', uploadErr.message);
      }
    }

    // Fallback 1: Cloudinary Upload (permanent CDN image URL, bypasses Google Drive quota issues)
    if (!certificateUrl) {
      const rollNo = (body as any).rollNo || body.extraFields?.rollNo || body.extraFields?.roll;
      const fileName = getCertificateFileName(body.participantName, rollNo, certId);
      const cdnUrl = await uploadCertificateToCloudinary(Buffer.from(imageBuffer), fileName);
      if (cdnUrl) {
        certificateUrl = cdnUrl;
      }
    }

    // Fallback 2: Direct server download link
    const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://rmccbit.in';
    if (!certificateUrl) {
      certificateUrl = `${siteBase}/api/certificates/${certId}/download`;
    }

    // Save record to Google Sheet
    const record: CertificateRecord = {
      certificateId: certId,
      templateName: body.templateId,
      participantName: body.participantName,
      email: body.email || '',
      eventName: body.eventName,
      dateIssued: new Date().toISOString(),
      status: 'ACTIVE',
      extraFields: body.extraFields || {},
      certificateUrl,
      issuedBy: body.issuedBy || 'RMC Admin',
      verifiedCount: 0,
      lastVerifiedAt: '',
    };

    const targetSheetId = (body as any).targetSheetId;
    await createCertificateRecord(record, targetSheetId);

    return NextResponse.json({
      success: true,
      certificateId: certId,
      verificationUrl: getVerificationUrl(certId),
      certificateUrl,
      message: `Certificate generated for ${body.participantName}`,
    });
  } catch (error: any) {
    console.error('[Certificate Generate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate', details: error.message },
      { status: 500 }
    );
  }
}

