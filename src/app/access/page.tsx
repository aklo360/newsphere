"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    <main className="relative min-h-screen flex items-center justify-center p-6">
      <LiquidBackground />
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-neutral-200/50 border border-white/50">
          <div className="text-center mb-6">
            <h1 className="text-xl font-medium text-neutral-800 mb-2">
              Developer Access
            </h1>
            <p className="text-sm text-neutral-500">
              This site is in development
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="w-full h-12 px-4 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all"
            />
            
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-12 rounded-xl bg-neutral-800 text-white font-medium hover:bg-neutral-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "..." : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function AccessPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen flex items-center justify-center p-6">
        <div className="text-neutral-400">Loading...</div>
      </main>
    }>
      <AccessForm />
    </Suspense>
  );
}
