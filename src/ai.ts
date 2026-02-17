/**
 * OpenGFX AI Module — Gemini API interactions
 */

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import type { 
  BrandAnalysis, 
  StyleGuideAnalysis, 
  RenderStyle, 
  ColorPalette, 
  Typography,
  RenderStylePreset 
} from "./types.js";
import { FONT_LIBRARY, RENDER_STYLE_PROMPTS } from "./constants.js";

// ═══════════════════════════════════════════════════════════════════
// CLIENT SETUP
// ═══════════════════════════════════════════════════════════════════

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export const ai = new GoogleGenAI({ apiKey });
export const IMAGE_MODEL = "gemini-2.0-flash-exp-image-generation";
export const TEXT_MODEL = "gemini-2.0-flash";

// ═══════════════════════════════════════════════════════════════════
// FONT LIBRARY DESCRIPTION FOR AI
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

// ═══════════════════════════════════════════════════════════════════
// BRAND ANALYSIS (Typography Selection)
// ═══════════════════════════════════════════════════════════════════

export async function analyzeBrandIntent(brandName: string, concept: string): Promise<BrandAnalysis> {
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
      model: TEXT_MODEL,
      contents: prompt,
    });
    
    const text = response.text?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`      [warn] Could not parse analysis, defaulting to AI generation`);
      return createDefaultBrandAnalysis();
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
    return createDefaultBrandAnalysis();
  }
}

function createDefaultBrandAnalysis(): BrandAnalysis {
  return {
    explicitFont: null,
    explicitWeight: null,
    styleRequest: null,
    brandVibe: [],
    recommendation: "generate",
    recommendedFont: null,
    recommendedWeight: null,
    reasoning: "Using AI generation as fallback"
  };
}

// ═══════════════════════════════════════════════════════════════════
// STYLE GUIDE ANALYSIS (Colors, Typography, Render Style)
// ═══════════════════════════════════════════════════════════════════

export async function analyzeStyleGuide(brandName: string, concept: string, brandVibe: string[]): Promise<StyleGuideAnalysis> {
  console.log(`\n[STYLE GUIDE] Analyzing brand style...`);
  
  const prompt = `You are a senior creative director designing a complete brand style guide.

BRAND NAME: "${brandName}"
CONCEPT/BRIEF: "${concept}"
BRAND VIBE: ${brandVibe.join(", ")}

TASK: Design the visual style for this brand.

RENDER STYLES AVAILABLE:
- "flat": Solid colors, minimal, clean, corporate
- "gradient": Smooth color transitions, modern (Instagram, Firefox style)
- "glass": Frosted glass, subtle transparency, glassmorphism
- "gavin": Iridescent glass (Gavin Nelson style), rainbow reflections, ethereal
- "chrome": Metallic chrome, reflective, futuristic
- "gold": Gold metallic, luxurious, premium
- "silver": Silver/platinum metallic, elegant
- "neon": Glowing edges, cyberpunk, vibrant
- "3d": Full 3D depth, shadows, modern render
- "holographic": Rainbow holographic foil, eye-catching

${FONT_LIBRARY_DESCRIPTION}

USER PROMPT IS THE BIBLE: If the user explicitly requested a specific style (e.g., "metallic gold", "iridescent", "chrome"), USE THAT. Otherwise, creatively interpret the best style for the brand.

Respond in this EXACT JSON format (no markdown):
{
  "renderStyle": {
    "preset": "flat|gradient|glass|gavin|chrome|gold|silver|neon|3d|holographic|custom",
    "customPrompt": null or "user's specific style description if custom",
    "parameters": {
      "material": "glass|metal|plastic|fabric|liquid",
      "finish": "matte|glossy|brushed|polished|frosted",
      "lighting": "soft|dramatic|neon|natural|studio",
      "colorMode": "brand|monochrome|iridescent|duotone",
      "depth": "flat|subtle|deep",
      "effects": ["glow", "reflection", "shadow"]
    }
  },
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode", 
    "accent": "#hexcode",
    "background": "#hexcode",
    "foreground": "#hexcode"
  },
  "typography": {
    "headerFont": "Font Name from list",
    "headerWeight": 400-900,
    "bodyFont": "Font Name from list",
    "bodyWeight": 400-700
  },
  "reasoning": "Brief explanation of style choices"
}`;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });
    
    const text = response.text?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`      [warn] Could not parse style guide, using defaults`);
      return createDefaultStyleGuide();
    }
    
    const analysis: StyleGuideAnalysis = JSON.parse(jsonMatch[0]);
    console.log(`      Render: ${analysis.renderStyle.preset}`);
    console.log(`      Colors: ${analysis.colors.primary} / ${analysis.colors.secondary}`);
    console.log(`      Typography: ${analysis.typography.headerFont} + ${analysis.typography.bodyFont}`);
    console.log(`      Reasoning: ${analysis.reasoning}`);
    
    return analysis;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.log(`      [warn] Style guide analysis failed: ${message}`);
    return createDefaultStyleGuide();
  }
}

