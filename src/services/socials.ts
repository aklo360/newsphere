/**
 * OpenGFX Service 2: Socials
 * Generates avatars and banners for all social platforms
 * 
 * KEY PRINCIPLE: ONE style prompt block, used everywhere for consistency
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

import type { BrandSystem, SocialsManifest, SocialsOptions } from "../types.js";
import { SOCIAL_PLATFORMS } from "../constants.js";
import { generateRenderedAvatarWithStyle, generateBannerWithStyle } from "../ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

async function resizeImage(inputPath: string, outputPath: string, width: number, height: number): Promise<void> {
  await sharp(inputPath)
    .resize(width, height, { fit: "cover", position: "center" })
    .png()
    .toFile(outputPath);
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

  // ─── STEP 1: GENERATE MASTER AVATAR + CAPTURE STYLE BLOCK ───
  console.log(`\n[1/3] Generating master avatar (rendered style)...`);
  const masterAvatarPath = path.join(avatarsDir, "avatar-master.png");
  
  // Generate avatar and get the detailed style block for reuse
  const { path: avatarPath, styleBlock } = await generateRenderedAvatarWithStyle(
    iconPath,
    brandSystem.renderStyle,
    brandSystem.colors,
    masterAvatarPath
  );
  
  // Save style block for consistency across all assets
  const styleBlockPath = path.join(outputDir, "icon-style-block.txt");
  fs.writeFileSync(styleBlockPath, styleBlock);
  console.log(`      ✓ avatar-master.png (1024x1024)`);
  console.log(`      ✓ icon-style-block.txt (for banner consistency)`);

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

  // ─── STEP 3: GENERATE BANNERS (using SAME style block for consistency) ───
  console.log(`\n[3/3] Generating platform-specific banners...`);
  console.log(`      Using shared icon style block for color consistency`);
  
  for (const platform of targetPlatforms) {
    const config = SOCIAL_PLATFORMS[platform];
    if (!config?.banner) continue;

    const { width, height } = config.banner;
    const outputPath = path.join(bannersDir, `${platform}-banner.png`);
    
    console.log(`      Generating ${platform} banner (${width}x${height})...`);
    
    await generateBannerWithStyle(
      horizontalPath,
      brandSystem.brand.name,
      includeTagline ? tagline : undefined,
      brandSystem.renderStyle,
      brandSystem.colors,
      brandSystem.typography,
      styleBlock,
      width,
      height,
      outputPath,
      masterAvatarPath  // Pass rendered icon as reference
    );
    
    bannerPaths[platform] = `socials/banners/${platform}-banner.png`;
    console.log(`      ✓ ${platform}-banner.png`);

    // Generate alternate banner sizes if available
    if (config.bannerAlt) {
      const altWidth = config.bannerAlt.width;
      const altHeight = config.bannerAlt.height;
      const altOutputPath = path.join(bannersDir, `${platform}-banner-alt.png`);
      
      console.log(`      Generating ${platform} alt banner (${altWidth}x${altHeight})...`);
      
      await generateBannerWithStyle(
        horizontalPath,
        brandSystem.brand.name,
        includeTagline ? tagline : undefined,
        brandSystem.renderStyle,
        brandSystem.colors,
        brandSystem.typography,
        styleBlock,
        altWidth,
        altHeight,
        altOutputPath,
        masterAvatarPath  // Pass rendered icon as reference
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
