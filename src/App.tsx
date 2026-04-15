import { useState, FormEvent } from "react";
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
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const OWNER_WHATSAPP = "918955932061";
const OWNER_UPI = "8955932061@axl";

const services = [
  {
    title: "Special Combo Offers",
    icon: <Sparkles className="w-6 h-6 text-amber-500" />,
    items: [
      { name: "10K Followers + 1M Views", price: "₹999", amount: 999 },
      { name: "50K Followers + 5M Views (5 Reels)", price: "₹2499", amount: 2499 },
      { name: "100K Followers + 10M Views (10 Reels)", price: "₹4999", amount: 4999 },
    ],
    color: "border-amber-500/20 hover:border-amber-500/50",
    bg: "bg-amber-500/5"
  },
  {
    title: "Instagram Services",
    icon: <Instagram className="w-6 h-6 text-pink-500" />,
    items: [
      { name: "Followers", price: "₹129 / 1K", amount: 129 },
      { name: "Followers (Budget)", price: "₹99 / 1K", amount: 99 },
      { name: "Likes", price: "₹29 / 1K", amount: 29 },
      { name: "Saves", price: "₹9 / 1K", amount: 9 },
      { name: "Shares", price: "₹5 / 1K", amount: 5 },
      { name: "Comments", price: "₹99 / 1K", amount: 99 },
      { name: "Repost", price: "₹47 / 1K", amount: 47 },
      { name: "Story Views", price: "₹49 / 1K", amount: 49 },
      { name: "1 Million Views", price: "₹399 / 1M", amount: 399 },
    ],
    color: "border-pink-500/20 hover:border-pink-500/50",
    bg: "bg-pink-500/5"
  },
  {
    title: "YouTube Services",
    icon: <Youtube className="w-6 h-6 text-red-500" />,
    items: [
      { name: "Subscribers", price: "₹1000 / 1K", amount: 1000 },
      { name: "Views", price: "₹299 / 1K", amount: 299 },
      { name: "Likes", price: "₹199 / 1K", amount: 199 },
      { name: "Comments", price: "₹149 / 1K", amount: 149 },
    ],
    color: "border-red-500/20 hover:border-red-500/50",
    bg: "bg-red-500/5"
  },
  {
    title: "Facebook Services",
    icon: <Facebook className="w-6 h-6 text-blue-500" />,
    items: [
      { name: "Followers", price: "₹61 / 1K", amount: 61 },
      { name: "Views", price: "₹9 / 1K", amount: 9 },
      { name: "Reactions", price: "₹19 / 1K", amount: 19 },
      { name: "Comments", price: "Coming Soon", special: true, amount: 0 },
    ],
    color: "border-blue-500/20 hover:border-blue-500/50",
    bg: "bg-blue-500/5"
  },
  {
    title: "Telegram Services",
    icon: <Send className="w-6 h-6 text-sky-500" />,
    items: [
      { name: "Members", price: "₹30 / 1K", amount: 30 },
    ],
    color: "border-sky-500/20 hover:border-sky-500/50",
    bg: "bg-sky-500/5"
  },
];

