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

Usage: npx tsx src/cli/gfx.ts [options]

Options:
  --brand-system   Path or URL to brand-system.json (required)
  --prompt         Description of the graphic you want (required)
  --copy           Exact text to include (optional - AI generates if not provided)
  --aspect-ratio   Output aspect ratio: 1:1, 4:5, 16:9, etc. (default: 1:1)
  --platform       Preset platform/format (overrides aspect-ratio)
  --width          Custom width in pixels
  --height         Custom height in pixels
  --format         Output format: png, jpg, webp (default: png)
  --job-id         Job ID for output filename
  --list           Show all available format presets

Examples:

  # Simple prompt (AI generates text):
  npx tsx src/cli/gfx.ts \\
    --brand-system ./output/lumina/brand-system.json \\
    --prompt "Announcement graphic for product launch, celebratory vibe"

  # With exact copy:
  npx tsx src/cli/gfx.ts \\
    --brand-system ./output/lumina/brand-system.json \\
    --prompt "announcement graphic for product launch" \\
    --copy "NOW LIVE\\n\\nDiscover the new Lumina Collection"

  # Specific aspect ratio:
  npx tsx src/cli/gfx.ts \\
    --brand-system ./output/lumina/brand-system.json \\
    --prompt "Instagram story for summer sale" \\
    --aspect-ratio 9:16

  # Platform preset:
  npx tsx src/cli/gfx.ts \\
    --brand-system ./output/lumina/brand-system.json \\
    --prompt "Twitter post graphic" \\
    --platform twitter-post

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
  } else if (args[i] === "--help" || args[i] === "-h") {
    printUsage();
    process.exit(0);
  } else if (args[i].startsWith("--")) {
    const key = args[i].slice(2);
    // Check if next arg exists and doesn't start with --
    if (args[i + 1] && !args[i + 1].startsWith("--")) {
      flags[key] = args[i + 1];
      i++;
    } else {
      flags[key] = true;
    }
  } else {
    positional.push(args[i]);
  }
}

// Support both new flag-based and legacy positional argument styles
const brandSystemPath = (flags["brand-system"] as string) || positional[0];
const prompt = (flags["prompt"] as string) || positional[1];
const copy = (flags["copy"] as string) || positional[2];

if (!brandSystemPath || !prompt) {
  console.error("Error: --brand-system and --prompt are required\n");
  printUsage();
  process.exit(1);
}

generateGfx(brandSystemPath, prompt, copy || undefined, {
  platform: flags.platform as string || undefined,
  width: flags.width ? parseInt(flags.width as string, 10) : undefined,
  height: flags.height ? parseInt(flags.height as string, 10) : undefined,
  format: (flags.format as "png" | "jpg" | "webp") || "png",
  aspectRatio: flags["aspect-ratio"] as string || "1:1",
  jobId: flags["job-id"] as string || undefined,
}).catch(err => {
  console.error(`✗ ${err instanceof Error ? err.message : "Unknown error"}`);
  process.exit(1);
});
