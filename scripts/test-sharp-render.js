const sharp = require('sharp');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function testSharpRender() {
  const bgPath = path.join(process.cwd(), 'public', 'certificates', 'templates', 'mpl-participation.png');
  const metadata = await sharp(bgPath).metadata();
  const width = metadata.width;
  const height = metadata.height;
  console.log('Background size:', width, 'x', height);

  // Generate QR code with sharp
  const qrBuffer = await QRCode.toBuffer('https://rmccbit.in/verify/CERT-20261118-TEST', {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 220,
    margin: 1,
    color: { dark: '#0D9488', light: '#FFFFFF' }
  });

  // Overlay RMC logo on QR
  const logoPath = path.join(process.cwd(), 'public', 'full logo.png');
  let finalQrBuffer = qrBuffer;
  if (fs.existsSync(logoPath)) {
    const logoResized = await sharp(logoPath)
      .resize(50, 50, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();
    
    // composite white bg + logo on QR
    finalQrBuffer = await sharp(qrBuffer)
      .composite([{
        input: logoResized,
        gravity: 'centre'
      }])
      .png()
      .toBuffer();
  }

  // Create SVG text overlay
  // Canvas width is 2000, height is 1414
  // Center is x=1000. Text box: x=250 to 1750 (width=1500)
  // Text area is y=540 to 860
  const participantName = "Adithya Vardhan Vemula";
  const college = "CBIT (A)";
  const eventName = "Maths Premier League (MPL)";
  const eventDates = "25 September to 27 September 2026";

  const svgText = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .body-text {
        font-family: 'Times New Roman', Times, Georgia, serif;
        font-size: 32px;
        fill: #1e293b;
        text-anchor: middle;
        line-height: 1.7;
      }
      .bold-highlight {
        font-weight: bold;
        fill: #0f172a;
        font-size: 36px;
      }
      .bold-text {
        font-weight: bold;
        fill: #0f172a;
      }
    </style>
    
    <!-- Text Lines -->
    <text x="1000" y="580" class="body-text">
      This is to certify that Mr./Ms. <tspan class="bold-highlight">${participantName}</tspan>, of <tspan class="bold-text">${college}</tspan>,
    </text>
    <text x="1000" y="640" class="body-text">
      participated in the <tspan class="bold-text">${eventName}</tspan> organized by
    </text>
    <text x="1000" y="700" class="body-text">
      Ramanujan Maths Club (RMC) of Chaitanya Bharathi Institute of
    </text>
    <text x="1000" y="760" class="body-text">
      Technology (A), Hyderabad - 500075, Telangana, held from
    </text>
    <text x="1000" y="820" class="body-text">
      <tspan class="bold-text">${eventDates}</tspan>.
    </text>
  </svg>
  `;

  // QR placement: centered at x=1000, y=960.
  // QR width is 220, so left = 1000 - 110 = 890, top = 930
  const qrLeft = Math.round(1000 - 110);
  const qrTop = 930;

  const result = await sharp(bgPath)
    .composite([
      { input: Buffer.from(svgText), top: 0, left: 0 },
      { input: finalQrBuffer, top: qrTop, left: qrLeft }
    ])
    .png()
    .toBuffer();

  const outPath = path.join(process.cwd(), 'scratch', 'sharp-test.png');
  fs.writeFileSync(outPath, result);
  console.log('✅ Sharp certificate created successfully at:', outPath);
}

testSharpRender().catch(console.error);

