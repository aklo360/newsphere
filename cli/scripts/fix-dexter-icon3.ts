import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const OUTPUT_DIR = "./output/dexter/logo";

async function main() {
  const iconPath = path.join(OUTPUT_DIR, "icon.png");
  const iconBuffer = fs.readFileSync(iconPath);
  
  // Find content bounds
  const { data, info } = await sharp(iconBuffer).raw().toBuffer({ resolveWithObject: true });
  
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  const threshold = 250;
  
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r < threshold || g < threshold || b < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  console.log(`Content: ${contentWidth}x${contentHeight} at (${minX},${minY})`);
  
  // Extract content
  const cropped = await sharp(iconBuffer)
    .extract({ left: minX, top: minY, width: contentWidth, height: contentHeight })
    .toBuffer();
  
  // Make square with MINIMAL padding (2%)
  const maxDim = Math.max(contentWidth, contentHeight);
  const padding = Math.round(maxDim * 0.02); // only 2% padding!
  const finalSize = maxDim + (padding * 2);
  
  console.log(`Square: ${finalSize}x${finalSize} (${padding}px padding = 2%)`);
  
  const squareIcon = await sharp({
    create: { width: finalSize, height: finalSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([{
    input: cropped,
    top: Math.round((finalSize - contentHeight) / 2),
    left: Math.round((finalSize - contentWidth) / 2)
  }])
  .png()
  .toBuffer();
  
  // Resize to 1024
  const finalIcon = await sharp(squareIcon).resize(1024, 1024).png().toBuffer();
  fs.writeFileSync(iconPath, finalIcon);
  console.log("✓ icon.png");
  
  // Rebuild lockups
  const wordmarkBuffer = fs.readFileSync(path.join(OUTPUT_DIR, "wordmark.png"));
  const wmMeta = await sharp(wordmarkBuffer).metadata();
  
  // STACKED - icon fills 65% height
  const sSize = 1024;
  const sIconH = sSize * 0.65;
  const sIcon = await sharp(finalIcon).resize(Math.round(sIconH), Math.round(sIconH)).toBuffer();
  
  const sWmW = sSize * 0.8;
  const sWmScale = sWmW / wmMeta!.width!;
  const sWmH = wmMeta!.height! * sWmScale;
  const sWm = await sharp(wordmarkBuffer).resize(Math.round(sWmW), Math.round(sWmH)).toBuffer();
  
  const sGap = 25;
  const sTotalH = sIconH + sGap + sWmH;
  const sTop = (sSize - sTotalH) / 2;
  
  const stacked = await sharp({
    create: { width: sSize, height: sSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([
    { input: sIcon, top: Math.round(sTop), left: Math.round((sSize - sIconH) / 2) },
    { input: sWm, top: Math.round(sTop + sIconH + sGap), left: Math.round((sSize - sWmW) / 2) }
  ])
  .png().toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "stacked.png"), stacked);
  console.log("✓ stacked.png");
  
  // HORIZONTAL - icon fills 85% height
  const hW = 3000, hH = 1000;
  const hIconSz = hH * 0.85;
  const hIcon = await sharp(finalIcon).resize(Math.round(hIconSz), Math.round(hIconSz)).toBuffer();
  
  const hWmH = hH * 0.32;
  const hWmScale = hWmH / wmMeta!.height!;
  const hWmW = wmMeta!.width! * hWmScale;
  const hWm = await sharp(wordmarkBuffer).resize(Math.round(hWmW), Math.round(hWmH)).toBuffer();
  
  const hGap = 50;
  const hTotW = hIconSz + hGap + hWmW;
  const hLeft = (hW - hTotW) / 2;
  
  const horiz = await sharp({
    create: { width: hW, height: hH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([
    { input: hIcon, top: Math.round((hH - hIconSz) / 2), left: Math.round(hLeft) },
    { input: hWm, top: Math.round((hH - hWmH) / 2), left: Math.round(hLeft + hIconSz + hGap) }
  ])
  .png().toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "horizontal.png"), horiz);
  console.log("✓ horizontal.png");
  
  console.log("\n✅ Tight trim complete!");
}

main().catch(console.error);
