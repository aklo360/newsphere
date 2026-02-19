/**
 * MASCOT LEARNINGS - Runtime-loaded rules for mascot generation
 * 
 * SELF-IMPROVEMENT LOOP:
 * 1. Generate mascot → something goes wrong/right
 * 2. Update THIS FILE with the learning
 * 3. Next generation reads this file
 * 4. Behavior changes
 * 
 * This file IS the mascot brain. Edit it → change future outputs.
 */

// ============================================================================
// CORE GENERATION RULES (LOCKED 2025-02-19)
// ============================================================================

export const GENERATION_RULES = {
  // NEVER generate wide then resize — creates visible seams
  singlePassSquare: true,
  
  // Gemini draws checkers when you request transparent
  solidBackground: true,
  
  // Target frame fill percentage
  frameFill: 0.70,
  
  // Output dimensions
  outputSize: 1024,
};

// ============================================================================
// PROMPT BLOCKS (inject these into prompts)
// ============================================================================

export const PROMPT_BLOCKS = {
  // Always include in image format section
  imageFormat: (bgHex: string, bgName: string, character: string) => `
IMAGE FORMAT:
- SQUARE 1:1 aspect ratio (1024x1024)
- Solid flat ${bgHex} ${bgName} background filling the ENTIRE image
- ${character} centered in frame, taking up ~70% of the space
`,

  // Always include for bird characters
  birdAnatomy: `
BIRD ANATOMY:
- Small triangular BEAK only (no mouth line - birds have beaks not mouths)
- Expression from beak SHAPE only
- BEAK is the ONLY mouth element
`,

  // Always include for kawaii style
  highlights: `
HIGHLIGHTS:
- WHITE GLOSSY HIGHLIGHTS on eyes and head (1-2 highlights max)
- Highlights should accent, not dominate
- Clean, minimal aesthetic
`,

  // Standard design block
  design: (bodyColor: string, details: string) => `
DESIGN:
- ${bodyColor} body
- ${details}
- 2D flat illustration, black outlines
- WHITE GLOSSY SHINE MARKS on head/body
`,
};

// ============================================================================
// EXPRESSION DEFINITIONS (standard 6-pose set)
// ============================================================================

export const EXPRESSIONS = {
  master: "EXPRESSION: Neutral, friendly. Beak closed, slightly upturned.",
  wave: "EXPRESSION: Friendly wave. One wing raised waving. Beak slightly open.",
  happy: "EXPRESSION: Very happy. Eyes closed (^_^), beak open in joy, pink blush.",
  sad: "EXPRESSION: Sad. Droopy eyes, beak pointing down, single tear.",
  angry: "EXPRESSION: Angry. V-shaped eyebrows, beak closed pointing down.",
  laugh: "EXPRESSION: Laughing. Eyes squeezed, beak wide open, tears of joy.",
} as const;

export type ExpressionName = keyof typeof EXPRESSIONS;
export const ALL_EXPRESSIONS = Object.keys(EXPRESSIONS) as ExpressionName[];

// ============================================================================
// ANTI-PATTERNS (things that break output)
// ============================================================================

export const ANTI_PATTERNS = [
  "Never request transparent background (Gemini draws checkers)",
  "Never generate wide then pad to square (creates seams)",
  "Never remove white pixels in post-processing (destroys highlights)",
  "Never draw mouths on birds (birds have beaks)",
  "Never generate expressions without master reference",
];

// ============================================================================
// POST-PROCESSING RULES
// ============================================================================

export const POST_PROCESSING = {
  // Only resize, never color manipulate
  allowedOperations: ["resize"] as const,
  
  // Use cover to ensure exact dimensions
  resizeFit: "cover" as const,
  
  // Never clamp white pixels
  clampWhite: false,
};

// ============================================================================
// CREATURE-SPECIFIC RULES
// ============================================================================

export const CREATURE_RULES: Record<string, string[]> = {
  bird: [
    "BEAK only, no mouth line",
    "Expression from beak shape",
    "Ear tufts for owls",
  ],
  crab: [
    "Exact claw count (specify in prompt)",
    "Exact leg count (specify in prompt)",
    "Front-facing view only",
  ],
  // Add more creatures as we learn
};

// ============================================================================
// HELPER: Build full mascot prompt
// ============================================================================

export function buildMascotPrompt(options: {
  character: string;
  bgHex: string;
  bgName: string;
  bodyColor: string;
  details: string;
  expression: ExpressionName;
  creatureType?: keyof typeof CREATURE_RULES;
  isVariation?: boolean;
}): string {
  const {
    character,
    bgHex,
    bgName,
    bodyColor,
    details,
    expression,
    creatureType,
    isVariation = false,
  } = options;

  const parts: string[] = [];

  // Variation prefix
  if (isVariation) {
    parts.push("Create a variation of this mascot with the following expression:");
  } else {
    parts.push(`Create a cute kawaii ${character} mascot.`);
  }

  // Core blocks
  parts.push(PROMPT_BLOCKS.imageFormat(bgHex, bgName, character));
  
  // Creature-specific rules
  if (creatureType && CREATURE_RULES[creatureType]) {
    parts.push(`\n${creatureType.toUpperCase()} RULES:`);
    parts.push(CREATURE_RULES[creatureType].map(r => `- ${r}`).join("\n"));
  }
  
  // Bird anatomy if applicable
  if (creatureType === "bird") {
    parts.push(PROMPT_BLOCKS.birdAnatomy);
  }

  // Design
  parts.push(PROMPT_BLOCKS.design(bodyColor, details));
  
  // Highlights
  parts.push(PROMPT_BLOCKS.highlights);
  
  // Expression
  parts.push(EXPRESSIONS[expression]);

  return parts.join("\n");
}
