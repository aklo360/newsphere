"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LiquidBackground from "@/components/LiquidBackground";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && <LiquidBackground />}
      
      {/* Dark fallback */}
      <div className="fixed inset-0 -z-20 bg-[#0a0a0c]" />
      
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-16 flex flex-col items-center">
          <Image
            src="/logomark.png"
            alt="NewSphere"
            width={80}
            height={80}
            className="mb-4"
            priority
          />
          <h1 className="text-[28px] font-semibold tracking-[0.02em] text-white/90 mb-1.5">
            NewSphere
          </h1>
          <p className="text-[11px] tracking-[0.2em] text-white/40 font-light">
            Agentic Creative Agency
          </p>
        </div>

        {/* Glass Cards - Dark glassmorphism */}
        <div className="flex flex-col md:flex-row gap-5 max-w-2xl w-full">
          {/* Card 1: Create */}
          <Link href="/create" className="flex-1 group">
            <div className="
              relative p-6 rounded-2xl cursor-pointer
              bg-white/[0.03] backdrop-blur-xl
              border border-white/[0.08]
              shadow-[0_0_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]
              hover:bg-white/[0.06]
              hover:border-white/[0.12]
              hover:shadow-[0_0_40px_rgba(100,80,180,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]
              transition-all duration-500 ease-out
              hover:-translate-y-0.5
            ">
              {/* Rim highlight */}
              <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="relative">
                {/* Icon */}
                <div className="w-8 h-8 mb-5 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>

                <h2 className="text-sm font-medium text-white/80 mb-1.5 tracking-wide">
                  I need a brand
                </h2>
                <p className="text-[11px] text-white/40 mb-5 leading-relaxed">
                  AI-powered brand creation from scratch
                </p>

                <ul className="space-y-2 mb-5 text-[10px] text-white/35">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    Generate name & tagline
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    Create visual identity
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    Build Brand Bible
                  </li>
                </ul>

                <div className="
                  h-8 rounded-lg
                  bg-white/10 backdrop-blur-sm
                  text-[10px] font-medium text-white/80 tracking-wide
                  flex items-center justify-center
                  border border-white/[0.08]
                  group-hover:bg-white/15
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
              bg-white/[0.03] backdrop-blur-xl
              border border-white/[0.08]
              shadow-[0_0_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]
              hover:bg-white/[0.06]
              hover:border-white/[0.12]
              hover:shadow-[0_0_40px_rgba(100,80,180,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]
              transition-all duration-500 ease-out
              hover:-translate-y-0.5
            ">
              {/* Rim highlight */}
              <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="relative">
                {/* Icon */}
                <div className="w-8 h-8 mb-5 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>

                <h2 className="text-sm font-medium text-white/80 mb-1.5 tracking-wide">
                  I have a brand
                </h2>
                <p className="text-[11px] text-white/40 mb-5 leading-relaxed">
                  Import existing brand for AI content
                </p>

                <ul className="space-y-2 mb-5 text-[10px] text-white/35">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    Upload guidelines PDF
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    Import from URL
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    Convert to Brand Bible
                  </li>
                </ul>

                <div className="
                  h-8 rounded-lg
                  bg-white/[0.05] backdrop-blur-sm
                  border border-white/[0.08]
                  text-[10px] font-medium text-white/50 tracking-wide
                  flex items-center justify-center
                  group-hover:bg-white/[0.08] group-hover:text-white/60
                  transition-all duration-300
                ">
                  Import Brand
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-20 text-[10px] tracking-[0.15em] text-white/25 uppercase">
          From concept to content
        </p>
      </main>
    </>
  );
}
