"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

const LiquidBackground = dynamic(
  () => import("@/components/LiquidBackground"),
  { ssr: false }
);

function AccessForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LiquidBackground />
      <div className="fixed inset-0 -z-20 bg-[#f0f0f4]" />
      
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-12 flex flex-col items-center">
          <Image
            src="/logomark.png"
            alt="NewSphere"
            width={64}
            height={64}
            className="mb-4 drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]"
            priority
          />
        </div>

        {/* Glass Card */}
        <div className="w-full max-w-sm">
          <div className="
            relative p-8 rounded-2xl
            bg-white/50 backdrop-blur-xl
            border border-white/60
            shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
          ">
            <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            
            <div className="text-center mb-6">
              <h2 className="text-sm font-medium text-neutral-600 mb-2 tracking-wide">
                Team Access
              </h2>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Enter password to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="
                  w-full h-11 px-4 rounded-xl
                  bg-white/60 border border-white/50
                  text-[13px] text-neutral-600 placeholder:text-neutral-400
                  shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]
                  focus:outline-none focus:ring-1 focus:ring-neutral-300/50
                  transition-all
                "
              />
              
              {error && (
                <p className="text-[10px] text-red-400 text-center">{error}</p>
              )}
              
              <button
                type="submit"
                disabled={loading || !password}
                className="
                  w-full h-11 rounded-xl
                  bg-neutral-500/90 hover:bg-neutral-500
                  text-[12px] font-medium text-white tracking-wide
                  shadow-[0_2px_8px_rgba(0,0,0,0.1)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {loading ? "..." : "Enter"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

export default function AccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#f0f0f4]">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin" />
      </main>
    }>
      <AccessForm />
    </Suspense>
  );
}
