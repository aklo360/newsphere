/**
 * OpenGFX Mascot Service — UNIFIED
 * 
 * ARCHITECTURE:
 * 1. ONE INPUT: Natural language prompt OR brand-system.json
 * 2. TWO MODES: Generate master from scratch OR expression sheet from locked master
 * 3. EXPRESSION-ONLY POSES: Body stays identical, only face changes
 * 4. VISION QC: Verifies anatomy before delivery
 * 5. CDN UPLOAD: All outputs uploaded with URLs returned
 * 
 * SELF-IMPROVEMENT:
 * This service imports from src/learnings/*.ts at runtime.
 * To improve output quality: edit the learnings files, not this service.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { execSync } from "child_process";

import { ai, IMAGE_MODEL, TEXT_MODEL } from "../ai.js";
import { Modality } from "@google/genai";
import type { BrandSystem, ColorPalette } from "../types.js";

// SELF-IMPROVEMENT: Import runtime learnings
// Edit these files to improve ALL future mascot generation
import {
  GEMINI_RULES,
  POST_PROCESSING_RULES,
  GENERATION_RULES,
  CREATURE_RULES,
  PROMPT_BLOCKS,
} from "../learnings/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// ANATOMY SYSTEM (inline - no separate file)
// ═══════════════════════════════════════════════════════════════════

export interface AnatomySchema {
  creature: string;
  body: { type: string; description: string };
  arms: { count: number; type: string; description: string };
  legs: { count: number; type: string; description: string };
  face: { eyes: string; mouth: string; extras?: string[] };
  extras?: string[];
}

interface PoseAnatomyConfig {
  showLegs: "full" | "partial" | "hidden";
  showArms: "full" | "partial" | "one-raised";
  bodyAngle: "front" | "side" | "three-quarter";
  expression: string;
}

const POSE_ANATOMY: Record<string, PoseAnatomyConfig> = {
  master: { showLegs: "partial", showArms: "full", bodyAngle: "front", expression: "friendly smile" },
  wave: { showLegs: "full", showArms: "full", bodyAngle: "front", expression: "happy, friendly" },
  happy: { showLegs: "partial", showArms: "full", bodyAngle: "front", expression: "eyes closed in joy (^_^), big smile" },
  sad: { showLegs: "partial", showArms: "full", bodyAngle: "front", expression: "droopy eyes, frown, maybe tear" },
  angry: { showLegs: "partial", showArms: "full", bodyAngle: "front", expression: "V-shaped angry eyebrows, narrowed eyes, grumpy frown" },
  laugh: { showLegs: "full", showArms: "full", bodyAngle: "front", expression: "open mouth laughing, eyes squeezed shut" },
};

// NO PRESETS — anatomy is fully dynamic, interpreted by AI from the prompt

function buildAnatomyPrompt(schema: AnatomySchema, pose: string): string {
  const poseConfig = POSE_ANATOMY[pose] || POSE_ANATOMY.master;
  const parts: string[] = [];
  
  parts.push(`BODY: ${schema.body.description}`);
  parts.push(`ARMS: ${schema.arms.description}`);
  
  if (schema.legs.count > 0) {
    const legVisibility = poseConfig.showLegs === "full" 
      ? `FULLY VISIBLE - show all ${schema.legs.count} legs clearly`
      : poseConfig.showLegs === "partial"
        ? `peeking out from under the body - partially visible`
        : `hidden under body`;
    parts.push(`LEGS: ${schema.legs.count} tiny ${schema.legs.type} ${legVisibility}`);
  }
  
  parts.push(`EYES: ${schema.face.eyes}`);
  parts.push(`EXPRESSION: ${poseConfig.expression}`);
  
  if (schema.face.extras) parts.push(`HEAD FEATURES: ${schema.face.extras.join(", ")}`);
  if (schema.extras) parts.push(`SPECIAL FEATURES: ${schema.extras.join(", ")}`);
  
  return parts.join("\n");
}

// NO HARDCODED CREATURE KNOWLEDGE — everything is dynamic from parseInputPrompt

function createAnatomySchema(creature: string, options: Partial<AnatomySchema>): AnatomySchema {
  // Fully dynamic — anatomy comes from AI parsing the prompt
  return {
    creature,
    body: options.body || { type: "body", description: `${creature} body` },
    arms: options.arms || { count: 0, type: "none", description: "anatomy determined by AI" },
    legs: options.legs || { count: 0, type: "none", description: "anatomy determined by AI" },
    face: options.face || { 
      eyes: "big round kawaii eyes with white highlight", 
      mouth: "small friendly smile" 
    },
    extras: options.extras,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface MascotInput {
  // Mode 1: Natural language prompt (generates everything)
  prompt?: string;
  
  // Mode 2: Locked master (expression sheet only)
  masterUrl?: string;
  masterPath?: string;
  
  // Required for both modes
  brandName: string;
  
  // Optional overrides
  creature?: string;           // "crab", "owl", "robot", etc.
  primaryColor?: string;       // "#5865F2"
  bgColor?: string;            // Background color (default: computed from primary)
  outlineColor?: string;       // "black" or "#1a1a2e"
  
  // Anatomy (auto-detected if not specified)
  clawCount?: number;          // Default: 2
  legCount?: number;           // REQUIRED if using locked master
  hasAntenna?: boolean;        // Default: false
  
  // Style
  style?: "2d-flat" | "2d-illustrated" | "gradient";  // Default: "2d-flat"
  hasGlossyHighlights?: boolean;  // Default: true
  
  // Output
  outputDir?: string;
  jobId?: string;
  uploadToCdn?: boolean;       // Default: true
}

export interface MascotOutput {
  // CDN URLs (if uploaded)
  urls: {
    master: string;
    wave: string;
    happy: string;
    sad: string;
    angry: string;
    laugh: string;
  };
  
  // Local paths
  localPaths: {
    master: string;
    wave: string;
    happy: string;
    sad: string;
    angry: string;
    laugh: string;
  };
  
  // Metadata
  anatomy: AnatomySchema;
  qcReport: QCReport;
  brandSlug: string;
}

export interface QCReport {
  passed: boolean;
  poses: Record<string, PoseQC>;
}

export interface PoseQC {
  passed: boolean;
  legCount?: number;
  clawCount?: number;
  issues: string[];
  attempts: number;
}

// Standard expression poses (LOCKED - these are the ONLY poses)
export type ExpressionPose = "master" | "wave" | "happy" | "sad" | "angry" | "laugh";

const EXPRESSION_POSES: ExpressionPose[] = ["master", "wave", "happy", "sad", "angry", "laugh"];

// ═══════════════════════════════════════════════════════════════════
// EXPRESSION DEFINITIONS (FACE ONLY - BODY NEVER CHANGES)
// ═══════════════════════════════════════════════════════════════════

const EXPRESSION_PROMPTS: Record<ExpressionPose, string> = {
  master: `EXPRESSION: Default friendly face
• Eyes: Large round eyes with white highlight spots - THIS IS THE CANONICAL EYE COLOR
• Mouth: Small gentle smile - SAME BLACK as body outline (NOT blue, NOT different shade)
• This is the CANONICAL expression - all others derive from this
• ⚠️ EYE COLOR MUST BE PRESERVED EXACTLY IN ALL OTHER POSES
• ⚠️ MOUTH LINEWORK = SAME COLOR AS BODY OUTLINE`,

  wave: `EXPRESSION: Friendly welcoming face (BODY UNCHANGED!)
• Eyes: SAME COLOR AS MASTER - normal round eyes with standard white highlight dots (NO sparkles, NO stars)
• Mouth: Open happy smile - SAME BLACK as body outline, pink tongue inside if open
• Blush: Optional light pink circles on cheeks
• ⚠️ BODY STAYS EXACTLY THE SAME
• ⚠️ EYE COLOR MUST MATCH MASTER EXACTLY
• ⚠️ MOUTH LINEWORK = SAME COLOR AS BODY OUTLINE`,

  happy: `EXPRESSION: Joyful closed-eye smile (^_^)
• Eyes: Closed in happy curves like ^_^ or >_< anime happy eyes (sparkle stars allowed ONLY here)
• Mouth: Big wide smile - SAME BLACK as body outline
• Blush: Pink/magenta circles on cheeks
• ⚠️ BODY STAYS EXACTLY THE SAME
• ⚠️ MOUTH LINEWORK = SAME COLOR AS BODY OUTLINE`,

  sad: `EXPRESSION: Sad droopy face
• Eyes: SAME COLOR AS MASTER - droopy/downturned with sad eyebrows, standard highlight dots
• Mouth: Small downturned frown - SAME BLACK as body outline
• Tear: Single blue tear drop on one cheek
• ⚠️ BODY STAYS EXACTLY THE SAME
• ⚠️ EYE COLOR MUST MATCH MASTER EXACTLY
• ⚠️ MOUTH LINEWORK = SAME COLOR AS BODY OUTLINE`,

  angry: `EXPRESSION: Angry grumpy face
• Eyes: SAME COLOR AS MASTER - narrowed with V-shaped angry eyebrows pointing DOWN, standard highlight dots
• Mouth: Grumpy frown or grimace - SAME BLACK as body outline
• No tears, no blush
• ⚠️ BODY STAYS EXACTLY THE SAME
• ⚠️ EYE COLOR MUST MATCH MASTER EXACTLY
• ⚠️ MOUTH LINEWORK = SAME COLOR AS BODY OUTLINE`,

  laugh: `EXPRESSION: Laughing hysterically (>o<)
• Eyes: Squeezed shut in happy curves (>o< style, NOT X eyes)
• Mouth: Wide open laughing - SAME BLACK as body outline, PINK tongue inside
• Tears: Small tears of joy on both sides of face
• ⚠️ BODY STAYS EXACTLY THE SAME
• ⚠️ MOUTH LINEWORK = SAME COLOR AS BODY OUTLINE`,
};

// ═══════════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a unique color palette based on prompt/creature vibe.
 * Called when no primaryColor is provided — NEVER default to the same color.
 */
