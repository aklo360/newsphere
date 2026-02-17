import { createCanvas, registerFont } from "canvas";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const OUTPUT_DIR = "./output/dexter/logo";

async function main() {
  const iconPath = path.join(OUTPUT_DIR, "icon.png");
  const iconBuffer = fs.readFileSync(iconPath);
  
  // Step 1: Trim all whitespace from icon
  console.log("Trimming icon to character edge...");
  const trimmed = await sharp(iconBuffer)
    .trim({ threshold: 10 }) // trim white/near-white pixels
    .toBuffer();
  
  const trimmedMeta = await sharp(trimmed).metadata();
  console.log(`   Trimmed size: ${trimmedMeta.width}x${trimmedMeta.height}`);
  
  // Step 2: Make it square by adding minimal equal padding
  const maxDim = Math.max(trimmedMeta.width!, trimmedMeta.height!);
  const padding = Math.round(maxDim * 0.05); // 5% padding
  const finalSize = maxDim + (padding * 2);
  
  console.log(`   Final square: ${finalSize}x${finalSize}`);
  
  // Center the trimmed icon in a square canvas
  const squareIcon = await sharp({
    create: {
      width: finalSize,
      height: finalSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{
    input: trimmed,
    top: Math.round((finalSize - trimmedMeta.height!) / 2),
    left: Math.round((finalSize - trimmedMeta.width!) / 2)
  }])
  .png()
  .toBuffer();
  
  // Resize to 1024x1024 for consistency
  const finalIcon = await sharp(squareIcon)
    .resize(1024, 1024, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
  
  fs.writeFileSync(iconPath, finalIcon);
  console.log("✓ icon.png (trimmed, square)");
  
  // Now rebuild lockups with the fixed icon
  const wordmarkPath = path.join(OUTPUT_DIR, "wordmark.png");
  const wordmarkBuffer = fs.readFileSync(wordmarkPath);
  const wordmarkMeta = await sharp(wordmarkBuffer).metadata();
  
  // === STACKED LOCKUP ===
  const stackedSize = 1024;
  const iconTargetHeight = stackedSize * 0.6;
  const iconWidth = Math.round(iconTargetHeight); // square icon
  const iconHeight = Math.round(iconTargetHeight);
  
  const resizedIcon = await sharp(finalIcon)
    .resize(iconWidth, iconHeight, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();
  
  const wordmarkTargetWidth = stackedSize * 0.75;
  const wordmarkScaleW = wordmarkTargetWidth / wordmarkMeta!.width!;
  const wordmarkWidth = Math.round(wordmarkTargetWidth);
  const wordmarkHeight = Math.round(wordmarkMeta!.height! * wordmarkScaleW);
  
  const resizedWordmark = await sharp(wordmarkBuffer)
    .resize(wordmarkWidth, wordmarkHeight, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();
  
  const gap = 30;
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
  const horizPadding = horizHeight * 0.1;
  
  const horizIconSize = horizHeight - (horizPadding * 2);
  
  const horizIcon = await sharp(finalIcon)
    .resize(Math.round(horizIconSize), Math.round(horizIconSize), { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();
  
  const horizWordmarkHeight = horizHeight * 0.28;
  const horizWordmarkScale = horizWordmarkHeight / wordmarkMeta!.height!;
  const horizWordmarkWidth = Math.round(wordmarkMeta!.width! * horizWordmarkScale);
  
  const horizWordmark = await sharp(wordmarkBuffer)
    .resize(horizWordmarkWidth, Math.round(horizWordmarkHeight), { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();
  
  const horizGap = 60;
  const totalW = Math.round(horizIconSize) + horizGap + horizWordmarkWidth;
  const leftOffset = Math.round((horizWidth - totalW) / 2);
  
  const horizontal = await sharp({
    create: { width: horizWidth, height: horizHeight, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
  .composite([
    { input: horizIcon, top: Math.round(horizPadding), left: leftOffset },
    { input: horizWordmark, top: Math.round((horizHeight - horizWordmarkHeight) / 2), left: leftOffset + Math.round(horizIconSize) + horizGap }
  ])
  .png()
  .toBuffer();
  
  fs.writeFileSync(path.join(OUTPUT_DIR, "horizontal.png"), horizontal);
  console.log("✓ horizontal.png");
  
  console.log("\n✅ Icon trimmed & lockups rebuilt!");
}

main().catch(console.error);
