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
  
  // VERSIONED OUTPUT - never overwrite previous generations
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const mascotBaseDir = path.join(brandDir, "mascot");
  const mascotDir = outputDir || path.join(mascotBaseDir, `gen-${timestamp}`);
  const posesDir = path.join(mascotDir, "poses");
  fs.mkdirSync(posesDir, { recursive: true });
  
  // Also create/update a "latest" symlink for convenience
  const latestLink = path.join(mascotBaseDir, "latest");
  try {
    if (fs.existsSync(latestLink)) fs.unlinkSync(latestLink);
    fs.symlinkSync(mascotDir, latestLink);
  } catch { /* symlink may fail on some systems */ }

  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  OpenGFX Mascot Generator`);
  console.log(`  Brand: ${brandName}`);
  console.log(`  Type: ${characterType} | Style: ${style}`);
  console.log(`  Output: gen-${timestamp}`);
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

  // Step 3: Generate icon (head/bust) - USE MASTER AS REFERENCE
  console.log(`[3/4] Generating character icon...`);
  const iconPath = path.join(mascotDir, "mascot-icon.png");
  await generateCharacterImage(
    brandSystem,
    characterSpec,
    "portrait",
    "head and shoulders portrait ONLY, centered, friendly expression, icon-ready, white/transparent background, SAME CHARACTER as reference",
    iconPath,
    512,
    masterPath  // Reference master for consistency
  );
  console.log(`      ✓ mascot-icon.png (512x512)`);

  // Step 4: Generate pose variants - USE MASTER AS REFERENCE
  console.log(`[4/4] Generating pose variants...`);
  const poseFiles: string[] = [];
  const selectedPoses = POSE_VARIANTS.slice(0, Math.min(poses, POSE_VARIANTS.length));
  
  for (const pose of selectedPoses) {
    const posePath = path.join(posesDir, `${pose.name}.png`);
    await generateCharacterImage(
      brandSystem,
      characterSpec,
      pose.name,
      `${pose.prompt}, full body, white/transparent background, EXACT SAME CHARACTER as reference image - only change pose`,
      posePath,
      1024,
      masterPath  // Reference master for consistency
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

  const prompt = `You are a character designer creating a brand mascot. Your spec will generate MULTIPLE CONSISTENT images.

BRAND: ${brandName}
TAGLINE: ${tagline || "N/A"}
PRIMARY COLOR: ${colors.primary}
SECONDARY COLOR: ${colors.secondary || colors.accent || "#ffffff"}

CHARACTER TYPE: ${characterType}
STYLE: ${style}
PERSONALITY: ${personality}
USER FEATURES: ${features || "None specified"}

⚠️ CRITICAL ANATOMY RULE ⚠️
ARMS/CLAWS: EXACTLY 2. Never 3, never 4. TWO ARMS ONLY.
LEGS: Can be 2, 4, 6, or 8 depending on the creature type (e.g., crab = 6 legs, humanoid = 2 legs).

Generate a character spec JSON:
{
  "description": "Start with 'A [creature] with EXACTLY 2 arms/claws and [N] legs...' then describe body shape, shell/skin texture, overall silhouette",
  "features": [
    "EXACTLY 2 claws/arms (state this first)",
    "[N] legs positioned [how]",
    "body shape description (e.g., 'rounded crab shell', 'oval body')",
    "eye style and size",
    "antenna/appendage details if any",
    "color placement on body parts",
    "any asymmetric features (which side)"
  ],
  "designNotes": "Describe like a character bible: proportions, what makes it recognizable at small sizes, key silhouette elements"
}

If it's a CRAB/LOBSTER creature:
- Emphasize the SHELL shape (rounded, dome-like, protective)
- EXACTLY 2 large front claws
- Small walking legs underneath (typically 6)
- The shell is the main visual mass, claws extend from sides

Respond with ONLY valid JSON.`;

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
// CHARACTER IMAGE GENERATION (nano banana prompting)
// ═══════════════════════════════════════════════════════════════════

async function generateCharacterImage(
  brandSystem: BrandSystem,
  characterSpec: CharacterSpec,
  poseName: string,
  poseDescription: string,
  outputPath: string,
  size: number,
  referenceImagePath?: string
): Promise<void> {
  const stylePrompt = CHARACTER_STYLE_PROMPTS[characterSpec.style];

  // ═══════════════════════════════════════════════════════════════════
  // NANO BANANA PROMPTING: Front-load critical constraints, repeat key rules
  // ═══════════════════════════════════════════════════════════════════
  
  // FIRST LINE = MOST CRITICAL (Gemini weighs early tokens highest)
  const criticalFirst = `EXACTLY 2 ARMS. DO NOT DRAW MORE THAN 2 ARMS. TWO ARMS ONLY.`;
  
  // Negative prompting block (what NOT to do)
  const negativeBlock = `
❌ FORBIDDEN — NEVER DO THESE:
- NO 3 arms, NO 4 arms, NO extra limbs
- NO changing the character design
- NO different colors than specified
- NO realistic style (keep it stylized/cartoon)
- NO busy backgrounds
`;

  // Character description block
  const characterBlock = `
✅ CHARACTER DESIGN:
${characterSpec.description}

IDENTIFYING FEATURES:
${characterSpec.features.map(f => `• ${f}`).join("\n")}

DESIGN NOTES:
${characterSpec.designNotes}
`;

  // Color block with exact hex values
  const colorBlock = `
🎨 EXACT COLORS:
• Primary body: ${characterSpec.colors.primary}
• Secondary/highlights: ${characterSpec.colors.secondary}
• Accent details: ${characterSpec.colors.accent}
`;

  // Style block
  const styleBlock = `
🖼️ ART STYLE:
${stylePrompt}
Like Discord's Wumpus, Duolingo's owl, or Slack's slackbot — clean, memorable, mascot-quality.
`;

  // Pose block
  const poseBlock = `
📐 THIS IMAGE — POSE:
${poseDescription}
Character centered, filling 70% of frame, white background.
`;

  // Final reinforcement (repeat critical rule)
  const reinforcement = `
⚠️ FINAL CHECK: Count the arms before outputting. There must be EXACTLY 2 arms/claws. Not 3. Not 4. TWO.
`;

  // Assemble prompt with critical constraint FIRST and LAST
  const prompt = referenceImagePath 
    ? `${criticalFirst}

REFERENCE IMAGE PROVIDED — This is the EXACT character. Match it PERFECTLY. Only change the pose.
${negativeBlock}
${poseBlock}
${reinforcement}`
    : `${criticalFirst}
${negativeBlock}
${characterBlock}
${colorBlock}
${styleBlock}
${poseBlock}
${reinforcement}`;

  // Build content parts - reference image FIRST if provided
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  
  if (referenceImagePath && fs.existsSync(referenceImagePath)) {
    const refData = fs.readFileSync(referenceImagePath);
    const base64Ref = refData.toString("base64");
    parts.push({ inlineData: { mimeType: "image/png", data: base64Ref } });
  }
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const responseParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of responseParts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
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