async function generateColorFromVibe(prompt: string, creature: string): Promise<string> {
  // Creature-specific color suggestions (but still vary!)
  const creatureVibes: Record<string, string[]> = {
    elephant: ["#6B7280", "#9CA3AF", "#4B5563", "#8B5CF6", "#06B6D4"], // grays, purples, teals
    cat: ["#F97316", "#FBBF24", "#8B5CF6", "#EC4899", "#6366F1"], // orange, gold, purple, pink
    dog: ["#D97706", "#92400E", "#FBBF24", "#3B82F6", "#10B981"], // browns, gold, blue, green
    owl: ["#7C3AED", "#8B5CF6", "#6366F1", "#4F46E5", "#312E81"], // purples, indigos
    bunny: ["#EC4899", "#F472B6", "#FBBF24", "#A78BFA", "#FCA5A1"], // pinks, gold, lavender
    fox: ["#EA580C", "#F97316", "#DC2626", "#FB923C", "#FBBF24"], // oranges, reds
    penguin: ["#1E40AF", "#3B82F6", "#0EA5E9", "#06B6D4", "#14B8A6"], // blues, teals
    bear: ["#78350F", "#92400E", "#B45309", "#D97706", "#65A30D"], // browns, amber
    robot: ["#3B82F6", "#06B6D4", "#8B5CF6", "#6366F1", "#10B981"], // tech colors
    crab: ["#DC2626", "#EF4444", "#F97316", "#EA580C", "#B91C1C"], // reds, oranges
  };
  
  // Vibe-based colors from prompt keywords
  const vibeColors: Record<string, string[]> = {
    cute: ["#EC4899", "#F472B6", "#FBBF24", "#A78BFA", "#FCA5A1"],
    tech: ["#3B82F6", "#06B6D4", "#8B5CF6", "#6366F1", "#10B981"],
    nature: ["#10B981", "#059669", "#65A30D", "#84CC16", "#22C55E"],
    fire: ["#DC2626", "#EF4444", "#F97316", "#EA580C", "#FBBF24"],
    water: ["#0EA5E9", "#06B6D4", "#3B82F6", "#0284C7", "#14B8A6"],
    space: ["#7C3AED", "#8B5CF6", "#4F46E5", "#312E81", "#1E1B4B"],
    friendly: ["#FBBF24", "#F97316", "#10B981", "#06B6D4", "#EC4899"],
    professional: ["#3B82F6", "#1E40AF", "#6366F1", "#4F46E5", "#0F172A"],
    playful: ["#EC4899", "#8B5CF6", "#FBBF24", "#10B981", "#F97316"],
    dark: ["#4B5563", "#6B7280", "#374151", "#1F2937", "#6366F1"],
    bright: ["#FBBF24", "#F97316", "#10B981", "#EC4899", "#3B82F6"],
    music: ["#8B5CF6", "#EC4899", "#FBBF24", "#06B6D4", "#F97316"],
    gaming: ["#10B981", "#8B5CF6", "#EC4899", "#06B6D4", "#FBBF24"],
  };
  
  // Check for creature-specific colors
  const creatureLower = creature.toLowerCase();
  let colorPool: string[] = [];
  
  if (creatureVibes[creatureLower]) {
    colorPool = [...creatureVibes[creatureLower]];
  }
  
  // Check prompt for vibe keywords
  const promptLower = prompt.toLowerCase();
  for (const [vibe, colors] of Object.entries(vibeColors)) {
    if (promptLower.includes(vibe)) {
      colorPool = [...colorPool, ...colors];
    }
  }
  
  // If no specific colors found, use a diverse default pool
  if (colorPool.length === 0) {
    colorPool = [
      "#8B5CF6", // Purple
      "#EC4899", // Pink
      "#3B82F6", // Blue
      "#10B981", // Green
      "#F97316", // Orange
      "#06B6D4", // Cyan
      "#FBBF24", // Yellow
      "#EF4444", // Red
      "#6366F1", // Indigo
      "#14B8A6", // Teal
    ];
  }
  
  // Pick a random color from the pool
  const randomIndex = Math.floor(Math.random() * colorPool.length);
  return colorPool[randomIndex];
}

