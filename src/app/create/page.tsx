"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useConvexAuth } from "convex/react";
import { 
  CREATE_STEPS, 
  INDUSTRIES, 
  PERSONALITY_TRAITS,
  FONT_LIBRARY,
  RENDER_STYLES 
} from "@/lib/constants";
import type { 
  PersonalityTrait, 
  CreateWizardState,
  CreativeDirectorBrief,
  BrandBible 
} from "@/lib/types";

const LiquidBackground = dynamic(
  () => import("@/components/LiquidBackground"),
  { ssr: false }
);

// Step components
function StepIndicator({ currentStep, steps }: { 
  currentStep: string; 
  steps: typeof CREATE_STEPS;
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

function BasicsStep({ 
  state, 
  onUpdate, 
  onNext 
}: { 
  state: CreateWizardState;
  onUpdate: (updates: Partial<CreateWizardState>) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-medium text-neutral-700 mb-2">Let's create your brand</h2>
        <p className="text-sm text-neutral-400">Tell us about your vision</p>
      </div>

      {/* Brand Name (optional) */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-2">
          Brand Name <span className="text-neutral-300">(optional - AI can generate)</span>
        </label>
        <input
          type="text"
          value={state.name || ""}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="e.g., Lumina, Nexus, Bloom"
          className="w-full h-11 px-4 rounded-xl bg-white border border-neutral-200 text-sm text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
        />
      </div>

      {/* Concept (required) */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-2">
          Brand Concept <span className="text-red-400">*</span>
        </label>
        <textarea
          value={state.concept}
          onChange={(e) => onUpdate({ concept: e.target.value })}
          placeholder="Describe your brand in 1-2 sentences. What does it do? What makes it unique?

e.g., 'A luxury skincare brand with an iridescent glass aesthetic, targeting women 25-45 who value natural ingredients'"
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-sm text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all resize-none"
        />
      </div>

      {/* Industry */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-2">Industry</label>
        <select
          value={state.industry || ""}
          onChange={(e) => onUpdate({ industry: e.target.value })}
          className="w-full h-11 px-4 rounded-xl bg-white border border-neutral-200 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
        >
          <option value="">Select industry...</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-2">
          Target Audience <span className="text-neutral-300">(optional)</span>
        </label>
        <input
          type="text"
          value={state.targetAudience || ""}
          onChange={(e) => onUpdate({ targetAudience: e.target.value })}
          placeholder="e.g., Tech-savvy millennials, Small business owners"
          className="w-full h-11 px-4 rounded-xl bg-white border border-neutral-200 text-sm text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!state.concept.trim()}
        className="w-full h-11 rounded-xl bg-neutral-700 text-sm font-medium text-white hover:bg-neutral-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

function PersonalityStep({ 
  state, 
  onUpdate, 
  onNext,
  onBack 
}: { 
  state: CreateWizardState;
  onUpdate: (updates: Partial<CreateWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggleTrait = (trait: PersonalityTrait) => {
    const current = state.personality || [];
    if (current.includes(trait)) {
      onUpdate({ personality: current.filter(t => t !== trait) });
    } else if (current.length < 5) {
      onUpdate({ personality: [...current, trait] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-medium text-neutral-700 mb-2">Define your brand personality</h2>
        <p className="text-sm text-neutral-400">Select up to 5 traits that describe your brand</p>
      </div>

      {/* Personality Grid */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.entries(PERSONALITY_TRAITS) as [PersonalityTrait, typeof PERSONALITY_TRAITS[PersonalityTrait]][]).map(([key, config]) => {
          const isSelected = state.personality?.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleTrait(key)}
              className={`
                p-3 rounded-xl border-2 text-left transition-all
                ${isSelected 
                  ? "border-neutral-700 bg-neutral-50" 
                  : "border-neutral-100 hover:border-neutral-200 bg-white"
                }
              `}
            >
              <div className="text-xs font-medium text-neutral-700">{config.name}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{config.description}</div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-neutral-400">
        {state.personality?.length || 0} / 5 selected
      </p>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!state.personality?.length}
          className="flex-1 h-11 rounded-xl bg-neutral-700 text-sm font-medium text-white hover:bg-neutral-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
        >
          Generate Brand
        </button>
      </div>
    </div>
  );
}

function GeneratingStep({ state }: { state: CreateWizardState }) {
  const [dots, setDots] = useState("");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-6 shadow-lg shadow-purple-500/30">
        <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <h2 className="text-xl font-medium text-neutral-700 mb-2">
        Creating your brand{dots}
      </h2>
      <p className="text-sm text-neutral-400 mb-8">
        Our AI Creative Director is making all the decisions
      </p>
      
      <div className="space-y-3 text-left max-w-xs mx-auto">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-neutral-600">Analyzing brand concept</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-neutral-600">Selecting typography</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-300">
          <div className="w-5 h-5 rounded-full bg-neutral-200" />
          <span>Generating color palette</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-300">
          <div className="w-5 h-5 rounded-full bg-neutral-200" />
          <span>Defining voice & tone</span>
        </div>
      </div>
    </div>
  );
}

function PreviewStep({ 
  state, 
  onNext,
  onBack 
}: { 
  state: CreateWizardState;
  onNext: () => void;
  onBack: () => void;
}) {
  const brief = state.brief;
  
  if (!brief) return null;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium text-neutral-700 mb-2">Your brand is ready!</h2>
        <p className="text-sm text-neutral-400">Review and save your Brand Bible</p>
      </div>

      {/* Brand Preview Card */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        {/* Header with name */}
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
              style={{ 
                color: brief.foregroundColor,
                fontFamily: brief.bodyFont 
              }}
            >
              {brief.tagline}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          {/* Colors */}
          <div>
            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Colors</h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <div 
                  className="h-12 rounded-lg mb-1"
                  style={{ backgroundColor: brief.primaryColor }}
                />
                <p className="text-[10px] text-neutral-400 text-center">Primary</p>
              </div>
              <div className="flex-1">
                <div 
                  className="h-12 rounded-lg mb-1"
                  style={{ backgroundColor: brief.secondaryColor }}
                />
                <p className="text-[10px] text-neutral-400 text-center">Secondary</p>
              </div>
              <div className="flex-1">
                <div 
                  className="h-12 rounded-lg mb-1"
                  style={{ backgroundColor: brief.accentColor }}
                />
                <p className="text-[10px] text-neutral-400 text-center">Accent</p>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div>
            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Typography</h4>
            <div className="space-y-2">
              <div 
                className="text-lg"
                style={{ fontFamily: brief.headingFont, fontWeight: brief.headingWeight }}
              >
                {brief.headingFont} — Headlines
              </div>
              <div 
                className="text-sm text-neutral-600"
                style={{ fontFamily: brief.bodyFont, fontWeight: brief.bodyWeight }}
              >
                {brief.bodyFont} — Body text and paragraphs
              </div>
            </div>
          </div>

          {/* Personality */}
          <div>
            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Personality</h4>
            <div className="flex flex-wrap gap-2">
              {brief.personality.map((trait) => (
                <span 
                  key={trait}
                  className="px-2 py-1 rounded-full bg-neutral-100 text-xs text-neutral-600"
                >
                  {PERSONALITY_TRAITS[trait].name}
                </span>
              ))}
            </div>
          </div>

          {/* Render Style */}
          <div>
            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Style</h4>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-neutral-700 text-white text-xs font-medium">
                {RENDER_STYLES[brief.renderStyle].name}
              </span>
              <span className="text-xs text-neutral-400">
                {RENDER_STYLES[brief.renderStyle].description}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Regenerate
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

export default function CreatePage() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  const [state, setState] = useState<CreateWizardState>({
    step: "basics",
    concept: "",
    personality: [],
    isGenerating: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  const updateState = (updates: Partial<CreateWizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const goToStep = (step: CreateWizardState["step"]) => {
    updateState({ step });
  };

  const handleGenerate = async () => {
    updateState({ step: "generating", isGenerating: true });
    
    // TODO: Call actual AI Creative Director API
    // For now, simulate with mock data
    await new Promise(r => setTimeout(r, 3000));
    
    const mockBrief: CreativeDirectorBrief = {
      brandName: state.name || "Lumina",
      generatedName: !state.name,
      tagline: "Illuminate Your Potential",
      mission: "To empower individuals through innovative solutions",
      iconConcept: "Abstract light burst with flowing energy lines",
      iconDescription: "A dynamic burst of light rays emanating from a central point",
      headingFont: "Space Grotesk",
      headingWeight: 600,
      bodyFont: "Inter",
      bodyWeight: 400,
      fontReasoning: "Space Grotesk for bold tech feel, Inter for readability",
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      accentColor: "#ec4899",
      backgroundColor: "#fafafa",
      foregroundColor: "#171717",
      mode: "light",
      colorReasoning: "Purple gradient for innovation, pink accent for energy",
      renderStyle: "gradient",
      styleNotes: "Modern gradient style with subtle depth",
      personality: state.personality as PersonalityTrait[],
      toneProfile: { formal: 40, playful: 60, technical: 50 },
      mustHaveFeatures: ["Light burst icon", "Modern typography"],
      brandVibe: ["innovative", "energetic", "modern"],
    };

    updateState({ 
      step: "preview", 
      brief: mockBrief,
      isGenerating: false 
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
          <StepIndicator currentStep={state.step} steps={CREATE_STEPS} />

          {/* Card */}
          <div className="
            relative p-6 rounded-2xl
            bg-white/60 backdrop-blur-xl
            border border-white/60
            shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
          ">
            <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            
            {state.step === "basics" && (
              <BasicsStep 
                state={state} 
                onUpdate={updateState}
                onNext={() => goToStep("personality")}
              />
            )}
            
            {state.step === "personality" && (
              <PersonalityStep 
                state={state} 
                onUpdate={updateState}
                onNext={handleGenerate}
                onBack={() => goToStep("basics")}
              />
            )}
            
            {state.step === "generating" && (
              <GeneratingStep state={state} />
            )}
            
            {state.step === "preview" && (
              <PreviewStep 
                state={state}
                onNext={handleSave}
                onBack={() => goToStep("personality")}
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
