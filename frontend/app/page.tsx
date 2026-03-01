import LiveCamera from "@/components/LiveCamera";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-emerald-500/30 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header Section */}
        <header className="border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            NEXUS
          </h1>
          <p className="text-slate-500 font-mono text-sm mt-2 uppercase tracking-widest">
            SPATIAL ATTENDANCE & RECOGNITION NODE // V2.0
          </p>
        </header>

        {/* Main Camera & Logs Component */}
        <LiveCamera />

      </div>

      {/* Admin Access Footer */}
      <footer className="mt-12 mb-4 text-center">
        <Link 
          href="/admin" 
          className="text-slate-800 hover:text-emerald-500/50 text-[10px] font-mono uppercase tracking-[0.3em] transition-all duration-300"
        >
          // Access Restricted: System Administrator Portal
        </Link>
      </footer>
    </main>
  );
}