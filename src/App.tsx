import { useState, FormEvent, useEffect, useMemo } from "react";
import { 
  Instagram, 
  Youtube, 
  Facebook, 
  Send, 
  MessageCircle, 
  CreditCard, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck, 
  Zap,
  ShoppingBag,
  X,
  CheckCircle2,
  Sparkles,
  Search,
  ChevronRight,
  Filter,
  Loader2,
  Twitter,
  Music2,
  Wallet,
  QrCode,
  PlusCircle,
  History,
  AlertCircle,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AdminPanel from "./components/AdminPanel";
import AddFundsModal from "./components/AddFundsModal";
import Login from "./components/Login";
import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  logout,
  handleFirestoreError
} from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

const OWNER_WHATSAPP = "918955932061";
const OWNER_UPI = "8955932061@ptyes";

import { OwnerAvatar } from "./components/OwnerAvatar";

const IndianFlag = () => (
  <div className="flex flex-col w-5 h-3.5 rounded-[2px] overflow-hidden border border-white/10 shrink-0 shadow-sm">
    <div className="h-1/3 bg-[#FF9933]" />
    <div className="h-1/3 bg-white flex items-center justify-center">
      <div className="w-[3px] h-[3px] rounded-full border-[0.5px] border-[#000080]" />
    </div>
    <div className="h-1/3 bg-[#138808]" />
  </div>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  const [apiServices, setApiServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  
  const [selectedService, setSelectedService] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  
  const [hasSpun, setHasSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  const [formData, setFormData] = useState({
    link: "",
    quantity: "1000"
  });

  useEffect(() => {
    // Sync platform settings (logo, etc)
    const settingsRef = doc(db, "settings", "branding");
    const unsubscribe = onSnapshot(settingsRef, 
      (snap) => {
        if (snap.exists()) {
          setPlatformSettings(snap.data());
        }
      },
      (err) => console.warn("Failed to sync branding settings", err)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          // Sync user profile
          const userRef = doc(db, "users", user.uid);
          
          try {
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
              const newProfile = {
                email: user.email,
                displayName: user.displayName,
                balance: 0,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
              };
              await setDoc(userRef, newProfile);
              setUserData(newProfile);
              setUserBalance(0);
            } else {
              const data = userSnap.data();
              setUserData(data);
              setUserBalance(data.balance || 0);
              await updateDoc(userRef, { lastLogin: serverTimestamp() });
            }
          } catch (e) {
            console.error("Profile sync error", e);
            // Don't throw here to allow app to load
          }

          // Check Admin Status
          try {
            const adminSnap = await getDoc(doc(db, "admins", user.uid));
            const isHardcodedAdmin = ["shreemadbhagwat621@gmail.com", "tiwarigautam819@gmail.com"].includes(user.email || "");
            
            if (!adminSnap.exists() && isHardcodedAdmin) {
              await setDoc(doc(db, "admins", user.uid), {
                email: user.email,
                role: "admin",
                assignedAt: serverTimestamp()
              });
              setIsAdmin(true);
            } else {
              setIsAdmin(adminSnap.exists());
            }
          } catch (e) {
            console.warn("Admin check failed", e);
            const isHardcodedAdmin = ["shreemadbhagwat621@gmail.com", "tiwarigautam819@gmail.com"].includes(user.email || "");
            setIsAdmin(isHardcodedAdmin);
          }

          // Listen for Real-time Balance & Data updates
          onSnapshot(userRef, 
            (doc) => {
              if (doc.exists()) {
                setUserData(doc.data());
                setUserBalance(doc.data().balance || 0);
              }
            },
            (err) => console.warn("Balance sync failed", err)
          );

          // Listen for user's payments
          const q = query(collection(db, "payments"), where("userId", "==", user.uid));
          onSnapshot(q, 
            (snapshot) => {
              const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setPendingPayments(payments.sort((a: any, b: any) => {
                const dateA = a.timestamp?.seconds || 0;
                const dateB = b.timestamp?.seconds || 0;
                return dateB - dateA;
              }));
            },
            (err) => console.warn("Payments sync failed", err)
          );
        } else {
          setUserData(null);
          setUserBalance(0);
          setPendingPayments([]);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddFundsSubmit = async (e: FormEvent, data: any) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const paymentData = {
        userId: currentUser.uid,
        email: currentUser.email,
        amount: parseFloat(data.amount),
        utr: data.utr,
        status: "pending",
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, "payments"), paymentData);
      
      const whatsappMessage = `*Fund Deposit Alert*%0A%0A` +
        `*Email:* ${currentUser.email}%0A` +
        `*Amount:* ₹${data.amount}%0A` +
        `*UTR:* ${data.utr}%0A%0A` +
        `_Please approve my deposit so I can place my order._`;
      
      const waUrl = `https://wa.me/${OWNER_WHATSAPP}?text=${whatsappMessage}`;
      
      alert("Payment submitted in system!");
      
      if (confirm("Would you like to notify Admin on WhatsApp for instant approval?")) {
        window.open(waUrl, "_blank");
      }
      
      setShowAddFunds(false);
    } catch (err) {
      alert("Submission failed. Try again.");
    }
  };
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      if (data.success) {
        setApiServices(data.services);
      } else {
        setApiError(data.message || "Failed to load services from provider.");
      }
    } catch (err) {
      console.error("Failed to fetch services", err);
      setApiError("Network error. Please check your internet or retry.");
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(apiServices.map(s => s.category)));
    return ["All", ...cats.sort()];
  }, [apiServices]);

  const filteredServices = useMemo(() => {
    return apiServices.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;
      
      let matchesPlatform = true;
      if (selectedPlatform !== "All") {
        const cat = s.category.toLowerCase();
        const name = s.name.toLowerCase();
        if (selectedPlatform === "Instagram") {
          matchesPlatform = /\b(ig|instagram|insta)\b/i.test(cat) || /\b(ig|instagram|insta)\b/i.test(name);
        } else if (selectedPlatform === "YouTube") {
          matchesPlatform = /\b(yt|youtube)\b/i.test(cat) || /\b(yt|youtube)\b/i.test(name);
        } else if (selectedPlatform === "Facebook") {
          matchesPlatform = /\b(fb|facebook)\b/i.test(cat) || /\b(fb|facebook)\b/i.test(name);
        } else if (selectedPlatform === "Telegram") {
          matchesPlatform = /\b(telegram|tg)\b/i.test(cat) || /\b(telegram|tg)\b/i.test(name);
        } else if (selectedPlatform === "TikTok") {
          matchesPlatform = /\b(tiktok|tk)\b/i.test(cat) || /\b(tiktok|tk)\b/i.test(name);
        } else if (selectedPlatform === "Twitter") {
          matchesPlatform = /\b(twitter|x|twt)\b/i.test(cat) || /\b(twitter|x|twt)\b/i.test(name);
        }
      }

      return matchesSearch && matchesCategory && matchesPlatform;
    });
  }, [apiServices, searchQuery, selectedCategory, selectedPlatform]);

  const handleSpin = () => {
    if (hasSpun || isSpinning) return;
    setIsSpinning(true);
    
    // Rigged logic: land on 3, 4, or 5
    const riggedOptions = [3, 4, 5];
    const result = riggedOptions[Math.floor(Math.random() * riggedOptions.length)];
    
    // Calculate rotation to land on the correct segment
    // Pointer is at 0deg. Segment center for R is (R-1)*72 + 36.
    // To land on it, we need to rotate by 360 - ((R-1)*72 + 36).
    const segmentCenter = (result - 1) * 72 + 36;
    const targetRotation = 360 * 5 + (360 - segmentCenter); 
    
    setRotation(targetRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      setAppliedDiscount(result);
      setTimeout(() => setShowSpinner(false), 2000);
    }, 4000);
  };

  const calculateDiscountedPrice = (rate: number, quantity: number) => {
    const basePrice = (rate * quantity) / 1000;
    if (appliedDiscount === 0) return Math.ceil(basePrice);
    const discount = (basePrice * appliedDiscount) / 100;
    return Math.ceil(basePrice - discount);
  };

  const handleServiceClick = (service: any) => {
    setSelectedService(service);
    setFormData(prev => ({ ...prev, quantity: service.min.toString() }));
  };

  const getUpiUrl = (scheme: string = "upi") => {
    if (!selectedService) return "";
    const amount = calculateDiscountedPrice(parseFloat(selectedService.rate), parseInt(formData.quantity));
    const baseUrl = `${scheme}://pay`;
    const params = new URLSearchParams({
      pa: OWNER_UPI,
      pn: "SMMFLOW",
      am: amount.toString(),
      cu: "INR",
      tn: `Order_${selectedService.service}`
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("UPI ID Copied! Now you can pay manually from any app.");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    const qty = parseInt(formData.quantity);
    const min = parseInt(selectedService.min);
    const max = parseInt(selectedService.max);

    if (qty < min || qty > max) {
      alert(`Invalid Quantity! For this service, quantity must be between ${min} and ${max}.`);
      return;
    }

    if (userBalance < calculateDiscountedPrice(parseFloat(selectedService.rate), qty)) {
      alert("Insufficient wallet balance. Please add funds first!");
      setShowAddFunds(true);
      return;
    }

    setSubmittingOrder(true);
    
    const rate = parseFloat(selectedService.rate);
    const finalPrice = calculateDiscountedPrice(rate, qty);

    // Deduct balance in Firestore
    try {
      const userRef = doc(db, "users", currentUser!.uid);
      await updateDoc(userRef, {
        balance: userBalance - finalPrice
      });

      // Place order in background via API
      const apiRes = await fetch("/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.service,
          link: formData.link,
          quantity: formData.quantity
        })
      });
      
      const apiData = await apiRes.json();
      
      if (apiData.success) {
        alert(`Order Placed Successfully! Order ID: ${apiData.orderId}`);
        setSelectedService(null);
        setFormData({ link: "", quantity: "1000" });
      } else {
        alert(`Order logged but panel returned an error: ${apiData.message}\n\nOur team will check it manually.`);
        setSelectedService(null);
      }
    } catch (err) {
      console.error("Failed to place order", err);
      alert("Order failed. Please contact support.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing SMMFLOW Security...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login logoUrl={platformSettings?.logoUrl} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900 px-4">
        <div className="max-w-4xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-1.5">
              <div className="relative z-10 w-10 h-10 rounded-full border-2 border-slate-950 overflow-hidden bg-slate-900 flex items-center justify-center">
                <OwnerAvatar size="w-10 h-10" url={platformSettings?.logoUrl} />
              </div>
              <div className="w-8 h-6 bg-slate-900 border border-slate-800 rounded flex items-center justify-center shadow-lg">
                <IndianFlag />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic tracking-tighter text-white leading-none">SMMFLOW</h1>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Managed by GAUTAM TIWARI</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-2xl group transition-all">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20">
                <UserIcon className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-black text-slate-300 truncate max-w-[80px] uppercase tracking-wider">
                {userData?.displayName?.split(' ')[0] || "Trader"}
              </span>
            </div>

            {/* Wallet Quick View */}
            <button 
              onClick={() => setShowAddFunds(true)}
              className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl hover:border-emerald-500/50 transition-all group shadow-lg active:scale-95 relative"
            >
              {isAdmin && pendingPayments.filter(p => p.status === "pending").length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[10px] items-center justify-center font-black text-slate-950">
                    {pendingPayments.filter(p => p.status === "pending").length}
                  </span>
                </span>
              )}
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                <Wallet className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Balance</span>
                <span className="text-sm font-black text-white italic">₹{userBalance.toFixed(2)}</span>
              </div>
              <PlusCircle className="w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors" />
            </button>

            <button 
              onClick={logout}
              className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-red-500 hover:border-red-500/50 transition-all active:scale-95"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Hero */}
        <section className="text-center space-y-4 py-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
          >
            Boost Your <span className="text-emerald-500">Social Presence</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 max-w-xl mx-auto text-lg"
          >
            Premium quality services at unbeatable prices. Click on any service to pay and order instantly.
          </motion.p>
        </section>

        {/* Discount Section */}
        {!hasSpun && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <button 
              onClick={() => setShowSpinner(true)}
              className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl font-black text-slate-950 shadow-xl shadow-amber-500/20 hover:scale-105 transition-all animate-bounce"
            >
              <Sparkles className="w-5 h-5" />
              SPIN FOR LUCKY DISCOUNT!
              <div className="absolute -top-2 -right-2 bg-white text-orange-600 text-[10px] px-2 py-0.5 rounded-full shadow-sm">NEW</div>
            </button>
          </motion.div>
        )}

        {appliedDiscount > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5" />
              LUCKY {appliedDiscount}% DISCOUNT APPLIED TO ALL PRICES!
            </div>
          </motion.div>
        )}

        {/* Services Section */}
        <section className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-emerald-500" /> OUR SERVICES
            </h3>

            <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x px-2 -mx-2 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
              {[
                { id: "All", name: "All", icon: <OwnerAvatar bordered={false} size="w-7 h-7" url={platformSettings?.logoUrl} />, activeClass: "bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-emerald-500/10", iconBg: "bg-emerald-500/20" },
                { id: "Instagram", name: "Instagram", icon: <Instagram className="w-5 h-5" />, activeClass: "bg-pink-500/10 border-pink-500/50 text-pink-500 shadow-pink-500/10", iconBg: "bg-pink-500/20" },
                { id: "YouTube", name: "YouTube", icon: <Youtube className="w-5 h-5" />, activeClass: "bg-red-500/10 border-red-500/50 text-red-500 shadow-red-500/10", iconBg: "bg-red-500/20" },
                { id: "Facebook", name: "Facebook", icon: <Facebook className="w-5 h-5" />, activeClass: "bg-blue-500/10 border-blue-500/50 text-blue-500 shadow-blue-500/10", iconBg: "bg-blue-500/20" },
                { id: "Telegram", name: "Telegram", icon: <Send className="w-5 h-5" />, activeClass: "bg-sky-500/10 border-sky-500/50 text-sky-500 shadow-sky-500/10", iconBg: "bg-sky-500/20" },
                { id: "TikTok", name: "TikTok", icon: <Music2 className="w-5 h-5" />, activeClass: "bg-slate-200/10 border-slate-200/50 text-slate-200 shadow-slate-200/10", iconBg: "bg-slate-200/20" },
                { id: "Twitter", name: "Twitter", icon: <Twitter className="w-5 h-5" />, activeClass: "bg-sky-400/10 border-sky-400/50 text-sky-400 shadow-sky-400/10", iconBg: "bg-sky-400/20" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPlatform(p.id);
                    setSelectedCategory("All"); // Reset category when platform changes
                  }}
                  className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 min-w-[100px] border-2 shadow-lg ${
                    selectedPlatform === p.id 
                    ? `${p.activeClass} scale-105` 
                    : "bg-slate-950/50 border-transparent text-slate-500 hover:border-slate-700 hover:text-slate-300 shadow-transparent"
                  }`}
                >
                  <div className={`p-3 rounded-xl ${selectedPlatform === p.id ? p.iconBg : "bg-slate-900"}`}>
                    {p.icon}
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{p.name}</span>
                </button>
              ))}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                {/* Search */}
                <div className="relative group w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search services (e.g. Followers, Likes)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-slate-400 font-medium animate-pulse">Fetching latest services...</p>
            </div>
          ) : apiError ? (
            <div className="text-center py-20 bg-red-500/5 rounded-3xl border border-dashed border-red-500/30 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-400 font-bold uppercase tracking-widest text-xs">{apiError}</p>
              <button 
                onClick={fetchServices}
                className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                RETRY FETCHING
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                filteredServices.reduce((acc, service) => {
                  const cat = service.category;
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(service);
                  return acc;
                }, {} as Record<string, any[]>)
              ).map(([category, services]: [string, any]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full" /> {category}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {services.map((service, idx) => (
                      <motion.div
                        key={service.service}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleServiceClick(service)}
                        className="group bg-slate-900/40 border border-slate-800/50 hover:border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all cursor-pointer hover:bg-slate-900/60"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="text-white font-bold text-sm truncate group-hover:text-emerald-400 transition-colors">
                            {service.name}
                          </h5>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 italic">Min: {service.min} • Max: {service.max}</span>
                            {service.refill && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">✔ Refill</span>}
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <span className="text-lg font-black text-emerald-500 italic">₹{service.rate}</span>
                          <span className="text-[10px] text-slate-500 font-bold block">/ 1K</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredServices.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                  <p className="text-slate-500 font-medium">No results found. Try a different search term.</p>
                </div>
              )}
            </div>
          )}
        </section>

          {/* Extra Services Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <ShoppingBag className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Extra Services</h3>
                <p className="text-slate-400">Instagram & YouTube Channel Buy & Sell</p>
              </div>
            </div>
            <a 
              href={`https://wa.me/${OWNER_WHATSAPP}?text=Hi, I am interested in Buying/Selling Instagram/YouTube channels.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Inquire Now <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Earning Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent md:col-span-2 flex flex-col items-center text-center gap-6"
          >
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Start Your Earning Now!</h3>
              <p className="text-slate-400 max-w-md mx-auto">Join our reseller program and start making money by providing social media services to others.</p>
            </div>
            <a 
              href={`https://wa.me/${OWNER_WHATSAPP}?text=Hi, I want to start earning with SMMFLOW. Please guide me about the reseller program.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 group"
            >
              START EARNING NOW <Zap className="w-5 h-5 fill-current group-hover:scale-125 transition-transform" />
            </a>
          </motion.div>

        {/* Order Details Modal */}
        <AnimatePresence>
          {selectedService && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
              >
                <button 
                  onClick={() => setSelectedService(null)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Complete Payment</h3>
                  <p className="text-slate-400 text-sm">
                    Select your preferred UPI app to pay ₹{calculateDiscountedPrice(parseFloat(selectedService.rate), parseInt(formData.quantity))}
                  </p>
                </div>

                {/* App Selection Grid - REMOVED since we use wallet */}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Profile/Post Link</label>
                    <input 
                      required
                      type="url"
                      placeholder="Paste link here..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Quantity</label>
                    <input 
                      required
                      type="number"
                      min={selectedService.min}
                      max={selectedService.max}
                      placeholder={`e.g. ${selectedService.min}`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between px-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Min: {selectedService.min} • Max: {selectedService.max}
                      </p>
                      {formData.quantity && !isNaN(parseInt(formData.quantity)) && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Total Price:</span>
                          <span className="text-sm font-black text-emerald-500 italic">
                            ₹{calculateDiscountedPrice(parseFloat(selectedService.rate), parseInt(formData.quantity)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={submittingOrder}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {submittingOrder ? (
                      <>Processing... <Loader2 className="w-4 h-4 animate-spin" /></>
                    ) : (
                      <>
                        CONFIRM & PAY ₹{formData.quantity && !isNaN(parseInt(formData.quantity)) ? calculateDiscountedPrice(parseFloat(selectedService.rate), parseInt(formData.quantity)).toFixed(2) : "0.00"}
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Payment & Contact */}
        <section className="space-y-6 pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a 
              href={`upi://pay?pa=${OWNER_UPI}&pn=SMMFLOW&cu=INR`}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all group"
            >
              <CreditCard className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Pay via UPI</span>
              <span className="text-xs opacity-80 mt-1 font-medium">Instant Payment</span>
            </a>
            <a 
              href={`https://wa.me/${OWNER_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 transition-all group"
            >
              <MessageCircle className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold">WhatsApp</span>
              <span className="text-xs opacity-80 mt-1 font-medium">Contact Support</span>
            </a>
            <a 
              href="https://www.instagram.com/gm.musicworld"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:opacity-90 transition-all group"
            >
              <Instagram className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Instagram</span>
              <span className="text-xs opacity-80 mt-1 font-medium">Follow Us</span>
            </a>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="flex flex-wrap justify-center gap-8 py-8 border-y border-slate-800">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">Instant Start</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">24/7 Support</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <IndianFlag />
            <span className="text-xl font-bold text-white">SMMFLOW</span>
          </div>
          <div className="text-slate-400 text-sm space-y-2">
            <p className="text-emerald-500 font-bold tracking-widest uppercase text-xs">Managed by GAUTAM TIWARI</p>
            <p>Contact for more platform services</p>
            <p className="font-mono">WhatsApp: {OWNER_WHATSAPP}</p>
            <p className="font-mono">UPI: {OWNER_UPI}</p>
          </div>
          <p className="text-slate-600 text-xs text-center border-t border-slate-800 pt-8 mt-8">
            © {new Date().getFullYear()} SMMFLOW Services. All rights reserved.
          </p>
          {currentUser && (
            <div className="flex justify-center mt-12 opacity-[0.03] hover:opacity-10 transition-opacity">
              <button 
                onClick={() => setShowAdmin(true)}
                className="text-[8px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-tighter"
              >
                ADMIN ACCESS PORTAL
              </button>
            </div>
          )}
        </div>
        <AnimatePresence>
          {showAddFunds && (
            <AddFundsModal 
              onClose={() => setShowAddFunds(false)} 
              onSubmit={handleAddFundsSubmit}
              pendingPayments={pendingPayments}
              logoUrl={platformSettings?.logoUrl}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} logoUrl={platformSettings?.logoUrl} />}
        </AnimatePresence>

        {/* Discount Spinner Modal */}
        <AnimatePresence>
          {showSpinner && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSpinning && setShowSpinner(false)}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-8 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500" />
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">LUCKY SPINNER</h3>
                  <p className="text-slate-400 text-sm">Spin to win up to 5% discount on your first order!</p>
                </div>

                {/* The Wheel */}
                <div className="relative w-64 h-64 mx-auto">
                  {/* Pointer */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-6 h-8 bg-amber-500 clip-path-triangle shadow-lg" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }} />
                  </div>
                  
                  <motion.div 
                    animate={{ rotate: rotation }}
                    transition={{ duration: 4, ease: [0.45, 0.05, 0.55, 0.95] }}
                    className="w-full h-full rounded-full border-8 border-slate-800 relative overflow-hidden shadow-2xl"
                    style={{ background: 'conic-gradient(#10b981 0deg 72deg, #f59e0b 72deg 144deg, #3b82f6 144deg 216deg, #8b5cf6 216deg 288deg, #ec4899 288deg 360deg)' }}
                  >
                    {[1, 2, 3, 4, 5].map((num, i) => (
                      <div 
                        key={num}
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 flex items-start pt-4 origin-bottom"
                        style={{ transform: `translateX(-50%) rotate(${i * 72 + 36}deg)` }}
                      >
                        <span className="text-white font-black text-xl drop-shadow-md">{num}%</span>
                      </div>
                    ))}
                  </motion.div>
                </div>

                <button
                  onClick={handleSpin}
                  disabled={isSpinning || hasSpun}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {isSpinning ? "SPINNING..." : hasSpun ? "DISCOUNT APPLIED!" : "SPIN NOW"}
                </button>

                {hasSpun && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-500 font-bold animate-bounce"
                  >
                    CONGRATS! YOU WON {appliedDiscount}% OFF!
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
}
