"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Image from "next/image";
import dynamic from "next/dynamic";

const LiquidBackground = dynamic(
  () => import("@/components/LiquidBackground"),
  { ssr: false }
);

export default function SignIn() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleGoogleSignIn = () => {
    signIn("google");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", mode === "signup" ? "signUp" : "signIn");
      
      await signIn("password", formData);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f0f0f4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <>
      {mounted && <LiquidBackground />}
      <div className="fixed inset-0 -z-20 bg-[#f0f0f4]" />
      
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
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

          {/* Sign In Card */}
          <div className="
            relative p-6 rounded-2xl
            bg-white/50 backdrop-blur-xl
            border border-white/60
            shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
          ">
            <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            
            <h2 className="text-lg font-medium text-neutral-600 mb-1 text-center">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-xs text-neutral-400 mb-6 text-center">
              {mode === "signin" ? "Sign in to continue" : "Sign up to get started"}
            </p>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full h-11 rounded-lg bg-white border border-neutral-200/80 text-sm font-medium text-neutral-700 flex items-center justify-center gap-2.5 hover:bg-neutral-50 hover:border-neutral-300/80 transition-all shadow-sm mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200/60"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-[10px] text-neutral-400 bg-white/50">or</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-lg bg-white border border-neutral-200/80 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-11 px-3 rounded-lg bg-white border border-neutral-200/80 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
              />
              
              {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-neutral-700/90 text-sm font-medium text-white/90 flex items-center justify-center hover:bg-neutral-600/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  mode === "signin" ? "Sign In" : "Sign Up"
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <p className="text-xs text-neutral-400 text-center mt-4">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-neutral-600 hover:text-neutral-800 font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="text-neutral-600 hover:text-neutral-800 font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="text-[10px] text-neutral-400/60 text-center mt-6">
            By continuing, you agree to our Terms of Service
          </p>
          
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
