/**
 * OpenGFX Services Index
 */

export { generateBrandFoundation } from "./brand-foundation.js";
export { generateSocials, generatePlatformAssets } from "./socials.js";
export { generateGfx, generateAnnouncement, generateFeatureCard, generateQuoteCard, listFormats } from "./gfx.js";
// Mascot service (unified)
export { generateMascot, generateMascotFromBrandSystem } from "./mascot.js";
export type { MascotInput, MascotOutput, ExpressionPose } from "./mascot.js";
