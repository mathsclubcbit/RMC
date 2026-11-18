// ============================================================
// Certificate Template Configurations
// ============================================================
// Each template maps to a Canva-exported background PNG and
// defines where dynamic text + QR are placed on the image.
//
// HOW TO ADD A NEW TEMPLATE:
//   1. Design in Canva → remove dynamic text → export PNG
//   2. Place PNG in /public/certificates/templates/
//   3. Add a new entry below with field positions
// ============================================================

import type { CertificateTemplate } from '@/types/certificate';

/**
 * All registered certificate templates.
 * Key = templateId used in the Google Sheet.
 */
export const CERTIFICATE_TEMPLATES: Record<string, CertificateTemplate> = {

  // ── MPL Participation Certificate ──────────────────────────
  'mpl-participation': {
    templateId: 'mpl-participation',
    name: 'MPL - Certificate of Participation',
    backgroundImage: '/certificates/templates/mpl-participation.png',

    bodyTemplate:
      'This is to certify that Mr./Ms. {{participantName}}, of {{college}}, participated in the {{eventName}} organized by Ramanujan Maths Club (RMC) of Chaitanya Bharathi Institute of Technology (A), Hyderabad - 500075, Telangana, held from {{eventDates}}.',

    body: {
      x: 561,        // center of standard A4 landscape (1122px width)
      y: 260,
      maxWidth: 820,
      fontSize: 24,
      fontFamily: 'serif',
      color: '#1a1a1a',
      lineHeight: 1.5,
      align: 'center',
    },

    qr: {
      x: 561,         // centered between the two signatures
      y: 520,
      size: 110,
    },
  },

  // ── Example: Workshop Completion Certificate ───────────────
  // Uncomment and adjust when you have the template PNG ready
  //
  // 'workshop-completion': {
  //   templateId: 'workshop-completion',
  //   name: 'Workshop - Certificate of Completion',
  //   backgroundImage: '/certificates/templates/workshop-completion.png',
  //   bodyTemplate:
  //     'This is to certify that {{participantName}} has successfully completed the {{workshopName}} workshop conducted by Ramanujan Maths Club (RMC), CBIT, on {{eventDates}}.',
  //   body: {
  //     x: 396, y: 300, maxWidth: 560,
  //     fontSize: 17, fontFamily: 'serif', color: '#1a1a1a',
  //     lineHeight: 1.5, align: 'center',
  //   },
  //   qr: { x: 396, y: 440, size: 80 },
  // },
};

/**
 * Get a template config by ID.
 * Throws if the template doesn't exist.
 */
export function getTemplate(templateId: string): CertificateTemplate {
  const template = CERTIFICATE_TEMPLATES[templateId];
  if (!template) {
    throw new Error(
      `Certificate template "${templateId}" not found. Available: ${Object.keys(CERTIFICATE_TEMPLATES).join(', ')}`
    );
  }
  return template;
}

/**
 * List all available template IDs and names.
 */
export function listTemplates(): { templateId: string; name: string }[] {
  return Object.values(CERTIFICATE_TEMPLATES).map((t) => ({
    templateId: t.templateId,
    name: t.name,
  }));
}

