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

import type { BrandSystem, SocialsManifest, SocialsOptions, BYOLInput, RenderStylePreset } from "../types.js";
import * as https from "https";
import * as http from "http";
import { analyzeLogoColors } from "../ai.js";
import { SOCIAL_PLATFORMS } from "../constants.js";
import { generateRenderedAvatarWithStyle, generateBannerWithStyle, adaptBannerAspectRatio } from "../ai.js";

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
  const wordmarkPath = path.join(brandDir, brandSystem.logo.wordmark);

  // Determine which platforms to generate
  const targetPlatforms = platforms || Object.keys(SOCIAL_PLATFORMS);

  const avatarPaths: Record<string, string> = {};
  const bannerPaths: Record<string, string> = {};

  // ─── STEP 1: GENERATE AVATAR + CAPTURE STYLE BLOCK ───
  console.log(`\n[1/2] Generating avatar (1K rendered style)...`);
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

  // Generate ACP-ready avatar (400x400, <50KB JPEG)
  const acpAvatarPath = path.join(avatarsDir, "avatar-acp.jpg");
  await sharp(masterAvatarPath)
    .resize(400, 400, { fit: "cover" })
    .jpeg({ quality: 85 })
    .toFile(acpAvatarPath);
  console.log(`      ✓ avatar-acp.jpg (400x400, ACP-ready)`);

  // Avatar is ready - no platform-specific resizes needed (1K master covers all)
  avatarPaths["master"] = "socials/avatars/avatar-master.png";
  avatarPaths["acp"] = "socials/avatars/avatar-acp.jpg";

  // ─── STEP 2: GENERATE BANNER ───
  console.log(`\n[2/2] Generating banner...`);
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
      masterAvatarPath,  // Pass rendered icon as reference
      wordmarkPath,      // Pass wordmark for exact typography match
      brandSystem.mode || "light"  // Pass mode for contrast rules
    );
    
    bannerPaths[platform] = `socials/banners/${platform}-banner.png`;
    console.log(`      ✓ ${platform}-banner.png`);
  }

  // ─── STEP 3: GENERATE BANNER VARIANTS (OG Card + Community) ───
  const masterBannerPath = path.join(bannersDir, "twitter-banner.png");
  
  if (fs.existsSync(masterBannerPath)) {
    console.log(`\n[3/3] Generating banner variants from master...`);
    
    // OG Card: 1200x628 (1.91:1) - for social media link previews
    const ogCardPath = path.join(bannersDir, "og-card.png");
    console.log(`      Generating OG card (1200x628)...`);
    await adaptBannerAspectRatio(
      masterBannerPath,
      1200,
      628,
      ogCardPath,
      brandSystem.brand.name
    );
    bannerPaths["og-card"] = "socials/banners/og-card.png";
    console.log(`      ✓ og-card.png`);
    
    // Community Banner: 1200x480 (2.5:1) - for Twitter communities
    const communityBannerPath = path.join(bannersDir, "community-banner.png");
    console.log(`      Generating community banner (1200x480)...`);
    await adaptBannerAspectRatio(
      masterBannerPath,
      1200,
      480,
      communityBannerPath,
      brandSystem.brand.name
    );
    bannerPaths["community"] = "socials/banners/community-banner.png";
    console.log(`      ✓ community-banner.png`);
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

// ═══════════════════════════════════════════════════════════════════
// BYOL (BRING YOUR OWN LOGO) MODE
// ═══════════════════════════════════════════════════════════════════

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(dest);
          return downloadFile(redirectUrl, dest).then(resolve).catch(reject);
        }
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

/**
 * Generate social assets from an existing logo (BYOL mode)
 * Creates a temporary brand system and generates assets
 */
export async function generateSocialsFromLogo(
  input: BYOLInput,
  options: SocialsOptions = {}
): Promise<SocialsManifest & { brandSystemPath: string }> {
  const { logoUrl, brandName, tagline, primaryColor, secondaryColor, backgroundColor, renderStyle } = input;
  
  // Create output directory
  const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const outputDir = path.join(__dirname, "..", "..", "output", brandSlug);
  const logoDir = path.join(outputDir, "logo");
  
  fs.mkdirSync(logoDir, { recursive: true });

  console.log(`\n${"═".repeat(62)}`);
  console.log(`  OpenGFX BYOL (Bring Your Own Logo)`);
  console.log(`  Brand: ${brandName}`);
  console.log(`${"═".repeat(62)}`);

  // ─── STEP 1: DOWNLOAD LOGO ───
  console.log(`\n[1/4] Downloading logo...`);
  const iconPath = path.join(logoDir, "icon.png");
  await downloadFile(logoUrl, iconPath);
  console.log(`      ✓ icon.png downloaded`);
  
  // ─── STEP 2: ANALYZE COLORS (if not provided) ───
  let colors = {
    primary: primaryColor || "#000000",
    secondary: secondaryColor || "#666666",
    accent: "#0066FF",
    background: backgroundColor || "#FFFFFF",
    foreground: "#000000",
  };
  
  if (!primaryColor || !secondaryColor) {
    console.log(`[2/4] Analyzing logo colors...`);
    const analyzed = await analyzeLogoColors(iconPath);
    colors = {
      primary: primaryColor || analyzed.primary,
      secondary: secondaryColor || analyzed.secondary,
      accent: analyzed.accent || "#0066FF",
      background: backgroundColor || analyzed.background || "#FFFFFF",
      foreground: analyzed.foreground || "#000000",
    };
    console.log(`      Primary: ${colors.primary}`);
    console.log(`      Secondary: ${colors.secondary}`);
  } else {
    console.log(`[2/4] Using provided colors...`);
  }
  
  // ─── STEP 3: CREATE MINIMAL BRAND SYSTEM ───
  console.log(`[3/4] Creating brand system...`);
  
  // Create a simple wordmark (just text for now - will use icon for avatar)
  const wordmarkPath = path.join(logoDir, "wordmark.png");
  const horizontalPath = path.join(logoDir, "horizontal.png");
  const stackedPath = path.join(logoDir, "stacked.png");
  
  // Copy icon as placeholders (avatar generation uses icon anyway)
  fs.copyFileSync(iconPath, wordmarkPath);
  fs.copyFileSync(iconPath, horizontalPath);
  fs.copyFileSync(iconPath, stackedPath);
  
  const brandSystem: BrandSystem = {
    brand: {
      name: brandName,
      tagline,
      concept: `BYOL brand: ${brandName}`,
    },
    logo: {
      icon: "logo/icon.png",
      wordmark: "logo/wordmark.png",
      stacked: "logo/stacked.png",
      horizontal: "logo/horizontal.png",
    },
    colors,
    typography: {
      headerFont: "Inter",
      headerWeight: 600,
      bodyFont: "Inter",
      bodyWeight: 400,
    },
    renderStyle: {
      preset: (renderStyle as RenderStylePreset) || "flat",
      customPrompt: undefined,
      parameters: {
        material: "plastic",
        finish: "matte",
        lighting: "studio",
        colorMode: "brand",
        depth: "flat",
        effects: [],
      },
    },
    mode: "light",
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
  };
  
  const brandSystemPath = path.join(outputDir, "brand-system.json");
  fs.writeFileSync(brandSystemPath, JSON.stringify(brandSystem, null, 2));
  console.log(`      ✓ brand-system.json created`);
  
  // ─── STEP 4: GENERATE SOCIALS ───
  console.log(`[4/4] Generating social assets...`);
  const manifest = await generateSocials(brandSystemPath, options);
  
  return {
    ...manifest,
    brandSystemPath: "brand-system.json",
  };
}
