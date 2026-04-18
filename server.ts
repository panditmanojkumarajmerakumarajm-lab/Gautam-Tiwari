import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GLORY_API_URL = "https://glorysmmpanel.com/api/v2";
const GLORY_API_KEY = "9a5696c245796468f537b89a3de5600bb467bad7";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
let GLOBAL_MARKUP = 1.2; // Default 20%

// In-memory store for payments (In production, use a database)
interface Payment {
  id: string;
  utr: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
}
let payments: Payment[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch services with 20% markup
  app.get("/api/services", async (req, res) => {
    try {
      console.log("Fetching services from provider...");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(GLORY_API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        body: new URLSearchParams({
          key: GLORY_API_KEY,
          action: "services"
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      
      const responseText = await response.text();
      console.log("Provider Response Status:", response.status);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Provider returned non-JSON:", responseText);
        return res.status(502).json({ success: false, message: "Provider returned invalid response (Non-JSON)" });
      }

      if (Array.isArray(data)) {
        console.log(`Successfully fetched ${data.length} services.`);
        const markedUpServices = data
          .map((s: any) => {
            const rateStr = String(s.rate).replace(/,/g, '');
            const originalRate = parseFloat(rateStr);
            if (isNaN(originalRate)) return null;
            
            return {
              ...s,
              originalRate: originalRate,
              rate: (originalRate * GLOBAL_MARKUP).toFixed(2) 
            };
          })
          .filter(s => s !== null);

        res.json({ success: true, services: markedUpServices });
      } else {
        console.error("Provider error or non-array data:", data);
        res.status(400).json({ 
          success: false, 
          message: data.error || "Provider returned invalid data format",
          details: data 
        });
      }
    } catch (error: any) {
      console.error("Fetch services error:", error);
      const isTimeout = error.name === 'AbortError';
      res.status(isTimeout ? 504 : 500).json({ 
        success: false, 
        message: isTimeout ? "Provider connection timed out" : `Server error: ${error.message}` 
      });
    }
  });

  // API Route for SMM Panel Order
  app.post("/api/place-order", async (req, res) => {
    const { serviceId, link, quantity, comments } = req.body;

    console.log(`Processing order: Service ${serviceId}, Link ${link}, Qty ${quantity}`);

    try {
      const bodyParams: any = {
        key: GLORY_API_KEY,
        action: "add",
        service: serviceId,
        link: link
      };

      if (comments) {
        bodyParams.comments = comments;
      } else {
        bodyParams.quantity = quantity.toString();
      }

      const params = new URLSearchParams(bodyParams);

      const response = await fetch(GLORY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      });

      const data = await response.json();
      console.log("SMM Panel API Response:", data);

      if (data.order) {
        res.json({ 
          success: true, 
          orderId: data.order,
          message: "Order placed successfully!" 
        });
      } else {
        const errorMsg = data.error || "Failed to place order with provider.";
        console.error("Panel Error:", errorMsg);
        res.status(400).json({ 
          success: false, 
          message: errorMsg 
        });
      }
    } catch (error) {
      console.error("SMM API Exception:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error while placing order." 
      });
    }
  });

  // API Route to check balance
  app.get("/api/check-balance", async (req, res) => {
    try {
      const params = new URLSearchParams({
        key: GLORY_API_KEY,
        action: "balance"
      });

      const response = await fetch(GLORY_API_URL, { 
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      });
      const data = await response.json();

      if (data.balance) {
        res.json({ success: true, balance: data.balance, currency: data.currency });
      } else {
        res.status(400).json({ success: false, message: data.error || "Failed to fetch balance." });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error." });
    }
  });

  // PAYMENT ENDPOINTS
  app.post("/api/payments/submit", (req, res) => {
    const { utr, amount } = req.body;
    
    if (!utr || !amount) {
      return res.status(400).json({ success: false, message: "UTR and Amount are required" });
    }

    // Check if UTR already exists
    if (payments.find(p => p.utr === utr)) {
      return res.status(400).json({ success: false, message: "This UTR has already been submitted." });
    }

    const newPayment: Payment = {
      id: Math.random().toString(36).substring(7),
      utr,
      amount: parseFloat(amount),
      status: "pending",
      timestamp: new Date().toISOString()
    };

    payments.push(newPayment);
    res.json({ success: true, payment: newPayment });
  });

  app.get("/api/payments/status/:utr", (req, res) => {
    const { utr } = req.params;
    const payment = payments.find(p => p.utr === utr);
    
    if (payment) {
      res.json({ success: true, status: payment.status, amount: payment.amount });
    } else {
      res.status(404).json({ success: false, message: "Payment not found" });
    }
  });

  // ADMIN PAYMENT ENDPOINTS
  app.get("/api/admin/payments", (req, res) => {
    res.json({ success: true, payments: payments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) });
  });

  app.post("/api/admin/approve-payment", (req, res) => {
    const { id } = req.body;
    const payment = payments.find(p => p.id === id);
    
    if (payment) {
      payment.status = "approved";
      res.json({ success: true, message: "Payment approved" });
    } else {
      res.status(404).json({ success: false, message: "Payment not found" });
    }
  });

  app.post("/api/admin/reject-payment", (req, res) => {
    const { id } = req.body;
    const payment = payments.find(p => p.id === id);
    
    if (payment) {
      payment.status = "rejected";
      res.json({ success: true, message: "Payment rejected" });
    } else {
      res.status(404).json({ success: false, message: "Payment not found" });
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      // Fetch balance and services count for stats
      const balanceParams = new URLSearchParams({ key: GLORY_API_KEY, action: "balance" });
      const servicesParams = new URLSearchParams({ key: GLORY_API_KEY, action: "services" });

      const [balanceRes, servicesRes] = await Promise.all([
        fetch(GLORY_API_URL, { method: "POST", body: balanceParams }),
        fetch(GLORY_API_URL, { method: "POST", body: servicesParams })
      ]);

      const balanceData = await balanceRes.json();
      const servicesData = await servicesRes.json();

      res.json({
        success: true,
        stats: {
          balance: balanceData.balance || "0.00",
          currency: balanceData.currency || "INR",
          servicesCount: Array.isArray(servicesData) ? servicesData.length : 0,
          markup: ((GLOBAL_MARKUP - 1) * 100).toFixed(0)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch stats" });
    }
  });

  app.post("/api/admin/update-markup", (req, res) => {
    const { markup } = req.body;
    const newMarkup = parseFloat(markup);
    
    if (!isNaN(newMarkup)) {
      GLOBAL_MARKUP = 1 + (newMarkup / 100);
      res.json({ success: true, message: `Markup updated to ${markup}%` });
    } else {
      res.status(400).json({ success: false, message: "Invalid markup value" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
