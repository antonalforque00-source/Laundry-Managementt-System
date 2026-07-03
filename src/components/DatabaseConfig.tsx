import React, { useState, useEffect } from 'react';
import { Database, Key, CheckSquare, ShieldAlert, Terminal, Copy } from 'lucide-react';

export default function DatabaseConfig() {
  const [isOpen, setIsOpen] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [useSupabase, setUseSupabase] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [dbTablesExist, setDbTablesExist] = useState(false);
  const [supabaseKeyExists, setSupabaseKeyExists] = useState(false);
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const safeFetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`Server returned status ${res.status}`);
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Received non-JSON response from server");
    }
    return res.json();
  };

  const loadConfig = async () => {
    try {
      const data = await safeFetchJson("/api/supabase/config");
      if (data) {
        setSupabaseUrl(data.supabaseUrl || "");
        setUseSupabase(data.useSupabase || false);
        setIsConnected(data.isConnected || false);
        setSupabaseKeyExists(data.supabaseKeyExists || false);
        setDbTablesExist(data.tablesExist || false);
        
        // Auto open if it's supposed to be connected but isn't
        if (data.useSupabase && (!data.isConnected || !data.tablesExist)) {
          setIsOpen(true);
        }
      }
    } catch (err) {
      console.warn("Could not load initial Supabase configuration");
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    try {
      setStatus("loading");
      const data = await safeFetchJson("/api/supabase/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseUrl,
          supabaseKey,
          useSupabase: true
        })
      });

      if (data.success) {
        setUseSupabase(data.config.useSupabase);
        setIsConnected(data.config.isConnected);
        setSupabaseKeyExists(data.config.supabaseKeyExists);
        setDbTablesExist(data.config.tablesExist || false);

        if (data.config.isConnected) {
          setStatus("success");
          setMessage("Successfully connected to Supabase!");
          setTimeout(() => {
            setIsOpen(false);
            window.location.reload();
          }, 1500);
        } else {
          setStatus("error");
          setMessage("Saved, but database is offline. Double-check your URL and Key.");
        }
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to update configuration.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Network error.");
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm transition-all ${
          isConnected && dbTablesExist 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
        }`}
      >
        <Database className="w-3.5 h-3.5" />
        {isConnected && dbTablesExist ? 'Database Connected' : 'Setup Database'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-200 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#2a9d8f]" />
            Connect Database
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 bg-slate-100 rounded-md text-xs"
          >
            Close
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Enter your Supabase Project URL and Anon Key to connect your backend.
        </p>

        {status === 'success' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            {message}
          </div>
        )}

        {status === 'error' && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {message}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project URL</label>
            <input 
              type="text" 
              value={supabaseUrl} 
              onChange={e => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 outline-none focus:border-[#2a9d8f]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Anon / Publishable Key</label>
            <input 
              type="password" 
              value={supabaseKey} 
              onChange={e => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR..."
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 outline-none focus:border-[#2a9d8f] font-mono"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={status === 'loading'}
          className="w-full bg-[#2a9d8f] text-white py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-[#238579] transition-colors"
        >
          {status === 'loading' ? 'Connecting...' : 'Connect to Supabase'}
        </button>
      </div>
    </div>
  );
}
