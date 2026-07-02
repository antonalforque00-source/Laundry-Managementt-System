import React, { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { Order, STATUS_LABELS, OrderStatus } from '../types';
import { 
  Package, Clock, MapPin, CheckCircle, CreditCard, Sparkles, 
  ChevronRight, BrainCircuit, AlertTriangle, Star, Check, Send, 
  Bell, Edit2, ShieldCheck, X 
} from 'lucide-react';
import { format } from 'date-fns';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingMode, setBookingMode] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([
    "Your pickup request for order LPD-1025 has been scheduled.",
    "Your payment of ₱450 was successfully confirmed for LPD-1024!"
  ]);

  // Form State
  const [service, setService] = useState('Wash & Fold');
  const [instructions, setInstructions] = useState('');
  const [payment, setPayment] = useState('Cash on Delivery');
  const [customAddress, setCustomAddress] = useState(user?.address || '');
  const [customPhone, setCustomPhone] = useState(user?.phone || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // AI Forecast State
  const [predicting, setPredicting] = useState(false);
  const [aiPrediction, setAiPrediction] = useState('');
  const [weather, setWeather] = useState('Sunny');
  const [traffic, setTraffic] = useState('Moderate');

  // Interactive Payment State
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [selectedEWallet, setSelectedEWallet] = useState<'GCash' | 'Maya' | 'Card'>('GCash');
  const [isPayProcessing, setIsPayProcessing] = useState(false);

  // Feedback State
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Dynamic Pricing State
  const [dbPrices, setDbPrices] = useState({
    washFold: 450,
    washDry: 500,
    dryClean: 850,
    ironing: 300
  });

  useEffect(() => {
    loadOrders();
    loadDbPrices();
  }, [user]);

  const loadDbPrices = async () => {
    try {
      const p = await api.getPrices();
      setDbPrices(p);
    } catch (err) {
      console.error("Error loading prices:", err);
    }
  };

  const loadOrders = async () => {
    if (!user) return;
    const data = await api.getOrders(user.id, user.role);
    setOrders(data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.updateUser(user.id, { address: customAddress, phone: customPhone });
      setIsEditingProfile(false);
      // alert simulation inside UI instead of native window.alert
      setNotifications(prev => ["Your profile and delivery coordinates have been updated.", ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let baseCost = dbPrices.washFold;
    if (service.includes('Dry Cleaning')) {
      baseCost = dbPrices.dryClean;
    } else if (service.includes('Ironing')) {
      baseCost = dbPrices.ironing;
    } else if (service.includes('Wash & Dry')) {
      baseCost = dbPrices.washDry;
    }
    
    const newOrder = await api.createOrder({
      customerId: user.id,
      customerName: user.name,
      service,
      cost: baseCost,
      specialInstructions: instructions,
      paymentMethod: payment,
      isPaid: false,
      address: customAddress || user.address || "123 Main St",
      phone: customPhone || user.phone || "+63 900 000 0000"
    });

    setBookingMode(false);
    setInstructions('');
    setNotifications(prev => [`New laundry order scheduled! ID: ${newOrder.id}`, ...prev]);
    loadOrders();
  };

  const handleAIPredict = async () => {
    setPredicting(true);
    setAiPrediction('');
    try {
      const activeBacklog = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
      const res = await api.predictDelivery({
        service,
        workloadCount: activeBacklog + 2,
        weather,
        trafficLevel: traffic
      });
      setAiPrediction(res.prediction);
    } catch (error) {
      console.error(error);
    } finally {
      setPredicting(false);
    }
  };

  const handlePayConfirm = async () => {
    if (!payingOrder) return;
    setIsPayProcessing(true);
    setTimeout(async () => {
      await api.updateOrder(payingOrder.id, { isPaid: true });
      setNotifications(prev => [`Payment of ₱${payingOrder.cost} for order ${payingOrder.id} confirmed via ${selectedEWallet}!`, ...prev]);
      setPayingOrder(null);
      setIsPayProcessing(false);
      loadOrders();
    }, 1500);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingOrder) return;
    await api.submitFeedback(ratingOrder.id, {
      rating: ratingStars,
      review: reviewText,
      customerName: user?.name
    });
    setNotifications(prev => [`Feedback submitted for ${ratingOrder.id}! Earned +5 Loyalty Points.`, ...prev]);
    setRatingOrder(null);
    setReviewText('');
    loadOrders();
  };

  const getEstCost = () => {
    if (service.includes('Wash & Fold')) return 450;
    if (service.includes('Dry Cleaning')) return 850;
    if (service.includes('Ironing')) return 300;
    return 500;
  };

  return (
    <div className="p-4 space-y-5 h-full overflow-y-auto pb-20">
      {/* Header Widget */}
      <div className="bg-gradient-to-br from-[#0d9488] to-[#0f766e] rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BrainCircuit className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-wider font-extrabold text-teal-100">Welcome back!</p>
          <h2 className="text-xl font-black mt-0.5">{user?.name}</h2>
          
          <div className="flex items-center space-x-1.5 mt-4 bg-white/15 px-3 py-1.5 rounded-xl w-fit">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span className="text-xs font-bold text-yellow-100">{user?.points || 150} Loyalty Points</span>
          </div>

          <div className="flex gap-2 mt-5">
            <button 
              onClick={() => { setBookingMode(!bookingMode); setIsEditingProfile(false); }}
              className="flex-1 bg-white text-teal-700 text-xs py-2.5 rounded-xl font-extrabold shadow hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" />
              {bookingMode ? 'Cancel Booking' : 'Book Laundry'}
            </button>
            <button 
              onClick={() => { setIsEditingProfile(!isEditingProfile); setBookingMode(false); }}
              className="px-3 bg-teal-500/30 text-white rounded-xl text-xs font-bold hover:bg-teal-500/50 transition-all flex items-center justify-center border border-white/20"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div className="bg-teal-50/70 rounded-xl p-3 border border-teal-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Bell className="w-4 h-4 text-[#0d9488]" />
            <span className="text-xs font-bold text-teal-800">Recent Updates</span>
          </div>
          <div className="space-y-1">
            {notifications.slice(0, 2).map((notif, index) => (
              <p key={index} className="text-[10px] text-slate-600 leading-normal flex items-start gap-1">
                <span className="text-[#0d9488] font-bold">•</span>
                {notif}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Edit Profile Panel */}
      {isEditingProfile && (
        <form onSubmit={handleUpdateProfile} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Address Coordinator</h3>
            <button type="button" onClick={() => setIsEditingProfile(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Mobile Contact No.</label>
            <input 
              type="text" 
              value={customPhone} 
              onChange={e => setCustomPhone(e.target.value)}
              className="w-full text-xs p-2 border rounded-lg bg-slate-50 outline-none focus:border-[#0d9488]"
              placeholder="+63 917..." required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Pickup / Dropoff Coordinates</label>
            <textarea 
              value={customAddress} 
              onChange={e => setCustomAddress(e.target.value)}
              className="w-full text-xs p-2 border rounded-lg bg-slate-50 outline-none focus:border-[#0d9488]"
              placeholder="Full address coordinates..." rows={2} required
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors">
            Update Coordinates
          </button>
        </form>
      )}

      {/* Booking Form with AI Forecast */}
      {bookingMode ? (
        <form onSubmit={handleBook} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3.5">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#0d9488]" />
            Schedule Pickup
          </h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Select Laundry Treatment</label>
            <select 
              value={service} 
              onChange={e => setService(e.target.value)} 
              className="w-full p-2.5 border rounded-lg bg-slate-50 text-xs font-medium outline-none focus:border-[#0d9488]"
            >
              <option>Wash & Fold (₱450)</option>
              <option>Wash & Dry (₱500)</option>
              <option>Dry Cleaning (₱850)</option>
              <option>Ironing Only (₱300)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Special Instructions / Sensitive Items</label>
            <textarea 
              value={instructions} 
              onChange={e => setInstructions(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-slate-50 text-xs outline-none focus:border-[#0d9488]"
              placeholder="e.g., Use hypoallergenic conditioner, wash separately..." 
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Method</label>
              <select 
                value={payment} 
                onChange={e => setPayment(e.target.value)} 
                className="w-full p-2 border rounded-lg bg-slate-50 text-xs outline-none focus:border-[#0d9488]"
              >
                <option>Cash on Delivery</option>
                <option>GCash</option>
                <option>Maya</option>
                <option>Credit/Debit Card</option>
              </select>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 flex flex-col justify-center border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Estimated Cost</span>
              <span className="text-sm font-extrabold text-slate-800">₱{getEstCost()}</span>
            </div>
          </div>

          {/* AI-Based Forecast Tool */}
          <div className="bg-teal-50/60 rounded-xl p-3 border border-teal-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-teal-800 flex items-center gap-1">
                <BrainCircuit className="w-3.5 h-3.5" />
                AI Infrastructure Forecast (SDG 9)
              </span>
              <button 
                type="button"
                onClick={handleAIPredict}
                disabled={predicting}
                className="text-[9px] bg-[#0d9488] hover:bg-[#0b7a70] text-white font-bold py-1 px-2.5 rounded-lg transition-colors flex items-center gap-1"
              >
                {predicting ? 'Forecasting...' : 'Predict Delivery'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              <select 
                value={weather} 
                onChange={e => setWeather(e.target.value)} 
                className="p-1 border rounded bg-white text-[9px] text-teal-900 outline-none focus:border-[#0d9488]"
              >
                <option value="Sunny">Weather: Sunny</option>
                <option value="Rainy">Weather: Heavy Rain</option>
                <option value="Cloudy">Weather: Cloudy</option>
                <option value="Stormy">Weather: Stormy</option>
              </select>

              <select 
                value={traffic} 
                onChange={e => setTraffic(e.target.value)} 
                className="p-1 border rounded bg-white text-[9px] text-teal-900 outline-none focus:border-[#0d9488]"
              >
                <option value="Light">Traffic: Light</option>
                <option value="Moderate">Traffic: Moderate</option>
                <option value="Heavy">Traffic: Heavy Rush</option>
              </select>
            </div>

            {aiPrediction && (
              <p className="text-[10px] text-slate-700 leading-relaxed bg-white/85 p-2 rounded-lg border border-teal-100">
                {aiPrediction}
              </p>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#0d9488] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#0b7a70] transition-colors shadow-sm"
          >
            Confirm Booking Schedule
          </button>
        </form>
      ) : (
        /* Regular Dashboard View */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1">
              <Package className="w-4 h-4 text-[#0d9488]" />
              Real-time Tracker
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Total Booked: {orders.length}</span>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 text-xs py-8">Updating operations tracker...</div>
          ) : orders.length === 0 ? (
            <div className="text-center bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-slate-900 font-bold text-xs">No active batches yet</p>
              <p className="text-slate-400 text-[10px]">Click 'Book Laundry' above to schedule a smart pickup slot.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.map(order => {
                const isCompleted = order.status === 'delivered';
                const isCancelled = order.status === 'cancelled';
                
                return (
                  <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900">{order.service}</span>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {order.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center mt-0.5">
                          <Clock className="w-3 h-3 mr-0.5" />
                          {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block">₱{order.cost}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          isCancelled ? 'bg-rose-50 text-rose-600' :
                          isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                    </div>

                    {/* Simple Linear Progress Flow */}
                    {!isCancelled && !isCompleted && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-2">
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                          <span>Pickup</span>
                          <span>Washing</span>
                          <span>Delivery</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                          <div className={`h-full transition-all duration-500 bg-[#0d9488] ${
                            ['pending', 'pickup_scheduled'].includes(order.status) ? 'w-1/3' :
                            ['picked_up', 'washing', 'drying', 'folding'].includes(order.status) ? 'w-2/3' : 'w-full'
                          }`} />
                        </div>
                        {order.riderName && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] text-slate-500">
                              Rider: <strong className="text-slate-700">{order.riderName}</strong>
                            </span>
                            <span className="text-[9px] text-slate-500">
                              Weight: <strong className="text-slate-700">{order.weight || 'Calculating...'} kg</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons (Payment, Feedback, QR Display) */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400 uppercase font-bold">QR Bag ID:</span>
                        <code className="text-[9px] font-mono text-[#0d9488] font-bold bg-teal-50 px-1 rounded">
                          {order.id}
                        </code>
                      </div>

                      <div className="flex gap-1.5">
                        {/* Need payment? */}
                        {!order.isPaid && !isCancelled && (
                          <button 
                            onClick={() => setPayingOrder(order)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] py-1 px-2.5 rounded font-extrabold flex items-center gap-1 transition-colors"
                          >
                            <CreditCard className="w-3 h-3" />
                            Pay Now
                          </button>
                        )}

                        {order.isPaid && (
                          <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Paid
                          </span>
                        )}

                        {/* Order completed? Rate it! */}
                        {isCompleted && !order.rating && (
                          <button 
                            onClick={() => setRatingOrder(order)}
                            className="bg-[#0d9488] hover:bg-[#0b7a70] text-white text-[9px] py-1 px-2.5 rounded font-extrabold transition-colors"
                          >
                            Write Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GCash/Maya Payment Sheet Modal */}
      {payingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-sm">Secure Payment Gateway</h4>
              <button onClick={() => setPayingOrder(null)} className="p-1"><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Payable to LPDMS Operations</span>
              <p className="text-xl font-black text-slate-900">₱{payingOrder.cost}</p>
              <p className="text-[9px] text-slate-500">Order ID: {payingOrder.id}</p>
            </div>

            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Select E-Wallet</span>
              <div className="grid grid-cols-3 gap-2">
                {(['GCash', 'Maya', 'Card'] as const).map(w => (
                  <button 
                    key={w}
                    type="button"
                    onClick={() => setSelectedEWallet(w)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      selectedEWallet === w ? 'border-[#0d9488] bg-teal-50/70 text-teal-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="button"
              onClick={handlePayConfirm}
              disabled={isPayProcessing}
              className="w-full bg-[#0d9488] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-[#0b7a70] transition-colors"
            >
              {isPayProcessing ? 'Authorizing transaction...' : `Pay via ${selectedEWallet}`}
            </button>
          </div>
        </div>
      )}

      {/* Feedback & Ratings Sheet Modal */}
      {ratingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleFeedbackSubmit} className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-sm">Service Satisfaction (SDG 8)</h4>
              <button type="button" onClick={() => setRatingOrder(null)} className="p-1"><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-xs text-slate-500">How would you rate the wash and turnaround speed of order <strong>{ratingOrder.id}</strong>?</p>
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    className="p-1"
                  >
                    <Star className={`w-6 h-6 ${star <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Written Review</label>
              <textarea 
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Awesome smell! Folding was extremely neat."
                className="w-full text-xs p-2 border rounded-lg bg-slate-50 outline-none focus:border-[#0d9488]"
                rows={2} required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Submit Satisfaction Survey
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
