import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 flex flex-col items-center justify-center p-8">
      {/* Logo/Brand */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent mb-4">
          NewSphere
        </h1>
        <p className="text-neutral-400 text-xl max-w-md">
          Where brands come to life.
        </p>
      </div>

      {/* Choice Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Need a Brand */}
        <Link href="/create" className="block">
          <Card className="bg-neutral-900/50 border-neutral-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer h-full">
            <CardHeader className="text-center pb-2">
              <div className="text-6xl mb-4">✨</div>
              <CardTitle className="text-2xl text-white">I need a brand</CardTitle>
              <CardDescription className="text-neutral-400">
                Start from scratch with our AI-powered brand wizard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-neutral-500 space-y-2 mb-6">
                <li>→ Generate brand name & tagline</li>
                <li>→ Create logo & visual identity</li>
                <li>→ Define voice & tone</li>
                <li>→ Build your Brand Bible</li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
                Start Creating
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Have a Brand */}
        <Link href="/import" className="block">
          <Card className="bg-neutral-900/50 border-neutral-800 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 cursor-pointer h-full">
            <CardHeader className="text-center pb-2">
              <div className="text-6xl mb-4">📦</div>
              <CardTitle className="text-2xl text-white">I have a brand</CardTitle>
              <CardDescription className="text-neutral-400">
                Import your existing brand to power AI content
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-neutral-500 space-y-2 mb-6">
                <li>→ Upload brand guidelines PDF</li>
                <li>→ Import from website URL</li>
                <li>→ Auto-detect colors & fonts</li>
                <li>→ Convert to Brand Bible</li>
              </ul>
              <Button variant="outline" className="w-full border-neutral-700 hover:bg-neutral-800 hover:border-orange-500/50">
                Import Brand
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tagline */}
      <p className="mt-16 text-neutral-600 text-sm">
        From concept to content — NewSphere handles it all.
      </p>
    </main>
  );
}
