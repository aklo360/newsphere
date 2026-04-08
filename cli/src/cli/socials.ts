#!/usr/bin/env npx tsx
/**
 * OpenGFX CLI — Socials Service
 */

import { generateSocials, generateSocialsFromLogo } from "../services/socials.js";
import { SOCIAL_PLATFORMS } from "../constants.js";

function printUsage(): void {
  console.log(`
${"═".repeat(65)}
  OpenGFX Socials — Platform-Specific Avatars & Banners
${"═".repeat(65)}

MODE 1: From Brand System (logo service output)
  npx tsx src/cli/socials.ts <brand-system.json>

MODE 2: BYOL (Bring Your Own Logo)
  npx tsx src/cli/socials.ts --logo <url> --name "Brand Name" [options]

Options:
  --platforms      Comma-separated list of platforms (default: twitter)
  --no-tagline     Exclude tagline from banners
  --tagline        Tagline text

BYOL Options:
  --logo           URL to existing logo image (required for BYOL)
  --name           Brand name (required for BYOL)
  --primary        Primary brand color (hex, e.g. #FF5500)
  --secondary      Secondary color (hex)
  --background     Background color (hex)
  --style          Render style: flat, gradient, glass, chrome, gold, neon, 3d

Examples:

  # From brand system:
  npx tsx src/cli/socials.ts ./output/lumina/brand-system.json

  # BYOL - AI extracts colors:
  npx tsx src/cli/socials.ts --logo https://example.com/logo.png --name "Acme Corp"

  # BYOL - with colors:
  npx tsx src/cli/socials.ts --logo https://example.com/logo.png --name "Acme Corp" \\
    --primary "#FF5500" --secondary "#333333" --style gradient

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

// Determine mode
const isBYOL = flags.logo && flags.name;

if (!brandSystemPath && !isBYOL) {
  printUsage();
  process.exit(1);
}

// Parse platforms (MVP default: twitter only)
const platforms = flags.platforms 
  ? (flags.platforms as string).split(",").map(p => p.trim())
  : ["twitter"];

async function run() {
  if (isBYOL) {
    // BYOL mode
    await generateSocialsFromLogo({
      logoUrl: flags.logo as string,
      brandName: flags.name as string,
      tagline: typeof flags.tagline === "string" ? flags.tagline : undefined,
      primaryColor: typeof flags.primary === "string" ? flags.primary : undefined,
      secondaryColor: typeof flags.secondary === "string" ? flags.secondary : undefined,
      backgroundColor: typeof flags.background === "string" ? flags.background : undefined,
      renderStyle: typeof flags.style === "string" ? flags.style as any : undefined,
    }, {
      platforms,
      includeTagline: !flags.noTagline,
    });
  } else {
    // Brand system mode
    await generateSocials(brandSystemPath!, {
      platforms,
      includeTagline: !flags.noTagline,
      taglineOverride: typeof flags.tagline === "string" ? flags.tagline : undefined,
    });
  }
}

run().catch(err => {
  console.error(`✗ ${err instanceof Error ? err.message : "Unknown error"}`);
  process.exit(1);
});
