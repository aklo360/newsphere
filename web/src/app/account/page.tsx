"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const LiquidBackground = dynamic(
  () => import("@/components/LiquidBackground"),
  { ssr: false }
);

export default function Account() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const user = useQuery(api.users.viewer);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f0f0f4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {mounted && <LiquidBackground />}
      <div className="fixed inset-0 -z-20 bg-[#f0f0f4]" />
      
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Back Link */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-600 mb-8 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>

          {/* Profile Card */}
          <div className="
            relative p-8 rounded-2xl
            bg-white/50 backdrop-blur-xl
            border border-white/60
            shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
          ">
            <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            
            <h1 className="text-xl font-medium text-neutral-700 mb-6">Account</h1>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-medium shadow-lg">
                {user?.email?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-neutral-400">
                  {user?.email || "Loading..."}
                </p>
              </div>
            </div>

            {/* Info Sections */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/60 border border-neutral-100">
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1 block">
                  Email
                </label>
                <p className="text-sm text-neutral-700">
                  {user?.email || "—"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/60 border border-neutral-100">
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1 block">
                  Member Since
                </label>
                <p className="text-sm text-neutral-700">
                  {user?._creationTime 
                    ? new Date(user._creationTime).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })
                    : "—"
                  }
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/60 border border-neutral-100">
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1 block">
                  Plan
                </label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-700">Free</p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-neutral-100 text-neutral-500">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
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
