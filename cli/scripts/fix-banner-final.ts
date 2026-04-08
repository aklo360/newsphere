import * as fs from "fs";
import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";

const TAGLINE = "The Codex Powered AI Assistant";
const BANNER_PATH = "./output/dexter/socials/banners/twitter-banner.png";

async function main() {
  registerFont("./fonts/Inter-400.ttf", { family: "Inter" });
  
  const bannerBuffer = fs.readFileSync(BANNER_PATH);
  const meta = await sharp(bannerBuffer).metadata();
  
  console.log(`Banner: ${meta.width}x${meta.height}`);
  
  // The fake tagline is roughly at y=620-750
  // Cover it completely with background color
  const coverWidth = 1600;
  const coverHeight = 140;
  const coverTop = 600;
  const coverLeft = 950;
  
  // Match the dark grey background
  const coverBuffer = await sharp({
    create: {
      width: coverWidth,
      height: coverHeight,
      channels: 3,
      background: { r: 50, g: 52, b: 54 }
    }
  }).png().toBuffer();
  
  // Create text canvas
  const textCanvas = createCanvas(1400, 80);
  const ctx = textCanvas.getContext("2d");
  
  ctx.clearRect(0, 0, 1400, 80);
  ctx.fillStyle = "#888888";
  ctx.font = "400 44px 'Inter'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(TAGLINE, 700, 40);
  
  const textBuffer = textCanvas.toBuffer("image/png");
  
  const result = await sharp(bannerBuffer)
    .composite([
      { input: coverBuffer, top: coverTop, left: coverLeft },
      { input: textBuffer, top: 620, left: 1200 }
    ])
    .png()
    .toBuffer();
  
  fs.writeFileSync(BANNER_PATH, result);
  console.log("✓ Banner fixed");
}

main().catch(console.error);
