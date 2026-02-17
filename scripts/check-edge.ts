import * as fs from "fs";
import sharp from "sharp";

// Check the horizontal lockup for the edge issue
const buffer = fs.readFileSync("./output/dexter/logo/horizontal.png");

sharp(buffer)
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    // Icon is at roughly x=444 in the 3000px wide image, size ~880px
    // Check pixels around where the icon boundary should be
    
    const iconLeft = 444;
    const iconRight = iconLeft + 880;
    const y = 500; // middle row
    
    console.log("Checking horizontal row at y=500 around icon edge:");
    console.log("\nLeft edge area (x=440-450):");
    for (let x = 440; x <= 450; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const isWhite = r === 255 && g === 255 && b === 255;
      console.log(`  x=${x}: RGB(${r},${g},${b}) ${isWhite ? '✓' : '← NOT WHITE'}`);
    }
    
    console.log("\nRight edge area (x=1320-1330):");
    for (let x = 1320; x <= 1330; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const isWhite = r === 255 && g === 255 && b === 255;
      console.log(`  x=${x}: RGB(${r},${g},${b}) ${isWhite ? '✓' : '← NOT WHITE'}`);
    }
  });
