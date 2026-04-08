import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";

const OUTPUT_DIR = "./output/dexter/logo";

async function main() {
  // Load the cleaned icon we just saved
  const iconPath = path.join(OUTPUT_DIR, "icon.png");
  const cleanIcon = fs.readFileSync(iconPath);
  console.log("Using cleaned icon");
  
  // Wordmark with correct font path
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
  
  console.log("\n✅ Done!");
}

main().catch(console.error);
