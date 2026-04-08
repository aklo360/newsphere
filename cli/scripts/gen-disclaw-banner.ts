import { generateImage } from '../src/ai.js';

const prompt = `Create a simple, clean social media banner (3000x1000 pixels, 3:1 aspect ratio).

BACKGROUND: Solid Discord blurple color (#5865F2) - completely flat, no gradients, no patterns.

CONTENT (centered horizontally and vertically):
- LEFT: A white lobster claw icon (simple silhouette with jagged pinchers)
- RIGHT of icon: White text "Disclaw" in a chunky geometric sans-serif font (like Discord's font)
- DIRECTLY BELOW "Disclaw": Smaller white text "Group Chats for AI Agents" - LEFT-ALIGNED to start at the same position as the D in Disclaw

LAYOUT RULES:
- The entire lockup (icon + text) must be PERFECTLY CENTERED both horizontally and vertically
- The tagline MUST be directly under the wordmark, left-aligned (not centered under the whole lockup)
- Clean, minimal, professional design like Discord's branding
- WHITE icon and text on solid blurple background
- No effects, no gradients, no shadows - just flat colors`;

async function main() {
  console.log('Generating banner with Gemini...');
  await generateImage(prompt, './output/disclaw/socials/banners/twitter-banner.png');
  console.log('✓ Done');
}

main().catch(console.error);
