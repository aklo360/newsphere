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

const ANATOMY_PRESETS: Record<string, AnatomySchema> = {
  // CRUSTACEANS
  crab: {
    creature: "crab",
    body: { type: "dome shell", description: "rounded dome-shaped shell body" },
    arms: { count: 2, type: "claws", description: "two large pincer claws" },
    legs: { count: 4, type: "legs", description: "four small walking legs" },
    face: { eyes: "big round kawaii eyes with white highlight", mouth: "small cute smile" },
  },
  octopus: {
    creature: "octopus",
    body: { type: "round head", description: "rounded bulbous head" },
    arms: { count: 8, type: "tentacles", description: "eight wavy tentacles" },
    legs: { count: 0, type: "none", description: "" },
    face: { eyes: "big round kawaii eyes", mouth: "small cute beak smile" },
  },
  
  // ROBOTS/TECH
  robot: {
    creature: "robot",
    body: { type: "boxy torso", description: "rectangular robotic body" },
    arms: { count: 2, type: "arms", description: "two mechanical arms with gripper hands" },
    legs: { count: 2, type: "legs", description: "two sturdy robot legs" },
    face: { eyes: "LED screen eyes", mouth: "pixel smile display" },
  },
  
  // MAMMALS
  elephant: {
    creature: "elephant",
    body: { type: "round body", description: "large rounded elephant body" },
    arms: { count: 0, type: "none", description: "no arms - elephants have NO ARMS" },
    legs: { count: 4, type: "legs", description: "four sturdy elephant legs with round feet" },
    face: { eyes: "big round kawaii eyes", mouth: "small friendly smile" },
    extras: ["LONG TRUNK (most important feature!)", "large floppy elephant ears on sides of head", "tiny tail"],
  },
  cat: {
    creature: "cat",
    body: { type: "round body", description: "soft rounded cat body" },
    arms: { count: 0, type: "none", description: "no arms - cats have NO ARMS, only legs" },
    legs: { count: 4, type: "paws", description: "four cat paws (or 2 visible in front view)" },
    face: { eyes: "big round kawaii cat eyes with vertical pupils", mouth: "small cat mouth with whiskers" },
    extras: ["pointed cat ears on top of head", "whiskers", "fluffy tail"],
  },
  dog: {
    creature: "dog",
    body: { type: "round body", description: "soft rounded dog body" },
    arms: { count: 0, type: "none", description: "no arms - dogs have NO ARMS, only legs" },
    legs: { count: 4, type: "paws", description: "four dog paws (or 2 visible in front view)" },
    face: { eyes: "big round kawaii dog eyes", mouth: "happy dog mouth with tongue" },
    extras: ["floppy or pointed dog ears", "wet nose", "wagging tail"],
  },
  bear: {
    creature: "bear",
    body: { type: "round body", description: "big soft rounded bear body" },
    arms: { count: 2, type: "paws", description: "two bear paws/arms with paw pads" },
    legs: { count: 2, type: "legs", description: "two sturdy bear legs" },
    face: { eyes: "small round kawaii bear eyes", mouth: "small bear snout with nose" },
    extras: ["round bear ears on top of head", "small fluffy tail"],
  },
  bunny: {
    creature: "bunny",
    body: { type: "round body", description: "soft fluffy round bunny body" },
    arms: { count: 2, type: "paws", description: "two small bunny paws" },
    legs: { count: 2, type: "feet", description: "two big bunny feet" },
    face: { eyes: "big round kawaii eyes", mouth: "small bunny mouth with buck teeth" },
    extras: ["LONG UPRIGHT BUNNY EARS (most important!)", "fluffy cotton tail", "pink inner ears"],
  },
  fox: {
    creature: "fox",
    body: { type: "sleek body", description: "sleek fox body" },
    arms: { count: 0, type: "none", description: "no arms - foxes have NO ARMS, only legs" },
    legs: { count: 4, type: "paws", description: "four fox paws (or 2 visible in front view)" },
    face: { eyes: "sly kawaii fox eyes", mouth: "small fox snout" },
    extras: ["large pointed fox ears", "bushy fox tail with white tip"],
  },
  penguin: {
    creature: "penguin",
    body: { type: "oval body", description: "oval penguin body with white belly" },
    arms: { count: 2, type: "flippers", description: "two penguin flippers (not hands!)" },
    legs: { count: 2, type: "feet", description: "two orange penguin feet" },
    face: { eyes: "big round kawaii eyes", mouth: "small orange beak" },
    extras: ["white belly patch", "black and white coloring"],
  },
  owl: {
    creature: "owl",
    body: { type: "round body", description: "round fluffy owl body" },
    arms: { count: 2, type: "wings", description: "two owl wings (not hands!)" },
    legs: { count: 2, type: "talons", description: "two small owl feet with talons" },
    face: { eyes: "BIG round owl eyes (owls have huge eyes!)", mouth: "small triangular beak" },
    extras: ["ear tufts on head", "round face disk"],
  },
  
  // OBJECTS
  "music note": {
    creature: "music note",
    body: { type: "note shape", description: "stylized music note shape body" },
    arms: { count: 2, type: "arms", description: "two small cartoon arms" },
    legs: { count: 2, type: "legs", description: "two small cartoon legs" },
    face: { eyes: "big round kawaii eyes", mouth: "happy smile" },
    extras: ["music note stem", "headphones optional"],
  },
};

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

