import * as fs from "fs";
import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";

const TAGLINE = "The Codex Powered AI Assistant";

async function fixBanner(bannerPath: string) {
  const bannerBuffer = fs.readFileSync(bannerPath);
  const meta = await sharp(bannerBuffer).metadata();
  
  console.log(`Processing: ${bannerPath} (${meta.width}x${meta.height})`);
  
  // Sample the background color from the banner
  // Create text overlay canvas  
  const canvas = createCanvas(meta.width!, 80);
  const ctx = canvas.getContext("2d");
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#999999";  // Light grey for visibility
  ctx.font = "400 36px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(TAGLINE, meta.width! / 2 + 180, 40);
  
  const textOverlay = canvas.toBuffer("image/png");
  
  // Create a cover for the fake "Tagline" text
  // Sample approximate background color
  const coverWidth = 500;
  const coverHeight = 80;
  
  const result = await sharp(bannerBuffer)
    .composite([
      {
        // Cover fake tagline with matching dark gradient
        input: await sharp({
          create: {
            width: coverWidth,
            height: coverHeight,
            channels: 3,
            background: { r: 50, g: 50, b: 50 }
          }
        }).png().toBuffer(),
        top: Math.round(meta.height! * 0.58),
        left: Math.round(meta.width! * 0.42)
      },
      {
        // Add real tagline below wordmark
        input: textOverlay,
        top: Math.round(meta.height! * 0.56),
        left: 0
      }
    ])
    .png()
    .toBuffer();
  
  fs.writeFileSync(bannerPath, result);
  console.log(`✓ Fixed: ${bannerPath}`);
}

async function main() {
  registerFont("./fonts/Inter-400.ttf", { family: "Inter" });
  
  // Fix all banners
  await fixBanner("./output/dexter/socials/banners/twitter-banner.png");
}

main().catch(console.error);
