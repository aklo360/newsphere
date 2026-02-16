#!/usr/bin/env npx tsx
/**
 * OpenGFX Logo Pipeline v7 — Creative Director Mode
 * TypeScript implementation
 */

import { GoogleGenAI, Modality } from "@google/genai";
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { createCanvas, registerFont } from "canvas";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

type FontCategory = "sans-serif" | "serif" | "slab" | "script" | "monospace";
type FontUse = "body" | "display" | "accent" | "code";

interface FontConfig {
  weights: number[];
  category: FontCategory;
  use: FontUse;
}

interface FontLibrary {
  [fontName: string]: FontConfig;
}

interface BrandAnalysis {
  explicitFont: string | null;
  explicitWeight: number | null;
  styleRequest: string | null;
  brandVibe: string[];
  recommendation: "library" | "generate";
  recommendedFont: string | null;
  recommendedWeight: number | null;
  reasoning: string;
}

interface WordmarkOptions {
  fontFamily: string | null;
  fontWeight: number;
}

interface PipelineOptions {
  fontOverride: string | null;
  weightOverride: number | null;
}

interface LogoMetadata {
  brand: string;
  concept: string;
  typography: {
    method: "ai-generated" | "library";
    font: string | null;
    weight: number;
  };
  version: string;
  generatedAt: string;
  files: string[];
}

// ═══════════════════════════════════════════════════════════════════
// FONT LIBRARY REGISTRATION
// ═══════════════════════════════════════════════════════════════════

const fontDir = path.join(__dirname, "..", "fonts");

const FONT_LIBRARY: FontLibrary = {
  // ─── SANS-SERIF: Body/UI ───
  "Inter": { weights: [400, 500, 600, 700], category: "sans-serif", use: "body" },
  "Geist": { weights: [400, 500, 600, 700], category: "sans-serif", use: "body" },
  "DM Sans": { weights: [400, 500, 700], category: "sans-serif", use: "body" },
  "Google Sans Flex": { weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], category: "sans-serif", use: "body" },
  
  // ─── SANS-SERIF: Display ───
  "Space Grotesk": { weights: [400, 500, 600, 700], category: "sans-serif", use: "display" },
  "Plus Jakarta Sans": { weights: [400, 500, 600, 700, 800], category: "sans-serif", use: "display" },
  "Bebas Neue": { weights: [400], category: "sans-serif", use: "display" },
  "Anton": { weights: [400], category: "sans-serif", use: "display" },
  
  // ─── SANS-SERIF: Rounded ───
  "Nunito": { weights: [400, 500, 600, 700], category: "sans-serif", use: "body" },
  
  // ─── SERIF: Display ───
  "Playfair Display": { weights: [400, 500, 600, 700], category: "serif", use: "display" },
  "Instrument Serif": { weights: [400], category: "serif", use: "display" },
  "Cormorant Garamond": { weights: [400, 500, 600, 700], category: "serif", use: "display" },
  
  // ─── SERIF: Body ───
  "Source Serif Pro": { weights: [400, 600, 700], category: "serif", use: "body" },
  
  // ─── SLAB SERIF ───
  "Roboto Slab": { weights: [400, 500, 700], category: "slab", use: "display" },
  
  // ─── SCRIPT/CURSIVE ───
  "Caveat": { weights: [400, 500, 600, 700], category: "script", use: "accent" },
  "Dancing Script": { weights: [400, 500, 600, 700], category: "script", use: "accent" },
  
  // ─── MONOSPACE ───
  "JetBrains Mono": { weights: [400, 500, 600, 700], category: "monospace", use: "code" },
};

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

// Generate INSTALLED_FONTS map (kebab-case → family name)
const INSTALLED_FONTS: Record<string, string> = Object.fromEntries(
  Object.keys(FONT_LIBRARY).map((family) => [
    family.toLowerCase().replace(/ /g, "-"),
    family
  ])
);

// ═══════════════════════════════════════════════════════════════════
// GEMINI AI CLIENT
// ═══════════════════════════════════════════════════════════════════

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey });
const MODEL = "gemini-2.0-flash-exp-image-generation";
const VISION_MODEL = "gemini-2.0-flash";

// ═══════════════════════════════════════════════════════════════════
// BRAND INTENT ANALYSIS (Creative Director reasoning)
// ═══════════════════════════════════════════════════════════════════

