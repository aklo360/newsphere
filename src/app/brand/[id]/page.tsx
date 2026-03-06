"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const LiquidBackground = dynamic(
  () => import("@/components/LiquidBackground"),
  { ssr: false }
);

export default function BrandDetailPage() {
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  
  const brandId = params.id as Id<"brands">;
  const brand = useQuery(api.brands.get, brandId ? { id: brandId } : "skip");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !mounted) {
    return (
      <main className="min-h-screen bg-[#f0f0f4] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated) return null;

  if (brand === undefined) {
    return (
      <main className="min-h-screen bg-[#f0f0f4] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin" />
      </main>
    );
  }

  if (brand === null) {
    return (
      <>
        <LiquidBackground />
        <div className="fixed inset-0 -z-20 bg-[#f0f0f4]" />
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-xl font-medium text-neutral-600 mb-2">Brand not found</h1>
            <Link href="/onboard" className="text-sm text-neutral-400 hover:text-neutral-600">
              Go back
            </Link>
          </div>
        </main>
      </>
    );
  }

  const bible = brand.bible || {};
  const colors = bible.colors || {};
  const typography = bible.typography || {};

  return (
    <>
      {mounted && <LiquidBackground />}
      <div className="fixed inset-0 -z-20 bg-[#f0f0f4]" />
      
      <main className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link 
              href="/onboard"
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </Link>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wide">
              {brand.status}
            </span>
          </div>

          {/* Brand Header Card */}
          <div className="
            relative p-8 rounded-2xl mb-6
            bg-white/50 backdrop-blur-xl
            border border-white/60
            shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
          ">
            <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            
            <div className="flex items-start gap-6">
              {/* Brand Preview */}
              <div 
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ 
                  backgroundColor: bible.primaryColor || "#6366f1",
                  color: bible.foregroundColor || "#fff"
                }}
              >
                {brand.name.charAt(0)}
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-neutral-700 mb-1">
                  {brand.name}
                </h1>
                {brand.tagline && (
                  <p className="text-sm text-neutral-400 mb-4">{brand.tagline}</p>
                )}
                
                {/* Quick color preview */}
                <div className="flex gap-2">
                  {[bible.primaryColor, bible.secondaryColor, bible.accentColor].filter(Boolean).map((color, idx) => (
                    <div 
                      key={idx}
                      className="w-8 h-8 rounded-lg border border-white/50"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Brand Bible Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colors */}
            <div className="
              relative p-6 rounded-2xl
              bg-white/50 backdrop-blur-xl
              border border-white/60
              shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
            ">
              <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              
              <h2 className="text-sm font-medium text-neutral-600 mb-4 tracking-wide">Colors</h2>
              
              <div className="space-y-3">
                {bible.primaryColor && (
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg border border-white/50"
                      style={{ backgroundColor: bible.primaryColor }}
                    />
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase">Primary</p>
                      <p className="text-xs text-neutral-600 font-mono">{bible.primaryColor}</p>
                    </div>
                  </div>
                )}
                {bible.secondaryColor && (
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg border border-white/50"
                      style={{ backgroundColor: bible.secondaryColor }}
                    />
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase">Secondary</p>
                      <p className="text-xs text-neutral-600 font-mono">{bible.secondaryColor}</p>
                    </div>
                  </div>
                )}
                {bible.accentColor && (
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg border border-white/50"
                      style={{ backgroundColor: bible.accentColor }}
                    />
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase">Accent</p>
                      <p className="text-xs text-neutral-600 font-mono">{bible.accentColor}</p>
                    </div>
                  </div>
                )}
                {bible.backgroundColor && (
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg border border-neutral-200"
                      style={{ backgroundColor: bible.backgroundColor }}
                    />
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase">Background</p>
                      <p className="text-xs text-neutral-600 font-mono">{bible.backgroundColor}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Typography */}
            <div className="
              relative p-6 rounded-2xl
              bg-white/50 backdrop-blur-xl
              border border-white/60
              shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
            ">
              <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              
              <h2 className="text-sm font-medium text-neutral-600 mb-4 tracking-wide">Typography</h2>
              
              <div className="space-y-4">
                {bible.headingFont && (
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase mb-1">Heading</p>
                    <p 
                      className="text-xl text-neutral-700"
                      style={{ fontFamily: bible.headingFont, fontWeight: bible.headingWeight || 600 }}
                    >
                      {bible.headingFont}
                    </p>
                  </div>
                )}
                {bible.bodyFont && (
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase mb-1">Body</p>
                    <p 
                      className="text-base text-neutral-600"
                      style={{ fontFamily: bible.bodyFont, fontWeight: bible.bodyWeight || 400 }}
                    >
                      {bible.bodyFont}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Style */}
            <div className="
              relative p-6 rounded-2xl
              bg-white/50 backdrop-blur-xl
              border border-white/60
              shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
            ">
              <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              
              <h2 className="text-sm font-medium text-neutral-600 mb-4 tracking-wide">Style</h2>
              
              <div className="space-y-3">
                {bible.renderStyle && (
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase mb-1">Render Style</p>
                    <span className="inline-block px-3 py-1 rounded-lg bg-neutral-100 text-xs text-neutral-600">
                      {bible.renderStyle}
                    </span>
                  </div>
                )}
                {bible.mode && (
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase mb-1">Mode</p>
                    <span className="inline-block px-3 py-1 rounded-lg bg-neutral-100 text-xs text-neutral-600">
                      {bible.mode}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Personality */}
            {bible.personality && bible.personality.length > 0 && (
              <div className="
                relative p-6 rounded-2xl
                bg-white/50 backdrop-blur-xl
                border border-white/60
                shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
              ">
                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                
                <h2 className="text-sm font-medium text-neutral-600 mb-4 tracking-wide">Personality</h2>
                
                <div className="flex flex-wrap gap-2">
                  {bible.personality.map((trait: string, idx: number) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-neutral-100 text-xs text-neutral-600"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Raw Data (collapsible) */}
          {bible._raw && (
            <details className="mt-6">
              <summary className="text-[10px] text-neutral-400 uppercase tracking-wide cursor-pointer hover:text-neutral-600">
                View raw data
              </summary>
              <pre className="mt-2 p-4 rounded-xl bg-white/50 border border-white/60 text-[10px] text-neutral-600 overflow-auto max-h-96">
                {JSON.stringify(bible._raw, null, 2)}
              </pre>
            </details>
          )}

          {/* Footer */}
          <div className="mt-12 text-[10px] text-neutral-400/40 flex items-center justify-center gap-1">
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
