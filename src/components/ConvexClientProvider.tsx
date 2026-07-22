"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useState } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const [convex] = useState(() =>
    convexUrl ? new ConvexReactClient(convexUrl) : null
  );

  if (!convexUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing NEXT_PUBLIC_CONVEX_URL.");
    }

    return (
      <div className="min-h-screen bg-[#f0f0f4] px-6 py-16 text-neutral-700">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/70 bg-white/70 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <h1 className="text-xl font-semibold text-neutral-900">Convex is not configured</h1>
          <p className="mt-3 text-sm leading-6">
            This app needs <code>NEXT_PUBLIC_CONVEX_URL</code> in <code>.env.local</code> before
            it can render routes that use Convex auth or queries.
          </p>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6">
            <li>Run <code>npx convex dev</code> from the repository root.</li>
            <li>Let Convex create or update <code>.env.local</code>.</li>
            <li>Restart <code>npm run dev</code>.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <ConvexAuthProvider client={convex}>
      {children}
    </ConvexAuthProvider>
  );
}
