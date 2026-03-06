"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { IMPORT_STEPS, PERSONALITY_TRAITS, RENDER_STYLES } from "@/lib/constants";
import type { ImportWizardState, ExtractedBrand, CreativeDirectorBrief, PersonalityTrait } from "@/lib/types";
import VerifyStep from "@/components/VerifyStep";

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
      
      // Map to ExtractedBrand - handle both URL and PDF extraction formats
      const isPdfSource = data._source === "pdf";
      
      // Extract colors based on source
      let primaryColor, secondaryColor, accentColor, allColors: string[] = [];
      if (isPdfSource) {
        // PDF format: colors.palettes.primary[0].values.hex
        const palettes = data.colors?.palettes || {};
        primaryColor = palettes.primary?.[0]?.values?.hex;
        secondaryColor = palettes.secondary?.[0]?.values?.hex;
        accentColor = palettes.accent?.[0]?.values?.hex;
        // Collect all colors from all palettes
        allColors = [
          ...(palettes.primary || []).map((c: any) => c.values?.hex),
          ...(palettes.secondary || []).map((c: any) => c.values?.hex),
          ...(palettes.accent || []).map((c: any) => c.values?.hex),
        ].filter(Boolean);
      } else {
        // URL format: colors.primary directly
        primaryColor = data.colors?.primary;
        secondaryColor = data.colors?.secondary;
        accentColor = data.colors?.accent;
        allColors = data._raw?.colors?.allColors || [];
      }

      // Extract fonts based on source
      let headingFont, bodyFont, allFonts: string[] = [];
      if (isPdfSource) {
        // PDF format: typography.typefaces[0].name
        const typefaces = data.typography?.typefaces || [];
        headingFont = typefaces[0]?.name;
        bodyFont = typefaces[1]?.name || typefaces[0]?.name;
        allFonts = typefaces.map((t: any) => t.name).filter(Boolean);
      } else {
        // URL format: typography.heading/body
        headingFont = data.typography?.heading;
        bodyFont = data.typography?.body;
        allFonts = data._raw?.fonts?.allFonts || [];
      }

      // Extract brand name
      const brandName = isPdfSource 
        ? data.metadata?.brandName || data.naming?.primaryName
        : data.name;
      
      // Extract tagline
      const tagline = isPdfSource
        ? data.naming?.taglines?.[0]
        : data.tagline;
      
      const extracted: ExtractedBrand = {
        name: brandName,
        tagline,
        colors: {
          extracted: allColors.length > 0 ? allColors : [primaryColor, secondaryColor, accentColor].filter(Boolean),
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          background: data.colors?.background || "#ffffff",
          foreground: data.colors?.foreground || "#171717",
        },
        fonts: {
          extracted: allFonts.length > 0 ? allFonts : [headingFont, bodyFont].filter(Boolean),
          heading: headingFont,
          body: bodyFont,
        },
        logo: data.logo ? { url: data.logo, format: "png" } : undefined,
        sourceUrl: state.url,
        sourceType: state.inputType,
        confidence: {
          colors: allColors.length > 0 ? 0.9 : 0.5,
          fonts: allFonts.length > 0 ? 0.9 : 0.6,
          logo: data.logo ? 0.9 : 0,
          overall: (allColors.length > 0 && allFonts.length > 0) ? 0.85 : 0.6,
        },
        // Store full extraction output
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

  const createBrand = useMutation(api.brands.create);

  const handleApprove = async () => {
    const ext = state.extracted;
    const raw = (ext as any)?._raw || {};
    
    // Build the brand bible from extracted + raw data
    const bible = {
      // Core identity
      name: ext?.name || raw.metadata?.brandName || "Brand",
      tagline: ext?.tagline || raw.naming?.taglines?.[0] || null,
      
      // Colors
      primaryColor: ext?.colors?.primary || raw.colors?.primary?.[0]?.hex || "#6366f1",
      secondaryColor: ext?.colors?.secondary || raw.colors?.secondary?.[0]?.hex || "#8b5cf6",
      accentColor: ext?.colors?.accent || raw.colors?.accent?.[0]?.hex || "#ec4899",
      backgroundColor: ext?.colors?.background || "#ffffff",
      foregroundColor: ext?.colors?.foreground || "#171717",
      
      // Typography  
      headingFont: ext?.fonts?.heading || raw.typography?.typefaces?.[0]?.name || "Inter",
      bodyFont: ext?.fonts?.body || raw.typography?.typefaces?.[1]?.name || "Inter",
      
      // Full extracted data for brand detail page
      _raw: raw,
    };

    try {
      const brandId = await createBrand({
        name: bible.name,
        tagline: bible.tagline || undefined,
        bible,
      });
      
      router.push(`/brand/${brandId}`);
    } catch (error) {
      console.error("Failed to save brand:", error);
      updateState({ error: "Failed to save brand" });
    }
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
