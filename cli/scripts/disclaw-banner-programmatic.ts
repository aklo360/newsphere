/**
 * Disclaw Community Banner - PROGRAMMATIC (No AI hallucination)
 * 
 * Uses ACTUAL mascot PNGs - pixel perfect, no deformations
 */

import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";
import * as fs from "fs";
import * as path from "path";

const BLURPLE = "#5865F2";
const WHITE = "#FFFFFF";
const WIDTH = 3000;
const HEIGHT = 1000;

async function removeWhiteBackground(inputBuffer: Buffer): Promise<Buffer> {
  // Get raw pixel data
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Replace white/near-white pixels with transparent
  const newData = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // If pixel is white or near-white, make transparent
    if (r > 240 && g > 240 && b > 240) {
      newData[i] = 0;
      newData[i + 1] = 0;
      newData[i + 2] = 0;
      newData[i + 3] = 0; // Transparent
    } else {
      newData[i] = r;
      newData[i + 1] = g;
      newData[i + 2] = b;
      newData[i + 3] = a;
    }
  }
  
  return sharp(newData, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

async function main() {
  const outputPath = "./output/disclaw/socials/banners/twitter-banner-community.png";
  
  // Register font
  const fontDir = "./fonts";
  try {
    registerFont(path.join(fontDir, "Plus-Jakarta-Sans-800.ttf"), { family: "Plus Jakarta Sans", weight: "800" });
    registerFont(path.join(fontDir, "Plus-Jakarta-Sans-500.ttf"), { family: "Plus Jakarta Sans", weight: "500" });
  } catch (e) { console.log("Font registration:", e); }
  
  // Create canvas with blurple background + text
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  
  // Fill blurple background
  ctx.fillStyle = BLURPLE;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Draw wordmark text (larger)
  ctx.fillStyle = WHITE;
  ctx.font = '800 140px "Plus Jakarta Sans"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Disclaw", WIDTH / 2, HEIGHT / 2 - 30);
  
  // Draw tagline (larger)
  ctx.font = '500 48px "Plus Jakarta Sans"';
  ctx.fillText("Chatrooms for AI Agents", WIDTH / 2, HEIGHT / 2 + 70);
  
  // Convert canvas to buffer
  const bgBuffer = canvas.toBuffer("image/png");
  
  // Load mascot poses and remove white backgrounds
  const mascotDir = "./output/disclaw/mascot/POSES-v4";
  const mascotConfigs = [
    { pose: "happy", size: 380, x: 80, y: 520 },       // Bottom left
    { pose: "laugh", size: 340, x: 320, y: 80 },      // Top left  
    { pose: "wave", size: 320, x: 2380, y: 60 },      // Top right
    { pose: "sad", size: 360, x: 2500, y: 540 },      // Bottom right
  ];
  
  const composites: sharp.OverlayOptions[] = [];
  
  for (const config of mascotConfigs) {
    const posePath = path.join(mascotDir, `${config.pose}.png`);
    if (fs.existsSync(posePath)) {
      // Load, resize, and remove white background
      const resized = await sharp(posePath)
        .resize(config.size, config.size, { fit: "inside" })
        .toBuffer();
      
      const transparent = await removeWhiteBackground(resized);
      
      composites.push({
        input: transparent,
        left: config.x,
        top: config.y,
      });
      console.log(`✓ ${config.pose} (${config.size}px)`);
    }
  }
  
  // Composite mascots onto background
  await sharp(bgBuffer)
    .composite(composites)
    .png()
    .toFile(outputPath);
  
  console.log(`\n✓ Saved: ${outputPath}`);
}

main().catch(console.error);
