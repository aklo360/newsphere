"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const LiquidBackground = dynamic(
  () => import("@/components/LiquidBackground"),
  { ssr: false }
);

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;
    
    setStatus("loading");
    
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus("success");
        setMessage("You're on the list! We'll be in touch soon.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-6">
      <LiquidBackground />
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo / Brand */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-neutral-800 mb-3">
            NewSphere
          </h1>
          <p className="text-lg text-neutral-500">
            AI-powered brand creation platform
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-neutral-200/50 border border-white/50">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-medium text-neutral-800 mb-3">
              Coming Soon
            </h2>
            <p className="text-neutral-500 leading-relaxed">
              Create complete brand identities in minutes. Upload a style guide or describe your vision — we'll generate colors, typography, logos, and a full brand bible.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { icon: "🎨", label: "Brand Extraction" },
              { icon: "✨", label: "AI Generation" },
              { icon: "📖", label: "Brand Bible" },
              { icon: "🚀", label: "Instant Export" },
            ].map((feature) => (
              <div 
                key={feature.label}
                className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50/80"
              >
                <span className="text-lg">{feature.icon}</span>
                <span className="text-sm text-neutral-600">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Waitlist Form */}
          {status === "success" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-700 font-medium">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full h-12 px-4 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full h-12 rounded-xl bg-neutral-800 text-white font-medium hover:bg-neutral-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
              >
                {status === "loading" ? "Joining..." : "Join the Waitlist"}
              </button>
              {status === "error" && (
                <p className="text-sm text-red-500 text-center">{message}</p>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-400 mt-8">
          Built by <a href="https://aklo.studio" target="_blank" rel="noopener" className="text-neutral-500 hover:text-neutral-700">AKLO</a>
        </p>
      </div>
    </main>
  );
}
