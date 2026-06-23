import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Netlify exports the app as a serverless function
export { app };

app.use(express.json());

// Lazy-loaded Gemini helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// AI Chatbot endpoint
app.post("/api/ai/chat", async (req, res) => {
  const { message, userProfile } = req.body;
  const client = getGeminiClient();

  if (!client) {
    // Elegant system tutor fallback if no valid API key is present
    const greetings = [
      `Greetings, ${userProfile?.username || "Looter"}! I am the Coin Loot Deep Space Assistant. Currently, I'm running in offline safety mode as your API credentials load. Try completing 'Coinbase Star' for a fast 150XP payout!`,
      "Welcome back. XP levels are tracking beautifully! To maximize earnings, I recommendTorox high-paying survey walls this hour.",
      "Security diagnostics are completely green. VPN and location validation passed. Did you check your daily mystery crate yet today?",
    ];
    const randomGreet = greetings[Math.floor(Math.random() * greetings.length)];
    return res.json({ response: randomGreet });
  }

  try {
    const prompt = `You are the Coin Loot AI Earnings Assistant, an elite companion on the next-gen GPT/Offerwall platform called Coin Loot. The theme is Space, Futuristic, cyberpunk, gaming, and high-performance financial rewards.
    User Info: Level ${userProfile?.level || 1}, Streak: ${userProfile?.streak_days || 0} days, Coins: ${userProfile?.balance_coins || 0}.
    User query: "${message}"
    Provide a futuristic, supportive, highly functional 1-2 sentence response. Help them earn coins, suggest check-in streaks, refer details, and optimize rewards. Use futuristic and elite tone.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ response: response.text });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.json({ response: "Mission Control reporting telemetry interference. Try checking Torox or CPX for bonus loot multiplier rewards!" });
  }
});

// AI Recommended Offers endpoint
app.post("/api/ai/offers", async (req, res) => {
  const { userProfile, availableOffers } = req.body;
  const client = getGeminiClient();

  const mockReasoning = [
    { id: "o-1", reason: "Highly matched for gaming enthusiasts under Level 5" },
    { id: "o-4", reason: "Highest coin-per-minute return ratio on CPX" },
    { id: "o-7", reason: "Instant approval for active check-in members" }
  ];

  if (!client) {
    return res.json({ recommended: mockReasoning });
  }

  try {
    const prompt = `Given the available offer candidates: ${JSON.stringify(availableOffers || [])}
    and user stats: level ${userProfile?.level || 1}, balance ${userProfile?.balance_coins || 0} coins.
    We need to select up to 3 recommended offers.
    Respond strictly with a JSON array that maps offer ID to a 10-word futuristic recommendation reason.
    Example: [{"id": "o-1", "reason": "Quantum data node verification pays high multiplier."}]`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    res.json({ recommended: parsed });
  } catch (err) {
    res.json({ recommended: mockReasoning });
  }
});

// AI User Insights endpoint
app.post("/api/ai/insights", async (req, res) => {
  const { userProfile, earningsHistory } = req.body;
  const client = getGeminiClient();

  if (!client) {
    return res.json({
      insight: "Analysis indicates high velocity of multiplier events. Connect CPX Research to unlock VIP survey tiers next."
    });
  }

  try {
    const prompt = `Analyze user stats state: Coins Earned: ${userProfile?.total_earned_coins || 0}, Level: ${userProfile?.level || 1}, Streak: ${userProfile?.streak_days || 0}.
    Provide a premium 1-sentence analytical growth recommendation report designed to help the user secure the highest payouts.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ insight: response.text });
  } catch (err) {
    res.json({ insight: "Earning logs analyzed. Level up to unlocked multiplier rewards across torox offer pools!" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VPN / Proxy Detection System — ProxyCheck.io
// ═══════════════════════════════════════════════════════════════════════════════

const PROXYCHECK_API_KEY = process.env.PROXYCHECK_API_KEY || process.env.VPN_API_KEY || "";

// In-memory VPN detection logs (persisted only for session)
const vpnDetectionLogs: VpnDetectionLogEntry[] = [];

interface VpnDetectionLogEntry {
  id: string;
  userId: string;
  username: string;
  ip: string;
  country: string;
  isp: string;
  org: string;
  city: string;
  region: string;
  detectionType: string;
  vpnProvider: string;
  fraudScore: number;
  rawResponse: any;
  detectedAt: string;
}

/** Extract the real client IP from request headers */
function getClientIp(req: any): string {
  const cf = req.headers["cf-connecting-ip"];
  if (cf && typeof cf === "string" && cf.trim()) return cf.trim();

  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded && typeof forwarded === "string") {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  const realIp = req.headers["x-real-ip"];
  if (realIp && typeof realIp === "string" && realIp.trim()) return realIp.trim();

  const remote = req.socket?.remoteAddress;
  if (remote && remote !== "::1" && remote !== "127.0.0.1" && remote !== "::ffff:127.0.0.1") {
    return remote;
  }

  return "";
}

/** Query ProxyCheck.io API for the given IP */
async function queryProxyCheck(ip: string): Promise<{
  success: boolean;
  data: any;
  error?: string;
  httpStatus?: number;
}> {
  const url = `https://proxycheck.io/v2/${encodeURIComponent(ip)}?key=${PROXYCHECK_API_KEY}&vpn=1&asn=1&risk=1&port=1&seen=1&days=7`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const httpStatus = resp.status;
    const text = await resp.text();

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, data: null, error: `Invalid JSON response: ${text.substring(0, 200)}`, httpStatus };
    }

    if (parsed.status === "error") {
      return { success: false, data: parsed, error: parsed.message || "ProxyCheck API error", httpStatus };
    }

    if (parsed.status !== "ok") {
      return { success: false, data: parsed, error: `Unexpected status: ${parsed.status}`, httpStatus };
    }

    return { success: true, data: parsed, httpStatus };
  } catch (err: any) {
    return { success: false, data: null, error: err.message || "Network error", httpStatus: 0 };
  }
}

