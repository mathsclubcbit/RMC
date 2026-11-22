// ============================================================
// GET /api/certificates/[certId]/download
// ============================================================
// Serve the certificate image for download.
// Regenerates on-the-fly from the template if needed.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getCertificateById,
  generateCertificateImage,
  getCertificateFileName,
} from '@/lib/certificates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  try {
    const { certId } = await params;

    if (!certId) {
      return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 });
    }

    const cert = await getCertificateById(certId);
    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Build data map from the record
    const data: Record<string, string> = {
      participantName: cert.participantName,
      eventName: cert.eventName,
      ...cert.extraFields,
    };

    // Regenerate the image
    const imageBuffer = await generateCertificateImage(
      cert.templateName,
      data,
      cert.certificateId
    );

    // Return as downloadable PNG with name_rollno format
    const rollNo = cert.extraFields?.rollNo || cert.extraFields?.roll || '';
    const filename = getCertificateFileName(cert.participantName, rollNo, cert.certificateId);

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400', // Cache 24h
      },
    });
  } catch (error: any) {
    console.error('[Certificate Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate image', details: error.message },
      { status: 500 }
    );
  }
}