// Compute a soft pastel background from primary color
function computeBgColor(primaryColor: string): { hex: string; name: string } {
  // Simple lightening - take the color and make it 80% lighter
  const hex = primaryColor.replace("#", "");
  const r = Math.min(255, Math.floor(parseInt(hex.slice(0, 2), 16) * 0.3 + 200));
  const g = Math.min(255, Math.floor(parseInt(hex.slice(2, 4), 16) * 0.3 + 200));
  const b = Math.min(255, Math.floor(parseInt(hex.slice(4, 6), 16) * 0.3 + 200));
  const newHex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  return { hex: newHex, name: "soft pastel" };
}

function buildMasterPrompt(input: MascotInput, anatomy: AnatomySchema): string {
  const creature = input.creature || anatomy.creature || "mascot";
  const color = input.primaryColor || "#5865F2";
  const outline = input.outlineColor || "black";
  
  // LEARNINGS: Never use white background, compute complementary color
  const bg = input.bgColor 
    ? { hex: input.bgColor, name: "custom" }
    : computeBgColor(color);
  
  return `Create a 2D FLAT mascot character in Discord Wumpus / Duolingo owl style.

╔══════════════════════════════════════════════════════════════════╗
║  🚨 USER REQUEST — FOLLOW THIS EXACTLY 🚨                         ║
╚══════════════════════════════════════════════════════════════════╝

BRAND: ${input.brandName}
${input.prompt ? `
USER'S CONCEPT (THIS IS THE BIBLE — FOLLOW IT):
${input.prompt}

The mascot MUST match what the user described above.
If they said "elephant" → it must look like an elephant with trunk and big ears.
If they said "robotic" → it must look mechanical/robotic.
Interpret their request intelligently and create exactly what they asked for.
` : ""}

╔══════════════════════════════════════════════════════════════════╗
║  SIMPLICITY IS PARAMOUNT — GOLDEN RULE                           ║
╚══════════════════════════════════════════════════════════════════╝

THE RULE OF ONE: Pick ONE interesting visual element, not many.
- Target: 40-50% complexity — SIMPLE, CLEAN, MEMORABLE
- Think Apple, Stripe, Discord — minimalist elegance
- Can a child draw this from memory? (should be yes)
- Must be recognizable at 32x32px

╔══════════════════════════════════════════════════════════════════╗
║  LINE WEIGHT CONSISTENCY — #1 PRIORITY                           ║
║  LINE WEIGHT CONSISTENCY — #1 PRIORITY                           ║
║  LINE WEIGHT CONSISTENCY — #1 PRIORITY                           ║
╚══════════════════════════════════════════════════════════════════╝

Every single outline must be the EXACT SAME THICKNESS.
- NO thin lines anywhere
- NO thick lines anywhere  
- UNIFORM stroke width throughout entire character
- This is NON-NEGOTIABLE

⚠️⚠️⚠️ CREATURE ANATOMY — USE YOUR KNOWLEDGE ⚠️⚠️⚠️

${anatomy.body.description ? `DESCRIPTION: ${anatomy.body.description}` : ""}
${anatomy.extras && anatomy.extras.length > 0 ? `
KEY FEATURES THAT MUST BE PRESENT:
${anatomy.extras.map(f => `• ${f}`).join("\n")}
` : ""}

Use your knowledge of what a ${creature} looks like to create accurate anatomy.
The mascot must be INSTANTLY RECOGNIZABLE as a ${creature}.

🎨 STYLE:
- 2D FLAT illustration with glossy highlights
- Solid flat colors (NO gradients in body)
- YES to white glossy highlight spots for dimension
- Clean bold outlines in ${outline}
- Kawaii/cute aesthetic
- Like Discord's Wumpus or Slack's slackbot

🎨 COLORS:
• Body: ${color}
• ALL LINEWORK: ${outline} (body outline, mouth, eyebrows - ALL SAME COLOR)
• Highlights: White glossy spots
• Eyes: Large, round, with white catchlight highlights
• Mouth outline: ${outline} — SAME as body outline, NOT pink, NOT red, NOT different

👀 FACE (REQUIRED):
• Large expressive kawaii eyes with white highlight
• Small friendly smile mouth — outline in ${outline.toUpperCase()} (SAME as body outline, NOT colored)
• The character MUST have both eyes AND mouth visible
• ⚠️ MOUTH LINEWORK = SAME ${outline.toUpperCase()} AS BODY OUTLINE

📐 TECHNICAL (CRITICAL):
• Size: SQUARE 1024x1024 pixels
• Background: Solid flat ${bg.hex} ${bg.name} background filling the ENTIRE image
• Character centered, filling 70-80% of frame (~10-15% padding each side)
• FRONT-FACING view only
• Clean vector-quality edges
• NO white background - use the specified colored background

❌ FORBIDDEN:
- NO text, wordmarks, or letters
- NO complex patterns or textures
- NO realistic style
- NO busy backgrounds
- NO gradients in the body fill
- NO extra limbs beyond specified count`;
}

