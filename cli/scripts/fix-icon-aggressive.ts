import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const OUTPUT_DIR = "./output/dexter/logo";

async function main() {
  const iconPath = path.join(OUTPUT_DIR, "icon.png");
  const iconBuffer = fs.readFileSync(iconPath);
  
  // Get raw data
  const { data, info } = await sharp(iconBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Find bounds of BLACK pixels only (threshold 200)
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      
      // Only count dark pixels (< 200)
      if (r < 200 && g < 200 && b < 200) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  console.log(`Black content: ${cw}x${ch} at (${minX},${minY})`);
  
  // Extract 
  const cropped = await sharp(iconBuffer)
    .extract({ left: minX, top: minY, width: cw, height: ch })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toBuffer();
  
  // Make square - NO PADDING, just center in square
  const maxDim = Math.max(cw, ch);
  
  const squareIcon = await sharp({
    create: { width: maxDim, height: maxDim, channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
  .composite([{
    input: cropped,
    top: Math.round((maxDim - ch) / 2),
    left: Math.round((maxDim - cw) / 2)
  }])
  .resize(1024, 1024)
  .png()
  .toBuffer();
  
  fs.writeFileSync(iconPath, squareIcon);
  console.log(`✓ icon.png (${maxDim}x${maxDim} → 1024x1024, ZERO padding)`);
}

main().catch(console.error);
