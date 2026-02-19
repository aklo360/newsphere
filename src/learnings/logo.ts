/**
 * LOGO LEARNINGS - Rules for logo generation
 * 
 * Edit here → affects all future logo generation.
 */

import { GEMINI_RULES, COLOR_RULES } from "./core.js";

// ============================================================================
// LOGO SYSTEM RULES
// ============================================================================

export const LOGO_RULES = {
  // Base logos must be grayscale (color applied at render stage)
  baseLogosGrayscale: true,
  maxBaseColors: 3, // BLACK, WHITE, GREY only
  
  // Icon complexity
  targetComplexity: 0.45, // 40-50% - simple, clean, luxury
  frameFill: 0.65, // 60-70% of frame
  
  // Must be recognizable at small sizes
  minimumRecognizableSize: 32, // px
};

export const LOGO_ANTI_PATTERNS = [
  "Never add color to base logos → color comes at render stage only",
  "Never exceed 3 base colors (black, white, grey)",
  "Never make icons too complex → must work at 32x32px",
  "Never combine 3+ concepts → simplify to one visual element",
];

// ============================================================================
// ICON GENERATION
// ============================================================================

export const ICON_RULES = {
  // The Rule of One
  ruleOfOne: "One interesting visual element, not many",
  
  // Simplicity test
  simplicityTest: "Can a child draw it from memory? Should be yes.",
  
  // Reference style
  referenceStyle: "Think Apple, Stripe, Linear — minimalist tech elegance",
  
  // Complexity range
  complexity: {
    min: 0.30,
    target: 0.45,
    max: 0.55,
  },
};

export const ICON_PROMPT_BLOCK = `
ICON DESIGN RULES:
- ONE visual element only (The Rule of One)
- Simple enough to recognize at 32x32px
- 60-70% frame fill (~15% padding each side)
- Think Apple, Stripe, Linear - minimalist elegance
- Can a child draw it from memory?
`;

// ============================================================================
// WORDMARK RULES
// ============================================================================

export const WORDMARK_RULES = {
  // Font requirements
  fontWeight: "Bold or ExtraBold for visibility",
  letterSpacing: "Slightly expanded for readability",
  
  // Color modes
  darkMode: "Light wordmark on dark background",
  lightMode: "Dark wordmark on light background",
};

// ============================================================================
// LOCKUP RULES
// ============================================================================

export const LOCKUP_RULES = {
  // Horizontal lockup
  horizontal: {
    iconPosition: "left",
    gap: "40-60px between icon and text block",
    taglinePosition: "directly under wordmark, left-aligned",
  },
  
  // Stacked lockup
  stacked: {
    iconPosition: "top center",
    wordmarkPosition: "below icon, centered",
    taglinePosition: "below wordmark, centered",
  },
};

// ============================================================================
// BANNER LAYOUT RULES (CRITICAL)
// ============================================================================

export const BANNER_LAYOUT = {
  // Tagline MUST align with wordmark
  taglineAlignment: "left-aligned with wordmark first letter",
  
  // NEVER center tagline under full lockup
  neverCenterUnderLockup: true,
  
  // Structure
  structure: "Icon | Wordmark + Tagline (stacked text block)",
  
  // Spacing
  spacing: {
    iconToText: "40-60px",
    wordmarkToTagline: "8-12px",
  },
};

export const BANNER_PROMPT_BLOCK = `
BANNER LAYOUT:
- Lockup: Icon on LEFT, Wordmark+Tagline text block on RIGHT
- Tagline sits DIRECTLY under the WORDMARK
- Tagline left-aligned with wordmark first letter
- NEVER center tagline under full lockup
- Icon-to-text gap: 40-60px
- Wordmark-to-tagline gap: 8-12px
`;

// ============================================================================
// RENDER STYLES
// ============================================================================

export const RENDER_STYLES = {
  // Available presets
  presets: [
    "flat-solid",  // Programmatic, instant, deterministic
    "flat",        // Clean 2D
    "gradient",    // Smooth depth
    "glass",       // Glassmorphism
    "gavin",       // Iridescent holographic
    "chrome",      // Metallic chrome
    "gold",        // Metallic gold
    "silver",      // Metallic silver
    "neon",        // Glowing outlines
    "3d",          // Dimensional
    "holographic", // Rainbow foil
    "cyberpunk",   // Neon cityscape
  ] as const,
  
  // Default
  default: "flat-solid",
  
  // Style-specific rules
  rules: {
    neon: "ONLY for icons without solid fill requirements (no eyes with pupils)",
    flatSolid: "Programmatic render, no AI - instant and deterministic",
    cyberpunk: "Use sparingly - only for tech/gaming/night themes",
  },
};

export type RenderStyle = typeof RENDER_STYLES.presets[number];

// ============================================================================
// CREATIVE DIRECTOR MODE (NEW 2025-02-19)
// ============================================================================

export const CREATIVE_DIRECTOR_RULES = {
  // ONE brief call makes ALL decisions
  singleBriefCall: true,
  
  // AI generates the icon prompt dynamically
  dynamicIconPrompt: true,
  
  // QC criteria defined per job
  dynamicQC: true,
  
  // Registry for uniqueness
  useRegistry: true,
  
  // Always include standard QC checks
  standardQCCriteria: [
    "Icon is recognizable at 32x32px",
    "Single visual element (Rule of One)",
    "Black on white only (no colors)",
    "60-70% frame fill",
  ],
};

export const BRIEF_MUST_INCLUDE = [
  "iconConcept: 2-5 word concept",
  "iconImagePrompt: Full prompt with all rules",
  "mustHaveFeatures: What MUST be in the icon",
  "qcCriteria: What to verify",
  "mode: dark or light",
  "renderStyle: For later stage",
];

// ============================================================================
// EYE/PUPIL RULES
// ============================================================================

export const EYE_RENDERING_RULES = {
  // If icon has eyes with pupils
  hasEyesWithPupils: {
    avoidNeon: true, // Neon = outlines only, pupils need solid fill
    preferredStyles: ["glass", "gradient", "gavin"],
    reason: "Pupils need SOLID WHITE FILL (catchlight), not outline",
  },
};
