/**
 * NewSphere Brand Bible Schema
 * 
 * This is the MASTER SCHEMA. Everything flows from it.
 * Mirrors OpenGFX/OpenVID architecture.
 */

// ═══════════════════════════════════════════════════════════════════
// RENDER STYLES (from OpenGFX)
// ═══════════════════════════════════════════════════════════════════

export type RenderStylePreset =
  | "flat"           // Solid colors, minimal, clean
  | "gradient"       // Smooth color transitions
  | "glass"          // Frosted glass, glassmorphism
  | "gavin"          // Iridescent glass (Gavin Nelson style)
  | "chrome"         // Metallic chrome reflections
  | "gold"           // Metallic gold
  | "silver"         // Metallic silver
  | "neon"           // Glowing edges, cyberpunk
  | "3d"             // Depth, shadows, dimension
  | "holographic";   // Rainbow holographic foil

export interface RenderStyleParameters {
  material?: "glass" | "metal" | "plastic" | "fabric" | "liquid";
  finish?: "matte" | "glossy" | "brushed" | "polished" | "frosted";
  lighting?: "soft" | "dramatic" | "neon" | "natural" | "studio";
  colorMode?: "brand" | "monochrome" | "iridescent" | "duotone";
  depth?: "flat" | "subtle" | "deep";
}

export interface RenderStyle {
  preset: RenderStylePreset;
  parameters?: RenderStyleParameters;
}

// ═══════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════

export interface Color {
  hex: string;
  name?: string;
  usage?: string;
}

export interface ColorPalette {
  primary: Color;
  secondary?: Color;
  accent?: Color;
  background: Color;
  foreground: Color;
  muted?: Color;
  neutral?: Color[];
  semantic?: {
    success?: Color;
    warning?: Color;
    error?: Color;
    info?: Color;
  };
  gradients?: {
    name?: string;
    type: "linear" | "radial";
    angle?: number;
    stops: { color: string; position: number }[];
  }[];
}

// ═══════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════

export interface FontStyle {
  family: string;
  weight: number;
  fallback?: string[];
  googleFont?: boolean;
}

export interface Typography {
  display?: FontStyle;
  heading: FontStyle;
  body: FontStyle;
  mono?: FontStyle;
  scale?: {
    base: number;
    ratio: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// VOICE & TONE
// ═══════════════════════════════════════════════════════════════════

export type PersonalityTrait =
  | "professional"
  | "playful"
  | "bold"
  | "minimal"
  | "luxurious"
  | "friendly"
  | "innovative"
  | "traditional"
  | "edgy"
  | "warm"
  | "technical"
  | "approachable"
  | "sophisticated"
  | "casual"
  | "authoritative";

export interface VoiceAndTone {
  personality: PersonalityTrait[];
  tone?: {
    formal: number;      // 0-100
    playful: number;     // 0-100
    technical: number;   // 0-100
  };
  vocabulary?: {
    preferred?: string[];
    avoided?: string[];
  };
  examples?: {
    do?: string[];
    dont?: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════
// LOGO SYSTEM
// ═══════════════════════════════════════════════════════════════════

export interface LogoVariant {
  url?: string;
  storageId?: string;  // Convex file storage ID
  format: "svg" | "png" | "jpg";
  background: "light" | "dark" | "any";
}

export interface LogoSystem {
  icon?: LogoVariant;
  wordmark?: LogoVariant;
  stacked?: LogoVariant;
  horizontal?: LogoVariant;
  usage?: {
    minSize?: string;
    clearSpace?: string;
    donts?: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════
// BRAND IDENTITY
// ═══════════════════════════════════════════════════════════════════

export interface BrandIdentity {
  name: string;
  tagline?: string;
  mission?: string;
  vision?: string;
  values?: string[];
  industry?: string;
  targetAudience?: string;
  competitors?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// SOCIAL MEDIA
// ═══════════════════════════════════════════════════════════════════

export interface SocialHandles {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  discord?: string;
  telegram?: string;
  github?: string;
}

export interface SocialAssets {
  avatar?: string;
  twitterBanner?: string;
  ogImage?: string;
  communityBanner?: string;
}

// ═══════════════════════════════════════════════════════════════════
// BRAND BIBLE (Master Schema)
// ═══════════════════════════════════════════════════════════════════

export type BrandSource = "created" | "imported" | "manual";
export type BrandMode = "dark" | "light";

export interface BrandMeta {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  source: BrandSource;
  sourceUrl?: string;       // If imported from URL
  version: string;
}

export interface BrandBible {
  meta: BrandMeta;
  identity: BrandIdentity;
  colors: ColorPalette;
  typography: Typography;
  voice: VoiceAndTone;
  logo?: LogoSystem;
  renderStyle: RenderStyle;
  mode: BrandMode;
  social?: {
    handles?: SocialHandles;
    assets?: SocialAssets;
    hashtags?: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════
// AI CREATIVE DIRECTOR BRIEF
// (What the AI generates in one holistic pass)
// ═══════════════════════════════════════════════════════════════════

export interface CreativeDirectorBrief {
  // Brand Identity
  brandName: string;
  generatedName: boolean;
  tagline: string | null;
  mission: string | null;
  
  // Visual Concept
  iconConcept: string;
  iconDescription: string;
  
  // Typography
  headingFont: string;
  headingWeight: number;
  bodyFont: string;
  bodyWeight: number;
  fontReasoning: string;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  mode: BrandMode;
  colorReasoning: string;
  
  // Render Style
  renderStyle: RenderStylePreset;
  styleNotes: string;
  
  // Voice
  personality: PersonalityTrait[];
  toneProfile: {
    formal: number;
    playful: number;
    technical: number;
  };
  
  // QC Criteria (AI defines what to check)
  mustHaveFeatures: string[];
  brandVibe: string[];
}

// ═══════════════════════════════════════════════════════════════════
// BRAND EXTRACTION (from URL/PDF/Image)
// ═══════════════════════════════════════════════════════════════════

export interface ExtractedBrand {
  // What we found
  name?: string;
  tagline?: string;
  colors: {
    extracted: string[];  // Raw hex values found
    primary?: string;
    secondary?: string;
    background?: string;
  };
  fonts: {
    extracted: string[];  // Raw font names found
    heading?: string;
    body?: string;
  };
  logo?: {
    url: string;
    format: string;
  };
  
  // Source info
  sourceUrl?: string;
  sourceType: "url" | "pdf" | "image";
  
  // Confidence scores
  confidence: {
    colors: number;   // 0-1
    fonts: number;    // 0-1
    logo: number;     // 0-1
    overall: number;  // 0-1
  };
}

// ═══════════════════════════════════════════════════════════════════
// WIZARD STATE
// ═══════════════════════════════════════════════════════════════════

export interface CreateWizardState {
  step: "basics" | "personality" | "generating" | "preview" | "refine";
  
  // User inputs
  name?: string;
  concept: string;
  industry?: string;
  targetAudience?: string;
  personality: PersonalityTrait[];
  
  // Generated
  brief?: CreativeDirectorBrief;
  brandBible?: BrandBible;
  
  // UI state
  isGenerating: boolean;
  error?: string;
}

export interface ImportWizardState {
  step: "input" | "extracting" | "verify" | "enhance" | "preview";
  
  // User inputs
  inputType: "url" | "pdf" | "image";
  url?: string;
  files?: File[];
  
  // Extracted
  extracted?: ExtractedBrand;
  
  // Enhanced (after AI fills gaps)
  brief?: CreativeDirectorBrief;
  brandBible?: BrandBible;
  
  // UI state
  isExtracting: boolean;
  isEnhancing: boolean;
  error?: string;
}
