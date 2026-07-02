import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../App';
import { Order, OrderStatus, STATUS_LABELS } from '../types';
import { 
  MapPin, QrCode, CheckCircle, Package, ArrowRight, Navigation2, 
  Camera, Check, Edit3, Trash2, Milestone, PhoneCall 
} from 'lucide-react';

export default function RiderDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog / Interaction State
  const [scanning, setScanning] = useState<Order | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraImage, setCameraImage] = useState<string>('');
  const [signingOrder, setSigningOrder] = useState<Order | null>(null);

  // HTML5 Signature Pad Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await api.getOrders(user.id, 'rider');
      // Rider handles pickup schedules and ready to deliver
      const relevant = data.filter(o => 
        ['pickup_scheduled', 'ready_for_delivery'].includes(o.status)
      );
      setOrders(relevant);
    } catch (err) {
      console.error("Failed to load rider orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcess = (order: Order) => {
    setScanning(order);
  };

  const simulateCameraCapture = () => {
    setCameraActive(true);
    setTimeout(() => {
      setCameraImage('https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=120&auto=format&fit=crop&q=60');
      setCameraActive(false);
    }, 1200);
  };

  const confirmScanProof = async () => {
    if (!scanning) return;
    const isPickup = scanning.status === 'pickup_scheduled';
    const nextStatus: OrderStatus = isPickup ? 'picked_up' : 'delivered';

    if (isPickup) {
      // For pickups, we advance directly once scanned
      await api.updateOrder(scanning.id, { 
        status: nextStatus,
        updatedBy: user?.name || "Rider"
      });
      setScanning(null);
      setCameraImage('');
      loadOrders();
    } else {
      // For deliveries, we transition to signing phase
      const orderToSign = scanning;
      setScanning(null);
      setCameraImage('');
      setSigningOrder(orderToSign);
    }
  };

  // Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    
    // Get mouse/touch coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    if (!signingOrder) return;
    
    // Complete the delivery cycle
    await api.updateOrder(signingOrder.id, { 
      status: 'delivered',
      isPaid: true, // auto cash collected if COD
      updatedBy: user?.name || "Rider"
    });

    setSigningOrder(null);
    loadOrders();
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto pb-20">
      {/* Rider Quick Summary */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Rider Hub</p>
          <h2 className="text-xl font-black">{user?.name || "Rider"}</h2>
          <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Duty Active • 4.9⭐ Rating
          </p>
        </div>
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/60 text-center">
          <span className="block text-[10px] font-bold text-slate-400 uppercase leading-none">Remaining</span>
          <span className="text-lg font-extrabold mt-1 block">{orders.length}</span>
        </div>
      </div>

      {/* SVG Smart Route Assistance Panel */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1">
            <Milestone className="w-4 h-4 text-emerald-600" />
            SDG 9 Route Assistant
          </h3>
          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <Navigation2 className="w-3 h-3 fill-emerald-600 rotate-45" /> Path Optimized
          </span>
        </div>

        <div className="relative w-full h-32 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
          {/* Simulated Grid Coordinates Map */}
          <svg className="w-full h-full stroke-slate-200" viewBox="0 0 100 50">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" strokeWidth="0.5" />
            </pattern>
            <rect width="100" height="50" fill="url(#grid)" />
            
            {/* Draw optimized transit vector */}
            <path d="M 10 35 Q 35 15 65 35 T 90 20" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="3,3" className="animate-[dash_10s_linear_infinite]" />
            
            {/* Optimized coordinates pin */}
            <circle cx="10" cy="35" r="3" fill="#0d9488" />
            <text x="12" y="38" className="text-[4px] font-bold fill-slate-500 font-sans">Hub A (Taft)</text>

            <circle cx="50" cy="28" r="3" fill="#10B981" />
            <text x="54" y="30" className="text-[4px] font-bold fill-slate-700 font-sans">LPD-1024</text>

            <circle cx="90" cy="20" r="3" fill="#F59E0B" />
            <text x="74" y="16" className="text-[4px] font-bold fill-slate-700 font-sans">LPD-1025</text>
          </svg>
        </div>
        <p className="text-[10px] text-slate-500 leading-normal">
          Smart scheduling analyzes active routes to minimize fuel consumption, contributing directly to <strong>SDG 8 & 9 (Sustainable Growth & Green Logistics)</strong>.
        </p>
      </div>

      {/* Task Queue List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Assigned Deliveries & Pickups</h3>
        
        {loading ? (
          <div className="text-center text-slate-400 py-6 text-xs">Fetching route data...</div>
        ) : orders.length === 0 ? (
          <div className="text-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-slate-900 font-bold text-xs">All caught up!</p>
            <p className="text-slate-400 text-[9px]">Check with dispatch for newly scheduled laundry bags.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map(order => {
              const isPickup = order.status === 'pickup_scheduled';
              return (
                <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isPickup ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {isPickup ? 'Pickup Bag' : 'Deliver'}
                        </span>
                        <span className="text-xs font-black text-slate-900">{order.customerName}</span>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 flex items-center mt-1.5 font-semibold gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {order.address}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 block">{order.id}</span>
                      <span className="text-xs font-black text-slate-900 block mt-0.5">₱{order.cost}</span>
                    </div>
                  </div>

                  {order.specialInstructions && (
                    <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-100">
                      <p className="text-[9px] text-amber-800 leading-normal font-medium">
                        <strong>Instruction:</strong> {order.specialInstructions}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <a 
                      href={`tel:${order.phone}`}
                      className="flex items-center justify-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200/40"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                    <button 
                      onClick={() => handleStartProcess(order)}
                      className={`flex-1 text-xs font-bold py-2 rounded-lg text-white shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                        isPickup ? 'bg-[#0d9488] hover:bg-[#0b7a70]' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      {isPickup ? 'Scan Bag' : 'Deliver Scan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Simulated Scanner & Proof Upload Sheet */}
      {scanning && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-1 border-b">
              <h4 className="font-extrabold text-slate-900 text-sm">QR Code Diagnostic Scanner</h4>
              <button onClick={() => setScanning(null)} className="text-slate-400 text-xs font-bold">Close</button>
            </div>

            <div className="space-y-1 text-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Scanning Order Bag</span>
              <p className="text-sm font-extrabold text-slate-800">{scanning.id}</p>
            </div>

            {/* Simulated Camera Feed view */}
            <div className="aspect-square w-full max-w-[200px] mx-auto rounded-xl bg-slate-950 flex flex-col items-center justify-center border-4 border-slate-800 relative overflow-hidden group">
              {cameraActive ? (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : cameraImage ? (
                <img src={cameraImage} alt="Captured proof" className="w-full h-full object-cover" />
              ) : (
                <button 
                  type="button" 
                  onClick={simulateCameraCapture}
                  className="text-white p-3 hover:scale-105 transition-all text-center flex flex-col items-center gap-1.5"
                >
                  <Camera className="w-8 h-8 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400">Capture Proof Photo</span>
                </button>
              )}

              {/* Grid scanning effect */}
              {!cameraImage && (
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-500 animate-bounce" />
              )}
            </div>

            <p className="text-[10px] text-slate-500 text-center leading-normal">
              Place the printed QR code of bag <strong>{scanning.id}</strong> inside the frame. 
            </p>

            <button
              onClick={confirmScanProof}
              disabled={!cameraImage}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                cameraImage ? 'bg-slate-900 hover:bg-black text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Check className="w-4 h-4" />
              Confirm Scan & Photo Proof
            </button>
          </div>
        </div>
      )}

      {/* HTML5 Signature Pad Modal */}
      {signingOrder && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-1 border-b">
              <h4 className="font-extrabold text-slate-900 text-sm">Customer Signature Capture</h4>
              <button onClick={() => setSigningOrder(null)} className="text-slate-400 text-xs font-bold">Cancel</button>
            </div>

            <div className="text-center space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Deliver To</span>
              <p className="text-xs font-extrabold text-slate-800">{signingOrder.customerName}</p>
            </div>

            {/* Signature Pad */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 relative">
              <canvas
                ref={canvasRef}
                width={300}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[150px] cursor-crosshair touch-none"
              />
              <span className="absolute bottom-2 left-2 text-[9px] text-slate-400 select-none">Draw signature on line</span>
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={clearCanvas}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
              <button 
                type="button" 
                onClick={saveSignature}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Complete Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
