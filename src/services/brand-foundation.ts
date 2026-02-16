/**
 * OpenGFX Service 1: Brand Foundation
 * Generates complete brand system with logo + style guide
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";
import { fileURLToPath } from "url";

import type {
  BrandSystem,
  BrandFoundationOptions,
  RenderStyle,
  ColorPalette,
  Typography,
} from "../types.js";

import { FONT_LIBRARY, INSTALLED_FONTS, ICON_STYLE_PROMPT, WORDMARK_STYLE_PROMPT } from "../constants.js";
import { analyzeBrandIntent, analyzeStyleGuide, generateImage } from "../ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fontDir = path.join(__dirname, "..", "..", "fonts");

// Register all fonts
Object.entries(FONT_LIBRARY).forEach(([family, { weights }]) => {
  const filePrefix = family.replace(/ /g, "-");
  weights.forEach((weight) => {
    const paths = [
      path.join(fontDir, `${filePrefix}-${weight}.ttf`),
      path.join(fontDir, `${family.replace(/ /g, "")}-${weight}.ttf`),
    ];
    for (const fontPath of paths) {
      if (fs.existsSync(fontPath)) {
        registerFont(fontPath, { family, weight: String(weight) });
        break;
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// WORDMARK RENDERING
// ═══════════════════════════════════════════════════════════════════

function renderWordmark(
  brandName: string,
  outputPath: string,
  fontFamily: string,
  fontWeight: number
): string {
  const canvasWidth = 2048;
  const canvasHeight = 512;
  
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  let fontSize = 400;
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  let textWidth = ctx.measureText(brandName).width;
  
  while (textWidth > canvasWidth * 0.90 && fontSize > 50) {
    fontSize -= 10;
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
    textWidth = ctx.measureText(brandName).width;
  }
  
  ctx.fillText(brandName, canvasWidth / 2, canvasHeight / 2);
  
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
  
  return outputPath;
}

// ═══════════════════════════════════════════════════════════════════
// LOCKUP COMPOSITING
// ═══════════════════════════════════════════════════════════════════

function hasDescenders(text: string): boolean {
  const descenderLetters = ["g", "j", "p", "q", "y"];
  return descenderLetters.some(letter => text.includes(letter));
}

async function compositeStacked(outputDir: string): Promise<string> {
  const iconPath = path.join(outputDir, "icon.png");
  const wordmarkPath = path.join(outputDir, "wordmark.png");
  const outPath = path.join(outputDir, "stacked.png");

  const canvasSize = 1024;
  
  const iconTrimmed = await sharp(iconPath).trim().toBuffer();
  const wmTrimmed = await sharp(wordmarkPath).trim().toBuffer();
  
  const iconMeta = await sharp(iconTrimmed).metadata();
  const wmMeta = await sharp(wmTrimmed).metadata();
  
  if (!iconMeta.width || !iconMeta.height || !wmMeta.width || !wmMeta.height) {
    throw new Error("Could not read image metadata");
  }
  
  const iconTargetWidth = Math.round(canvasSize * 0.40);
  const iconScale = iconTargetWidth / iconMeta.width;
  const iconTargetHeight = Math.round(iconMeta.height * iconScale);
  
  const wmTargetWidth = Math.round(canvasSize * 0.75);
  const wmScale = wmTargetWidth / wmMeta.width;
  const wmTargetHeight = Math.round(wmMeta.height * wmScale);
  
  const gap = Math.round(canvasSize * 0.04);
  const totalHeight = iconTargetHeight + gap + wmTargetHeight;
  const startY = Math.round((canvasSize - totalHeight) / 2);
  
  const iconBuf = await sharp(iconTrimmed)
    .resize(iconTargetWidth, iconTargetHeight, { fit: "fill" })
    .toBuffer();
    
  const wmBuf = await sharp(wmTrimmed)
    .resize(wmTargetWidth, wmTargetHeight, { fit: "fill" })
    .toBuffer();

  await sharp({ create: { width: canvasSize, height: canvasSize, channels: 3, background: "#ffffff" } })
    .composite([
      { input: iconBuf, top: startY, left: Math.round((canvasSize - iconTargetWidth) / 2) },
      { input: wmBuf, top: startY + iconTargetHeight + gap, left: Math.round((canvasSize - wmTargetWidth) / 2) }
    ])
    .png()
    .toFile(outPath);

  return outPath;
}

async function compositeHorizontal(outputDir: string, brandName: string): Promise<string> {
  const iconPath = path.join(outputDir, "icon.png");
  const wordmarkPath = path.join(outputDir, "wordmark.png");
  const outPath = path.join(outputDir, "horizontal.png");

  const iconTrimmed = await sharp(iconPath).trim().toBuffer();
  const wmTrimmed = await sharp(wordmarkPath).trim().toBuffer();
  
  const iconMeta = await sharp(iconTrimmed).metadata();
  const wmMeta = await sharp(wmTrimmed).metadata();
  
  if (!iconMeta.width || !iconMeta.height || !wmMeta.width || !wmMeta.height) {
    throw new Error("Could not read image metadata");
  }
  
  const canvasHeight = 512;
  const iconHeight = canvasHeight;
  const iconScale = iconHeight / iconMeta.height;
  const iconWidth = Math.round(iconMeta.width * iconScale);
  
  const wmHeight = Math.round(canvasHeight * 0.90);
  const wmScale = wmHeight / wmMeta.height;
  const wmWidth = Math.round(wmMeta.width * wmScale);
  
  const gap = Math.round(canvasHeight * 0.10);
  const canvasWidth = iconWidth + gap + wmWidth;

  const iconBuf = await sharp(iconTrimmed)
    .resize(iconWidth, iconHeight, { fit: "fill" })
    .toBuffer();
    
  const wmBuf = await sharp(wmTrimmed)
    .resize(wmWidth, wmHeight, { fit: "fill" })
    .toBuffer();

  const iconTop = 0;
  const wmCenterY = Math.round((canvasHeight - wmHeight) / 2);
  
  let wmTop: number;
  if (hasDescenders(brandName)) {
    const descenderOffset = Math.round(wmHeight * 0.04);
    wmTop = wmCenterY - descenderOffset;
    console.log(`      [align] descenders detected, offset -${descenderOffset}px`);
  } else {
    wmTop = wmCenterY;
    console.log(`      [align] no descenders, centered`);
  }

  const tempPath = outPath.replace(".png", "-temp.png");
  await sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 3, background: "#ffffff" } })
    .composite([
      { input: iconBuf, top: iconTop, left: 0 },
      { input: wmBuf, top: wmTop, left: iconWidth + gap }
    ])
    .png()
    .toFile(tempPath);

  await sharp(tempPath).trim().toFile(outPath);
  fs.unlinkSync(tempPath);

  return outPath;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SERVICE
// ═══════════════════════════════════════════════════════════════════

export async function generateBrandFoundation(
  brandName: string,
  concept: string,
  tagline?: string,
  options: BrandFoundationOptions = {}
): Promise<BrandSystem> {
  const { fontOverride, weightOverride, renderStyleOverride, colorsOverride } = options;

  // Create output directory
  const outputDir = path.join(__dirname, "..", "..", "output", brandName.toLowerCase().replace(/\s+/g, "-"));
  const logoDir = path.join(outputDir, "logo");
  const styleDir = path.join(outputDir, "style-guide");
  
  fs.mkdirSync(logoDir, { recursive: true });
  fs.mkdirSync(styleDir, { recursive: true });

  console.log(`\n${"═".repeat(62)}`);
  console.log(`  OpenGFX Brand Foundation`);
  console.log(`  Brand: ${brandName}`);
  console.log(`${"═".repeat(62)}`);

  // ─── STEP 1: TYPOGRAPHY ANALYSIS ───
  let fontFamily: string | null = null;
  let fontWeight = 600;
  let useAIWordmark = false;
  let brandVibe: string[] = [];

  if (fontOverride) {
    fontFamily = INSTALLED_FONTS[fontOverride.toLowerCase()] || fontOverride;
    fontWeight = weightOverride || 600;
    console.log(`\n[FONT OVERRIDE] Using: ${fontFamily} (${fontWeight})`);
  } else {
    const analysis = await analyzeBrandIntent(brandName, concept);
    brandVibe = analysis.brandVibe || [];
    
    if (analysis.explicitFont) {
      fontFamily = analysis.explicitFont;
      fontWeight = analysis.explicitWeight || 600;
      console.log(`      → Explicit request: ${fontFamily} (${fontWeight})`);
    } else if (analysis.recommendation === "library" && analysis.recommendedFont) {
      fontFamily = analysis.recommendedFont;
      fontWeight = analysis.recommendedWeight || 600;
      console.log(`      → Library match: ${fontFamily} (${fontWeight})`);
    } else {
      useAIWordmark = true;
      console.log(`      → Custom generation: AI wordmark`);
    }
  }

  // ─── STEP 2: STYLE GUIDE ANALYSIS ───
  const styleAnalysis = await analyzeStyleGuide(brandName, concept, brandVibe);
  
  // Apply overrides if provided
  const renderStyle: RenderStyle = renderStyleOverride 
    ? { preset: renderStyleOverride, parameters: styleAnalysis.renderStyle.parameters }
    : styleAnalysis.renderStyle;
    
  const colors: ColorPalette = colorsOverride 
    ? { ...styleAnalysis.colors, ...colorsOverride }
    : styleAnalysis.colors;
    
  const typography: Typography = {
    headerFont: fontFamily || styleAnalysis.typography.headerFont,
    headerWeight: fontWeight || styleAnalysis.typography.headerWeight,
    bodyFont: styleAnalysis.typography.bodyFont,
    bodyWeight: styleAnalysis.typography.bodyWeight,
  };

  // ─── STEP 3: GENERATE ICON ───
  console.log(`\n[1/5] Generating icon...`);
  const iconPrompt = `Create a professional logo ICON for "${brandName}".

CONCEPT: ${concept}

CRITICAL: If an emoji or object is referenced, the icon must be IMMEDIATELY RECOGNIZABLE as that object.

${ICON_STYLE_PROMPT}`;
  
  const iconPath = path.join(logoDir, "icon.png");
  await generateImage(iconPrompt, iconPath);
  console.log(`      ✓ icon.png`);

  // ─── STEP 4: GENERATE WORDMARK ───
  console.log(`[2/5] Generating wordmark...`);
  const wordmarkPath = path.join(logoDir, "wordmark.png");
  
  if (useAIWordmark) {
    const wordmarkPrompt = `Create a wordmark that says exactly "${brandName}".

BRAND CONTEXT: ${concept}

Design a CUSTOM wordmark that captures the brand's essence.

CRITICAL: Preserve the EXACT capitalization provided.

${WORDMARK_STYLE_PROMPT}`;
    await generateImage(wordmarkPrompt, wordmarkPath);
    console.log(`      [custom AI wordmark]`);
  } else if (fontFamily) {
    renderWordmark(brandName, wordmarkPath, fontFamily, fontWeight);
    console.log(`      [${fontFamily} ${fontWeight}]`);
  }
  console.log(`      ✓ wordmark.png`);

  // ─── STEP 5: COMPOSITE LOCKUPS ───
  console.log(`[3/5] Compositing stacked lockup...`);
  await compositeStacked(logoDir);
  console.log(`      ✓ stacked.png`);

  console.log(`[4/5] Compositing horizontal lockup...`);
  await compositeHorizontal(logoDir, brandName);
  console.log(`      ✓ horizontal.png`);

  // ─── STEP 6: SAVE STYLE GUIDE ───
  console.log(`[5/5] Generating style guide...`);
  
  // Save individual style guide files
  fs.writeFileSync(
    path.join(styleDir, "colors.json"),
    JSON.stringify(colors, null, 2)
  );
  
  fs.writeFileSync(
    path.join(styleDir, "typography.json"),
    JSON.stringify(typography, null, 2)
  );
  
  fs.writeFileSync(
    path.join(styleDir, "render-style.json"),
    JSON.stringify(renderStyle, null, 2)
  );
  console.log(`      ✓ colors.json, typography.json, render-style.json`);

  // ─── STEP 7: CREATE BRAND SYSTEM MANIFEST ───
  const brandSystem: BrandSystem = {
    brand: {
      name: brandName,
      tagline,
      concept,
    },
    logo: {
      icon: "logo/icon.png",
      wordmark: "logo/wordmark.png",
      stacked: "logo/stacked.png",
      horizontal: "logo/horizontal.png",
    },
    colors,
    typography,
    renderStyle,
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
  };

  const manifestPath = path.join(outputDir, "brand-system.json");
  fs.writeFileSync(manifestPath, JSON.stringify(brandSystem, null, 2));

  console.log(`\n${"═".repeat(62)}`);
  console.log(`  ✓ BRAND FOUNDATION COMPLETE`);
  console.log(`  Output: ${outputDir}`);
  console.log(`${"═".repeat(62)}\n`);

  return brandSystem;
}
