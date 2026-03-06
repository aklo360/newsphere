"use client";

import { useState } from "react";
import type { ImportWizardState, ExtractedBrand } from "@/lib/types";

// Collapsible section component
function Section({ 
  title, 
  summary, 
  defaultOpen = false,
  children 
}: { 
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-neutral-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between bg-white hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-600">{title}</span>
          <span className="text-[10px] text-neutral-400">{summary}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 pt-0 bg-white border-t border-neutral-50">
          {children}
        </div>
      )}
    </div>
  );
}

// Color swatch component
function ColorSwatch({ color, label, size = "md" }: { color: string; label?: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  return (
    <div className="flex items-center gap-2">
      <div 
        className={`${sizeClass} rounded-lg border border-neutral-200`}
        style={{ backgroundColor: color }}
        title={color}
      />
      {label && (
        <div>
          <p className="text-[10px] text-neutral-400 uppercase">{label}</p>
          <p className="text-xs text-neutral-600 font-mono">{color}</p>
        </div>
      )}
    </div>
  );
}

export default function VerifyStep({ 
  state, 
  onUpdate, 
  onNext,
  onBack 
}: { 
  state: ImportWizardState;
  onUpdate: (updates: Partial<ImportWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const extracted = state.extracted;
  const raw = (extracted as any)?._raw || {};
  
  if (!extracted) return null;

  // Helper to count items in a section
  const countItems = (obj: any): number => {
    if (!obj) return 0;
    if (Array.isArray(obj)) return obj.length;
    if (typeof obj === "object") return Object.keys(obj).length;
    return 0;
  };

  // Get summary for each section
  const getSummary = (section: string): string => {
    const data = raw[section];
    if (!data) return "Not found";
    
    switch (section) {
      case "colors":
        // Handle both formats: palettes.primary or direct primary
        const palettes = data.palettes || data;
        const colorCount = (palettes.primary?.length || 0) + (palettes.secondary?.length || 0) + (palettes.accent?.length || 0);
        return `${colorCount} colors`;
      case "typography":
        return `${data.typefaces?.length || 0} typefaces, ${data.hierarchy?.length || 0} styles`;
      case "logos":
        return `${data.variants?.length || 0} variants`;
      case "voice":
        return `${data.traits?.length || 0} traits`;
      case "imagery":
        const themes = data.photography?.themes?.length || data.photography?.tiers?.length || 0;
        const tags = (data.photography?.positiveTags?.length || 0) + (data.photography?.negativeTags?.length || 0);
        return themes > 0 ? `${themes} themes, ${tags} tags` : "Guidelines";
      case "digital":
        return `${data.breakpoints?.length || 0} breakpoints`;
      case "social":
        return `${data.formats?.length || 0} formats`;
      case "strategy":
        return data.mission ? "Complete" : "Partial";
      default:
        return `${countItems(data)} items`;
    }
  };

  // Check if section has meaningful data
  const hasData = (section: string): boolean => {
    const data = raw[section];
    if (!data) return false;
    if (typeof data === "object" && Object.keys(data).length === 0) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium text-neutral-700 mb-2">Review your brand</h2>
        <p className="text-sm text-neutral-400">Verify essentials, expand sections for details</p>
      </div>

      {/* ESSENTIALS - Always visible */}
      <div className="p-5 rounded-xl bg-white border border-neutral-100 space-y-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-neutral-400" />
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Essentials</span>
        </div>

        {/* Name + Tagline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-neutral-400 uppercase mb-1.5 block">Brand Name</label>
            <input
              type="text"
              value={extracted.name || ""}
              onChange={(e) => onUpdate({
                extracted: { ...extracted, name: e.target.value }
              })}
              placeholder="Enter brand name"
              className="w-full h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-neutral-700"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase mb-1.5 block">Tagline</label>
            <input
              type="text"
              value={extracted.tagline || ""}
              onChange={(e) => onUpdate({
                extracted: { ...extracted, tagline: e.target.value }
              })}
              placeholder="Optional"
              className="w-full h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-neutral-700"
            />
          </div>
        </div>

        {/* Primary Colors */}
        <div>
          <label className="text-[10px] text-neutral-400 uppercase mb-2 block">Primary Colors</label>
          <div className="flex gap-3">
            <ColorSwatch color={extracted.colors.primary || "#6366f1"} label="Primary" />
            <ColorSwatch color={extracted.colors.secondary || "#8b5cf6"} label="Secondary" />
            <ColorSwatch color={extracted.colors.accent || "#ec4899"} label="Accent" />
          </div>
        </div>

        {/* Fonts */}
        <div>
          <label className="text-[10px] text-neutral-400 uppercase mb-2 block">Typography</label>
          <div className="flex gap-4">
            <div className="flex-1 p-3 rounded-lg bg-neutral-50">
              <p className="text-[10px] text-neutral-400 uppercase mb-1">Heading</p>
              <p className="text-sm text-neutral-700" style={{ fontFamily: extracted.fonts.heading }}>
                {extracted.fonts.heading || "Not set"}
              </p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-neutral-50">
              <p className="text-[10px] text-neutral-400 uppercase mb-1">Body</p>
              <p className="text-sm text-neutral-700" style={{ fontFamily: extracted.fonts.body }}>
                {extracted.fonts.body || "Not set"}
              </p>
            </div>
          </div>
        </div>

        {/* Logo */}
        {extracted.logo && (
          <div>
            <label className="text-[10px] text-neutral-400 uppercase mb-2 block">Logo</label>
            <img 
              src={extracted.logo.url} 
              alt="Logo" 
              className="h-12 object-contain"
            />
          </div>
        )}
      </div>

      {/* ADVANCED SECTIONS - Collapsible */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-neutral-300" />
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Brand Bible Sections</span>
        </div>

        {hasData("strategy") && (
          <Section title="Strategy" summary={getSummary("strategy")}>
            <div className="space-y-2 text-sm text-neutral-600">
              {raw.strategy?.mission && <p><strong>Mission:</strong> {raw.strategy.mission}</p>}
              {raw.strategy?.vision && <p><strong>Vision:</strong> {raw.strategy.vision}</p>}
              {raw.strategy?.positioning && <p><strong>Positioning:</strong> {raw.strategy.positioning}</p>}
            </div>
          </Section>
        )}

        {hasData("colors") && (
          <Section title="Color System" summary={getSummary("colors")}>
            <div className="space-y-3">
              {/* Handle both formats: palettes.primary or direct primary array */}
              {(raw.colors?.palettes?.primary || raw.colors?.primary)?.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: c.values?.hex || c.hex }} />
                  <div>
                    <p className="text-xs text-neutral-700">{c.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">{c.values?.hex || c.hex}</p>
                  </div>
                </div>
              ))}
              {(raw.colors?.palettes?.secondary || raw.colors?.secondary)?.slice(0, 3).map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: c.values?.hex || c.hex }} />
                  <div>
                    <p className="text-xs text-neutral-700">{c.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">{c.values?.hex || c.hex}</p>
                  </div>
                </div>
              ))}
              {(raw.colors?.palettes?.secondary || raw.colors?.secondary)?.length > 3 && (
                <p className="text-[10px] text-neutral-400">+{(raw.colors?.palettes?.secondary || raw.colors?.secondary).length - 3} more colors</p>
              )}
            </div>
          </Section>
        )}

        {hasData("typography") && (
          <Section title="Typography" summary={getSummary("typography")}>
            <div className="space-y-3">
              {raw.typography?.typefaces?.map((t: any, i: number) => (
                <div key={i} className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-sm font-medium text-neutral-700">{t.name}</p>
                  <p className="text-[10px] text-neutral-400">{t.role} · {t.weights?.join(", ")}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {hasData("voice") && (
          <Section title="Voice & Tone" summary={getSummary("voice")}>
            <div className="flex flex-wrap gap-2">
              {raw.voice?.traits?.map((t: any, i: number) => (
                <span key={i} className="px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-600">
                  {t.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {hasData("logos") && (
          <Section title="Logo System" summary={getSummary("logos")}>
            <div className="space-y-3">
              {/* Overview */}
              {raw.logos?.overview && (
                <p className="text-xs text-neutral-600">{raw.logos.overview}</p>
              )}
              
              {/* Logo Variants */}
              {raw.logos?.variants?.map((v: any, i: number) => (
                <div key={i} className="p-2 bg-neutral-50 rounded-lg">
                  <p className="text-xs font-medium text-neutral-700">{v.name || v.type}</p>
                  {v.usageContext && <p className="text-[10px] text-neutral-500">{v.usageContext}</p>}
                </div>
              ))}
              
              {/* Clear Space */}
              {raw.logos?.clearSpace?.formula && (
                <div className="text-[10px] text-neutral-500">
                  <strong>Clear space:</strong> {raw.logos.clearSpace.formula}
                </div>
              )}
              
              {/* Colorways */}
              {raw.logos?.colorways?.length > 0 && (
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase mb-1">Colorways</p>
                  <div className="flex flex-wrap gap-1.5">
                    {raw.logos.colorways.map((c: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] text-neutral-600">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {hasData("imagery") && (
          <Section title="Imagery" summary={getSummary("imagery")}>
            <div className="space-y-4">
              {/* Overview */}
              {raw.imagery?.overview && (
                <p className="text-xs text-neutral-600">{raw.imagery.overview}</p>
              )}
              
              {/* Photography Themes */}
              {raw.imagery?.photography?.themes?.length > 0 && (
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase mb-2">Photography Themes</p>
                  <div className="space-y-2">
                    {raw.imagery.photography.themes.map((t: any, i: number) => (
                      <div key={i} className="p-2 bg-neutral-50 rounded-lg">
                        <p className="text-xs font-medium text-neutral-700">{t.name}</p>
                        <p className="text-[10px] text-neutral-500">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Positive Tags - What they want */}
              {raw.imagery?.photography?.positiveTags?.length > 0 && (
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase mb-2">Do Use</p>
                  <div className="flex flex-wrap gap-1.5">
                    {raw.imagery.photography.positiveTags.map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Negative Tags - What they don't want */}
              {raw.imagery?.photography?.negativeTags?.length > 0 && (
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase mb-2">Avoid</p>
                  <div className="flex flex-wrap gap-1.5">
                    {raw.imagery.photography.negativeTags.map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Fallback to old format */}
              {!raw.imagery?.photography?.themes && raw.imagery?.artDirectionCorePrinciples?.slice(0, 3).map((p: string, i: number) => (
                <p key={i} className="text-xs text-neutral-600">• {p}</p>
              ))}
            </div>
          </Section>
        )}

        {hasData("digital") && (
          <Section title="Digital System" summary={getSummary("digital")}>
            <div className="space-y-2">
              {raw.digital?.breakpoints?.map((b: any, i: number) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-neutral-600">{b.name}</span>
                  <span className="text-neutral-400">{b.minWidthPx}px</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {hasData("social") && (
          <Section title="Social Media" summary={getSummary("social")}>
            <div className="flex flex-wrap gap-2">
              {raw.social?.formats?.map((f: any, i: number) => (
                <span key={i} className="px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-600">
                  {f.name} ({f.aspectRatio})
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Re-import
        </button>
        <button
          onClick={onNext}
          className="flex-1 h-11 rounded-xl bg-neutral-700 text-sm font-medium text-white hover:bg-neutral-600 transition-colors"
        >
          Save Brand
        </button>
      </div>
    </div>
  );
}
