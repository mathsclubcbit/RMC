// ============================================================
// POST /api/certificates/bulk-download
// ============================================================
// Packages a list of certificate IDs into a single .ZIP file
// with each certificate named as name_rollno.png.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import {
  getCertificateById,
  generateCertificateImage,
  getCertificateFileName,
} from '@/lib/certificates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certIds, zipName = 'MPL_Certificates_Batch.zip' } = body;

    if (!Array.isArray(certIds) || certIds.length === 0) {
      return NextResponse.json(
        { error: 'certIds must be a non-empty array of certificate IDs' },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    let addedCount = 0;

    for (const certId of certIds) {
      try {
        const cert = await getCertificateById(certId);
        if (!cert) continue;

        const data: Record<string, string> = {
          participantName: cert.participantName,
          eventName: cert.eventName,
          ...cert.extraFields,
        };

        const imageBuffer = await generateCertificateImage(
          cert.templateName,
          data,
          cert.certificateId
        );

        const rollNo = cert.extraFields?.rollNo || cert.extraFields?.roll || '';
        const filename = getCertificateFileName(cert.participantName, rollNo, cert.certificateId);

        zip.file(filename, imageBuffer);
        addedCount++;
      } catch (err) {
        console.warn(`[Bulk Download] Failed to pack cert ${certId}:`, err);
      }
    }

    if (addedCount === 0) {
      return NextResponse.json(
        { error: 'No valid certificates could be packaged' },
        { status: 404 }
      );
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const safeZipName = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeZipName}"`,
      },
    });
  } catch (error: any) {
    console.error('[Bulk Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificates zip', details: error.message },
      { status: 500 }
    );
  }
}