/**
 * Build QC checks for creature identity verification.
 * Returns a string describing what features to look for.
 */
function buildCreatureQCChecks(creature: string): string {
  const creatureLower = creature.toLowerCase();
  
  const checks: Record<string, string> = {
    elephant: `REQUIRED FEATURES FOR ELEPHANT:
- ✅ Long trunk (MOST IMPORTANT - without trunk, it's NOT an elephant)
- ✅ Large floppy ears on sides of head
- ✅ Four legs (NO arms, NO hands, NO claws)
- ❌ REJECT if: has arms, has hands, has claws, no trunk, no big ears`,
    
    cat: `REQUIRED FEATURES FOR CAT:
- ✅ Pointed cat ears on top of head
- ✅ Whiskers
- ✅ Cat-like face
- ❌ REJECT if: has human hands, has claws (cats have PAWS)`,
    
    dog: `REQUIRED FEATURES FOR DOG:
- ✅ Dog ears (floppy or pointed)
- ✅ Dog snout/nose
- ❌ REJECT if: has human hands, no dog features`,
    
    owl: `REQUIRED FEATURES FOR OWL:
- ✅ Large round owl eyes
- ✅ Small triangular beak (NOT a mouth)
- ✅ Wings (NOT arms)
- ❌ REJECT if: has hands, has arms instead of wings, no beak`,
    
    bunny: `REQUIRED FEATURES FOR BUNNY:
- ✅ Long upright bunny ears (MOST IMPORTANT)
- ✅ Small bunny nose
- ❌ REJECT if: no long ears, has claws`,
    
    penguin: `REQUIRED FEATURES FOR PENGUIN:
- ✅ Flippers (NOT arms)
- ✅ White belly
- ✅ Beak
- ❌ REJECT if: has hands, has arms instead of flippers`,
    
    crab: `REQUIRED FEATURES FOR CRAB:
- ✅ Pincer claws (crabs DO have claws)
- ✅ Shell body
- This is the only creature that SHOULD have claws`,
    
    fox: `REQUIRED FEATURES FOR FOX:
- ✅ Large pointed fox ears
- ✅ Fox snout
- ✅ Bushy tail
- ❌ REJECT if: has hands, no fox features`,
    
    bear: `REQUIRED FEATURES FOR BEAR:
- ✅ Round bear ears
- ✅ Bear snout with nose
- Bear paws are acceptable`,
    
    robot: `REQUIRED FEATURES FOR ROBOT:
- ✅ Mechanical/robotic appearance
- Gripper hands are acceptable for robots`,
  };
  
  return checks[creatureLower] || 
    `REQUIRED: Must be clearly recognizable as a ${creature}.
Look for the defining characteristics that make a ${creature} identifiable.`;
}

/**
 * Build a strong creature identity block that emphasizes what the creature should LOOK like.
 * This is critical for QC - the mascot MUST be recognizable as this creature.
 */
