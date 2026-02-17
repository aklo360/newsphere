import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function generateImage(prompt: string, aspectRatio: string = "1:1") {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp-image-generation",
    generationConfig: {
      responseModalities: ["image", "text"],
    } as any
  });
  
  const result = await model.generateContent(prompt);
  const parts = result.response.candidates?.[0]?.content?.parts || [];
  
  for (const part of parts) {
    if ((part as any).inlineData?.mimeType?.startsWith("image/")) {
      return Buffer.from((part as any).inlineData.data, "base64");
    }
  }
  throw new Error("No image generated");
}

async function main() {
  const iconPath = "./output/dexter/logo/icon.png";
  const iconBuffer = fs.readFileSync(iconPath);
  
  // Convert icon to base64 for reference
  const iconBase64 = iconBuffer.toString("base64");
  
  const CHROME_PROMPT = `
Create a LUXURY CHROME rendering of this cartoon character logo.

CRITICAL STYLE REQUIREMENTS:
- TRUE CHROME / POLISHED SILVER METAL finish
- NO color hues — NO purple, NO orange, NO pink, NO blue tints
- ONLY silver, grey, white, and black tones
- Think: polished stainless steel, liquid mercury, chrome car badge
- Subtle cool-white lighting reflections only
- Sharp metallic highlights and reflections
- Deep shadows for contrast
- Ultra premium, luxury tech aesthetic

MATERIAL:
- Solid polished chrome metal (NOT glass, NOT iridescent)
- Mirror-like reflective surface
- Cool neutral lighting (no warm or colored light sources)

BACKGROUND:
- Clean gradient from light grey (#F0F0F0) to medium grey (#D0D0D0)
- Subtle, professional, no distracting elements
- Should make the chrome icon POP

OUTPUT:
- 4K ultra sharp
- Professional product photography lighting
- The icon should look like a premium metal badge/emblem
`;

  console.log("Generating CHROME avatar (1024x1024)...");
  
  const avatarPrompt = CHROME_PROMPT + `
Render the Dexter cartoon character logo as a polished chrome metal badge.
Square format, character fills 85% of frame.
${iconBase64 ? "Reference the character shape from the black logo." : ""}
`;

  const avatarBuffer = await generateImage(avatarPrompt, "1:1");
  const avatar = await sharp(avatarBuffer).resize(1024, 1024).png().toBuffer();
  fs.writeFileSync("./output/dexter/socials/avatars/avatar-master.png", avatar);
  
  const avatarAcp = await sharp(avatar).resize(400, 400).jpeg({ quality: 85 }).toBuffer();
  fs.writeFileSync("./output/dexter/socials/avatars/avatar-acp.jpg", avatarAcp);
  console.log("✓ avatar-master.png & avatar-acp.jpg");

  console.log("Generating CHROME banner (3000x1000)...");
  
  const bannerPrompt = CHROME_PROMPT + `
Create a Twitter/X profile banner (3:1 aspect ratio).
LEFT SIDE: The Dexter character rendered in polished chrome metal
CENTER-RIGHT: "Dexter" wordmark in chrome metallic text
BELOW WORDMARK: Tagline "The Codex Powered AI Assistant" in subtle grey

Layout: Icon on left third, text on right two-thirds
Style: Clean, minimal, luxury tech brand
Wordmark should have same chrome metal treatment as icon
Tagline in clean sans-serif, lighter weight, grey color (#888888)
`;

  const bannerBuffer = await generateImage(bannerPrompt, "3:1");
  const banner = await sharp(bannerBuffer).resize(3000, 1000).png().toBuffer();
  fs.writeFileSync("./output/dexter/socials/banners/twitter-banner.png", banner);
  console.log("✓ twitter-banner.png");

  // Generate OG card
  console.log("Generating CHROME OG card (1200x628)...");
  const ogPrompt = CHROME_PROMPT + `
Create an OG social card (1.91:1 aspect ratio).
Same chrome Dexter icon on left, "Dexter" chrome wordmark, tagline below.
Clean professional layout.
`;
  const ogBuffer = await generateImage(ogPrompt, "16:9");
  const og = await sharp(ogBuffer).resize(1200, 628).png().toBuffer();
  fs.writeFileSync("./output/dexter/socials/banners/og-card.png", og);
  console.log("✓ og-card.png");

  // Community banner
  console.log("Generating CHROME community banner (1200x480)...");
  const commPrompt = CHROME_PROMPT + `
Create a community banner (2.5:1 aspect ratio).
Chrome Dexter icon + chrome wordmark + tagline.
Minimal, premium layout.
`;
  const commBuffer = await generateImage(commPrompt, "3:1");
  const comm = await sharp(commBuffer).resize(1200, 480).png().toBuffer();
  fs.writeFileSync("./output/dexter/socials/banners/community-banner.png", comm);
  console.log("✓ community-banner.png");

  console.log("\n✅ CHROME socials complete!");
}

main().catch(console.error);
