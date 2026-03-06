/**
 * NewSphere Constants
 * Curated defaults from OpenGFX/OpenVID research
 */

import type { PersonalityTrait, RenderStylePreset } from "./types";

// ═══════════════════════════════════════════════════════════════════
// FONT LIBRARY (from OpenGFX)
// ═══════════════════════════════════════════════════════════════════

export interface FontConfig {
  weights: number[];
  category: "sans-serif" | "serif" | "slab" | "script" | "monospace";
  use: "body" | "display" | "accent" | "code";
  vibe: string[];
}

export const FONT_LIBRARY: Record<string, FontConfig> = {
  // Sans-Serif
  "Inter": {
    weights: [300, 400, 500, 600, 700],
    category: "sans-serif",
    use: "body",
    vibe: ["clean", "modern", "professional", "tech"],
  },
  "Geist": {
    weights: [400, 500, 600, 700],
    category: "sans-serif",
    use: "display",
    vibe: ["tech", "developer", "modern", "minimal"],
  },
  "DM Sans": {
    weights: [400, 500, 600, 700],
    category: "sans-serif",
    use: "body",
    vibe: ["friendly", "geometric", "approachable"],
  },
  "Space Grotesk": {
    weights: [400, 500, 600, 700],
    category: "sans-serif",
    use: "display",
    vibe: ["tech", "crypto", "bold", "futuristic"],
  },
  "Plus Jakarta Sans": {
    weights: [400, 500, 600, 700, 800],
    category: "sans-serif",
    use: "body",
    vibe: ["premium", "saas", "professional"],
  },
  "Bebas Neue": {
    weights: [400],
    category: "sans-serif",
    use: "display",
    vibe: ["bold", "condensed", "impactful", "sports"],
  },
  "Anton": {
    weights: [400],
    category: "sans-serif",
    use: "display",
    vibe: ["ultra-bold", "headlines", "impactful"],
  },
  "Nunito": {
    weights: [300, 400, 500, 600, 700],
    category: "sans-serif",
    use: "body",
    vibe: ["rounded", "friendly", "warm"],
  },
  "Outfit": {
    weights: [300, 400, 500, 600, 700],
    category: "sans-serif",
    use: "body",
    vibe: ["modern", "geometric", "clean"],
  },
  "Sora": {
    weights: [300, 400, 500, 600, 700],
    category: "sans-serif",
    use: "body",
    vibe: ["tech", "modern", "geometric"],
  },
  
  // Serif
  "Playfair Display": {
    weights: [400, 500, 600, 700],
    category: "serif",
    use: "display",
    vibe: ["luxury", "classic", "elegant", "editorial"],
  },
  "Instrument Serif": {
    weights: [400],
    category: "serif",
    use: "display",
    vibe: ["modern", "editorial", "sophisticated"],
  },
  "Cormorant Garamond": {
    weights: [300, 400, 500, 600, 700],
    category: "serif",
    use: "body",
    vibe: ["refined", "elegant", "luxury"],
  },
  "Source Serif Pro": {
    weights: [400, 600, 700],
    category: "serif",
    use: "body",
    vibe: ["readable", "professional", "editorial"],
  },
  "Fraunces": {
    weights: [400, 500, 600, 700],
    category: "serif",
    use: "display",
    vibe: ["quirky", "friendly", "warm", "playful"],
  },
  
  // Slab
  "Roboto Slab": {
    weights: [400, 500, 600, 700],
    category: "slab",
    use: "display",
    vibe: ["bold", "strong", "reliable"],
  },
  
  // Script/Handwriting
  "Dancing Script": {
    weights: [400, 500, 600, 700],
    category: "script",
    use: "accent",
    vibe: ["elegant", "feminine", "cursive"],
  },
  "Caveat": {
    weights: [400, 500, 600, 700],
    category: "script",
    use: "accent",
    vibe: ["casual", "handwritten", "friendly"],
  },
  
  // Monospace
  "JetBrains Mono": {
    weights: [400, 500, 600, 700],
    category: "monospace",
    use: "code",
    vibe: ["developer", "tech", "precise"],
  },
  "Space Mono": {
    weights: [400, 700],
    category: "monospace",
    use: "code",
    vibe: ["retro", "tech", "editorial"],
  },
  "Fira Code": {
    weights: [400, 500, 600, 700],
    category: "monospace",
    use: "code",
    vibe: ["developer", "modern", "clean"],
  },
};

