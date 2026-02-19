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
  return `Create a 2D FLAT mascot character in Discord Wumpus / Duolingo owl style.

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
    ? `You are a Creative Director reviewing a mascot expression.

IMAGE 1 (MASTER): Reference image  
IMAGE 2 (EXPRESSION): Image to verify

THE BRIEF: "${creatureDesc}"

MUST-HAVE FEATURES:
${mustHaveFeatures.map(f => `• ${f}`).join("\n") || "• (none specified)"}

REVIEW CHECKLIST:
${qcCriteria.map(c => `☐ ${c}`).join("\n")}

Also check:
☐ Eye color IDENTICAL to master
☐ Body position identical to master
☐ Only face changed

Respond with ONLY this JSON:
{
  "matches_brief": <boolean>,
  "eye_color_matches": <boolean>,
  "body_matches_master": <boolean>,
  "issues": ["list any problems"]
}`
    : `You are a Creative Director reviewing a mascot design.

THE BRIEF: "${creatureDesc}"

MUST-HAVE FEATURES:
${mustHaveFeatures.map(f => `• ${f}`).join("\n") || "• (none specified)"}

REVIEW CHECKLIST:
${qcCriteria.map(c => `☐ ${c}`).join("\n")}

Does this mascot match the brief? Be honest but fair.

Respond with ONLY this JSON:
{
  "matches_brief": <boolean>,
  "what_i_see": "<describe what this appears to be>",
  "features_present": ["list features visible"],
  "features_missing": ["list missing features"],
  "issues": ["list any problems"]
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
    
    // BRIEF MATCH CHECK — most important
    if (qc.matches_brief === false) {
      issues.push(`Does not match brief: looks like "${qc.what_i_see || "unknown"}"`);
    }
    
    // Missing features
    if (qc.features_missing && Array.isArray(qc.features_missing) && qc.features_missing.length > 0) {
      issues.push(`Missing features: ${qc.features_missing.join(", ")}`);
    }
    
    // Eye color consistency (expressions only)
    if (checkEyeColor && qc.eye_color_matches === false) {
      issues.push("Eye color doesn't match master");
    }
    
    // Body consistency (expressions only)
    if (checkEyeColor && qc.body_matches_master === false) {
      issues.push("Body position changed from master");
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
  
  // Visual identity
  primaryColor: string;
  backgroundColor: string;
  outlineColor: string;
  
  // Key features that MUST be present
  mustHaveFeatures: string[];
  
  // Style decisions
  styleNotes: string;
  moodAndVibe: string;
  
  // The final prompt to send to the image model
  imagePrompt: string;
  
  // For QC - what should we check for?
  qcCriteria: string[];
}

async function createCreativeBrief(prompt: string, brandName: string): Promise<CreativeBrief> {
  const briefPrompt = `You are a Creative Director designing a MASCOT character.

CLIENT REQUEST: "${prompt}"
BRAND NAME: "${brandName}"

═══════════════════════════════════════════════════════════════════
MASCOT RULES (STANDARD FOR ALL MASCOTS)
═══════════════════════════════════════════════════════════════════

Mascots are ANTHROPOMORPHIZED characters, NOT realistic animals:
• STANDS UPRIGHT on TWO LEGS (like a human)
• HAS TWO ARMS (can wave, hold things, gesture)
• EXPRESSIVE FACE (big eyes, can smile/frown/laugh)
• KAWAII/CUTE STYLE (think Discord Wumpus, Duolingo owl)
• FRONT-FACING, friendly, approachable

Even if the creature is normally a 4-legged animal (elephant, dog, cat):
→ As a MASCOT, it stands on 2 legs and has 2 arms
→ Keep the creature's IDENTIFYING FEATURES (elephant trunk, cat ears, etc.)
→ But make it CHARACTER-like, not animal-like

═══════════════════════════════════════════════════════════════════
YOUR CREATIVE DECISIONS
═══════════════════════════════════════════════════════════════════

1. CREATURE IDENTITY
   - What creature/character is this?
   - What are the KEY FEATURES that make it recognizable?
   - (elephant = trunk + big ears, owl = big eyes + beak, etc.)

2. COLOR PALETTE
   - Primary body color (creative choice based on vibe)
   - Background color (complementary)
   - Consider: brand personality, emotional response

3. STYLE & MOOD
   - What vibe? (playful, techy, friendly, edgy, cute?)
   - Any special elements? (robotic, magical, sporty?)

4. IMAGE PROMPT
   - Write the EXACT prompt for the image AI
   - Remember: 2 legs, 2 arms, standing upright, kawaii style
   - Include creature's identifying features
   - Specify colors, style, composition

5. QC CRITERIA
   - What must be present to verify it's correct?

RESPOND WITH ONLY THIS JSON:
{
  "creature": "<creature type>",
  "creatureDescription": "<as a mascot: standing upright on 2 legs, 2 arms, plus identifying features>",
  "primaryColor": "<#hexcode>",
  "backgroundColor": "<#hexcode>",
  "outlineColor": "<#hexcode or 'black'>",
  "mustHaveFeatures": ["stands on 2 legs", "has 2 arms", "<creature-specific feature>", "..."],
  "styleNotes": "<style guidance>",
  "moodAndVibe": "<emotional feel>",
  "imagePrompt": "<complete prompt emphasizing mascot standing upright with 2 arms, 2 legs, plus creature features>",
  "qcCriteria": ["standing upright on 2 legs", "has 2 arms", "<creature-specific check>", "..."]
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
        creatureDescription: parsed.creatureDescription || prompt,
        primaryColor: parsed.primaryColor || "#8B5CF6",
        backgroundColor: parsed.backgroundColor || "#F3E8FF",
        outlineColor: parsed.outlineColor || "black",
        mustHaveFeatures: parsed.mustHaveFeatures || [],
        styleNotes: parsed.styleNotes || "",
        moodAndVibe: parsed.moodAndVibe || "friendly and approachable",
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
    creatureDescription: prompt,
    primaryColor: "#8B5CF6",
    backgroundColor: "#F3E8FF", 
    outlineColor: "black",
    mustHaveFeatures: [],
    styleNotes: "2D kawaii style like Discord Wumpus",
    moodAndVibe: "friendly",
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
    console.log(`      │ Color: ${brief.primaryColor}`);
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
      
      await generateExpressionImage(masterImageData, input, anatomy, pose, posePath);
      
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
