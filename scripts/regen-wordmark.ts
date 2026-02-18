import { createCanvas, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register Plus Jakarta Sans 800
const fontPath = path.join(__dirname, "..", "fonts", "Plus-Jakarta-Sans-800.ttf");
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: "Plus Jakarta Sans", weight: "800" });
  console.log("Font registered:", fontPath);
} else {
  console.error("Font not found:", fontPath);
  process.exit(1);
}

const brandName = "Disclaw";
const outputPath = "./output/disclaw/logo/wordmark.png";
const fontFamily = "Plus Jakarta Sans";
const fontWeight = 800;

const canvasWidth = 2048;
const canvasHeight = 512;

const canvas = createCanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext("2d");

// Transparent background
ctx.clearRect(0, 0, canvasWidth, canvasHeight);

ctx.fillStyle = "#000000";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

let fontSize = 400;
ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
let textWidth = ctx.measureText(brandName).width;

while (textWidth > canvasWidth * 0.90 && fontSize > 50) {
  fontSize -= 10;
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  textWidth = ctx.measureText(brandName).width;
}

ctx.fillText(brandName, canvasWidth / 2, canvasHeight / 2);

const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(outputPath, buffer);

console.log(`Done: ${outputPath} (${fontSize}px ${fontFamily} ${fontWeight})`);
