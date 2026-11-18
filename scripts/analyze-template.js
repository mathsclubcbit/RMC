const Jimp = require('jimp');

async function analyze() {
  const img = await Jimp.read('public/certificates/templates/mpl-participation.png');
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  console.log(`Analyzing image: ${w}x${h}`);

  // Let's sample horizontal bands to see where the text/elements are
  const bands = 28;
  const bandHeight = Math.floor(h / bands);

  for (let b = 0; b < bands; b++) {
    const yStart = b * bandHeight;
    const yEnd = Math.min((b + 1) * bandHeight, h);
    let nonWhiteCount = 0;

    for (let y = yStart; y < yEnd; y += 4) {
      for (let x = 300; x < w - 300; x += 4) { // inside borders
        const color = Jimp.intToRGBA(img.getPixelColor(x, y));
        // check if not white/light grey
        if (color.r < 235 || color.g < 235 || color.b < 235) {
          nonWhiteCount++;
        }
      }
    }
    console.log(`Band ${b} (y=${yStart}..${yEnd}): non-white pixels = ${nonWhiteCount}`);
  }
}

analyze().catch(console.error);

