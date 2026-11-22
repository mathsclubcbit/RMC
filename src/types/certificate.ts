// ============================================================
// Certificate System Types
// ============================================================

/** A single field placement on the certificate image */
export interface CertificateFieldConfig {
  /** The data key — matches a column in the sheet or a key in extraFields JSON */
  key: string;
  /** X position (pixels from left) */
  x: number;
  /** Y position (pixels from top) */
  y: number;
  /** Max width for text wrapping (pixels). Defaults to canvas width - x */
  maxWidth?: number;
  /** Font size in pixels */
  fontSize: number;
  /** Font family. Defaults to 'serif' */
  fontFamily?: string;
  /** Font weight. Defaults to 'normal' */
  fontWeight?: 'normal' | 'bold';
  /** Text color (hex). Defaults to '#000000' */
  color?: string;
  /** Text alignment. Defaults to 'center' */
  align?: 'left' | 'center' | 'right';
  /** Line height multiplier for wrapped text. Defaults to 1.4 */
  lineHeight?: number;
}

/** QR code placement config */
export interface QRPlacementConfig {
  /** X position (pixels from left) — center of QR */
  x: number;
  /** Y position (pixels from top) — center of QR */
  y: number;
  /** QR code size in pixels */
  size: number;
}

/** A certificate template definition */
export interface CertificateTemplate {
  /** Unique template identifier */
  templateId: string;
  /** Display name */
  name: string;
  /** Path to background PNG (relative to public/) */
  backgroundImage: string;
  /**
   * Body text template with {{placeholder}} variables.
   * This is the main paragraph rendered onto the certificate.
   */
  bodyTemplate: string;
  /** Body text rendering config */
  body: {
    x: number;
    y: number;
    maxWidth: number;
    fontSize: number;
    fontFamily?: string;
    color?: string;
    lineHeight?: number;
    align?: 'left' | 'center' | 'right';
  };
  /** Additional static or dynamic fields rendered on the certificate */
  fields?: CertificateFieldConfig[];
  /** QR code placement */
  qr: QRPlacementConfig;
}

/** Status of a certificate */
export type CertificateStatus = 'ACTIVE' | 'REVOKED' | 'PENDING';

/** A single certificate record from Google Sheets */
export interface CertificateRecord {
  /** Unique certificate ID (e.g., CERT-20261118-A7X3) */
  certificateId: string;
  /** Template used to generate this certificate */
  templateName: string;
  /** Participant / recipient name */
  participantName: string;
  /** Email of recipient */
  email: string;
  /** Event or program name */
  eventName: string;
  /** Date the certificate was issued (ISO string) */
  dateIssued: string;
  /** Certificate status */
  status: CertificateStatus;
  /** JSON blob of extra dynamic fields */
  extraFields: Record<string, string>;
  /** URL to the generated certificate image (Cloudinary or Drive) */
  certificateUrl: string;
  /** Who issued this certificate */
  issuedBy: string;
  /** Number of times this certificate has been verified */
  verifiedCount: number;
  /** Last verification timestamp */
  lastVerifiedAt: string;
}

/** Payload for generating a certificate */
export interface GenerateCertificatePayload {
  templateId: string;
  participantName: string;
  email?: string;
  eventName: string;
  /** Any extra key-value fields to include */
  extraFields?: Record<string, string>;
  issuedBy?: string;
}

/** Response from the verify endpoint */
export interface VerifyCertificateResponse {
  verified: boolean;
  certificate?: {
    certificateId: string;
    participantName: string;
    eventName: string;
    dateIssued: string;
    status: CertificateStatus;
    issuedBy: string;
    rollNumber: string;
    extraFields: Record<string, string>;
    templateName: string;
  };
  error?: string;
}

