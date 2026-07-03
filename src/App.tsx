import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext, useState } from 'react';
import { User } from './types';
import Login from './pages/Login';
import CustomerDashboard from './pages/CustomerDashboard';
import RiderDashboard from './pages/RiderDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DatabaseConfig from './components/DatabaseConfig';
import { LogOut } from 'lucide-react';

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
                    <DatabaseConfig />
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
