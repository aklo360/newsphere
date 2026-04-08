import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";

const OUTPUT_DIR = "./output/dexter/logo";

async function main() {
  const iconPath = path.join(OUTPUT_DIR, "icon.png");
  const origBuffer = fs.readFileSync(iconPath);
  
  // Step 1: trim the icon aggressively 
  const trimmed = await sharp(origBuffer)
    .trim({ threshold: 5 })
    .toBuffer();
  
  const trimMeta = await sharp(trimmed).metadata();
  console.log(`Trimmed: ${trimMeta.width}x${trimMeta.height}`);
  
  // Make it square with 2% padding, then resize
  const maxDim = Math.max(trimMeta.width!, trimMeta.height!);
  const pad = Math.round(maxDim * 0.02);
  const size = maxDim + pad * 2;
  
  const squareIcon = await sharp({
    create: { width: size, height: size, channels: 3, background: '#FFFFFF' }
  })
  .composite([{
    input: trimmed,
    top: Math.round((size - trimMeta.height!) / 2),
    left: Math.round((size - trimMeta.width!) / 2)
  }])
  .resize(1024, 1024)
  .png()
  .toBuffer();
  
  fs.writeFileSync(iconPath, squareIcon);
  console.log(`✓ icon.png (${size}px square → 1024)`);
  
  // Wordmark
  registerFont("./fonts/Space-Grotesk-600.ttf", { family: "Space Grotesk" });
  const canvas = createCanvas(800, 200);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 800, 200);
  ctx.fillStyle = "#000000";
  ctx.font = "600 160px 'Space Grotesk'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Dexter", 400, 100);
  
  const wmTrimmed = await sharp(canvas.toBuffer("image/png")).trim().png().toBuffer();
  const wmMeta = await sharp(wmTrimmed).metadata();
  fs.writeFileSync(path.join(OUTPUT_DIR, "wordmark.png"), wmTrimmed);
  console.log("✓ wordmark.png");
  
  // Stacked - use flatten to ensure matching white
  const sSize = 1024;
  const sIconH = sSize * 0.65;
  const sIcon = await sharp(squareIcon).resize(Math.round(sIconH), Math.round(sIconH)).flatten({ background: '#FFFFFF' }).png().toBuffer();
  
  const sWmW = sSize * 0.80;
  const sWmH = wmMeta!.height! * (sWmW / wmMeta!.width!);
  const sWm = await sharp(wmTrimmed).resize(Math.round(sWmW), Math.round(sWmH)).flatten({ background: '#FFFFFF' }).png().toBuffer();
  
  const sGap = 15;
  const sTot = sIconH + sGap + sWmH;
  const sTop = (sSize - sTot) / 2;
  
  const stacked = await sharp({
    create: { width: sSize, height: sSize, channels: 3, background: '#FFFFFF' }
  })
  .composite([
    { input: sIcon, top: Math.round(sTop), left: Math.round((sSize - sIconH) / 2) },
    { input: sWm, top: Math.round(sTop + sIconH + sGap), left: Math.round((sSize - sWmW) / 2) }
  ])
  .png().toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "stacked.png"), stacked);
  console.log("✓ stacked.png");
  
  // Horizontal - flush to edges
  const hW = 3000, hH = 1000;
  const hIconSz = hH * 0.88;
  const hIcon = await sharp(squareIcon).resize(Math.round(hIconSz), Math.round(hIconSz)).flatten({ background: '#FFFFFF' }).png().toBuffer();
  
  const hWmH = hH * 0.32;
  const hWmW = wmMeta!.width! * (hWmH / wmMeta!.height!);
  const hWm = await sharp(wmTrimmed).resize(Math.round(hWmW), Math.round(hWmH)).flatten({ background: '#FFFFFF' }).png().toBuffer();
  
  const hGap = 30;
  const hTot = hIconSz + hGap + hWmW;
  const hLeft = (hW - hTot) / 2;
  
  const horiz = await sharp({
    create: { width: hW, height: hH, channels: 3, background: '#FFFFFF' }
  })
  .composite([
    { input: hIcon, top: Math.round((hH - hIconSz) / 2), left: Math.round(hLeft) },
    { input: hWm, top: Math.round((hH - hWmH) / 2), left: Math.round(hLeft + hIconSz + hGap) }
  ])
  .png().toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "horizontal.png"), horiz);
  console.log("✓ horizontal.png");
  
  console.log("\n✅ Logo package complete!");
}

main().catch(console.error);
