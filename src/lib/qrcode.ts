import QRCode from 'qrcode';
import Jimp from 'jimp';
import path from 'path';
import fs from 'fs';

export interface QRTicketData {
    registrationId: string;
    eventId: string;
    eventName?: string;
    participantName?: string;
    email?: string;
}

/**
 * Generate a QR code as a Data URL (base64 PNG) with RMC Logo in center
 */
export async function generateQRCode(registrationId: string): Promise<string> {
    try {
        // Generate QR code as buffer
        const qrBuffer = await QRCode.toBuffer(registrationId, {
            errorCorrectionLevel: 'H', // High error correction to support logo overlay
            type: 'png',
            width: 500, // Higher resolution
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Load QR image
        const qrImage = await Jimp.read(qrBuffer);

        // Try to load logo
        const logoPath = path.join(process.cwd(), 'public', 'full logo.png');

        if (fs.existsSync(logoPath)) {
            const logo = await Jimp.read(logoPath);

            // Resize logo to ~20% of QR code width
            const logoSize = qrImage.bitmap.width * 0.2;
            logo.resize(logoSize, Jimp.AUTO);

            // Calculate center position
            const x = (qrImage.bitmap.width - logo.bitmap.width) / 2;
            const y = (qrImage.bitmap.height - logo.bitmap.height) / 2;

            // Composite logo onto QR code
            qrImage.composite(logo, x, y);
        } else {
            console.warn('RMC Logo not found at:', logoPath);
        }

        // Return as Data URL
        return await qrImage.getBase64Async(Jimp.MIME_PNG);
    } catch (error) {
        console.error('QR Code generation failed:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Generate QR code with custom styling options
 */
export async function generateStyledQRCode(
    registrationId: string,
    options?: {
        size?: number;
        darkColor?: string;
        lightColor?: string;
    }
): Promise<string> {
    const { size = 300, darkColor = '#0D9488', lightColor = '#FFFFFF' } = options || {};

    try {
        const qrBuffer = await QRCode.toBuffer(registrationId, {
            errorCorrectionLevel: 'H',
            type: 'png',
            width: size,
            margin: 1,
            color: {
                dark: darkColor,
                light: lightColor
            }
        });

        const qrImage = await Jimp.read(qrBuffer);

        const logoPath = path.join(process.cwd(), 'public', 'full logo.png');
        if (fs.existsSync(logoPath)) {
            const logo = await Jimp.read(logoPath);
            const logoSize = qrImage.bitmap.width * 0.2;
            logo.resize(logoSize, Jimp.AUTO);

            const x = (qrImage.bitmap.width - logo.bitmap.width) / 2;
            const y = (qrImage.bitmap.height - logo.bitmap.height) / 2;

            qrImage.composite(logo, x, y);
        }

        return await qrImage.getBase64Async(Jimp.MIME_PNG);
    } catch (error) {
        console.error('QR Code generation failed:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Generate QR code as SVG string (for inline embedding)
 */
export async function generateQRCodeSVG(registrationId: string): Promise<string> {
    try {
        const svgString = await QRCode.toString(registrationId, {
            type: 'svg',
            errorCorrectionLevel: 'M',
            margin: 2
        });
        return svgString;
    } catch (error) {
        console.error('QR Code SVG generation failed:', error);
        throw new Error('Failed to generate QR code SVG');
    }
}

/**
 * Validate QR code data format
 */
export function validateQRData(data: string): boolean {
    const value = String(data || '').trim();
    if (!value) return false;

    // Ticket codes are strictly 6 digits
    return /^\d{6}$/.test(value);
}