function createDefaultStyleGuide(): StyleGuideAnalysis {
  return {
    renderStyle: {
      preset: "gradient",
      parameters: {
        material: "glass",
        finish: "glossy",
        lighting: "soft",
        colorMode: "brand",
        depth: "subtle",
        effects: ["reflection"]
      }
    },
    colors: {
      primary: "#6366F1",
      secondary: "#EC4899",
      accent: "#10B981",
      background: "#FFFFFF",
      foreground: "#0F172A"
    },
    typography: {
      headerFont: "Inter",
      headerWeight: 700,
      bodyFont: "Inter",
      bodyWeight: 400
    },
    reasoning: "Default style guide (analysis failed)"
  };
}

// ═══════════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════════

export async function generateImage(prompt: string, outputPath: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);
      return outputPath;
    }
  }
  throw new Error(`No image generated`);
}

// ═══════════════════════════════════════════════════════════════════
// RENDERED AVATAR GENERATION (with style block for consistency)
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a detailed, reusable style block for the icon render.
 * This block will be used identically in avatar and banner generation.
 */
function createIconStyleBlock(
  renderStyle: RenderStyle,
  colors: ColorPalette
): string {
  const stylePrompt = renderStyle.preset === "custom" && renderStyle.customPrompt
    ? renderStyle.customPrompt
    : RENDER_STYLE_PROMPTS[renderStyle.preset] || RENDER_STYLE_PROMPTS.gradient;

  // Create a HIGHLY DETAILED style block that pins down exact visual characteristics
  return `ICON RENDER STYLE (use EXACTLY for all icon appearances):

RENDER TECHNIQUE:
${stylePrompt}

EXACT COLOR MAPPING:
- Primary gradient start: ${colors.primary}
- Primary gradient end: ${colors.secondary}
- Accent highlights: ${colors.accent}
- The icon should have iridescent/holographic color shifts if the style calls for it
- Color flow direction: top-left to bottom-right diagonal

MATERIAL & LIGHTING:
- Material: ${renderStyle.parameters?.material || "glass"}
- Surface finish: ${renderStyle.parameters?.finish || "glossy"}
- Lighting angle: 45 degrees from top-left
- Highlight intensity: prominent on upper-left edges
- Shadow/depth: subtle ambient occlusion on lower-right

SPECIFIC VISUAL DETAILS:
- Edge treatment: smooth anti-aliased edges with subtle glow
- Reflection: soft environmental reflection on surface
- Transparency: if glass-like, show subtle internal refraction

BACKGROUND (use EXACTLY for consistency across PFP and banner):
⚠️ NEVER use plain white or solid flat backgrounds — ALWAYS use a gradient!
- Base color: ${colors.background}
- Gradient: visible but soft transition from ${colors.background} toward ${colors.primary} at 15-25% blend
- Direction: top-left to bottom-right diagonal (or center-out radial gradient)
- The background should have NOTICEABLE color variation, not appear flat/plain
- Keep it soft and professional, but with clear gradient presence

This style block MUST be replicated EXACTLY across all brand assets — including the gradient background.`;
}