function buildExpressionPrompt(
  input: MascotInput,
  anatomy: AnatomySchema,
  pose: ExpressionPose
): string {
  const color = input.primaryColor || "#5865F2";
  const outline = input.outlineColor || "black";
  const bg = input.bgColor 
    ? { hex: input.bgColor, name: "custom" }
    : computeBgColor(color);
  
  return `Transform this character to show a new EXPRESSION. Body stays IDENTICAL.

╔══════════════════════════════════════════════════════════════════╗
║  LINE WEIGHT CONSISTENCY — #1 PRIORITY                           ║
║  LINE WEIGHT CONSISTENCY — #1 PRIORITY                           ║
║  LINE WEIGHT CONSISTENCY — #1 PRIORITY                           ║
╚══════════════════════════════════════════════════════════════════╝

Every outline must be the EXACT SAME THICKNESS as the reference image.
Match the reference line weight PERFECTLY.

⚠️⚠️⚠️ ANATOMY LOCK — DO NOT CHANGE ⚠️⚠️⚠️

The following must be IDENTICAL to the reference:
• CLAWS: EXACTLY ${anatomy.arms.count}
• LEGS: EXACTLY ${anatomy.legs.count}
• Body position: IDENTICAL
• Limb positions: IDENTICAL
• View angle: FRONT-FACING (same as reference)

ONLY the FACE changes. NOTHING else.

🔒 VIEW LOCK:
- Do NOT rotate the character
- Do NOT show from side angle
- Do NOT tilt the body
- Keep the EXACT same front-facing pose as reference

${EXPRESSION_PROMPTS[pose]}

🎨 COLORS (MATCH EXACTLY):
• Body: ${color}
• ALL LINEWORK: ${outline} (body, mouth, eyebrows - ALL SAME)
• Mouth outline: ${outline} — NOT pink, NOT red, NOT colored
• All linework must match outline color

📐 TECHNICAL:
• Size: SQUARE 1024x1024 pixels
• Background: Solid flat ${bg.hex} ${bg.name} (same as master)
• Character centered, filling 70-80% of frame

✅ FINAL VERIFICATION:
☐ Line weight matches reference?
☐ Claw count = ${anatomy.arms.count}?
☐ Leg count = ${anatomy.legs.count}?
☐ Front-facing view?
☐ Body position identical to reference?
☐ ONLY face/expression changed?
☐ EYE COLOR IDENTICAL to master? (CRITICAL - no sparkles except happy)
☐ MOUTH LINEWORK same ${outline} as body outline? (NOT pink/red)`;
}

