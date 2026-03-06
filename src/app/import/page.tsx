"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useConvexAuth } from "convex/react";
import { IMPORT_STEPS, PERSONALITY_TRAITS, RENDER_STYLES } from "@/lib/constants";
import type { ImportWizardState, ExtractedBrand, CreativeDirectorBrief, PersonalityTrait } from "@/lib/types";

const LiquidBackground = dynamic(
  () => import("@/components/LiquidBackground"),
  { ssr: false }
);

// Step indicator (reused from create)
function StepIndicator({ currentStep, steps }: { 
  currentStep: string; 
  steps: typeof IMPORT_STEPS;
}) {
  const currentIdx = steps.findIndex(s => s.id === currentStep);
  
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, idx) => {
        const isActive = step.id === currentStep;
        const isComplete = idx < currentIdx;
        const isFuture = idx > currentIdx;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
              ${isActive ? "bg-neutral-700 text-white scale-110" : ""}
              ${isComplete ? "bg-neutral-500 text-white" : ""}
              ${isFuture ? "bg-neutral-200 text-neutral-400" : ""}
            `}>
              {isComplete ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${isComplete ? "bg-neutral-500" : "bg-neutral-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InputStep({ 
  state, 
  onUpdate, 
  onExtract 
}: { 
  state: ImportWizardState;
  onUpdate: (updates: Partial<ImportWizardState>) => void;
  onExtract: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onUpdate({ inputType: "file", files: [file] });
    }
  }, [onUpdate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onUpdate({ inputType: "file", files: [file] });
    }
  };

  const canExtract = state.url?.trim() || (state.files && state.files.length > 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-medium text-neutral-700 mb-2">Import your brand</h2>
        <p className="text-sm text-neutral-400">We'll extract colors, fonts, and style</p>
      </div>

      {/* Input Type Tabs */}
      <div className="flex rounded-xl bg-neutral-100 p-1">
        <button
          onClick={() => onUpdate({ inputType: "url", files: undefined })}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            state.inputType === "url" 
              ? "bg-white text-neutral-700 shadow-sm" 
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Website URL
        </button>
        <button
          onClick={() => onUpdate({ inputType: "file", url: undefined })}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            state.inputType === "file"
              ? "bg-white text-neutral-700 shadow-sm" 
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Upload File
        </button>
      </div>

      {/* URL Input */}
      {state.inputType === "url" && (
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={state.url || ""}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="https://example.com"
            className="w-full h-11 px-4 rounded-xl bg-white border border-neutral-200 text-sm text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
          />
          <p className="mt-2 text-xs text-neutral-400">
            We'll analyze the CSS to extract colors, fonts, and detect logos
          </p>
        </div>
      )}

      {/* File Upload */}
      {state.inputType === "file" && (
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-2">
            Brand Guidelines (PDF) or Logo (Image)
          </label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${dragActive 
                ? "border-neutral-400 bg-neutral-50" 
                : "border-neutral-200 hover:border-neutral-300"
              }
            `}
          >
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.svg"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {state.files && state.files.length > 0 ? (
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-neutral-700">{state.files[0].name}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {(state.files[0].size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-600">
                  Drop your file here or <span className="text-neutral-800 font-medium">browse</span>
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  PDF brand guidelines or logo image (PNG, JPG, SVG)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {state.error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <button
        onClick={onExtract}
        disabled={!canExtract}
        className="w-full h-11 rounded-xl bg-neutral-700 text-sm font-medium text-white hover:bg-neutral-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
      >
        Extract Brand
      </button>
    </div>
  );
}

