#!/usr/bin/env npx tsx
/**
 * OpenGFX CLI — Socials Service
 */

import { generateSocials } from "../services/socials.js";
import { SOCIAL_PLATFORMS } from "../constants.js";

function printUsage(): void {
  console.log(`
${"═".repeat(65)}
  OpenGFX Socials — Platform-Specific Avatars & Banners
${"═".repeat(65)}

Usage: npx tsx src/cli/socials.ts <brand-system.json> [options]

Arguments:
  brand-system.json    Path to brand system manifest (from Brand Foundation)

Options:
  --platforms    Comma-separated list of platforms (default: all)
  --no-tagline   Exclude tagline from banners
  --tagline      Override tagline text

Examples:

  # Generate for all platforms:
  npx tsx src/cli/socials.ts ./output/lumina/brand-system.json

  # Specific platforms only:
  npx tsx src/cli/socials.ts ./output/lumina/brand-system.json --platforms twitter,instagram,discord

  # Custom tagline:
  npx tsx src/cli/socials.ts ./output/lumina/brand-system.json --tagline "Illuminate Your Skin"

Supported Platforms:
`);
  
  Object.entries(SOCIAL_PLATFORMS).forEach(([name, config]) => {
    const hasBanner = config.banner ? `✓ banner (${config.banner.width}x${config.banner.height})` : "no banner";
    console.log(`  ${name.padEnd(12)} profile (${config.profile.width}x${config.profile.height}), ${hasBanner}`);
  });
  
  console.log("");
}

// Parse CLI arguments
const args = process.argv.slice(2);
const flags: Record<string, string | boolean> = {};
let brandSystemPath: string | null = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--no-tagline") {
    flags.noTagline = true;
  } else if (args[i].startsWith("--")) {
    const key = args[i].slice(2);
    flags[key] = args[i + 1] || "";
    i++;
  } else if (!brandSystemPath) {
    brandSystemPath = args[i];
  }
}

if (!brandSystemPath) {
  printUsage();
  process.exit(1);
}

// Parse platforms (MVP default: twitter only)
const platforms = flags.platforms 
  ? (flags.platforms as string).split(",").map(p => p.trim())
  : ["twitter"];

generateSocials(brandSystemPath, {
  platforms,
  includeTagline: !flags.noTagline,
  taglineOverride: typeof flags.tagline === "string" ? flags.tagline : undefined,
}).catch(err => {
  console.error(`✗ ${err instanceof Error ? err.message : "Unknown error"}`);
  process.exit(1);
});
