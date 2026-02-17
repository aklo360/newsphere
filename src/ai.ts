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

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable is required");
}

export const ai = new GoogleGenAI({ apiKey });
export const IMAGE_MODEL = "gemini-3-pro-image-preview";
export const TEXT_MODEL = "gemini-2.0-flash";
export const UPSCALE_MODEL = "imagen-4.0-upscale-preview";

// ═══════════════════════════════════════════════════════════════════
// IMAGE UPSCALING (Imagen 4)
// ═══════════════════════════════════════════════════════════════════

/**
 * Upscale an image using Imagen 4 upscaler
 * @param inputPath - Path to input image
 * @param outputPath - Path to save upscaled image
 * @param factor - Upscale factor: 'x2' or 'x4'
 */
export async function upscaleImage(
  inputPath: string, 
  outputPath: string, 
  factor: 'x2' | 'x4' = 'x2'
): Promise<string> {
  const imageData = fs.readFileSync(inputPath);
  const base64Image = imageData.toString("base64");
  
  console.log(`      [Upscaling ${factor} with ${UPSCALE_MODEL}...]`);
  
  const response = await ai.models.upscaleImage({
    model: UPSCALE_MODEL,
    image: { imageBytes: base64Image },
    upscaleFactor: factor,
    config: { includeRaiReason: true },
  });
  
  const generatedImage = response.generatedImages?.[0];
  if (generatedImage?.image?.imageBytes) {
    const buffer = Buffer.from(generatedImage.image.imageBytes, "base64");
    fs.writeFileSync(outputPath, buffer);
    
    // Log new dimensions
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(buffer).metadata();
    console.log(`      [Upscaled to ${metadata.width}x${metadata.height}]`);
    
    return outputPath;
  }
  
  throw new Error(`Failed to upscale image`);
}

// ═══════════════════════════════════════════════════════════════════
// HIGH-RES BACKGROUND GENERATION (Imagen 4)
// ═══════════════════════════════════════════════════════════════════

export const IMAGEN_MODEL = "imagen-4.0-generate-001";

/**
 * Generate a high-resolution banner background using Imagen 4
 * Supports 1K, 2K, 4K output sizes
 */
export async function generateBannerBackground(
  brandName: string,
  colors: ColorPalette,
  stylePrompt: string,
  aspectRatio: '16:9' | '21:9' | '3:2',
  imageSize: '1K' | '2K' | '4K',
  outputPath: string
): Promise<string> {
  const prompt = `Professional abstract banner background for "${brandName}" brand.

STYLE: ${stylePrompt}

COLORS:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}
- Background base: ${colors.background}

COMPOSITION:
- Abstract gradient flowing from left to right
- Subtle organic shapes or geometric elements
- Premium, luxurious feel
- NO TEXT, NO LOGOS, NO ICONS — pure background only
- Leave center area relatively clean for content overlay
- Soft vignette toward edges

AESTHETIC: Modern, premium, suitable for professional brand banner.`;

  console.log(`      [Generating ${imageSize} background with Imagen 4...]`);
  
  const response = await ai.models.generateImages({
    model: IMAGEN_MODEL,
    prompt,
    config: {
      numberOfImages: 1,
      imageSize,
      aspectRatio,
    }
  });
  
  const generatedImage = response.generatedImages?.[0];
  if (generatedImage?.image?.imageBytes) {
    const buffer = Buffer.from(generatedImage.image.imageBytes, "base64");
    fs.writeFileSync(outputPath, buffer);
    
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(buffer).metadata();
    console.log(`      [Imagen 4 output: ${metadata.width}x${metadata.height}]`);
    
    return outputPath;
  }
  
  throw new Error(`Failed to generate banner background`);
}

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

BRAND MODE DECISION — CRITICAL:
Decide if this brand should be "dark" or "light" mode:
- "dark": Dark backgrounds, light/white text — for: tech, gaming, nightlife, space, luxury, edgy brands
- "light": Light backgrounds, dark/black text — for: health, wellness, corporate, friendly, approachable brands

