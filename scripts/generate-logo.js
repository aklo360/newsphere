#!/usr/bin/env node
/**
 * OpenGFX Logo Generator
 * Uses Gemini image generation with vector-style prompting
 * 
 * Usage: node generate-logo.js <brand-name> "<concept-description>"
 * Output: ./output/<brand>/icon-v{N}.png
 */

const { GoogleGenAI, Modality } = require("@google/genai");
const fs = require("fs");
const path = require("path");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Vector-style prompt template for logo icons
const VECTOR_STYLE_SUFFIX = `
Style requirements:
- Flat vector graphic, no gradients, no shadows, no 3D effects
- Solid black shapes on pure white background (#FFFFFF)
- Clean geometric forms, mathematically precise curves
- Logo Modernism aesthetic (1950s-1970s corporate identity)
- Single memorable element, extreme simplicity
- Works at 16x16px favicon size
- Negative space is intentional design element
- No text, icon only
- Square 1:1 aspect ratio, 1024x1024 pixels
- Looks like it was made in Adobe Illustrator with the pen tool
`;

async function generateLogoIcon(brandName, concept, version = 1) {
  const outputDir = path.join(__dirname, "..", "output", brandName.toLowerCase());
  fs.mkdirSync(outputDir, { recursive: true });

  const prompt = `Design a minimalist logo icon for "${brandName}".

Concept: ${concept}

${VECTOR_STYLE_SUFFIX}`;

  console.log(`Generating ${brandName} icon v${version}...`);
  console.log(`Concept: ${concept}\n`);

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp-image-generation",
    contents: prompt,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  let saved = false;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      const filename = `icon-v${version}.png`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, buffer);
      console.log(`✓ Saved: ${filepath}`);
      saved = true;
    }
    if (part.text) {
      console.log(`\nModel notes: ${part.text}`);
    }
  }

  if (!saved) {
    console.error("No image generated");
    process.exit(1);
  }
}

// CLI entry point
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node generate-logo.js <brand-name> \"<concept-description>\" [version]");
  console.log("Example: node generate-logo.js OpenGFX \"paint palette abstracted to three dots in a circle\"");
  process.exit(1);
}

const [brandName, concept, version = "1"] = args;
generateLogoIcon(brandName, concept, parseInt(version)).catch(console.error);
