import * as fs from "fs";
import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";

const TAGLINE = "The Codex Powered AI Assistant";
const BANNER_PATH = "./output/dexter/socials/banners/twitter-banner.png";

async function main() {
  // Register a clean font
  registerFont("./fonts/Inter-400.ttf", { family: "Inter" });
  
  // Load the banner
  const bannerBuffer = fs.readFileSync(BANNER_PATH);
  const meta = await sharp(bannerBuffer).metadata();
  
  console.log(`Banner: ${meta.width}x${meta.height}`);
  
  // Create a text overlay canvas
  const canvas = createCanvas(meta.width!, 100);
  const ctx = canvas.getContext("2d");
  
  // Transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // White/light grey text
  ctx.fillStyle = "#AAAAAA";
  ctx.font = "400 42px 'Inter'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(TAGLINE, meta.width! / 2 + 200, 50);  // Offset to align under wordmark
  
  const textOverlay = canvas.toBuffer("image/png");
  
  // Composite the tagline onto the banner
  // First, remove the fake "Tagline" text by covering it
  const result = await sharp(bannerBuffer)
    .composite([
      {
        // Cover the fake tagline area with dark bg
        input: {
          create: {
            width: 400,
            height: 60,
            channels: 3,
            background: { r: 40, g: 40, b: 40 }
          }
        },
        top: Math.round(meta.height! * 0.62),
        left: Math.round(meta.width! * 0.45)
      },
      {
        // Add real tagline
        input: textOverlay,
        top: Math.round(meta.height! * 0.60),
        left: 0
      }
    ])
    .png()
    .toBuffer();
  
  fs.writeFileSync(BANNER_PATH, result);
  console.log("✓ Tagline added to banner");
  
  // Also update the other banners
  const ogPath = "./output/dexter/socials/banners/og-card.png";
  const commPath = "./output/dexter/socials/banners/community-banner.png";
  
  // For simplicity, just note they need updating too
  console.log("Note: OG card and community banner also need tagline update");
}

main().catch(console.error);
