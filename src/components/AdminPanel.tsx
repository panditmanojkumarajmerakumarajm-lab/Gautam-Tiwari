import { useState, useEffect, FormEvent } from "react";
import { 
  BarChart3, 
  Settings, 
  ShoppingBag, 
  Users as UsersIcon, 
  Wallet, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  TrendingUp,
  X,
  History,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { 
  db, 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  getDoc, 
  where,
  serverTimestamp,
  handleFirestoreError
} from "../lib/firebase";

interface AdminPanelProps {
  onClose: () => void;
  logoUrl?: string;
}

import { OwnerAvatar } from "./OwnerAvatar";

const IndianFlag = () => (
  <div className="flex flex-col w-5 h-3.5 rounded-[2px] overflow-hidden border border-white/10 shrink-0">
    <div className="h-1/3 bg-[#FF9933]" />
    <div className="h-1/3 bg-white flex items-center justify-center">
      <div className="w-[3px] h-[3px] rounded-full border-[0.5px] border-[#000080]" />
    </div>
    <div className="h-1/3 bg-[#138808]" />
  </div>
);

export default function AdminPanel({ onClose, logoUrl }: AdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [newMarkup, setNewMarkup] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState(logoUrl || "");
  const [updatingMarkup, setUpdatingMarkup] = useState(false);
  const [updatingLogo, setUpdatingLogo] = useState(false);
  const [adminTab, setAdminTab] = useState<"dashboard" | "payments">("dashboard");
  const [allPayments, setAllPayments] = useState<any[]>([]);

  const handleUpdateLogo = async (e: FormEvent) => {
    e.preventDefault();
    setUpdatingLogo(true);
    try {
      const settingsRef = doc(db, "settings", "branding");
      await setDoc(settingsRef, { 
        logoUrl: newLogoUrl,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      alert("Logo URL updated successfully!");
    } catch (e) {
      handleFirestoreError(e, 'write', 'settings/branding');
    } finally {
      setUpdatingLogo(false);
    }
  };

  useEffect(() => {
    // Real-time payments sync
    const paymentsRef = collection(db, "payments");
    const unsubscribe = onSnapshot(paymentsRef, 
      (snapshot) => {
        const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        const sorted = payments.sort((a: any, b: any) => {
          const dateA = a.timestamp?.seconds || 0;
          const dateB = b.timestamp?.seconds || 0;
          return dateB - dateA;
        });

        // Notification logic for new pending payments
        if (allPayments.length > 0 && adminTab !== "payments") {
          const newPending = sorted.filter(p => p.status === "pending").length;
          const oldPending = allPayments.filter(p => p.status === "pending").length;
          
          if (newPending > oldPending) {
            // Play notification sound
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(e => console.warn("Audio play blocked", e));
            
            // Notification toast
            if (Notification.permission === "granted") {
              new Notification("SMMFLOW: New Fund Request!", {
                body: `You have ${newPending} pending payments waiting for approval.`,
                icon: "/favicon.ico"
              });
            }
          }
        }

        setAllPayments(sorted);
        setLoading(false);
      },
      (err) => {
        if (err.code === 'permission-denied') {
          setPermissionDenied(true);
          setLoading(false);
        } else {
          handleFirestoreError(err, 'list', 'payments');
        }
      }
    );

    fetchStats();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setNewMarkup(data.stats.markup);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  };

  const handlePaymentAction = async (payment: any, action: "approve" | "reject") => {
    try {
      const paymentRef = doc(db, "payments", payment.id);
      
      if (action === "approve") {
        const userRef = doc(db, "users", payment.userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const currentBalance = userSnap.data().balance || 0;
          await updateDoc(userRef, {
            balance: currentBalance + parseFloat(payment.amount)
          });
        }
      }

      await updateDoc(paymentRef, {
        status: action === "approve" ? "approved" : "rejected"
      });
      
      alert(`Payment ${action}d successfully!`);
    } catch (err) {
      console.error(err);
      alert("Action failed. Check console for details.");
    }
  };

  const handleUpdateMarkup = async (e: FormEvent) => {
    e.preventDefault();
    setUpdatingMarkup(true);
    try {
      const res = await fetch("/api/admin/update-markup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markup: newMarkup })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchStats();
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      alert("Failed to update markup");
    } finally {
      setUpdatingMarkup(false);
    }
  };

  if (permissionDenied) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">ACCESS DENIED</h2>
            <p className="text-slate-500 text-sm">Your account does not have administrative privileges. Please contact the owner for access.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-900 transition-all uppercase text-xs tracking-widest"
          >
            DISMISS
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading && allPayments.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col font-sans overflow-hidden">
      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center -space-x-1.5">
              <div className="relative z-10 w-10 h-10 rounded-full border-2 border-slate-950 overflow-hidden bg-slate-900 flex items-center justify-center">
                <OwnerAvatar url={logoUrl} />
              </div>
              <div className="w-8 h-6 bg-slate-900 border border-slate-800 rounded flex items-center justify-center shadow-lg">
                <IndianFlag />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black italic tracking-tighter text-white leading-none">SMMFLOW DASHBOARD</h1>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Managed by GAUTAM TIWARI</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 scale-90 sm:scale-100">
            <button 
              onClick={() => setAdminTab("dashboard")}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === "dashboard" ? "bg-emerald-500 text-slate-950" : "text-slate-500 hover:text-slate-300"}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setAdminTab("payments")}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === "payments" ? "bg-emerald-500 text-slate-950" : "text-slate-500 hover:text-slate-300"}`}
            >
              Payments {allPayments.filter(p => p.status === "pending").length > 0 && (
                <span className="ml-2 bg-slate-900 border border-slate-700 text-emerald-500 px-1.5 py-0.5 rounded-md text-[10px]">
                  {allPayments.filter(p => p.status === "pending").length}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE SESSION
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {adminTab === "dashboard" ? (
            <>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl w-fit">
                    <Wallet className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Main Balance</p>
                    <p className="text-2xl font-black text-white italic">₹{stats?.balance || "0.00"}</p>
                    <p className="text-[10px] text-emerald-500 font-bold mt-1">Provider: Glory SMM</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl shadow-blue-500/5">
                  <div className="p-3 bg-blue-500/10 rounded-xl w-fit">
                    <ShoppingBag className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Pricing Strategy</p>
                    <p className="text-2xl font-black text-white italic">+{stats?.markup || "20"}% Markup</p>
                    <p className="text-[10px] text-blue-500 font-bold mt-1">Status: Active</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl w-fit">
                    <Zap className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Services Active</p>
                    <p className="text-2xl font-black text-white italic">{stats?.servicesCount || "0"}</p>
                    <p className="text-[10px] text-amber-500 font-bold mt-1">Real-time Syncing</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl w-fit">
                    <Settings className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">System Status</p>
                    <p className="text-2xl font-black text-emerald-500 italic">HEALTHY</p>
                    <p className="text-[10px] text-purple-500 font-bold mt-1">API V2 Online</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profit Settings */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-emerald-500" /> PROFIT MANAGEMENT
                    </h3>
                    <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase">Live Pricing</div>
                  </div>
                  
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-2">
                        <h4 className="text-white font-bold">Global Profit Markup (%)</h4>
                        <p className="text-slate-500 text-xs leading-relaxed">Percentage to add on top of provider prices. Higher markup means more profit per order.</p>
                      </div>
                      
                      <form onSubmit={handleUpdateMarkup} className="flex gap-4">
                        <div className="relative flex-1">
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                          <input 
                            type="number"
                            value={newMarkup}
                            onChange={(e) => setNewMarkup(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                            placeholder="20"
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={updatingMarkup}
                          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
                        >
                          {updatingMarkup ? <Loader2 className="w-4 h-4 animate-spin" /> : "SAVE"}
                        </button>
                      </form>
                    </div>

                    <div className="pt-6 border-t border-slate-800/50">
                      <div className="flex flex-wrap gap-4">
                        <button onClick={() => setNewMarkup("10")} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-black rounded-lg transition-colors border border-slate-800">10% PROFIT</button>
                        <button onClick={() => setNewMarkup("20")} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-black rounded-lg transition-colors border border-slate-800">20% PROFIT</button>
                        <button onClick={() => setNewMarkup("30")} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-black rounded-lg transition-colors border border-slate-800">30% PROFIT</button>
                        <button onClick={() => setNewMarkup("50")} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-black rounded-lg transition-colors border border-slate-800">50% PROFIT</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-white text-xs font-bold uppercase tracking-tight">How it works</p>
                      <p className="text-slate-400 text-[11px] leading-relaxed italic">Formula: <code className="text-blue-400 font-mono">Provider Price * (1 + (Markup / 100))</code>. For example, if provider price is ₹100 and markup is 20%, customer pays ₹120.</p>
                    </div>
                  </div>
                </div>

                 {/* Branding Management */}
                 <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-amber-500" /> BRANDING MANAGEMENT
                    </h3>
                  </div>

                  <form onSubmit={handleUpdateLogo} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Founder Photo URL</label>
                      <div className="flex gap-4">
                        <input 
                          type="url"
                          value={newLogoUrl}
                          onChange={(e) => setNewLogoUrl(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all font-mono text-xs"
                          placeholder="https://example.com/photo.jpg"
                        />
                        <button 
                          type="submit"
                          disabled={updatingLogo}
                          className="px-6 py-3 bg-white hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all uppercase text-[10px] tracking-widest"
                        >
                          {updatingLogo ? "Saving..." : "Update Logo"}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl">
                      <OwnerAvatar size="w-12 h-12" url={newLogoUrl} />
                      <div>
                        <p className="text-white text-xs font-bold">Logo Preview</p>
                        <p className="text-slate-500 text-[10px]">This will be shown as your "#1" branding image.</p>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Quick Actions */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                  <h3 className="text-xl font-black text-white tracking-tight">QUICK ACTIONS</h3>
                  <div className="space-y-3">
                    <a 
                      href="https://glorysmmpanel.com/"
                      target="_blank"
                      className="flex items-center justify-between w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-emerald-500/50 transition-all group"
                    >
                      <span className="text-sm font-bold text-slate-300">Open Panel Website</span>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-500" />
                    </a>
                    <button 
                      onClick={() => alert("Cache cleared successfully!")}
                      className="flex items-center justify-between w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-amber-500/50 transition-all group"
                    >
                      <span className="text-sm font-bold text-slate-300">Clear Service Cache</span>
                      <Zap className="w-4 h-4 text-slate-500 group-hover:text-amber-500" />
                    </button>
                    <button 
                      onClick={() => alert("Sync triggered!")}
                      className="flex items-center justify-between w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all group"
                    >
                      <span className="text-sm font-bold text-slate-300">Force Sync Services</span>
                      <ShoppingBag className="w-4 h-4 text-slate-500 group-hover:text-blue-500" />
                    </button>
                  </div>

                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Pro Tip</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Regularly check your Glory SMM Panel balance to ensure orders are processed instantly without delays.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <History className="w-6 h-6 text-emerald-500" /> MANUAL PAYMENT REQUESTS
                  </h3>
                  <button 
                    onClick={() => alert("Real-time sync active!")}
                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest px-4">UTR Number</th>
                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest px-4">Amount</th>
                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest px-4">Status</th>
                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest px-4">Date</th>
                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {allPayments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-slate-500 font-bold italic">No payment requests found.</td>
                        </tr>
                      ) : (
                        allPayments.map((p) => (
                          <tr key={p.id} className="group hover:bg-slate-950/30 transition-colors">
                            <td className="py-4 px-4 font-mono text-xs text-white uppercase">{p.utr}</td>
                            <td className="py-4 px-4 font-black text-emerald-500 whitespace-nowrap">₹{p.amount}</td>
                            <td className="py-4 px-4">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                p.status === "approved" ? "bg-emerald-500/10 text-emerald-500" :
                                p.status === "rejected" ? "bg-red-500/10 text-red-500" :
                                "bg-amber-500/10 text-amber-500"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-[10px] text-slate-500 whitespace-nowrap">
                              {p.timestamp?.seconds ? new Date(p.timestamp.seconds * 1000).toLocaleString() : "Just now"}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {p.status === "pending" && (
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => handlePaymentAction(p, "reject")}
                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handlePaymentAction(p, "approve")}
                                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all"
                                    title="Approve"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="p-4 bg-slate-900 border-t border-slate-800 text-center flex flex-col items-center gap-2">
        <IndianFlag />
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">SMMFLOW Management Interface • v1.0.4 • 2026</p>
      </footer>
    </div>
  );
}
