/**
 * Generate Nox owl SQUARE from Gemini directly (no post-processing resize)
 */

import { Modality } from "@google/genai";
import * as fs from "fs";
import sharp from "sharp";
import { ai, IMAGE_MODEL } from "../src/ai.js";

const OUTPUT_DIR = "./output/nox/mascot/FINAL-SQUARE";

async function generatePose(name: string, expressionPrompt: string, masterBase64?: string) {
  const prompt = `${masterBase64 ? 'Create a variation of this owl mascot with the following expression:' : 'Create a cute kawaii OWL mascot.'}

IMAGE FORMAT:
- SQUARE 1:1 aspect ratio (1024x1024)
- Solid flat #C8B4DC lavender background filling the ENTIRE image
- Owl centered in frame, taking up ~70% of the space

DESIGN:
- Purple (#8B5CF6) owl body
- Cream/beige belly
- Pointed ear tufts
- Large kawaii eyes with purple pupils and WHITE GLOSSY HIGHLIGHTS
- Small triangular BEAK (no mouth line - birds have beaks not mouths)
- Small wings, two tiny feet
- 2D flat illustration, black outlines
- WHITE GLOSSY SHINE MARKS on head/body (1-2 highlights)

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
      // Just resize to exactly 1024x1024 without any padding/cropping artifacts
      await sharp(buffer)
        .resize(1024, 1024, { fit: "cover" })
        .png()
        .toFile(`${OUTPUT_DIR}/${name}.png`);
      console.log(`✓ ${name}.png`);
      return buffer.toString("base64");
    }
  }
  throw new Error(`Failed to generate ${name}`);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const masterBase64 = await generatePose("master", "EXPRESSION: Neutral, friendly. Beak closed, slightly upturned.");
  
  await generatePose("wave", "EXPRESSION: Friendly wave. One wing raised waving. Beak slightly open.", masterBase64);
  await generatePose("happy", "EXPRESSION: Very happy. Eyes closed (^_^), beak open in joy, pink blush.", masterBase64);
  await generatePose("sad", "EXPRESSION: Sad. Droopy eyes, beak pointing down, single tear.", masterBase64);
  await generatePose("angry", "EXPRESSION: Angry. V-shaped eyebrows, beak closed pointing down.", masterBase64);
  await generatePose("laugh", "EXPRESSION: Laughing. Eyes squeezed, beak wide open, tears of joy.", masterBase64);

  console.log(`\n✓ All saved to ${OUTPUT_DIR}`);
}

main().catch(console.error);
