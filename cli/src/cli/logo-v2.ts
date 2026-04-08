#!/usr/bin/env npx tsx
/**
 * OpenGFX Logo CLI — Creative Director Mode
 * 
 * Usage:
 *   npm run logo -- "AI fitness coaching app"
 *   npm run logo -- "Modern fintech" --name "Acme"
 *   npm run logo -- "Wellness brand" --name "Bloom" --tagline "Grow with us"
 */

import { generateLogo } from "../services/logo-creative-director.js";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === "--help") {
    console.log(`
OpenGFX Logo Generator — Creative Director Mode

Usage:
  npm run logo -- "<concept>"
  npm run logo -- "<concept>" --name "<brand name>"
  npm run logo -- "<concept>" --name "<brand>" --tagline "<tagline>"

Options:
  --name      Brand name (optional - AI will generate if not provided)
  --tagline   Brand tagline (optional)
  --color     Primary color override (hex)
  --style     Render style override (flat-solid, gradient, glass, etc.)

Examples:
  npm run logo -- "AI fitness coaching for busy professionals"
  npm run logo -- "Modern fintech startup" --name "Acme"
  npm run logo -- "Organic wellness" --name "Bloom" --tagline "Grow naturally"
`);
    process.exit(0);
  }
  
  // Parse args
  let concept = "";
  let brandName: string | undefined;
  let tagline: string | undefined;
  let primaryColor: string | undefined;
  let renderStyle: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--name" && args[i + 1]) {
      brandName = args[++i];
    } else if (arg === "--tagline" && args[i + 1]) {
      tagline = args[++i];
    } else if (arg === "--color" && args[i + 1]) {
      primaryColor = args[++i];
    } else if (arg === "--style" && args[i + 1]) {
      renderStyle = args[++i];
    } else if (!arg.startsWith("--")) {
      concept = arg;
    }
  }
  
  if (!concept) {
    console.error("Error: Concept is required");
    process.exit(1);
  }
  
  const result = await generateLogo({
    concept,
    brandName,
    tagline,
    primaryColor,
    renderStyle,
  });
  
  console.log(`\n✓ Logo generated!`);
  console.log(`  Brand: ${result.brief.brandName}`);
  console.log(`  QC: ${result.qcReport.passed ? "PASSED" : "WARNINGS"}`);
  console.log(`\n  Paths:`);
  for (const [key, path] of Object.entries(result.paths)) {
    console.log(`    ${key}: ${path}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
