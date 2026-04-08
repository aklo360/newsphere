import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";

const OUTPUT_DIR = "./output/dexter/logo";

async function main() {
  const iconPath = path.join(OUTPUT_DIR, "icon.png");
  const origBuffer = fs.readFileSync(iconPath);
  
  // Convert white to transparent
  const { data, info } = await sharp(origBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Make white pixels transparent
  const newData = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    
    if (r > 250 && g > 250 && b > 250) {
      // White -> transparent
      newData[i] = 255;
      newData[i + 1] = 255;
      newData[i + 2] = 255;
      newData[i + 3] = 0;
    } else {
      // Keep as is
      newData[i] = r;
      newData[i + 1] = g;
      newData[i + 2] = b;
      newData[i + 3] = 255;
    }
  }
  
  const transparentIcon = await sharp(newData, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
  .trim() // trim transparent edges
  .toBuffer();
  
  const trimMeta = await sharp(transparentIcon).metadata();
  console.log(`Trimmed: ${trimMeta.width}x${trimMeta.height}`);
  
  // Make square with tiny padding
  const maxDim = Math.max(trimMeta.width!, trimMeta.height!);
  const pad = Math.round(maxDim * 0.01); // 1% pad
  const size = maxDim + pad * 2;
  
  // Save transparent version
  const squareTransparent = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
  .composite([{
    input: transparentIcon,
    top: Math.round((size - trimMeta.height!) / 2),
    left: Math.round((size - trimMeta.width!) / 2)
  }])
  .resize(1024, 1024)
  .png()
  .toBuffer();
  
  // Save a WHITE background version for the standalone icon file
  const whiteIcon = await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
  .composite([{ input: squareTransparent }])
  .png()
  .toBuffer();
  
  fs.writeFileSync(iconPath, whiteIcon);
  console.log("✓ icon.png (white bg)");
  
  // Now make lockups using the TRANSPARENT icon
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
  
  // STACKED - white bg, composite transparent icon
  const sSize = 1024;
  const sIconH = sSize * 0.62;
  const sIcon = await sharp(squareTransparent).resize(Math.round(sIconH), Math.round(sIconH)).png().toBuffer();
  
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
  
  // HORIZONTAL
  const hW = 3000, hH = 1000;
  const hIconSz = hH * 0.82;
  const hIcon = await sharp(squareTransparent).resize(Math.round(hIconSz), Math.round(hIconSz)).png().toBuffer();
  
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
  
  console.log("\n✅ Clean lockups with transparent compositing!");
}

main().catch(console.error);
