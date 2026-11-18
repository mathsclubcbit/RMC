// ============================================================
// Certificate Image Generator (Powered by Sharp, Opentype & Custom Fonts)
// ============================================================
// Features:
// - Exact vector bezier glyph rendering via Opentype.js (100% authentic typography)
// - Garet (Official Canva Geometric Sans-Serif font: Book & Heavy)
// - Playfair Display (Luxury Editorial Serif)
// - Cinzel (Classical Roman Inscribed)
// - Great Vibes (Calligraphic Script)
// - Montserrat (Modern Clean Sans-Serif)
// - Exact Canva size 22 math (~52px at 2000px canvas)
// - 10 Curated QR Colors with styled rounded border container
// - Centered RMC logo inside the QR code
// - File naming convention: name_rollno.png
// ============================================================

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { parse as opentypeParse, type Font as OpentypeFont } from 'opentype.js';
import { getTemplate } from './config';

// Safe parse function supporting both direct and default-nested exports
const parseFont = (buffer: ArrayBuffer | Buffer): OpentypeFont => {
  if (typeof opentypeParse === 'function') {
    return opentypeParse(buffer);
  }
  // Fallback for non-standard CJS bundling
  const ot = require('opentype.js');
  return (ot.parse || ot.default?.parse || ot)(buffer);
};

/**
 * 10 Curated Colors for QR Code & Borders
 */
export const QR_COLOR_PALETTE = [
  { id: 'teal', name: 'RMC Teal', hex: '#0D9488' },
  { id: 'navy', name: 'Navy Blue', hex: '#1E3A8A' },
  { id: 'royal', name: 'Royal Blue', hex: '#2563EB' },
  { id: 'black', name: 'Classic Black', hex: '#000000' },
  { id: 'slate', name: 'Slate Gray', hex: '#334155' },
  { id: 'emerald', name: 'Emerald Green', hex: '#047857' },
  { id: 'crimson', name: 'Crimson Red', hex: '#991B1B' },
  { id: 'gold', name: 'Golden Bronze', hex: '#B45309' },
  { id: 'purple', name: 'Royal Purple', hex: '#581C87' },
  { id: 'rose', name: 'Rose / Pink', hex: '#BE185D' },
];

/**
 * QR Scanner Sizes for Certificate placement
 */
export const QR_SIZES = [
  { id: '200', name: 'Compact (200px)', value: 200 },
  { id: '240', name: 'Medium (240px)', value: 240 },
  { id: '280', name: 'Standard (280px) [Recommended]', value: 280 },
  { id: '320', name: 'Large (320px)', value: 320 },
  { id: '360', name: 'Extra Large (360px)', value: 360 },
];

/**
 * Format filename as name_rollno.png (e.g. Adithya_Vardhan_160122733001.png)
 */
export function getCertificateFileName(
  name: string,
  rollNo?: string,
  certId?: string
): string {
  const sanitize = (s: string) =>
    (s || '')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

  const cleanName = sanitize(name || 'Participant');
  const cleanRoll = rollNo ? sanitize(rollNo) : (certId ? sanitize(certId) : 'cert');

  return `${cleanName}_${cleanRoll}.png`;
}

// In-memory font cache so we only parse font buffers once
const parsedFontCache = new Map<string, OpentypeFont>();

