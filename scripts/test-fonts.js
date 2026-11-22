const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testFonts() {
  // Let's test standard fonts available in SVG / Windows / Web
  const fonts = [
    'Georgia',
    'Palatino Linotype',
    'Book Antiqua',
    'Garamond',
    'Century Gothic',
    'Segoe UI',
    'Trebuchet MS',
    'Times New Roman',
  ];

  for (const font of fonts) {
    const svg = `
    <svg width="800" height="120" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="120" fill="#ffffff" />
      <text x="400" y="70" font-family="${font}, serif" font-size="38" font-weight="bold" fill="#0f172a" text-anchor="middle">
        Adithya Vardhan Vemula (${font})
      </text>
    </svg>
    `;
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    const out = path.join(process.cwd(), 'scratch', `font-${font.replace(/\s+/g, '_')}.png`);
    fs.writeFileSync(out, buf);
    console.log(`Rendered ${font} to: ${out}`);
  }
}

testFonts().catch(console.error);

