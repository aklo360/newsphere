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

export interface GfxResult {
  path: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export async function generateGfx(
  brandSystemPath: string,
  prompt: string,
  copy?: string,
  options: GfxOptions = {}
): Promise<GfxResult> {
  const { platform, width, height, format = "png", aspectRatio, jobId } = options;
  
  // If no copy provided, use prompt as the concept (AI will generate appropriate text)
  const effectiveCopy = copy || "";

  // Load brand system (support both local path and URL)
  let brandSystem: BrandSystem;
  let brandDir: string;
  
  if (brandSystemPath.startsWith("http")) {
    const response = await fetch(brandSystemPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch brand-system.json: ${response.status}`);
    }
    brandSystem = await response.json();
    // For URL-based brand systems, use a temp directory
    const brandSlug = (brandSystem.brand?.name || brandSystem.brandName || "gfx").toLowerCase().replace(/[^a-z0-9]/g, "-");
    brandDir = path.resolve(process.cwd(), `output/${brandSlug}`);
  } else {
    if (!fs.existsSync(brandSystemPath)) {
      throw new Error(`Brand system not found: ${brandSystemPath}`);
    }
    brandSystem = JSON.parse(fs.readFileSync(brandSystemPath, "utf-8"));
    brandDir = path.dirname(brandSystemPath);
  }
  
  // Create output directory
  const outputDir = path.join(brandDir, "gfx");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n${"═".repeat(62)}`);
  console.log(`  OpenGFX On-Brand Graphic Generator`);
  console.log(`  Brand: ${brandSystem.brand.name}`);
  console.log(`${"═".repeat(62)}`);

  // Aspect ratio presets
  const ASPECT_PRESETS: Record<string, { width: number; height: number }> = {
    "1:1": { width: 1024, height: 1024 },
    "4:5": { width: 1024, height: 1280 },
    "5:4": { width: 1280, height: 1024 },
    "9:16": { width: 1024, height: 1820 },
    "16:9": { width: 1820, height: 1024 },
    "3:2": { width: 1536, height: 1024 },
    "2:3": { width: 1024, height: 1536 },
    "21:9": { width: 2100, height: 900 },
  };

  // Determine dimensions
  let finalWidth = width || 1024;
  let finalHeight = height || 1024;
  let finalAspectRatio = "1:1";

  if (aspectRatio && ASPECT_PRESETS[aspectRatio]) {
    finalWidth = ASPECT_PRESETS[aspectRatio].width;
    finalHeight = ASPECT_PRESETS[aspectRatio].height;
    finalAspectRatio = aspectRatio;
  } else if (aspectRatio) {
    // Parse custom ratio
    const match = aspectRatio.match(/^(\d+):(\d+)$/);
    if (match) {
      const w = parseInt(match[1], 10);
      const h = parseInt(match[2], 10);
      const scale = 1024 / Math.max(w, h);
      finalWidth = Math.round(w * scale);
      finalHeight = Math.round(h * scale);
      finalAspectRatio = aspectRatio;
    }
  } else if (platform) {
    // Check if it's a social platform
    const socialConfig = SOCIAL_PLATFORMS[platform];
    if (socialConfig?.banner) {
      finalWidth = socialConfig.banner.width;
      finalHeight = socialConfig.banner.height;
    } else if (PRESET_DIMENSIONS[platform]) {
      finalWidth = PRESET_DIMENSIONS[platform].width;
      finalHeight = PRESET_DIMENSIONS[platform].height;
    }
    finalAspectRatio = `${finalWidth}:${finalHeight}`;
  }

  console.log(`\n[INFO] Dimensions: ${finalWidth}x${finalHeight} (${finalAspectRatio})`);
  if (effectiveCopy) {
    console.log(`[INFO] Copy: "${effectiveCopy.substring(0, 50)}${effectiveCopy.length > 50 ? '...' : ''}"`);
  } else {
    console.log(`[INFO] Copy: (AI will generate appropriate text from prompt)`);
  }

  // Get render style prompt
  const stylePrompt = brandSystem.renderStyle?.preset === "custom" && brandSystem.renderStyle?.customPrompt
    ? brandSystem.renderStyle.customPrompt
    : RENDER_STYLE_PROMPTS[brandSystem.renderStyle?.preset || "gradient"] || RENDER_STYLE_PROMPTS.gradient;

  // Load horizontal logo as reference (if available)
  let base64Logo: string | undefined;
  if (brandSystem.logo?.horizontal) {
    const logoPath = path.join(brandDir, brandSystem.logo.horizontal);
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      base64Logo = logoData.toString("base64");
    }
  }

  // Build the generation prompt
  const textSection = effectiveCopy 
    ? `TEXT TO INCLUDE (use EXACT text):\n${effectiveCopy}`
    : `Based on the request, create appropriate text/copy for the graphic. Keep it concise and impactful.`;

  const fullPrompt = `Create a professional marketing graphic for the brand "${brandSystem.brand?.name || brandSystem.brandName}".

USER REQUEST: ${prompt}

${textSection}

DIMENSIONS: ${finalWidth}x${finalHeight} pixels (${finalAspectRatio} aspect ratio)

BRAND STYLE GUIDE:

Colors:
- Primary: ${brandSystem.colors.primary}
- Secondary: ${brandSystem.colors.secondary}
- Accent: ${brandSystem.colors.accent || brandSystem.colors.primary}
- Background: ${brandSystem.colors.background}
- Foreground: ${brandSystem.colors.foreground}

Typography:
- Headlines: ${brandSystem.typography?.headerFont || "Inter"} (weight ${brandSystem.typography?.headerWeight || 700})
- Body text: ${brandSystem.typography?.bodyFont || "Inter"} (weight ${brandSystem.typography?.bodyWeight || 400})

Visual Style:
${stylePrompt}

Brand Mode: ${brandSystem.mode || "light"} (${brandSystem.mode === "dark" ? "dark background, light text" : "light background, dark text"})

REQUIREMENTS:
1. Use the brand colors consistently
2. Apply the brand's visual style/aesthetic
3. ${effectiveCopy ? "Include ALL the specified text, rendered clearly and legibly" : "Generate concise, impactful text based on the request"}
4. The brand logo can be subtly included if appropriate
5. Professional, polished finish suitable for marketing
6. Clean composition with proper hierarchy
7. Text should be prominent and easy to read
8. Ensure proper contrast for legibility

Create a stunning on-brand graphic.`;

  console.log(`\n[GENERATING] Creating on-brand graphic...`);

  // Build request parts
  const parts: any[] = [];
  if (base64Logo) {
    parts.push({ inlineData: { mimeType: "image/png", data: base64Logo } });
  }
  parts.push({ text: fullPrompt });

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts }],
    config: { 
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      imageConfig: { imageSize: finalWidth > 1500 || finalHeight > 1500 ? '2K' : '1K' }
    },
  });

  const responseParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of responseParts) {
    if (part.inlineData?.data) {
      // Generate unique filename
      const timestamp = Date.now();
      const safeName = prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      const filename = jobId ? `${jobId}.${format}` : `gfx-${safeName}-${timestamp}.${format}`;
      const outputPath = path.join(outputDir, filename);
      
      const buffer = Buffer.from(part.inlineData.data, "base64");
      
      // Resize to exact dimensions using sharp
      const sharp = (await import("sharp")).default;
      await sharp(buffer)
        .resize(finalWidth, finalHeight, { fit: "cover", position: "center" })
        .toFile(outputPath);

      console.log(`\n${"═".repeat(62)}`);
      console.log(`  ✓ GRAPHIC COMPLETE`);
      console.log(`  Output: ${outputPath}`);
      console.log(`  Dimensions: ${finalWidth}x${finalHeight}`);
      console.log(`${"═".repeat(62)}\n`);

      const result: GfxResult = {
        path: outputPath,
        width: finalWidth,
        height: finalHeight,
        aspectRatio: finalAspectRatio,
      };
      
      // Output for gateway parsing
      console.log(`GFX_RESULT:${JSON.stringify(result)}`);

      return result;
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