// ═══════════════════════════════════════════════════════════════════
// RENDER STYLES (from OpenGFX)
// ═══════════════════════════════════════════════════════════════════

export interface RenderStyleConfig {
  name: string;
  description: string;
  vibe: string[];
  bestFor: string[];
}

export const RENDER_STYLES: Record<RenderStylePreset, RenderStyleConfig> = {
  flat: {
    name: "Flat",
    description: "Solid colors, minimal, clean",
    vibe: ["minimal", "modern", "clean"],
    bestFor: ["tech", "saas", "corporate"],
  },
  gradient: {
    name: "Gradient",
    description: "Smooth color transitions",
    vibe: ["modern", "vibrant", "dynamic"],
    bestFor: ["apps", "startups", "creative"],
  },
  glass: {
    name: "Glass",
    description: "Frosted glass, glassmorphism",
    vibe: ["premium", "modern", "soft"],
    bestFor: ["apps", "fintech", "luxury"],
  },
  gavin: {
    name: "Iridescent Glass",
    description: "Gavin Nelson style iridescent glass",
    vibe: ["premium", "artistic", "unique"],
    bestFor: ["creative", "design", "luxury"],
  },
  chrome: {
    name: "Chrome",
    description: "Metallic chrome reflections",
    vibe: ["tech", "futuristic", "bold"],
    bestFor: ["automotive", "tech", "gaming"],
  },
  gold: {
    name: "Gold",
    description: "Luxurious gold metallic",
    vibe: ["luxury", "premium", "elegant"],
    bestFor: ["finance", "luxury", "awards"],
  },
  silver: {
    name: "Silver",
    description: "Elegant silver metallic",
    vibe: ["elegant", "professional", "refined"],
    bestFor: ["jewelry", "tech", "corporate"],
  },
  neon: {
    name: "Neon",
    description: "Glowing edges, cyberpunk",
    vibe: ["edgy", "nightlife", "gaming"],
    bestFor: ["gaming", "nightlife", "crypto"],
  },
  "3d": {
    name: "3D",
    description: "Full 3D depth and shadows",
    vibe: ["modern", "premium", "dynamic"],
    bestFor: ["apps", "products", "tech"],
  },
  holographic: {
    name: "Holographic",
    description: "Rainbow holographic foil",
    vibe: ["playful", "trendy", "unique"],
    bestFor: ["fashion", "music", "gen-z"],
  },
};

// ═══════════════════════════════════════════════════════════════════
// PERSONALITY TRAITS
// ═══════════════════════════════════════════════════════════════════

export interface PersonalityConfig {
  name: string;
  description: string;
  suggestedFonts: string[];
  suggestedStyles: RenderStylePreset[];
}