// ═══════════════════════════════════════════════════════════════════
// CORE GENERATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

async function generateMasterImage(
  input: MascotInput,
  anatomy: AnatomySchema,
  outputPath: string
): Promise<void> {
  const prompt = buildMasterPrompt(input, anatomy);
  
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
      // LEARNINGS: Use cover fit to preserve full frame, 1024x1024
      await sharp(buffer)
        .resize(1024, 1024, { fit: "cover" })
        .png()
        .toFile(outputPath);
      return;
    }
  }
  
  throw new Error("Failed to generate master image");
}

async function generateExpressionImage(
  masterImageData: Buffer,
  input: MascotInput,
  anatomy: AnatomySchema,
  pose: ExpressionPose,
  outputPath: string
): Promise<void> {
  if (pose === "master") {
    // Just copy the master
    await sharp(masterImageData)
      .resize(1024, 1024, { fit: "cover" })
      .png()
      .toFile(outputPath);
    return;
  }
  
  const prompt = buildExpressionPrompt(input, anatomy, pose);
  
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/png", data: masterImageData.toString("base64") } },
        { text: prompt }
      ]
    }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      // LEARNINGS: Use cover fit to preserve full frame, 1024x1024
      await sharp(buffer)
        .resize(1024, 1024, { fit: "cover" })
        .png()
        .toFile(outputPath);
      return;
    }
  }
  
  throw new Error(`Failed to generate expression: ${pose}`);
}

// ═══════════════════════════════════════════════════════════════════
// VISION QC - Verify anatomy
// ═══════════════════════════════════════════════════════════════════