/** Parse ProxyCheck response into structured result */
function parseProxyCheckResult(ip: string, raw: any): {
  detected: boolean;
  detectionType: string;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isHosting: boolean;
  isAnonymousProxy: boolean;
  vpnProvider: string;
  country: string;
  city: string;
  region: string;
  isp: string;
  org: string;
  fraudScore: number;
  rawResponse: any;
} {
  const ipData = raw?.[ip];
  if (!ipData) {
    return {
      detected: false, detectionType: "unknown", isVpn: false, isProxy: false,
      isTor: false, isHosting: false, isAnonymousProxy: false, vpnProvider: "",
      country: "", city: "", region: "", isp: "", org: "", fraudScore: 0,
      rawResponse: raw,
    };
  }

  const proxyStatus = (ipData.proxy || "no").toLowerCase();
  const proxyType = (ipData.type || "").toLowerCase();
  const isVpn = proxyStatus === "yes";
  const isProxy = proxyType === "proxy";
  const isTor = proxyType === "tor";
  const isHosting = proxyType === "hosting";
  const isAnonymousProxy = proxyType === "anonymous" || proxyType === "public";

  const fraudScore = typeof ipData.risk === "number" ? ipData.risk :
                     typeof ipData.risk === "string" ? parseInt(ipData.risk, 10) || 0 : 0;

  let detectionType = "clean";
  if (isTor) detectionType = "TOR Network";
  else if (proxyType === "vpn") detectionType = "VPN";
  else if (proxyType === "proxy") detectionType = "Proxy";
  else if (proxyType === "hosting") detectionType = "Datacenter IP";
  else if (proxyType === "anonymous" || proxyType === "public") detectionType = "Anonymous Proxy";
  else if (proxyType === "dns") detectionType = "DNS Proxy";
  else if (isVpn && !proxyType) detectionType = "VPN";
  else if (fraudScore >= 80) detectionType = "Suspicious IP";

  // If proxy is yes but no specific type, use generic "VPN / Proxy"
  if (isVpn && detectionType === "clean") detectionType = "VPN / Proxy";

  return {
    detected: detectionType !== "clean",
    detectionType,
    isVpn,
    isProxy,
    isTor,
    isHosting,
    isAnonymousProxy,
    vpnProvider: ipData.provider || "",
    country: ipData.country || "",
    city: ipData.city || "",
    region: ipData.region || "",
    isp: ipData.isp || "",
    org: ipData.org || "",
    fraudScore,
    rawResponse: raw,
  };
}

