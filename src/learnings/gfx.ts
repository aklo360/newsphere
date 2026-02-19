/**
 * GFX LEARNINGS - Rules for on-brand graphic generation
 * 
 * Edit here → affects all future GFX generation.
 */

import { QUALITY_KEYWORDS } from "./core.js";

// ============================================================================
// GFX SERVICE RULES
// ============================================================================

export const GFX_RULES = {
  // Price
  priceUsd: 2,
  
  // Default aspect ratio
  defaultAspect: "1:1",
  
  // Supported aspects
  supportedAspects: ["1:1", "16:9", "9:16", "4:5", "3:2", "2:3"] as const,
  
  // Brand system required
  requiresBrandSystem: true,
};

// ============================================================================
// USE CASES
// ============================================================================

export const GFX_USE_CASES = [
  "Announcements",
  "Product launches", 
  "Feature highlights",
  "Milestones",
  "Events",
  "Quotes",
  "Promotions",
  "Hiring posts",
  "Updates",
  "Teasers",
] as const;

// ============================================================================
// COMPOSITION RULES
// ============================================================================

export const GFX_COMPOSITION = {
  // Brand elements
  brandElements: {
    logoPlacement: "corner or subtle watermark",
    colorPalette: "strict adherence to brand-system.json",
    typography: "brand fonts only",
  },
  
  // Layout
  layout: {
    headlinePosition: "upper third for impact",
    visualFocus: "center or golden ratio",
    breathingRoom: "minimum 5% padding",
  },
  
  // Hierarchy
  hierarchy: [
    "1. Hero visual (if any)",
    "2. Headline/main message",
    "3. Supporting text",
    "4. Brand mark",
  ],
};

// ============================================================================
// STYLE CONSISTENCY
// ============================================================================

export const GFX_STYLE_RULES = {
  // Must match brand render style
  matchBrandRenderStyle: true,
  
  // Color usage
  colorUsage: {
    primary: "60% of design",
    secondary: "30% of design", 
    accent: "10% of design",
  },
  
  // Typography scale
  typographyScale: {
    headline: "bold, large, impactful",
    body: "regular weight, readable",
    caption: "smaller, subtle",
  },
};

// ============================================================================
// PROMPT CONSTRUCTION
// ============================================================================

export const GFX_PROMPT_TEMPLATE = (options: {
  brandName: string;
  primaryColor: string;
  prompt: string;
  aspectRatio: string;
}) => {
  const { brandName, primaryColor, prompt, aspectRatio } = options;
  
  return `
Create a marketing graphic for ${brandName}.

ASPECT RATIO: ${aspectRatio}
PRIMARY BRAND COLOR: ${primaryColor}

DESIGN BRIEF:
${prompt}

REQUIREMENTS:
- On-brand with ${brandName} visual identity
- Clean, professional composition
- ${QUALITY_KEYWORDS.premium.join(", ")}
- Modern design aesthetic
- Clear visual hierarchy

STYLE:
- Flat, clean illustration style
- Bold typography if text included
- Brand colors prominent
- Subtle gradients okay
`;
};

// ============================================================================
// BYOL (Bring Your Own Logo) MODE
// ============================================================================

export const BYOL_RULES = {
  // When user provides logo URL instead of brand-system.json
  enabled: true,
  
  // Required inputs
  requiredInputs: ["logoUrl", "brandName"],
  
  // Optional inputs
  optionalInputs: ["primaryColor", "secondaryColor"],
  
  // AI extracts colors from logo if not provided
  autoExtractColors: true,
};

// ============================================================================
// OUTPUT RULES
// ============================================================================

export const GFX_OUTPUT = {
  // Format
  format: "png",
  
  // Quality
  quality: "maximum",
  
  // Sizes based on aspect
  sizes: {
    "1:1": { w: 1080, h: 1080 },
    "16:9": { w: 1920, h: 1080 },
    "9:16": { w: 1080, h: 1920 },
    "4:5": { w: 1080, h: 1350 },
    "3:2": { w: 1200, h: 800 },
    "2:3": { w: 800, h: 1200 },
  },
};

// ============================================================================
// ANTI-PATTERNS
// ============================================================================

export const GFX_ANTI_PATTERNS = [
  "Never deviate from brand colors",
  "Never use off-brand fonts",
  "Never create cluttered compositions",
  "Never forget brand mark/logo",
  "Never ignore aspect ratio requirements",
];
