import base64
import os

login_content = """import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { User, Role } from '../types';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Phone, 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Shield, 
  UserPlus, 
  Waves,
  QrCode,
  Smartphone
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const [step, setStep] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password toggle visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [rlsCopied, setRlsCopied] = useState(false);
  const [schemaCopied, setSchemaCopied] = useState(false);
  const [dbConfig, setDbConfig] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    loadUsers();
    loadDbConfig();
  }, []);

  useEffect(() => {
    if (location.search.includes('step=login')) {
      setStep('login');
    }
  }, [location.search]);

  const loadDbConfig = async () => {
    try {
      const config = await api.getSupabaseConfig();
      setDbConfig(config);
    } catch (err) {
      console.error("Failed to load Supabase config:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await api.authLogin({ email, password });
      login(user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name || !email || !password || !phone) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const newUser = await api.authRegister({ name, email, password, role, phone, address: address || "" });
      setSuccess('Account created successfully! Logging you in...');
      
      // Directly log the user in
      setTimeout(() => {
        login(newUser);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleQuickLogin = (user: User) => {
    // Fill in credentials and log in instantly for testing
    login(user);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
        <div className="w-10 h-10 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-semibold text-xs">Booting PureDrop sandbox...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] w-full flex flex-col items-center justify-center p-4 md:p-6 select-none relative">
      
      {/* Floating Card Container */}
      <div className="w-full max-w-[440px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(13,148,136,0.06)] border border-slate-100 p-8 flex flex-col relative overflow-hidden transition-all duration-300">
        
        {/* Subtle top brand accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500" />

        {/* 1. WELCOME SCREEN */}
        {step === 'welcome' && (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              
              {/* PureDrop Wave Squircle Icon */}
              <div className="w-16 h-16 bg-[#0d9488] rounded-[22px] flex items-center justify-center shadow-lg shadow-[#0d9488]/20 mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 6c.6.5 1.2 1 2.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1" />
                  <path d="M2 12c.6.5 1.2 1 2.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1" />
                  <path d="M2 18c.6.5 1.2 1 2.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1 2.2 1 3.5 1s2.5-1 3.5-1" />
                </svg>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Pure<span className="text-[#0d9488]">Drop</span>
              </h1>
              <p className="text-slate-500 text-xs font-semibold tracking-wide uppercase mt-1">
                Premium Laundry Services
              </p>

              <div className="mt-8 space-y-2">
                <h2 className="text-xl font-extrabold text-[#0f172a]">Welcome</h2>
                <p className="text-xs text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                  Discover amazing laundry services and get your fresh clothes delivered to your door.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => setStep('register')}
                className="w-full bg-[#0d9488] hover:bg-[#0b7a70] text-white py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-[#0d9488]/25 active:scale-98 transition-all text-xs cursor-pointer"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-98 transition-all text-xs cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#0d9488]" /> Present on Mobile (QR Code)
              </button>

              <p className="text-[11px] text-slate-500 text-center font-semibold">
                Already have an account?{' '}
                <button
                  onClick={() => setStep('login')}
                  className="text-[#0d9488] hover:text-[#0b7a70] font-black underline ml-0.5 cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 2. SIGN IN SCREEN */}
        {step === 'login' && (
          <div className="flex flex-col h-full animate-fade-in relative">
            
            {/* Top Row Back Navigation */}
            <div className="h-10 flex items-center mb-4">
              <button
                onClick={() => { setStep('welcome'); setError(''); setSuccess(''); window.history.pushState({}, '', '/login?step=welcome'); }}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-all active:scale-95 cursor-pointer border border-slate-100"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="space-y-1 mb-6">
                  <h2 className="text-2xl font-black text-[#0f172a]">Sign in</h2>
                  <div className="w-10 h-1 bg-[#0d9488] rounded-full" />
                </div>

                {error && (
                  <div className="mb-4 bg-rose-50 text-rose-600 text-[11px] p-3 rounded-2xl font-medium border border-rose-100 leading-normal">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-50 text-emerald-600 text-[11px] p-3 rounded-2xl font-medium mb-4 border border-emerald-100">
                    {success}
                  </div>
                )}

                {/* Form fields */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Anton@yahoo.com"
                        className="w-full text-xs text-slate-900 pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-[#f8fafc] outline-none focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/10 transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full text-xs text-slate-900 pl-10 pr-10 py-3 border border-slate-200 rounded-2xl bg-[#f8fafc] outline-none focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/10 transition-all font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0d9488] hover:bg-[#0b7a70] text-white py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-[#0d9488]/15 active:scale-98 transition-all text-xs cursor-pointer mt-6"
                  >
                    Secure Login
                  </button>
                </form>

                <p className="text-[11px] text-slate-500 text-center font-semibold mt-6">
                  Don't have an account?{' '}
                  <button
                    onClick={() => { setStep('register'); setError(''); setSuccess(''); }}
                    className="text-[#0d9488] hover:text-[#0b7a70] font-black underline ml-0.5 cursor-pointer"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. SIGN UP (REGISTER) SCREEN */}
        {step === 'register' && (
          <div className="flex flex-col h-full animate-fade-in relative">
            
            {/* Top Row Back Navigation */}
            <div className="h-10 flex items-center mb-4">
              <button
                onClick={() => { setStep('welcome'); setError(''); setSuccess(''); window.history.pushState({}, '', '/login?step=welcome'); }}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-all active:scale-95 cursor-pointer border border-slate-100"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="space-y-1 mb-5">
                  <h2 className="text-2xl font-black text-[#0f172a]">Sign up</h2>
                  <div className="w-10 h-1 bg-[#0d9488] rounded-full" />
                </div>

                {error && (
                  <div className="bg-rose-50 text-rose-600 text-[11px] p-2.5 rounded-2xl font-medium border border-rose-100 mb-4 leading-normal">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-50 text-emerald-600 text-[11px] p-2.5 rounded-2xl font-medium mb-4 border border-emerald-100">
                    {success}
                  </div>
                )}

                {/* Form fields */}
                <form onSubmit={handleRegisterSubmit} className="space-y-3 pb-4">
                  
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Anton Alforque"
                        className="w-full text-xs text-slate-900 pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl bg-[#f8fafc] outline-none focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/10 transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Anton@yahoo.com"
                        className="w-full text-xs text-slate-900 pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl bg-[#f8fafc] outline-none focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/10 transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full text-xs text-slate-900 pl-10 pr-10 py-2.5 border border-slate-200 rounded-2xl bg-[#f8fafc] outline-none focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/10 transition-all font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full text-xs text-slate-900 pl-10 pr-10 py-2.5 border border-slate-200 rounded-2xl bg-[#f8fafc] outline-none focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/10 transition-all font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+63 917..."
                        className="w-full text-xs text-slate-900 pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl bg-[#f8fafc] outline-none focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/10 transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* System Role */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">System Role</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <select
                        value={role}
                        onChange={e => setRole(e.target.value as Role)}
                        className="w-full text-xs text-slate-900 pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl bg-[#f8fafc] outline-none focus:border-[#0d9488] focus:bg-white focus:ring-2 focus:ring-[#0d9488]/10 transition-all font-bold appearance-none cursor-pointer"
                      >
                        <option value="customer">Customer</option>
                        <option value="rider">Rider</option>
                        <option value="staff">Laundry Staff</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0d9488] hover:bg-[#0b7a70] text-white py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-[#0d9488]/15 active:scale-98 transition-all text-xs cursor-pointer mt-4"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Create Account
                  </button>
                </form>
                
                <p className="text-[11px] text-slate-500 text-center font-semibold mb-6">
                  Already have an account?{' '}
                  <button
                    onClick={() => { setStep('login'); setError(''); setSuccess(''); }}
                    className="text-[#0d9488] hover:text-[#0b7a70] font-black underline ml-0.5 cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Presentation QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] p-6 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-4 relative animate-scale-up">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mx-auto w-12 h-12 bg-teal-50 text-[#0d9488] rounded-2xl flex items-center justify-center mb-1">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900">Mobile Presentation Mode</h3>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              Scan this QR code with your mobile phone camera (or Expo Go / QR scanner) to open and test this application live on your phone!
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl flex justify-center border border-slate-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`}
                alt="App QR Code"
                className="w-40 h-40 rounded-lg shadow-sm border border-slate-200/50 bg-white"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="text-[10px] text-slate-400 font-medium break-all select-all">
              URL: <span className="text-teal-600 font-semibold underline">{window.location.href}</span>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-[#0d9488] hover:bg-[#0b7a70] text-white py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md shadow-[#0d9488]/15"
            >
              Done, continue to App
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
"""

with open('src/pages/Login.tsx', 'w') as f:
    f.write(login_content)

print("Restored Login.tsx")
