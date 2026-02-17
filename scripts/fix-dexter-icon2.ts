import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const OUTPUT_DIR = "./output/dexter/logo";

async function main() {
  const iconPath = path.join(OUTPUT_DIR, "icon.png");
  const iconBuffer = fs.readFileSync(iconPath);
  
  // Get current icon info
  const meta = await sharp(iconBuffer).metadata();
  console.log(`Current icon: ${meta.width}x${meta.height}`);
  
  // Extract raw pixel data to analyze edges
  const { data, info } = await sharp(iconBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Find the bounding box of non-white pixels
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  const threshold = 250; // pixels below this are considered "content"
  
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // If not white/near-white
      if (r < threshold || g < threshold || b < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  console.log(`Content bounds: (${minX},${minY}) to (${maxX},${maxY})`);
  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  console.log(`Content size: ${contentWidth}x${contentHeight}`);
  
  // Extract just the content area
  const cropped = await sharp(iconBuffer)
    .extract({ left: minX, top: minY, width: contentWidth, height: contentHeight })
    .toBuffer();
  
  // Make it square with 5% padding
  const maxDim = Math.max(contentWidth, contentHeight);
  const padding = Math.round(maxDim * 0.05);
  const finalSize = maxDim + (padding * 2);
  
  console.log(`Final square: ${finalSize}x${finalSize} (${padding}px padding)`);
  
  const squareIcon = await sharp({
    create: {
      width: finalSize,
      height: finalSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{
    input: cropped,
    top: Math.round((finalSize - contentHeight) / 2),
    left: Math.round((finalSize - contentWidth) / 2)
  }])
  .png()
  .toBuffer();
  
  // Resize to 1024x1024
  const finalIcon = await sharp(squareIcon)
    .resize(1024, 1024)
    .png()
    .toBuffer();
  
  fs.writeFileSync(iconPath, finalIcon);
  console.log("✓ icon.png saved");
  
  // Rebuild lockups
  const wordmarkBuffer = fs.readFileSync(path.join(OUTPUT_DIR, "wordmark.png"));
  const wordmarkMeta = await sharp(wordmarkBuffer).metadata();
  
  // STACKED
  const stackedSize = 1024;
  const iconH = stackedSize * 0.6;
  
  const sIcon = await sharp(finalIcon).resize(Math.round(iconH), Math.round(iconH)).toBuffer();
  
  const wmW = stackedSize * 0.75;
  const wmScale = wmW / wordmarkMeta!.width!;
  const wmH = wordmarkMeta!.height! * wmScale;
  const sWm = await sharp(wordmarkBuffer).resize(Math.round(wmW), Math.round(wmH)).toBuffer();
  
  const gap = 30;
  const totalH = iconH + gap + wmH;
  const topOff = (stackedSize - totalH) / 2;
  
  const stacked = await sharp({
    create: { width: stackedSize, height: stackedSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([
    { input: sIcon, top: Math.round(topOff), left: Math.round((stackedSize - iconH) / 2) },
    { input: sWm, top: Math.round(topOff + iconH + gap), left: Math.round((stackedSize - wmW) / 2) }
  ])
  .png()
  .toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "stacked.png"), stacked);
  console.log("✓ stacked.png");
  
  // HORIZONTAL
  const hW = 3000, hH = 1000;
  const hPad = hH * 0.1;
  const hIconSz = hH - hPad * 2;
  
  const hIcon = await sharp(finalIcon).resize(Math.round(hIconSz), Math.round(hIconSz)).toBuffer();
  
  const hWmH = hH * 0.28;
  const hWmScale = hWmH / wordmarkMeta!.height!;
  const hWmW = wordmarkMeta!.width! * hWmScale;
  const hWm = await sharp(wordmarkBuffer).resize(Math.round(hWmW), Math.round(hWmH)).toBuffer();
  
  const hGap = 60;
  const totW = hIconSz + hGap + hWmW;
  const leftOff = (hW - totW) / 2;
  
  const horiz = await sharp({
    create: { width: hW, height: hH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([
    { input: hIcon, top: Math.round(hPad), left: Math.round(leftOff) },
    { input: hWm, top: Math.round((hH - hWmH) / 2), left: Math.round(leftOff + hIconSz + hGap) }
  ])
  .png()
  .toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "horizontal.png"), horiz);
  console.log("✓ horizontal.png");
  
  console.log("\n✅ Done!");
}

main().catch(console.error);
