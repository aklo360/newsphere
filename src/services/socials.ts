/**
 * OpenGFX Service 2: Socials
 * Generates avatars and banners for all social platforms
 * 
 * KEY PRINCIPLE: ONE rendered icon, used everywhere for consistency
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";
import { fileURLToPath } from "url";

import type { BrandSystem, SocialsManifest, SocialsOptions } from "../types.js";
import { SOCIAL_PLATFORMS, FONT_LIBRARY } from "../constants.js";
import { generateRenderedAvatar } from "../ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fontDir = path.join(__dirname, "..", "..", "fonts");

// Register fonts for banner text
Object.entries(FONT_LIBRARY).forEach(([family, { weights }]) => {
  const filePrefix = family.replace(/ /g, "-");
  weights.forEach((weight) => {
    const paths = [
      path.join(fontDir, `${filePrefix}-${weight}.ttf`),
      path.join(fontDir, `${family.replace(/ /g, "")}-${weight}.ttf`),
    ];
    for (const fontPath of paths) {
      if (fs.existsSync(fontPath)) {
        try {
          registerFont(fontPath, { family, weight: String(weight) });
        } catch {}
        break;
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

async function resizeImage(inputPath: string, outputPath: string, width: number, height: number): Promise<void> {
  await sharp(inputPath)
    .resize(width, height, { fit: "cover", position: "center" })
    .png()
    .toFile(outputPath);
}

/**
 * Composite banner programmatically using the SAME rendered icon
 * This ensures perfect color consistency across all assets
 */
