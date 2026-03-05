"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const LiquidBackground = dynamic(
  () => import("@/components/LiquidBackground"),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <LiquidBackground />
      <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-8">
        {/* Logo/Brand */}
        <div className="mb-16 text-center">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 bg-clip-text text-transparent mb-4 tracking-tight">
            NewSphere
          </h1>
          <p className="text-neutral-500 text-xl font-light tracking-wide">
            Where brands come to life
          </p>
        </div>

        {/* Choice Cards - Glassmorphism */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* Need a Brand */}
          <Link href="/create" className="block group">
            <div className="relative h-full p-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(139,92,246,0.08)] hover:shadow-[0_16px_48px_rgba(139,92,246,0.15)] hover:border-purple-200/60 transition-all duration-500 hover:-translate-y-1">
              {/* Gradient accent */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Icon */}
                <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>

                <h2 className="text-2xl font-semibold text-neutral-800 mb-3">
                  I need a brand
                </h2>
                <p className="text-neutral-500 mb-8 leading-relaxed">
                  Start from scratch with our AI-powered brand creation wizard
                </p>

                <ul className="space-y-3 mb-8 text-sm text-neutral-600">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Generate brand name & tagline
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    Create logo & visual identity
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Define voice & tone
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Build your Brand Bible
                  </li>
                </ul>

                <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300">
                  Start Creating
                </Button>
              </div>
            </div>
          </Link>

          {/* Have a Brand */}
          <Link href="/import" className="block group">
            <div className="relative h-full p-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(249,115,22,0.08)] hover:shadow-[0_16px_48px_rgba(249,115,22,0.15)] hover:border-orange-200/60 transition-all duration-500 hover:-translate-y-1">
              {/* Gradient accent */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Icon */}
                <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>

                <h2 className="text-2xl font-semibold text-neutral-800 mb-3">
                  I have a brand
                </h2>
                <p className="text-neutral-500 mb-8 leading-relaxed">
                  Import your existing brand to power AI content generation
                </p>

                <ul className="space-y-3 mb-8 text-sm text-neutral-600">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    Upload brand guidelines PDF
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Import from website URL
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Auto-detect colors & fonts
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    Convert to Brand Bible
                  </li>
                </ul>

                <Button variant="outline" className="w-full h-12 rounded-xl border-2 border-neutral-200 hover:border-orange-300 bg-white/50 backdrop-blur-sm text-neutral-700 hover:text-orange-600 font-medium transition-all duration-300">
                  Import Brand
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Tagline */}
        <p className="mt-16 text-neutral-400 text-sm font-light tracking-wide">
          From concept to content — NewSphere handles it all
        </p>
      </main>
    </>
  );
}