export async function generateRenderedAvatarWithStyle(
  iconPath: string,
  renderStyle: RenderStyle,
  colors: ColorPalette,
  outputPath: string
): Promise<{ path: string; styleBlock: string }> {
  // Read the black icon as reference
  const iconData = fs.readFileSync(iconPath);
  const base64Icon = iconData.toString("base64");
  
  // Create the reusable style block
  const styleBlock = createIconStyleBlock(renderStyle, colors);

  const prompt = `Transform this black logo icon into a stunning rendered version.

${styleBlock}

REQUIREMENTS:
- Maintain the EXACT shape of the original icon
- Apply the render style while keeping it recognizable
- Output should be 1024x1024 pixels
- Icon should be centered with appropriate padding
- This is the MASTER render — all other brand assets will match this exact style

Create a premium, polished render that looks like it belongs to a top-tier brand.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Icon } },
          { text: prompt }
        ]
      }
    ],
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);
      return { path: outputPath, styleBlock };
    }
  }
  throw new Error(`Failed to generate rendered avatar`);
}

// Keep legacy function for backwards compatibility
export async function generateRenderedAvatar(
  iconPath: string,
  renderStyle: RenderStyle,
  colors: ColorPalette,
  outputPath: string
): Promise<string> {
  const result = await generateRenderedAvatarWithStyle(iconPath, renderStyle, colors, outputPath);
  return result.path;
}

// ═══════════════════════════════════════════════════════════════════
// BANNER GENERATION (with shared style block for consistency)
// ═══════════════════════════════════════════════════════════════════

export async function generateBannerWithStyle(
  logoPath: string,
  brandName: string,
  tagline: string | undefined,
  renderStyle: RenderStyle,
  colors: ColorPalette,
  typography: Typography,
  iconStyleBlock: string,
  width: number,
  height: number,
  outputPath: string,
  renderedIconPath?: string
): Promise<string> {
  const logoData = fs.readFileSync(logoPath);
  const base64Logo = logoData.toString("base64");

  // Get the render style prompt for overall aesthetic
  const stylePrompt = renderStyle.preset === "custom" && renderStyle.customPrompt
    ? renderStyle.customPrompt
    : RENDER_STYLE_PROMPTS[renderStyle.preset] || RENDER_STYLE_PROMPTS.gradient;

  // Build image parts - RENDERED ICON MUST BE FIRST
  const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
  
  if (renderedIconPath && fs.existsSync(renderedIconPath)) {
    const renderedIconData = fs.readFileSync(renderedIconPath);
    const base64RenderedIcon = renderedIconData.toString("base64");
    imageParts.push({ inlineData: { mimeType: "image/png", data: base64RenderedIcon } });
  }
  
  imageParts.push({ inlineData: { mimeType: "image/png", data: base64Logo } });

  // Calculate aspect ratio
  const aspectRatio = `${width}:${height}`;
  const aspectDecimal = width / height;

  const prompt = `${renderedIconPath ? `⚠️ CRITICAL INSTRUCTIONS — READ FIRST ⚠️

1. ICON PRESERVATION:
The FIRST IMAGE provided is the RENDERED LOGO ICON. You MUST preserve this icon EXACTLY:
- EXACT same shape — do not modify, distort, or reinterpret
- EXACT same colors — preserve every color, gradient, and hue precisely  
- EXACT same lighting — keep highlights, reflections, and shadows identical
- EXACT same style — maintain the iridescent/glass/metallic treatment pixel-perfect
DO NOT regenerate or reinterpret the icon. Place it in the banner AS-IS.

2. LAYOUT — EXTREMELY IMPORTANT:
- CENTER all content HORIZONTALLY and VERTICALLY in the frame
- Leave AT LEAST 15-20% PADDING on ALL sides (left, right, top, bottom)
- Content must NOT touch or approach the edges
- The composition (icon + wordmark + tagline) should be CENTERED as a group
- Think "presentation slide" — content centered with generous margins all around
- DO NOT push content to the left side — keep it CENTERED

` : ""}Create a professional social media banner with GENEROUS MARGINS.

ASPECT RATIO: ${aspectRatio} (${aspectDecimal.toFixed(2)}:1 ultrawide)
OUTPUT DIMENSIONS: ${width}x${height} pixels
This is a wide banner format — compose horizontally.

${renderedIconPath ? "IMAGE 1 (FIRST): RENDERED ICON — preserve EXACTLY as provided" : ""}
${renderedIconPath ? "IMAGE 2: Black logo silhouette for reference" : ""}

BRAND:
- Name: "${brandName}"
${tagline ? `- Tagline: "${tagline}"` : ""}

RENDER STYLE FOR WORDMARK & TAGLINE (match the icon's style):
${stylePrompt}

${iconStyleBlock}

COMPOSITION & LAYOUT:
- ⚠️ CRITICAL: CENTER the entire composition HORIZONTALLY and VERTICALLY
- Leave ~15-20% MARGIN on all sides — do NOT fill full bleed
- The icon + wordmark + tagline should form a CENTERED GROUP in the middle of the banner
- Safe zone: keep all content within the center area of the frame
- DO NOT left-align or push content to one side — CENTERED composition only

ELEMENTS:
- Icon and wordmark side-by-side (icon left, wordmark right) OR stacked — but CENTERED as a group
- The WORDMARK "${brandName}" must have gorgeous 3D/metallic/iridescent HEADER text treatment matching the icon
${tagline ? `- The TAGLINE "${tagline}" should use BODY FONT STYLE (${typography.bodyFont}, weight ${typography.bodyWeight}) — elegant but simpler than the header, complementary but not competing` : ""}
- Background: subtle gradient using ${colors.background} → ${colors.primary} at low opacity
- Professional, premium brand aesthetic — CENTERED with breathing room on all sides

COLORS: Primary ${colors.primary}, Secondary ${colors.secondary}

Remember: The icon from IMAGE 1 must appear EXACTLY as provided — same colors, same gradients, same everything.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      {
        role: "user",
        parts: [...imageParts, { text: prompt }]
      }
    ],
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      
      // Post-process to ensure exact dimensions (Gemini may not output exact custom sizes)
      const sharp = (await import("sharp")).default;
      await sharp(buffer)
        .resize(width, height, { fit: "cover", position: "center" })
        .png()
        .toFile(outputPath);
      
      return outputPath;
    }
  }
  throw new Error(`Failed to generate banner`);
}

// Legacy function without style block (generates its own)
export async function generateBanner(
  logoPath: string,
  brandName: string,
  tagline: string | undefined,
  renderStyle: RenderStyle,
  colors: ColorPalette,
  typography: Typography,
  width: number,
  height: number,
  outputPath: string
): Promise<string> {
  const styleBlock = `RENDER STYLE: ${RENDER_STYLE_PROMPTS[renderStyle.preset] || RENDER_STYLE_PROMPTS.gradient}
COLORS: Primary ${colors.primary}, Secondary ${colors.secondary}, Accent ${colors.accent}`;
  
  return generateBannerWithStyle(
    logoPath, brandName, tagline, renderStyle, colors, typography,
    styleBlock, width, height, outputPath
  );
}
