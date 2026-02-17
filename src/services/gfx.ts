/**
 * OpenGFX Service 3: On-Brand GFX
 * Generates custom graphics using brand system
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import type { BrandSystem, GfxOptions } from "../types.js";
import { SOCIAL_PLATFORMS, RENDER_STYLE_PROMPTS } from "../constants.js";
import { ai, IMAGE_MODEL } from "../ai.js";
import { Modality } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// PRESET DIMENSIONS
// ═══════════════════════════════════════════════════════════════════

const PRESET_DIMENSIONS: Record<string, { width: number; height: number }> = {
  // Social post formats
  "instagram-square": { width: 1080, height: 1080 },
  "instagram-portrait": { width: 1080, height: 1350 },
  "instagram-story": { width: 1080, height: 1920 },
  "twitter-post": { width: 1200, height: 675 },
  "facebook-post": { width: 1200, height: 630 },
  "linkedin-post": { width: 1200, height: 627 },
  
  // Announcement formats
  "announcement-wide": { width: 1920, height: 1080 },
  "announcement-square": { width: 1200, height: 1200 },
  "marcomms-square": { width: 1200, height: 1200 },
  
  // Web formats
  "og-image": { width: 1200, height: 630 },
  "hero-banner": { width: 1920, height: 600 },
};

// ═══════════════════════════════════════════════════════════════════
// GRAPHIC TYPES
// ═══════════════════════════════════════════════════════════════════

type GraphicType = 
  | "announcement"      // Launch, release, news
  | "feature"           // Feature highlight, explainer
  | "quote"             // Quote card
  | "stats"             // Statistics, metrics
  | "cta"               // Call to action
  | "event"             // Event promotion
  | "custom";           // User-defined

// ═══════════════════════════════════════════════════════════════════
// MAIN SERVICE
// ═══════════════════════════════════════════════════════════════════

export async function generateGfx(
  brandSystemPath: string,
  prompt: string,
  copy: string,
  options: GfxOptions = {}
): Promise<string> {
  const { platform, width, height, format = "png" } = options;

  // Load brand system
  if (!fs.existsSync(brandSystemPath)) {
    throw new Error(`Brand system not found: ${brandSystemPath}`);
  }
  
  const brandSystem: BrandSystem = JSON.parse(fs.readFileSync(brandSystemPath, "utf-8"));
  const brandDir = path.dirname(brandSystemPath);
  
  // Create output directory
  const outputDir = path.join(brandDir, "gfx");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n${"═".repeat(62)}`);
  console.log(`  OpenGFX On-Brand Graphic Generator`);
  console.log(`  Brand: ${brandSystem.brand.name}`);
  console.log(`${"═".repeat(62)}`);

  // Determine dimensions
  let finalWidth = width || 1200;
  let finalHeight = height || 1200;

  if (platform) {
    // Check if it's a social platform
    const socialConfig = SOCIAL_PLATFORMS[platform];
    if (socialConfig?.banner) {
      finalWidth = socialConfig.banner.width;
      finalHeight = socialConfig.banner.height;
    } else if (PRESET_DIMENSIONS[platform]) {
      finalWidth = PRESET_DIMENSIONS[platform].width;
      finalHeight = PRESET_DIMENSIONS[platform].height;
    }
  }

  console.log(`\n[INFO] Dimensions: ${finalWidth}x${finalHeight}`);
  console.log(`[INFO] Copy: "${copy.substring(0, 50)}${copy.length > 50 ? '...' : ''}"`);

  // Get render style prompt
  const stylePrompt = brandSystem.renderStyle.preset === "custom" && brandSystem.renderStyle.customPrompt
    ? brandSystem.renderStyle.customPrompt
    : RENDER_STYLE_PROMPTS[brandSystem.renderStyle.preset] || RENDER_STYLE_PROMPTS.gradient;

  // Load horizontal logo as reference
  const logoPath = path.join(brandDir, brandSystem.logo.horizontal);
  const logoData = fs.readFileSync(logoPath);
  const base64Logo = logoData.toString("base64");

  // Build the generation prompt
  const fullPrompt = `Create a professional marketing graphic for the brand "${brandSystem.brand.name}".

USER REQUEST: ${prompt}

TEXT TO INCLUDE (use EXACT text):
${copy}

DIMENSIONS: ${finalWidth}x${finalHeight} pixels

BRAND STYLE GUIDE:

Colors:
- Primary: ${brandSystem.colors.primary}
- Secondary: ${brandSystem.colors.secondary}
- Accent: ${brandSystem.colors.accent}
- Background: ${brandSystem.colors.background}
- Foreground: ${brandSystem.colors.foreground}

Typography:
- Headlines: ${brandSystem.typography.headerFont} (weight ${brandSystem.typography.headerWeight})
- Body text: ${brandSystem.typography.bodyFont} (weight ${brandSystem.typography.bodyWeight})

Visual Style:
${stylePrompt}

REQUIREMENTS:
1. Use the brand colors consistently
2. Apply the brand's visual style/aesthetic
3. Include ALL the specified text, rendered clearly and legibly
4. The brand logo can be subtly included if appropriate
5. Professional, polished finish suitable for marketing
6. Clean composition with proper hierarchy
7. Text should be prominent and easy to read

Create a stunning on-brand graphic.`;

  console.log(`\n[GENERATING] Creating on-brand graphic...`);

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Logo } },
          { text: fullPrompt }
        ]
      }
    ],
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      // Generate unique filename
      const timestamp = Date.now();
      const safeName = prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      const filename = `gfx-${safeName}-${timestamp}.${format}`;
      const outputPath = path.join(outputDir, filename);
      
      const buffer = Buffer.from(part.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);

      console.log(`\n${"═".repeat(62)}`);
      console.log(`  ✓ GRAPHIC COMPLETE`);
      console.log(`  Output: ${outputPath}`);
      console.log(`${"═".repeat(62)}\n`);

      return outputPath;
    }
  }

  throw new Error("Failed to generate graphic");
}

// ═══════════════════════════════════════════════════════════════════
// QUICK PRESETS
// ═══════════════════════════════════════════════════════════════════

export async function generateAnnouncement(
  brandSystemPath: string,
  headline: string,
  subtext?: string,
  options: GfxOptions = {}
): Promise<string> {
  const copy = subtext ? `${headline}\n\n${subtext}` : headline;
  return generateGfx(
    brandSystemPath,
    "Create an announcement graphic with bold headline",
    copy,
    { ...options, platform: options.platform || "announcement-square" }
  );
}

export async function generateFeatureCard(
  brandSystemPath: string,
  featureTitle: string,
  description: string,
  options: GfxOptions = {}
): Promise<string> {
  return generateGfx(
    brandSystemPath,
    "Create a feature highlight card with icon and description",
    `${featureTitle}\n\n${description}`,
    { ...options, platform: options.platform || "instagram-square" }
  );
}

export async function generateQuoteCard(
  brandSystemPath: string,
  quote: string,
  attribution?: string,
  options: GfxOptions = {}
): Promise<string> {
  const copy = attribution ? `"${quote}"\n\n— ${attribution}` : `"${quote}"`;
  return generateGfx(
    brandSystemPath,
    "Create an elegant quote card",
    copy,
    { ...options, platform: options.platform || "instagram-square" }
  );
}

// ═══════════════════════════════════════════════════════════════════
// LIST AVAILABLE FORMATS
// ═══════════════════════════════════════════════════════════════════

export function listFormats(): void {
  console.log("\n📐 Available Formats:\n");
  
  console.log("Social Platforms (auto-sized from SOCIAL_PLATFORMS):");
  Object.entries(SOCIAL_PLATFORMS).forEach(([name, config]) => {
    if (config.banner) {
      console.log(`  ${name}: ${config.banner.width}x${config.banner.height}`);
    }
  });
  
  console.log("\nPreset Dimensions:");
  Object.entries(PRESET_DIMENSIONS).forEach(([name, { width, height }]) => {
    console.log(`  ${name}: ${width}x${height}`);
  });
  
  console.log("\nOr specify custom: --width 1920 --height 1080\n");
}
