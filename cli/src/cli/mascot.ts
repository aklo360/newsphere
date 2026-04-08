#!/usr/bin/env tsx
/**
 * OpenGFX Mascot CLI — Unified
 * 
 * ONE COMMAND, TWO MODES:
 * 
 * Mode 1 - Generate from prompt:
 *   npm run mascot -- --name "Disclaw" --prompt "Discord-style crab in blurple"
 * 
 * Mode 2 - Expression sheet from locked master:
 *   npm run mascot -- --name "Disclaw" --master-url "https://..." --leg-count 4
 */

import { generateMascot, generateMascotFromBrandSystem, type MascotInput } from "../services/mascot.js";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
OpenGFX Mascot Generator (Unified)

USAGE:
  npm run mascot -- --name <brand> --prompt "<description>"
  npm run mascot -- --name <brand> --master-url <url> --leg-count <n>
  npm run mascot -- --brand-system <path> --prompt "<description>"

MODE 1: Generate from prompt (one-shot)
  --name <brand>          Brand name (required)
  --prompt <text>         Natural language description (required for mode 1)
                          Example: "Discord-style crab mascot in blurple"

MODE 2: Expression sheet from locked master
  --name <brand>          Brand name (required)
  --master-url <url>      URL to locked master image
  --master-path <path>    Local path to master (alternative to url)
  --leg-count <n>         REQUIRED - exact number of legs

OPTIONAL FLAGS (both modes):
  --creature <type>       Override creature type (crab, owl, robot, etc.)
  --color <hex>           Primary color (e.g., "#5865F2")
  --outline <color>       Outline color (default: black)
  --claw-count <n>        Number of claws/arms (default: 2)
  --has-antenna           Character has antenna
  --output <dir>          Output directory
  --no-upload             Skip CDN upload

BRAND SYSTEM MODE:
  --brand-system <path>   Path to brand-system.json
  --prompt <text>         Description of mascot

EXAMPLES:
  # Generate Discord-style crab from scratch
  npm run mascot -- --name "Disclaw" \\
    --prompt "Friendly crab mascot for Discord agents, blurple color" \\
    --leg-count 4 --creature crab

  # Expression sheet from approved master
  npm run mascot -- --name "Disclaw" \\
    --master-url "https://cdn.example.com/master.png" \\
    --leg-count 4 --claw-count 2

  # From brand-system.json
  npm run mascot -- --brand-system ./output/disclaw/brand-system.json \\
    --prompt "Cute crab mascot with 4 tiny legs"
`);
    process.exit(0);
  }

  // Parse arguments
  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };
  
  const hasFlag = (flag: string): boolean => args.includes(flag);

  // Build input config
  const input: MascotInput = {
    brandName: getArg("--name") || "",
    prompt: getArg("--prompt"),
    masterUrl: getArg("--master-url"),
    masterPath: getArg("--master-path"),
    creature: getArg("--creature"),
    primaryColor: getArg("--color"),
    outlineColor: getArg("--outline"),
    clawCount: getArg("--claw-count") ? parseInt(getArg("--claw-count")!, 10) : undefined,
    legCount: getArg("--leg-count") ? parseInt(getArg("--leg-count")!, 10) : undefined,
    hasAntenna: hasFlag("--has-antenna"),
    outputDir: getArg("--output"),
    uploadToCdn: !hasFlag("--no-upload"),
  };

  const brandSystemPath = getArg("--brand-system");

  // Validate
  if (brandSystemPath) {
    // Brand system mode
    if (!input.prompt) {
      console.error("Error: --prompt is required with --brand-system");
      process.exit(1);
    }
    
    try {
      const result = await generateMascotFromBrandSystem(brandSystemPath, input.prompt, input);
      printResult(result);
    } catch (err) {
      console.error(`\n✗ Error:`, err instanceof Error ? err.message : err);
      process.exit(1);
    }
  } else {
    // Direct mode
    if (!input.brandName) {
      console.error("Error: --name is required");
      process.exit(1);
    }
    
    if (!input.prompt && !input.masterUrl && !input.masterPath) {
      console.error("Error: Either --prompt (mode 1) or --master-url/--master-path (mode 2) is required");
      process.exit(1);
    }
    
    if ((input.masterUrl || input.masterPath) && !input.legCount) {
      console.error("Error: --leg-count is REQUIRED when using locked master (mode 2)");
      console.error("       (We need exact anatomy to verify generated expressions)");
      process.exit(1);
    }
    
    try {
      const result = await generateMascot(input);
      printResult(result);
    } catch (err) {
      console.error(`\n✗ Error:`, err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }
}

function printResult(result: any) {
  console.log(`\n✓ Mascot generated!`);
  console.log(`  QC: ${result.qcReport.passed ? "ALL PASSED" : "SOME WARNINGS"}`);
  
  if (result.urls?.master) {
    console.log(`\n  CDN URLs:`);
    for (const [pose, url] of Object.entries(result.urls)) {
      if (url) console.log(`    ${pose}: ${url}`);
    }
  }
  
  console.log(`\n  Local paths:`);
  for (const [pose, path] of Object.entries(result.localPaths)) {
    console.log(`    ${pose}: ${path}`);
  }
}

main();