async function verifyAnatomy(
  imagePath: string,
  anatomy: AnatomySchema,
  masterPath?: string,
  pose?: string,
  originalPrompt?: string
): Promise<PoseQC> {
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");
  
  // Check eye color for ALL expressions (compare to master)
  const checkEyeColor = masterPath && pose && pose !== "master";
  const masterData = checkEyeColor ? fs.readFileSync(masterPath).toString("base64") : null;
  
  // FULLY DYNAMIC QC — no hardcoded creature knowledge
  const prompt = checkEyeColor 
    ? `You are a QC inspector verifying mascot quality and eye color consistency.

IMAGE 1 (MASTER): Reference image
IMAGE 2 (EXPRESSION): Image to verify

${originalPrompt ? `ORIGINAL USER REQUEST: "${originalPrompt}"` : `CREATURE TYPE: ${anatomy.creature}`}

INSTRUCTIONS:
1. Does the mascot match what was requested? Would someone immediately recognize it?
2. Check if IMAGE 2 is front-facing
3. Compare EYE COLOR between IMAGE 1 and IMAGE 2 - must be IDENTICAL
4. Check line weight consistency
5. Are eyes and mouth visible?

Respond with ONLY this JSON:
{
  "looks_like_requested": <boolean>,
  "what_it_looks_like": "<describe what creature/thing this appears to be>",
  "front_facing": <boolean>,
  "line_weight_consistent": <boolean>,
  "has_eyes": <boolean>,
  "has_mouth": <boolean>,
  "eye_color_matches": <boolean>,
  "master_eye_color": "<color>",
  "expression_eye_color": "<color>",
  "issues": ["list any problems"]
}`
    : `You are a QC inspector verifying mascot quality. BE STRICT but fair.

${originalPrompt ? `ORIGINAL USER REQUEST: "${originalPrompt}"` : `CREATURE TYPE: ${anatomy.creature}`}

INSTRUCTIONS:
1. Does this mascot match what was requested?
2. Would someone immediately recognize what it's supposed to be?
3. Is it front-facing?
4. Are lines consistent weight?
5. Are eyes and mouth visible?

Think about what the user ASKED FOR and whether this delivers that.

Respond with ONLY this JSON (no other text):
{
  "looks_like_requested": <boolean>,
  "what_it_looks_like": "<describe what creature/thing this appears to be>",
  "identifying_features_found": ["list key features visible"],
  "front_facing": <boolean>,
}`;

  try {
    const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];
    
    if (checkEyeColor && masterData) {
      parts.push({ inlineData: { mimeType: "image/png", data: masterData } });
    }
    parts.push({ inlineData: { mimeType: "image/png", data: base64Image } });
    parts.push({ text: prompt });
    
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: "user", parts }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { passed: false, issues: ["Could not parse QC response"], attempts: 1 };
    }
    
    const qc = JSON.parse(jsonMatch[0]);
    const issues: string[] = [];
    
    // CREATURE/REQUEST MATCH CHECK — most important
    if (qc.looks_like_requested === false) {
      issues.push(`Does not match request: looks like "${qc.what_it_looks_like || "unknown"}"`);
    }
    
    // Check view
    if (!qc.front_facing) {
      issues.push("Not front-facing view");
    }
    
    // Check line weight
    if (!qc.line_weight_consistent) {
      issues.push("Inconsistent line weight");
    }
    
    // Check face
    if (!qc.has_eyes) {
      issues.push("Missing eyes");
    }
    if (!qc.has_mouth) {
      issues.push("Missing mouth");
    }
    
    // Check eye color consistency (for expressions only)
    if (checkEyeColor && qc.eye_color_matches === false) {
      issues.push(`Eye color mismatch: master=${qc.master_eye_color}, expression=${qc.expression_eye_color}`);
    }
    
    // Add any issues from vision
    if (qc.issues && Array.isArray(qc.issues)) {
      issues.push(...qc.issues.filter((i: string) => i && i.length > 0));
    }
    
    return {
      passed: issues.length === 0,
      legCount: qc.leg_count,
      clawCount: qc.claw_count,
      issues,
      attempts: 1,
    };
  } catch (err) {
    return { passed: false, issues: [`QC error: ${err}`], attempts: 1 };
  }
}

// ═══════════════════════════════════════════════════════════════════
// CDN UPLOAD
// ═══════════════════════════════════════════════════════════════════

function uploadToCdn(
  localPath: string,
  cdnKey: string,
  opengfxDir: string
): string {
  try {
    execSync(
      `wrangler r2 object put opengfx-assets/${cdnKey} --file "${localPath}" --content-type "image/png" --remote`,
      { cwd: opengfxDir, stdio: "pipe" }
    );
    return `https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/${cdnKey}`;
  } catch (err) {
    console.error(`[upload] Failed to upload ${cdnKey}:`, err);
    return "";
  }
}

// ═══════════════════════════════════════════════════════════════════
// PARSE INPUT PROMPT - Extract creature, color, anatomy from natural language
// ═══════════════════════════════════════════════════════════════════

