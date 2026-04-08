/**
 * OpenGFX — Agentic Brand Design System
 * 
 * Services:
 * 1. Brand Foundation — Logo + Style Guide
 * 2. Socials — Platform-specific avatars & banners
 * 3. GFX — On-brand marketing graphics
 */

// Types
export * from "./types.js";

// Constants
export { FONT_LIBRARY, INSTALLED_FONTS, SOCIAL_PLATFORMS, RENDER_STYLE_PROMPTS } from "./constants.js";

// Services
export { 
  generateBrandFoundation,
  generateSocials,
  generatePlatformAssets,
  generateGfx,
  generateAnnouncement,
  generateFeatureCard,
  generateQuoteCard,
  listFormats,
} from "./services/index.js";

// AI utilities
export { ai, IMAGE_MODEL, TEXT_MODEL, analyzeBrandIntent, analyzeStyleGuide } from "./ai.js";
