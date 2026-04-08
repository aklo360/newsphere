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
  
  // Create cover rectangle with matching dark grey
  const coverWidth = 1100;
  const coverHeight = 100;
  const coverTop = Math.round(meta.height! * 0.60);
  const coverLeft = Math.round(meta.width! * 0.35);
  
  // Sample background color from the area (approximate dark grey)
  const coverBuffer = await sharp({
    create: {
      width: coverWidth,
      height: coverHeight,
      channels: 3,
      background: { r: 60, g: 62, b: 64 }  // Match the dark grey bg
    }
  }).png().toBuffer();
  
  // Create text canvas
  const textCanvas = createCanvas(coverWidth, coverHeight);
  const ctx = textCanvas.getContext("2d");
  
  ctx.clearRect(0, 0, coverWidth, coverHeight);
  ctx.fillStyle = "#9A9A9A";  // Light grey text
  ctx.font = "400 48px 'Inter'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(TAGLINE, coverWidth / 2, coverHeight / 2);
  
  const textBuffer = textCanvas.toBuffer("image/png");
  
  // Composite: first cover, then text
  const result = await sharp(bannerBuffer)
    .composite([
      { input: coverBuffer, top: coverTop, left: coverLeft },
      { input: textBuffer, top: coverTop, left: coverLeft }
    ])
    .png()
    .toBuffer();
  
  fs.writeFileSync(BANNER_PATH, result);
  console.log("✓ Tagline replaced");
}

main().catch(console.error);
