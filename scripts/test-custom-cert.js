const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

async function testCustomFontsOnCertificate() {
  const bgPath = path.join(process.cwd(), 'public', 'certificates', 'templates', 'mpl-participation.png');
  const metadata = await sharp(bgPath).metadata();
  const width = metadata.width || 2000;
  const height = metadata.height || 1414;

  const fontDir = path.join(process.cwd(), 'public', 'certificates', 'fonts', 'custom');
  const playfairBase64 = fs.readFileSync(path.join(fontDir, 'PlayfairDisplay-Regular.ttf')).toString('base64');
  const greatVibesBase64 = fs.readFileSync(path.join(fontDir, 'GreatVibes-Regular.ttf')).toString('base64');
  const cinzelBase64 = fs.readFileSync(path.join(fontDir, 'Cinzel-Bold.ttf')).toString('base64');

  const participantName = "Adithya Varma";
  const college = "CBIT (A)";
  const eventName = "Maths Premier League (MPL)";
  const eventDates = "25 September to 27 September 2026";

  // Let's test Style 1: Playfair Display + Great Vibes calligraphic name
  const svgOverlay = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @font-face {
          font-family: 'PlayfairDisplay';
          src: url('data:font/truetype;charset=utf-8;base64,${playfairBase64}') format('truetype');
        }
        @font-face {
          font-family: 'Cinzel';
          src: url('data:font/truetype;charset=utf-8;base64,${cinzelBase64}') format('truetype');
        }
        @font-face {
          font-family: 'GreatVibes';
          src: url('data:font/truetype;charset=utf-8;base64,${greatVibesBase64}') format('truetype');
        }

        .body-text {
          font-family: 'PlayfairDisplay', Georgia, serif;
          font-size: 30px;
          fill: #1e293b;
          text-anchor: middle;
          letter-spacing: 0.5px;
        }
        .name-calligraphy {
          font-family: 'PlayfairDisplay', Georgia, serif;
          font-weight: bold;
          font-size: 40px;
          fill: #0c1a2e;
          letter-spacing: 1px;
        }
        .bold-highlight {
          font-family: 'PlayfairDisplay', Georgia, serif;
          font-weight: bold;
          fill: #0c1a2e;
        }
      </style>
    </defs>

    <text x="1000" y="580" class="body-text">
      This is to certify that Mr./Ms. <tspan class="name-calligraphy">${participantName}</tspan>, of <tspan class="bold-highlight">${college}</tspan>,
    </text>
    <text x="1000" y="640" class="body-text">
      participated in the <tspan class="bold-highlight">${eventName}</tspan> organized by
    </text>
    <text x="1000" y="700" class="body-text">
      Ramanujan Maths Club (RMC) of Chaitanya Bharathi Institute of
    </text>
    <text x="1000" y="760" class="body-text">
      Technology (A), Hyderabad - 500075, Telangana, held from
    </text>
    <text x="1000" y="820" class="body-text">
      <tspan class="bold-highlight">${eventDates}</tspan>.
    </text>
  </svg>
  `;

  // QR code
  const qrBuffer = await QRCode.toBuffer('https://rmccbit.in/verify/CERT-20261118-TEST', {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 210,
    margin: 1,
    color: { dark: '#0D9488', light: '#FFFFFF' }
  });

  const logoPath = path.join(process.cwd(), 'public', 'full logo.png');
  let finalQr = qrBuffer;
  if (fs.existsSync(logoPath)) {
    const logo = await sharp(logoPath).resize(46, 46, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toBuffer();
    finalQr = await sharp(qrBuffer).composite([{ input: logo, gravity: 'centre' }]).png().toBuffer();
  }

  const result = await sharp(bgPath)
    .composite([
      { input: Buffer.from(svgOverlay), top: 0, left: 0 },
      { input: finalQr, top: 925, left: Math.round(1000 - 105) }
    ])
    .png()
    .toBuffer();

  const outPath = path.join(process.cwd(), 'scratch', 'playfair-cert.png');
  fs.writeFileSync(outPath, result);
  console.log('✅ Created certificate with custom Playfair Display font at:', outPath);
}

testCustomFontsOnCertificate().catch(console.error);
