"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const LiquidBackground = dynamic(
  () => import("@/components/LiquidBackground"),
  { ssr: false }
);

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  
  const subscribe = useMutation(api.waitlist.subscribe);
  const router = useRouter();

  // Secret: Press Enter when not focused on input to access dev mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement?.tagName !== "INPUT") {
        router.push("/access?redirect=/dashboard");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setStatus("loading");
    
    try {
      await subscribe({ email: email.trim() });
      setStatus("success");
      setMessage("You're on the list");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  };

  // Animate success state in
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => setShowSuccess(true), 50);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <>
      <LiquidBackground />
      <div className="fixed inset-0 -z-20 bg-[#f0f0f4]" />
      
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <a 
          href="https://x.com/newSphere_ai"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-12 flex flex-col items-center group"
        >
          <Image
            src="/logomark.png"
            alt="NewSphere"
            width={80}
            height={80}
            className="mb-4 drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] group-hover:scale-105 transition-transform duration-300"
            priority
          />
          <h1 className="text-[28px] font-semibold tracking-[0.02em] text-neutral-400 mb-1.5">
            NewSphere
          </h1>
          <p className="text-[12px] tracking-[0.15em] text-neutral-400/70 font-normal">
            Agentic Creative Agency
          </p>
        </a>

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
                Coming Soon
              </h2>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Automate your branding, marketing & advertising
              </p>
            </div>

            <div className="relative min-h-[104px]">
              {/* Success State */}
              <div 
                className={`
                  absolute inset-0 flex flex-col items-center justify-center
                  transition-all duration-500 ease-out
                  ${status === "success" 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-4 pointer-events-none"}
                `}
              >
                <div 
                  className={`
                    w-10 h-10 rounded-full bg-white/60 border border-white/50 
                    flex items-center justify-center mb-3 
                    shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]
                    transition-all duration-500 ease-out delay-150
                    ${showSuccess ? "scale-100 opacity-100" : "scale-75 opacity-0"}
                  `}
                >
                  <svg 
                    className={`
                      w-5 h-5 text-neutral-500
                      transition-all duration-300 delay-300
                      ${showSuccess ? "opacity-100" : "opacity-0"}
                    `}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={1.5}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M4.5 12.75l6 6 9-13.5"
                      className={showSuccess ? "animate-draw-check" : ""}
                      style={{
                        strokeDasharray: 30,
                        strokeDashoffset: showSuccess ? 0 : 30,
                        transition: "stroke-dashoffset 0.4s ease-out 0.4s"
                      }}
                    />
                  </svg>
                </div>
                <p 
                  className={`
                    text-[11px] text-neutral-500
                    transition-all duration-400 ease-out delay-200
                    ${showSuccess ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
                  `}
                >
                  {message}
                </p>
              </div>

              {/* Form State */}
              <form 
                onSubmit={handleSubmit} 
                className={`
                  space-y-3
                  transition-all duration-300 ease-out
                  ${status === "success" 
                    ? "opacity-0 -translate-y-4 pointer-events-none" 
                    : "opacity-100 translate-y-0"}
                `}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="
                    w-full h-11 px-4 rounded-xl
                    bg-white/60 border border-white/50
                    text-[13px] text-neutral-600 placeholder:text-neutral-400
                    shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]
                    focus:outline-none focus:ring-1 focus:ring-neutral-300/50
                    transition-all
                  "
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="
                    w-full h-11 rounded-xl
                    bg-neutral-500/90 hover:bg-neutral-500
                    text-[12px] font-medium text-white tracking-wide
                    shadow-[0_2px_8px_rgba(0,0,0,0.1)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                >
                  {status === "loading" ? "Joining..." : "Join Waitlist"}
                </button>
                {status === "error" && (
                  <p className="text-[10px] text-red-400 text-center animate-fade-in">{message}</p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-[10px] text-neutral-400/60 tracking-wide">
          Built by{" "}
          <a 
            href="https://x.com/aklolabs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-500 transition-colors"
          >
            AKLO Labs
          </a>
        </p>
      </main>
    </>
  );
}