const FONT_LIBRARY_DESCRIPTION = `
AVAILABLE FONTS:

SANS-SERIF (Modern/Tech/Clean):
- Inter: Swiss precision, #1 UI font, extremely versatile (400-700)
- Geist: Vercel-style, developer/tech brands (400-700)
- DM Sans: Friendly geometric, approachable (400-700)
- Google Sans Flex: Product UI, Google-style (100-900)
- Space Grotesk: Tech/crypto/futuristic headers (400-700)
- Plus Jakarta Sans: Premium SaaS, modern startup (400-800)
- Bebas Neue: Condensed impact, posters/headlines (400 only)
- Anton: Ultra bold condensed, maximum impact (400 only)
- Nunito: Rounded/soft, friendly/kids/health (400-700)

SERIF (Elegant/Editorial/Luxury):
- Playfair Display: Classic luxury, high contrast (400-700)
- Instrument Serif: Modern editorial, NY Times vibe (400 only)
- Cormorant Garamond: Refined elegance, fashion/beauty (400-700)
- Source Serif Pro: Readable, professional (400-700)

SLAB SERIF (Bold/Retro):
- Roboto Slab: Bold statements, retro-modern (400-700)

SCRIPT/CURSIVE (Handwritten):
- Dancing Script: Elegant cursive, luxury/wedding (400-700)
- Caveat: Casual handwriting, friendly notes (400-700)

MONOSPACE (Code/Technical):
- JetBrains Mono: Developer, technical docs (400-700)
`;

async function analyzeBrandIntent(brandName: string, concept: string): Promise<BrandAnalysis> {
  console.log(`\n[BRAND ANALYSIS] Parsing intent...`);
  
  const prompt = `You are a senior creative director at a top branding agency. Analyze this brand request and decide the typography approach.

BRAND NAME: "${brandName}"
CONCEPT/BRIEF: "${concept}"

${FONT_LIBRARY_DESCRIPTION}

TASK: Analyze the brand intent and recommend typography.

DECISION FRAMEWORK:
1. EXPLICIT REQUEST: Did they specify an exact font? (e.g., "use Inter", "Playfair Display bold")
2. STYLE REQUEST: Did they specify a category? (e.g., "serif", "sans-serif", "handwritten")
3. BRAND VIBE: What's the overall feel? (tech, luxury, friendly, bold, minimal, playful, corporate, edgy)
4. RECOMMENDATION: Based on vibe, which path?
   - "library" = A pre-installed font matches perfectly
   - "generate" = Brand needs unique custom wordmark, nothing stock fits

Respond in this EXACT JSON format (no markdown, no explanation):
{
  "explicitFont": null or "Font Name",
  "explicitWeight": null or 400-900,
  "styleRequest": null or "sans-serif|serif|slab|script|mono",
  "brandVibe": ["keyword1", "keyword2", "keyword3"],
  "recommendation": "library" or "generate",
  "recommendedFont": null or "Font Name",
  "recommendedWeight": null or 400-900,
  "reasoning": "One sentence explaining the decision"
}`;

  try {
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: prompt,
    });
    
    const text = response.text?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`      [warn] Could not parse analysis, defaulting to AI generation`);
      return { 
        explicitFont: null, 
        explicitWeight: null, 
        styleRequest: null, 
        brandVibe: [], 
        recommendation: "generate", 
        recommendedFont: null, 
        recommendedWeight: null, 
        reasoning: "Parse error, using AI generation" 
      };
    }
    
    const analysis: BrandAnalysis = JSON.parse(jsonMatch[0]);
    console.log(`      Vibe: ${analysis.brandVibe?.join(", ") || "unknown"}`);
    console.log(`      Decision: ${analysis.recommendation}`);
    if (analysis.recommendedFont) {
      console.log(`      Font: ${analysis.recommendedFont} (${analysis.recommendedWeight || 600})`);
    }
    console.log(`      Reasoning: ${analysis.reasoning}`);
    
    return analysis;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.log(`      [warn] Analysis failed: ${message}, defaulting to AI generation`);
    return { 
      explicitFont: null, 
      explicitWeight: null, 
      styleRequest: null, 
      brandVibe: [], 
      recommendation: "generate", 
      recommendedFont: null, 
      recommendedWeight: null, 
      reasoning: "Analysis error, using AI generation" 
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// PROMPTS
// ═══════════════════════════════════════════════════════════════════

const ICON_STYLE = `
DESIGN DIRECTION: Senior brand designer at Pentagram creating a premium icon.

FIDELITY:
- HIGH FIDELITY — detailed, recognizable, professional
- If emoji referenced, icon must be IMMEDIATELY RECOGNIZABLE as that object
- Think Apple SF Symbols — detailed but clean

RENDERING:
- Solid black (#000000) on pure white (#FFFFFF)
- Clean vector-quality edges

SPECS:
- Square 1:1, 1024x1024 pixels
- Icon fills ~85% of canvas, centered

FORBIDDEN:
- NO borders, frames, or outlines around the icon
- NO box or container
- ONLY the icon itself on pure white
`;

const WORDMARK_STYLE = `
TYPOGRAPHY:
- Clean modern sans-serif (SF Pro, Helvetica Neue, Inter)
- Medium to Semi-Bold weight
- Tight letter-spacing

RENDERING:
- Solid black (#000000) on pure white (#FFFFFF)
- Text fills width with minimal padding

SPECS:
- WIDE RECTANGULAR: 1024x256 pixels (4:1 ratio)
- Text fills ~95% of width

CRITICAL: Preserve the EXACT capitalization provided.
`;

// ═══════════════════════════════════════════════════════════════════
// PROGRAMMATIC WORDMARK RENDERING
// ═══════════════════════════════════════════════════════════════════

function renderWordmark(brandName: string, outputPath: string, options: WordmarkOptions): string | null {
  const { fontFamily, fontWeight = 600 } = options;

  if (!fontFamily) {
    return null;
  }

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
  
  console.log(`      [font] ${fontFamily} weight ${fontWeight}`);
  return outputPath;
}

// ═══════════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════════

async function generate(prompt: string, filename: string, outputDir: string): Promise<string> {
  const filepath = path.join(outputDir, filename);
  
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      fs.writeFileSync(filepath, buffer);
      return filepath;
    }
  }
  throw new Error(`No image generated for ${filename}`);
}

