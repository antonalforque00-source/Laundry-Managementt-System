import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Order, User, AuditLog, STATUS_LABELS } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, DollarSign, TrendingUp, PackageSearch, Award, ShieldAlert, 
  MapPin, Settings, Check, Trash2, Calendar, ClipboardList 
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'services' | 'users'>('analytics');

  // Pricing State
  const [prices, setPrices] = useState({
    washFold: 450,
    washDry: 500,
    dryClean: 850,
    ironing: 300
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const allStats = await api.getAnalytics();
      setStats(allStats);
      
      const allOrders = await api.getOrders();
      setOrders(allOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      const allUsers = await api.getUsers();
      setUsers(allUsers);
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

    await api.updateOrder(id, {
      riderId,
      riderName: selectedRider.name,
      updatedBy: "Admin Boss"
    });
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

  const handleUpdatePrice = (serviceKey: keyof typeof prices, val: string) => {
    setPrices(prev => ({ ...prev, [serviceKey]: Number(val) }));
  };

  if (!stats || loading) return <div className="p-8 text-center text-slate-500 text-xs">Assembling administrative charts...</div>;

  const totalCalculatedRevenue = orders.reduce((acc, o) => acc + (o.isPaid ? o.cost : 0), 0);

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto pb-20">
      {/* Admin Title Banner */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-lg font-black text-slate-900 leading-tight">Admin Overview</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Global LPDMS System Controls</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['analytics', 'orders', 'services', 'users'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 text-[9px] font-extrabold rounded uppercase tracking-wider ${
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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Dynamic Pricing Config (SDG 9)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Control pricing ratios based on transport and energy resources</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Wash & Fold Base Pricing (₱)</label>
              <input 
                type="number" 
                value={prices.washFold} 
                onChange={e => handleUpdatePrice('washFold', e.target.value)}
                className="w-full text-xs p-2 border rounded-lg bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Wash & Dry Base Pricing (₱)</label>
              <input 
                type="number" 
                value={prices.washDry} 
                onChange={e => handleUpdatePrice('washDry', e.target.value)}
                className="w-full text-xs p-2 border rounded-lg bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Dry Cleaning Premium Pricing (₱)</label>
              <input 
                type="number" 
                value={prices.dryClean} 
                onChange={e => handleUpdatePrice('dryClean', e.target.value)}
                className="w-full text-xs p-2 border rounded-lg bg-slate-50"
              />
            </div>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100">
            <p className="text-[9px] text-emerald-800 leading-normal">
              Changes apply instantly across newly generated bookings. Active campaigns and discount points are factored dynamically into customer book estimates.
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
    </div>
  );
}
