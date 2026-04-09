"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const LiquidBackground = dynamic(
  () => import("@/components/LiquidBackground"),
  { ssr: false }
);

export default function OnboardPage() {
  return (
    <>
      <LiquidBackground />
      <div className="fixed inset-0 -z-20 bg-[#f0f0f4]" />
      
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-16 flex flex-col items-center">
          <Image
            src="/logomark.png"
            alt="NewSphere"
            width={80}
            height={80}
            className="mb-4 drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]"
            priority
          />
          <h1 className="text-[28px] font-semibold tracking-[0.02em] text-neutral-400 mb-1.5">
            NewSphere
          </h1>
          <p className="text-[12px] tracking-[0.15em] text-neutral-400/70 font-normal">
            Agentic Creative Agency
          </p>
        </div>

        {/* Glass Cards */}
        <div className="flex flex-col md:flex-row gap-5 max-w-2xl w-full">
          {/* Card 1: Create */}
          <Link href="/create" className="flex-1 group">
            <div className="
              relative p-6 rounded-2xl cursor-pointer
              bg-white/50 backdrop-blur-xl
              border border-white/60
              shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
              hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]
              hover:bg-white/60
              transition-all duration-500 ease-out
              hover:-translate-y-0.5
            ">
              <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              
              <div className="relative">
                <div className="w-8 h-8 mb-5 rounded-lg bg-white/60 border border-white/50 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                  <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                </div>

                <h2 className="text-sm font-medium text-neutral-600 mb-1.5 tracking-wide">
                  I need a brand
                </h2>
                <p className="text-[11px] text-neutral-400 mb-5 leading-relaxed">
                  AI-powered brand creation from scratch
                </p>

                <ul className="space-y-2 mb-5 text-[10px] text-neutral-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-neutral-300" />
                    Generate name & tagline
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-neutral-300" />
                    Create visual identity
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-neutral-300" />
                    Build Brand Bible
                  </li>
                </ul>

                <div className="
                  h-8 rounded-lg
                  bg-neutral-700/90
                  text-[10px] font-medium text-white/90 tracking-wide
                  flex items-center justify-center
                  shadow-[0_1px_3px_rgba(0,0,0,0.1)]
                  group-hover:bg-neutral-600/90
                  transition-colors duration-300
                ">
                  Start Creating
                </div>
              </div>
            </div>
          </Link>

          {/* Card 2: Import */}
          <Link href="/import" className="flex-1 group">
            <div className="
              relative p-6 rounded-2xl cursor-pointer
              bg-white/50 backdrop-blur-xl
              border border-white/60
              shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
              hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]
              hover:bg-white/60
              transition-all duration-500 ease-out
              hover:-translate-y-0.5
            ">
              <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              
              <div className="relative">
                <div className="w-8 h-8 mb-5 rounded-lg bg-white/60 border border-white/50 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                  <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>

                <h2 className="text-sm font-medium text-neutral-600 mb-1.5 tracking-wide">
                  I have a brand
                </h2>
                <p className="text-[11px] text-neutral-400 mb-5 leading-relaxed">
                  Import existing brand for AI content
                </p>

                <ul className="space-y-2 mb-5 text-[10px] text-neutral-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-neutral-300" />
                    Upload guidelines PDF
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-neutral-300" />
                    Import from URL
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-neutral-300" />
                    Convert to Brand Bible
                  </li>
                </ul>

                <div className="
                  h-8 rounded-lg
                  bg-white/70 backdrop-blur-sm
                  border border-neutral-200/50
                  text-[10px] font-medium text-neutral-500 tracking-wide
                  flex items-center justify-center
                  shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]
                  group-hover:bg-white/80
                  transition-all duration-300
                ">
                  Import Brand
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-20 text-[11px] tracking-[0.12em] text-neutral-400/60 uppercase font-normal">
          Automate your branding & marketing
        </p>
        <div className="mt-8 text-[10px] text-neutral-400/40 flex items-center gap-1">
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
      </main>
    </>
  );
}
