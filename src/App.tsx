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

          {/* Top Header to match user's requested layout */}
          {user && (
            <header className="bg-white border-b border-gray-200 py-4 px-6 shrink-0 shadow-sm z-50">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Laundry Portal Deployment System</h2>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                      🧺 LPDMS Mobile
                    </h1>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-white border border-emerald-200 rounded-full px-3 py-1 shadow-sm">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Live
                    </div>
                    <button 
                      onClick={logout}
                      className="text-sm font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-full px-4 py-1 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
                {/* Role Indicators matching screenshot */}
                <div className="flex items-center gap-2">
                  <div className={`px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${user.role === 'customer' ? 'bg-[#0d9488] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                    👤 Customer
                  </div>
                  <div className={`px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${user.role === 'rider' ? 'bg-[#0d9488] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                    🛵 Rider
                  </div>
                  <div className={`px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${user.role === 'staff' ? 'bg-[#0d9488] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                    📦 Staff
                  </div>
                  <div className={`px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${user.role === 'admin' ? 'bg-[#0d9488] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                    👑 Admin
                  </div>
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
                <div className="flex-1 w-full max-w-7xl mx-auto pt-6 pb-12 flex flex-col h-full px-4 md:px-0">
                  {user.role === 'customer' ? <CustomerDashboard /> :
                   user.role === 'rider' ? <RiderDashboard /> :
                   user.role === 'staff' ? <StaffDashboard /> :
                   <AdminDashboard />}
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
