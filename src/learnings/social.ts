/**
 * SOCIAL LEARNINGS - Rules for social asset generation
 * 
 * Edit here → affects all future social asset generation.
 */

import { IMAGE_FORMATS } from "./core.js";

// ============================================================================
// SOCIAL ASSET SIZES
// ============================================================================

export const SOCIAL_SIZES = {
  // Avatars
  avatarMaster: { w: 1024, h: 1024, name: "avatar-master.png" },
  avatarAcp: { w: 400, h: 400, format: "jpg", quality: 85, maxKb: 50, name: "avatar-acp.jpg" },
  
  // Banners
  twitterBanner: { w: 3000, h: 1000, ratio: "3:1", name: "twitter-banner.png" },
  communityBanner: { w: 1200, h: 480, ratio: "2.5:1", name: "community-banner.png" },
  ogCard: { w: 1200, h: 628, ratio: "1.91:1", name: "og-card.png" },
  
  // Future
  linkedinBanner: { w: 1584, h: 396, ratio: "4:1", name: "linkedin-banner.png" },
  youtubeBanner: { w: 2560, h: 1440, ratio: "16:9", name: "youtube-banner.png" },
};

// ============================================================================
// AVATAR RULES
// ============================================================================

export const AVATAR_RULES = {
  // Master avatar is source of truth
  masterIsSource: true,
  masterSize: 1024,
  
  // ACP avatar derived from master
  acpDerivedFromMaster: true,
  acpMethod: "sharp.resize()", // Not separate AI call
  
  // Frame fill
  frameFill: 0.80, // Logo/icon fills 80% of avatar
};

export const AVATAR_PROMPT_BLOCK = `
AVATAR COMPOSITION:
- SQUARE 1:1 (1024x1024)
- Icon/logo centered, filling 80% of frame
- Background matches brand color
- Clean, recognizable at small sizes
`;

// ============================================================================
// BANNER RULES
// ============================================================================

export const BANNER_RULES = {
  // Master banner (Twitter 3:1)
  masterBanner: "twitter-banner.png",
  
  // Other banners ADAPT from master
  adaptationMethod: "Gemini image-to-image EXTEND (not crop)",
  
  // Composition
  composition: {
    iconPosition: "left third",
    textPosition: "right of icon",
    taglinePosition: "under wordmark, left-aligned",
  },
  
  // Safe zones
  safeZones: {
    twitter: "Avoid bottom 10% (profile overlap)",
    og: "Center important content (platforms crop edges)",
  },
};

export const BANNER_ANTI_PATTERNS = [
  "Never crop master to get smaller banners → use EXTEND to add space",
  "Never center tagline under full lockup → left-align with wordmark",
  "Never put critical content at edges → platforms crop differently",
];

// ============================================================================
// BANNER ADAPTATION SYSTEM
// ============================================================================

export const BANNER_ADAPTATION = {
  // Generate master (Twitter 3:1) first
  // Then use Gemini to EXTEND for other ratios
  
  flow: [
    "1. Generate master (3000x1000, 3:1)",
    "2. For OG card: Gemini extends vertically to 1.91:1",
    "3. For community: Gemini extends vertically to 2.5:1",
    "4. Preserves icon, wordmark, composition",
  ],
  
  // Extension prompt template
  extensionPrompt: (targetRatio: string) => `
Extend this banner image to ${targetRatio} aspect ratio.
Keep the existing icon, wordmark, and composition.
Extend the background naturally to fill new space.
Maintain the same style and color palette.
`,
};

// ============================================================================
// CONTRAST RULES
// ============================================================================

export const CONTRAST_RULES = {
  // Dark backgrounds
  darkBg: {
    iconColor: "BRIGHT (white/cyan/neon)",
    wordmarkColor: "light with render style",
    taglineColor: "white/light gray",
  },
  
  // Light backgrounds  
  lightBg: {
    iconColor: "dark or colored",
    wordmarkColor: "dark with render style",
    taglineColor: "black/dark gray",
  },
  
  // Matching rule
  avatarMatchesBanner: true,
};

// ============================================================================
// PLATFORM-SPECIFIC RULES
// ============================================================================

export const PLATFORM_RULES = {
  twitter: {
    bannerSize: { w: 3000, h: 1000 },
    avatarOverlap: "bottom-left of banner",
    safeZone: "avoid bottom 10%",
  },
  
  discord: {
    preferCleanFlat: true,
    iconSimple: true,
  },
  
  telegram: {
    circularAvatar: true,
    keepCenteredContent: true,
  },
  
  og: {
    centerCriticalContent: true,
    platformsCropEdges: true,
  },
};
