/**
 * OpenGFX Constants
 */

import type { FontLibrary, SocialPlatforms } from "./types.js";

// ═══════════════════════════════════════════════════════════════════
// FONT LIBRARY
// ═══════════════════════════════════════════════════════════════════

export const FONT_LIBRARY: FontLibrary = {
  // ─── SANS-SERIF: Body/UI ───
  "Inter": { weights: [400, 500, 600, 700], category: "sans-serif", use: "body" },
  "Geist": { weights: [400, 500, 600, 700], category: "sans-serif", use: "body" },
  "DM Sans": { weights: [400, 500, 700], category: "sans-serif", use: "body" },
  "Google Sans Flex": { weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], category: "sans-serif", use: "body" },
  
  // ─── SANS-SERIF: Display ───
  "Space Grotesk": { weights: [400, 500, 600, 700], category: "sans-serif", use: "display" },
  "Plus Jakarta Sans": { weights: [400, 500, 600, 700, 800], category: "sans-serif", use: "display" },
  "Bebas Neue": { weights: [400], category: "sans-serif", use: "display" },
  "Anton": { weights: [400], category: "sans-serif", use: "display" },
  
  // ─── SANS-SERIF: Rounded ───
  "Nunito": { weights: [400, 500, 600, 700], category: "sans-serif", use: "body" },
  
  // ─── SERIF: Display ───
  "Playfair Display": { weights: [400, 500, 600, 700], category: "serif", use: "display" },
  "Instrument Serif": { weights: [400], category: "serif", use: "display" },
  "Cormorant Garamond": { weights: [400, 500, 600, 700], category: "serif", use: "display" },
  
  // ─── SERIF: Body ───
  "Source Serif Pro": { weights: [400, 600, 700], category: "serif", use: "body" },
  
  // ─── SLAB SERIF ───
  "Roboto Slab": { weights: [400, 500, 700], category: "slab", use: "display" },
  
  // ─── SCRIPT/CURSIVE ───
  "Caveat": { weights: [400, 500, 600, 700], category: "script", use: "accent" },
  "Dancing Script": { weights: [400, 500, 600, 700], category: "script", use: "accent" },
  
  // ─── MONOSPACE ───
  "JetBrains Mono": { weights: [400, 500, 600, 700], category: "monospace", use: "code" },
};

// Generate kebab-case lookup
export const INSTALLED_FONTS: Record<string, string> = Object.fromEntries(
  Object.keys(FONT_LIBRARY).map((family) => [
    family.toLowerCase().replace(/ /g, "-"),
    family
  ])
);

// ═══════════════════════════════════════════════════════════════════
// SOCIAL PLATFORM DIMENSIONS
// ═══════════════════════════════════════════════════════════════════

export const SOCIAL_PLATFORMS: SocialPlatforms = {
  // ─── TWITTER/X ─── (2x for crisp Retina display)
  twitter: {
    profile: { width: 800, height: 800, ratio: "1:1" },
    banner: { width: 3000, height: 1000, ratio: "3:1" },
  },
  
  // ─── FACEBOOK ─── (2x)
  facebook: {
    profile: { width: 640, height: 640, ratio: "1:1" },
    banner: { width: 1702, height: 630, ratio: "2.7:1" },
  },
  
  // ─── INSTAGRAM ─── (2x)
  instagram: {
    profile: { width: 640, height: 640, ratio: "1:1" },
    // No banner on IG
  },
  
  // ─── YOUTUBE ─── (already high-res)
  youtube: {
    profile: { width: 800, height: 800, ratio: "1:1" },
    banner: { width: 2560, height: 1440, ratio: "16:9" },
    bannerAlt: { width: 2048, height: 560, ratio: "3.65:1" },  // Safe zone (2x)
  },
  
  // ─── TIKTOK ─── (2x)
  tiktok: {
    profile: { width: 400, height: 400, ratio: "1:1" },
    // No traditional banner
  },
  
  // ─── LINKEDIN ─── (2x)
  linkedin: {
    profile: { width: 800, height: 800, ratio: "1:1" },
    banner: { width: 3168, height: 792, ratio: "4:1" },
    bannerAlt: { width: 2256, height: 382, ratio: "5.9:1" },  // Company page
  },
  
  // ─── DISCORD ─── (2x)
  discord: {
    profile: { width: 1024, height: 1024, ratio: "1:1" },
    banner: { width: 1920, height: 1080, ratio: "16:9" },
  },
  
  // ─── TWITCH ─── (2x)
  twitch: {
    profile: { width: 1024, height: 1024, ratio: "1:1" },
    banner: { width: 2400, height: 960, ratio: "2.5:1" },
  },
  
  // ─── GITHUB ─── (2x)
  github: {
    profile: { width: 1000, height: 1000, ratio: "1:1" },
    // No banner
  },
  
  // ─── TELEGRAM ─── (2x)
  telegram: {
    profile: { width: 1024, height: 1024, ratio: "1:1" },
    // No banner (channel photo same as profile)
  },
};

