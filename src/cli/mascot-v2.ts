#!/usr/bin/env tsx
/**
 * OpenGFX Mascot Generator v2
 * Generates complete mascot packages with standardized poses
 */

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const IMAGE_MODEL = "gemini-2.0-flash-exp-image-generation";

interface MascotConfig {
  brandName: string;
  color: string;
  creature: string;
  style: string;
  personality: string;
  outputDir: string;
}

const STANDARD_POSES = [
  { name: "master", prompt: "Default hero pose - flat front-facing view, friendly smile, claws resting in front" },
  { name: "wave", prompt: "Waving - one claw raised up in friendly wave gesture, happy expression" },
  { name: "happy", prompt: "Very happy - eyes closed in joy (^_^ anime style), big smile" },
  { name: "sad", prompt: "Sad - droopy eyes, small frown, maybe a tear drop" },
  { name: "unhappy", prompt: "Annoyed/frustrated - furrowed brow, slight frown" },
  { name: "laugh", prompt: "Laughing hard - open mouth laugh, eyes squeezed shut with joy" },
];

async function generateMaster(config: MascotConfig): Promise<string> {
  const prompt = `Create a cute 2D flat mascot character:

CHARACTER: ${config.creature}
BRAND: ${config.brandName}
PERSONALITY: ${config.personality}

STYLE:
- 2D flat illustration with glossy white highlights
- Color: ${config.color} (use this EXACT hex)
- Dark outlines
- Clean vector look
- NO legs visible (flat laying pose, bird's eye view)
- Kawaii face: round black eyes with white dot highlight, small cute smile

POSE: Flat front-facing, friendly expression, claws/arms resting in front

TECHNICAL: 512x512, pure white background, centered

Make it look like a polished Discord/Slack style mascot.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  const masterPath = path.join(config.outputDir, "master.png");
  
  for (const part of response.candidates![0].content!.parts!) {
    if (part.inlineData) {
      fs.writeFileSync(masterPath, Buffer.from(part.inlineData.data!, "base64"));
      console.log("✓ master.png");
      return masterPath;
    }
  }
  
  throw new Error("Failed to generate master");
}

async function generatePose(
  config: MascotConfig,
  masterPath: string,
  pose: { name: string; prompt: string }
): Promise<void> {
  const masterData = fs.readFileSync(masterPath);
  
  const prompt = `REFERENCE: This is the ${config.brandName} mascot. Create the EXACT same character in a new pose.

KEEP EXACTLY THE SAME:
- Same ${config.color} color
- Same art style and shading
- Same proportions and anatomy
- Same clean vector look with white highlights
- Same dark outlines
- NO legs visible (flat pose)

NEW POSE: ${pose.prompt}

512x512, white background.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/png", data: masterData.toString("base64") } },
        { text: prompt }
      ]
    }],
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  for (const part of response.candidates![0].content!.parts!) {
    if (part.inlineData) {
      const outPath = path.join(config.outputDir, `${pose.name}.png`);
      fs.writeFileSync(outPath, Buffer.from(part.inlineData.data!, "base64"));
      console.log(`✓ ${pose.name}.png`);
      return;
    }
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      name: { type: "string", short: "n" },
      color: { type: "string", short: "c", default: "#5865F2" },
      creature: { type: "string", default: "crab" },
      style: { type: "string", default: "2d-flat" },
      personality: { type: "string", default: "friendly, playful" },
      output: { type: "string", short: "o" },
    },
  });

  if (!values.name) {
    console.error("Usage: mascot-v2 --name <brand> [--color #hex] [--creature type]");
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputDir = values.output || `output/${values.name.toLowerCase()}/mascot/${timestamp}`;
  fs.mkdirSync(outputDir, { recursive: true });

  const config: MascotConfig = {
    brandName: values.name,
    color: values.color!,
    creature: values.creature!,
    style: values.style!,
    personality: values.personality!,
    outputDir,
  };

  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  OpenGFX Mascot Generator v2`);
  console.log(`  Brand: ${config.brandName}`);
  console.log(`  Color: ${config.color}`);
  console.log(`  Creature: ${config.creature}`);
  console.log(`  Output: ${outputDir}`);
  console.log(`══════════════════════════════════════════════════════════════\n`);

  // Generate master first
  console.log("[1/2] Generating master...");
  const masterPath = await generateMaster(config);

  // Generate remaining poses
  console.log("\n[2/2] Generating poses...");
  const poses = STANDARD_POSES.filter(p => p.name !== "master");
  for (const pose of poses) {
    await generatePose(config, masterPath, pose);
  }

  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  ✓ MASCOT PACKAGE COMPLETE`);
  console.log(`  Output: ${outputDir}`);
  console.log(`══════════════════════════════════════════════════════════════\n`);
}

main().catch(console.error);
