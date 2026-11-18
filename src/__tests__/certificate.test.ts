import { describe, it, expect } from 'vitest';
import { generateCertificateId } from '@/lib/certificates/sheets';
import { getVerificationUrl } from '@/lib/certificates/qr';
import { getTemplate, CERTIFICATE_TEMPLATES } from '@/lib/certificates/config';
import { generateCertificateImage } from '@/lib/certificates/generator';

describe('Certificate Generation and Verification Engine', () => {
  it('should generate a valid certificate ID format', () => {
    const certId = generateCertificateId();
    expect(certId).toMatch(/^CERT-\d{8}-[A-Z0-9]{4}$/);
  });

  it('should format verification URL properly', () => {
    const certId = 'CERT-20261118-TEST';
    const url = getVerificationUrl(certId);
    expect(url).toContain(`/verify/${certId}`);
  });

  it('should find registered certificate template', () => {
    const template = getTemplate('mpl-participation');
    expect(template).toBeDefined();
    expect(template.templateId).toBe('mpl-participation');
    expect(template.bodyTemplate).toContain('{{participantName}}');
  });

  it('should render a certificate image buffer with QR and text', async () => {
    const certId = generateCertificateId();
    const data = {
      participantName: 'Adithya Vardhan',
      college: 'CBIT (A)',
      eventName: 'Maths Premier League (MPL)',
      eventDates: '25 September to 27 September 2026',
      position: 'Winner',
    };

    const buffer = await generateCertificateImage('mpl-participation', data, certId);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(10000); // Valid PNG buffer
    const fs = await import('fs');
    fs.writeFileSync('public/certificates/sample-generated.png', buffer);
  }, 15000);
});