This affects ALL design outputs — banners, socials, etc. The mode ensures proper contrast and legibility.

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
  "mode": "dark|light",
  "reasoning": "Brief explanation of style choices including mode decision"
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
    // Ensure mode has a default
    if (!analysis.mode) {
      analysis.mode = "light";
    }
    console.log(`      Mode: ${analysis.mode.toUpperCase()}`);
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
    mode: "light",
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
    config: { 
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      imageConfig: { imageSize: '1K' }
    },
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
    config: { 
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      imageConfig: { imageSize: '1K' }
    },
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
  renderedIconPath?: string,
  wordmarkPath?: string,
  mode: "dark" | "light" = "light"
): Promise<string> {
  const logoData = fs.readFileSync(logoPath);
  const base64Logo = logoData.toString("base64");

  // Get the render style prompt for overall aesthetic
  const stylePrompt = renderStyle.preset === "custom" && renderStyle.customPrompt
    ? renderStyle.customPrompt
    : RENDER_STYLE_PROMPTS[renderStyle.preset] || RENDER_STYLE_PROMPTS.gradient;

  // Build image parts - RENDERED ICON FIRST, THEN WORDMARK
  const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
  
  if (renderedIconPath && fs.existsSync(renderedIconPath)) {
    const renderedIconData = fs.readFileSync(renderedIconPath);
    const base64RenderedIcon = renderedIconData.toString("base64");
    imageParts.push({ inlineData: { mimeType: "image/png", data: base64RenderedIcon } });
  }
  
  if (wordmarkPath && fs.existsSync(wordmarkPath)) {
    const wordmarkData = fs.readFileSync(wordmarkPath);
    const base64Wordmark = wordmarkData.toString("base64");
    imageParts.push({ inlineData: { mimeType: "image/png", data: base64Wordmark } });
  }
  
  imageParts.push({ inlineData: { mimeType: "image/png", data: base64Logo } });

  // Calculate aspect ratio
  const aspectRatio = `${width}:${height}`;
  const aspectDecimal = width / height;

  const hasWordmark = wordmarkPath && fs.existsSync(wordmarkPath);
  const prompt = `${renderedIconPath ? `⚠️ CRITICAL INSTRUCTIONS — READ FIRST ⚠️

🔴 GOLDEN RULE #1: LEGIBILITY & CONTRAST 🔴
The wordmark MUST be HIGHLY READABLE against the background. This is NON-NEGOTIABLE.
- If the background is light → wordmark must be DARK (deep teal, charcoal, near-black)
- If the background is dark → wordmark must be LIGHT
- NEVER let the wordmark blend into the background
- When in doubt, make the wordmark DARKER for better contrast
- Legibility trumps style — a beautiful unreadable wordmark is a failure

1. ICON PRESERVATION:
The FIRST IMAGE provided is the RENDERED LOGO ICON. You MUST preserve this icon EXACTLY:
- EXACT same shape — do not modify, distort, or reinterpret
- EXACT same colors — preserve every color, gradient, and hue precisely  
- EXACT same lighting — keep highlights, reflections, and shadows identical
- EXACT same style — maintain the iridescent/glass/metallic treatment pixel-perfect
DO NOT regenerate or reinterpret the icon. Place it in the banner AS-IS.

2. WORDMARK PRESERVATION + CONTRAST:
${hasWordmark ? `The SECOND IMAGE is the EXACT WORDMARK to use. You MUST:
- Use this EXACT wordmark — same font, same letter shapes, same spacing
- Apply a DARK render treatment that CONTRASTS strongly with the background
- The wordmark must be easily readable at a glance
- DO NOT substitute a different font or regenerate the text
- The wordmark letterforms must match the reference image PERFECTLY` : `Generate "${brandName}" as the wordmark with HIGH CONTRAST against the background.`}

3. LAYOUT — EXTREMELY IMPORTANT:
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

${renderedIconPath ? "IMAGE 1: RENDERED ICON — preserve EXACTLY as provided" : ""}
${hasWordmark ? "IMAGE 2: EXACT WORDMARK — use this typography precisely" : ""}
${renderedIconPath ? `IMAGE ${hasWordmark ? "3" : "2"}: Black logo silhouette for reference` : ""}

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

BRAND MODE: ${mode.toUpperCase()}
${mode === "dark" ? `
- DARK BACKGROUND: Use dark/black background (${colors.background} or darker)
- WORDMARK WITH RENDER STYLE: "${brandName}" should have the SAME render treatment as the icon (gradient, glass, glow, etc.) but ensure it contrasts against the dark background
- PLAIN TAGLINE: "${tagline || ""}" should be plain WHITE or light grey (simple, no effects)
- The icon should pop against the dark background
` : `
- LIGHT BACKGROUND: Use white or light background (${colors.background} or lighter)  
- WORDMARK WITH RENDER STYLE: "${brandName}" should have the SAME render treatment as the icon but DARKER tones for contrast
- PLAIN TAGLINE: "${tagline || ""}" should be plain DARK GREY or BLACK (simple, no effects)
- The icon should pop against the light background
`}

ELEMENTS:
- Icon and wordmark side-by-side (icon left, wordmark right) OR stacked — but CENTERED as a group
- The WORDMARK "${brandName}" MUST:
  * Have a SIMILAR RENDER STYLE to the icon (gradient, glass, metallic, glow — match the icon's aesthetic)
  * NOT be plain white or plain black — it should have visual treatment
  * Still maintain HIGH CONTRAST against the background for readability
  * ${mode === "dark" ? "Use light/bright render tones that pop on dark backgrounds" : "Use darker render tones that contrast on light backgrounds"}
${tagline ? `- The TAGLINE "${tagline}" should be PLAIN ${mode === "dark" ? "WHITE or LIGHT GREY" : "DARK GREY or BLACK"} text — NO 3D rendering, NO gradients, NO effects. Simple, clean, readable body text in ${typography.bodyFont}. Only the tagline is plain.` : ""}
- Background: ${mode === "dark" ? `dark (${colors.background} or darker) with subtle gradient` : `clean ${colors.background} (white or light) with very subtle gradient`}

⚠️ CONTRAST CHECK: The wordmark must be readable. The render style should enhance, not hurt legibility.
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
    config: { 
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      imageConfig: { imageSize: '2K' }
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      
      // Check what Gemini actually generated
      const sharp = (await import("sharp")).default;
      const metadata = await sharp(buffer).metadata();
      console.log(`      [Gemini output: ${metadata.width}x${metadata.height}]`);
      
      if (metadata.width && metadata.height) {
        // If Gemini output is smaller than target, upscale with high-quality Lanczos
        if (metadata.width < width || metadata.height < height) {
          const scaleNeeded = Math.max(width / metadata.width, height / metadata.height);
          console.log(`      [Upscaling ${scaleNeeded.toFixed(1)}x with Lanczos (kernel: lanczos3)...]`);
          
          // Use Lanczos3 for highest quality upscaling
          await sharp(buffer)
            .resize(width, height, { 
              fit: "cover", 
              position: "center",
              kernel: "lanczos3"  // Highest quality resampling
            })
            .sharpen({ sigma: 0.5 })  // Light sharpening to reduce upscale softness
            .png()
            .toFile(outputPath);
            
          console.log(`      [Resized to ${width}x${height}]`);
        } else {
          // Gemini output is larger - safe to downscale
          await sharp(buffer)
            .resize(width, height, { fit: "cover", position: "center" })
            .png()
            .toFile(outputPath);
        }
      } else {
        // Fallback - just save as-is
        await sharp(buffer).png().toFile(outputPath);
      }
      
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

/**
 * Adapt a banner to a different aspect ratio using Gemini
 * Uses the master banner as input and asks Gemini to recompose for the new dimensions
 * This avoids cropping and preserves the key composition elements
 */
export async function adaptBannerAspectRatio(
  masterBannerPath: string,
  targetWidth: number,
  targetHeight: number,
  outputPath: string,
  brandName: string
): Promise<string> {
  const sharp = (await import("sharp")).default;
  
  // Read master banner
  const masterBuffer = fs.readFileSync(masterBannerPath);
  const masterBase64 = masterBuffer.toString("base64");
  const masterMetadata = await sharp(masterBuffer).metadata();
  
  const masterAspect = (masterMetadata.width || 3000) / (masterMetadata.height || 1000);
  const targetAspect = targetWidth / targetHeight;
  
  console.log(`      [Adapting ${masterAspect.toFixed(2)}:1 → ${targetAspect.toFixed(2)}:1]`);
  
  // Determine if we need more vertical or horizontal space
  const needsMoreVertical = targetAspect < masterAspect;
  
  const prompt = `You are given a banner image (IMAGE 1). Your task is to recreate this EXACT banner but adapted for a different aspect ratio.

CURRENT BANNER: ${masterMetadata.width}x${masterMetadata.height} (${masterAspect.toFixed(2)}:1)
TARGET: ${targetWidth}x${targetHeight} (${targetAspect.toFixed(2)}:1)

${needsMoreVertical ? `
The target is TALLER (more vertical space). You need to:
- Keep ALL elements from the original (icon, wordmark, any tagline) at the SAME SIZE
- Extend the background VERTICALLY (top and bottom)
- CENTER the main content group vertically
- Match the background style/gradient EXACTLY
- DO NOT crop or cut off any elements
` : `
The target is WIDER (more horizontal space). You need to:
- Keep ALL elements from the original at the SAME SIZE
- Extend the background HORIZONTALLY
- CENTER the main content group
- Match the background style/gradient EXACTLY
`}

CRITICAL RULES:
1. The icon, wordmark "${brandName}", and any text must be IDENTICAL to the input
2. The colors, gradients, and style must match EXACTLY
3. Only the background area should change to accommodate the new aspect ratio
4. This is NOT a crop - it's an EXTENSION of the canvas

OUTPUT: A single image at approximately ${targetWidth}x${targetHeight} with the exact same content, just recomposed for the new aspect ratio.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/png", data: masterBase64 } },
          { text: prompt }
        ]
      }
    ],
    config: { 
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      imageConfig: { imageSize: '2K' }
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const metadata = await sharp(buffer).metadata();
      console.log(`      [Gemini output: ${metadata.width}x${metadata.height}]`);
      
      // Resize to exact target dimensions
      await sharp(buffer)
        .resize(targetWidth, targetHeight, { 
          fit: "cover", 
          position: "center",
          kernel: "lanczos3"
        })
        .png()
        .toFile(outputPath);
        
      console.log(`      [Resized to ${targetWidth}x${targetHeight}]`);
      return outputPath;
    }
  }
  
  throw new Error(`Failed to adapt banner aspect ratio`);
}