app.post("/api/vpn/check", async (req, res) => {
  // 1. Detect real client IP from headers
  const detectedIp = getClientIp(req);
  const clientIp = detectedIp || req.body.ip || "";

  if (!clientIp || clientIp === "::1" || clientIp === "127.0.0.1" || clientIp === "::ffff:127.0.0.1") {
    return res.json({
      error: "Invalid IP address",
      ip: clientIp,
      detected: false,
      detectionType: "unknown",
      isVpn: false, isProxy: false, isTor: false, isHosting: false,
      country: "", city: "", region: "", isp: "", org: "",
      vpnProvider: "", fraudScore: 0,
    });
  }

  // 2. Query ProxyCheck.io
  const apiResult = await queryProxyCheck(clientIp);

  if (!apiResult.success) {
    console.error("[ProxyCheck] API error:", apiResult.error);
    return res.json({
      ip: clientIp,
      error: apiResult.error,
      httpStatus: apiResult.httpStatus,
      detected: false,
      detectionType: "error",
      isVpn: false, isProxy: false, isTor: false, isHosting: false,
      country: "", city: "", region: "", isp: "", org: "",
      vpnProvider: "", fraudScore: 0,
      rawResponse: apiResult.data,
    });
  }

  // 3. Parse the response
  const result = parseProxyCheckResult(clientIp, apiResult.data);

  res.json({
    ip: clientIp,
    detected: result.detected,
    detectionType: result.detectionType,
    isVpn: result.isVpn,
    isProxy: result.isProxy,
    isTor: result.isTor,
    isHosting: result.isHosting,
    isAnonymousProxy: result.isAnonymousProxy,
    vpnProvider: result.vpnProvider,
    country: result.country,
    city: result.city,
    region: result.region,
    isp: result.isp,
    org: result.org,
    fraudScore: result.fraudScore,
    rawResponse: result.rawResponse,
  });
});

