#!/usr/bin/env npx tsx
/**
 * OpenGFX CLI — Brand Foundation Service
 */

import { generateBrandFoundation } from "../services/brand-foundation.js";
import { FONT_LIBRARY, INSTALLED_FONTS } from "../constants.js";

function printUsage(): void {
  console.log(`
${"═".repeat(65)}
  OpenGFX Brand Foundation — Logo + Style Guide Generator
${"═".repeat(65)}

Usage: npx tsx src/cli/brand.ts <brandName> <concept> [options]

Arguments:
  brandName    Brand name (preserve exact capitalization)
  concept      Brand concept, vibe, and any style preferences

Options:
  --tagline    Optional tagline for banners
  --font       Override font selection
  --weight     Override font weight (100-900)
  --style      Override render style preset

Examples:

  # Let AI design everything:
  npx tsx src/cli/brand.ts "Lumina" "luxury skincare, elegant, refined, iridescent feel"

  # With tagline:
  npx tsx src/cli/brand.ts "ByteForge" "developer tools, modern" --tagline "Build faster"

  # Override font:
  npx tsx src/cli/brand.ts "TechCorp" "enterprise SaaS" --font "Inter" --weight 600

  # Request specific style:
  npx tsx src/cli/brand.ts "CryptoVault" "crypto exchange, metallic gold 3D style"

Render Style Presets:
  flat, gradient, glass, gavin, chrome, gold, silver, neon, 3d, holographic

Installed Fonts:
`);
  
  Object.entries(FONT_LIBRARY).forEach(([name, { category, weights }]) => {
    console.log(`  ${name} (${category}) — weights: ${weights.join(", ")}`);
  });
  
  console.log("");
}

// Parse CLI arguments
const args = process.argv.slice(2);
const flags: Record<string, string> = {};
const positional: string[] = [];

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const key = args[i].slice(2);
    flags[key] = args[i + 1] || "";
    i++;
  } else {
    positional.push(args[i]);
  }
}

const [brandName, ...conceptParts] = positional;
const concept = conceptParts.join(" ");

if (!brandName || !concept) {
  printUsage();
  process.exit(1);
}

// Resolve font override
let fontOverride: string | null = null;
if (flags.font) {
  fontOverride = INSTALLED_FONTS[flags.font.toLowerCase()] || flags.font;
}

generateBrandFoundation(brandName, concept, flags.tagline, {
  fontOverride,
  weightOverride: flags.weight ? parseInt(flags.weight, 10) : null,
  renderStyleOverride: flags.style as any || null,
}).catch(err => {
  console.error(`✗ ${err instanceof Error ? err.message : "Unknown error"}`);
  process.exit(1);
});
