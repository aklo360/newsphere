/**
 * Test: Melodify Music Note Mascot
 */

import { generateMascot } from "../src/services/mascot.js";

async function main() {
  const result = await generateMascot({
    brandName: "Melodify",
    prompt: "Cute kawaii musical note mascot with headphones. Purple/violet body. Friendly music buddy vibe. Simple round body shaped like a music note.",
    primaryColor: "#8B5CF6",
    bgColor: "#E9D5FF",
    legCount: 2,
    clawCount: 2,
    outputDir: "./output/melodify/mascot",
    uploadToCdn: true,
  });

  console.log("\n✅ MELODIFY COMPLETE");
  console.log("URLs:", JSON.stringify(result.urls, null, 2));
}

main().catch(console.error);