function ExtractingStep({ state }: { state: ImportWizardState }) {
  const [dots, setDots] = useState("");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const source = state.inputType === "url" 
    ? state.url 
    : state.files?.[0]?.name || "file";

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-400 mb-6 shadow-lg shadow-neutral-400/20">
        <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <h2 className="text-xl font-medium text-neutral-700 mb-2">
        Extracting brand{dots}
      </h2>
      <p className="text-sm text-neutral-400 mb-2">
        Analyzing {source}
      </p>
      
      <div className="space-y-3 text-left max-w-xs mx-auto mt-8">
        {state.inputType === "url" ? (
          <>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-neutral-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-neutral-600">Fetching page</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-sky-300 animate-pulse" />
              <span className="text-neutral-600">Extracting CSS styles</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <div className="w-5 h-5 rounded-full bg-neutral-200" />
              <span>Detecting logo</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <div className="w-5 h-5 rounded-full bg-neutral-200" />
              <span>Analyzing brand</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-neutral-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-neutral-600">Processing file</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-sky-300 animate-pulse" />
              <span className="text-neutral-600">Extracting colors</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <div className="w-5 h-5 rounded-full bg-neutral-200" />
              <span>Detecting fonts</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <div className="w-5 h-5 rounded-full bg-neutral-200" />
              <span>AI analysis</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VerifyStep({ 
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
  const [newColor, setNewColor] = useState("#6366f1");
  const [newFont, setNewFont] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  
  if (!extracted) return null;

  // Color management
  const removeColor = (idx: number) => {
    const newColors = [...extracted.colors.extracted];
    newColors.splice(idx, 1);
    onUpdate({
      extracted: { ...extracted, colors: { ...extracted.colors, extracted: newColors } }
    });
  };

  const addColor = () => {
    if (!newColor) return;
    const newColors = [...extracted.colors.extracted, newColor];
    onUpdate({
      extracted: { ...extracted, colors: { ...extracted.colors, extracted: newColors } }
    });
  };

  const setColorRole = (color: string, role: "primary" | "secondary" | "accent" | "background" | "foreground") => {
    onUpdate({
      extracted: { ...extracted, colors: { ...extracted.colors, [role]: color } }
    });
  };

  // Font management
  const removeFont = (idx: number) => {
    const newFonts = [...extracted.fonts.extracted];
    newFonts.splice(idx, 1);
    onUpdate({
      extracted: { ...extracted, fonts: { ...extracted.fonts, extracted: newFonts } }
    });
  };

  const addFont = () => {
    if (!newFont.trim()) return;
    const newFonts = [...extracted.fonts.extracted, newFont.trim()];
    onUpdate({
      extracted: { ...extracted, fonts: { ...extracted.fonts, extracted: newFonts } }
    });
    setNewFont("");
  };

  const setFontRole = (font: string, role: "heading" | "body") => {
    onUpdate({
      extracted: { ...extracted, fonts: { ...extracted.fonts, [role]: font } }
    });
  };

  // Logo management
  const removeLogo = () => {
    onUpdate({
      extracted: { ...extracted, logo: undefined }
    });
  };

  const addLogo = () => {
    if (!logoUrl.trim()) return;
    onUpdate({
      extracted: { ...extracted, logo: { url: logoUrl.trim(), format: "png" } }
    });
    setLogoUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium text-neutral-700 mb-2">Verify extracted brand</h2>
        <p className="text-sm text-neutral-400">Review and refine what we found</p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="p-4 rounded-xl bg-white border border-neutral-100">
          <span className="text-xs font-medium text-neutral-400 uppercase">Brand Name</span>
          <input
            type="text"
            value={extracted.name || ""}
            onChange={(e) => onUpdate({
              extracted: { ...extracted, name: e.target.value }
            })}
            placeholder="Enter brand name"
            className="w-full h-10 px-3 mt-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm"
          />
        </div>

        {/* Colors - Enhanced */}
        <div className="p-4 rounded-xl bg-white border border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400 uppercase">Brand Colors</span>
            <span className="text-xs text-neutral-400">{extracted.colors.extracted.length} colors</span>
          </div>
          
          {/* Color swatches with remove + role assignment */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {extracted.colors.extracted.map((color, idx) => (
                <div key={idx} className="relative group">
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-neutral-200 cursor-pointer transition-all hover:scale-105"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                  {/* Remove button */}
                  <button
                    onClick={() => removeColor(idx)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  {/* Role indicator */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {extracted.colors.primary === color && <div className="w-2 h-2 rounded-full bg-blue-500" title="Primary" />}
                    {extracted.colors.secondary === color && <div className="w-2 h-2 rounded-full bg-purple-500" title="Secondary" />}
                    {extracted.colors.accent === color && <div className="w-2 h-2 rounded-full bg-pink-500" title="Accent" />}
                  </div>
                </div>
              ))}
              
              {/* Add color */}
              <div className="flex items-center gap-1">
                <input 
                  type="color" 
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-neutral-200 cursor-pointer"
                />
                <button
                  onClick={addColor}
                  className="w-8 h-12 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Role assignment */}
            {extracted.colors.extracted.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase">Primary</label>
                  <select 
                    value={extracted.colors.primary || ""}
                    onChange={(e) => setColorRole(e.target.value, "primary")}
                    className="w-full h-8 text-xs rounded border border-neutral-200 bg-white"
                  >
                    <option value="">Select...</option>
                    {extracted.colors.extracted.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase">Secondary</label>
                  <select 
                    value={extracted.colors.secondary || ""}
                    onChange={(e) => setColorRole(e.target.value, "secondary")}
                    className="w-full h-8 text-xs rounded border border-neutral-200 bg-white"
                  >
                    <option value="">Select...</option>
                    {extracted.colors.extracted.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase">Accent</label>
                  <select 
                    value={extracted.colors.accent || ""}
                    onChange={(e) => setColorRole(e.target.value, "accent")}
                    className="w-full h-8 text-xs rounded border border-neutral-200 bg-white"
                  >
                    <option value="">Select...</option>
                    {extracted.colors.extracted.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fonts - Enhanced */}
        <div className="p-4 rounded-xl bg-white border border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400 uppercase">Typography</span>
            <span className="text-xs text-neutral-400">{extracted.fonts.extracted.length} fonts</span>
          </div>
          
          <div className="space-y-3">
            {/* Font list with remove */}
            <div className="flex flex-wrap gap-2">
              {extracted.fonts.extracted.map((font, idx) => (
                <div key={idx} className="relative group">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 text-xs text-neutral-600">
                    {font}
                    {extracted.fonts.heading === font && <span className="text-[10px] text-blue-500">(H)</span>}
                    {extracted.fonts.body === font && <span className="text-[10px] text-green-500">(B)</span>}
                  </span>
                  <button
                    onClick={() => removeFont(idx)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {/* Add font */}
              <div className="flex items-center gap-1">
                <input 
                  type="text"
                  value={newFont}
                  onChange={(e) => setNewFont(e.target.value)}
                  placeholder="Add font..."
                  className="w-24 h-8 px-2 text-xs rounded-lg border border-neutral-200"
                  onKeyDown={(e) => e.key === "Enter" && addFont()}
                />
                <button
                  onClick={addFont}
                  className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500"
                >
                  +
                </button>
              </div>
            </div>

            {/* Font role assignment */}
            {extracted.fonts.extracted.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase">Heading Font</label>
                  <select 
                    value={extracted.fonts.heading || ""}
                    onChange={(e) => setFontRole(e.target.value, "heading")}
                    className="w-full h-8 text-xs rounded border border-neutral-200 bg-white"
                  >
                    <option value="">Select...</option>
                    {extracted.fonts.extracted.map((f, i) => (
                      <option key={i} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase">Body Font</label>
                  <select 
                    value={extracted.fonts.body || ""}
                    onChange={(e) => setFontRole(e.target.value, "body")}
                    className="w-full h-8 text-xs rounded border border-neutral-200 bg-white"
                  >
                    <option value="">Select...</option>
                    {extracted.fonts.extracted.map((f, i) => (
                      <option key={i} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logo - Enhanced */}
        <div className="p-4 rounded-xl bg-white border border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400 uppercase">Logo</span>
          </div>
          
          {extracted.logo ? (
            <div className="flex items-center gap-3">
              <div className="relative group">
                <img 
                  src={extracted.logo.url} 
                  alt="Logo" 
                  className="h-16 object-contain rounded-lg border border-neutral-200 p-2 bg-neutral-50"
                />
                <button
                  onClick={removeLogo}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
              <span className="text-xs text-neutral-400 truncate max-w-[200px]">{extracted.logo.url}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Enter logo URL..."
                className="flex-1 h-10 px-3 text-sm rounded-lg border border-neutral-200"
              />
              <button
                onClick={addLogo}
                className="h-10 px-4 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-sm"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
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
          Approve
        </button>
      </div>
    </div>
  );
}

function PreviewStep({ 
  state, 
  onNext,
  onBack 
}: { 
  state: ImportWizardState;
  onNext: () => void;
  onBack: () => void;
}) {
  const brief = state.brief;
  if (!brief) return null;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium text-neutral-700 mb-2">Brand ready!</h2>
        <p className="text-sm text-neutral-400">Review your enhanced brand</p>
      </div>

      {/* Same preview as create flow */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        <div 
          className="p-8 text-center"
          style={{ backgroundColor: brief.backgroundColor }}
        >
          <h3 
            className="text-3xl font-bold mb-2"
            style={{ 
              color: brief.foregroundColor,
              fontFamily: brief.headingFont,
              fontWeight: brief.headingWeight 
            }}
          >
            {brief.brandName}
          </h3>
          {brief.tagline && (
            <p 
              className="text-sm opacity-70"
              style={{ color: brief.foregroundColor }}
            >
              {brief.tagline}
            </p>
          )}
        </div>

        <div className="p-6 space-y-4">
          {/* Colors */}
          <div>
            <h4 className="text-xs font-medium text-neutral-400 uppercase mb-2">Colors</h4>
            <div className="flex gap-2">
              {[brief.primaryColor, brief.secondaryColor, brief.accentColor].map((color, idx) => (
                <div 
                  key={idx}
                  className="flex-1 h-10 rounded-lg"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <h4 className="text-xs font-medium text-neutral-400 uppercase mb-2">Typography</h4>
            <p style={{ fontFamily: brief.headingFont }} className="text-lg font-semibold">
              {brief.headingFont}
            </p>
            <p style={{ fontFamily: brief.bodyFont }} className="text-sm text-neutral-600">
              {brief.bodyFont}
            </p>
          </div>

          {/* Style */}
          <div>
            <h4 className="text-xs font-medium text-neutral-400 uppercase mb-2">Style</h4>
            <span className="px-3 py-1.5 rounded-lg bg-neutral-700 text-white text-xs font-medium">
              {RENDER_STYLES[brief.renderStyle].name}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Back
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

export default function ImportPage() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  const [state, setState] = useState<ImportWizardState>({
    step: "input",
    inputType: "url",
    isExtracting: false,
    isEnhancing: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  const updateState = (updates: Partial<ImportWizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleExtract = async () => {
    updateState({ step: "extracting", isExtracting: true, error: undefined });
    
    try {
      let data: any;
      
      // Handle PDF file upload
      if (state.inputType === "file" && state.files?.[0]) {
        const file = state.files[0];
        const isPdf = file.name.toLowerCase().endsWith(".pdf");
        
        if (isPdf) {
          // Use PDF extraction endpoint
          const formData = new FormData();
          formData.append("file", file);
          
          const res = await fetch("/api/extract-pdf", {
            method: "POST",
            body: formData,
          });
          
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "PDF extraction failed");
          }
          
          data = await res.json();
        } else {
          // TODO: Handle logo/image file upload
          throw new Error("Image upload not yet supported. Please use URL or PDF.");
        }
      } else {
        // URL extraction
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: state.url }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Extraction failed");
        }
        
        data = await res.json();
      }
      
      // Map Creative Director output to ExtractedBrand
      // API returns: colors.primary/secondary/accent/background/foreground
      // And _raw.colors.allColors for the full palette
      // PDF extraction returns colors.palette as array of {name, hex, role}
      const rawColors = data._raw?.colors?.allColors 
        || data.colors?.palette?.map((c: any) => c.hex || c)
        || data._raw?.colors?.hexValues
        || [];
      const rawFonts = data._raw?.fonts?.allFonts 
        || [data.typography?.primary?.family, data.typography?.secondary?.family].filter(Boolean)
        || data._raw?.fonts
        || [];
      
      const extracted: ExtractedBrand = {
        name: data.name,
        tagline: data.tagline,
        colors: {
          // Use allColors from raw data, or build from named colors
          extracted: rawColors.length > 0 
            ? rawColors 
            : [data.colors?.primary, data.colors?.secondary, data.colors?.accent, data.colors?.background, data.colors?.foreground].filter(Boolean),
          primary: data.colors?.primary,
          secondary: data.colors?.secondary,
          background: data.colors?.background,
          foreground: data.colors?.foreground,
        },
        fonts: {
          // Use allFonts from raw data for full list
          extracted: rawFonts.length > 0 
            ? rawFonts 
            : [data.typography?.heading, data.typography?.body].filter(Boolean),
          heading: data.typography?.heading,
          body: data.typography?.body,
        },
        logo: data.logo ? { url: data.logo, format: "png" } : undefined,
        sourceUrl: state.url,
        sourceType: state.inputType,
        confidence: {
          colors: rawColors.length > 0 ? 0.9 : 0.5,
          fonts: rawFonts.length > 0 ? 0.9 : 0.6,
          logo: data.logo ? 0.9 : 0,
          overall: (rawColors.length > 0 && rawFonts.length > 0) ? 0.85 : 0.6,
        },
        // Store full Creative Director output for enhance step
        _raw: data,
      };

      updateState({ 
        step: "verify", 
        extracted,
        isExtracting: false 
      });
    } catch (error) {
      console.error("Extraction error:", error);
      updateState({ 
        step: "input",
        isExtracting: false,
        error: error instanceof Error ? error.message : "Extraction failed"
      });
    }
  };

  const handleApprove = async () => {
    // Convert extracted data to brief and save
    const ext = state.extracted;
    const raw = (ext as any)?._raw;
    
    const colors = raw?.colors || {};
    const typography = raw?.typography || {};
    const style = raw?.style || {};
    
    const brief: CreativeDirectorBrief = {
      brandName: raw?.name || ext?.name || "Brand",
      generatedName: !raw?.name,
      tagline: raw?.tagline || null,
      mission: raw?.concept || null,
      iconConcept: "Analyzed from website",
      iconDescription: style.reasoning || "Brand visual identity",
      headingFont: typography.heading || "Inter",
      headingWeight: typography.headingWeight || 600,
      bodyFont: typography.body || "Inter",
      bodyWeight: typography.bodyWeight || 400,
      fontReasoning: typography.reasoning || "Selected by AI Creative Director",
      primaryColor: colors.primary || "#6366f1",
      secondaryColor: colors.secondary || "#8b5cf6",
      accentColor: colors.accent || "#ec4899",
      backgroundColor: colors.background || "#ffffff",
      foregroundColor: colors.foreground || "#171717",
      mode: colors.mode || "light",
      colorReasoning: colors.reasoning || "Analyzed by AI Creative Director",
      renderStyle: style.preset || "gradient",
      styleNotes: style.reasoning || "Modern style",
      personality: (raw?.personality || ["professional", "innovative"]) as PersonalityTrait[],
      toneProfile: { formal: 50, playful: 50, technical: 50 },
      mustHaveFeatures: [],
      brandVibe: raw?.personality || ["modern"],
    };

    // TODO: Save to Convex
    console.log("Saving brand:", brief);
    router.push("/");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f0f0f4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {mounted && <LiquidBackground />}
      <div className="fixed inset-0 -z-20 bg-[#f0f0f4]" />
      
      <main className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-lg w-full">
          {/* Back link */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-600 mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>

          {/* Step indicator */}
          <StepIndicator currentStep={state.step} steps={IMPORT_STEPS} />

          {/* Card */}
          <div className="
            relative p-6 rounded-2xl
            bg-white/60 backdrop-blur-xl
            border border-white/60
            shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
          ">
            <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            
            {state.step === "input" && (
              <InputStep 
                state={state} 
                onUpdate={updateState}
                onExtract={handleExtract}
              />
            )}
            
            {state.step === "extracting" && (
              <ExtractingStep state={state} />
            )}
            
            {state.step === "verify" && (
              <VerifyStep 
                state={state}
                onUpdate={updateState}
                onNext={handleApprove}
                onBack={() => updateState({ step: "input" })}
              />
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-[10px] text-neutral-400/40 flex items-center justify-center gap-1">
            <span>© 2026</span>
            <span>·</span>
            <span>Built by</span>
            <a 
              href="https://x.com/aklolabs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-neutral-400/60 transition-colors"
            >
              AKLO Labs
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
