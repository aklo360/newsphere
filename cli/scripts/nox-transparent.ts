/**
 * Generate Nox owl with TRANSPARENT BACKGROUND + BEAK ONLY
 */

import { Modality } from "@google/genai";
import * as fs from "fs";
import sharp from "sharp";
import { ai, IMAGE_MODEL } from "../src/ai.js";

const OUTPUT_DIR = "./output/nox/mascot/transparent";

async function generatePose(name: string, expressionPrompt: string, masterBase64?: string) {
  const prompt = `${masterBase64 ? 'Create a variation of this owl mascot with the following expression:' : 'Create a cute kawaii OWL mascot.'}

╔══════════════════════════════════════════════════════════════════════════════╗
║  TRANSPARENT BACKGROUND - CRITICAL                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

OUTPUT: PNG with FULLY TRANSPARENT BACKGROUND
- NO white background
- NO colored background  
- NO background at all
- ONLY the owl character with alpha transparency around it
- The owl should float on a transparent/checkered background

╔══════════════════════════════════════════════════════════════════════════════╗
║  BIRD ANATOMY - BEAK NOT MOUTH                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

BIRDS HAVE BEAKS. NOT MOUTHS.
- Small triangular BEAK in center of face
- Expression from beak SHAPE only
- NO smile line under/separate from beak

DESIGN SPECS:
- Purple (#8B5CF6) owl body
- Cream/beige belly area  
- Pointed ear tufts on top
- Large round kawaii eyes with purple pupils and WHITE GLOSSY HIGHLIGHTS
- Small wings on sides
- Two tiny feet
- 2D flat illustration, black outlines
- WHITE GLOSSY SHINE MARKS on head and body (1-2 highlights)
- TRANSPARENT BACKGROUND (alpha channel, no background color)

${expressionPrompt}`;

  const parts: any[] = [];
  if (masterBase64) {
    parts.push({ inlineData: { mimeType: "image/png", data: masterBase64 } });
  }
  parts.push({ text: prompt });

  console.log(`Generating ${name}...`);

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts }],
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  const responseParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of responseParts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const outputPath = `${OUTPUT_DIR}/${name}.png`;
      await sharp(buffer).png().toFile(outputPath);
      console.log(`✓ ${name}.png`);
      return buffer.toString("base64");
    }
  }
  throw new Error(`Failed to generate ${name}`);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Generate master
  const masterBase64 = await generatePose("master", "EXPRESSION: Neutral, friendly. Beak closed, slightly upturned.");
  
  // Generate expressions from master
  await generatePose("wave", "EXPRESSION: Friendly wave. One wing raised waving. Beak slightly open.", masterBase64);
  await generatePose("happy", "EXPRESSION: Very happy. Eyes closed (^_^), beak open in joy, pink blush.", masterBase64);
  await generatePose("sad", "EXPRESSION: Sad. Droopy eyes, beak pointing down, single tear.", masterBase64);
  await generatePose("angry", "EXPRESSION: Angry. V-shaped eyebrows, beak closed pointing down.", masterBase64);
  await generatePose("laugh", "EXPRESSION: Laughing. Eyes squeezed, beak wide open, tears of joy.", masterBase64);

  console.log(`\n✓ All saved to ${OUTPUT_DIR}`);
}

main().catch(console.error);
