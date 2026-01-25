const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

async function generateIco() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  const sourcePng = path.join(__dirname, '../public/icon.png');

  console.log('Reading source PNG:', sourcePng);

  for (const size of sizes) {
    console.log(`Resizing to ${size}x${size}...`);
    const buffer = await sharp(sourcePng)
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push(buffer);
  }

  console.log('Converting to ICO...');
  const icoBuffer = await toIco(pngBuffers);

  const outputPath = path.join(__dirname, '../public/icon.ico');
  fs.writeFileSync(outputPath, icoBuffer);
  console.log('Generated icon.ico with sizes:', sizes.join(', '));
  console.log('Output:', outputPath);
}

generateIco().catch(console.error);