function buildCreatureIdentityBlock(creature: string, anatomy: AnatomySchema): string {
  const creatureLower = creature.toLowerCase();
  
  // Creature-specific identity traits
  const identityTraits: Record<string, string> = {
    elephant: `THIS IS AN ELEPHANT MASCOT.
- MUST HAVE: Long trunk extending from face (THIS IS THE #1 IDENTIFYING FEATURE)
- MUST HAVE: Large floppy ears on sides of head
- MUST HAVE: Four sturdy legs (elephants do NOT have arms or hands)
- NO CLAWS, NO HANDS, NO ARMS — elephants have FEET and a TRUNK
- The trunk is ESSENTIAL — without it, it's NOT an elephant`,
    
    cat: `THIS IS A CAT MASCOT.
- MUST HAVE: Pointed cat ears on top of head
- MUST HAVE: Whiskers
- MUST HAVE: Cat-like face shape
- NO ARMS — cats have four PAWS, not hands
- Optional: fluffy tail`,
    
    dog: `THIS IS A DOG MASCOT.
- MUST HAVE: Dog ears (floppy or pointed)
- MUST HAVE: Dog-like snout/nose
- NO ARMS — dogs have four PAWS, not hands
- Optional: tongue out, wagging tail`,
    
    owl: `THIS IS AN OWL MASCOT.
- MUST HAVE: Large round owl eyes (owls are known for big eyes!)
- MUST HAVE: Small triangular beak (NOT a mouth)
- MUST HAVE: Wings (NOT arms or hands)
- Optional: ear tufts, round face disk`,
    
    bunny: `THIS IS A BUNNY/RABBIT MASCOT.
- MUST HAVE: Long upright bunny ears (THIS IS THE #1 IDENTIFYING FEATURE)
- MUST HAVE: Small bunny nose
- Optional: buck teeth, fluffy cotton tail`,
    
    penguin: `THIS IS A PENGUIN MASCOT.
- MUST HAVE: Flippers (NOT arms or hands)
- MUST HAVE: White belly patch
- MUST HAVE: Orange beak
- MUST HAVE: Orange feet`,
    
    crab: `THIS IS A CRAB MASCOT.
- MUST HAVE: Two pincer claws (crabs DO have claws)
- MUST HAVE: Shell body
- Optional: multiple small legs`,
    
    fox: `THIS IS A FOX MASCOT.
- MUST HAVE: Large pointed fox ears
- MUST HAVE: Fox snout
- MUST HAVE: Bushy tail with white tip
- NO ARMS — foxes have four PAWS`,
    
    bear: `THIS IS A BEAR MASCOT.
- MUST HAVE: Round bear ears on top of head
- MUST HAVE: Bear snout with nose
- Bear paws are OK (bears can have arm-like front legs)`,
    
    robot: `THIS IS A ROBOT MASCOT.
- MUST HAVE: Mechanical/robotic appearance
- Can have: Gripper hands, antenna, screen face, metallic body`,
  };
  
  // Get creature-specific traits or generate generic ones
  const traits = identityTraits[creatureLower] || 
    `THIS IS A ${creature.toUpperCase()} MASCOT.
- The character MUST be clearly recognizable as a ${creature}
- Include the defining features that make a ${creature} identifiable
- ${anatomy.extras ? anatomy.extras.join("\n- ") : ""}`;
  
  return `${traits}

⚠️ CRITICAL: Someone looking at this should IMMEDIATELY say "that's a ${creature}!"
⚠️ If the defining features are missing, the mascot is REJECTED.`;
}

