/**
 * Disclaw Community Banner - Full AI Workflow
 * Uses nano-banana prompting to prevent mascot deformation
 */

import { Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { ai, IMAGE_MODEL } from "../src/ai.js";

async function main() {
  const outputDir = "./output/disclaw/socials/banners";
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Load the ACTUAL wordmark
  const wordmarkPath = "./output/disclaw/logo/wordmark.png";
  const wordmarkData = fs.readFileSync(wordmarkPath).toString("base64");
  
  // Load ONE mascot as reference (happy pose - clearest expression)
  const mascotPath = "./output/disclaw/mascot/POSES-v4/happy.png";
  const mascotData = fs.readFileSync(mascotPath).toString("base64");
  console.log("Loaded mascot reference: happy.png");
  
  console.log(`\nGenerating banner...\n`);

  const prompt = `Create a Twitter banner for "Disclaw - Chatrooms for AI Agents"

╔══════════════════════════════════════════════════════════════════════════════╗
║  NANO BANANA PROTOCOL: MASCOT FIDELITY IS #1 PRIORITY                        ║
║  NANO BANANA PROTOCOL: MASCOT FIDELITY IS #1 PRIORITY                        ║
║  NANO BANANA PROTOCOL: MASCOT FIDELITY IS #1 PRIORITY                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

IMAGE 2 shows the EXACT mascot character. You MUST preserve:
- EXACT line weight (consistent thickness throughout)
- EXACT proportions (head size, claw size, body ratio)
- EXACT colors (blurple body, black outlines, white highlights, pink blush)
- EXACT style (2D flat with glossy highlights, kawaii face)
- NO blurring, NO smudging, NO distortion, NO extra limbs
- CRISP CLEAN VECTOR-QUALITY EDGES

If the mascot looks blurry or deformed = FAIL. Regenerate.

═══════════════════════════════════════════════════════════════════════════════
BANNER LAYOUT (CRITICAL - PERFECT CENTERING)
═══════════════════════════════════════════════════════════════════════════════

SIZE: 3000x1000 pixels (3:1 ultrawide)
BACKGROUND: Pure solid #5865F2 (Discord blurple) - NO gradients

TEXT PLACEMENT - PERFECTLY CENTERED:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                                                             │
│                              "Disclaw"                                      │
│                      "Chatrooms for AI Agents"                              │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

- Text block must be PERFECTLY CENTERED both horizontally AND vertically
- "Disclaw" wordmark in WHITE, bold sans-serif (80% of previous size - medium, not huge)
- "Chatrooms for AI Agents" in WHITE below, lighter weight (80% of previous size)
- Text should occupy roughly 30-40% of banner width, centered in the middle

MASCOT PLACEMENT:
- 4-6 mascots arranged around the EDGES only
- Leave CENTER completely clear for text
- Mascots peeking in from corners and sides
- Various sizes (perspective depth)
- Different expressions (happy, waving, excited)
- They're a COMMUNITY of crabs socializing

═══════════════════════════════════════════════════════════════════════════════
MASCOT QUALITY REQUIREMENTS (NON-NEGOTIABLE)
═══════════════════════════════════════════════════════════════════════════════

Each mascot must have:
✓ Clean crisp black outlines (no fuzzy edges)
✓ Solid blurple (#5865F2) fill
✓ White glossy highlight on head
✓ Kawaii face (big eyes, small smile, pink blush)
✓ Two claws, rounded body
✓ IDENTICAL style to reference IMAGE 2

❌ FORBIDDEN:
- Blurry or smudged edges
- Distorted proportions
- Missing or extra limbs
- Wrong colors
- Realistic crab features
- Any deviation from the reference style

FINAL OUTPUT: ULTRA PREMIUM 4K QUALITY, SHARP, CLEAN, PROFESSIONAL

IMAGE 1: Wordmark reference
IMAGE 2: Mascot reference - MATCH THIS EXACTLY for all mascots`;

  // Build parts array - wordmark + ONE mascot reference
  const parts: any[] = [
    { inlineData: { mimeType: "image/png", data: wordmarkData } },
    { inlineData: { mimeType: "image/png", data: mascotData } },
    { text: prompt },
  ];

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const responseParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of responseParts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      const outputPath = path.join(outputDir, "twitter-banner-community.png");
      
      await sharp(buffer)
        .resize(3000, 1000, { fit: "cover", position: "center" })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Saved: ${outputPath}`);
      return;
    }
  }
  
  console.error("No image generated");
}

main().catch(console.error);
