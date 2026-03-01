"use client";

import { useEffect, useState } from "react";
import { Trash2, ArrowLeft, Download, ShieldCheck, Database } from "lucide-react";
import Link from "next/link";

export default function AdminPortal() {
  const [users, setUsers] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/users");
      setUsers(await res.json());
    } catch (err) {
      console.error("Failed to fetch Nexus core data.");
    }
  };

  const deleteUser = async (name: string) => {
    if (!confirm(`WARNING: Permanently purge biometric record for [${name}]?`)) return;
    await fetch(`http://127.0.0.1:8000/api/admin/users/${name}`, { method: "DELETE" });
    fetchUsers();
  };

  const handleExport = () => {
    setIsExporting(true);
    window.open("http://127.0.0.1:8000/api/admin/export", "_blank");
    setTimeout(() => setIsExporting(false), 2000);
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8 md:p-12 font-mono selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Console */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-800 pb-8">
          <div>
            <Link href="/" className="text-emerald-500 hover:text-emerald-400 text-xs flex items-center gap-2 mb-4 transition-colors">
              <ArrowLeft size={14} /> TERMINATE ADMIN SESSION
            </Link>
            <h1 className="text-3xl font-bold tracking-tighter text-slate-100 flex items-center gap-3">
              <Database className="text-emerald-500" />
              NEXUS_CORE_ADMIN
            </h1>
          </div>
          
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/20 flex items-center gap-3 transition-all shadow-[0_0_15px_rgba(52,211,153,0.1)] disabled:opacity-50"
          >
            <Download size={16} className={isExporting ? "animate-bounce" : ""} /> 
            {isExporting ? "EXTRACTING DATA..." : "COMPILE PAYROLL REPORT (.CSV)"}
          </button>
        </div>

        {/* Biometric Registry Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
          <div className="px-8 py-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 uppercase tracking-widest">Active Biometric Profiles</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{users.length} IDENTITIES</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/50 text-slate-500 text-[10px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Entity Designation</th>
                  <th className="px-8 py-5">Security Clearance</th>
                  <th className="px-8 py-5 text-right">System Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center text-slate-600 text-sm">
                      No biometric signatures found in the central database.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.name} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-8 py-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-500 font-bold shadow-inner">
                          {user.name[0].toUpperCase()}
                        </div>
                        <span className="text-base font-sans font-medium text-slate-200">{user.name}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 w-fit px-3 py-1 rounded-sm uppercase tracking-wider">
                          <ShieldCheck size={14} /> ACTIVE_VECT_LOCK
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => deleteUser(user.name)}
                          className="text-slate-600 hover:text-red-400 p-2 transition-colors border border-transparent hover:border-red-500/30 hover:bg-red-500/10 rounded"
                          title="Purge Identity"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}