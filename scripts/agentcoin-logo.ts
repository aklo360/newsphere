import { createCanvas } from "canvas";
import * as fs from "fs";
import * as path from "path";

const SIZES = [1024, 512, 256, 128, 64, 32];
const BG_COLOR = "#0052FF";
const FG_COLOR = "#FFFFFF";
const OUTPUT_DIR = path.resolve("output/agentcoin");

function generateLogo(size: number): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  const cx = size / 2;
  const cy = size / 2;
  const margin = size * 0.04;
  const radius = size / 2 - margin;

  // -- Clip to circle --
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  // Fill background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, size, size);

  // -- Bold geometric A --
  ctx.fillStyle = FG_COLOR;

  const letterHeight = size * 0.56;
  const letterWidth = size * 0.47;
  const topY = cy - letterHeight * 0.47;
  const bottomY = topY + letterHeight;
  const flatTopHalf = size * 0.055;
  const legWidth = size * 0.115;

  const leftBottomOuterX = cx - letterWidth / 2;
  const rightBottomOuterX = cx + letterWidth / 2;

  const leftOuterX = (y: number) =>
    cx + (leftBottomOuterX - cx) * ((y - topY) / (bottomY - topY));
  const rightOuterX = (y: number) =>
    cx + (rightBottomOuterX - cx) * ((y - topY) / (bottomY - topY));

  const innerPeakY = topY + letterHeight * 0.38;
  const leftBottomInnerX = leftBottomOuterX + legWidth;
  const rightBottomInnerX = rightBottomOuterX - legWidth;

  const leftInnerX = (y: number) =>
    cx + (leftBottomInnerX - cx) * ((y - innerPeakY) / (bottomY - innerPeakY));
  const rightInnerX = (y: number) =>
    cx + (rightBottomInnerX - cx) * ((y - innerPeakY) / (bottomY - innerPeakY));

  // Crossbar
  const crossbarY = topY + letterHeight * 0.62;
  const crossbarHalfH = size * 0.034;

  // -- Strike line metrics --
  // Place them through the legs, between the apex and the crossbar,
  // at a height where the A is wide enough to absorb the cuts gracefully.
  const strikeThickness = size * 0.020;
  const strikeSpacing = size * 0.065;
  // Center the strikes at about 45% down the letter (just above crossbar area)
  const strikeCenterY = topY + letterHeight * 0.42;
  const strike1Y = strikeCenterY - strikeSpacing / 2;
  const strike2Y = strikeCenterY + strikeSpacing / 2;
  const extLen = size * 0.06;

  // -- Draw the complete solid A first --
  ctx.beginPath();
  ctx.moveTo(cx - flatTopHalf, topY);
  ctx.lineTo(cx + flatTopHalf, topY);
  ctx.lineTo(rightBottomOuterX, bottomY);
  ctx.lineTo(rightBottomInnerX, bottomY);
  ctx.lineTo(rightInnerX(crossbarY + crossbarHalfH), crossbarY + crossbarHalfH);
  ctx.lineTo(leftInnerX(crossbarY + crossbarHalfH), crossbarY + crossbarHalfH);
  ctx.lineTo(leftBottomInnerX, bottomY);
  ctx.lineTo(leftBottomOuterX, bottomY);
  ctx.closePath();
  ctx.fill();

  // Cut out the triangular void above crossbar
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";

  const voidTopY = innerPeakY + size * 0.008;
  const voidBottomY = crossbarY - crossbarHalfH;

  ctx.beginPath();
  ctx.moveTo(cx, voidTopY);
  ctx.lineTo(rightInnerX(voidBottomY), voidBottomY);
  ctx.lineTo(leftInnerX(voidBottomY), voidBottomY);
  ctx.closePath();
  ctx.fill();

  // -- Cut the two strike-through channels --
  // These cut through BOTH legs of the A as blue gaps.
  // The lines span the full width of the A outer silhouette.
  for (const sy of [strike1Y, strike2Y]) {
    const cutLeft = leftOuterX(sy);
    const cutRight = rightOuterX(sy);
    ctx.fillRect(cutLeft, sy - strikeThickness / 2, cutRight - cutLeft, strikeThickness);
  }
  ctx.restore();

  // -- White line extensions beyond the letter edges --
  ctx.fillStyle = FG_COLOR;
  for (const sy of [strike1Y, strike2Y]) {
    const lEdge = leftOuterX(sy);
    const rEdge = rightOuterX(sy);
    // Left protrusion
    ctx.fillRect(lEdge - extLen, sy - strikeThickness / 2, extLen, strikeThickness);
    // Right protrusion
    ctx.fillRect(rEdge, sy - strikeThickness / 2, extLen, strikeThickness);
  }

  return canvas.toBuffer("image/png");
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const size of SIZES) {
    const buffer = generateLogo(size);
    const filename = `icon-${size}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`Generated ${filepath} (${size}x${size})`);
  }

  console.log("\nAll sizes generated successfully.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
