// ============================================================
// Certificate QR Code Generator
// ============================================================
// Generates branded QR codes that encode a verification URL.
// Builds on the existing qrcode + jimp infrastructure.
// ============================================================

import QRCode from 'qrcode';
import Jimp from 'jimp';
import path from 'path';
import fs from 'fs';

/** The base URL for verification. Update if your domain changes. */
const VERIFY_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://rmccbit.in';

/**
 * Build the full verification URL for a certificate.
 */
export function getVerificationUrl(certificateId: string): string {
  return `${VERIFY_BASE_URL}/verify/${certificateId}`;
}

/**
 * Generate a branded QR code for certificate verification.
 *
 * - Encodes the verification URL (not raw data)
 * - Overlays RMC logo in center
 * - Uses high error correction so logo doesn't break scanning
 * - Returns base64 Data URL (PNG)
 */
export async function generateCertificateQR(
  certificateId: string,
  options?: {
    size?: number;
    darkColor?: string;
    lightColor?: string;
  }
): Promise<string> {
  const {
    size = 300,
    darkColor = '#0D9488',  // RMC teal
    lightColor = '#FFFFFF',
  } = options || {};

  const verifyUrl = getVerificationUrl(certificateId);

  // Generate QR as buffer
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    errorCorrectionLevel: 'H', // High — supports ~30% obstruction (logo overlay)
    type: 'png',
    width: size,
    margin: 1,
    color: { dark: darkColor, light: lightColor },
  });

  const qrImage = await Jimp.read(qrBuffer);

  // Overlay RMC logo
  const logoPath = path.join(process.cwd(), 'public', 'full logo.png');
  if (fs.existsSync(logoPath)) {
    const logo = await Jimp.read(logoPath);

    // Logo = 20% of QR width
    const logoSize = Math.floor(qrImage.bitmap.width * 0.2);
    logo.resize(logoSize, Jimp.AUTO);

    // Center it
    const x = Math.floor((qrImage.bitmap.width - logo.bitmap.width) / 2);
    const y = Math.floor((qrImage.bitmap.height - logo.bitmap.height) / 2);

    // Add a white background behind the logo for readability
    const logoBg = new Jimp(
      logo.bitmap.width + 8,
      logo.bitmap.height + 8,
      0xFFFFFFFF
    );
    qrImage.composite(logoBg, x - 4, y - 4);
    qrImage.composite(logo, x, y);
  } else {
    console.warn('[Cert QR] RMC logo not found at:', logoPath);
  }

  return await qrImage.getBase64Async(Jimp.MIME_PNG);
}

/**
 * Generate a QR code as a raw PNG Buffer (for compositing onto certificates).
 */
export async function generateCertificateQRBuffer(
  certificateId: string,
  size: number = 200
): Promise<Buffer> {
  const verifyUrl = getVerificationUrl(certificateId);

  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: size,
    margin: 1,
    color: { dark: '#0D9488', light: '#FFFFFF' },
  });

  const qrImage = await Jimp.read(qrBuffer);

  // Overlay logo
  const logoPath = path.join(process.cwd(), 'public', 'full logo.png');
  if (fs.existsSync(logoPath)) {
    const logo = await Jimp.read(logoPath);
    const logoSize = Math.floor(qrImage.bitmap.width * 0.2);
    logo.resize(logoSize, Jimp.AUTO);

    const x = Math.floor((qrImage.bitmap.width - logo.bitmap.width) / 2);
    const y = Math.floor((qrImage.bitmap.height - logo.bitmap.height) / 2);

    const logoBg = new Jimp(
      logo.bitmap.width + 8,
      logo.bitmap.height + 8,
      0xFFFFFFFF
    );
    qrImage.composite(logoBg, x - 4, y - 4);
    qrImage.composite(logo, x, y);
  }

  return await qrImage.getBufferAsync(Jimp.MIME_PNG);
}

