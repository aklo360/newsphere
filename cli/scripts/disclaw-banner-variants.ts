/**
 * Generate all banner format variants from master
 */

import { Modality } from "@google/genai";
import * as fs from "fs";
import sharp from "sharp";
import { ai, IMAGE_MODEL } from "../src/ai.js";

const MASTER = "./output/disclaw/socials/banners/twitter-banner-community.png";
const OUTPUT_DIR = "./output/disclaw/socials/banners";

const FORMATS = [
  { name: "twitter-banner", width: 3000, height: 1000, ratio: "3:1" },
  { name: "community-banner", width: 1200, height: 480, ratio: "2.5:1" },
  { name: "og-card", width: 1200, height: 628, ratio: "1.91:1" },
];

async function adaptBanner(masterPath: string, targetWidth: number, targetHeight: number, outputPath: string) {
  const masterBuffer = fs.readFileSync(masterPath);
  const masterBase64 = masterBuffer.toString("base64");
  
  const masterMeta = await sharp(masterBuffer).metadata();
  const masterAspect = (masterMeta.width || 3000) / (masterMeta.height || 1000);
  const targetAspect = targetWidth / targetHeight;
  
  console.log(`  Adapting ${masterAspect.toFixed(2)}:1 → ${targetAspect.toFixed(2)}:1`);
  
  const prompt = `Adapt this banner to a different aspect ratio.

CURRENT: ${masterMeta.width}x${masterMeta.height} (${masterAspect.toFixed(2)}:1)
TARGET: ${targetWidth}x${targetHeight} (${targetAspect.toFixed(2)}:1)

CRITICAL RULES:
1. Keep the "Disclaw" wordmark and "Chatrooms for AI Agents" tagline EXACTLY as shown
2. Keep the mascot characters EXACTLY as shown - same style, same quality
3. Extend or adjust the background as needed
4. Keep text PERFECTLY CENTERED in the new aspect ratio
5. Mascots should still frame the edges nicely
6. DO NOT crop the wordmark or tagline
7. DO NOT distort or blur any elements

The result should look like a native design for this aspect ratio, not a crop.`;

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
      await sharp(buffer)
        .resize(targetWidth, targetHeight, { fit: "cover", position: "center" })
        .png()
        .toFile(outputPath);
      return;
    }
  }
  throw new Error("No image generated");
}

async function main() {
  console.log("Generating banner variants from master...\n");
  
  // Twitter banner is the master - just copy it
  const twitterDest = `${OUTPUT_DIR}/twitter-banner-community.png`;
  console.log(`✓ twitter-banner (3000x1000) - master`);
  
  // Generate other formats
  for (const format of FORMATS) {
    if (format.name === "twitter-banner") continue;
    
    const outputPath = `${OUTPUT_DIR}/${format.name}.png`;
    console.log(`\nGenerating ${format.name} (${format.width}x${format.height})...`);
    
    await adaptBanner(MASTER, format.width, format.height, outputPath);
    console.log(`✓ ${format.name}`);
  }
  
  console.log("\n✓ All variants generated!");
}

main().catch(console.error);
