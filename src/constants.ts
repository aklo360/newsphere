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
  "flat-solid": `
    BYPASS_AI_RENDER: This is a programmatic render mode.
    Create a simple flat solid color graphic:
    - Solid single-color background (no gradients, no patterns)
    - Icon as a solid single-color silhouette (typically white on dark, black on light)
    - No 3D effects, no shadows, no reflections, no glass, no iridescence
    - Pure flat design like Discord, Slack, or Notion branding
    - Clean vector-style edges
    - This mode uses direct compositing, not AI generation
  `,
  
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
    Render this logo in PURE CHROME / POLISHED SILVER METAL style:
    - Polished stainless steel, liquid mercury, chrome car badge finish
    - ONLY silver, grey, white, and black tones
    - ABSOLUTELY NO color hues - no purple, no blue, no orange, no rainbow
    - NO iridescent effects, NO holographic, NO glass, NO transparency
    - Sharp metallic highlights with deep black shadows
    - Mirror-like reflective chrome surface
    - Cool neutral white lighting ONLY
    - Ultra premium luxury metal badge aesthetic
    - Think: Tesla logo, Apple logo in chrome, Mercedes badge
    - ALL parts of the logo should be chrome - including any eyes, glasses, or white areas
    - Fill white areas with reflective silver chrome, not white
    - ULTRA CLEAN, SIMPLE, LEGIBLE design
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
  
  cyberpunk: `
    Render this logo in CYBERPUNK style with CITYSCAPE BACKGROUND:
    
    🎨 ICON RENDERING (CRITICAL):
    - Use GLASS or GRADIENT style for the icon — NOT pure neon outlines
    - Any solid areas (like eye pupils, highlights) must be SOLID FILLS, not outlines
    - The icon should have depth, gradients, and iridescent purple/blue/cyan colors
    - Soft glow and bloom effects around the icon edges
    - Preserve any WHITE HIGHLIGHTS as solid white fills (e.g., eye catchlights)
    - Icon must be BRIGHT and HIGH CONTRAST against the background — it must POP
    
    🏙️ BACKGROUND (CRITICAL CONTRAST RULES):
    - Cyberpunk cityscape at night with towering dark skyscrapers
    - Neon signs and holographic billboards in purple/blue/pink
    - Rain-slicked streets or wet surfaces reflecting neon lights
    - Synthwave/Blade Runner aesthetic
    
    ⚠️ BACKGROUND MUST BE SUBTLE — NOT OVERPOWERING:
    - The cityscape should be FADED/DARKENED towards the CENTER
    - Use a dark vignette or gradient so the center is darker/calmer
    - Buildings and neon signs should be more prominent at the EDGES
    - The CENTER where the logo sits must have subdued/muted background
    - Logo must have MAXIMUM CONTRAST against background — never blend in
    - Think "logo in spotlight" — background recedes, logo pops forward
    
    The logo should DOMINATE the composition, cityscape is atmosphere only.
    ULTRA PREMIUM 4K quality, cinematic lighting.
  `,
};

// ═══════════════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export const ICON_STYLE_PROMPT = `
DESIGN DIRECTION: Senior brand designer at Pentagram creating a PREMIUM MINIMAL icon.

🚨 CRITICAL — BLACK ON WHITE (NON-NEGOTIABLE):
- DEFAULT: Pure BLACK (#000000) on WHITE (#FFFFFF) — nothing else
- NO colors (no blue, no purple, no red, no green, NOTHING)
- This is the BASE logo — color/effects come LATER at render stage
- Violating this rule breaks the entire pipeline
- Think classic Apple logo, Nike swoosh — pure black silhouettes

⚠️ GREY EXCEPTION (RARE — only when 100% necessary):
- ALWAYS try pure black on white FIRST
- Grey (#333-#CCC) ONLY if the icon shape absolutely requires shading to read correctly
- This is rare (maybe 20% of icons) — most icons work fine as pure black
- If grey is used, it must be essential for form comprehension, not decoration
- When in doubt, keep it pure black

⚠️ SIMPLICITY IS PARAMOUNT — GOLDEN RULE:
- THE RULE OF ONE: Pick ONE interesting visual element, not many
- TARGET: 40-50% complexity — SIMPLE, CLEAN, LUXURY
- Think Apple, Stripe, Linear — minimalist tech elegance
- If it looks busy, you've gone too far
- Every element must EARN its place

⚠️ COMPLEXITY SCALE:
- 0-30%: Too basic (circle, square, single line)
- 40-50%: IDEAL — clean, distinctive, memorable ✓
- 60-70%: Acceptable only if meaning requires it
- 80%+: TOO COMPLEX — never go here

SIMPLICITY CHECKLIST:
- Can a child draw this from memory? (should be yes)
- Does it read clearly at 32x32px? (must be yes)
- Count the visual elements — if more than 2-3, simplify
- Remove detail until it breaks, then add one thing back

FIDELITY:
- HIGH FIDELITY rendering, but SIMPLE forms
- If emoji referenced, capture its ESSENCE not every detail
- Bold, confident shapes over intricate line work

🎨 RENDERING (BLACK ON WHITE DEFAULT):
- Solid black (#000000) on pure white (#FFFFFF) background
- DEFAULT: Pure black silhouette — no grey, no shading
- Grey ONLY if shape absolutely requires it to read correctly (rare)
- NO COLORS — this is non-negotiable
- Clean vector-quality edges
- Generous negative space

👁️ SPECIAL RULE — EYES/PUPILS:
- If the icon contains an EYE with a pupil/highlight:
- The white catchlight/highlight MUST be a SOLID WHITE FILL
- NOT negative space, NOT transparent — actual white fill
- This ensures proper rendering at the socials stage

SPECS:
- Square 1:1, 1024x1024 pixels
- Icon fills 60-70% of canvas, centered (substantial but not cramped)
- ~15% padding on each side — breathing room without floating

FORBIDDEN:
- NO COLORS — only black, white, grey (this is critical)
- NO borders, frames, or outlines around the icon
- NO box or container
- NO intricate patterns or textures
- NO circuit boards, complex machinery details
- NO combining 5+ symbols into one icon
- NO detailed line work that disappears at small sizes
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
