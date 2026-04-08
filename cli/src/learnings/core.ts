/**
 * CORE LEARNINGS - Universal rules for ALL OpenGFX design
 * 
 * These apply to: logos, socials, GFX, mascots, everything.
 * Edit here → affects ALL services.
 */

// ============================================================================
// GEMINI IMAGE GENERATION RULES (UNIVERSAL)
// ============================================================================

export const GEMINI_RULES = {
  // Gemini draws checkered pattern instead of real alpha
  neverRequestTransparent: true,
  
  // Always specify exact dimensions in prompt
  specifyDimensions: true,
  
  // Always request solid colored background with hex code
  solidBackgroundWithHex: true,
  
  // Two-step (generate wide → resize) creates visible seams
  singlePassGeneration: true,
};

export const GEMINI_ANTI_PATTERNS = [
  "Never request transparent background → Gemini draws checkered pattern",
  "Never generate wide then resize/pad → creates visible color seams",
  "Never use vague color descriptions → always specify hex codes",
  "Never skip dimensions in prompt → leads to inconsistent aspect ratios",
];

// ============================================================================
// IMAGE FORMAT TEMPLATES
// ============================================================================

export const IMAGE_FORMATS = {
  square: (size: number, bgHex: string, bgName: string) => `
IMAGE FORMAT:
- SQUARE 1:1 aspect ratio (${size}x${size})
- Solid flat ${bgHex} ${bgName} background filling the ENTIRE image
`,

  banner: (width: number, height: number, bgHex: string, bgName: string) => `
IMAGE FORMAT:
- ${width}x${height} pixels (${width}:${height} aspect ratio)
- Solid flat ${bgHex} ${bgName} background filling the ENTIRE image
`,

  // Standard sizes
  sizes: {
    avatar: { w: 1024, h: 1024 },
    twitterBanner: { w: 3000, h: 1000 },
    ogCard: { w: 1200, h: 628 },
    communityBanner: { w: 1200, h: 480 },
    instagramSquare: { w: 1080, h: 1080 },
    instagramStory: { w: 1080, h: 1920 },
  },
};

// ============================================================================
// COLOR RULES
// ============================================================================

export const COLOR_RULES = {
  // Always specify colors as hex codes
  useHexCodes: true,
  
  // Include color name for Gemini understanding
  includeColorName: true,
  
  // Format: "#HEX colorname"
  formatExample: "#C8B4DC lavender",
};

// ============================================================================
// POST-PROCESSING RULES (UNIVERSAL)
// ============================================================================

export const POST_PROCESSING_RULES = {
  // Safe operations that don't break output
  safeOperations: [
    "resize",
    "format conversion (png, jpg)",
    "quality adjustment",
  ] as const,
  
  // DANGEROUS operations that can break output
  dangerousOperations: [
    "white pixel removal → destroys highlights",
    "color clamping → removes intentional whites",
    "background replacement → creates seams",
    "transparency conversion → Gemini doesn't output real alpha",
  ] as const,
  
  // Never do these
  forbidden: [
    "clampWhite",
    "removeBackground", 
    "addTransparency",
  ] as const,
};

// ============================================================================
// QUALITY KEYWORDS
// ============================================================================

export const QUALITY_KEYWORDS = {
  // Add to prompts for better output
  premium: [
    "ULTRA PREMIUM",
    "4K quality",
    "SHARP, CRISP",
    "professional design",
    "high quality",
  ],
  
  // Style keywords
  flat: ["2D flat illustration", "clean vectors", "minimal"],
  gradient: ["smooth gradients", "depth", "dimensional"],
  glass: ["glassmorphism", "frosted glass", "translucent"],
  neon: ["neon glow", "light emission", "cyberpunk"],
};

// ============================================================================
// BRAND CONSISTENCY RULES
// ============================================================================

export const BRAND_CONSISTENCY = {
  // All assets must reference brand-system.json
  useBrandSystem: true,
  
  // Never deviate from brand colors
  strictColorAdherence: true,
  
  // Typography must match brand fonts
  useDefinedFonts: true,
  
  // Tagline placement rules
  taglinePlacement: {
    position: "directly under wordmark",
    alignment: "left-aligned with wordmark first letter",
    neverCenterUnderFullLockup: true,
  },
};

// ============================================================================
// UNIVERSAL PROMPT BUILDER
// ============================================================================

export function buildBasePrompt(options: {
  format: string;
  bgHex: string;
  bgName: string;
  qualityLevel?: "standard" | "premium";
}): string {
  const { format, bgHex, bgName, qualityLevel = "premium" } = options;
  
  const parts: string[] = [];
  
  // Format block
  parts.push(format);
  
  // Quality keywords
  if (qualityLevel === "premium") {
    parts.push(`\nQUALITY: ${QUALITY_KEYWORDS.premium.join(", ")}`);
  }
  
  // Background emphasis
  parts.push(`\nBACKGROUND: Solid ${bgHex} ${bgName} - NO gradients, NO patterns, NO transparency`);
  
  return parts.join("\n");
}
