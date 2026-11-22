// ============================================================
// /verify/[certId] — Public Certificate Verification Page
// ============================================================
// This is what people see when they scan the QR code.
// Shows a beautiful "Verified ✅" page with certificate details.
// ============================================================

import type { Metadata } from 'next';
import CertificateVerifyClient from './CertificateVerifyClient';

interface PageProps {
  params: Promise<{ certId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { certId } = await params;
  return {
    title: `Verify Certificate ${certId} | RMC - Ramanujan Maths Club`,
    description: 'Verify the authenticity of a certificate issued by Ramanujan Maths Club (RMC), CBIT.',
    openGraph: {
      title: `Certificate Verification | RMC`,
      description: 'Verify the authenticity of this certificate issued by Ramanujan Maths Club.',
    },
  };
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { certId } = await params;
  return <CertificateVerifyClient certId={certId} />;
}

