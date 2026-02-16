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
// RENDERED AVATAR GENERATION
// ═══════════════════════════════════════════════════════════════════

export async function generateRenderedAvatar(
  iconPath: string,
  renderStyle: RenderStyle,
  colors: ColorPalette,
  outputPath: string
): Promise<string> {
  // Read the black icon as reference
  const iconData = fs.readFileSync(iconPath);
  const base64Icon = iconData.toString("base64");
  
  // Get the render style prompt
  const stylePrompt = renderStyle.preset === "custom" && renderStyle.customPrompt
    ? renderStyle.customPrompt
    : RENDER_STYLE_PROMPTS[renderStyle.preset] || RENDER_STYLE_PROMPTS.gradient;

  const prompt = `Transform this black logo icon into a stunning rendered version.

STYLE INSTRUCTIONS:
${stylePrompt}

BRAND COLORS:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}

REQUIREMENTS:
- Maintain the EXACT shape of the original icon
- Apply the render style while keeping it recognizable
- Output should be 1024x1024 pixels
- Icon should be centered with some padding
- Background should complement the render style (can be transparent, solid, or gradient)

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
      return outputPath;
    }
  }
  throw new Error(`Failed to generate rendered avatar`);
}

// ═══════════════════════════════════════════════════════════════════
// BANNER GENERATION
// ═══════════════════════════════════════════════════════════════════

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
  const logoData = fs.readFileSync(logoPath);
  const base64Logo = logoData.toString("base64");

  const stylePrompt = renderStyle.preset === "custom" && renderStyle.customPrompt
    ? renderStyle.customPrompt
    : RENDER_STYLE_PROMPTS[renderStyle.preset] || RENDER_STYLE_PROMPTS.gradient;

  const prompt = `Create a professional social media banner featuring this logo.

BANNER SPECIFICATIONS:
- Dimensions: ${width}x${height} pixels
- Aspect ratio: ${width}:${height}

BRAND DETAILS:
- Brand name: ${brandName}
${tagline ? `- Tagline: "${tagline}"` : ""}
- Header font: ${typography.headerFont}
- Body font: ${typography.bodyFont}

STYLE:
${stylePrompt}

COLORS:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Background: ${colors.background}

LAYOUT REQUIREMENTS:
- Logo/wordmark should be prominently featured
- Clean, professional composition
- ${tagline ? "Include the tagline in body font" : "Focus on logo only"}
- Leave appropriate padding/margins
- Make it look like a premium brand banner

Create a stunning banner that matches the brand's visual identity.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Logo } },
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
      return outputPath;
    }
  }
  throw new Error(`Failed to generate banner`);
}
