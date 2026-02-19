/**
 * Regenerate Nox wave pose with actual waving wing
 */

import { Modality } from "@google/genai";
import * as fs from "fs";
import sharp from "sharp";
import { ai, IMAGE_MODEL } from "../src/ai.js";

async function main() {
  const masterPath = "./output/nox/mascot/unified-2026-02-19T04-21-36/master.png";
  const outputPath = "./output/nox/mascot/unified-2026-02-19T04-21-36/wave.png";
  
  const masterBuffer = fs.readFileSync(masterPath);
  const masterBase64 = masterBuffer.toString("base64");
  
  const prompt = `Create a WAVING pose variation of this owl mascot.

CRITICAL: The owl must be WAVING - one wing/arm raised up in a friendly wave gesture!

PRESERVE EXACTLY:
- Same owl character design
- Same purple body color with cream belly
- Same ear tufts, beak, eye style
- Same line weight and art style
- Same 2D flat illustration with glossy highlights

CHANGE FOR WAVE POSE:
- ONE WING RAISED UP in a wave gesture (like saying "hi!")
- Friendly welcoming expression
- Can have slight head tilt
- Keep the other wing down

The wing should be clearly raised and waving, not just a face expression change.
This is a BODY POSE change, not just a facial expression.`;

  console.log("Generating wave pose with actual waving wing...");

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/png", data: masterBase64 } },
        { text: prompt }
      ]
    }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      await sharp(buffer).png().toFile(outputPath);
      console.log(`✓ Saved: ${outputPath}`);
      return;
    }
  }
  
  console.error("No image generated");
}

main().catch(console.error);
