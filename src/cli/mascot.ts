#!/usr/bin/env tsx
/**
 * OpenGFX Mascot CLI
 * Usage: npm run mascot -- ./path/to/brand-system.json [options]
 */

import { generateMascot, generateMascotFromLogo } from "../services/mascot.js";
import type { CharacterType, CharacterStyle } from "../types.js";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
OpenGFX Mascot Generator

Usage:
  npm run mascot -- <brand-system.json> [options]
  npm run mascot -- --logo <url> --name <brand> --primary <color> [options]

Options:
  --type <type>        Character type: mascot, avatar, creature, robot, animal, abstract
  --style <style>      Visual style: 2d-flat, 2d-illustrated, 3d-rendered, pixel, anime, clay, gradient, glassmorphic
  --personality <str>  Personality traits (e.g., "friendly, playful, techy")
  --features <str>     Specific features (e.g., "wears glasses, has wings")
  --poses <n>          Number of pose variants (1-6, default 3)
  --output <dir>       Output directory

BYOL Mode (Bring Your Own Logo):
  --logo <url>         Logo image URL
  --name <brand>       Brand name
  --primary <color>    Primary brand color (hex)
  --secondary <color>  Secondary color (optional)

Examples:
  npm run mascot -- ./output/acme/brand-system.json
  npm run mascot -- ./output/acme/brand-system.json --type robot --style 3d-rendered
  npm run mascot -- --logo https://example.com/logo.png --name "Acme" --primary "#FF5722" --type creature
`);
    process.exit(0);
  }

  // Parse arguments
  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const characterType = (getArg("--type") || "mascot") as CharacterType;
  const style = (getArg("--style") || "2d-flat") as CharacterStyle;
  const personality = getArg("--personality") || "friendly, approachable, modern";
  const features = getArg("--features") || "";
  const poses = parseInt(getArg("--poses") || "3", 10);
  const outputDir = getArg("--output");

  // BYOL mode
  const logoUrl = getArg("--logo");
  const brandName = getArg("--name");
  const primaryColor = getArg("--primary");
  const secondaryColor = getArg("--secondary");

  try {
    if (logoUrl && brandName && primaryColor) {
      // BYOL mode
      console.log(`[mascot] BYOL mode: ${brandName}`);
      const result = await generateMascotFromLogo(
        logoUrl,
        brandName,
        { primary: primaryColor, secondary: secondaryColor },
        { characterType, style, personality, features, poses, outputDir }
      );
      console.log(`\n✓ Mascot generated!`);
      console.log(`  Master: ${result.masterPath}`);
      console.log(`  Icon: ${result.iconPath}`);
      console.log(`  Poses: ${result.poses.length}`);
      console.log(`  Spec: ${result.specPath}`);
    } else {
      // Brand system mode
      const brandSystemPath = args.find(a => !a.startsWith("--"));
      if (!brandSystemPath) {
        console.error("Error: No brand-system.json path provided");
        process.exit(1);
      }

      const result = await generateMascot(brandSystemPath, {
        characterType,
        style,
        personality,
        features,
        poses,
        outputDir,
      });

      console.log(`\n✓ Mascot generated!`);
      console.log(`  Master: ${result.masterPath}`);
      console.log(`  Icon: ${result.iconPath}`);
      console.log(`  Poses: ${result.poses.length}`);
      console.log(`  Spec: ${result.specPath}`);
    }
  } catch (err) {
    console.error(`\n✗ Error:`, err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