// ═══════════════════════════════════════════════════════════════════
// STACKED LOCKUP
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
// HORIZONTAL LOCKUP
// ═══════════════════════════════════════════════════════════════════

function hasDescenders(text: string): boolean {
  const descenderLetters = ["g", "j", "p", "q", "y"];
  return descenderLetters.some(letter => text.includes(letter));
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
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════════

async function generateLogoSystem(
  brandName: string, 
  concept: string, 
  options: PipelineOptions = { fontOverride: null, weightOverride: null }
): Promise<void> {
  const { fontOverride, weightOverride } = options;

  const outputDir = path.join(__dirname, "..", "output", brandName.toLowerCase().replace(/\s+/g, "-"));
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  OpenGFX Logo Pipeline v7 (Creative Director Mode)`);
  console.log(`  Brand: ${brandName}`);
  console.log(`══════════════════════════════════════════════════════════════`);

  let fontFamily: string | null = null;
  let fontWeight = 600;
  let useAIGeneration = false;

  if (fontOverride) {
    fontFamily = fontOverride;
    fontWeight = weightOverride || 600;
    console.log(`\n[FONT OVERRIDE] Using: ${fontFamily} (${fontWeight})`);
  } else {
    const analysis = await analyzeBrandIntent(brandName, concept);
    
    if (analysis.explicitFont) {
      fontFamily = analysis.explicitFont;
      fontWeight = analysis.explicitWeight || 600;
      console.log(`      → Explicit request: ${fontFamily} (${fontWeight})`);
    } else if (analysis.recommendation === "library" && analysis.recommendedFont) {
      fontFamily = analysis.recommendedFont;
      fontWeight = analysis.recommendedWeight || 600;
      console.log(`      → Library match: ${fontFamily} (${fontWeight})`);
    } else {
      useAIGeneration = true;
      console.log(`      → Custom generation: AI wordmark`);
    }
  }

  // ─── STEP 1: ICON ───
  console.log(`\n[1/4] Generating icon...`);
  const iconPrompt = `Create a professional logo ICON for "${brandName}".

CONCEPT: ${concept}

CRITICAL: If an emoji or object is referenced, the icon must be IMMEDIATELY RECOGNIZABLE as that object.

${ICON_STYLE}`;
  await generate(iconPrompt, "icon.png", outputDir);
  console.log(`      ✓ icon.png`);

  // ─── STEP 2: WORDMARK ───
  console.log(`[2/4] Generating wordmark...`);
  const wordmarkPath = path.join(outputDir, "wordmark.png");
  
  if (useAIGeneration) {
    const wordmarkPrompt = `Create a wordmark that says exactly "${brandName}".

BRAND CONTEXT: ${concept}

Design a CUSTOM wordmark that captures the brand's essence. This should feel like a bespoke design from a top agency, not a stock font.

CRITICAL: Preserve the EXACT capitalization provided. If it says "OpenGFX", render "OpenGFX" — not "OPENGFX" or "opengfx".

${WORDMARK_STYLE}`;
    await generate(wordmarkPrompt, "wordmark.png", outputDir);
    console.log(`      [custom AI wordmark]`);
  } else {
    const rendered = renderWordmark(brandName, wordmarkPath, { fontFamily, fontWeight });
    if (rendered) {
      console.log(`      [${fontFamily} ${fontWeight}]`);
    } else {
      console.log(`      [warn] Font rendering failed, falling back to AI`);
      const wordmarkPrompt = `Create a wordmark that says exactly "${brandName}".
CRITICAL: Preserve the EXACT capitalization provided.
${WORDMARK_STYLE}`;
      await generate(wordmarkPrompt, "wordmark.png", outputDir);
    }
  }
  console.log(`      ✓ wordmark.png`);

  // ─── STEP 3: STACKED LOCKUP ───
  console.log(`[3/4] Compositing stacked lockup...`);
  await compositeStacked(outputDir);
  console.log(`      ✓ stacked.png`);

  // ─── STEP 4: HORIZONTAL LOCKUP ───
  console.log(`[4/4] Compositing horizontal lockup...`);
  await compositeHorizontal(outputDir, brandName);
  console.log(`      ✓ horizontal.png`);

  // ─── STEP 5: METADATA ───
  const metadata: LogoMetadata = {
    brand: brandName,
    concept: concept,
    typography: {
      method: useAIGeneration ? "ai-generated" : "library",
      font: fontFamily,
      weight: fontWeight,
    },
    version: "7.0",
    generatedAt: new Date().toISOString(),
    files: ["icon.png", "wordmark.png", "stacked.png", "horizontal.png"]
  };
  fs.writeFileSync(path.join(outputDir, "logo-system.json"), JSON.stringify(metadata, null, 2));

  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  ✓ COMPLETE — ${outputDir}`);
  console.log(`══════════════════════════════════════════════════════════════\n`);
}

