/**
 * Make Nox mascots SQUARE (from lavender bg source - no transparency issues)
 */

import sharp from "sharp";
import * as fs from "fs";

const INPUT_DIR = "./output/nox/mascot/lavender";
const OUTPUT_DIR = "./output/nox/mascot/FINAL-SQUARE";
const POSES = ["master", "wave", "happy", "sad", "angry", "laugh"];

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const SIZE = 1024;
  
  console.log(`Making mascots ${SIZE}x${SIZE} square...\n`);
  
  for (const pose of POSES) {
    // Resize to square, maintaining aspect and adding padding
    await sharp(`${INPUT_DIR}/${pose}.png`)
      .resize(SIZE, SIZE, { 
        fit: "contain", 
        background: "#C8B4DC" 
      })
      .png()
      .toFile(`${OUTPUT_DIR}/${pose}.png`);
    
    console.log(`✓ ${pose}.png`);
  }
  
  console.log(`\n✓ Done!`);
}

main().catch(console.error);
