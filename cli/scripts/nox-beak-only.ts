/**
 * Generate Nox owl with BEAK ONLY - NO MOUTH LINE
 */

import { Modality } from "@google/genai";
import * as fs from "fs";
import sharp from "sharp";
import { ai, IMAGE_MODEL } from "../src/ai.js";

const OUTPUT_DIR = "./output/nox/mascot/beak-only";

async function generatePose(name: string, expressionPrompt: string, masterBase64?: string) {
  const prompt = `${masterBase64 ? 'Create a variation of this owl mascot with the following expression:' : 'Create a cute kawaii OWL mascot.'}

╔══════════════════════════════════════════════════════════════════════════════╗
║  CRITICAL ANATOMY RULE - READ THIS 3 TIMES BEFORE GENERATING                ║
║  CRITICAL ANATOMY RULE - READ THIS 3 TIMES BEFORE GENERATING                ║
║  CRITICAL ANATOMY RULE - READ THIS 3 TIMES BEFORE GENERATING                ║
╚══════════════════════════════════════════════════════════════════════════════╝

BIRDS HAVE BEAKS. BIRDS DO NOT HAVE MOUTHS.
BIRDS HAVE BEAKS. BIRDS DO NOT HAVE MOUTHS.
BIRDS HAVE BEAKS. BIRDS DO NOT HAVE MOUTHS.

❌ FORBIDDEN - DO NOT DRAW:
- A curved smile line under the beak
- Any mouth shape below or separate from the beak
- A smile/frown line on the face area
- ANY line that could be interpreted as a mouth

✅ REQUIRED - BEAK IS THE ONLY MOUTH:
- Small triangular/diamond shaped BEAK in center of face
- Expression comes from beak SHAPE and ANGLE only
- Beak can be: open, closed, tilted up (happy), tilted down (sad)
- NO OTHER MOUTH ELEMENT EXISTS

DESIGN SPECS:
- Purple (#8B5CF6) owl body
- Cream/beige belly area  
- Pointed ear tufts on top
- Large round kawaii eyes with purple pupils
- Small wings on sides
- Two tiny feet
- 2D flat illustration, black outlines, white glossy highlights

${expressionPrompt}

FINAL CHECK BEFORE OUTPUT:
☐ Is there a smile line under the beak? If YES → DELETE IT
☐ Is there any mouth shape besides the beak? If YES → DELETE IT
☐ Does expression come ONLY from beak shape? If NO → FIX IT`;

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
  
  // Generate expressions
  await generatePose("wave", "EXPRESSION: Friendly wave. One wing raised. Beak slightly open.", masterBase64);
  await generatePose("happy", "EXPRESSION: Very happy. Eyes closed (^_^), beak wide open in joy, pink blush.", masterBase64);
  await generatePose("sad", "EXPRESSION: Sad. Droopy eyes, beak pointing down, single tear.", masterBase64);
  await generatePose("angry", "EXPRESSION: Angry. V-shaped eyebrows, beak tightly closed pointing down.", masterBase64);
  await generatePose("laugh", "EXPRESSION: Laughing hard. Eyes squeezed shut, beak wide open, tears of joy.", masterBase64);

  console.log(`\n✓ All poses saved to ${OUTPUT_DIR}`);
}

main().catch(console.error);
