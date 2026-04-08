/**
 * Test: Patchwork Raccoon Mascot (v2 - with colored bg and 80% fill)
 */

import { generateMascot } from "../src/services/mascot.js";

async function main() {
  const result = await generateMascot({
    brandName: "Patchwork",
    prompt: "Cute kawaii raccoon mascot with teal/cyan body. Friendly coding buddy vibe. Raccoon mask pattern around eyes in darker teal. Small tail with stripes.",
    creature: "raccoon", 
    primaryColor: "#06B6D4",
    bgColor: "#D4F1F4", // Soft cyan pastel
    legCount: 2,
    clawCount: 2,
    outputDir: "./output/patchwork/mascot-v2",
    uploadToCdn: true,
  });

  console.log("\n✅ COMPLETE");
  console.log("URLs:", JSON.stringify(result.urls, null, 2));
}

main().catch(console.error);
