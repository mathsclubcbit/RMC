// ============================================================
// GET /api/certificates/verify/[certId]
// ============================================================
// Public API to verify a certificate by its ID.
// Called by the verification page. Also logs the scan.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getCertificateById,
  getCertificateRollNumber,
  recordVerification,
} from '@/lib/certificates';
import type { VerifyCertificateResponse } from '@/types/certificate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  try {
    const { certId } = await params;

    if (!certId || !certId.startsWith('CERT-')) {
      const res: VerifyCertificateResponse = {
        verified: false,
        error: 'Invalid certificate ID format',
      };
      return NextResponse.json(res, { status: 400 });
    }

    // Look up certificate in Google Sheet
    const cert = await getCertificateById(certId);

    if (!cert) {
      const res: VerifyCertificateResponse = {
        verified: false,
        error: 'Certificate not found. This certificate ID does not exist in our records.',
      };
      return NextResponse.json(res, { status: 404 });
    }

    // Check if revoked
    if (cert.status === 'REVOKED') {
      const res: VerifyCertificateResponse = {
        verified: false,
        certificate: {
          certificateId: cert.certificateId,
          participantName: cert.participantName,
          eventName: cert.eventName,
          dateIssued: cert.dateIssued,
          status: cert.status,
          issuedBy: cert.issuedBy,
          rollNumber: getCertificateRollNumber(cert.extraFields),
          extraFields: cert.extraFields,
          templateName: cert.templateName,
        },
        error: 'This certificate has been revoked.',
      };
      return NextResponse.json(res, { status: 200 });
    }

    // Record the verification scan (async, don't block the response)
    recordVerification(certId).catch((err) =>
      console.error('[Verify] Failed to record verification:', err)
    );

    // Return verified response
    const res: VerifyCertificateResponse = {
      verified: true,
      certificate: {
        certificateId: cert.certificateId,
        participantName: cert.participantName,
        eventName: cert.eventName,
        dateIssued: cert.dateIssued,
        status: cert.status,
        issuedBy: cert.issuedBy,
        rollNumber: getCertificateRollNumber(cert.extraFields),
        extraFields: cert.extraFields,
        templateName: cert.templateName,
      },
    };

    return NextResponse.json(res);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Verify API] Error:', message);
    return NextResponse.json(
      { verified: false, error: 'Verification service error' },
      { status: 500 }
    );
  }
}