// ═══════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════

function printUsage(): void {
  console.error(`
═══════════════════════════════════════════════════════════════════
  OpenGFX Logo Pipeline v7 (Creative Director Mode) — TypeScript
═══════════════════════════════════════════════════════════════════

Usage: npx tsx src/logo-pipeline.ts "BrandName" "concept/brief" [fontOverride] [weight]

The pipeline analyzes your brand brief and automatically selects:
  • A matching library font if one fits the vibe
  • AI-generated custom wordmark if the brand needs something unique

EXAMPLES:

  # Let the AI decide based on brand vibe:
  npx tsx src/logo-pipeline.ts "Lumina" "luxury skincare, elegant, refined"
  npx tsx src/logo-pipeline.ts "ByteForge" "developer tools, technical, modern"
  npx tsx src/logo-pipeline.ts "Wanderlust" "travel blog, adventurous, handwritten feel"

  # Specify a font style in your brief:
  npx tsx src/logo-pipeline.ts "TechCorp" "enterprise SaaS, use a clean sans-serif"
  
  # Force a specific font (override):
  npx tsx src/logo-pipeline.ts "OpenGFX" "design tools" "Google Sans Flex" 600

INSTALLED FONTS:
`);
  Object.entries(FONT_LIBRARY).forEach(([name, { category, weights }]) => {
    console.error(`  ${name} (${category}) — weights: ${weights.join(", ")}`);
  });
  console.error(``);
}

// Main execution
const [brandName, concept, fontArg, weightArg] = process.argv.slice(2);

if (!brandName || !concept) {
  printUsage();
  process.exit(1);
}

let fontOverride: string | null = null;
if (fontArg) {
  fontOverride = INSTALLED_FONTS[fontArg.toLowerCase()] || fontArg;
}
const weightOverride = weightArg ? parseInt(weightArg, 10) : null;

generateLogoSystem(brandName, concept, { fontOverride, weightOverride }).catch(err => {
  console.error(`✗ ${err instanceof Error ? err.message : "Unknown error"}`);
  process.exit(1);
});

// Export for use as module
export { generateLogoSystem, FONT_LIBRARY, INSTALLED_FONTS };
export type { BrandAnalysis, LogoMetadata, PipelineOptions, FontLibrary };
