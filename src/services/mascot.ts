/**
 * OpenGFX Service 4: Mascot/Character Generator
 * Creates brand-aligned mascots and characters
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

import type { BrandSystem, ColorPalette, RenderStyle } from "../types.js";
import { ai, IMAGE_MODEL } from "../ai.js";
import { Modality } from "@google/genai";
import { RENDER_STYLE_PROMPTS } from "../constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type CharacterType = 
  | "mascot"      // Brand mascot (friendly, approachable)
  | "avatar"      // Human-like character
  | "creature"    // Fantasy/abstract creature
  | "robot"       // Robot/android
  | "animal"      // Anthropomorphic animal
  | "abstract";   // Abstract/geometric character

export type CharacterStyle =
  | "2d-flat"        // Flat vector style (like Slack/Discord mascots)
  | "2d-illustrated" // Detailed 2D illustration
  | "3d-rendered"    // 3D rendered look
  | "pixel"          // Pixel art style
  | "anime"          // Anime/manga style
  | "clay"           // Claymation/3D clay look
  | "gradient"       // Gradient-rich modern style
  | "glassmorphic";  // Glass/transparent style

export interface MascotOptions {
  characterType?: CharacterType;
  style?: CharacterStyle;
  personality?: string;
  features?: string;
  poses?: number;       // Number of pose variants (1-4, default 3)
  outputDir?: string;
  jobId?: string;
}

export interface MascotResult {
  masterPath: string;
  iconPath: string;
  poses: string[];
  specPath: string;
  characterSpec: CharacterSpec;
}

export interface CharacterSpec {
  brandName: string;
  characterType: CharacterType;
  style: CharacterStyle;
  personality: string;
  features: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  description: string;
  designNotes: string;
}

// ═══════════════════════════════════════════════════════════════════
// STYLE PROMPTS
// ═══════════════════════════════════════════════════════════════════

const CHARACTER_STYLE_PROMPTS: Record<CharacterStyle, string> = {
  "2d-flat": `
    FLAT VECTOR STYLE:
    - Clean, minimal vector shapes
    - Solid colors with no gradients or minimal gradients
    - Bold outlines or no outlines
    - Like Slack's slackbot, Discord's Wumpus, or Duolingo's owl
    - Simple, memorable silhouette
    - Works great at small sizes
  `,
  "2d-illustrated": `
    ILLUSTRATED 2D STYLE:
    - Detailed 2D illustration with depth
    - Soft shadows and highlights
    - Rich textures and details
    - Professional character design quality
    - Like high-end mobile game characters
  `,
  "3d-rendered": `
    3D RENDERED STYLE:
    - Soft 3D rendered look
    - Smooth surfaces with realistic lighting
    - Subtle ambient occlusion
    - Like Pixar or modern 3D animation
    - Premium, polished feel
  `,
  "pixel": `
    PIXEL ART STYLE:
    - Retro pixel art aesthetic
    - Limited color palette
    - Crisp pixel edges (no anti-aliasing blur)
    - Nostalgic gaming feel
    - Works at 64x64 to 256x256 native resolution
  `,
  "anime": `
    ANIME/MANGA STYLE:
    - Japanese anime art style
    - Large expressive eyes
    - Dynamic poses and expressions
    - Clean linework with cel shading
    - Vibrant colors
  `,
  "clay": `
    CLAYMATION STYLE:
    - 3D clay/plasticine look
    - Soft, rounded forms
    - Visible texture like stop-motion animation
    - Warm, tactile feel
    - Like Wallace & Gromit or Nintendo characters
  `,
  "gradient": `
    MODERN GRADIENT STYLE:
    - Rich gradients throughout
    - Vibrant, modern color transitions
    - Smooth blending
    - Contemporary tech aesthetic
    - Like modern app mascots
  `,
  "glassmorphic": `
    GLASSMORPHIC STYLE:
    - Translucent glass-like elements
    - Frosted glass effects
    - Subtle reflections and refractions
    - Modern UI aesthetic
    - Premium, ethereal feel
  `,
};

const CHARACTER_TYPE_PROMPTS: Record<CharacterType, string> = {
  "mascot": `
    BRAND MASCOT:
    - Friendly and approachable
    - Simple, memorable design
    - Can be used at various sizes
    - Represents the brand personality
    - Universal appeal
  `,
  "avatar": `
    HUMAN-LIKE AVATAR:
    - Stylized human character
    - Professional or casual based on brand
    - Relatable and personable
    - Can represent users or the brand
  `,
  "creature": `
    FANTASY CREATURE:
    - Unique, imaginative design
    - Can be cute or majestic
    - Original species/creature
    - Memorable and distinctive
  `,
  "robot": `
    ROBOT/ANDROID:
    - Tech-forward design
    - Can be cute or sleek
    - Mechanical elements visible
    - Modern, innovative feel
  `,
  "animal": `
    ANTHROPOMORPHIC ANIMAL:
    - Animal with human-like qualities
    - Expressive and characterful
    - Based on a specific animal species
    - Personality through body language
  `,
  "abstract": `
    ABSTRACT CHARACTER:
    - Geometric or abstract form
    - Not based on real creatures
    - Unique silhouette
    - Modern and artistic
  `,
};

// ═══════════════════════════════════════════════════════════════════
// POSE VARIANTS
// ═══════════════════════════════════════════════════════════════════

const POSE_VARIANTS = [
  { name: "hero", prompt: "confident standing pose, looking forward, heroic stance" },
  { name: "wave", prompt: "friendly waving pose, one hand raised in greeting" },
  { name: "thinking", prompt: "thoughtful pose, hand on chin, contemplative" },
  { name: "celebrate", prompt: "celebration pose, arms raised, excited and happy" },
  { name: "working", prompt: "focused working pose, engaged in activity" },
  { name: "relaxed", prompt: "casual relaxed pose, comfortable and at ease" },
];

// ═══════════════════════════════════════════════════════════════════
// MAIN SERVICE
// ═══════════════════════════════════════════════════════════════════

export async function generateMascot(
  brandSystemPath: string,
  options: MascotOptions = {}
): Promise<MascotResult> {
  const {
    characterType = "mascot",
    style = "2d-flat",
    personality = "friendly, approachable, modern",
    features = "",
    poses = 3,
    outputDir,
    jobId,
  } = options;

  // Load brand system
  let brandSystem: BrandSystem;
  let brandDir: string;

  if (brandSystemPath.startsWith("http")) {
    const response = await fetch(brandSystemPath);
    if (!response.ok) throw new Error(`Failed to fetch brand system: ${response.status}`);
    brandSystem = await response.json();
    const brandName = brandSystem.brand?.name || brandSystem.brandName || "Brand";
    brandDir = outputDir || path.join(__dirname, "..", "..", "output", brandName.toLowerCase().replace(/\s+/g, "-"));
  } else {
    brandSystem = JSON.parse(fs.readFileSync(brandSystemPath, "utf-8"));
    brandDir = path.dirname(brandSystemPath);
  }

  const brandName = brandSystem.brand?.name || brandSystem.brandName || "Brand";
  const mascotDir = outputDir || path.join(brandDir, "mascot");
  const posesDir = path.join(mascotDir, "poses");
  fs.mkdirSync(posesDir, { recursive: true });

  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  OpenGFX Mascot Generator`);
  console.log(`  Brand: ${brandName}`);
  console.log(`  Type: ${characterType} | Style: ${style}`);
  console.log(`══════════════════════════════════════════════════════════════\n`);

  // Step 1: Generate character concept
  console.log(`[1/4] Analyzing brand and generating character concept...`);
  const characterSpec = await generateCharacterSpec(
    brandSystem,
    characterType,
    style,
    personality,
    features
  );
  
  const specPath = path.join(mascotDir, "mascot-spec.json");
  fs.writeFileSync(specPath, JSON.stringify(characterSpec, null, 2));
  console.log(`      ✓ Character spec generated`);

  // Step 2: Generate master image (hero pose)
  console.log(`[2/4] Generating master character image...`);
  const masterPath = path.join(mascotDir, "mascot-master.png");
  await generateCharacterImage(
    brandSystem,
    characterSpec,
    "hero",
    "full body character, centered, white/transparent background, high quality",
    masterPath,
    1024
  );
  console.log(`      ✓ mascot-master.png (1024x1024)`);

  // Step 3: Generate icon (head/bust)
  console.log(`[3/4] Generating character icon...`);
  const iconPath = path.join(mascotDir, "mascot-icon.png");
  await generateCharacterImage(
    brandSystem,
    characterSpec,
    "portrait",
    "head and shoulders portrait, centered, friendly expression, icon-ready, white/transparent background",
    iconPath,
    512
  );
  console.log(`      ✓ mascot-icon.png (512x512)`);

  // Step 4: Generate pose variants
  console.log(`[4/4] Generating pose variants...`);
  const poseFiles: string[] = [];
  const selectedPoses = POSE_VARIANTS.slice(0, Math.min(poses, POSE_VARIANTS.length));
  
  for (const pose of selectedPoses) {
    const posePath = path.join(posesDir, `${pose.name}.png`);
    await generateCharacterImage(
      brandSystem,
      characterSpec,
      pose.name,
      `${pose.prompt}, full body, white/transparent background`,
      posePath,
      1024
    );
    poseFiles.push(posePath);
    console.log(`      ✓ poses/${pose.name}.png`);
  }

  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  ✓ MASCOT COMPLETE`);
  console.log(`  Master: mascot-master.png`);
  console.log(`  Icon: mascot-icon.png`);
  console.log(`  Poses: ${poseFiles.length} variants`);
  console.log(`  Output: ${mascotDir}`);
  console.log(`══════════════════════════════════════════════════════════════\n`);

  return {
    masterPath,
    iconPath,
    poses: poseFiles,
    specPath,
    characterSpec,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CHARACTER SPEC GENERATION
// ═══════════════════════════════════════════════════════════════════

async function generateCharacterSpec(
  brandSystem: BrandSystem,
  characterType: CharacterType,
  style: CharacterStyle,
  personality: string,
  features: string
): Promise<CharacterSpec> {
  const { brand, colors, renderStyle, brandName: altBrandName, tagline: altTagline } = brandSystem;
  const brandName = brand?.name || altBrandName || "Brand";
  const tagline = brand?.tagline || altTagline || "";

  const prompt = `You are a character designer creating a brand mascot/character.

BRAND CONTEXT:
- Name: ${brandName}
- Tagline: ${tagline || "N/A"}
- Primary Color: ${colors.primary}
- Secondary Color: ${colors.secondary || colors.accent || "#ffffff"}
- Brand Style: ${renderStyle?.preset || "modern"}

CHARACTER REQUIREMENTS:
- Type: ${characterType}
- Visual Style: ${style}
- Personality: ${personality}
- Specific Features: ${features || "None specified"}

Generate a detailed character specification in JSON format:
{
  "description": "2-3 sentence description of the character",
  "features": ["list", "of", "key", "visual", "features"],
  "designNotes": "Specific design guidance for consistent reproduction"
}

The character should:
1. Embody the brand's personality and values
2. Use the brand colors effectively
3. Be memorable and distinctive
4. Work well at various sizes (icon to full illustration)
5. Be appropriate for ${characterType} style

Respond with ONLY the JSON object, no other text.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  let parsed: { description: string; features: string[]; designNotes: string };
  try {
    parsed = JSON.parse(jsonMatch?.[0] || "{}");
  } catch {
    parsed = {
      description: `A ${characterType} character for ${brandName}`,
      features: [personality],
      designNotes: `Use ${style} style with brand colors`,
    };
  }

  return {
    brandName,
    characterType,
    style,
    personality,
    features: parsed.features || [],
    colors: {
      primary: colors.primary,
      secondary: colors.secondary || colors.accent || "#ffffff",
      accent: colors.accent || colors.primary,
    },
    description: parsed.description,
    designNotes: parsed.designNotes,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CHARACTER IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════════

async function generateCharacterImage(
  brandSystem: BrandSystem,
  characterSpec: CharacterSpec,
  poseName: string,
  poseDescription: string,
  outputPath: string,
  size: number
): Promise<void> {
  const stylePrompt = CHARACTER_STYLE_PROMPTS[characterSpec.style];
  const typePrompt = CHARACTER_TYPE_PROMPTS[characterSpec.characterType];

  const prompt = `Create a character illustration.

CHARACTER SPECIFICATION:
${characterSpec.description}

Key Features:
${characterSpec.features.map(f => `- ${f}`).join("\n")}

Design Notes:
${characterSpec.designNotes}

COLOR PALETTE (use these colors):
- Primary: ${characterSpec.colors.primary}
- Secondary: ${characterSpec.colors.secondary}
- Accent: ${characterSpec.colors.accent}

STYLE REQUIREMENTS:
${stylePrompt}

CHARACTER TYPE:
${typePrompt}

POSE/COMPOSITION:
${poseDescription}

TECHNICAL REQUIREMENTS:
- Output: ${size}x${size} pixels
- Background: Clean white or transparent
- Character should be centered and fill ~70% of the frame
- High quality, production-ready
- Consistent with brand identity

Create a premium, polished character that would fit a top-tier brand.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      // Ensure correct size
      await sharp(buffer)
        .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(outputPath);
      return;
    }
  }
  
  throw new Error(`Failed to generate character image for pose: ${poseName}`);
}

// ═══════════════════════════════════════════════════════════════════
// BYOL (Bring Your Own Logo) MODE
// ═══════════════════════════════════════════════════════════════════

export async function generateMascotFromLogo(
  logoUrl: string,
  brandName: string,
  colors: { primary: string; secondary?: string; accent?: string },
  options: MascotOptions = {}
): Promise<MascotResult> {
  // Create minimal brand system
  const brandSystem: BrandSystem = {
    version: "1.0",
    brand: {
      name: brandName,
      concept: `${options.characterType || "mascot"} character`,
    },
    colors: {
      primary: colors.primary,
      secondary: colors.secondary || "#ffffff",
      accent: colors.accent || colors.primary,
      background: colors.primary,
      foreground: "#ffffff",
    },
    typography: {
      headerFont: "Inter",
      headerWeight: 700,
      bodyFont: "Inter",
      bodyWeight: 400,
    },
    renderStyle: {
      preset: "flat",
      parameters: {},
    },
    logo: {
      icon: logoUrl,
      wordmark: "",
      horizontal: "",
      stacked: "",
    },
  };

  // Create temp brand system file
  const tempDir = path.join(__dirname, "..", "..", "output", brandName.toLowerCase().replace(/\s+/g, "-"));
  fs.mkdirSync(tempDir, { recursive: true });
  
  const brandSystemPath = path.join(tempDir, "brand-system.json");
  fs.writeFileSync(brandSystemPath, JSON.stringify(brandSystem, null, 2));

  return generateMascot(brandSystemPath, { ...options, outputDir: path.join(tempDir, "mascot") });
}