export default function App() {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [showSpinner, setShowSpinner] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  const [formData, setFormData] = useState({
    link: "",
    mobile: "",
    transactionId: "",
    referralCode: "",
    quantity: "1000"
  });

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

  const calculateDiscountedPrice = (price: number) => {
    if (appliedDiscount === 0) return price;
    const discount = (price * appliedDiscount) / 100;
    return Math.floor(price - discount);
  };

  const handleServiceClick = (service: any, category: string) => {
    if (service.special) return;
    setSelectedService({ ...service, category });
  };

  const getUpiUrl = (scheme: string = "upi") => {
    if (!selectedService) return "";
    const baseUrl = `${scheme}://pay`;
    const params = new URLSearchParams({
      pa: OWNER_UPI,
      pn: "TrendzyHubX",
      am: selectedService.amount.toString(),
      cu: "INR",
      tn: `Order_${selectedService.name.replace(/\s+/g, '_')}`
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("UPI ID Copied! Now you can pay manually from any app.");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const finalPrice = calculateDiscountedPrice(selectedService.amount);
    const discountText = appliedDiscount > 0 ? `%0A*Discount Applied:* ${appliedDiscount}%25 (₹${selectedService.amount - finalPrice} Off)` : "";

    const message = `*New Order from TrendzyHubX*%0A%0A` +
      `*Service:* ${selectedService.category} - ${selectedService.name}%0A` +
      `*Original Price:* ₹${selectedService.amount}%0A` +
      `*Final Price:* ₹${finalPrice}${discountText}%0A` +
      `*Quantity:* ${formData.quantity}%0A` +
      `*Link:* ${formData.link}%0A` +
      `*Mobile:* ${formData.mobile}%0A` +
      `*Transaction ID:* ${formData.transactionId}%0A` +
      `*Referral Code:* ${formData.referralCode || "None"}`;
    
    const whatsappUrl = `https://wa.me/${OWNER_WHATSAPP}?text=${message}`;
    window.open(whatsappUrl, '_blank');

    setSelectedService(null);
    setFormData({ link: "", mobile: "", transactionId: "", referralCode: "", quantity: "1000" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">TrendzyHubX</h1>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Managed by GAUTAM TIWARI</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
              <Zap className="w-3 h-3" /> Fast Delivery
            </span>
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

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-2xl border ${section.color} ${section.bg} transition-all duration-300 group`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform">
                  {section.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{section.title}</h3>
              </div>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item.name}
                    className="w-full flex justify-between items-center py-3 px-4 rounded-xl border border-slate-800/50 bg-slate-900/30 group/item transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-slate-300 font-medium group-hover/item:text-white transition-colors">{item.name}</span>
                      <div className="flex items-center gap-2">
                        {appliedDiscount > 0 && !item.special ? (
                          <>
                            <span className="text-emerald-400 font-bold text-sm">
                              ₹{calculateDiscountedPrice(item.amount)}
                            </span>
                            <span className="text-slate-500 line-through text-[10px]">
                              ₹{item.amount}
                            </span>
                          </>
                        ) : (
                          <span className={`font-bold text-sm ${item.special ? 'text-slate-500 italic' : 'text-emerald-400'}`}>
                            {item.price}
                          </span>
                        )}
                      </div>
                    </div>
                    {!item.special && (
                      <button
                        onClick={() => handleServiceClick(item, section.title)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 active:scale-95"
                      >
                        BUY NOW <Zap className="w-3 h-3 fill-current" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

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
              href={`https://wa.me/${OWNER_WHATSAPP}?text=Hi, I want to start earning with TrendzyHubX. Please guide me about the reseller program.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 group"
            >
              START EARNING NOW <Zap className="w-5 h-5 fill-current group-hover:scale-125 transition-transform" />
            </a>
          </motion.div>
        </div>

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
                    Select your preferred UPI app to pay ₹{selectedService.amount}
                  </p>
                </div>

                {/* App Selection Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={getUpiUrl("phonepe")}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                  >
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <span className="text-white font-black text-xs">PP</span>
                    </div>
                    <span className="text-xs font-bold text-slate-300">PhonePe</span>
                  </a>
                  <a 
                    href={getUpiUrl("googlepay")}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <span className="text-white font-black text-xs">GP</span>
                    </div>
                    <span className="text-xs font-bold text-slate-300">Google Pay</span>
                  </a>
                  <a 
                    href={getUpiUrl("paytmmp")}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all group"
                  >
                    <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <span className="text-white font-black text-xs">PT</span>
                    </div>
                    <span className="text-xs font-bold text-slate-300">Paytm</span>
                  </a>
                  <a 
                    href={getUpiUrl("upi")}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                  >
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Zap className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Other Apps</span>
                  </a>
                </div>

                {/* QR Code & Copy UPI */}
                <div className="flex flex-col items-center gap-4 py-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="text-center space-y-1 mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Or Scan QR Code</span>
                  </div>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${OWNER_UPI}%26pn=TrendzyHubX%26am=${selectedService.amount}%26cu=INR`} 
                    alt="UPI QR Code"
                    className="w-32 h-32 rounded-lg border-4 border-white shadow-lg shadow-emerald-500/10"
                  />
                  <div className="flex flex-col items-center gap-2 w-full px-6">
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(OWNER_UPI)}
                      className="w-full flex items-center justify-center gap-2 text-sm font-bold text-emerald-500 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                    >
                      Copy UPI ID <CreditCard className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Selected Service</span>
                    <div className="text-right">
                      {appliedDiscount > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-slate-500 line-through text-xs">₹{selectedService.amount}</span>
                          <span className="text-emerald-500 font-bold">₹{calculateDiscountedPrice(selectedService.amount)}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-500 font-bold">₹{selectedService.amount}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-white font-bold">{selectedService.category} - {selectedService.name}</p>
                  {appliedDiscount > 0 && (
                    <div className="mt-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 inline-block">
                      {appliedDiscount}% LUCKY DISCOUNT APPLIED
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Profile/Post Link</label>
                    <input 
                      required
                      type="url"
                      placeholder="https://instagram.com/..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Quantity</label>
                      <input 
                        required
                        type="number"
                        placeholder="1000"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mobile Number</label>
                      <input 
                        required
                        type="tel"
                        placeholder="9876543210"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Transaction ID (UTR)</label>
                      <input 
                        required
                        type="text"
                        placeholder="Enter 12-digit UTR number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.transactionId}
                        onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Referral Code (Optional)</label>
                      <input 
                        type="text"
                        placeholder="Enter referral code if any"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.referralCode}
                        onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    CONFIRM ORDER & PAY <Send className="w-4 h-4" />
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
              href={`upi://pay?pa=${OWNER_UPI}&pn=TrendzyHubX&cu=INR`}
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
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            <span className="text-xl font-bold text-white">TrendzyHubX</span>
          </div>
          <div className="text-slate-400 text-sm space-y-2">
            <p className="text-emerald-500 font-bold tracking-widest uppercase text-xs">Managed by GAUTAM TIWARI</p>
            <p>Contact for more platform services</p>
            <p className="font-mono">WhatsApp: {OWNER_WHATSAPP}</p>
            <p className="font-mono">UPI: {OWNER_UPI}</p>
          </div>
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} TrendzyHubX Services. All rights reserved.
          </p>
        </div>
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
