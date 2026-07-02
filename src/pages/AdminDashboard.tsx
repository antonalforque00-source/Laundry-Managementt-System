import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Order, User, AuditLog, STATUS_LABELS } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, DollarSign, TrendingUp, PackageSearch, Award, ShieldAlert, 
  MapPin, Settings, Check, Trash2, Calendar, ClipboardList, Database, Save, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'services' | 'users' | 'database'>('analytics');
  const [showDatabaseTab, setShowDatabaseTab] = useState(false);

  // Pricing State
  const [prices, setPrices] = useState({
    washFold: 450,
    washDry: 500,
    dryClean: 850,
    ironing: 300
  });

  // Temporary string-based inputs for typing without instant saves and zero bugs
  const [editPrices, setEditPrices] = useState({
    washFold: '450',
    washDry: '500',
    dryClean: '850',
    ironing: '300'
  });

  const [savingPriceKey, setSavingPriceKey] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  // Database Connection / Configuration State
  const [dbConfig, setDbConfig] = useState<any>(null);
  const [dbUrl, setDbUrl] = useState('');
  const [dbKey, setDbKey] = useState('');
  const [dbUse, setDbUse] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);
  const [dbSaveError, setDbSaveError] = useState('');
  const [dbSaveSuccess, setDbSaveSuccess] = useState('');
  const [dbTesting, setDbTesting] = useState(false);
  const [dbTestError, setDbTestError] = useState('');
  const [dbTestSuccess, setDbTestSuccess] = useState('');
  const [dbSeeding, setDbSeeding] = useState(false);
  const [dbSeedError, setDbSeedError] = useState('');
  const [dbSeedSuccess, setDbSeedSuccess] = useState('');

  useEffect(() => {
    loadAdminData();
    loadDbConfig();
  }, []);

  const loadDbConfig = async () => {
    try {
      const config = await api.getSupabaseConfig();
      setDbConfig(config);
      setDbUrl(config.supabaseUrl || '');
      setDbUse(config.useSupabase);
    } catch (err) {
      console.error("Failed to load Supabase config:", err);
    }
  };

  const loadAdminData = async () => {
    try {
      const allStats = await api.getAnalytics();
      setStats(allStats);
      
      const allOrders = await api.getOrders();
      setOrders(allOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      const allUsers = await api.getUsers();
      setUsers(allUsers);

      const activePrices = await api.getPrices();
      setPrices(activePrices);
      setEditPrices({
        washFold: String(activePrices.washFold ?? 450),
        washDry: String(activePrices.washDry ?? 500),
        dryClean: String(activePrices.dryClean ?? 850),
        ironing: String(activePrices.ironing ?? 300)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (id: string) => {
    await api.updateOrder(id, { 
      status: 'cancelled',
      updatedBy: "Admin Boss"
    });
    loadAdminData();
  };

  const handleReassignRider = async (id: string, riderId: string) => {
    const selectedRider = users.find(u => u.id === riderId);
    if (!selectedRider) return;

    const orderToUpdate = orders.find(o => o.id === id);
    const updates: any = {
      riderId,
      riderName: selectedRider.name,
      updatedBy: "Admin Boss"
    };

    if (orderToUpdate?.status === 'pending') {
      updates.status = 'pickup_scheduled';
    }

    await api.updateOrder(id, updates);
    loadAdminData();
  };

  const handleUpdateRole = async (userId: string, newRole: any) => {
    try {
      await api.updateUser(userId, { role: newRole });
      loadAdminData();
    } catch (err) {
      console.error("Failed to update user role:", err);
    }
  };

  const handlePriceInputChange = (serviceKey: 'washFold' | 'washDry' | 'dryClean' | 'ironing', val: string) => {
    // Strip leading zeros unless it's just '0' itself
    let sanitized = val;
    if (sanitized.length > 1 && sanitized.startsWith('0')) {
      sanitized = sanitized.replace(/^0+/, '');
    }
    // Only allow positive integers
    sanitized = sanitized.replace(/[^0-9]/g, '');

    setEditPrices(prev => ({
      ...prev,
      [serviceKey]: sanitized
    }));
  };

  const handleSaveSinglePrice = async (serviceKey: 'washFold' | 'washDry' | 'dryClean' | 'ironing') => {
    setSavingPriceKey(serviceKey);
    setSaveSuccessMessage('');
    try {
      const parsedVal = parseInt(editPrices[serviceKey], 10) || 0;
      const updated = {
        ...prices,
        [serviceKey]: parsedVal
      };

      const res = await api.updatePrices(updated);
      if (res.success) {
        setPrices(updated);
        // Sync back standard string format
        setEditPrices(prev => ({
          ...prev,
          [serviceKey]: String(parsedVal)
        }));
        
        const label = serviceKey === 'washFold' ? 'Wash & Fold' : 
                      serviceKey === 'washDry' ? 'Wash & Dry' : 
                      serviceKey === 'dryClean' ? 'Dry Cleaning' : 'Ironing';
        setSaveSuccessMessage(`Successfully updated ${label} price to ₱${parsedVal}!`);
        
        setTimeout(() => {
          setSaveSuccessMessage('');
        }, 4000);
      }
    } catch (err) {
      console.error("Failed to update price:", err);
    } finally {
      setSavingPriceKey(null);
    }
  };

  const handleSaveDbConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbSaveError('');
    setDbSaveSuccess('');
    setDbSaving(true);
    try {
      const res = await api.updateSupabaseConfig({
        supabaseUrl: dbUrl,
        supabaseKey: dbKey || undefined, // only send if modified
        useSupabase: dbUse
      });
      if (res.success) {
        setDbSaveSuccess(res.message || 'Config saved successfully!');
        setDbConfig(res.config);
        // Refresh layout
        loadDbConfig();
      } else {
        setDbSaveError(res.error || 'Failed to save config');
      }
    } catch (err: any) {
      setDbSaveError(err.message || 'Error occurred while saving configuration');
    } finally {
      setDbSaving(false);
    }
  };

  const handleTestDbConnection = async () => {
    setDbTestError('');
    setDbTestSuccess('');
    setDbTesting(true);
    try {
      const res = await api.testSupabase({
        supabaseUrl: dbUrl,
        supabaseKey: dbKey || undefined
      });
      if (res.success) {
        setDbTestSuccess(res.message || 'Connection test successful!');
      } else {
        setDbTestError(res.error || 'Connection failed');
      }
    } catch (err: any) {
      setDbTestError(err.message || 'Connection failed');
    } finally {
      setDbTesting(false);
    }
  };

  const handleSeedDatabase = async () => {
    setDbSeedError('');
    setDbSeedSuccess('');
    setDbSeeding(true);
    try {
      const res = await api.seedSupabase();
      if (res.success) {
        setDbSeedSuccess(res.message || 'Seeded successfully!');
        loadAdminData(); // Reload analytics logs etc.
      } else {
        setDbSeedError(res.error || 'Failed to seed database');
      }
    } catch (err: any) {
      setDbSeedError(err.message || 'Seeding failed');
    } finally {
      setDbSeeding(false);
    }
  };

  if (!stats || loading) return <div className="p-8 text-center text-slate-500 text-xs">Assembling administrative charts...</div>;

  const totalCalculatedRevenue = orders.reduce((acc, o) => acc + (o.isPaid ? o.cost : 0), 0);

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto pb-20">
      {/* Admin Title Banner */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 
            onDoubleClick={() => {
              setShowDatabaseTab(prev => !prev);
              if (activeTab === 'database') setActiveTab('analytics');
            }}
            className="text-lg font-black text-slate-900 leading-tight select-none cursor-default"
          >
            Admin Overview
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Global LPDMS System Controls
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg flex-wrap gap-1">
          {(showDatabaseTab ? (['analytics', 'orders', 'services', 'users', 'database'] as const) : (['analytics', 'orders', 'services', 'users'] as const)).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 text-[9px] font-extrabold rounded uppercase tracking-wider cursor-pointer ${
                activeTab === tab ? 'bg-[#0d9488] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'analytics' && (
        <>
          {/* Key Stat Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none">Net Income</span>
                <span className="text-xs font-black text-slate-800 truncate block mt-1">₱{totalCalculatedRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
              <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none">Total Bags</span>
                <span className="text-xs font-black text-slate-800 block mt-1">
                  {orders.length}
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
              <div className="w-8 h-8 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none">Rating (SDG 8)</span>
                <span className="text-xs font-black text-slate-800 block mt-1">{stats.customerSatisfaction}⭐</span>
              </div>
            </div>
          </div>

          {/* Visual Recharts Section */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <PackageSearch className="w-4 h-4 text-slate-400" />
              Weekly Dispatch Workload (SDG 9 Efficiency)
            </h3>
            
            <div className="h-44 w-full text-[9px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyOrders}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '10px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uv" 
                    stroke="#0d9488" 
                    strokeWidth={3}
                    dot={{r: 3, strokeWidth: 1}}
                    activeDot={{r: 6}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Audit Logs / Activity logs */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                Live Audits & Accountability
              </h3>
              <span className="text-[9px] text-slate-400 font-bold">Chronological Logs</span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {stats.auditLogs?.map((log: AuditLog, i: number) => (
                <div key={i} className="flex items-start justify-between text-[10px] bg-slate-50 p-2 rounded border border-slate-100 leading-normal">
                  <div>
                    <span className="font-bold text-slate-800">{log.user}: </span>
                    <span className="text-slate-600">{log.action}</span>
                  </div>
                  <span className="text-[8px] text-slate-400 shrink-0 font-mono ml-2">
                    {format(new Date(log.timestamp), 'h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1">
            <ClipboardList className="w-4 h-4 text-[#0d9488]" />
            Active Operations Dashboard
          </h3>

          <div className="space-y-2">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-900">{order.customerName}</strong>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold font-mono">
                        {order.id}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{order.service} • ₱{order.cost}</p>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                    order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                    order.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  {/* Rider Assign controls */}
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Assign Rider:</span>
                    <select
                      value={order.riderId || ''}
                      onChange={e => handleReassignRider(order.id, e.target.value)}
                      className="p-1 border rounded text-[10px] bg-slate-50 text-slate-700 outline-none w-full"
                    >
                      <option value="">-- Unassigned --</option>
                      {users.filter(u => u.role === 'rider').map(rider => (
                        <option key={rider.id} value={rider.id}>{rider.name}</option>
                      ))}
                    </select>
                  </div>

                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-[9px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold px-2.5 py-1 rounded transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="border-b pb-2 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Dynamic Pricing Config (SDG 9)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Control pricing ratios based on transport and energy resources</p>
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Active Connection
            </span>
          </div>

          {saveSuccessMessage && (
            <div className="bg-emerald-50 text-emerald-800 text-[11px] p-2.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 font-medium transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              {saveSuccessMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Wash & Fold Base Pricing (₱)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  pattern="[0-9]*"
                  value={editPrices.washFold} 
                  onChange={e => handlePriceInputChange('washFold', e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg bg-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. 450"
                />
                <button
                  onClick={() => handleSaveSinglePrice('washFold')}
                  disabled={savingPriceKey === 'washFold'}
                  className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-[10px] font-extrabold uppercase px-3 py-2 rounded-lg transition-all shrink-0 flex items-center justify-center min-w-[75px] disabled:opacity-50 cursor-pointer"
                >
                  {savingPriceKey === 'washFold' ? 'Saving...' : 'Change'}
                </button>
              </div>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Wash & Dry Base Pricing (₱)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  pattern="[0-9]*"
                  value={editPrices.washDry} 
                  onChange={e => handlePriceInputChange('washDry', e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg bg-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. 500"
                />
                <button
                  onClick={() => handleSaveSinglePrice('washDry')}
                  disabled={savingPriceKey === 'washDry'}
                  className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-[10px] font-extrabold uppercase px-3 py-2 rounded-lg transition-all shrink-0 flex items-center justify-center min-w-[75px] disabled:opacity-50 cursor-pointer"
                >
                  {savingPriceKey === 'washDry' ? 'Saving...' : 'Change'}
                </button>
              </div>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Dry Cleaning Premium Pricing (₱)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  pattern="[0-9]*"
                  value={editPrices.dryClean} 
                  onChange={e => handlePriceInputChange('dryClean', e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg bg-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. 850"
                />
                <button
                  onClick={() => handleSaveSinglePrice('dryClean')}
                  disabled={savingPriceKey === 'dryClean'}
                  className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-[10px] font-extrabold uppercase px-3 py-2 rounded-lg transition-all shrink-0 flex items-center justify-center min-w-[75px] disabled:opacity-50 cursor-pointer"
                >
                  {savingPriceKey === 'dryClean' ? 'Saving...' : 'Change'}
                </button>
              </div>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Ironing Premium Pricing (₱)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  pattern="[0-9]*"
                  value={editPrices.ironing} 
                  onChange={e => handlePriceInputChange('ironing', e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg bg-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. 300"
                />
                <button
                  onClick={() => handleSaveSinglePrice('ironing')}
                  disabled={savingPriceKey === 'ironing'}
                  className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-[10px] font-extrabold uppercase px-3 py-2 rounded-lg transition-all shrink-0 flex items-center justify-center min-w-[75px] disabled:opacity-50 cursor-pointer"
                >
                  {savingPriceKey === 'ironing' ? 'Saving...' : 'Change'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100">
            <p className="text-[9px] text-emerald-800 leading-normal font-medium">
              💡 Changes apply instantly. Customers booking their laundry will see the updated rates automatically displayed in their panel, calculated in real-time.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Active System Users</h3>
          
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 font-extrabold">{u.name}</strong>
                    <span className="text-[8px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                      {u.id}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{u.email} • {u.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div className="flex flex-col items-end">
                    <select
                      value={u.role}
                      onChange={e => handleUpdateRole(u.id, e.target.value)}
                      className="text-[10px] font-bold bg-[#f0fdfa] text-[#0d9488] border border-[#99f6e4] px-2 py-1 rounded-lg outline-none focus:ring-1 focus:ring-[#0d9488] cursor-pointer"
                    >
                      <option value="customer">Customer</option>
                      <option value="rider">Rider</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    {u.points !== undefined && (
                      <span className="block text-[9px] text-teal-600 font-bold mt-1">{u.points} Points</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="border-b pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#0d9488]" />
                Supabase Integration Diagnostics & Settings
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Manage live remote storage connection and schema population</p>
            </div>
            <button 
              onClick={() => { loadDbConfig(); loadAdminData(); }}
              className="p-1 text-slate-400 hover:text-slate-600 active:rotate-180 transition-all duration-300"
              title="Refresh connection status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1. Connection Banner */}
          <div className={`p-4 rounded-xl border ${
            dbConfig?.useSupabase && dbConfig?.tablesExist
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
              : dbConfig?.useSupabase
                ? 'bg-amber-50/70 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
          } text-xs space-y-2`}>
            <div className="flex items-center gap-2 font-black uppercase tracking-wide text-[10px]">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                dbConfig?.useSupabase && dbConfig?.tablesExist
                  ? 'bg-emerald-500 animate-pulse'
                  : dbConfig?.useSupabase
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-slate-400'
              }`} />
              Database Status:{' '}
              {dbConfig?.useSupabase && dbConfig?.tablesExist
                ? 'Supabase Connected (Live Database)'
                : dbConfig?.useSupabase
                  ? 'Local Offline Fallback (Supabase Unreachable/Tables Missing)'
                  : 'In-Memory Only (Transitional Demo Mode)'}
            </div>
            <p className="leading-relaxed text-[10px]">
              {dbConfig?.useSupabase && dbConfig?.tablesExist
                ? '🎉 Your application is successfully writing all registered users, customer bookings, staff inventory, and audit logs directly into Supabase! Any action is persistent and safe.'
                : dbConfig?.useSupabase
                  ? '⚠️ The server attempted to connect to Supabase, but failed or found missing tables. To prevent app crashes, it fell back to local in-memory storage. Registered users and bookings are temporary and WILL NOT appear in Supabase until the connection is fixed and tables are created.'
                  : 'Your application is running in an offline-first sandbox mode. Registrations and orders are stored in temporary RAM. Enable the toggle below to activate persistent Supabase cloud synchronization.'}
            </p>
          </div>

          {/* 2. Config Form */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Connection Parameters</h4>
            
            <form onSubmit={handleSaveDbConfig} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Supabase Project URL</label>
                <input 
                  type="text" 
                  value={dbUrl} 
                  onChange={e => setDbUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 text-slate-800 outline-none focus:bg-white focus:border-[#0d9488]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Supabase Service Role / Anon Key</label>
                <input 
                  type="password" 
                  value={dbKey} 
                  onChange={e => setDbKey(e.target.value)}
                  placeholder={dbConfig?.supabaseKeyExists ? "•••••••••••••••••••••••• (Saved)" : "Enter your Supabase key"}
                  className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 text-slate-800 outline-none focus:bg-white focus:border-[#0d9488]"
                />
                <p className="text-[9px] text-slate-400 mt-1">Leave blank to keep your current saved key.</p>
                <p className="text-[9px] text-amber-600 font-medium leading-relaxed mt-1.5 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                  💡 <strong>Pro-Tip:</strong> Using your Supabase <strong>service_role</strong> secret API key (instead of the <em>anon</em> public key) automatically bypasses Row-Level Security (RLS). This makes register, login, and orders work instantly without needing to configure policy rules or disable RLS!
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="dbUse" 
                  checked={dbUse} 
                  onChange={e => setDbUse(e.target.checked)}
                  className="w-4 h-4 text-[#0d9488] rounded accent-[#0d9488] cursor-pointer"
                />
                <label htmlFor="dbUse" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                  Activate Persistent Supabase Storage
                </label>
              </div>

              {dbSaveSuccess && (
                <div className="p-2 text-[10px] bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                  {dbSaveSuccess}
                </div>
              )}
              {dbSaveError && (
                <div className="p-2 text-[10px] bg-rose-50 text-rose-700 rounded border border-rose-100">
                  {dbSaveError}
                </div>
              )}
              {dbTestSuccess && (
                <div className="p-2 text-[10px] bg-blue-50 text-blue-700 rounded border border-blue-100 leading-normal">
                  {dbTestSuccess}
                </div>
              )}
              {dbTestError && (
                <div className="p-2 text-[10px] bg-amber-50 text-amber-700 rounded border border-amber-100 leading-normal">
                  {dbTestError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={dbSaving}
                  className="flex-1 bg-[#0d9488] hover:bg-[#0b7a70] text-white py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {dbSaving ? 'Saving...' : 'Save Config'}
                </button>
                <button
                  type="button"
                  onClick={handleTestDbConnection}
                  disabled={dbTesting}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {dbTesting ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </form>
          </div>

          {/* 3. Database Seed Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Initialization Utilities</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              If you have successfully created the tables in your Supabase database but they are completely empty, click the button below to seed all initial system accounts (Admin, Staff, Rider, Customers), default inventory products, and initial audit trails!
            </p>

            {dbSeedSuccess && (
              <div className="p-2 text-[10px] bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                {dbSeedSuccess}
              </div>
            )}
            {dbSeedError && (
              <div className="p-2 text-[10px] bg-rose-50 text-rose-700 rounded border border-rose-100">
                {dbSeedError}
              </div>
            )}

            <button
              onClick={handleSeedDatabase}
              disabled={dbSeeding || !dbConfig?.isConnected}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dbSeeding ? 'animate-spin' : ''}`} />
              {dbSeeding ? 'Seeding Tables...' : 'Seed Default Demo Data inside Supabase'}
            </button>
            {!dbConfig?.isConnected && (
              <p className="text-[8px] text-amber-600 font-bold text-center">⚠️ Connect and Save your Supabase Credentials first to enable seeding.</p>
            )}
          </div>

          {/* 4. SQL Schema Instructions */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl shadow-xs space-y-2 font-mono text-[9px] overflow-hidden">
            <div className="flex items-center justify-between text-[10px] text-white font-sans font-bold border-b border-slate-800 pb-1.5">
              <span>Required PostgreSQL Schema Setup</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  address TEXT,
  phone TEXT,
  rating NUMERIC DEFAULT 0,
  status TEXT,
  station TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  cost NUMERIC DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  special_instructions TEXT,
  payment_method TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  qr_code_value TEXT,
  address TEXT,
  phone TEXT,
  rider_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  rider_name TEXT,
  rating INTEGER,
  review TEXT
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  min_limit NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  review TEXT,
  type TEXT NOT NULL DEFAULT 'Review'
);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;

-- Permissive Policies
CREATE POLICY "Allow public select on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public select on orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow public select on inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "Allow public insert on inventory" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on inventory" ON inventory FOR UPDATE USING (true);
CREATE POLICY "Allow public select on audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on feedbacks" ON feedbacks FOR SELECT USING (true);
CREATE POLICY "Allow public insert on feedbacks" ON feedbacks FOR INSERT WITH CHECK (true);`);
                  alert("SQL Schema copied to clipboard!");
                }}
                className="text-teal-400 hover:text-teal-300 font-extrabold underline shrink-0 cursor-pointer"
              >
                Copy SQL Code
              </button>
            </div>
            <p className="text-slate-400 font-sans leading-relaxed text-[9px] pb-1 font-semibold">
              Please copy and execute this exact SQL block in your **Supabase SQL Editor** to create all five default tables and bypass Row-Level Security:
            </p>
            <pre className="overflow-x-auto max-h-40 bg-slate-950 p-2 rounded text-teal-400 select-all leading-normal whitespace-pre">
{`-- 1. Create Tables & Disable RLS / Set Permissive Policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;

-- 2. Permissive Public Policies
CREATE POLICY "Allow public select on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public select on orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true);`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
