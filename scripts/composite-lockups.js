#!/usr/bin/env node
/**
 * Composite lockups from icon.png + wordmark.png
 * Ensures visual consistency across all assets
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function compositeLockups(brandDir) {
  const iconPath = path.join(brandDir, "icon.png");
  const wordmarkPath = path.join(brandDir, "wordmark.png");

  if (!fs.existsSync(iconPath) || !fs.existsSync(wordmarkPath)) {
    throw new Error("Missing icon.png or wordmark.png");
  }

  console.log(`Compositing lockups for ${brandDir}...`);

  // Load source images
  const icon = sharp(iconPath);
  const wordmark = sharp(wordmarkPath);

  const iconMeta = await icon.metadata();
  const wordmarkMeta = await wordmark.metadata();

  // ═══════════════════════════════════════════════════════════════
  // STACKED LOCKUP (1:1, 1024x1024)
  // Icon ~55% height, wordmark ~20% height, rest is padding
  // ═══════════════════════════════════════════════════════════════
  const stackedSize = 1024;
  const stackedIconSize = Math.round(stackedSize * 0.50);
  const stackedWordmarkHeight = Math.round(stackedSize * 0.12);
  const stackedWordmarkWidth = Math.round(stackedWordmarkHeight * (wordmarkMeta.width / wordmarkMeta.height));

  const iconResized = await sharp(iconPath)
    .resize(stackedIconSize, stackedIconSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer();

  const wordmarkResizedStacked = await sharp(wordmarkPath)
    .resize(stackedWordmarkWidth, stackedWordmarkHeight, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer();

  const iconTop = Math.round(stackedSize * 0.15);
  const wordmarkTop = iconTop + stackedIconSize + Math.round(stackedSize * 0.08);

  await sharp({
    create: {
      width: stackedSize,
      height: stackedSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      { input: iconResized, top: iconTop, left: Math.round((stackedSize - stackedIconSize) / 2) },
      { input: wordmarkResizedStacked, top: wordmarkTop, left: Math.round((stackedSize - stackedWordmarkWidth) / 2) }
    ])
    .png()
    .toFile(path.join(brandDir, "stacked.png"));

  console.log("  ✓ stacked.png");

  // ═══════════════════════════════════════════════════════════════
  // HORIZONTAL LOCKUP (3:1, 1536x512)
  // Icon on left, wordmark on right
  // ═══════════════════════════════════════════════════════════════
  const horizWidth = 1536;
  const horizHeight = 512;
  const horizIconSize = Math.round(horizHeight * 0.65);
  const horizWordmarkHeight = Math.round(horizHeight * 0.25);
  const horizWordmarkWidth = Math.round(horizWordmarkHeight * (wordmarkMeta.width / wordmarkMeta.height));

  const iconResizedHoriz = await sharp(iconPath)
    .resize(horizIconSize, horizIconSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer();

  const wordmarkResizedHoriz = await sharp(wordmarkPath)
    .resize(horizWordmarkWidth, horizWordmarkHeight, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer();

  const horizPadding = Math.round(horizWidth * 0.08);
  const iconLeft = horizPadding;
  const wordmarkLeft = iconLeft + horizIconSize + Math.round(horizWidth * 0.04);

  await sharp({
    create: {
      width: horizWidth,
      height: horizHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      { input: iconResizedHoriz, top: Math.round((horizHeight - horizIconSize) / 2), left: iconLeft },
      { input: wordmarkResizedHoriz, top: Math.round((horizHeight - horizWordmarkHeight) / 2), left: wordmarkLeft }
    ])
    .png()
    .toFile(path.join(brandDir, "horizontal.png"));

  console.log("  ✓ horizontal.png");
  console.log("Done.");
}

const brandDir = process.argv[2];
if (!brandDir) {
  console.error("Usage: node composite-lockups.js <brand-output-dir>");
  process.exit(1);
}

compositeLockups(brandDir).catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