function createAnatomySchema(creature: string, options: Partial<AnatomySchema>): AnatomySchema {
  const preset = ANATOMY_PRESETS[creature.toLowerCase()];
  if (preset) return { ...preset, ...options };
  
  // For unknown creatures, use sensible defaults — NO CLAWS by default
  // Most animals have paws/feet, not claws or hands
  return {
    creature,
    body: options.body || { type: "body", description: `rounded ${creature} body` },
    arms: options.arms || { count: 0, type: "none", description: "no arms (most animals don't have arms)" },
    legs: options.legs || { count: 4, type: "legs", description: "four legs with paws/feet (NOT hands, NOT claws)" },
    face: options.face || { 
      eyes: "big round kawaii eyes with white highlight", 
      mouth: "small friendly smile or species-appropriate mouth" 
    },
    extras: options.extras || [`must look like a ${creature}`, `include ${creature}-specific features`],
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
  
  // Build creature identity block - MOST IMPORTANT SECTION
  const creatureIdentity = buildCreatureIdentityBlock(creature, anatomy);
  
  return `Create a 2D FLAT mascot character in Discord Wumpus / Duolingo owl style.

╔══════════════════════════════════════════════════════════════════╗
║  🚨 CREATURE IDENTITY — MOST IMPORTANT 🚨                         ║
╚══════════════════════════════════════════════════════════════════╝

${creatureIdentity}

╔══════════════════════════════════════════════════════════════════╗
║  SIMPLICITY IS PARAMOUNT — GOLDEN RULE                           ║
╚══════════════════════════════════════════════════════════════════╝

THE RULE OF ONE: Pick ONE interesting visual element, not many.
- Target: 40-50% complexity — SIMPLE, CLEAN, MEMORABLE
- Think Apple, Stripe, Discord — minimalist elegance
- Can a child draw this from memory? (should be yes)
- Must be recognizable at 32x32px

BRAND: ${input.brandName}
${input.prompt ? `CONCEPT: ${input.prompt}` : ""}

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

⚠️⚠️⚠️ ANATOMY — EXACT COUNTS ⚠️⚠️⚠️

${buildAnatomyPrompt(anatomy, "master")}

VERIFY BEFORE GENERATING:
• CLAWS/ARMS: EXACTLY ${anatomy.arms.count} (not ${anatomy.arms.count - 1}, not ${anatomy.arms.count + 1})
• LEGS: EXACTLY ${anatomy.legs.count} tiny legs
• COUNT THEM: ${anatomy.legs.count} legs total

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
  pose?: string
): Promise<PoseQC> {
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");
  
  // Check eye color for ALL expressions (compare to master)
  const checkEyeColor = masterPath && pose && pose !== "master";
  const masterData = checkEyeColor ? fs.readFileSync(masterPath).toString("base64") : null;
  
  // Build creature-specific identity checks
  const creatureChecks = buildCreatureQCChecks(anatomy.creature);
  
  const prompt = checkEyeColor 
    ? `You are a QC inspector verifying mascot CREATURE IDENTITY, anatomy, AND eye color consistency.

IMAGE 1 (MASTER): Reference image
IMAGE 2 (EXPRESSION): Image to verify

🚨 CREATURE IDENTITY CHECK (MOST IMPORTANT):
This MUST be recognizable as a ${anatomy.creature.toUpperCase()}.
${creatureChecks}

EXPECTED ANATOMY:
- Arms/appendages: ${anatomy.arms.count} ${anatomy.arms.type}
- Legs: ${anatomy.legs.count}

INSTRUCTIONS:
1. FIRST: Does this look like a ${anatomy.creature}? Check for identifying features.
2. Count arms/appendages in IMAGE 2 - should be ${anatomy.arms.count}
3. Count legs in IMAGE 2 - should be ${anatomy.legs.count}
4. Check if IMAGE 2 is front-facing
5. Compare EYE COLOR between IMAGE 1 and IMAGE 2 - must be IDENTICAL

Respond with ONLY this JSON:
{
  "looks_like_creature": <boolean>,
  "creature_expected": "${anatomy.creature}",
  "creature_detected": "<what it actually looks like>",
  "has_identifying_features": <boolean>,
  "identifying_features_found": ["list features found"],
  "identifying_features_missing": ["list features missing"],
  "claw_count": <number>,
  "leg_count": <number>,
  "front_facing": <boolean>,
  "line_weight_consistent": <boolean>,
  "has_eyes": <boolean>,
  "has_mouth": <boolean>,
  "eye_color_matches": <boolean>,
  "master_eye_color": "<color>",
  "expression_eye_color": "<color>",
  "issues": ["list any problems"]
}`
    : `You are a QC inspector verifying mascot CREATURE IDENTITY and anatomy. BE STRICT.

🚨 CREATURE IDENTITY CHECK (MOST IMPORTANT):
This MUST be recognizable as a ${anatomy.creature.toUpperCase()}.
${creatureChecks}

EXPECTED ANATOMY:
- Arms/appendages: ${anatomy.arms.count} ${anatomy.arms.type}
- Legs: ${anatomy.legs.count}

INSTRUCTIONS:
1. FIRST: Does this look like a ${anatomy.creature}? Would someone immediately recognize it?
2. Check for the identifying features listed above
3. Count arms/appendages - should be ${anatomy.arms.count}
4. Count legs - should be ${anatomy.legs.count}
5. Check if it's front-facing view

Respond with ONLY this JSON (no other text):
{
  "looks_like_creature": <boolean>,
  "creature_expected": "${anatomy.creature}",
  "creature_detected": "<what it actually looks like>",
  "has_identifying_features": <boolean>,
  "identifying_features_found": ["list features found"],
  "identifying_features_missing": ["list features missing"],
  "claw_count": <number>,
  "leg_count": <number>,
  "front_facing": <boolean>,
  "line_weight_consistent": <boolean>,
  "has_eyes": <boolean>,
  "has_mouth": <boolean>,
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
    
    // 🚨 CREATURE IDENTITY CHECK — MOST IMPORTANT
    if (qc.looks_like_creature === false) {
      issues.push(`CREATURE IDENTITY FAIL: Expected ${anatomy.creature}, looks like ${qc.creature_detected || "unknown"}`);
    }
    
    if (qc.has_identifying_features === false) {
      const missing = qc.identifying_features_missing?.join(", ") || "key features";
      issues.push(`Missing ${anatomy.creature} features: ${missing}`);
    }
    
    // Check arm/appendage count
    if (qc.claw_count !== anatomy.arms.count) {
      issues.push(`Wrong arm/appendage count: ${qc.claw_count} (expected ${anatomy.arms.count})`);
    }
    
    // Check leg count - CRITICAL
    if (qc.leg_count !== anatomy.legs.count) {
      issues.push(`Wrong leg count: ${qc.leg_count} (expected ${anatomy.legs.count})`);
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
  primaryColor: string;
  outlineColor: string;
  legCount: number;
  clawCount: number;
  hasAntenna: boolean;
}> {
  const parsePrompt = `Parse this mascot request and extract structured data.

REQUEST: "${prompt}"
BRAND: "${brandName}"

Extract:
1. creature: What type of creature? (crab, owl, robot, cat, etc.)
2. primaryColor: Main color in hex (look for color names or hex codes)
3. outlineColor: Outline color in hex (default "black" or dark version of primary)
4. legCount: How many legs? (crab=4-6, owl/bird=2, robot=2, spider=8)
5. clawCount: How many claws/arms? (most creatures=2)
6. hasAntenna: Does it have antenna? (default false)

RESPOND WITH ONLY THIS JSON:
{
  "creature": "string",
  "primaryColor": "#hexcode",
  "outlineColor": "#hexcode", 
  "legCount": number,
  "clawCount": number,
  "hasAntenna": boolean
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
        primaryColor: parsed.primaryColor || "#5865F2",
        outlineColor: parsed.outlineColor || "black",
        legCount: parsed.legCount || 4,
        clawCount: parsed.clawCount || 2,
        hasAntenna: parsed.hasAntenna || false,
      };
    }
  } catch (err) {
    console.error("[parse] Failed to parse prompt:", err);
  }
  
  // Fallback defaults
  return {
    creature: "mascot",
    primaryColor: "#5865F2",
    outlineColor: "black",
    legCount: 4,
    clawCount: 2,
    hasAntenna: false,
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
  
  if (input.prompt && !input.masterUrl && !input.masterPath) {
    // MODE 1: Generate from prompt - parse to extract creature/anatomy
    console.log(`[1/6] Parsing input prompt...`);
    const parsed = await parseInputPrompt(input.prompt, input.brandName);
    
    // Override with explicit inputs if provided
    const creature = input.creature || parsed.creature;
    const legCount = input.legCount ?? parsed.legCount;
    const clawCount = input.clawCount ?? parsed.clawCount;
    const hasAntenna = input.hasAntenna ?? parsed.hasAntenna;
    input.primaryColor = input.primaryColor || parsed.primaryColor;
    input.outlineColor = input.outlineColor || parsed.outlineColor;
    
    // Create anatomy schema
    anatomy = createAnatomySchema(creature, {
      arms: { count: clawCount, type: "claws", description: `${clawCount} claws` },
      legs: { count: legCount, type: "legs", description: `${legCount} tiny legs` },
      face: { 
        eyes: "large kawaii eyes with highlight",
        mouth: "small friendly smile",
        extras: hasAntenna ? ["antenna on head"] : undefined,
      },
    });
    
    console.log(`      Creature: ${creature}`);
    console.log(`      Anatomy: ${clawCount} claws, ${legCount} legs`);
    console.log(`      Color: ${input.primaryColor}`);
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
