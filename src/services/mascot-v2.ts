/**
 * Mascot Service v2 - Self-Improving Pipeline
 * 
 * This service READS from src/learnings/mascot.ts at runtime.
 * To improve output quality: edit the learnings file, not this service.
 * 
 * SELF-IMPROVEMENT LOOP:
 * 1. Generate mascot
 * 2. Notice issue or success
 * 3. Update src/learnings/mascot.ts
 * 4. Next generation automatically improves
 */

import { Modality } from "@google/genai";
import * as fs from "fs";
import sharp from "sharp";
import { ai, IMAGE_MODEL } from "../ai.js";

// RUNTIME IMPORT: This is the key to self-improvement
// Changes to this file automatically affect all future generations
import {
  GENERATION_RULES,
  POST_PROCESSING,
  buildMascotPrompt,
  ALL_EXPRESSIONS,
  type ExpressionName,
} from "../learnings/mascot.js";

export interface MascotConfig {
  name: string;
  character: string;
  bodyColor: string;
  details: string;
  bgHex: string;
  bgName: string;
  creatureType?: "bird" | "crab";
  outputDir: string;
  poses?: ExpressionName[];
}

export async function generateMascotSet(config: MascotConfig): Promise<string[]> {
  const {
    name,
    character,
    bodyColor,
    details,
    bgHex,
    bgName,
    creatureType,
    outputDir,
    poses = ALL_EXPRESSIONS,
  } = config;

  fs.mkdirSync(outputDir, { recursive: true });
  
  const outputPaths: string[] = [];
  let masterBase64: string | undefined;

  console.log(`\nGenerating ${name} mascot set (${poses.length} poses)...`);
  console.log(`Rules: frameFill=${GENERATION_RULES.frameFill}, size=${GENERATION_RULES.outputSize}`);

  for (const pose of poses) {
    const isVariation = pose !== "master";
    
    // BUILD PROMPT FROM LEARNINGS
    const prompt = buildMascotPrompt({
      character,
      bgHex,
      bgName,
      bodyColor,
      details,
      expression: pose,
      creatureType,
      isVariation,
    });

    // Prepare request
    const parts: any[] = [];
    if (isVariation && masterBase64) {
      parts.push({ inlineData: { mimeType: "image/png", data: masterBase64 } });
    }
    parts.push({ text: prompt });

    console.log(`  Generating ${pose}...`);

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: "user", parts }],
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });

    const responseParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of responseParts) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        const outputPath = `${outputDir}/${pose}.png`;
        
        // POST-PROCESSING: Only resize, never color manipulate
        // (per POST_PROCESSING.allowedOperations)
        await sharp(buffer)
          .resize(GENERATION_RULES.outputSize, GENERATION_RULES.outputSize, {
            fit: POST_PROCESSING.resizeFit,
          })
          .png()
          .toFile(outputPath);
        
        console.log(`  ✓ ${pose}.png`);
        outputPaths.push(outputPath);
        
        // Store master for variations
        if (pose === "master") {
          masterBase64 = buffer.toString("base64");
        }
        break;
      }
    }
  }

  console.log(`\n✓ All ${outputPaths.length} poses saved to ${outputDir}`);
  return outputPaths;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
Usage: npm run mascot -- <name> [options]

Options:
  --character "description"   Character description
  --body-color "#HEX"         Body color
  --details "text"            Additional design details
  --bg-hex "#HEX"             Background color
  --bg-name "name"            Background color name
  --creature bird|crab        Creature type (for special rules)
  --output-dir "./path"       Output directory

Example:
  npm run mascot -- nox --character "owl" --body-color "#8B5CF6" --bg-hex "#C8B4DC" --creature bird
`);
    process.exit(1);
  }

  const name = args[0];
  
  // Parse CLI args
  const getArg = (flag: string, defaultVal: string) => {
    const idx = args.indexOf(flag);
    return idx > -1 ? args[idx + 1] : defaultVal;
  };

  const config: MascotConfig = {
    name,
    character: getArg("--character", "mascot"),
    bodyColor: getArg("--body-color", "#8B5CF6"),
    details: getArg("--details", "Cream/beige belly, pointed ear tufts, large kawaii eyes"),
    bgHex: getArg("--bg-hex", "#C8B4DC"),
    bgName: getArg("--bg-name", "lavender"),
    creatureType: getArg("--creature", "") as "bird" | "crab" | undefined,
    outputDir: getArg("--output-dir", `./output/${name}/mascot`),
  };

  if (!config.creatureType) {
    delete config.creatureType;
  }

  await generateMascotSet(config);
}

// Run if called directly
const isMain = process.argv[1]?.includes("mascot-v2");
if (isMain) {
  main().catch(console.error);
}
