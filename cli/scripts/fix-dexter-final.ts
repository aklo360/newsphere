import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";

const OUTPUT_DIR = "./output/dexter/logo";

async function main() {
  // Regenerate icon from scratch with AI
  console.log("Regenerating icon with tight crop...\n");
  
  // For now, work with existing icon but fix the whitespace issue
  const iconPath = path.join(OUTPUT_DIR, "icon.png");
  const iconBuffer = fs.readFileSync(iconPath);
  
  // Convert to raw, find bounds, and ensure PURE white background
  const { data, info } = await sharp(iconBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Find content bounds (anything not pure white)
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4; // RGBA
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      
      // If not white (255,255,255)
      if (r < 252 || g < 252 || b < 252) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  // Add 1px safety margin
  minX = Math.max(0, minX - 1);
  minY = Math.max(0, minY - 1);
  maxX = Math.min(info.width - 1, maxX + 1);
  maxY = Math.min(info.height - 1, maxY + 1);
  
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  console.log(`Content: ${cw}x${ch}`);
  
  // Extract and ensure pure white bg
  const cropped = await sharp(iconBuffer)
    .extract({ left: minX, top: minY, width: cw, height: ch })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toBuffer();
  
  // Make square with 3% padding
  const maxDim = Math.max(cw, ch);
  const pad = Math.round(maxDim * 0.03);
  const size = maxDim + pad * 2;
  
  console.log(`Final: ${size}x${size} (${pad}px = 3% pad)`);
  
  const finalIcon = await sharp({
    create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
  .composite([{
    input: cropped,
    top: Math.round((size - ch) / 2),
    left: Math.round((size - cw) / 2)
  }])
  .resize(1024, 1024)
  .jpeg({ quality: 100 }) // Use JPEG to avoid PNG transparency issues
  .toBuffer();
  
  // Save as PNG but from clean JPEG base
  const cleanIcon = await sharp(finalIcon).png().toBuffer();
  fs.writeFileSync(iconPath, cleanIcon);
  console.log("✓ icon.png (clean)");
  
  // Wordmark
  registerFont("./assets/fonts/SpaceGrotesk-SemiBold.ttf", { family: "Space Grotesk" });
  const canvas = createCanvas(800, 200);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 800, 200);
  ctx.fillStyle = "#000000";
  ctx.font = "600 160px 'Space Grotesk'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Dexter", 400, 100);
  
  const wmRaw = canvas.toBuffer("image/png");
  const wmTrimmed = await sharp(wmRaw).trim().png().toBuffer();
  const wmMeta = await sharp(wmTrimmed).metadata();
  fs.writeFileSync(path.join(OUTPUT_DIR, "wordmark.png"), wmTrimmed);
  console.log("✓ wordmark.png");
  
  // === STACKED ===
  const sSize = 1024;
  const sIconH = sSize * 0.62;
  const sIcon = await sharp(cleanIcon).resize(Math.round(sIconH), Math.round(sIconH)).png().toBuffer();
  
  const sWmW = sSize * 0.78;
  const sWmH = wmMeta!.height! * (sWmW / wmMeta!.width!);
  const sWm = await sharp(wmTrimmed).resize(Math.round(sWmW), Math.round(sWmH)).png().toBuffer();
  
  const sGap = 20;
  const sTot = sIconH + sGap + sWmH;
  const sTop = (sSize - sTot) / 2;
  
  const stacked = await sharp({
    create: { width: sSize, height: sSize, channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
  .composite([
    { input: sIcon, top: Math.round(sTop), left: Math.round((sSize - sIconH) / 2) },
    { input: sWm, top: Math.round(sTop + sIconH + sGap), left: Math.round((sSize - sWmW) / 2) }
  ])
  .png().toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "stacked.png"), stacked);
  console.log("✓ stacked.png");
  
  // === HORIZONTAL ===
  const hW = 3000, hH = 1000;
  const hIconSz = hH * 0.82;
  const hIcon = await sharp(cleanIcon).resize(Math.round(hIconSz), Math.round(hIconSz)).png().toBuffer();
  
  const hWmH = hH * 0.30;
  const hWmW = wmMeta!.width! * (hWmH / wmMeta!.height!);
  const hWm = await sharp(wmTrimmed).resize(Math.round(hWmW), Math.round(hWmH)).png().toBuffer();
  
  const hGap = 40;
  const hTot = hIconSz + hGap + hWmW;
  const hLeft = (hW - hTot) / 2;
  
  const horiz = await sharp({
    create: { width: hW, height: hH, channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
  .composite([
    { input: hIcon, top: Math.round((hH - hIconSz) / 2), left: Math.round(hLeft) },
    { input: hWm, top: Math.round((hH - hWmH) / 2), left: Math.round(hLeft + hIconSz + hGap) }
  ])
  .png().toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "horizontal.png"), horiz);
  console.log("✓ horizontal.png");
  
  console.log("\n✅ Logo package finalized!");
}

main().catch(console.error);