function getLoadedFont(filename: string): OpentypeFont | null {
  if (parsedFontCache.has(filename)) {
    return parsedFontCache.get(filename)!;
  }
  const fontPath = path.join(process.cwd(), 'public', 'certificates', 'fonts', 'custom', filename);
  if (fs.existsSync(fontPath)) {
    try {
      const buf = fs.readFileSync(fontPath);
      const font = parseFont(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      parsedFontCache.set(filename, font);
      return font;
    } catch (e) {
      console.warn(`[Generator] Failed to load font ${filename}:`, e);
    }
  }
  return null;
}

/**
 * Converts a text string into an SVG path string with properly closed subpaths (Z).
 * Handles letter advance widths and font kerning.
 */
function getClosedPathData(
  font: OpentypeFont,
  text: string,
  x: number,
  y: number,
  fontSize: number
): string {
  let curX = x;
  let fullPathData = '';

  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    if (glyph.unicode) {
      const gPath = glyph.getPath(curX, y, fontSize);
      if (gPath.commands && gPath.commands.length > 0) {
        let subData = '';
        for (let j = 0; j < gPath.commands.length; j++) {
          const cmd = gPath.commands[j];
          if (cmd.type === 'M') {
            if (j > 0 && !subData.endsWith('Z')) {
              subData += 'Z';
            }
            subData += `M${cmd.x.toFixed(2)} ${cmd.y.toFixed(2)}`;
          } else if (cmd.type === 'L') {
            subData += `L${cmd.x.toFixed(2)} ${cmd.y.toFixed(2)}`;
          } else if (cmd.type === 'C') {
            subData += `C${cmd.x1.toFixed(2)} ${cmd.y1.toFixed(2)} ${cmd.x2.toFixed(2)} ${cmd.y2.toFixed(2)} ${cmd.x.toFixed(2)} ${cmd.y.toFixed(2)}`;
          } else if (cmd.type === 'Q') {
            subData += `Q${cmd.x1.toFixed(2)} ${cmd.y1.toFixed(2)} ${cmd.x.toFixed(2)} ${cmd.y.toFixed(2)}`;
          } else if (cmd.type === 'Z') {
            subData += 'Z';
          }
        }
        if (!subData.endsWith('Z')) {
          subData += 'Z';
        }
        fullPathData += subData;
      }
    }
    // Kerning calculation
    let kerning = 0;
    if (i < text.length - 1) {
      const nextGlyph = font.charToGlyph(text[i + 1]);
      kerning = font.getKerningValue(glyph, nextGlyph) * (fontSize / font.unitsPerEm);
    }
    curX += (glyph.advanceWidth ?? 0) * (fontSize / font.unitsPerEm) + kerning;
  }
  return fullPathData;
}

/**
 * Accurately measures the width of a string in a given font and size.
 */
function measureTextWidth(font: OpentypeFont, text: string, fontSize: number): number {
  let totalW = 0;
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    let kerning = 0;
    if (i < text.length - 1) {
      const nextGlyph = font.charToGlyph(text[i + 1]);
      kerning = font.getKerningValue(glyph, nextGlyph) * (fontSize / font.unitsPerEm);
    }
    totalW += (glyph.advanceWidth ?? 0) * (fontSize / font.unitsPerEm) + kerning;
  }
  return totalW;
}

/**
 * Generate a branded QR code buffer with RMC logo centered
 */
async function generateBrandedQRBuffer(
  verifyUrl: string,
  size: number = 200,
  darkColor: string = '#0D9488'
): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: size,
    margin: 1,
    color: {
      dark: darkColor,
      light: '#FFFFFF',
    },
  });

  const logoPath = path.join(process.cwd(), 'public', 'full logo.png');
  if (fs.existsSync(logoPath)) {
    const logoSize = Math.round(size * 0.22);
    const logoResized = await sharp(logoPath)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toBuffer();

    return await sharp(qrBuffer)
      .composite([
        {
          input: logoResized,
          gravity: 'centre',
        },
      ])
      .png()
      .toBuffer();
  }

  return qrBuffer;
}

/**
 * Generate a certificate image as a high-resolution PNG Buffer.
 */