async function parseInputPrompt(prompt: string, brandName: string): Promise<{
  creature: string;
  creatureDescription: string;  // AI's description of what this creature should look like
  keyFeatures: string[];        // AI-determined key identifying features
  primaryColor: string | null;  // null if not specified → will generate from vibe
  outlineColor: string;
}> {
  const parsePrompt = `You are interpreting a mascot request. Use your general knowledge to understand what the user wants.

REQUEST: "${prompt}"
BRAND: "${brandName}"

Your job:
1. Identify what creature/character they want
2. Use your knowledge to describe what this creature SHOULD look like
3. List the KEY FEATURES that make this creature recognizable
4. Only extract color if EXPLICITLY mentioned

For example:
- "cute elephant" → elephant with trunk, big floppy ears, 4 legs, no arms
- "robotic owl" → owl shape with mechanical elements, big eyes, beak, wings
- "friendly crab mascot" → crab with shell, 2 claws, small legs

RESPOND WITH ONLY THIS JSON:
{
  "creature": "<what type of creature/thing>",
  "creatureDescription": "<describe what this creature should look like based on your knowledge - be specific about body parts, anatomy, distinguishing features>",
  "keyFeatures": ["<list 3-5 KEY features that MUST be present for this to be recognizable as this creature>"],
  "primaryColor": "<#hexcode if explicitly mentioned, otherwise null>",
  "outlineColor": "<outline color, default black>"
}`;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: "user", parts: [{ text: parsePrompt }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        creature: parsed.creature || "mascot",
        creatureDescription: parsed.creatureDescription || "",
        keyFeatures: parsed.keyFeatures || [],
        primaryColor: (parsed.primaryColor && parsed.primaryColor !== "null" && parsed.primaryColor.startsWith("#")) 
          ? parsed.primaryColor 
          : null,
        outlineColor: parsed.outlineColor || "black",
      };
    }
  } catch (err) {
    console.error("[parse] Failed to parse prompt:", err);
  }
  
  // Fallback — let the image model interpret directly
  return {
    creature: "mascot",
    creatureDescription: prompt, // Pass through the original prompt
    keyFeatures: [],
    primaryColor: null,
    outlineColor: "black",
  };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════

