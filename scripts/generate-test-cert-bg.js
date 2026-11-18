// Script to generate a simple test certificate background
// Run with: node scripts/generate-test-cert-bg.js

const Jimp = require('jimp');
const path = require('path');

async function generateTestBackground() {
  // A4 Landscape dimensions at 96 DPI (approx)
  const width = 1122;
  const height = 793;

  // Create white background
  const image = new Jimp(width, height, 0xFFFFFFFF);

  // Load fonts
  const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const fontMed = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

  // Add a colored border (draw colored rectangles)
  const borderColor = 0x0D9488FF; // Teal
  const borderWidth = 15;

  // Top border
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < borderWidth; y++) {
      image.setPixelColor(borderColor, x, y);
    }
  }
  // Bottom border
  for (let x = 0; x < width; x++) {
    for (let y = height - borderWidth; y < height; y++) {
      image.setPixelColor(borderColor, x, y);
    }
  }
  // Left border
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < borderWidth; x++) {
      image.setPixelColor(borderColor, x, y);
    }
  }
  // Right border
  for (let y = 0; y < height; y++) {
    for (let x = width - borderWidth; x < width; x++) {
      image.setPixelColor(borderColor, x, y);
    }
  }

  // Add header text
  image.print(
    fontLarge,
    0, 60,
    { text: 'RAMANUJAN MATHS CLUB', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    width, 50
  );

  image.print(
    fontLarge,
    0, 110,
    { text: 'CERTIFICATE OF PARTICIPATION', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    width, 50
  );

  // Add footer text (signatures area)
  image.print(
    fontMed,
    100, 580,
    { text: 'DR.MAMTA THAKUR', alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT },
    300, 30
  );
  image.print(
    fontMed,
    100, 600,
    { text: 'FACULTY COORDINATOR', alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT },
    300, 30
  );

  image.print(
    fontMed,
    width - 400, 580,
    { text: 'DR.SWATMARAM', alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT },
    300, 30
  );
  image.print(
    fontMed,
    width - 400, 600,
    { text: 'HEAD OF THE DEPARTMENT', alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT },
    300, 30
  );

  // Add a "TEST TEMPLATE" watermark
  image.print(
    fontMed,
    0, 650,
    { text: '[TEST TEMPLATE - Replace with Canva export]', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    width, 30
  );

  const outputPath = path.join(__dirname, '..', 'public', 'certificates', 'templates', 'mpl-participation.png');
  await image.writeAsync(outputPath);
  console.log('✅ Test background saved to:', outputPath);
}

generateTestBackground().catch(console.error);

