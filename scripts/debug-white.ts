import * as fs from "fs";
import sharp from "sharp";

const iconBuffer = fs.readFileSync("./output/dexter/logo/icon.png");

sharp(iconBuffer)
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    // Check corner pixels
    const corners = [
      [0, 0],
      [info.width - 1, 0],
      [0, info.height - 1],
      [info.width - 1, info.height - 1]
    ];
    
    for (const [x, y] of corners) {
      const idx = (y * info.width + x) * info.channels;
      console.log(`Pixel (${x},${y}): R=${data[idx]} G=${data[idx+1]} B=${data[idx+2]}`);
    }
    
    // Check edge pixels at center
    const mid = Math.floor(info.width / 2);
    const edges = [
      [mid, 0], [mid, info.height - 1],
      [0, mid], [info.width - 1, mid]
    ];
    
    console.log("\nEdge centers:");
    for (const [x, y] of edges) {
      const idx = (y * info.width + x) * info.channels;
      console.log(`Pixel (${x},${y}): R=${data[idx]} G=${data[idx+1]} B=${data[idx+2]}`);
    }
  });