export const PERSONALITY_TRAITS: Record<PersonalityTrait, PersonalityConfig> = {
  professional: {
    name: "Professional",
    description: "Trustworthy, reliable, established",
    suggestedFonts: ["Inter", "Plus Jakarta Sans", "Source Serif Pro"],
    suggestedStyles: ["flat", "glass", "silver"],
  },
  playful: {
    name: "Playful",
    description: "Fun, energetic, approachable",
    suggestedFonts: ["Nunito", "DM Sans", "Fraunces"],
    suggestedStyles: ["gradient", "holographic", "3d"],
  },
  bold: {
    name: "Bold",
    description: "Strong, confident, impactful",
    suggestedFonts: ["Bebas Neue", "Anton", "Space Grotesk"],
    suggestedStyles: ["chrome", "neon", "3d"],
  },
  minimal: {
    name: "Minimal",
    description: "Clean, simple, focused",
    suggestedFonts: ["Inter", "Geist", "Outfit"],
    suggestedStyles: ["flat", "glass"],
  },
  luxurious: {
    name: "Luxurious",
    description: "Premium, sophisticated, exclusive",
    suggestedFonts: ["Playfair Display", "Cormorant Garamond", "Instrument Serif"],
    suggestedStyles: ["gold", "silver", "gavin"],
  },
  friendly: {
    name: "Friendly",
    description: "Warm, inviting, personable",
    suggestedFonts: ["Nunito", "DM Sans", "Plus Jakarta Sans"],
    suggestedStyles: ["gradient", "glass", "3d"],
  },
  innovative: {
    name: "Innovative",
    description: "Cutting-edge, forward-thinking",
    suggestedFonts: ["Geist", "Space Grotesk", "Sora"],
    suggestedStyles: ["chrome", "neon", "holographic"],
  },
  traditional: {
    name: "Traditional",
    description: "Classic, timeless, heritage",
    suggestedFonts: ["Playfair Display", "Source Serif Pro", "Cormorant Garamond"],
    suggestedStyles: ["flat", "gold"],
  },
  edgy: {
    name: "Edgy",
    description: "Bold, unconventional, daring",
    suggestedFonts: ["Space Grotesk", "Bebas Neue", "Space Mono"],
    suggestedStyles: ["neon", "chrome", "holographic"],
  },
  warm: {
    name: "Warm",
    description: "Comforting, nurturing, organic",
    suggestedFonts: ["Nunito", "Fraunces", "Caveat"],
    suggestedStyles: ["gradient", "3d"],
  },
  technical: {
    name: "Technical",
    description: "Precise, detailed, expert",
    suggestedFonts: ["JetBrains Mono", "Space Grotesk", "Geist"],
    suggestedStyles: ["flat", "chrome"],
  },
  approachable: {
    name: "Approachable",
    description: "Easy-going, accessible, welcoming",
    suggestedFonts: ["DM Sans", "Nunito", "Plus Jakarta Sans"],
    suggestedStyles: ["gradient", "glass", "3d"],
  },
  sophisticated: {
    name: "Sophisticated",
    description: "Refined, cultured, intelligent",
    suggestedFonts: ["Instrument Serif", "Cormorant Garamond", "Plus Jakarta Sans"],
    suggestedStyles: ["glass", "silver", "gavin"],
  },
  casual: {
    name: "Casual",
    description: "Relaxed, informal, laid-back",
    suggestedFonts: ["DM Sans", "Caveat", "Nunito"],
    suggestedStyles: ["flat", "gradient"],
  },
  authoritative: {
    name: "Authoritative",
    description: "Expert, commanding, respected",
    suggestedFonts: ["Inter", "Source Serif Pro", "Space Grotesk"],
    suggestedStyles: ["flat", "chrome", "silver"],
  },
};

// ═══════════════════════════════════════════════════════════════════
// INDUSTRIES
// ═══════════════════════════════════════════════════════════════════

export const INDUSTRIES = [
  "Technology",
  "Finance / Fintech",
  "Healthcare",
  "E-commerce / Retail",
  "Education",
  "Entertainment / Media",
  "Food & Beverage",
  "Travel / Hospitality",
  "Real Estate",
  "Fashion / Beauty",
  "Automotive",
  "Sports / Fitness",
  "Gaming",
  "Crypto / Web3",
  "SaaS / B2B",
  "Non-profit",
  "Creative / Design",
  "Legal / Professional Services",
  "Manufacturing",
  "Other",
];

// ═══════════════════════════════════════════════════════════════════
// WIZARD STEPS
// ═══════════════════════════════════════════════════════════════════

export const CREATE_STEPS = [
  { id: "basics", label: "Basics", description: "Name & concept" },
  { id: "personality", label: "Personality", description: "Brand traits" },
  { id: "generating", label: "Creating", description: "AI magic" },
  { id: "preview", label: "Preview", description: "Review brand" },
  { id: "refine", label: "Refine", description: "Fine-tune" },
] as const;

export const IMPORT_STEPS = [
  { id: "input", label: "Input", description: "URL or file" },
  { id: "extracting", label: "Extracting", description: "Analyzing" },
  { id: "verify", label: "Verify", description: "Review & approve" },
] as const;