export async function generateCertificateImage(
  templateId: string,
  data: Record<string, string>,
  certId: string
): Promise<Buffer> {
  const template = getTemplate(templateId);
  const bgPath = path.join(process.cwd(), 'public', template.backgroundImage);

  if (!fs.existsSync(bgPath)) {
    throw new Error(`Template background image not found: ${bgPath}`);
  }

  // Detect background dimensions (Canva export is 2000x1414)
  const metadata = await sharp(bgPath).metadata();
  const width = metadata.width || 2000;
  const height = metadata.height || 1414;
  const scale = width / 2000;

  const participantName = data.participantName || 'Participant';
  const college = data.college || 'CBIT (A)';
  const eventName = data.eventName || 'Maths Premier League (MPL)';
  const eventDates = data.eventDates || '25 September to 27 September 2026';

  // Font style chosen by user: 'garet' (default Canva font) | 'playfair' | 'cinzel' | 'script' | 'montserrat'
  const fontStyle = (data.fontStyle || 'garet').toLowerCase();

  // QR Color & Border Settings (10 colors)
  const qrColor = data.qrColor || '#0D9488';
  const qrBorderColor = data.qrBorderColor !== undefined ? data.qrBorderColor : qrColor;
  const qrBorderWidth = parseInt(data.qrBorderWidth || '4', 10);

  // Load fonts
  let bodyFont = getLoadedFont('Garet-Book.otf');
  let boldFont = bodyFont; // Use stroked Garet-Book for balanced, elegant Canva bold (avoids bulky weight 900)
  let nameFont = bodyFont;
  let isScript = false;

  if (fontStyle === 'playfair') {
    const playfair = getLoadedFont('PlayfairDisplay-Regular.ttf');
    if (playfair) {
      bodyFont = playfair;
      boldFont = playfair;
      nameFont = playfair;
    }
  } else if (fontStyle === 'cinzel') {
    const cinzel = getLoadedFont('Cinzel-Bold.ttf');
    if (cinzel) {
      bodyFont = cinzel;
      boldFont = cinzel;
      nameFont = cinzel;
    }
  } else if (fontStyle === 'script') {
    const script = getLoadedFont('GreatVibes-Regular.ttf');
    if (script) {
      nameFont = script;
      isScript = true;
    }
  } else if (fontStyle === 'montserrat') {
    const mont = getLoadedFont('Montserrat-Regular.ttf');
    if (mont) {
      bodyFont = mont;
      boldFont = mont;
      nameFont = mont;
    }
  }

  // Fallback to Garet if any font is missing
  if (!bodyFont) bodyFont = getLoadedFont('Garet-Book.otf');
  if (!boldFont) boldFont = bodyFont;
  if (!nameFont) nameFont = boldFont;

  // Font size calculation matching Canva size 22 math:
  const canvaFontSize = parseFloat(data.canvaFontSize || '22') || 22;
  const baseFontSize = Math.round(canvaFontSize * 2.18 * scale);
  const nameFontSize = isScript ? Math.round(baseFontSize * 1.3) : baseFontSize;
  const lineHeight = Math.round(baseFontSize * 1.5);
  const startY = Math.round(480 * (height / 1414));
  const centerX = Math.round(width / 2);

  // QR placement: configurable scanner size (default 280px) centered vertically in signature gap
  const rawQrSize = parseInt(data.qrSize || '280', 10) || 280;
  const qrSize = Math.round(rawQrSize * scale);
  const qrLeft = Math.round(centerX - qrSize / 2);
  const qrCenterY = Math.round(1015 * (height / 1414));
  const qrTop = Math.round(qrCenterY - qrSize / 2);
  const borderPadding = Math.round(14 * scale);

  // Solid, high-contrast pitch-dark slate/black (NOT washed-out grey #1e293b)
  const textColor = '#0f172a';

  let pathsSvg = '';

  if (bodyFont && boldFont && nameFont) {
    // Helper to render a centered line of mixed text segments
    const renderLine = (
      segments: { text: string; font: OpentypeFont; size: number; bold?: boolean }[],
      y: number
    ) => {
      let totalW = 0;
      const measured = segments.map((seg) => {
        const w = measureTextWidth(seg.font, seg.text, seg.size);
        totalW += w;
        return { ...seg, w };
      });

      let curX = centerX - totalW / 2;
      let lineSvg = '';

      for (const seg of measured) {
        const pData = getClosedPathData(seg.font, seg.text, curX, y, seg.size);
        if (pData) {
          // If bold, apply an SVG stroke to produce authentic Canva Bold (weight ~700) with open counters
          const shouldStrokeBold =
            seg.bold && fontStyle !== 'cinzel' && !(isScript && seg.font === nameFont);
          if (shouldStrokeBold) {
            const strokeWidth = ((seg.size / 48) * 2.2).toFixed(2);
            lineSvg += `<path d="${pData}" fill="${textColor}" stroke="${textColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" />\n`;
          } else {
            lineSvg += `<path d="${pData}" fill="${textColor}" />\n`;
          }
        }
        curX += seg.w;
      }
      return lineSvg;
    };

    const line1 = [
      { text: 'This is to certify that Mr./Ms. ', font: bodyFont, size: baseFontSize, bold: false },
      { text: participantName, font: nameFont, size: nameFontSize, bold: true },
      { text: ', of ', font: bodyFont, size: baseFontSize, bold: false },
      { text: college, font: boldFont, size: baseFontSize, bold: true },
      { text: ',', font: bodyFont, size: baseFontSize, bold: false },
    ];

    const line2 = [
      { text: 'participated in the ', font: bodyFont, size: baseFontSize, bold: false },
      { text: eventName, font: boldFont, size: baseFontSize, bold: true },
      { text: ' organized by', font: bodyFont, size: baseFontSize, bold: false },
    ];

    const line3 = [
      {
        text: 'Ramanujan Maths Club (RMC) of Chaitanya Bharathi Institute of',
        font: bodyFont,
        size: baseFontSize,
        bold: false,
      },
    ];

    const line4 = [
      {
        text: 'Technology (A), Hyderabad - 500075, Telangana, held from',
        font: bodyFont,
        size: baseFontSize,
        bold: false,
      },
    ];

    const line5 = [
      { text: `${eventDates}.`, font: boldFont, size: baseFontSize, bold: true },
    ];

    pathsSvg += renderLine(line1, startY);
    pathsSvg += renderLine(line2, startY + lineHeight);
    pathsSvg += renderLine(line3, startY + lineHeight * 2);
    pathsSvg += renderLine(line4, startY + lineHeight * 3);
    pathsSvg += renderLine(line5, startY + lineHeight * 4);
  }

  // QR Container Border
  const qrBorderSvg =
    qrBorderColor && qrBorderColor !== 'none'
      ? `
    <rect 
      x="${qrLeft - borderPadding}" 
      y="${qrTop - borderPadding}" 
      width="${qrSize + borderPadding * 2}" 
      height="${qrSize + borderPadding * 2}" 
      rx="18" 
      ry="18" 
      fill="#ffffff" 
      stroke="${qrBorderColor}" 
      stroke-width="${qrBorderWidth}" 
    />
  `
      : '';

  const fullSvg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${pathsSvg}
    ${qrBorderSvg}
  </svg>
  `;

  // Verification URL encoded into QR
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rmccbit.in';
  const verifyUrl = `${baseUrl}/verify/${certId}`;
  const qrBuffer = await generateBrandedQRBuffer(verifyUrl, qrSize, qrColor);

  // Composite SVG text & QR onto background PNG
  const finalImage = await sharp(bgPath)
    .composite([
      { input: Buffer.from(fullSvg), top: 0, left: 0 },
      { input: qrBuffer, top: qrTop, left: qrLeft },
    ])
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  return finalImage;
}

/**
 * Generate a certificate and return as base64 Data URL.
 */
export async function generateCertificateBase64(
  templateId: string,
  data: Record<string, string>,
  certId: string
): Promise<string> {
  const buffer = await generateCertificateImage(templateId, data, certId);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}
