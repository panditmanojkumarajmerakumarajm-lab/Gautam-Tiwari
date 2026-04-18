import { motion } from "motion/react";
import { TrendingUp, LogIn, ShieldCheck, Zap, MessageCircle } from "lucide-react";
import { signInWithGoogle } from "../lib/firebase";

import { OwnerAvatar } from "./OwnerAvatar";

const IndianFlag = () => (
  <div className="flex flex-col w-8 h-6 rounded-[2px] overflow-hidden border border-white/10 shrink-0">
    <div className="h-1/3 bg-[#FF9933]" />
    <div className="h-1/3 bg-white flex items-center justify-center">
      <div className="w-[4px] h-[4px] rounded-full border-[0.5px] border-[#000080]" />
    </div>
    <div className="h-1/3 bg-[#138808]" />
  </div>
);

interface LoginProps {
  logoUrl?: string;
}

export default function Login({ logoUrl }: LoginProps) {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("Please allow popups for this site to login with Google.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("This domain is not authorized for Google Login. Please add your domain to Firebase Console -> Auth -> Settings -> Authorized Domains.");
      } else {
        alert("Login failed: " + (error.message || "Unknown error"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        {/* Logo Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center -space-x-2">
              <div className="relative z-10 w-16 h-16 rounded-full border-4 border-slate-950 overflow-hidden bg-slate-900 shadow-2xl flex items-center justify-center">
                <OwnerAvatar size="w-16 h-16" url={logoUrl} />
              </div>
              <div className="w-12 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center shadow-xl rotate-6">
                <IndianFlag />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">SMMFLOW</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">India's Premium SMM Growth Platform</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instant</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">24/7 Support</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500" />
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Welcome Back!</h2>
            <p className="text-slate-400 text-xs">Login to access your wallet and order history from any device.</p>
          </div>

          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 active:scale-95"
          >
            <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google" className="w-5 h-5" />
            CONTINUE WITH GOOGLE
          </button>

          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
            By continuing, you agree to our <br /> 
            <span className="text-emerald-500/50">Terms of Service</span> & <span className="text-emerald-500/50">Privacy Policy</span>
          </p>
        </div>

        <footer className="pt-8">
          <p className="text-[11px] text-slate-600 font-bold uppercase tracking-[0.2em]">Managed by GAUTAM TIWARI</p>
        </footer>
      </motion.div>
    </div>
  );
}
