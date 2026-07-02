import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../App';
import { Order, OrderStatus, STATUS_LABELS, InventoryItem } from '../types';
import { 
  WashingMachine, ArrowRight, ClipboardCheck, AlertTriangle, 
  Scaling, Sparkles, AlertCircle, RefreshCw, Layers, Check 
} from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Process Dialog
  const [processingOrder, setProcessingOrder] = useState<Order | null>(null);
  const [simulatedWeight, setSimulatedWeight] = useState(0);
  const [staffNote, setStaffNote] = useState('');
  const [stainChecked, setStainChecked] = useState(false);
  const [damageReported, setDamageReported] = useState(false);

  // Restock Feedback State
  const [restockingId, setRestockingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allOrders = await api.getOrders();
      // Staff works on orders currently picked up, washing, drying, folding
      const relevant = allOrders.filter(o => 
        ['picked_up', 'washing', 'drying', 'folding'].includes(o.status)
      );
      setOrders(relevant);
      
      const invData = await api.getInventory();
      setInventory(invData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const advanceStatus = async (order: Order) => {
    // If order has no weight registered and is picked up, let's force weight calibration first!
    if (order.status === 'picked_up' && (!order.weight || order.weight === 0)) {
      setProcessingOrder(order);
      setSimulatedWeight(4.5); // default starting simulation
      setStaffNote(order.specialInstructions || '');
      setStainChecked(false);
      setDamageReported(false);
      return;
    }

    const flow: Record<string, OrderStatus> = {
      picked_up: 'washing',
      washing: 'drying',
      drying: 'folding',
      folding: 'ready_for_delivery'
    };
    
    const next = flow[order.status];
    if (next) {
      await api.updateOrder(order.id, { 
        status: next,
        updatedBy: user?.name || "Staff Maria"
      });
      loadData();
    }
  };

  const handleSimulateWeight = () => {
    // Generate weight between 2.0 kg and 8.5 kg
    const w = parseFloat((2.0 + Math.random() * 6.5).toFixed(1));
    setSimulatedWeight(w);
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingOrder) return;

    let notes = staffNote;
    if (stainChecked) notes += " [QC: Pre-existing stains checked]";
    if (damageReported) notes += " [QC WARNING: Tear/Wear Reported]";

    await api.updateOrder(processingOrder.id, {
      weight: simulatedWeight,
      status: 'washing',
      specialInstructions: notes,
      updatedBy: user?.name || "Staff Maria"
    });

    setProcessingOrder(null);
    loadData();
  };

  const handleRefill = async (id: string, currentUnit: string) => {
    setRestockingId(id);
    const refillAmt = currentUnit === 'L' ? 5 : 50;
    try {
      await api.refillInventory(id, refillAmt);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setRestockingId(null);
    }
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto pb-20">
      {/* Staff Hub Header */}
      <div className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-teal-100">Hub Operations</p>
          <h2 className="text-xl font-black">{user?.name || "Maria Staff"}</h2>
          <p className="text-[10px] text-teal-50 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Station: Main Washing Hub B
          </p>
        </div>
        <WashingMachine className="text-teal-200 w-8 h-8 animate-[spin_8s_linear_infinite]" />
      </div>

      {/* Grid: Active Orders & Inventory Monitoring */}
      <div className="space-y-4">
        {/* Active Batches Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Washing Station Queue</h3>
            <span className="text-[10px] font-bold text-slate-400">Queue: {orders.length} batches</span>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-6 text-xs">Calibrating washing queues...</div>
          ) : orders.length === 0 ? (
            <div className="text-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-slate-900 font-bold text-xs">Station idle</p>
              <p className="text-slate-400 text-[9px]">Awaiting active riders to bring dirty laundry bags.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {orders.map(order => {
                const needsWeight = order.status === 'picked_up' && (!order.weight || order.weight === 0);
                return (
                  <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900">{order.customerName}'s Wash</span>
                          <span className="text-[9px] font-mono text-[#0d9488] bg-teal-50 px-1.5 py-0.5 rounded font-bold">
                            {order.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{order.service}</p>
                      </div>

                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50">
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    {order.specialInstructions && (
                      <p className="text-[9px] text-slate-600 bg-slate-50 p-2 rounded-lg leading-normal border border-slate-100/50">
                        <strong className="text-teal-600">Note:</strong> {order.specialInstructions}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        Weight: <strong className="text-slate-700">{order.weight ? `${order.weight} kg` : 'Unweighed'}</strong>
                      </span>

                      <button 
                        onClick={() => advanceStatus(order)}
                        className={`text-[10px] font-bold py-1.5 px-3.5 rounded-lg text-white shadow-xs transition-colors flex items-center gap-1 ${
                          needsWeight ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#0d9488] hover:bg-[#0b7a70]'
                        }`}
                      >
                        {needsWeight ? (
                          <>
                            <Scaling className="w-3.5 h-3.5" /> Weigh & Begin
                          </>
                        ) : (
                          <>
                            Proceed Stage <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Smart Inventory Section */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0d9488]" />
              SDG 9 Supply Monitors
            </h3>
            <span className="text-[9px] text-slate-400 font-bold uppercase">4 Chemical Nodes</span>
          </div>

          <div className="space-y-3">
            {inventory.map(item => {
              const isLow = item.quantity <= item.minLimit;
              const fillPercentage = Math.min(100, (item.quantity / (item.minLimit * 3.5)) * 100);
              
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span className="flex items-center gap-1 text-slate-800 font-extrabold">
                      {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      {item.name}
                    </span>
                    <span className="text-slate-500 font-extrabold">
                      {item.quantity.toFixed(1)} {item.unit}
                    </span>
                  </div>

                  {/* Horizontal visual meter bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex relative border border-slate-200/50">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        isLow ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-[#0d9488] to-teal-500'
                      }`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[8px] text-slate-400">
                      Limit warning threshold: {item.minLimit} {item.unit}
                    </span>
                    <button 
                      onClick={() => handleRefill(item.id, item.unit)}
                      disabled={restockingId === item.id}
                      className="text-[8px] font-bold text-[#0d9488] hover:text-[#0b7a70] transition-colors uppercase tracking-wider"
                    >
                      {restockingId === item.id ? 'Refilling...' : `Refill +${item.unit === 'L' ? '5L' : '50pcs'}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simulated Weight Scale & Quality Control Sheet */}
      {processingOrder && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleWeightSubmit} className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-1">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Scaling className="w-4 h-4 text-amber-500" />
                Weight Scale Calibration
              </h4>
              <button type="button" onClick={() => setProcessingOrder(null)} className="text-slate-400 text-xs font-bold">Close</button>
            </div>

            {/* Digiscale Screen */}
            <div className="bg-slate-900 p-4 rounded-xl text-center border-4 border-slate-800 space-y-1 relative shadow-inner">
              <span className="text-[8px] font-mono font-bold text-emerald-500/60 uppercase tracking-widest block">Digital Balance Calibrated</span>
              <span className="text-3xl font-mono font-extrabold text-emerald-400 tracking-tight block">
                {simulatedWeight.toFixed(1)} <span className="text-xs text-emerald-500/70">kg</span>
              </span>
              <button 
                type="button" 
                onClick={handleSimulateWeight}
                className="mt-2 text-[9px] bg-slate-800 hover:bg-slate-750 text-emerald-300 font-bold py-1 px-3 rounded-lg transition-colors border border-emerald-500/20"
              >
                Simulate Placing Laundry on Scale
              </button>
            </div>

            {/* Quality Control Parameters */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Pre-Wash Quality Control Checks</span>
              
              <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={stainChecked}
                  onChange={e => setStainChecked(e.target.checked)}
                  className="rounded text-[#0d9488] focus:ring-[#0d9488]/35 h-3.5 w-3.5"
                />
                <span className="text-[10px] font-medium text-slate-700 leading-normal">Confirm item pre-existing stains checked & logged</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={damageReported}
                  onChange={e => setDamageReported(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                />
                <span className="text-[10px] font-medium text-slate-700 leading-normal text-rose-700 font-semibold">Report physical damage warning (Hole/Tear/Fraying)</span>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Internal Operations Notes</label>
              <input 
                type="text"
                value={staffNote}
                onChange={e => setStaffNote(e.target.value)}
                placeholder="e.g. Check coat pocket, extra spin cycle requested..."
                className="w-full text-xs p-2 border rounded-lg bg-slate-50 outline-none focus:border-[#0d9488]"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-black transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Log Weight & Begin Wash
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
