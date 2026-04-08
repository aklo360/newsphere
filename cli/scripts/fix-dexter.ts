import { createCanvas, registerFont } from "canvas";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const OUTPUT_DIR = "./output/dexter/logo";

async function main() {
  // Register font
  const fontPath = "./assets/fonts/SpaceGrotesk-SemiBold.ttf";
  if (fs.existsSync(fontPath)) {
    registerFont(fontPath, { family: "Space Grotesk", weight: "600" });
  }
  
  // Create canvas for wordmark
  const canvas = createCanvas(1200, 300);
  const ctx = canvas.getContext("2d");
  
  // White background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 1200, 300);
  
  // Black text
  ctx.fillStyle = "#000000";
  ctx.font = "600 200px 'Space Grotesk'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Dexter", 600, 150);
  
  // Save wordmark
  const wordmarkBuffer = canvas.toBuffer("image/png");
  
  // Trim whitespace
  const trimmed = await sharp(wordmarkBuffer)
    .trim()
    .png()
    .toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "wordmark.png"), trimmed);
  console.log("✓ wordmark.png (text only)");
  
  // Get metadata
  const iconPath = path.join(OUTPUT_DIR, "icon.png");
  const iconMeta = await sharp(iconPath).metadata();
  const wordmarkMeta = await sharp(trimmed).metadata();
  const iconBuffer = fs.readFileSync(iconPath);
  
  console.log(`   Icon: ${iconMeta!.width}x${iconMeta!.height}`);
  console.log(`   Wordmark: ${wordmarkMeta!.width}x${wordmarkMeta!.height}`);
  
  // === STACKED LOCKUP ===
  const stackedSize = 1024;
  const iconTargetHeight = stackedSize * 0.55;
  const iconScale = iconTargetHeight / iconMeta!.height!;
  const iconWidth = Math.round(iconMeta!.width! * iconScale);
  const iconHeight = Math.round(iconTargetHeight);
  
  const resizedIcon = await sharp(iconBuffer)
    .resize(iconWidth, iconHeight, { fit: "inside" })
    .toBuffer();
  
  const wordmarkTargetWidth = stackedSize * 0.7;
  const wordmarkScaleW = wordmarkTargetWidth / wordmarkMeta!.width!;
  const wordmarkWidth = Math.round(wordmarkTargetWidth);
  const wordmarkHeight = Math.round(wordmarkMeta!.height! * wordmarkScaleW);
  
  const resizedWordmark = await sharp(trimmed)
    .resize(wordmarkWidth, wordmarkHeight, { fit: "inside" })
    .toBuffer();
  
  const gap = 40;
  const totalHeight = iconHeight + gap + wordmarkHeight;
  const topOffset = Math.round((stackedSize - totalHeight) / 2);
  
  const stacked = await sharp({
    create: { width: stackedSize, height: stackedSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([
    { input: resizedIcon, top: topOffset, left: Math.round((stackedSize - iconWidth) / 2) },
    { input: resizedWordmark, top: topOffset + iconHeight + gap, left: Math.round((stackedSize - wordmarkWidth) / 2) }
  ])
  .png()
  .toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "stacked.png"), stacked);
  console.log("✓ stacked.png");
  
  // === HORIZONTAL LOCKUP ===
  const horizWidth = 3000;
  const horizHeight = 1000;
  const padding = horizHeight * 0.15;
  
  const horizIconHeight = horizHeight - (padding * 2);
  const horizIconScale = horizIconHeight / iconMeta!.height!;
  const horizIconWidth = Math.round(iconMeta!.width! * horizIconScale);
  
  const horizIcon = await sharp(iconBuffer)
    .resize(horizIconWidth, Math.round(horizIconHeight), { fit: "inside" })
    .toBuffer();
  
  const horizWordmarkHeight = horizHeight * 0.3;
  const horizWordmarkScale = horizWordmarkHeight / wordmarkMeta!.height!;
  const horizWordmarkWidth = Math.round(wordmarkMeta!.width! * horizWordmarkScale);
  
  const horizWordmark = await sharp(trimmed)
    .resize(horizWordmarkWidth, Math.round(horizWordmarkHeight), { fit: "inside" })
    .toBuffer();
  
  const horizGap = 80;
  const totalWidth = horizIconWidth + horizGap + horizWordmarkWidth;
  const leftOffset = Math.round((horizWidth - totalWidth) / 2);
  
  const horizontal = await sharp({
    create: { width: horizWidth, height: horizHeight, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([
    { input: horizIcon, top: Math.round(padding), left: leftOffset },
    { input: horizWordmark, top: Math.round((horizHeight - horizWordmarkHeight) / 2), left: leftOffset + horizIconWidth + horizGap }
  ])
  .png()
  .toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "horizontal.png"), horizontal);
  console.log("✓ horizontal.png");
  
  console.log("\n✅ Logo package fixed - pure black icon + text wordmark!");
}

main().catch(console.error);
