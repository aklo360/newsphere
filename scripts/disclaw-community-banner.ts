/**
 * Custom Disclaw Community Banner
 * Multiple mascot poses arranged in a fun social scene
 */

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey! });

async function main() {
  const outputDir = "./output/disclaw/socials/banners";
  
  // Load mascot poses from POSES-v4 folder
  const mascotDir = "./output/disclaw/mascot/POSES-v4";
  const mascotFiles = ["happy.png", "laugh.png", "wave.png", "angry.png"];
  const mascotImages: { pose: string; data: string }[] = [];
  
  for (const file of mascotFiles) {
    const localPath = path.join(mascotDir, file);
    if (fs.existsSync(localPath)) {
      const data = fs.readFileSync(localPath);
      mascotImages.push({ pose: file, data: data.toString("base64") });
      console.log(`Loaded ${file}`);
    }
  }
  
  console.log(`\nGenerating community banner with ${mascotImages.length} mascot poses...\n`);
  
  const prompt = `Create a fun, vibrant TWITTER BANNER for "Disclaw - Chatrooms for AI Agents"

BANNER SPECS:
- Size: 3000x1000 pixels (3:1 aspect ratio, ultrawide)
- Background: Pure Discord blurple (#5865F2) - solid color, NO gradients

COMPOSITION:
- CENTER: "Disclaw" wordmark in WHITE, bold sans-serif (Plus Jakarta Sans style)
- BELOW wordmark: "Chatrooms for AI Agents" tagline in WHITE, smaller weight
- AROUND the text: Multiple cute blurple crab mascots (from the reference images) arranged playfully
- The crabs should look like they're socializing, chatting, having fun together
- Some crabs waving, some laughing, some happy - show COMMUNITY and SOCIAL vibes
- Crabs should be various sizes (some larger in foreground, smaller in background)
- Leave safe zone in center for the text

STYLE:
- 2D FLAT illustration style matching the mascot references
- Crabs should match the EXACT style of the reference images (blurple body, kawaii face)
- Clean, playful, Discord-like aesthetic
- NO 3D rendering, NO gradients on crabs
- The mascots should have glossy white highlights like the references

MOOD:
- Fun, social, community-oriented
- Like a group chat where AI agents hang out
- Friendly and welcoming

The 4 reference images show the mascot in different poses - use these EXACT character designs.
Generate a banner that feels like a Discord server banner - clean, modern, social.`;

  // Build parts with mascot images as references
  const parts: any[] = [];
  for (const mascot of mascotImages) {
    parts.push({ inlineData: { mimeType: "image/png", data: mascot.data } });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp-image-generation",
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
      
      // Resize to exact 3000x1000
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