// ═══════════════════════════════════════════════════════════════════
// RENDER STYLE PROMPTS
// ═══════════════════════════════════════════════════════════════════

export const RENDER_STYLE_PROMPTS: Record<string, string> = {
  flat: `
    Render this logo in a FLAT style:
    - Solid, single colors with no gradients
    - Clean, minimal aesthetic
    - Sharp, vector-quality edges
    - No shadows, no depth, no effects
    - Modern, corporate feel
  `,
  
  gradient: `
    Render this logo with beautiful GRADIENTS:
    - Smooth color transitions using the brand colors
    - Modern gradient style (like Instagram or Firefox logos)
    - Can be linear, radial, or angular gradients
    - Vibrant but professional
    - Clean edges, no textures
  `,
  
  glass: `
    Render this logo in a FROSTED GLASS style:
    - Subtle transparency and blur effects
    - Soft reflections and refractions
    - Clean, modern glassmorphism aesthetic
    - Gentle shadows for depth
    - Premium, sophisticated feel
  `,
  
  gavin: `
    Render this logo in GAVIN NELSON's signature IRIDESCENT GLASS style:
    - Colorful iridescent reflections (rainbow oil-slick effect)
    - 3D glass/crystal material with depth
    - Soft, dreamy lighting
    - Holographic color shifts
    - Ethereal, premium tech aesthetic
    - Reference: Gavin Nelson's iconic glass icons
  `,
  
  chrome: `
    Render this logo in CHROME/METALLIC style:
    - Highly reflective chrome metal surface
    - Sharp reflections and highlights
    - 3D metallic depth
    - Cool silver/steel tones with environment reflections
    - Premium, futuristic tech feel
  `,
  
  gold: `
    Render this logo in GOLD METALLIC style:
    - Rich, luxurious gold metal finish
    - Warm golden highlights and reflections
    - 3D depth with metallic sheen
    - Can be polished gold or brushed gold
    - Premium, luxury brand feel
  `,
  
  silver: `
    Render this logo in SILVER METALLIC style:
    - Elegant silver/platinum metal finish
    - Cool metallic reflections
    - 3D depth with subtle sheen
    - Sophisticated, premium aesthetic
  `,
  
  neon: `
    Render this logo in NEON/GLOW style:
    - Glowing neon edges and outlines
    - Cyberpunk/synthwave aesthetic
    - Dark background with bright glow
    - Electric, vibrant colors
    - Light bloom and halo effects
    - Futuristic, edgy feel
  `,
  
  "3d": `
    Render this logo in 3D style:
    - Full 3D depth and dimension
    - Soft shadows and ambient occlusion
    - Professional studio lighting
    - Can be extruded, rounded, or sculpted
    - Modern 3D render aesthetic
  `,
  
  holographic: `
    Render this logo in HOLOGRAPHIC FOIL style:
    - Rainbow holographic effect (like holographic trading cards)
    - Iridescent color shifts
    - Metallic foil base with prismatic overlay
    - Shimmering, eye-catching effect
    - Premium collectible feel
  `,
};

// ═══════════════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export const ICON_STYLE_PROMPT = `
DESIGN DIRECTION: Senior brand designer at Pentagram creating a premium icon.

FIDELITY:
- HIGH FIDELITY — detailed, recognizable, professional
- If emoji referenced, icon must be IMMEDIATELY RECOGNIZABLE as that object
- Think Apple SF Symbols — detailed but clean

RENDERING:
- Solid black (#000000) on pure white (#FFFFFF)
- Clean vector-quality edges

SPECS:
- Square 1:1, 1024x1024 pixels
- Icon fills ~85% of canvas, centered

FORBIDDEN:
- NO borders, frames, or outlines around the icon
- NO box or container
- ONLY the icon itself on pure white
`;

export const WORDMARK_STYLE_PROMPT = `
TYPOGRAPHY:
- Clean modern typography
- Medium to Semi-Bold weight
- Balanced letter-spacing

RENDERING:
- Solid black (#000000) on pure white (#FFFFFF)
- Text fills width with minimal padding

SPECS:
- WIDE RECTANGULAR: 2048x512 pixels (4:1 ratio)
- Text fills ~90% of width

CRITICAL: Preserve the EXACT capitalization provided.
`;