// Server-side VPN detection log — stores and returns logs for admin
app.post("/api/vpn/log", (req, res) => {
  const { userId, username, result } = req.body;
  if (!userId || !result) return res.status(400).json({ error: "Missing fields" });

  const entry: VpnDetectionLogEntry = {
    id: `vpn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    username,
    ip: result.ip || "",
    country: result.country || "",
    isp: result.isp || "",
    org: result.org || "",
    city: result.city || "",
    region: result.region || "",
    detectionType: result.detectionType || result.detection_type || "unknown",
    vpnProvider: result.vpnProvider || "",
    fraudScore: result.fraudScore || result.fraud_score || 0,
    rawResponse: result.rawResponse || null,
    detectedAt: new Date().toISOString(),
  };

  vpnDetectionLogs.unshift(entry);
  // Keep last 1000 entries
  if (vpnDetectionLogs.length > 1000) vpnDetectionLogs.length = 1000;

  res.json({ logged: true, entry });
});

// Admin: get all VPN detection logs
app.get("/api/vpn/logs", (req, res) => {
  const search = ((req.query.search as string) || "").toLowerCase();
  const typeFilter = (req.query.type as string) || "";

  let logs = vpnDetectionLogs;
  if (search) {
    logs = logs.filter((l) =>
      l.username.toLowerCase().includes(search) ||
      l.userId.toLowerCase().includes(search) ||
      l.ip.includes(search) ||
      l.country.toLowerCase().includes(search) ||
      l.isp.toLowerCase().includes(search)
    );
  }
  if (typeFilter && typeFilter !== "all") {
    logs = logs.filter((l) => l.detectionType.toLowerCase() === typeFilter.toLowerCase());
  }

  res.json({ logs: logs.slice(0, 200) });
});

// ── Telegram Bot Notifications ──
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

app.post("/api/telegram/send", async (req, res) => {
  const { message, botToken, chatId } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const token = botToken || TELEGRAM_BOT_TOKEN;
  const chat = chatId || TELEGRAM_CHAT_ID;

  if (!token || !chat) return res.json({ sent: false, error: "Telegram not configured" });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chat,
        text: message,
        parse_mode: "HTML",
      }),
    });
    clearTimeout(timeout);

    const data = await resp.json();
    res.json({ sent: data.ok === true, error: data.description });
  } catch (err: any) {
    console.error("Telegram send error:", err.message || err);
    if (err.name === "AbortError") {
      res.json({ sent: false, error: "Telegram API timeout" });
    } else {
      res.json({ sent: false, error: err.message });
    }
  }
});

// ── Admin Notifications API ──
const adminNotifications: any[] = [];

app.post("/api/admin/notifications", (req, res) => {
  const notif = req.body;
  if (!notif || !notif.id) return res.status(400).json({ error: "Invalid notification" });
  adminNotifications.unshift(notif);
  if (adminNotifications.length > 1000) adminNotifications.length = 1000;
  res.json({ stored: true });
});

app.get("/api/admin/notifications", (req, res) => {
  const unreadOnly = req.query.unread === "true";
  const type = req.query.type as string;
  const search = ((req.query.search as string) || "").toLowerCase();

  let results = adminNotifications;
  if (unreadOnly) results = results.filter((n) => !n.is_read);
  if (type && type !== "all") results = results.filter((n) => n.type === type);
  if (search) {
    results = results.filter((n) =>
      n.username?.toLowerCase().includes(search) ||
      n.user_id?.toLowerCase().includes(search) ||
      n.title?.toLowerCase().includes(search)
    );
  }
  res.json({ notifications: results.slice(0, 200) });
});

// ── Offerwall API Proxy: fetch offers from connected providers ──
app.post("/api/offerwall/fetch", async (req, res) => {
  const { provider } = req.body;
  if (!provider || !provider.name) return res.status(400).json({ error: "Provider info required" });

  const name = provider.name;
  const domain = provider.domain || `${name.toLowerCase().replace(/\s+/g, "")}.com`;
  const difficultyOptions = ["Easy", "Medium", "Hard"] as const;
  const categories = ["trending", "high-paying", "new", "recommended"] as const;

  // Simulate fetching offers from the provider's API.
  // In production, replace this with an actual API call using provider.apiKey / provider.publisherId.
  const offerTemplates: Record<string, { titles: string[]; descs: string[] }> = {
    "TOROX": {
      titles: ["TOROX Premium Offerwall", "TOROX Star Survey Pack", "TOROX Install & Earn", "TOROX Video Rewards", "TOROX Daily Bonus"],
      descs: ["High-paying offers from top brands.", "Quick surveys with instant payout.", "Install apps and earn coins.", "Watch videos and earn rewards.", "Daily tasks for bonus coins."],
    },
    "AdGate Media": {
      titles: ["AdGate Discovery Offer", "AdGate App Install", "AdGate Survey Panel", "AdGate Game Trial", "AdGate Reward Wall"],
      descs: ["Discover new products and earn.", "Install apps and complete trials.", "Share your opinion in surveys.", "Try new games for coins.", "Complete tasks on the reward wall."],
    },
    "AdGem": {
      titles: ["AdGem Offer Wall", "AdGem App Install", "AdGate Survey Panel", "AdGem Game Trial", "AdGem Daily Tasks"],
      descs: ["Browse and complete offers.", "Install mobile apps.", "Earn from surveys.", "Try new games.", "Complete daily tasks."],
    },
    "Lootably": {
      titles: ["Lootably Offer Wall", "Lootably Survey", "Lootably App Install", "Lootably Video", "Lootably Daily Bonus"],
      descs: ["Complete offers for coins.", "Take quick surveys.", "Install and play apps.", "Watch promotional videos.", "Daily check-in bonus."],
    },
    "Revenue Universe": {
      titles: ["RevU Special Offer", "RevU Crypto Signup", "RevU Survey", "RevU App Install", "RevU Credit Card Offer"],
      descs: ["Exclusive high-paying offers.", "Crypto platform signups.", "Market research surveys.", "App installs and trials.", "Financial product signups."],
    },
    "CPX Research": {
      titles: ["CPX Consumer Survey", "CPX Tech Survey", "CPX Market Research", "CPX Product Feedback", "CPX Opinion Panel"],
      descs: ["Share your consumer opinions.", "Tech product feedback surveys.", "Market research studies.", "Product testing and feedback.", "Long-term opinion panel."],
    },
    "BitLabs": {
      titles: ["BitLabs Survey", "BitLabs Offer Wall", "BitLabs App Install", "BitLabs Video Reward", "BitLabs Daily Task"],
      descs: ["Complete surveys for coins.", "Browse offers and earn.", "Install recommended apps.", "Watch videos and earn.", "Complete daily challenges."],
    },
  };

  const template = offerTemplates[name] || {
    titles: [`${name} Offer`, `${name} Survey`, `${name} App Install`, `${name} Video Reward`, `${name} Daily Task`],
    descs: ["Complete this offer and earn coins.", "Take a survey and earn.", "Install the app and earn.", "Watch and earn rewards.", "Complete daily tasks."],
  };

  const offers = Array.from({ length: 5 }, (_, i) => {
    const diff = difficultyOptions[Math.floor(Math.random() * difficultyOptions.length)];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const basePayout = diff === "Easy" ? 500 : diff === "Medium" ? 2500 : 6000;
    const payout = basePayout + Math.floor(Math.random() * basePayout * 0.5);
    return {
      id: `${name.toLowerCase().replace(/\s+/g, "-")}-api-${i + 1}`,
      title: template.titles[i % template.titles.length],
      description: template.descs[i % template.descs.length],
      payout_coins: payout,
      category: cat,
      provider: name,
      imageUrl: `https://logo.clearbit.com/${domain}`,
      difficulty: diff,
      link: `https://${domain}?userId=${req.body.userId || "guest"}`,
    };
  });

  res.json({ offers, provider: name, fetched: true });
});

// Health metrics api
app.get("/api/health", (req, res) => {
  res.json({ status: "alive", system: "CoinLoot-V3" });
});

async function startServer() {
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
    console.log(`Coin Loot Server running on http://localhost:${PORT}`);
  });
}

// Only start the server when run directly (not imported as a Netlify function)
if (!process.env.NETLIFY) {
  startServer();
}
