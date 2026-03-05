import Link from "next/link";

export default function CreateBrand() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100/50 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <Link 
          href="/" 
          className="inline-block mb-12 text-[10px] tracking-[0.15em] text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          ← Back
        </Link>
        
        <h1 className="text-xl font-light text-neutral-800 mb-3 tracking-wide">
          Brand Creation Wizard
        </h1>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Coming soon — AI-powered brand generation from scratch
        </p>
      </div>
    </main>
  );
}
