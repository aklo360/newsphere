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
              ${isComplete ? "bg-green-500 text-white" : ""}
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
              <div className={`w-8 h-0.5 mx-1 ${isComplete ? "bg-green-500" : "bg-neutral-200"}`} />
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
      const type = file.type.includes("pdf") ? "pdf" : "image";
      onUpdate({ inputType: type, files: [file] });
    }
  }, [onUpdate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const type = file.type.includes("pdf") ? "pdf" : "image";
      onUpdate({ inputType: type, files: [file] });
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
          onClick={() => onUpdate({ inputType: "pdf", url: undefined })}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            state.inputType === "pdf" || state.inputType === "image"
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
      {(state.inputType === "pdf" || state.inputType === "image") && (
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
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mb-6 shadow-lg shadow-blue-500/30">
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
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-neutral-600">Fetching page</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-blue-500 animate-pulse" />
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
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-neutral-600">Processing file</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-blue-500 animate-pulse" />
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
  if (!extracted) return null;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium text-neutral-700 mb-2">Verify extracted brand</h2>
        <p className="text-sm text-neutral-400">Review what we found</p>
      </div>

      {/* Extracted Data */}
      <div className="space-y-4">
        {/* Name */}
        <div className="p-4 rounded-xl bg-white border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400 uppercase">Brand Name</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              extracted.name ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
            }`}>
              {extracted.name ? "Detected" : "Not found"}
            </span>
          </div>
          <input
            type="text"
            value={extracted.name || ""}
            onChange={(e) => onUpdate({
              extracted: { ...extracted, name: e.target.value }
            })}
            placeholder="Enter brand name"
            className="w-full h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-sm"
          />
        </div>

        {/* Colors */}
        <div className="p-4 rounded-xl bg-white border border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400 uppercase">Colors</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              extracted.colors.extracted.length > 0 ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
            }`}>
              {extracted.colors.extracted.length} found
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {extracted.colors.extracted.map((color, idx) => (
              <div 
                key={idx}
                className="w-10 h-10 rounded-lg border border-neutral-200"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {extracted.colors.extracted.length === 0 && (
              <p className="text-sm text-neutral-400">No colors detected</p>
            )}
          </div>
        </div>

        {/* Fonts */}
        <div className="p-4 rounded-xl bg-white border border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400 uppercase">Fonts</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              extracted.fonts.extracted.length > 0 ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
            }`}>
              {extracted.fonts.extracted.length} found
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {extracted.fonts.extracted.map((font, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 rounded-lg bg-neutral-100 text-xs text-neutral-600"
              >
                {font}
              </span>
            ))}
            {extracted.fonts.extracted.length === 0 && (
              <p className="text-sm text-neutral-400">No fonts detected</p>
            )}
          </div>
        </div>

        {/* Logo */}
        {extracted.logo && (
          <div className="p-4 rounded-xl bg-white border border-neutral-100">
            <span className="text-xs font-medium text-neutral-400 uppercase">Logo</span>
            <div className="mt-2 flex items-center gap-3">
              <img 
                src={extracted.logo.url} 
                alt="Logo" 
                className="h-12 object-contain"
              />
              <span className="text-xs text-green-600">Detected</span>
            </div>
          </div>
        )}

        {/* Confidence */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
          <span className="text-xs font-medium text-neutral-400 uppercase">Extraction Confidence</span>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${extracted.confidence.overall * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-neutral-700">
              {Math.round(extracted.confidence.overall * 100)}%
            </span>
          </div>
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
          Enhance with AI
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
    updateState({ step: "extracting", isExtracting: true });
    
    // TODO: Call actual extraction API
    await new Promise(r => setTimeout(r, 3000));
    
    const mockExtracted: ExtractedBrand = {
      name: "Acme Corp",
      tagline: "Building the future",
      colors: {
        extracted: ["#6366f1", "#8b5cf6", "#f5f5f5", "#171717"],
        primary: "#6366f1",
        secondary: "#8b5cf6",
        background: "#f5f5f5",
      },
      fonts: {
        extracted: ["Inter", "Space Grotesk"],
        heading: "Space Grotesk",
        body: "Inter",
      },
      sourceUrl: state.url,
      sourceType: state.inputType,
      confidence: {
        colors: 0.9,
        fonts: 0.85,
        logo: 0.7,
        overall: 0.82,
      },
    };

    updateState({ 
      step: "verify", 
      extracted: mockExtracted,
      isExtracting: false 
    });
  };

  const handleEnhance = async () => {
    updateState({ step: "enhance", isEnhancing: true });
    
    // TODO: Call AI enhancement API
    await new Promise(r => setTimeout(r, 2000));
    
    const mockBrief: CreativeDirectorBrief = {
      brandName: state.extracted?.name || "Acme Corp",
      generatedName: false,
      tagline: state.extracted?.tagline || "Building the future",
      mission: "To innovate and build",
      iconConcept: "Abstract geometric shape",
      iconDescription: "Modern abstract form",
      headingFont: state.extracted?.fonts.heading || "Space Grotesk",
      headingWeight: 600,
      bodyFont: state.extracted?.fonts.body || "Inter",
      bodyWeight: 400,
      fontReasoning: "Extracted from website",
      primaryColor: state.extracted?.colors.primary || "#6366f1",
      secondaryColor: state.extracted?.colors.secondary || "#8b5cf6",
      accentColor: "#ec4899",
      backgroundColor: state.extracted?.colors.background || "#f5f5f5",
      foregroundColor: "#171717",
      mode: "light",
      colorReasoning: "Extracted from website CSS",
      renderStyle: "gradient",
      styleNotes: "Modern gradient style",
      personality: ["professional", "innovative"] as PersonalityTrait[],
      toneProfile: { formal: 50, playful: 40, technical: 60 },
      mustHaveFeatures: [],
      brandVibe: ["modern", "professional"],
    };

    updateState({ 
      step: "preview", 
      brief: mockBrief,
      isEnhancing: false 
    });
  };

  const handleSave = async () => {
    // TODO: Save to Convex
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
      
      <main className="min-h-screen p-6">
        <div className="max-w-lg mx-auto pt-8">
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
                onNext={handleEnhance}
                onBack={() => updateState({ step: "input" })}
              />
            )}
            
            {(state.step === "enhance" || state.isEnhancing) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-neutral-700 mb-2">Enhancing with AI...</h2>
                <p className="text-sm text-neutral-400">Filling in missing details</p>
              </div>
            )}
            
            {state.step === "preview" && !state.isEnhancing && (
              <PreviewStep 
                state={state}
                onNext={handleSave}
                onBack={() => updateState({ step: "verify" })}
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
