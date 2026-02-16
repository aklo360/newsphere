#!/usr/bin/env npx tsx
/**
 * OpenGFX CLI — On-Brand GFX Service
 */

import { generateGfx, listFormats } from "../services/gfx.js";

function printUsage(): void {
  console.log(`
${"═".repeat(65)}
  OpenGFX GFX — On-Brand Marketing Graphics Generator
${"═".repeat(65)}

Usage: npx tsx src/cli/gfx.ts <brand-system.json> <prompt> <copy> [options]

Arguments:
  brand-system.json    Path to brand system manifest
  prompt               Description of the graphic you want
  copy                 Exact text to include in the graphic

Options:
  --platform   Preset platform/format (see list below)
  --width      Custom width in pixels
  --height     Custom height in pixels
  --format     Output format: png, jpg, webp (default: png)
  --list       Show all available format presets

Examples:

  # Announcement graphic:
  npx tsx src/cli/gfx.ts ./output/lumina/brand-system.json \\
    "announcement graphic for product launch" \\
    "NOW LIVE\\n\\nDiscover the new Lumina Collection"

  # Feature card for Instagram:
  npx tsx src/cli/gfx.ts ./output/lumina/brand-system.json \\
    "feature highlight card" \\
    "AI-Powered Skincare\\n\\nPersonalized routines for your skin" \\
    --platform instagram-square

  # Twitter post:
  npx tsx src/cli/gfx.ts ./output/lumina/brand-system.json \\
    "promotional social post" \\
    "Summer Sale - 30% Off\\n\\nUse code SUMMER30" \\
    --platform twitter-post

  # Custom dimensions:
  npx tsx src/cli/gfx.ts ./output/lumina/brand-system.json \\
    "hero banner for website" \\
    "Welcome to Lumina" \\
    --width 1920 --height 600

Available Formats:
`);
  
  listFormats();
}

// Parse CLI arguments
const args = process.argv.slice(2);
const flags: Record<string, string | boolean> = {};
const positional: string[] = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--list") {
    listFormats();
    process.exit(0);
  } else if (args[i].startsWith("--")) {
    const key = args[i].slice(2);
    flags[key] = args[i + 1] || "";
    i++;
  } else {
    positional.push(args[i]);
  }
}

const [brandSystemPath, prompt, copy] = positional;

if (!brandSystemPath || !prompt || !copy) {
  printUsage();
  process.exit(1);
}

generateGfx(brandSystemPath, prompt, copy, {
  platform: flags.platform as string || undefined,
  width: flags.width ? parseInt(flags.width as string, 10) : undefined,
  height: flags.height ? parseInt(flags.height as string, 10) : undefined,
  format: (flags.format as "png" | "jpg" | "webp") || "png",
}).catch(err => {
  console.error(`✗ ${err instanceof Error ? err.message : "Unknown error"}`);
  process.exit(1);
});