export async function generateMascot(input: MascotInput): Promise<MascotOutput> {
  const brandSlug = input.brandName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const opengfxDir = path.resolve(__dirname, "..", "..");
  
  // Setup output directory
  const baseDir = input.outputDir || path.join(opengfxDir, "output", brandSlug, "mascot", `unified-${timestamp}`);
  fs.mkdirSync(baseDir, { recursive: true });
  
  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  OpenGFX Mascot Generator (Unified)`);
  console.log(`  Brand: ${input.brandName}`);
  console.log(`══════════════════════════════════════════════════════════════\n`);
  
  // Determine anatomy
  let anatomy: AnatomySchema;
  
  // Store original prompt for QC
  let originalPrompt = input.prompt;
  
  if (input.prompt && !input.masterUrl && !input.masterPath) {
    // MODE 1: Generate from prompt - AI interprets what the creature should look like
    console.log(`[1/6] Parsing input prompt...`);
    const parsed = await parseInputPrompt(input.prompt, input.brandName);
    
    const creature = input.creature || parsed.creature;
    
    // COLOR: Use provided, or parsed, or generate unique color from vibe
    if (!input.primaryColor && !parsed.primaryColor) {
      console.log(`      Generating unique color from vibe...`);
      input.primaryColor = await generateColorFromVibe(input.prompt || "", creature);
    } else {
      input.primaryColor = input.primaryColor || parsed.primaryColor;
    }
    input.outlineColor = input.outlineColor || parsed.outlineColor;
    
    // Create anatomy schema with AI-interpreted description
    // NO PRESETS — anatomy comes entirely from AI interpretation
    anatomy = createAnatomySchema(creature, {
      body: { type: "body", description: parsed.creatureDescription || `${creature} body` },
      extras: parsed.keyFeatures.length > 0 ? parsed.keyFeatures : undefined,
    });
    
    console.log(`      Creature: ${creature}`);
    console.log(`      AI Description: ${parsed.creatureDescription?.slice(0, 100)}...`);
    console.log(`      Key Features: ${parsed.keyFeatures.join(", ") || "AI will determine"}`);
    console.log(`      Color: ${input.primaryColor} (${parsed.primaryColor ? 'from prompt' : 'generated'})`);
  } else {
    // MODE 2: Expression sheet from locked master - anatomy MUST be provided
    if (!input.legCount) {
      throw new Error("legCount is REQUIRED when using locked master (expression sheet mode)");
    }
    
    const creature = input.creature || "mascot";
    anatomy = createAnatomySchema(creature, {
      arms: { count: input.clawCount || 2, type: "claws", description: `${input.clawCount || 2} claws` },
      legs: { count: input.legCount, type: "legs", description: `${input.legCount} tiny legs` },
      face: { 
        eyes: "large kawaii eyes with highlight",
        mouth: "small friendly smile",
        extras: input.hasAntenna ? ["antenna on head"] : undefined,
      },
    });
    
    console.log(`[1/6] Using locked master with anatomy:`);
    console.log(`      Claws: ${anatomy.arms.count}`);
    console.log(`      Legs: ${anatomy.legs.count}`);
  }
  
  // Save anatomy
  const anatomyPath = path.join(baseDir, "anatomy.json");
  fs.writeFileSync(anatomyPath, JSON.stringify(anatomy, null, 2));
  
  // Load or generate master
  let masterImageData: Buffer;
  const masterPath = path.join(baseDir, "master.png");
  
  if (input.masterPath && fs.existsSync(input.masterPath)) {
    console.log(`[2/6] Loading master from file...`);
    masterImageData = fs.readFileSync(input.masterPath);
    await sharp(masterImageData).resize(1024, 1024, { fit: "cover" }).png().toFile(masterPath);
  } else if (input.masterUrl) {
    console.log(`[2/6] Fetching master from URL...`);
    const response = await fetch(input.masterUrl);
    if (!response.ok) throw new Error(`Failed to fetch master: ${response.status}`);
    masterImageData = Buffer.from(await response.arrayBuffer());
    await sharp(masterImageData).resize(1024, 1024, { fit: "cover" }).png().toFile(masterPath);
  } else {
    console.log(`[2/6] Generating master image...`);
    await generateMasterImage(input, anatomy, masterPath);
    masterImageData = fs.readFileSync(masterPath);
  }
  console.log(`      ✓ master.png`);
  
  // Generate expression poses
  const localPaths: Record<string, string> = { master: masterPath };
  const qcReport: QCReport = { passed: true, poses: {} };
  const MAX_RETRIES = 2;
  
  console.log(`[3/6] Generating expressions...`);
  for (const pose of EXPRESSION_POSES) {
    if (pose === "master") continue;
    
    const posePath = path.join(baseDir, `${pose}.png`);
    let attempts = 0;
    let passed = false;
    
    while (!passed && attempts <= MAX_RETRIES) {
      attempts++;
      
      await generateExpressionImage(masterImageData, input, anatomy, pose, posePath);
      
      // Run QC (includes anatomy + eye color consistency)
      const qcResult = await verifyAnatomy(posePath, anatomy, masterPath, pose);
      qcResult.attempts = attempts;
      
      if (qcResult.passed) {
        console.log(`      ✓ ${pose}.png (QC PASS)`);
        passed = true;
        qcReport.poses[pose] = qcResult;
      } else {
        console.log(`      ⚠️ ${pose} QC FAIL (attempt ${attempts}): ${qcResult.issues.join(", ")}`);
        
        if (attempts > MAX_RETRIES) {
          console.log(`      ❌ Max retries — accepting with warning`);
          qcReport.poses[pose] = qcResult;
          qcReport.passed = false;
        }
      }
    }
    
    localPaths[pose] = posePath;
  }
  
  // QC master too
  console.log(`[4/6] QC verification on master...`);
  const masterQc = await verifyAnatomy(masterPath, anatomy);
  qcReport.poses["master"] = masterQc;
  if (!masterQc.passed) {
    console.log(`      ⚠️ Master QC issues: ${masterQc.issues.join(", ")}`);
    qcReport.passed = false;
  } else {
    console.log(`      ✓ Master QC PASS`);
  }
  
  // Upload to CDN
  const urls: Record<string, string> = {};
  
  if (input.uploadToCdn !== false) {
    console.log(`[5/6] Uploading to CDN...`);
    for (const pose of EXPRESSION_POSES) {
      const cdnKey = `${brandSlug}/mascot/FINAL/${pose}.png`;
      const url = uploadToCdn(localPaths[pose], cdnKey, opengfxDir);
      urls[pose] = url;
      if (url) {
        console.log(`      ✓ ${pose}.png → CDN`);
      }
    }
  } else {
    console.log(`[5/6] Skipping CDN upload (disabled)`);
  }
  
  // Final summary
  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  ✓ MASCOT COMPLETE`);
  console.log(`  QC: ${qcReport.passed ? "ALL PASSED" : "SOME WARNINGS"}`);
  console.log(`  Output: ${baseDir}`);
  if (urls.master) {
    console.log(`  CDN: ${urls.master.replace("/master.png", "/")}`);
  }
  console.log(`══════════════════════════════════════════════════════════════\n`);
  
  // Print result for gateway parsing
  const resultJson = {
    urls,
    localPaths,
    anatomy,
    qcPassed: qcReport.passed,
  };
  console.log(`MASCOT_RESULT:${JSON.stringify(resultJson)}`);
  
  return {
    urls: urls as MascotOutput["urls"],
    localPaths: localPaths as MascotOutput["localPaths"],
    anatomy,
    qcReport,
    brandSlug,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE: Generate from brand-system.json
// ═══════════════════════════════════════════════════════════════════

export async function generateMascotFromBrandSystem(
  brandSystemPath: string,
  prompt: string,
  options: Partial<MascotInput> = {}
): Promise<MascotOutput> {
  let brandSystem: BrandSystem;
  
  if (brandSystemPath.startsWith("http")) {
    const response = await fetch(brandSystemPath);
    if (!response.ok) throw new Error(`Failed to fetch brand system: ${response.status}`);
    brandSystem = await response.json();
  } else {
    brandSystem = JSON.parse(fs.readFileSync(brandSystemPath, "utf-8"));
  }
  
  const brandName = brandSystem.brand?.name || brandSystem.brandName || "Brand";
  const primaryColor = brandSystem.colors?.primary || options.primaryColor;
  
  return generateMascot({
    brandName,
    prompt,
    primaryColor,
    ...options,
  });
}
