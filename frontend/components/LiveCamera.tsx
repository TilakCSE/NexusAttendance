"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Scan, Crosshair, UserPlus, Fingerprint, ScrollText, Clock, CheckCircle2 } from "lucide-react";

export default function LiveCamera() {
  const [frame, setFrame] = useState<string | null>(null);
  const [faces, setFaces] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [status, setStatus] = useState("Initializing Nexus Link...");
  
  const [regName, setRegName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [regFeedback, setRegFeedback] = useState("");

  const VIDEO_WIDTH = 640; 
  const VIDEO_HEIGHT = 480;

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/stream");
    ws.onopen = () => setStatus("Stream Active - Monitoring");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.frame) {
        setFrame(`data:image/jpeg;base64,${data.frame}`);
        setFaces(data.faces || []);
        setLogs(data.logs || []);
      }
    };
    ws.onclose = () => setStatus("Connection Lost");
    return () => ws.close();
  }, []);

  const handleRegister = async () => {
    if (!regName.trim() || faces.length === 0) return;
    setIsRegistering(true);
    setRegFeedback("Encrypting Biometrics...");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName.trim(), embedding: faces[0].embedding }),
      });
      if (response.ok) {
        setRegFeedback(`Success: Identity [${regName}] secured.`);
        setRegName("");
      } else {
        setRegFeedback("Error: Registration failed.");
      }
    } catch {
      setRegFeedback("Error: Uplink severed.");
    } finally {
      setIsRegistering(false);
      setTimeout(() => setRegFeedback(""), 4000);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
      
      {/* LEFT COLUMN: Camera & Registration */}
      <div className="xl:col-span-2 flex flex-col gap-4">
        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border border-emerald-500/30 rounded-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Activity className="text-emerald-400 animate-pulse" size={20} />
            <span className="font-mono text-emerald-400 text-sm uppercase tracking-widest">{status}</span>
          </div>
          <div className="font-mono text-slate-500 text-xs flex items-center gap-2">
            <Crosshair size={14} className={faces.length > 0 ? "text-cyan-400 animate-spin" : ""} />
            {faces.length} TARGET(S) ACQUIRED
          </div>
        </div>

        {/* Video Container */}
        <div className="relative w-full aspect-video bg-black rounded-xl border border-slate-800 overflow-hidden shadow-2xl shadow-emerald-900/20 flex items-center justify-center">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] z-20 opacity-20"></div>
          {frame ? (
            <div className="relative inline-block h-full">
              <img src={frame} alt="Live Feed" className="h-full w-auto object-contain" />
              <AnimatePresence>
                {faces.map((face, index) => {
                  const top = (face.box.top / VIDEO_HEIGHT) * 100;
                  const left = (face.box.left / VIDEO_WIDTH) * 100;
                  const width = ((face.box.right - face.box.left) / VIDEO_WIDTH) * 100;
                  const height = ((face.box.bottom - face.box.top) / VIDEO_HEIGHT) * 100;
                  const isKnown = face.name !== "Unregistered Entity" && face.name !== "Scanning...";
                  
                  return (
                    <motion.div
                      key={`${index}-${face.name}`}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`absolute border-2 z-30 flex flex-col items-center justify-end ${isKnown ? "border-emerald-400 bg-emerald-400/10 shadow-[0_0_15px_rgba(52,211,153,0.5)]" : "border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.5)]"}`}
                      style={{ top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }}
                    >
                      <div className={`absolute -bottom-7 border text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap tracking-wider uppercase flex items-center gap-1 min-w-max ${isKnown ? "bg-emerald-950/80 border-emerald-400/50 text-emerald-300" : "bg-cyan-950/80 border-cyan-400/50 text-cyan-300"}`}>
                        {isKnown && <Fingerprint size={12} className="animate-pulse" />}
                        {face.name}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <Scan className="text-slate-700 animate-spin" size={48} />
          )}
        </div>

        {/* Registration Deck */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl backdrop-blur-md flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="ENTER IDENTITY TO REGISTER..."
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              disabled={isRegistering}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm font-mono text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
          </div>
          <button
            onClick={handleRegister}
            disabled={isRegistering || faces.length === 0}
            className="w-full sm:w-auto px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 rounded-lg font-mono text-sm tracking-widest transition-all flex items-center justify-center gap-2"
          >
            {isRegistering ? <Activity size={16} className="animate-spin" /> : <Fingerprint size={16} />}
            {isRegistering ? "SYNCING..." : "REGISTER"}
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Attendance Terminal */}
      <div className="flex flex-col gap-4 h-full">
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl h-full backdrop-blur-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <ScrollText className="text-emerald-500" size={20} />
            <h2 className="text-sm font-mono text-emerald-500 uppercase tracking-widest">
              Live Attendance Matrix
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {logs.length === 0 ? (
                <div className="text-xs font-mono text-slate-600 text-center mt-10">Awaiting visual confirmation...</div>
              ) : (
                logs.map((log, i) => (
                  <motion.div
                    key={`${log.name}-${log.time}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center justify-between group hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={16} />
                      <span className="font-mono text-slate-200 text-sm uppercase tracking-wide">{log.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-xs">
                      <Clock size={12} />
                      {/* Convert UTC Database Time to Local Time */}
                      {new Date(log.time + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  );
}