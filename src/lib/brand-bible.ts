/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEWSPHERE BRAND BIBLE SCHEMA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The complete schema for brand identity systems, derived from enterprise
 * brand guidelines (Merck 152-page style guide).
 * 
 * This schema is the NORTH STAR — it represents everything a brand can define.
 * Brands can exist at any completeness level (Starter → Growth → Enterprise).
 * 
 * @version 1.0.0
 * @derived Merck Brand Guidelines V1.5
 */

// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVES & ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export type MeasurementUnit = 'px' | 'rem' | 'em' | 'in' | 'mm' | 'cm' | '%';
export type PlatformContext = 'print' | 'digital' | 'social' | 'video' | 'environmental';
export type Alignment = 'left' | 'center' | 'right' | 'justified';
export type BrandTier = 'starter' | 'growth' | 'enterprise';

export interface Measurement {
  value: number | string;
  unit: MeasurementUnit;
  context?: PlatformContext;
}

export interface DoAndDont {
  type: 'do' | 'dont';
  description: string;
  imageRef?: string;
}

export interface VisualAsset {
  id: string;
  url: string;
  altText: string;
  caption?: string;
  format?: 'svg' | 'png' | 'jpg' | 'pdf' | 'eps';
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. BRAND IDENTITY & STRATEGY
// ═══════════════════════════════════════════════════════════════════════════

export interface LegalAndNaming {
  corporateNames: {
    region: string;
    allowedName: string;
    usageRules: string;
    exceptions?: string;
  }[];
  trademarks: string[];
  disclaimers: string[];
}

export interface BrandStrategy {
  mission: string;
  vision?: string;
  anthemOrTagline: string;
  coreValues: string[];
  personalityTraits: string[];
  positioning?: string;
  targetAudience?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. LOGO SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export type LogoVariantType = 
  | 'primary' 
  | 'secondary' 
  | 'iconOnly' 
  | 'wordmarkOnly' 
  | 'withAnthem' 
  | 'lockup'
  | 'horizontal'
  | 'stacked';

export interface LogoClearSpace {
  formula: string;
  visualGuides?: VisualAsset[];
}

export interface LogoMinimumSize {
  print: Measurement;
  screen: Measurement;
}

export interface LogoScaleAndPlacement {
  scaleFormula?: string;
  targetPercentages?: Record<LogoVariantType, string>;
  allowedPlacements: string[];
  margins?: string;
}

export interface LogoColorway {
  name: string;
  description: string;
  backgroundSuitability: string[];
  contrastRules?: string;
}

export interface LogoMotion {
  durationSeconds: number;
  shortVersionSeconds?: number;
  easingFunction?: string;
  allowedColorCombinations?: string[];
  usageContexts?: string[];
}

export interface LogoVariant {
  type: LogoVariantType;
  name: string;
  usageContext: string;
  assets: VisualAsset[];
}

export interface LogoSystem {
  overview?: string;
  variants: LogoVariant[];
  clearSpace?: LogoClearSpace;
  minimumSize?: LogoMinimumSize;
  scaleAndPlacement?: LogoScaleAndPlacement;
  colorways?: LogoColorway[];
  useOverPhotography?: {
    rules: string[];
    techniquesAllowed?: string[];
  };
  animation?: LogoMotion;
  dosAndDonts?: DoAndDont[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. COLOR SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface ColorValues {
  hex: string;
  rgb?: { r: number; g: number; b: number };
  cmyk?: { c: number; m: number; y: number; k: number };
  pantone?: string;
  hsl?: { h: number; s: number; l: number };
}

export type ColorRole = 'primary' | 'secondary' | 'accent' | 'ui' | 'background' | 'foreground' | 'muted' | 'border';

export interface BrandColor {
  name: string;
  role: ColorRole;
  values: ColorValues;
  usageProportionPercentage?: number;
  accessibilityNotes?: string;
  usage?: string;
}

export interface ColorPalettes {
  primary: BrandColor[];
  secondary?: BrandColor[];
  accent?: BrandColor[];
  ui?: BrandColor[];
  semantic?: {
    success?: ColorValues;
    warning?: ColorValues;
    error?: ColorValues;
    info?: ColorValues;
  };
}

export interface ColorSystem {
  overview?: string;
  mode: 'light' | 'dark' | 'both';
  palettes: ColorPalettes;
  technicalNotes?: {
    conversionRules?: string;
    adobeColorProfiles?: string;
  };
  dosAndDonts?: DoAndDont[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. TYPOGRAPHY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface Typeface {
  name: string;
  role: 'primary' | 'secondary' | 'systemFallback' | 'accent' | 'monospace';
  source: 'custom' | 'google' | 'adobe' | 'system';
  weights: string[];
  styles?: string[];
  usageDescription?: string;
  isEmbeddable?: boolean;
  fallbackStack?: string;
}

export interface TypesettingSpecs {
  case?: 'sentence' | 'title' | 'upper' | 'lower';
  leadingBody?: string;
  leadingLargeText?: string;
  trackingBody?: number;
  trackingHeadings?: number | string;
  kerning?: 'optical' | 'metric';
  alignment?: Alignment;
}

export interface TypeHierarchyStyle {
  name: string;
  tag?: string; // HTML tag: h1, h2, p, etc.
  typeface: string;
  weight: string;
  size?: Measurement;
  lineHeight?: Measurement;
  letterSpacing?: number;
  color?: string;
  contextUsage?: string;
}

export interface TypographySystem {
  typefaces: Typeface[];
  specifications?: TypesettingSpecs;
  hierarchy: TypeHierarchyStyle[];
  useOnBackgroundColors?: {
    backgroundColorRef: string;
    styleOverrides: Partial<TypeHierarchyStyle>[];
  }[];
  dosAndDonts?: DoAndDont[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. TONE OF VOICE
// ═══════════════════════════════════════════════════════════════════════════

export interface VoiceTrait {
  name: string;
  description: string;
  howToSound?: string[];
}

export interface WritingExample {
  principle: string;
  before?: string;
  after?: string;
  context?: string;
}

export interface ToneOfVoice {
  overview?: string;
  traits: VoiceTrait[];
  writingTips?: string[];
  channelSpecificRules?: {
    channel: string;
    rules: string[];
  }[];
  examples?: WritingExample[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. IMAGERY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface PhotographyTier {
  name: string;
  subCategories?: string[];
  artDirectionPointers?: string[];
  exampleAssets?: VisualAsset[];
}

export interface DiversityAndInclusion {
  overview?: string;
  requiredTraitsToRepresent?: string[];
  bestPractices?: string[];
}

export interface CroppingGuidance {
  subject: 'people' | 'objects' | 'environments';
  rules: string[];
  examples?: VisualAsset[];
}

export interface IllustrationStyle {
  type: 'hero' | 'spot' | 'icon' | 'infographic';
  usage: string;
  characteristics?: string[];
}

export interface IllustrationSystem {
  overview?: string;
  ratioVsPhotography?: string;
  styles: IllustrationStyle[];
}

export interface ImagerySystem {
  artDirectionCorePrinciples?: string[];
  photography?: {
    tiers?: PhotographyTier[];
    diversityAndInclusion?: DiversityAndInclusion;
    croppingGuidance?: CroppingGuidance[];
    dosAndDonts?: DoAndDont[];
  };
  illustration?: IllustrationSystem;
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. DATA VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════

export interface DataVisualizationSystem {
  overview?: string;
  chartTypes?: string[];
  colorSequence?: {
    order: string[]; // Color names in order
    rules?: string[];
  };
  dosAndDonts?: DoAndDont[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. LAYOUT & DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface DesignGrid {
  name?: string;
  conceptDescription?: string;
  columns?: number;
  gutter?: Measurement;
  margin?: Measurement;
  elements?: {
    name: string;
    description: string;
    usageRules?: string[];
  }[];
}

export interface LayoutExpression {
  level: 'primary' | 'secondary' | 'internal' | 'unbranded';
  description: string;
  requiresBrandDevice?: boolean;
  rules?: string[];
  examples?: VisualAsset[];
}

export interface BrandDevice {
  name: string;
  description?: string;
  usageRules?: string[];
  placementRules?: string[];
  sizingFormula?: string;
}

export interface CoreDesignSystem {
  overview?: string;
  grid?: DesignGrid;
  expressions?: LayoutExpression[];
  brandDevice?: BrandDevice;
  spacing?: number[]; // Spacing scale in px
  borderRadius?: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  typographyPlacementRules?: string[];
  dosAndDonts?: DoAndDont[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. DIGITAL / WEB SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface Breakpoint {
  name: string;
  minWidthPx: number;
  maxWidthPx?: number;
  columns: number;
  gutterPx: number;
  marginPx: number;
}

export interface SpacingSystem {
  baseUnitPx: number;
  scale: number[];
  rules?: string[];
}

export interface WebTypographyScale {
  breakpointRef: string;
  styles: {
    tag: string;
    font: string;
    sizePx: number;
    lineHeightPx: number;
    letterSpacingEm?: number;
  }[];
}

export interface UIComponentState {
  state: 'default' | 'hover' | 'active' | 'disabled' | 'focus';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

export interface UIComponent {
  name: string;
  variants?: {
    name: string;
    states: UIComponentState[];
  }[];
}

export interface DigitalSystem {
  overview?: string;
  breakpoints?: Breakpoint[];
  spacing?: SpacingSystem;
  typographyScale?: WebTypographyScale[];
  components?: UIComponent[];
  dosAndDonts?: DoAndDont[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. SOCIAL MEDIA SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface SocialFormat {
  name: string;
  aspectRatio: string;
  gridColumns?: number;
  marginFormula?: string;
  contentSafeZoneNotes?: string;
}

export interface SocialMediaSystem {
  overview?: string;
  postTypes?: {
    type: 'photography' | 'illustration' | 'typography' | 'video';
    usage?: string;
  }[];
  formats?: SocialFormat[];
  brandingScale?: {
    levels: ('minimal' | 'moderate' | 'prominent')[];
    guidance?: string;
  };
  profileBranding?: {
    avatarRules?: string;
    bannerRules?: string;
  };
  dosAndDonts?: DoAndDont[];
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER BRAND BIBLE
// ═══════════════════════════════════════════════════════════════════════════

export interface BrandBibleMetadata {
  id: string;
  brandName: string;
  tier: BrandTier;
  version: string;
  createdAt: string;
  updatedAt: string;
  sourceType: 'pdf' | 'url' | 'manual' | 'ai-generated';
  sourceRef?: string;
  completeness: number; // 0-100 percentage of schema populated
  supportContacts?: {
    team: string;
    email: string;
    resourceUrls?: string[];
  }[];
}

/**
 * The complete Brand Bible schema.
 * All fields except metadata are optional — brands exist at various completeness levels.
 */
export interface BrandBible {
  metadata: BrandBibleMetadata;
  
  // Core Identity (Starter tier minimum)
  strategy?: BrandStrategy;
  naming?: LegalAndNaming;
  
  // Visual Identity (Growth tier)
  logos?: LogoSystem;
  colors?: ColorSystem;
  typography?: TypographySystem;
  
  // Voice & Content (Growth tier)
  voice?: ToneOfVoice;
  imagery?: ImagerySystem;
  
  // Advanced Systems (Enterprise tier)
  dataVisualization?: DataVisualizationSystem;
  designSystem?: CoreDesignSystem;
  digital?: DigitalSystem;
  social?: SocialMediaSystem;
  
  // Application Examples
  applicationExamples?: {
    context: string;
    description?: string;
    assets?: VisualAsset[];
  }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TIER DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Minimum required fields for each tier
 */
export const TIER_REQUIREMENTS: Record<BrandTier, (keyof BrandBible)[]> = {
  starter: ['metadata', 'strategy', 'colors', 'typography'],
  growth: ['metadata', 'strategy', 'colors', 'typography', 'logos', 'voice'],
  enterprise: ['metadata', 'strategy', 'colors', 'typography', 'logos', 'voice', 'imagery', 'designSystem', 'digital'],
};

/**
 * Calculate completeness percentage based on populated fields
 */
export function calculateCompleteness(bible: Partial<BrandBible>): number {
  const allFields = [
    'metadata', 'strategy', 'naming', 'logos', 'colors', 'typography',
    'voice', 'imagery', 'dataVisualization', 'designSystem', 'digital',
    'social', 'applicationExamples'
  ];
  
  let populated = 0;
  for (const field of allFields) {
    if (bible[field as keyof BrandBible]) populated++;
  }
  
  return Math.round((populated / allFields.length) * 100);
}

/**
 * Determine tier based on populated fields
 */
export function determineTier(bible: Partial<BrandBible>): BrandTier {
  const hasEnterprise = ['imagery', 'designSystem', 'digital', 'social']
    .some(f => bible[f as keyof BrandBible]);
  
  if (hasEnterprise) return 'enterprise';
  
  const hasGrowth = ['logos', 'voice']
    .every(f => bible[f as keyof BrandBible]);
  
  if (hasGrowth) return 'growth';
  
  return 'starter';
}

// ═══════════════════════════════════════════════════════════════════════════
// SIMPLIFIED TYPES FOR UI
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simplified brand for display in lists/cards
 */
export interface BrandSummary {
  id: string;
  name: string;
  tagline?: string;
  tier: BrandTier;
  completeness: number;
  primaryColor: string;
  logoUrl?: string;
  updatedAt: string;
}

/**
 * Quick-create brand with minimal fields
 */
export interface QuickBrand {
  name: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  headingFont: string;
  bodyFont: string;
  logoUrl?: string;
  personality?: string[];
}

/**
 * Convert QuickBrand to full BrandBible
 */
export function quickBrandToBible(quick: QuickBrand): BrandBible {
  return {
    metadata: {
      id: crypto.randomUUID(),
      brandName: quick.name,
      tier: 'starter',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceType: 'manual',
      completeness: 25,
    },
    strategy: {
      mission: '',
      anthemOrTagline: quick.tagline || '',
      coreValues: [],
      personalityTraits: quick.personality || [],
    },
    colors: {
      mode: 'light',
      palettes: {
        primary: [{
          name: 'Primary',
          role: 'primary',
          values: { hex: quick.primaryColor },
        }],
        secondary: quick.secondaryColor ? [{
          name: 'Secondary',
          role: 'secondary',
          values: { hex: quick.secondaryColor },
        }] : undefined,
        accent: quick.accentColor ? [{
          name: 'Accent',
          role: 'accent',
          values: { hex: quick.accentColor },
        }] : undefined,
      },
    },
    typography: {
      typefaces: [
        {
          name: quick.headingFont,
          role: 'primary',
          source: 'google',
          weights: ['400', '600', '700'],
        },
        {
          name: quick.bodyFont,
          role: 'secondary',
          source: 'google',
          weights: ['400', '500'],
        },
      ],
      hierarchy: [
        { name: 'H1', typeface: quick.headingFont, weight: '700' },
        { name: 'H2', typeface: quick.headingFont, weight: '600' },
        { name: 'Body', typeface: quick.bodyFont, weight: '400' },
      ],
    },
    logos: quick.logoUrl ? {
      variants: [{
        type: 'primary',
        name: 'Primary Logo',
        usageContext: 'General use',
        assets: [{
          id: 'logo-primary',
          url: quick.logoUrl,
          altText: `${quick.name} logo`,
        }],
      }],
    } : undefined,
  };
}
