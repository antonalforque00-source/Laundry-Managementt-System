import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext, useState, useEffect } from 'react';
import { User, AuditLog } from './types';
import Login from './pages/Login';
import CustomerDashboard from './pages/CustomerDashboard';
import RiderDashboard from './pages/RiderDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { format } from 'date-fns';
import { 
  Smartphone, QrCode, ClipboardList, ShieldAlert, Sparkles, 
  Layers, Hammer, Cpu, Terminal, RefreshCcw, LogOut, Info, BookOpen,
  Database, Key, Copy, ChevronDown, ChevronUp, ExternalLink, Eye, EyeOff, CheckSquare, AlertTriangle
} from 'lucide-react';

const sqlSchemaText = `-- ============================================================
-- Laundry Pickup & Delivery Management System (LPDMS)
-- Supabase PostgreSQL Schema
-- TEXT Primary Keys Version
-- ============================================================

-- ===========================
-- DROP OLD TABLES (Optional)
-- ===========================

DROP TABLE IF EXISTS feedbacks CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN ('customer','rider','staff','admin')
    ),
    points INTEGER DEFAULT 0,
    address TEXT,
    phone TEXT,
    rating NUMERIC DEFAULT 0,
    status TEXT,
    station TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    rider_id TEXT,
    customer_name TEXT,
    rider_name TEXT,
    service TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    cost NUMERIC DEFAULT 0,
    weight NUMERIC DEFAULT 0,
    payment_method TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    qr_code_value TEXT,
    address TEXT,
    phone TEXT,
    rating INTEGER,
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_rider
        FOREIGN KEY (rider_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 0,
    unit TEXT NOT NULL,
    min_limit NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_audit_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================
-- FEEDBACKS
-- ============================================================

CREATE TABLE feedbacks (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    order_id TEXT,
    customer_name TEXT,
    rating INTEGER NOT NULL,
    review TEXT,
    type TEXT DEFAULT 'Review',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_feedback_customer
        FOREIGN KEY(customer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_feedback_order
        FOREIGN KEY(order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_orders_customer
ON orders(customer_id);

CREATE INDEX idx_orders_rider
ON orders(rider_id);

CREATE INDEX idx_feedback_customer
ON feedbacks(customer_id);

CREATE INDEX idx_feedback_order
ON feedbacks(order_id);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);

-- ============================================================
-- UPDATE TIMESTAMP FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_inventory_updated
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DISABLE RLS
-- ============================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- GRANT ACCESS
-- ============================================================

GRANT ALL ON TABLE users TO anon, authenticated;
GRANT ALL ON TABLE orders TO anon, authenticated;
GRANT ALL ON TABLE inventory TO anon, authenticated;
GRANT ALL ON TABLE audit_logs TO anon, authenticated;
GRANT ALL ON TABLE feedbacks TO anon, authenticated;
`;

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const normalizeStaffUser = (u: User | null): User | null => {
  if (!u) return null;
  if (u.role === 'staff' && u.name) {
    const normalized = u.name.toLowerCase().trim().replace(/\s+/g, '');
    if (normalized === 'rhexdelima' || normalized === 'rhex' || (u.email && (u.email.toLowerCase().includes('rhexdelima') || u.email.toLowerCase().includes('rhex.delima')))) {
      return { ...u, name: 'Delima' };
    }
  }
  return u;
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lpdms_user');
    if (!saved) return null;
    try {
      return normalizeStaffUser(JSON.parse(saved));
    } catch {
      return null;
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveLogs, setLiveLogs] = useState<AuditLog[]>([]);

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [useSupabase, setUseSupabase] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [dbTablesExist, setDbTablesExist] = useState(false);
  const [supabaseKeyExists, setSupabaseKeyExists] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [seedMessage, setSeedMessage] = useState("");
  const [showSchema, setShowSchema] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Dynamic Clock inside phone status bar
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const safeFetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Received non-JSON response from server");
    }
    return res.json();
  };

  useEffect(() => {
    // Load initial Supabase sync configuration
    safeFetchJson("/api/supabase/config")
      .then(data => {
        if (data) {
          setSupabaseUrl(data.supabaseUrl || "");
          setUseSupabase(data.useSupabase || false);
          setIsConnected(data.isConnected || false);
          setSupabaseKeyExists(data.supabaseKeyExists || false);
          setDbTablesExist(data.tablesExist || false);
        }
      })
      .catch(err => console.warn("Could not load initial Supabase configuration (server may be booting):", err.message));
  }, []);

  // Auto polling to detect if the user ran the SQL schema inside Supabase SQL Editor
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (useSupabase && !dbTablesExist) {
      interval = setInterval(() => {
        safeFetchJson("/api/supabase/config")
          .then(data => {
            if (data) {
              setIsConnected(data.isConnected || false);
              setDbTablesExist(data.tablesExist || false);
              if (data.tablesExist) {
                setTestStatus("success");
                setTestMessage("🎉 Awesome! We detected your database tables. Your live Supabase database is now fully operational and in sync!");
                // Soft reload after success to ensure everything is refreshed
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              }
            }
          })
          .catch(err => console.warn("Polling Supabase configuration status:", err.message));
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [useSupabase, dbTablesExist]);

  const handleTestConnection = async () => {
    if (!supabaseUrl) {
      setTestStatus("error");
      setTestMessage("Please enter your Supabase URL first.");
      return;
    }
    setTestStatus("loading");
    setTestMessage("");
    try {
      const data = await safeFetchJson("/api/supabase/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabaseUrl, supabaseKey })
      });
      if (data.success) {
        setTestStatus("success");
        setTestMessage(data.message);
      } else {
        setTestStatus("error");
        setTestMessage(data.error || "Could not reach database tables.");
      }
    } catch (err: any) {
      setTestStatus("error");
      setTestMessage(err.message || "Network connection error.");
    }
  };

  const handleSaveConfig = async (enable: boolean) => {
    try {
      setTestStatus("loading");
      const data = await safeFetchJson("/api/supabase/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseUrl,
          supabaseKey,
          useSupabase: enable
        })
      });
      if (data.success) {
        setUseSupabase(data.config.useSupabase);
        setIsConnected(data.config.isConnected);
        setSupabaseKeyExists(data.config.supabaseKeyExists);
        setDbTablesExist(data.config.tablesExist || false);
        
        if (enable) {
          if (data.config.isConnected) {
            if (data.config.tablesExist) {
              setTestStatus("success");
              setTestMessage("🎉 Successfully saved! Live connection to Supabase is active and fully synchronized.");
            } else {
              setTestStatus("error"); // Alert class color
              setTestMessage("⚠️ Connected to Supabase, but required tables are missing! Please run the SQL schema script below in your Supabase SQL Editor. LPDMS will automatically detect when you run it!");
            }
          } else {
            setTestStatus("error");
            setTestMessage("Saved configuration, but database is offline. Please double-check your Supabase URL and Keys.");
          }
        } else {
          setTestStatus("idle");
          setTestMessage("");
        }
      } else {
        setTestStatus("error");
        setTestMessage(data.error || "Failed to update configuration.");
      }
    } catch (err: any) {
      setTestStatus("error");
      setTestMessage(err.message || "Network error.");
    }
  };

  const handleSeedDatabase = async () => {
    setSeedStatus("loading");
    setSeedMessage("");
    try {
      const data = await safeFetchJson("/api/supabase/seed", { method: "POST" });
      if (data.success) {
        setSeedStatus("success");
        setSeedMessage(data.message);
        // Reload console logs
        safeFetchJson('/api/analytics')
          .then(d => {
            if (d.auditLogs) setLiveLogs(d.auditLogs.slice(0, 5));
          })
          .catch(() => {});
      } else {
        setSeedStatus("error");
        setSeedMessage(data.error || "Failed to execute seed data inserts.");
      }
    } catch (err: any) {
      setSeedStatus("error");
      setSeedMessage(err.message || "Error running seed process.");
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => {
    // Poll logs occasionally to display on the developer diagnostic console
    const fetchLogs = () => {
      safeFetchJson('/api/analytics')
        .then(data => {
          if (data.auditLogs) {
            setLiveLogs(data.auditLogs.slice(0, 5));
          }
        })
        .catch(err => console.warn("Awaiting live console logs from server:", err.message));
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const login = (u: User) => {
    const sanitized = normalizeStaffUser(u);
    if (sanitized) {
      setUser(sanitized);
      localStorage.setItem('lpdms_user', JSON.stringify(sanitized));
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('lpdms_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <div 
          className="min-h-screen bg-gradient-to-tr from-teal-50 via-cyan-50 to-blue-50 text-slate-800 font-sans flex flex-col justify-between relative overflow-hidden"
        >
          {/* Subtle Decorative Background Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-teal-200/20 blur-[130px] pointer-events-none -z-10" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square rounded-full bg-cyan-200/20 blur-[130px] pointer-events-none -z-10" />

          {/* Elegant Top Header when Logged In */}
          {user && (
            <header className="bg-white/85 backdrop-blur-md border-b border-slate-100 py-3.5 px-6 shrink-0 shadow-xs sticky top-0 z-50">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#0d9488] rounded-xl flex items-center justify-center text-white shadow-sm shadow-[#0d9488]/20">
                    <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6c.6.5 1.2 1 2.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1" />
                      <path d="M2 12c.6.5 1.2 1 2.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1" />
                      <path d="M2 18c.6.5 1.2 1 2.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                      Pure<span className="text-[#0d9488]">Drop</span>
                      <span className="text-[9px] bg-teal-100 text-[#0d9488] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">{user.role} Portal</span>
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {user.name}
                  </div>
                  <button 
                    onClick={logout}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/60 border border-rose-100/40 rounded-xl px-3.5 py-1.5 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out
                  </button>
                </div>
              </div>
            </header>
          )}

          {/* Main Workspace Layout */}
          <main className="flex-1 w-full flex flex-col relative z-10">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
              
              <Route path="/" element={
                !user ? <Navigate to="/login?step=login" replace /> :
                <div className="max-w-6xl w-full mx-auto p-4 md:p-6 flex-1 flex flex-col justify-start">
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xs border border-slate-150 p-5 md:p-8 flex-1 flex flex-col relative overflow-hidden">
                    {user.role === 'customer' ? <CustomerDashboard /> :
                     user.role === 'rider' ? <RiderDashboard /> :
                     user.role === 'staff' ? <StaffDashboard /> :
                     <AdminDashboard />}
                  </div>
                </div>
              } />
            </Routes>
          </main>

          {/* Elegant Footer */}
          <footer className="bg-white/40 backdrop-blur-xs border-t border-slate-100/50 py-3.5 text-center text-[10px] font-semibold text-slate-400 shrink-0 relative z-10">
            <p>PureDrop Laundry Pickup & Delivery Management System • Addressing SDG 8 & 9</p>
          </footer>

        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
