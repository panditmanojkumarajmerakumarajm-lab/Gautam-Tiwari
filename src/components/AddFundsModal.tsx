import { useState, FormEvent } from "react";
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  ExternalLink,
  Loader2,
  Copy,
  PlusCircle,
  History,
  AlertCircle,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AddFundsModalProps {
  onClose: () => void;
  onSubmit: (e: FormEvent, formData: any) => void;
  pendingPayments: any[];
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

export default function AddFundsModal({ onClose, onSubmit, pendingPayments, logoUrl }: AddFundsModalProps) {
  const [tab, setTab] = useState<"pay" | "history">("pay");
  const [formData, setFormData] = useState({
    amount: "",
    utr: ""
  });

  const upiId = "8955932061@ptyes";
  const upiName = "Manoj Kumar";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${upiId}%26pn=${encodeURIComponent(upiName)}%26cu=INR`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">ADD FUNDS</h3>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Instant Top-up</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button 
            onClick={() => setTab("pay")}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${tab === "pay" ? "text-emerald-500 bg-emerald-500/5" : "text-slate-500 hover:text-slate-300"}`}
          >
            Deposit Fund
          </button>
          <button 
            onClick={() => setTab("history")}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${tab === "history" ? "text-emerald-500 bg-emerald-500/5" : "text-slate-500 hover:text-slate-300"}`}
          >
            History & Status
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab === "pay" ? (
            <div className="space-y-6">
              {/* QR Section Styled like Paytm */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                {/* User Info Header */}
                <div className="p-4 flex items-center gap-3 bg-white border-b border-slate-50">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-900 font-extrabold text-sm">{upiName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white" />
                    </div>
                    <span className="text-slate-500 text-[10px] font-medium">UPI ID: {upiId}</span>
                  </div>
                </div>

                {/* The QR Code with Paytm-style Border */}
                <div className="p-6 flex flex-col items-center justify-center bg-white relative">
                  <div className="absolute inset-0 border-[12px] border-sky-400 pointer-events-none" style={{ clipPath: 'inset(0 0 50% 0)' }}></div>
                  <div className="absolute inset-0 border-[12px] border-blue-900 pointer-events-none" style={{ clipPath: 'inset(50% 0 0 0)' }}></div>
                  
                  <div className="relative z-10 p-2 bg-white rounded-lg">
                    <img src={qrUrl} alt="UPI QR" className="w-48 h-48" referrerPolicy="no-referrer" />
                  </div>
                </div>

                {/* Footer of QR Card */}
                <div className="bg-slate-50 p-3 flex justify-center items-center gap-4">
                  <img src="https://www.vectorlogo.zone/logos/paytm/paytm-ar21.svg" alt="Paytm" className="h-4 opacity-70" referrerPolicy="no-referrer" />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => copyToClipboard(upiId)}
                    className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl group hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex flex-col items-start leading-none gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Copy UPI ID</span>
                      <span className="text-xs font-medium text-slate-300 truncate w-48 text-left">{upiId}</span>
                    </div>
                    <Copy className="w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                  </button>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-tight">Instructions:</span>
                  </div>
                  <ol className="text-[11px] text-slate-400 space-y-1 list-decimal pl-4 leading-relaxed">
                    <li>Scan the QR code and pay any amount.</li>
                    <li>Copy the 12-digit <b>UTR / Transaction ID</b>.</li>
                    <li>Enter details below and click submit.</li>
                  </ol>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={(e) => onSubmit(e, formData)} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Amount (₹)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Enter amount paid"
                      value={formData.amount}
                      onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">UTR / Transaction ID</label>
                    <input 
                      type="text" 
                      required
                      placeholder="12 digit UTR number"
                      value={formData.utr}
                      onChange={(e) => setFormData(p => ({ ...p, utr: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> SUBMIT DETAILS
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-950/50 rounded-2xl border border-dotted border-slate-800">
                  <History className="w-12 h-12 text-slate-700" />
                  <div>
                    <p className="text-white font-bold">No Transaction History</p>
                    <p className="text-slate-500 text-[11px]">Your fund requests will appear here after submission.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map((p, i) => (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 bg-slate-950 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white italic">₹{p.amount}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                            p.status === "approved" ? "bg-emerald-500/10 text-emerald-500" :
                            p.status === "rejected" ? "bg-red-500/10 text-red-500" :
                            "bg-amber-500/10 text-amber-500"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500">{p.utr}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
                          {p.timestamp?.seconds ? new Date(p.timestamp.seconds * 1000).toLocaleString() : "Just now"}
                        </p>
                        {p.status === "pending" && (
                          <div className="flex items-center gap-1 text-[9px] text-amber-500 justify-end mt-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verifying...
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="p-4 bg-slate-950/50 border-t border-slate-800 text-center flex flex-col items-center gap-2">
          <div className="flex items-center -space-x-1">
            <OwnerAvatar url={logoUrl} />
            <div className="scale-75 origin-right">
              <IndianFlag />
            </div>
          </div>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">Manual Verification • SMMFLOW Security</p>
        </footer>
      </motion.div>
    </div>
  );
}
