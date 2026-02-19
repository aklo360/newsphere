/**
 * Nano Banana Prompting Utilities
 * 
 * Core principles:
 * 1. FRONT-LOAD critical constraints (first tokens weighted highest)
 * 2. DOUBLE the prompt for better token distribution
 * 3. REPEAT key rules at start AND end
 * 4. Use emphasis markers (⚠️, ❌, ✅)
 * 5. Negative prompting (what NOT to do)
 */

// ═══════════════════════════════════════════════════════════════════
// PROMPT DOUBLING - Repeat entire prompt for better token weighting
// ═══════════════════════════════════════════════════════════════════

export function doublePrompt(prompt: string): string {
  return `${prompt}\n\n---REPEAT FOR EMPHASIS---\n\n${prompt}`;
}

// ═══════════════════════════════════════════════════════════════════
// EMOTE SYSTEM - Eyes + Mouth management for mascots
// ═══════════════════════════════════════════════════════════════════

export type EmoteStyle = 
  | "friendly"      // Soft smile, happy eyes
  | "excited"       // Big smile, wide eyes
  | "thinking"      // Slight frown, looking up/sideways
  | "determined"    // Confident smile, focused eyes
  | "waving"        // Open smile, friendly eyes
  | "neutral";      // Slight smile, relaxed eyes

export const EMOTE_DESCRIPTIONS: Record<EmoteStyle, { eyes: string; mouth: string }> = {
  friendly: {
    eyes: "large round eyes with highlights, soft friendly expression, slightly curved eyebrows",
    mouth: "small gentle smile, simple curved line, friendly expression",
  },
  excited: {
    eyes: "large wide eyes with big highlights, raised eyebrows, excited expression",
    mouth: "big open smile showing happiness, curved upward, joyful",
  },
  thinking: {
    eyes: "eyes looking to the side or upward, one eyebrow slightly raised, contemplative",
    mouth: "small closed mouth, slight pout or neutral, thoughtful expression",
  },
  determined: {
    eyes: "focused eyes with confident look, slight eyebrow angle, determined",
    mouth: "confident smirk or closed smile, self-assured expression",
  },
  waving: {
    eyes: "happy eyes with friendly sparkle, welcoming expression",
    mouth: "open friendly smile, welcoming, warm expression",
  },
  neutral: {
    eyes: "relaxed round eyes with gentle highlights, calm expression",
    mouth: "slight smile, simple curved line, content expression",
  },
};

export function getEmoteBlock(emote: EmoteStyle): string {
  const desc = EMOTE_DESCRIPTIONS[emote];
  return `
👀 EYES (REQUIRED):
${desc.eyes}

👄 MOUTH (REQUIRED - NEVER OMIT):
${desc.mouth}

⚠️ FACE RULE: Character MUST have BOTH eyes AND a visible mouth. No mouth = FAIL.
`;
}

// ═══════════════════════════════════════════════════════════════════
// ANATOMY CONSTRAINTS
// ═══════════════════════════════════════════════════════════════════

export interface AnatomyConfig {
  armCount: number;
  legCount: number | "variable";  // "variable" for creatures where it varies
  hasAntenna?: boolean;
  hasTail?: boolean;
  customParts?: string[];
}

export function getAnatomyBlock(config: AnatomyConfig): string {
  const lines = [
    `⚠️ CRITICAL ANATOMY - READ FIRST ⚠️`,
    `EXACTLY ${config.armCount} ARMS/CLAWS. NOT ${config.armCount - 1}. NOT ${config.armCount + 1}. EXACTLY ${config.armCount}.`,
  ];
  
  if (config.legCount !== "variable") {
    lines.push(`EXACTLY ${config.legCount} LEGS.`);
  }
  
  if (config.hasAntenna) {
    lines.push(`MUST have antenna on head.`);
  }
  
  if (config.hasTail) {
    lines.push(`MUST have tail.`);
  }
  
  if (config.customParts) {
    lines.push(...config.customParts);
  }
  
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// NEGATIVE PROMPTS
// ═══════════════════════════════════════════════════════════════════

export function getNegativeBlock(armCount: number): string {
  const wrongCounts = [1, 2, 3, 4, 5, 6].filter(n => n !== armCount);
  return `
❌ FORBIDDEN - NEVER DO THESE:
- NO ${wrongCounts.join(" arms, NO ")} arms (ONLY ${armCount} arms allowed)
- NO extra limbs near face or mouth
- NO missing mouth (mouth is REQUIRED)
- NO missing eyes (eyes are REQUIRED)
- NO changing the character design between poses
- NO realistic style (keep stylized/cartoon)
- NO busy backgrounds (white/transparent only)
`;
}

// ═══════════════════════════════════════════════════════════════════
// FULL NANO BANANA PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════

export interface NanoBananaConfig {
  anatomy: AnatomyConfig;
  emote: EmoteStyle;
  characterDescription: string;
  features: string[];
  colors: { primary: string; secondary: string; accent: string };
  style: string;
  pose: string;
  size: number;
  isReferenceMode?: boolean;
}

export function buildNanoBananaPrompt(config: NanoBananaConfig): string {
  const {
    anatomy,
    emote,
    characterDescription,
    features,
    colors,
    style,
    pose,
    size,
    isReferenceMode,
  } = config;

  // Build core prompt (will be doubled)
  const corePrompt = `${getAnatomyBlock(anatomy)}

${getEmoteBlock(emote)}

${getNegativeBlock(anatomy.armCount)}

✅ CHARACTER:
${characterDescription}

FEATURES:
${features.map(f => `• ${f}`).join("\n")}

🎨 COLORS:
• Primary: ${colors.primary}
• Secondary: ${colors.secondary}
• Accent: ${colors.accent}

🖼️ STYLE:
${style}

📐 POSE:
${pose}

TECHNICAL:
• Size: ${size}x${size}px
• Background: Pure white (#FFFFFF)
• Character centered, filling 70% of frame
• Clean vector edges, production-ready

${isReferenceMode ? "⚠️ REFERENCE IMAGE PROVIDED - Match character EXACTLY, only change pose and expression." : ""}

FINAL CHECK: 
1. Count arms - must be EXACTLY ${anatomy.armCount}
2. Verify mouth is visible
3. Verify eyes are present
4. Check colors match spec`;

  // Double the prompt for better token distribution
  return doublePrompt(corePrompt);
}

// ═══════════════════════════════════════════════════════════════════
// POSE TO EMOTE MAPPING
// ═══════════════════════════════════════════════════════════════════

export const POSE_EMOTE_MAP: Record<string, EmoteStyle> = {
  hero: "determined",
  wave: "waving",
  thinking: "thinking",
  celebrate: "excited",
  working: "neutral",
  relaxed: "friendly",
  portrait: "friendly",
};

export function getEmoteForPose(poseName: string): EmoteStyle {
  return POSE_EMOTE_MAP[poseName] || "friendly";
}
