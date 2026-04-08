/**
 * OpenGFX Type Definitions
 */

// ═══════════════════════════════════════════════════════════════════
// FONT SYSTEM
// ═══════════════════════════════════════════════════════════════════

export type FontCategory = "sans-serif" | "serif" | "slab" | "script" | "monospace";
export type FontUse = "body" | "display" | "accent" | "code";

export interface FontConfig {
  weights: number[];
  category: FontCategory;
  use: FontUse;
}

export interface FontLibrary {
  [fontName: string]: FontConfig;
}

// ═══════════════════════════════════════════════════════════════════
// RENDER STYLES
// ═══════════════════════════════════════════════════════════════════

export type RenderStylePreset =
  | "flat-solid"     // Programmatic solid colors (no AI)
  | "flat"           // Solid colors, minimal, clean
  | "gradient"       // Smooth color transitions
  | "glass"          // Plain frosted glass, subtle
  | "gavin"          // Iridescent glass (Gavin Nelson style)
  | "chrome"         // Metallic chrome reflections
  | "gold"           // Metallic gold
  | "silver"         // Metallic silver
  | "neon"           // Glowing edges, cyberpunk
  | "3d"             // Depth, shadows, dimension
  | "holographic"    // Rainbow holographic foil
  | "cyberpunk"      // Neon cityscape background + neon icon treatment
  | "custom";        // User-defined via prompt

export interface RenderStyleParameters {
  material?: "glass" | "metal" | "plastic" | "fabric" | "liquid";
  finish?: "matte" | "glossy" | "brushed" | "polished" | "frosted";
  lighting?: "soft" | "dramatic" | "neon" | "natural" | "studio";
  colorMode?: "brand" | "monochrome" | "iridescent" | "duotone";
  depth?: "flat" | "subtle" | "deep";
  effects?: ("glow" | "reflection" | "shadow" | "blur" | "grain")[];
}

export interface RenderStyle {
  preset: RenderStylePreset;
  customPrompt?: string;
  parameters: RenderStyleParameters;
}

// ═══════════════════════════════════════════════════════════════════
// COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted?: string;
  success?: string;
  warning?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════

export interface Typography {
  headerFont: string;
  headerWeight: number;
  bodyFont: string;
  bodyWeight: number;
  monoFont?: string;
  monoWeight?: number;
}

// ═══════════════════════════════════════════════════════════════════
// BRAND SYSTEM (Master Schema)
// ═══════════════════════════════════════════════════════════════════

export interface BrandInfo {
  name: string;
  tagline?: string;
  concept: string;
}

export interface LogoFiles {
  icon: string;
  wordmark: string;
  stacked: string;
  horizontal: string;
}

export interface BrandSystem {
  brand?: BrandInfo;
  brandName?: string;      // Alternative to brand.name
  tagline?: string;        // Alternative to brand.tagline
  logo?: LogoFiles;
  colors: ColorPalette;
  typography?: Typography;
  renderStyle?: RenderStyle;
  mode?: "dark" | "light";  // Dark = dark bg/light text; Light = light bg/dark text
  version?: string;
  generatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// BRAND ANALYSIS
// ═══════════════════════════════════════════════════════════════════

export interface BrandAnalysis {
  explicitFont: string | null;
  explicitWeight: number | null;
  styleRequest: string | null;
  brandVibe: string[];
  recommendation: "library" | "generate";
  recommendedFont: string | null;
  recommendedWeight: number | null;
  reasoning: string;
}

export interface StyleGuideAnalysis {
  renderStyle: RenderStyle;
  colors: ColorPalette;
  typography: Typography;
  mode: "dark" | "light";  // Dark mode = dark bg, light text; Light mode = light bg, dark text
  reasoning: string;
}

// ═══════════════════════════════════════════════════════════════════
// SOCIAL PLATFORMS
// ═══════════════════════════════════════════════════════════════════

export interface ImageDimensions {
  width: number;
  height: number;
  ratio: string;
}

export interface PlatformAssets {
  profile: ImageDimensions;
  banner?: ImageDimensions;
  bannerAlt?: ImageDimensions;  // For platforms with multiple banner sizes
}

export interface SocialPlatforms {
  [platform: string]: PlatformAssets;
}

export interface SocialsManifest {
  brandSystem: string;  // Path to brand-system.json
  avatars: { [platform: string]: string };
  banners: { [platform: string]: string };
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// PIPELINE OPTIONS
// ═══════════════════════════════════════════════════════════════════

export interface BrandFoundationOptions {
  fontOverride?: string | null;
  weightOverride?: number | null;
  renderStyleOverride?: RenderStylePreset | null;
  colorsOverride?: Partial<ColorPalette> | null;
}

export interface SocialsOptions {
  platforms?: string[];  // Specific platforms to generate (default: all)
  includeTagline?: boolean;
  taglineOverride?: string;
}

// BYOL (Bring Your Own Logo) mode for social service
export interface BYOLInput {
  logoUrl: string;          // URL to existing logo/icon
  brandName: string;        // Required for BYOL
  tagline?: string;
  primaryColor?: string;    // Optional - will auto-extract if not provided
  secondaryColor?: string;
  backgroundColor?: string;
  renderStyle?: RenderStylePreset;  // Optional - will auto-detect if not provided
}

export interface GfxOptions {
  platform?: string;
  width?: number;
  height?: number;
  format?: "png" | "jpg" | "webp";
  aspectRatio?: string;  // e.g., "1:1", "16:9", "4:5"
  jobId?: string;        // For gateway job tracking
}

export type CharacterType = 
  | "mascot"      // Brand mascot (friendly, approachable)
  | "avatar"      // Human-like character
  | "creature"    // Fantasy/abstract creature
  | "robot"       // Robot/android
  | "animal"      // Anthropomorphic animal
  | "abstract";   // Abstract/geometric character

export type CharacterStyle =
  | "2d-flat"        // Flat vector style
  | "2d-illustrated" // Detailed 2D illustration
  | "3d-rendered"    // 3D rendered look
  | "pixel"          // Pixel art style
  | "anime"          // Anime/manga style
  | "clay"           // Claymation style
  | "gradient"       // Modern gradient style
  | "glassmorphic";  // Glass/transparent style

export interface MascotOptions {
  characterType?: CharacterType;
  style?: CharacterStyle;
  personality?: string;
  features?: string;
  poses?: number;
  outputDir?: string;
  jobId?: string;
}
