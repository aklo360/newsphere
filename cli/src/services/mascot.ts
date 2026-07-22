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
 * This service imports from src/guidance/*.ts at runtime.
 * To improve output quality: edit the guidance files, not this service.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { execSync } from "child_process";

import { ai, IMAGE_MODEL, TEXT_MODEL } from "../ai.js";
import { Modality } from "@google/genai";
import type { BrandSystem, ColorPalette } from "../types.js";

// SELF-IMPROVEMENT: Import runtime guidance.
// Edit these files to improve ALL future mascot generation
import {
  GEMINI_RULES,
  POST_PROCESSING_RULES,
  GENERATION_RULES,
  CREATURE_RULES,
  PROMPT_BLOCKS,
} from "../guidance/index.js";

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
  master: `EXPRESSION: Default IDLE pose - neutral, friendly
• Arms: DOWN at sides (NOT waving, NOT raised)
• Eyes: Large round eyes with white highlight spots - THIS IS THE CANONICAL EYE COLOR
• Mouth: Small gentle smile - anatomically correct position for this creature
• This is the CANONICAL expression - all others derive from this
• IDLE POSE = relaxed, standing, arms at sides
• ⚠️ EYE COLOR MUST BE PRESERVED EXACTLY IN ALL OTHER POSES`,

  wave: `EXPRESSION: Friendly welcoming - ONE ARM RAISED waving
• Arms: ONE ARM UP waving hello (this is the wave pose!)
• Eyes: SAME COLOR AS MASTER - happy, friendly
• Mouth: Happy smile - keep anatomically correct for this creature
• Blush: Optional light pink circles on cheeks
• ⚠️ BODY SAME except one arm waves
• ⚠️ EYE COLOR MUST MATCH MASTER EXACTLY`,

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

// Color is now handled by the Creative Brief — no separate function needed

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

function buildMasterPromptFromBrief(brief: CreativeBrief, brandName: string): string {
  const isElephant = brief.creature.toLowerCase().includes("elephant");
  
  const elephantBlock = isElephant ? `
🐘🐘🐘 CRITICAL ELEPHANT ANATOMY — NEVER VIOLATE 🐘🐘🐘
• The TRUNK is the extended NOSE
• The MOUTH must be BELOW or BESIDE where the trunk meets the face
• A mouth ABOVE the trunk is ANATOMICALLY IMPOSSIBLE
• The mouth is a small opening under/beside where the trunk attaches to face
• NEVER put a smile/mouth ABOVE the trunk — this is INSTANT REJECTION
🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘
` : "";

  return `Create a 2D FLAT mascot character in Discord Wumpus / Duolingo owl style.
${elephantBlock}

╔══════════════════════════════════════════════════════════════════╗
║  🎨 CREATIVE BRIEF FROM DIRECTOR                                  ║
╚══════════════════════════════════════════════════════════════════╝

BRAND: ${brandName}
CREATURE: ${brief.creature}
MOOD: ${brief.moodAndVibe}

${brief.imagePrompt}

╔══════════════════════════════════════════════════════════════════╗
║  MUST-HAVE FEATURES (NON-NEGOTIABLE)                              ║
╚══════════════════════════════════════════════════════════════════╝

${brief.mustHaveFeatures.map(f => `• ${f}`).join("\n")}

${brief.styleNotes ? `STYLE NOTES: ${brief.styleNotes}` : ""}

╔══════════════════════════════════════════════════════════════════╗
║  LINE WEIGHT CONSISTENCY — #1 PRIORITY                           ║
╚══════════════════════════════════════════════════════════════════╝

Every single outline must be the EXACT SAME THICKNESS.
UNIFORM stroke width throughout entire character.

🎨 STYLE:
- 2D FLAT illustration with glossy highlights
- Solid flat colors (NO gradients in body)
- YES to white glossy highlight spots for dimension
- Clean bold outlines in ${brief.outlineColor}
- Kawaii/cute aesthetic
- Like Discord's Wumpus or Slack's slackbot

🎨 COLORS:
• Body: ${brief.primaryColor}
• ALL LINEWORK: ${brief.outlineColor} (body outline, mouth, eyebrows - ALL SAME COLOR)
• Highlights: White glossy spots
• Eyes: Large, round, with white catchlight highlights

📐 TECHNICAL (CRITICAL):
• Size: SQUARE 1024x1024 pixels
• Background: Solid flat ${brief.backgroundColor}
• Character centered, filling 70-80% of frame (~10-15% padding each side)
• FRONT-FACING view only
• Clean vector-quality edges

❌ FORBIDDEN:
- NO text, wordmarks, or letters
- NO complex patterns or textures
- NO realistic style
- NO busy backgrounds
- NO gradients in the body fill`;
}

function buildExpressionPrompt(
  input: MascotInput,
  anatomy: AnatomySchema,
  pose: ExpressionPose,
  brief?: CreativeBrief | null
): string {
  const color = input.primaryColor || "#5865F2";
  const outline = input.outlineColor || "black";
  const bg = input.bgColor 
    ? { hex: input.bgColor, name: "custom" }
    : computeBgColor(color);
  
  // Include creature-specific expression notes if available
  const isElephant = brief?.creature?.toLowerCase().includes("elephant") || 
                     anatomy.creature.toLowerCase().includes("elephant");
  
  const elephantWarning = isElephant ? `
🐘🐘🐘 CRITICAL ELEPHANT ANATOMY — NEVER VIOLATE 🐘🐘🐘
• The TRUNK is the extended NOSE
• The MOUTH must be BELOW or BESIDE where the trunk meets the face
• A mouth ABOVE the trunk is ANATOMICALLY IMPOSSIBLE
• When laughing/smiling: mouth opens UNDER the trunk, trunk can flip UP
• NEVER put a smile/mouth ABOVE the trunk — this is INSTANT REJECTION
🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘
` : "";
  
  const expressionGuidance = brief?.expressionNotes 
    ? `\n\n🐾 CREATURE-SPECIFIC EXPRESSION NOTES:\n${brief.expressionNotes}\nFollow these anatomical guidelines for how this creature shows emotions.\n${elephantWarning}`
    : elephantWarning;
  
  return `Transform this character to show a new EXPRESSION. Body stays IDENTICAL.
${expressionGuidance}

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
  brief: CreativeBrief,
  brandName: string,
  outputPath: string
): Promise<void> {
  // Build the full prompt from the creative brief
  const basePrompt = buildMasterPromptFromBrief(brief, brandName);
  
  const fullPrompt = `${basePrompt}

🎨 COLORS:
• Body: ${brief.primaryColor}
• ALL LINEWORK: ${brief.outlineColor}
• Highlights: White glossy spots
• Eyes: Large round with white catchlight

📐 TECHNICAL (CRITICAL):
• Size: SQUARE 1024x1024 pixels
• Background: Solid flat ${brief.backgroundColor}
• Character centered, filling 70-80% of frame
• FRONT-FACING view only

❌ FORBIDDEN:
- NO text, wordmarks, or letters
- NO realistic style
- NO busy backgrounds
- NO gradients in body fill`;
  
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
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
  outputPath: string,
  brief?: CreativeBrief | null
): Promise<void> {
  if (pose === "master") {
    // Just copy the master
    await sharp(masterImageData)
      .resize(1024, 1024, { fit: "cover" })
      .png()
      .toFile(outputPath);
    return;
  }
  
  const prompt = buildExpressionPrompt(input, anatomy, pose, brief);
  
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
  brief?: CreativeBrief | null
): Promise<PoseQC> {
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");
  
  // Check eye color for ALL expressions (compare to master)
  const checkEyeColor = masterPath && pose && pose !== "master";
  const masterData = checkEyeColor ? fs.readFileSync(masterPath).toString("base64") : null;
  
  // Build QC criteria from the creative brief
  const mustHaveFeatures = brief?.mustHaveFeatures || [];
  const qcCriteria = brief?.qcCriteria || ["has eyes", "has mouth", "front-facing"];
  const creatureDesc = brief?.creatureDescription || anatomy.creature;
  
  // CREATIVE DIRECTOR QC — criteria comes from the brief
  const prompt = checkEyeColor 
    ? `You are a Creative Director doing STRICT QC on a mascot expression.

IMAGE 1 (MASTER): Reference image  
IMAGE 2 (EXPRESSION): Image to verify

THE BRIEF: "${creatureDesc}"

⚠️ CRITICAL ANATOMY CHECKS (REJECT IF WRONG):
1. MOUTH must be on the FACE (not on the belly/body!)
2. EYES must be on the FACE (not elsewhere!)
3. All facial features in correct anatomical positions
4. Body structure matches master (same character)

🐘 ELEPHANT-SPECIFIC ANATOMY (if this is an elephant):
- The TRUNK is the extended NOSE
- The MOUTH must be BELOW or BESIDE the trunk base (where trunk meets face)
- A mouth ABOVE the trunk is ANATOMICALLY IMPOSSIBLE — INSTANT REJECT
- The mouth should be a small opening under/beside where the trunk attaches
- This is the #1 elephant mistake — CHECK CAREFULLY

MUST-HAVE FEATURES:
${mustHaveFeatures.map(f => `• ${f}`).join("\n") || "• (none specified)"}

REVIEW CHECKLIST:
${qcCriteria.map(c => `☐ ${c}`).join("\n")}

⚠️ CRITICAL CONSISTENCY CHECKS (REJECT IF DIFFERENT FROM MASTER):

☐ EYE COLOR — Must be EXACTLY the same as master!
  - If master has BLACK eyes → expression must have BLACK eyes
  - If master has BLUE eyes → expression must have BLUE eyes
  - ONLY exception: sparkly/heart eyes for specific expressions
  - This is the #1 most common mistake — CHECK CAREFULLY

☐ DESIGN ELEMENTS — Patterns/textures must match master:
  - Ear patterns (circuit boards, stripes, etc.) IDENTICAL
  - Body markings IDENTICAL
  - Special features PRESERVED (don't lose details!)

☐ Body position identical to master (except for pose-specific changes)
☐ Facial features are ON THE FACE, not misplaced

Respond with ONLY this JSON:
{
  "matches_brief": <boolean>,
  "mouth_on_face": <boolean>,
  "eyes_on_face": <boolean>,
  "anatomy_correct": <boolean>,
  "elephant_mouth_below_trunk": <boolean or null if not elephant>,
  "eye_color_matches": <boolean>,
  "body_matches_master": <boolean>,
  "design_elements_match": <boolean>,
  "issues": ["list any problems - BE SPECIFIC about anatomy errors like mouth-above-trunk"]
}`
    : `You are a Creative Director doing STRICT QC on a mascot design.

THE BRIEF: "${creatureDesc}"

⚠️ CRITICAL ANATOMY CHECKS (REJECT IF WRONG):
1. MOUTH must be on the FACE (not on the belly/body!)
2. EYES must be on the FACE (not elsewhere!)
3. All facial features in correct anatomical positions
4. Character looks like what was requested

🐘 ELEPHANT-SPECIFIC ANATOMY (if this is an elephant):
- The TRUNK is the extended NOSE
- The MOUTH must be BELOW or BESIDE the trunk base (where trunk meets face)
- A mouth ABOVE the trunk is ANATOMICALLY IMPOSSIBLE — INSTANT REJECT
- The mouth should be a small opening under/beside where the trunk attaches
- This is the #1 elephant mistake — CHECK CAREFULLY

MUST-HAVE FEATURES:
${mustHaveFeatures.map(f => `• ${f}`).join("\n") || "• (none specified)"}

REVIEW CHECKLIST:
${qcCriteria.map(c => `☐ ${c}`).join("\n")}

Be STRICT about anatomy. A mouth on the belly is WRONG.

Respond with ONLY this JSON:
{
  "matches_brief": <boolean>,
  "mouth_on_face": <boolean>,
  "eyes_on_face": <boolean>,
  "anatomy_correct": <boolean>,
  "elephant_mouth_below_trunk": <boolean or null if not elephant>,
  "what_i_see": "<describe what this appears to be>",
  "features_present": ["list features visible"],
  "features_missing": ["list missing features"],
  "issues": ["list any problems - BE SPECIFIC about anatomy errors like mouth-above-trunk"]
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
    
    // 🚨 CRITICAL ANATOMY CHECKS — instant fail
    if (qc.mouth_on_face === false) {
      issues.push("ANATOMY ERROR: Mouth is NOT on the face (possibly on belly/body)");
    }
    if (qc.eyes_on_face === false) {
      issues.push("ANATOMY ERROR: Eyes are NOT on the face");
    }
    if (qc.anatomy_correct === false) {
      issues.push("ANATOMY ERROR: Facial features misplaced");
    }
    
    // 🐘 ELEPHANT-SPECIFIC: Mouth must be BELOW trunk, never above
    if (qc.elephant_mouth_below_trunk === false) {
      issues.push("ELEPHANT ANATOMY ERROR: Mouth is ABOVE the trunk — must be BELOW/BESIDE where trunk meets face");
    }
    
    // BRIEF MATCH CHECK
    if (qc.matches_brief === false) {
      issues.push(`Does not match brief: looks like "${qc.what_i_see || "unknown"}"`);
    }
    
    // Missing features
    if (qc.features_missing && Array.isArray(qc.features_missing) && qc.features_missing.length > 0) {
      issues.push(`Missing features: ${qc.features_missing.join(", ")}`);
    }
    
    // 🚨 EYE COLOR CONSISTENCY — #1 most common mistake (expressions only)
    if (checkEyeColor && qc.eye_color_matches === false) {
      issues.push("EYE COLOR MISMATCH: Eyes must be EXACTLY the same color as master (e.g., black→black, blue→blue)");
    }
    
    // Body consistency (expressions only)
    if (checkEyeColor && qc.body_matches_master === false) {
      issues.push("Body position changed from master");
    }
    
    // Design element consistency (expressions only) — patterns, textures, accessories
    if (checkEyeColor && qc.design_elements_match === false) {
      issues.push("DESIGN MISMATCH: Patterns/textures/accessories don't match master (e.g., missing ear patterns, lost stripes)");
    }
    
    // Add any issues from vision
    if (qc.issues && Array.isArray(qc.issues)) {
      issues.push(...qc.issues.filter((i: string) => i && i.length > 0));
    }
    
    return {
      passed: issues.length === 0,
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
// CREATIVE BRIEF — The AI acts as a Creative Director
// Makes ALL creative decisions holistically for each unique job
// ═══════════════════════════════════════════════════════════════════

interface CreativeBrief {
  // What we're making
  creature: string;
  creatureDescription: string;
  
  // Visual identity (UNIQUE per brand)
  colorName: string;      // Human-readable: "coral", "teal", "lavender"
  primaryColor: string;   // Hex code
  backgroundColor: string;
  outlineColor: string;
  
  // Key features that MUST be present
  mustHaveFeatures: string[];
  
  // Style decisions
  styleNotes: string;
  moodAndVibe: string;
  
  // Creature-specific expression mechanics
  expressionNotes: string;  // e.g., "elephant mouth under trunk, trunk flips up when happy"
  
  // The final prompt to send to the image model (IDLE pose)
  imagePrompt: string;
  
  // For QC - what should we check for?
  qcCriteria: string[];
}

// Load mascot registry to ensure uniqueness
function loadMascotRegistry(): { mascots: Array<{ brand: string; creature: string; primaryColor: string; colorName: string }>; takenCombos: string[] } {
  const registryPath = path.join(__dirname, "..", "..", "data", "mascot-registry.json");
  try {
    if (fs.existsSync(registryPath)) {
      return JSON.parse(fs.readFileSync(registryPath, "utf-8"));
    }
  } catch (err) {
    console.error("[registry] Failed to load:", err);
  }
  return { mascots: [], takenCombos: [] };
}

function saveMascotRegistry(registry: { mascots: Array<{ brand: string; creature: string; primaryColor: string; colorName: string; createdAt: string }>; takenCombos: string[] }): void {
  const registryPath = path.join(__dirname, "..", "..", "data", "mascot-registry.json");
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}

async function createCreativeBrief(prompt: string, brandName: string): Promise<CreativeBrief> {
  // Load existing mascots to ensure uniqueness
  const registry = loadMascotRegistry();
  const existingMascots = registry.mascots.map(m => `${m.creature} (${m.colorName}) for ${m.brand}`).join("\n");
  
  const briefPrompt = `You are a Creative Director designing a MASCOT character.

CLIENT REQUEST: "${prompt}"
BRAND NAME: "${brandName}"

═══════════════════════════════════════════════════════════════════
⚠️ UNIQUENESS IS CRITICAL — NO DUPLICATE MASCOTS
═══════════════════════════════════════════════════════════════════

These mascots ALREADY EXIST (DO NOT create similar ones):
${existingMascots || "(none yet)"}

RULE: Each brand needs a UNIQUE mascot. If an existing mascot is a 
purple owl, do NOT make another purple owl. Choose a different color
OR a different creature. No two brands should look similar.

═══════════════════════════════════════════════════════════════════
MASCOT STYLE GUIDELINES (use your judgment)
═══════════════════════════════════════════════════════════════════

Mascots are CHARACTER versions of creatures — cute, expressive, friendly.
Think Discord Wumpus, Duolingo owl, Slack's slackbot.

COMMON PATTERN (for most mammals/humanoids):
• Stand upright on 2 legs, have 2 arms that can wave/gesture
• Works great for: elephants, dogs, cats, bears, robots, etc.

BUT USE YOUR JUDGMENT for creatures where this doesn't fit:
• Crabs → keep their claws and multiple legs, that's their identity
• Octopus → 8 tentacles is the whole point
• Snake → no legs is correct
• Fish → fins, not arms

The goal is a CUTE, EXPRESSIVE, CHARACTER version of the creature.
Keep what makes the creature recognizable. Add personality.

═══════════════════════════════════════════════════════════════════
YOUR CREATIVE DECISIONS
═══════════════════════════════════════════════════════════════════

1. CREATURE IDENTITY
   - What creature/character is this?
   - What are the KEY FEATURES that make it recognizable?

2. COLOR PALETTE (MUST BE UNIQUE!)
   - Pick a color that NO existing mascot uses for this creature type
   - If someone already has a purple elephant, use blue/green/orange/etc.
   - Be creative — the color should fit the brand vibe
   - Also include a colorName (e.g., "coral", "teal", "lavender")

3. STYLE & MOOD
   - What vibe? (playful, techy, friendly, edgy, cute?)
   - Any special elements? (robotic, magical, sporty?)

4. IMAGE PROMPT
   - Write the EXACT prompt for the image AI
   - Remember: 2 legs, 2 arms, standing upright, kawaii style
   - Include creature's identifying features
   - Specify the UNIQUE color

5. QC CRITERIA
   - What must be present to verify it's correct?

6. EXPRESSION NOTES (IMPORTANT!)
   - How does THIS creature show emotions?
   - Where is the mouth anatomically? (e.g., elephant mouth is UNDER the trunk)
   - Any special expression mechanics? (e.g., elephant trunk can flip UP when happy/laughing)
   - Think through how each expression would work for this specific creature

RESPOND WITH ONLY THIS JSON:
{
  "creature": "<creature type>",
  "colorName": "<human-readable color name like 'coral', 'teal', 'mint'>",
  "creatureDescription": "<describe the mascot version - anatomy, pose, features based on what fits this creature>",
  "primaryColor": "<#hexcode - UNIQUE, not used by similar mascots>",
  "backgroundColor": "<#hexcode>",
  "outlineColor": "<#hexcode or 'black'>",
  "mustHaveFeatures": ["<creature's key identifying features>", "expressive face", "..."],
  "styleNotes": "<style guidance>",
  "moodAndVibe": "<emotional feel>",
  "expressionNotes": "<how this creature shows emotions - mouth position, any special mechanics like trunk movement>",
  "imagePrompt": "<complete prompt for IDLE pose - arms DOWN at sides, neutral friendly face>",
  "qcCriteria": ["<what makes this creature recognizable>", "has expressive face", "..."]
}`;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: "user", parts: [{ text: briefPrompt }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        creature: parsed.creature || "mascot",
        colorName: parsed.colorName || "custom",
        creatureDescription: parsed.creatureDescription || prompt,
        primaryColor: parsed.primaryColor || "#8B5CF6",
        backgroundColor: parsed.backgroundColor || "#F3E8FF",
        outlineColor: parsed.outlineColor || "black",
        mustHaveFeatures: parsed.mustHaveFeatures || [],
        styleNotes: parsed.styleNotes || "",
        moodAndVibe: parsed.moodAndVibe || "friendly and approachable",
        expressionNotes: parsed.expressionNotes || "",
        imagePrompt: parsed.imagePrompt || prompt,
        qcCriteria: parsed.qcCriteria || [],
      };
    }
  } catch (err) {
    console.error("[brief] Failed to create creative brief:", err);
  }
  
  // Fallback — minimal brief, let image model figure it out
  return {
    creature: "mascot",
    colorName: "purple",
    creatureDescription: prompt,
    primaryColor: "#8B5CF6",
    backgroundColor: "#F3E8FF", 
    outlineColor: "black",
    mustHaveFeatures: [],
    styleNotes: "2D kawaii style like Discord Wumpus",
    moodAndVibe: "friendly",
    expressionNotes: "",
    imagePrompt: prompt,
    qcCriteria: ["has eyes", "has mouth", "recognizable as requested"],
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
  console.log(`  OpenGFX Mascot Generator`);
  console.log(`  Brand: ${input.brandName}`);
  console.log(`  Mode: Creative Director`);
  console.log(`══════════════════════════════════════════════════════════════\n`);
  
  // Store the creative brief for QC
  let brief: CreativeBrief | null = null;
  let anatomy: AnatomySchema;
  
  if (input.prompt && !input.masterUrl && !input.masterPath) {
    // ═══════════════════════════════════════════════════════════════
    // MODE 1: CREATIVE DIRECTOR MODE
    // AI makes ALL creative decisions holistically for this specific job
    // ═══════════════════════════════════════════════════════════════
    
    console.log(`[1/6] Creative Director analyzing brief...`);
    brief = await createCreativeBrief(input.prompt, input.brandName);
    
    // Apply user overrides if provided
    if (input.primaryColor) brief.primaryColor = input.primaryColor;
    if (input.bgColor) brief.backgroundColor = input.bgColor;
    if (input.outlineColor) brief.outlineColor = input.outlineColor;
    
    console.log(`\n      ┌─────────────────────────────────────────────────`);
    console.log(`      │ CREATIVE BRIEF`);
    console.log(`      ├─────────────────────────────────────────────────`);
    console.log(`      │ Creature: ${brief.creature}`);
    console.log(`      │ Vibe: ${brief.moodAndVibe}`);
    console.log(`      │ Color: ${brief.colorName} (${brief.primaryColor})`);
    console.log(`      │ Background: ${brief.backgroundColor}`);
    console.log(`      │ Must-have: ${brief.mustHaveFeatures.slice(0, 3).join(", ")}`);
    console.log(`      └─────────────────────────────────────────────────\n`);
    
    // Create anatomy schema from brief
    anatomy = createAnatomySchema(brief.creature, {
      body: { type: "body", description: brief.creatureDescription },
      extras: brief.mustHaveFeatures,
    });
    
    // Set colors from brief
    input.primaryColor = brief.primaryColor;
    input.bgColor = brief.backgroundColor;
    input.outlineColor = brief.outlineColor;
    
  } else {
    // ═══════════════════════════════════════════════════════════════
    // MODE 2: EXPRESSION SHEET MODE (locked master)
    // ═══════════════════════════════════════════════════════════════
    
    if (!input.legCount) {
      throw new Error("legCount is REQUIRED when using locked master (expression sheet mode)");
    }
    
    const creature = input.creature || "mascot";
    anatomy = createAnatomySchema(creature, {
      arms: { count: input.clawCount || 0, type: "appendages", description: "as shown in master" },
      legs: { count: input.legCount, type: "legs", description: "as shown in master" },
    });
    
    console.log(`[1/6] Expression sheet mode (locked master)`);
  }
  
  // Save brief and anatomy
  const briefPath = path.join(baseDir, "creative-brief.json");
  if (brief) fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));
  
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
    if (!brief) throw new Error("Creative brief required for master generation");
    await generateMasterImage(brief, input.brandName, masterPath);
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
      
      await generateExpressionImage(masterImageData, input, anatomy, pose, posePath, brief);
      
      // Run QC using creative brief criteria
      const qcResult = await verifyAnatomy(posePath, anatomy, masterPath, pose, brief);
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
  
  // QC master too using creative brief criteria
  console.log(`[4/6] QC verification on master...`);
  const masterQc = await verifyAnatomy(masterPath, anatomy, undefined, undefined, brief);
  qcReport.poses["master"] = masterQc;
  if (!masterQc.passed) {
    console.log(`      ⚠️ Master QC issues: ${masterQc.issues.join(", ")}`);
    qcReport.passed = false;
  } else {
    console.log(`      ✓ Master QC PASS`);
  }
  
  // Upload to CDN with versioned directory (cache-busting for Telegram/Discord)
  const urls: Record<string, string> = {};
  const cdnVersion = Date.now(); // Unique version for this generation
  
  if (input.uploadToCdn !== false) {
    console.log(`[5/6] Uploading to CDN...`);
    for (const pose of EXPRESSION_POSES) {
      const cdnKey = `${brandSlug}/mascot/v${cdnVersion}/${pose}.png`;
      const url = uploadToCdn(localPaths[pose], cdnKey, opengfxDir);
      urls[pose] = url;
      if (url) {
        console.log(`      ✓ ${pose}.png → CDN`);
      }
    }
  } else {
    console.log(`[5/6] Skipping CDN upload (disabled)`);
  }
  
  // Save to mascot registry for uniqueness tracking
  if (brief && qcReport.passed) {
    const registry = loadMascotRegistry();
    const newEntry = {
      brand: input.brandName,
      creature: brief.creature,
      primaryColor: brief.primaryColor,
      colorName: brief.colorName || "custom",
      createdAt: new Date().toISOString().split("T")[0],
    };
    registry.mascots.push(newEntry);
    registry.takenCombos.push(`${brief.creature}-${brief.colorName}`);
    registry.takenCombos.push(`${brief.creature}-${brief.primaryColor}`);
    saveMascotRegistry(registry);
    console.log(`[6/6] Registered mascot: ${brief.creature} (${brief.colorName}) for ${input.brandName}`);
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