async function compositeBanner(
  renderedIconPath: string,
  brandName: string,
  tagline: string | undefined,
  colors: BrandSystem["colors"],
  typography: BrandSystem["typography"],
  width: number,
  height: number,
  outputPath: string
): Promise<void> {
  // Create gradient background using canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  
  // Create gradient from primary to secondary (or subtle variation)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors.background);
  gradient.addColorStop(0.5, colors.background);
  gradient.addColorStop(1, adjustColor(colors.background, colors.primary, 0.15));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Save background
  const bgBuffer = canvas.toBuffer("image/png");
  
  // Load and resize rendered icon
  const iconMeta = await sharp(renderedIconPath).metadata();
  const iconTargetHeight = Math.round(height * 0.6);
  const iconScale = iconTargetHeight / (iconMeta.height || 1024);
  const iconTargetWidth = Math.round((iconMeta.width || 1024) * iconScale);
  
  const iconBuffer = await sharp(renderedIconPath)
    .resize(iconTargetWidth, iconTargetHeight, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  
  // Calculate positions - icon on left third, text on right
  const iconX = Math.round(width * 0.08);
  const iconY = Math.round((height - iconTargetHeight) / 2);
  
  // Create text overlay with canvas
  const textCanvas = createCanvas(width, height);
  const textCtx = textCanvas.getContext("2d");
  
  // Brand name
  const headerFont = typography.headerFont;
  const headerWeight = typography.headerWeight;
  let fontSize = Math.round(height * 0.25);
  textCtx.font = `${headerWeight} ${fontSize}px "${headerFont}", sans-serif`;
  textCtx.fillStyle = colors.foreground;
  textCtx.textAlign = "left";
  textCtx.textBaseline = "middle";
  
  const textX = iconX + iconTargetWidth + Math.round(width * 0.06);
  const textAreaWidth = width - textX - Math.round(width * 0.08);
  
  // Shrink font if needed
  while (textCtx.measureText(brandName).width > textAreaWidth && fontSize > 30) {
    fontSize -= 4;
    textCtx.font = `${headerWeight} ${fontSize}px "${headerFont}", sans-serif`;
  }
  
  const brandY = tagline ? height * 0.42 : height * 0.5;
  textCtx.fillText(brandName, textX, brandY);
  
  // Tagline if present
  if (tagline) {
    const bodyFont = typography.bodyFont;
    const bodyWeight = typography.bodyWeight;
    const taglineFontSize = Math.round(fontSize * 0.35);
    textCtx.font = `${bodyWeight} ${taglineFontSize}px "${bodyFont}", sans-serif`;
    textCtx.fillStyle = adjustColor(colors.foreground, colors.background, 0.3);
    textCtx.fillText(tagline, textX, height * 0.62);
  }
  
  const textBuffer = textCanvas.toBuffer("image/png");
  
  // Composite everything
  await sharp(bgBuffer)
    .composite([
      { input: iconBuffer, top: iconY, left: iconX },
      { input: textBuffer, top: 0, left: 0 },
    ])
    .png()
    .toFile(outputPath);
}

/**
 * Blend two colors
 */
function adjustColor(base: string, target: string, amount: number): string {
  const parseHex = (hex: string) => {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  };
  
  const b = parseHex(base);
  const t = parseHex(target);
  
  const blend = (bv: number, tv: number) => Math.round(bv + (tv - bv) * amount);
  
  const r = blend(b.r, t.r).toString(16).padStart(2, "0");
  const g = blend(b.g, t.g).toString(16).padStart(2, "0");
  const bl = blend(b.b, t.b).toString(16).padStart(2, "0");
  
  return `#${r}${g}${bl}`;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SERVICE
// ═══════════════════════════════════════════════════════════════════

export async function generateSocials(
  brandSystemPath: string,
  options: SocialsOptions = {}
): Promise<SocialsManifest> {
  const { platforms, includeTagline = true, taglineOverride } = options;

  // Load brand system
  if (!fs.existsSync(brandSystemPath)) {
    throw new Error(`Brand system not found: ${brandSystemPath}`);
  }
  
  const brandSystem: BrandSystem = JSON.parse(fs.readFileSync(brandSystemPath, "utf-8"));
  const brandDir = path.dirname(brandSystemPath);
  
  // Create output directories
  const outputDir = path.join(brandDir, "socials");
  const avatarsDir = path.join(outputDir, "avatars");
  const bannersDir = path.join(outputDir, "banners");
  
  fs.mkdirSync(avatarsDir, { recursive: true });
  fs.mkdirSync(bannersDir, { recursive: true });

  console.log(`\n${"═".repeat(62)}`);
  console.log(`  OpenGFX Socials Generator`);
  console.log(`  Brand: ${brandSystem.brand.name}`);
  console.log(`${"═".repeat(62)}`);

  const tagline = taglineOverride || brandSystem.brand.tagline;
  const iconPath = path.join(brandDir, brandSystem.logo.icon);
  const horizontalPath = path.join(brandDir, brandSystem.logo.horizontal);

  // Determine which platforms to generate
  const targetPlatforms = platforms || Object.keys(SOCIAL_PLATFORMS);

  const avatarPaths: Record<string, string> = {};
  const bannerPaths: Record<string, string> = {};

  // ─── STEP 1: GENERATE MASTER AVATAR ───
  console.log(`\n[1/3] Generating master avatar (rendered style)...`);
  const masterAvatarPath = path.join(avatarsDir, "avatar-master.png");
  
  await generateRenderedAvatar(
    iconPath,
    brandSystem.renderStyle,
    brandSystem.colors,
    masterAvatarPath
  );
  console.log(`      ✓ avatar-master.png (1024x1024)`);

  // ─── STEP 2: RESIZE AVATARS FOR ALL PLATFORMS ───
  console.log(`\n[2/3] Generating platform-specific avatars...`);
  
  for (const platform of targetPlatforms) {
    const config = SOCIAL_PLATFORMS[platform];
    if (!config) continue;

    const { width, height } = config.profile;
    const outputPath = path.join(avatarsDir, `${platform}-profile.png`);
    
    await resizeImage(masterAvatarPath, outputPath, width, height);
    avatarPaths[platform] = `socials/avatars/${platform}-profile.png`;
    console.log(`      ✓ ${platform}-profile.png (${width}x${height})`);
  }

  // ─── STEP 3: GENERATE BANNERS (using same rendered icon for consistency) ───
  console.log(`\n[3/3] Compositing platform-specific banners...`);
  console.log(`      Using rendered icon for perfect color consistency`);
  
  for (const platform of targetPlatforms) {
    const config = SOCIAL_PLATFORMS[platform];
    if (!config?.banner) continue;

    const { width, height } = config.banner;
    const outputPath = path.join(bannersDir, `${platform}-banner.png`);
    
    console.log(`      Compositing ${platform} banner (${width}x${height})...`);
    
    await compositeBanner(
      masterAvatarPath,  // Use the SAME rendered icon!
      brandSystem.brand.name,
      includeTagline ? tagline : undefined,
      brandSystem.colors,
      brandSystem.typography,
      width,
      height,
      outputPath
    );
    
    bannerPaths[platform] = `socials/banners/${platform}-banner.png`;
    console.log(`      ✓ ${platform}-banner.png`);

    // Generate alternate banner sizes if available
    if (config.bannerAlt) {
      const altWidth = config.bannerAlt.width;
      const altHeight = config.bannerAlt.height;
      const altOutputPath = path.join(bannersDir, `${platform}-banner-alt.png`);
      
      console.log(`      Compositing ${platform} alt banner (${altWidth}x${altHeight})...`);
      
      await compositeBanner(
        masterAvatarPath,
        brandSystem.brand.name,
        includeTagline ? tagline : undefined,
        brandSystem.colors,
        brandSystem.typography,
        altWidth,
        altHeight,
        altOutputPath
      );
      
      bannerPaths[`${platform}-alt`] = `socials/banners/${platform}-banner-alt.png`;
      console.log(`      ✓ ${platform}-banner-alt.png`);
    }
  }

  // ─── STEP 4: CREATE MANIFEST ───
  const manifest: SocialsManifest = {
    brandSystem: "brand-system.json",
    avatars: avatarPaths,
    banners: bannerPaths,
    generatedAt: new Date().toISOString(),
  };

  const manifestPath = path.join(outputDir, "socials-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n${"═".repeat(62)}`);
  console.log(`  ✓ SOCIALS COMPLETE`);
  console.log(`  Avatars: ${Object.keys(avatarPaths).length} platforms`);
  console.log(`  Banners: ${Object.keys(bannerPaths).length} variants`);
  console.log(`  Output: ${outputDir}`);
  console.log(`${"═".repeat(62)}\n`);

  return manifest;
}

// ═══════════════════════════════════════════════════════════════════
// SINGLE PLATFORM GENERATION
// ═══════════════════════════════════════════════════════════════════

export async function generatePlatformAssets(
  brandSystemPath: string,
  platform: string,
  options: SocialsOptions = {}
): Promise<{ avatar?: string; banner?: string }> {
  const config = SOCIAL_PLATFORMS[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}. Available: ${Object.keys(SOCIAL_PLATFORMS).join(", ")}`);
  }

  // Generate only for this platform
  const manifest = await generateSocials(brandSystemPath, {
    ...options,
    platforms: [platform],
  });

  return {
    avatar: manifest.avatars[platform],
    banner: manifest.banners[platform],
  };
}
