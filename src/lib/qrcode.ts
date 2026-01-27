import QRCode from 'qrcode';

export interface QRTicketData {
    registrationId: string;
    eventId: string;
    eventName?: string;
    participantName?: string;
    email?: string;
}

/**
 * Generate a QR code as a Data URL (base64 PNG)
 * The QR contains plain registration ID for simplicity
 */
export async function generateQRCode(registrationId: string): Promise<string> {
    try {
        const qrDataUrl = await QRCode.toDataURL(registrationId, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrDataUrl;
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
        const qrDataUrl = await QRCode.toDataURL(registrationId, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: size,
            margin: 2,
            color: {
                dark: darkColor,
                light: lightColor
            }
        });
        return qrDataUrl;
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
