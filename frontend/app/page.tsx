import LiveCamera from "@/components/LiveCamera";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            NEXUS
          </h1>
          <p className="text-slate-500 font-mono text-sm mt-2">
            SPATIAL ATTENDANCE & RECOGNITION NODE // V2.0
          </p>
        </header>
        <LiveCamera />
      </div>
    </main>
  );
}