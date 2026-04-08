#!/usr/bin/env npx tsx
/**
 * OpenGFX CLI — Brand Foundation Service
 */

import { generateBrandFoundation } from "../services/brand-foundation.js";
import { generateBrandName } from "../ai.js";
import { FONT_LIBRARY, INSTALLED_FONTS } from "../constants.js";

function printUsage(): void {
  console.log(`
${"═".repeat(65)}
  OpenGFX Brand Foundation — Logo + Style Guide Generator
${"═".repeat(65)}

Usage: npx tsx src/cli/brand.ts [brandName] <concept> [options]

Arguments:
  brandName    Brand name (OPTIONAL - AI will generate if not provided)
  concept      Brand concept, vibe, and any style preferences

Options:
  --tagline    Optional tagline for banners
  --font       Override font selection
  --weight     Override font weight (100-900)
  --style      Override render style preset

Examples:

  # AI names AND designs the brand:
  npx tsx src/cli/brand.ts "AI-powered fitness coaching app for busy professionals"

  # Provide name, let AI design:
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

// Determine if we have a brand name or just a concept
// Heuristic: if only 1 positional arg OR first arg is > 30 chars, treat as concept-only
let brandName: string | null = null;
let concept: string;

if (positional.length === 0) {
  printUsage();
  process.exit(1);
} else if (positional.length === 1 || positional[0].length > 30) {
  // Concept only — AI will generate the name
  concept = positional.join(" ");
  brandName = null;
} else {
  // Traditional: brandName + concept
  brandName = positional[0];
  concept = positional.slice(1).join(" ");
}

if (!concept) {
  printUsage();
  process.exit(1);
}

// Resolve font override
let fontOverride: string | null = null;
if (flags.font) {
  fontOverride = INSTALLED_FONTS[flags.font.toLowerCase()] || flags.font;
}

async function run() {
  // Generate brand name if not provided
  let finalBrandName = brandName;
  if (!finalBrandName) {
    console.log(`\n${"═".repeat(62)}`);
    console.log(`  OpenGFX — AI Brand Naming`);
    console.log(`${"═".repeat(62)}`);
    console.log(`\n[0/5] Generating brand name from concept...`);
    console.log(`      "${concept.slice(0, 60)}${concept.length > 60 ? '...' : ''}"`);
    
    const naming = await generateBrandName(concept);
    finalBrandName = naming.name;
    
    console.log(`      ✓ Generated: ${finalBrandName}`);
    console.log(`      Rationale: ${naming.rationale}`);
    if (naming.alternatives.length > 0) {
      console.log(`      Alternatives: ${naming.alternatives.join(", ")}`);
    }
  }
  
  await generateBrandFoundation(finalBrandName, concept, flags.tagline, {
    fontOverride,
    weightOverride: flags.weight ? parseInt(flags.weight, 10) : null,
    renderStyleOverride: flags.style as any || null,
  });
}

run().catch(err => {
  console.error(`✗ ${err instanceof Error ? err.message : "Unknown error"}`);
  process.exit(1);
});
