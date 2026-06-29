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

app.use(express.json({ limit: "50mb" }));

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
// VPN / Proxy Detection System — Dynamic Provider Management
// ═══════════════════════════════════════════════════════════════════════════════

import fs from "fs";

// ── Provider Abstraction ──

interface ProviderResult {
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
  asn: string;
  fraudScore: number;
  rawResponse: any;
}

interface VpnProvider {
  id: string;
  name: string;
  checkIp(ip: string, apiKey: string, timeout: number, sensitivity: number): Promise<{ success: boolean; data?: ProviderResult; error?: string; httpStatus?: number }>;
  testKey(apiKey: string, timeout: number): Promise<{ success: boolean; error?: string }>;
}

// ── VPN Configuration ──

interface VpnConfig {
  selectedProvider: string;
  apiKey: string;
  enabled: boolean;
  sensitivity: number; // 1-100, higher = more sensitive
  timeout: number; // in ms
  lastChecked: string;
  status: "connected" | "disconnected" | "error";
  providers: { id: string; name: string; enabled: boolean }[];
}

const VPN_CONFIG_PATH = path.join(process.cwd(), "vpn_config.json");

let vpnConfig: VpnConfig = loadVpnConfig();

function loadVpnConfig(): VpnConfig {
  try {
    if (fs.existsSync(VPN_CONFIG_PATH)) {
      const raw = fs.readFileSync(VPN_CONFIG_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        selectedProvider: parsed.selectedProvider || "proxycheck",
        apiKey: parsed.apiKey || "",
        enabled: parsed.enabled ?? true,
        sensitivity: parsed.sensitivity ?? 70,
        timeout: parsed.timeout ?? 10000,
        lastChecked: parsed.lastChecked || "",
        status: parsed.status || "disconnected",
        providers: parsed.providers || [
          { id: "proxycheck", name: "ProxyCheck.io", enabled: true },
          { id: "ipqualityscore", name: "IPQualityScore", enabled: false },
          { id: "iphub", name: "IPHub", enabled: false },
          { id: "getipintel", name: "GetIPIntel", enabled: false },
        ],
      };
    }
  } catch { /* ignore */ }
  return {
    selectedProvider: "proxycheck",
    apiKey: process.env.PROXYCHECK_API_KEY || process.env.VPN_API_KEY || "",
    enabled: true,
    sensitivity: 70,
    timeout: 10000,
    lastChecked: "",
    status: "disconnected",
    providers: [
      { id: "proxycheck", name: "ProxyCheck.io", enabled: true },
      { id: "ipqualityscore", name: "IPQualityScore", enabled: false },
      { id: "iphub", name: "IPHub", enabled: false },
      { id: "getipintel", name: "GetIPIntel", enabled: false },
    ],
  };
}

function saveVpnConfig() {
  try {
    const dir = path.dirname(VPN_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(VPN_CONFIG_PATH, JSON.stringify(vpnConfig, null, 2));
  } catch { /* ignore */ }
}

function getEffectiveApiKey(): string {
  return vpnConfig.apiKey || process.env.PROXYCHECK_API_KEY || process.env.VPN_API_KEY || "";
}

// ── ProxyCheck.io Provider Implementation ──

const proxycheckProvider: VpnProvider = {
  id: "proxycheck",
  name: "ProxyCheck.io",

  async checkIp(ip: string, apiKey: string, timeout: number, sensitivity: number) {
    const key = apiKey || process.env.PROXYCHECK_API_KEY || process.env.VPN_API_KEY || "";
    if (!key) {
      return { success: false, error: "No ProxyCheck API key configured" };
    }
    const url = `https://proxycheck.io/v2/${encodeURIComponent(ip)}?key=${key}&vpn=1&asn=1&risk=1&port=1&seen=1&days=7`;

    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      const httpStatus = resp.status;
      const text = await resp.text();

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { success: false, error: `Invalid JSON response: ${text.substring(0, 200)}`, httpStatus };
      }

      if (parsed.status === "error") {
        return { success: false, error: parsed.message || "ProxyCheck API error", httpStatus };
      }

      if (parsed.status !== "ok") {
        return { success: false, error: `Unexpected status: ${parsed.status}`, httpStatus };
      }

      const ipData = parsed[ip];
      if (!ipData) {
        return {
          success: true,
          data: {
            detected: false, detectionType: "unknown", isVpn: false, isProxy: false,
            isTor: false, isHosting: false, isAnonymousProxy: false, vpnProvider: "",
            country: "", city: "", region: "", isp: "", org: "", asn: "", fraudScore: 0,
            rawResponse: parsed,
          },
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
      else if (fraudScore >= sensitivity) detectionType = "Suspicious IP";

      if (isVpn && detectionType === "clean") detectionType = "VPN / Proxy";

      return {
        success: true,
        data: {
          detected: detectionType !== "clean",
          detectionType,
          isVpn, isProxy, isTor, isHosting, isAnonymousProxy,
          vpnProvider: ipData.provider || "",
          country: ipData.country || "",
          city: ipData.city || "",
          region: ipData.region || "",
          isp: ipData.isp || "",
          org: ipData.org || "",
          asn: ipData.asn || "",
          fraudScore,
          rawResponse: parsed,
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error", httpStatus: 0 };
    }
  },

  async testKey(apiKey: string, timeout: number) {
    const key = apiKey || process.env.PROXYCHECK_API_KEY || process.env.VPN_API_KEY || "";
    if (!key) {
      return { success: false, error: "No API key provided" };
    }
    try {
      // Test with a known IP (Google DNS)
      const resp = await fetch(`https://proxycheck.io/v2/8.8.8.8?key=${key}&vpn=1&risk=1`, {
        signal: AbortSignal.timeout(timeout),
      });
      const text = await resp.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { success: false, error: "Invalid response from ProxyCheck.io" };
      }
      if (parsed.status === "error") {
        return { success: false, error: parsed.message || "Invalid API key" };
      }
      if (parsed.status === "ok") {
        return { success: true };
      }
      return { success: false, error: `Unexpected status: ${parsed.status}` };
    } catch (err: any) {
      return { success: false, error: err.message || "Connection failed" };
    }
  },
};

// ── Provider Registry ──

const providers: Record<string, VpnProvider> = {
  proxycheck: proxycheckProvider,
};

// ── In-memory VPN detection logs ──

interface VpnDetectionLogEntry {
  id: string;
  userId: string;
  username: string;
  email: string;
  ip: string;
  country: string;
  isp: string;
  org: string;
  city: string;
  region: string;
  detectionType: string;
  vpnProvider: string;
  fraudScore: number;
  asn: string;
  rawResponse: any;
  detectedAt: string;
}

const vpnDetectionLogs: VpnDetectionLogEntry[] = [];

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

// ── API: Get VPN config (without exposing full API key) ──

app.get("/api/vpn/config", (req, res) => {
  const safeConfig = {
    ...vpnConfig,
    apiKey: vpnConfig.apiKey ? "••••••••" + vpnConfig.apiKey.slice(-4) : "",
    hasKey: !!getEffectiveApiKey(),
  };
  res.json(safeConfig);
});

// ── API: Save VPN config ──

app.post("/api/vpn/config", (req, res) => {
  const { apiKey, selectedProvider, enabled, sensitivity, timeout } = req.body;

  if (apiKey !== undefined) vpnConfig.apiKey = apiKey;
  if (selectedProvider !== undefined) vpnConfig.selectedProvider = selectedProvider;
  if (enabled !== undefined) vpnConfig.enabled = enabled;
  if (sensitivity !== undefined) vpnConfig.sensitivity = Math.max(1, Math.min(100, sensitivity));
  if (timeout !== undefined) vpnConfig.timeout = Math.max(1000, Math.min(30000, timeout));

  saveVpnConfig();

  res.json({ saved: true });
});

// ── API: Test VPN connection ──

app.post("/api/vpn/test", async (req, res) => {
  const { apiKey } = req.body;
  const key = apiKey || getEffectiveApiKey();

  if (!key) {
    return res.json({ success: false, error: "No API key provided" });
  }

  const provider = providers[vpnConfig.selectedProvider];
  if (!provider) {
    return res.json({ success: false, error: `Provider "${vpnConfig.selectedProvider}" not available` });
  }

  const result = await provider.testKey(key, vpnConfig.timeout);

  vpnConfig.lastChecked = new Date().toISOString();
  vpnConfig.status = result.success ? "connected" : "error";
  saveVpnConfig();

  res.json(result);
});

// ── API: Get available providers ──

app.get("/api/vpn/providers", (req, res) => {
  res.json({
    providers: vpnConfig.providers,
    current: vpnConfig.selectedProvider,
  });
});

// ── API: VPN check endpoint (used by frontend) ──

app.post("/api/vpn/check", async (req, res) => {
  if (!vpnConfig.enabled) {
    return res.json({
      ip: getClientIp(req) || req.body.ip || "",
      detected: false,
      detectionType: "disabled",
      isVpn: false, isProxy: false, isTor: false, isHosting: false, isAnonymousProxy: false,
      country: "", city: "", region: "", isp: "", org: "", asn: "",
      vpnProvider: "", fraudScore: 0,
      rawResponse: null,
    });
  }

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

  const provider = providers[vpnConfig.selectedProvider];
  if (!provider) {
    console.error("[VPN] Provider not available:", vpnConfig.selectedProvider);
    return res.json({
      ip: clientIp,
      error: `Provider "${vpnConfig.selectedProvider}" not available`,
      detected: false,
      detectionType: "error",
      isVpn: false, isProxy: false, isTor: false, isHosting: false,
      country: "", city: "", region: "", isp: "", org: "",
      vpnProvider: "", fraudScore: 0,
    });
  }

  const apiResult = await provider.checkIp(clientIp, getEffectiveApiKey(), vpnConfig.timeout, vpnConfig.sensitivity);

  if (!apiResult.success) {
    console.error(`[VPN] ${provider.name} error:`, apiResult.error);
    // Try fallback providers
    for (const p of vpnConfig.providers) {
      if (p.id === vpnConfig.selectedProvider || !p.enabled) continue;
      const fallback = providers[p.id];
      if (!fallback) continue;
      console.log(`[VPN] Falling back to ${p.name}...`);
      const fallbackResult = await fallback.checkIp(clientIp, getEffectiveApiKey(), vpnConfig.timeout, vpnConfig.sensitivity);
      if (fallbackResult.success) {
        return res.json({
          ip: clientIp,
          ...fallbackResult.data,
          provider: p.id,
        });
      }
    }
    return res.json({
      ip: clientIp,
      error: apiResult.error,
      httpStatus: apiResult.httpStatus,
      detected: false,
      detectionType: "error",
      isVpn: false, isProxy: false, isTor: false, isHosting: false,
      country: "", city: "", region: "", isp: "", org: "",
      vpnProvider: "", fraudScore: 0,
      rawResponse: null,
    });
  }

  res.json({
    ip: clientIp,
    ...apiResult.data,
    provider: vpnConfig.selectedProvider,
  });
});

// ── API: VPN detection log ──

app.post("/api/vpn/log", (req, res) => {
  const { userId, username, email, result } = req.body;
  if (!userId || !result) return res.status(400).json({ error: "Missing fields" });

  const entry: VpnDetectionLogEntry = {
    id: `vpn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    username,
    email: email || "",
    ip: result.ip || "",
    country: result.country || "",
    isp: result.isp || "",
    org: result.org || "",
    city: result.city || "",
    region: result.region || "",
    detectionType: result.detectionType || result.detection_type || "unknown",
    vpnProvider: result.vpnProvider || "",
    fraudScore: result.fraudScore || result.fraud_score || 0,
    asn: result.asn || "",
    rawResponse: result.rawResponse || null,
    detectedAt: new Date().toISOString(),
  };

  vpnDetectionLogs.unshift(entry);
  if (vpnDetectionLogs.length > 1000) vpnDetectionLogs.length = 1000;

  res.json({ logged: true, entry });
});

// ── API: Get VPN detection logs ──

app.get("/api/vpn/logs", (req, res) => {
  const search = ((req.query.search as string) || "").toLowerCase();
  const typeFilter = (req.query.type as string) || "";

  let logs = vpnDetectionLogs;
  if (search) {
    logs = logs.filter((l) =>
      l.username.toLowerCase().includes(search) ||
      l.email.toLowerCase().includes(search) ||
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

  // In production, replace with an actual API call using provider.apiKey / provider.publisherId.
  // Example: const response = await fetch(`https://api.provider.com/offers?api_key=${provider.apiKey}`);

  const offerTemplates: Record<string, { titles: string[]; descs: string[]; steps?: string[][] }> = {
    "TOROX": {
      titles: ["Rise of Kingdoms", "Coin Master Free Spins", "Bingo Blitz - Bingo Games", "Solitaire Grand Harvest", "Wordscapes - Word Game"],
      descs: ["Build your empire and earn rewards.", "Spin the wheel for free coins.", "Play bingo and win prizes.", "Harvest crops with solitaire.", "Train your brain with word puzzles."],
      steps: [["Install the app", "Reach level 5", "Complete tutorial", "Earn bonus coins"], ["Open the app", "Spin 3 times", "Collect rewards", "Share with friends"], ["Download game", "Play 5 rounds", "Win a jackpot", "Invite a friend"], ["Install game", "Complete 10 levels", "Harvest bonus crops", "Daily login"], ["Download app", "Solve 20 puzzles", "Unlock bonus packs", "Play word challenges"]],
    },
    "AdGate Media": {
      titles: ["Final Fantasy XV: War for Eos", "Golf Clash - Golf Game", "Yahtzee With Buddies", "June's Journey - Hidden Objects", "Dice Dreams - Dice Game"],
      descs: ["Command heroes in epic battles.", "Compete in real-time golf matches.", "Roll the dice with friends.", "Find hidden objects in mysteries.", "Build your dream island with dice."],
      steps: [["Install game", "Complete tutorial", "Reach level 3", "Join a guild"], ["Open app", "Play 3 matches", "Win a trophy", "Upgrade clubs"], ["Download game", "Play 5 rounds", "Win a game", "Unlock new dice"], ["Install app", "Complete chapter 1", "Find 10 hidden objects", "Decorate your island"], ["Download game", "Roll 10 times", "Collect stars", "Build landmarks"]],
    },
    "AdGem": {
      titles: ["Merge Dragons - Puzzle Game", "Board Kings - Board Game", "Pop! Slots - Casino Slots", "Harry Potter: Puzzles & Spells", "Two Dots - Puzzle Game"],
      descs: ["Merge dragons and explore magical lands.", "Roll the dice on a board game adventure.", "Spin slot machines for jackpots.", "Solve match-3 puzzles in the wizarding world.", "Connect dots in this relaxing puzzler."],
      steps: [["Install game", "Merge 5 dragons", "Complete level 1", "Unlock new land"], ["Open app", "Roll dice 5 times", "Collect coins", "Visit a friend's board"], ["Download app", "Spin 10 times", "Hit a bonus round", "Collect chips"], ["Install game", "Complete 10 puzzles", "Unlock spells", "Earn stars"], ["Download app", "Connect 100 dots", "Complete level 5", "Unlock power-ups"]],
    },
    "Lootably": {
      titles: ["Monopoly GO! - Board Game", "Solitaire - Classic Card Game", "Spider Solitaire", "Mahjong - Tile Game", "Block Blast - Puzzle Game"],
      descs: ["Roll dice and build your empire.", "Play the classic card game.", "Challenge yourself with spider solitaire.", "Match tiles in this ancient game.", "Blast blocks in this addictive puzzle."],
      steps: [["Install game", "Complete tutorial", "Build 3 landmarks", "Collect rent"], ["Open app", "Play 5 games", "Win 2 games", "Change card backs"], ["Download app", "Complete 3 levels", "Use a hint", "Beat high score"], ["Install game", "Match 10 pairs", "Complete level 1", "Use a shuffle"], ["Download game", "Score 1000 points", "Clear 10 rows", "Unlock new mode"]],
    },
    "Revenue Universe": {
      titles: ["Raid: Shadow Legends", "Game of Thrones Slots Casino", "Bingo Blitz", "Jackpot World - Casino", "Cashman Casino Slots"],
      descs: ["Collect champions and battle darkness.", "Spin the reels in Westeros.", "Play bingo across the globe.", "Win jackpots in a world casino.", "Play slots for real cash prizes."],
      steps: [["Install game", "Complete tutorial", "Summon 3 champions", "Join a clan"], ["Open app", "Spin 10 times", "Hit a bonus feature", "Collect coins"], ["Download app", "Play 3 bingo rooms", "Win a jackpot", "Collect power-ups"], ["Install game", "Spin 20 times", "Unlock new slot", "Collect daily bonus"], ["Download game", "Spin 15 times", "Hit the jackpot", "Level up"]],
    },
    "CPX Research": {
      titles: ["Monopoly Slots - Casino", "Goblins Wood - Puzzle Game", "Solitaire TriPeaks", "Word Stacks - Word Game", "Scatter Slots - Casino"],
      descs: ["Spin slots with Monopoly themes.", "Help goblins in a puzzle adventure.", "Play tri-peaks solitaire.", "Find hidden words in stacks.", "Spin scatter slots for big wins."],
      steps: [["Download game", "Spin 10 times", "Unlock new board", "Collect rewards"], ["Install game", "Complete 5 puzzles", "Save the goblins", "Collect gems"], ["Open app", "Complete 3 hands", "Use a wild card", "Beat high score"], ["Download app", "Find 20 words", "Complete level 3", "Unlock categories"], ["Install game", "Spin 15 times", "Hit bonus round", "Collect scatter coins"]],
    },
    "BitLabs": {
      titles: ["Bingo Bash - Bingo Game", "Jackpot Master - Slots", "World Series of Poker", "Quick Hit Slots Casino", "Vegas Downtown Slots"],
      descs: ["Play bingo with friends worldwide.", "Become a jackpot master.", "Play poker in the world series.", "Hit quick wins in slot games.", "Experience Vegas slots at home."],
      steps: [["Install app", "Play 3 bingo games", "Win a bingo", "Collect power-ups"], ["Download game", "Spin 10 times", "Unlock new slot", "Hit jackpot"], ["Open app", "Play 5 hands", "Win a tournament", "Collect chips"], ["Install game", "Spin 20 times", "Hit quick hit bonus", "Level up"], ["Download app", "Spin 10 times", "Unlock downtown", "Collect free coins"]],
    },
  };

  const template = offerTemplates[name] || {
    titles: [`${name} - Premium Offer`, `${name} - Flash Deal`, `${name} - Bonus Reward`, `${name} - Special Offer`, `${name} - Daily Challenge`],
    descs: ["Complete this premium offer for big rewards.", "Limited time flash deal!", "Earn bonus coins with this offer.", "Special offer just for you.", "Complete today's challenge and earn."],
  };

  // Generate a consistent seed from a string for image URL consistency
  function hashStr(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0; }
    return Math.abs(hash);
  }

  const offers = Array.from({ length: 5 }, (_, i) => {
    const diff = difficultyOptions[Math.floor(Math.random() * difficultyOptions.length)];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const basePayout = diff === "Easy" ? 500 : diff === "Medium" ? 2500 : 6000;
    const payout = basePayout + Math.floor(Math.random() * basePayout * 0.5);
    const title = template.titles[i % template.titles.length];
    // Use picsum.photos seeded by offer title for realistic, unique thumbnails
    const seed = hashStr(name + "-" + title);
    const imageUrl = `https://picsum.photos/seed/${seed}/400/225`;
    const offerSteps = template.steps?.[i % (template.steps?.length || 1)] || [
      "Install the app",
      "Complete the tutorial",
      "Reach required level",
      "Earn reward coins",
    ];

    return {
      id: `${name.toLowerCase().replace(/\s+/g, "-")}-api-${i + 1}`,
      title,
      description: template.descs[i % template.descs.length],
      payout_coins: payout,
      category: cat,
      provider: name,
      imageUrl,
      difficulty: diff,
      link: `https://${domain}?userId=${req.body.userId || "guest"}`,
      steps: offerSteps.map((s: string) => ({ description: s, reward_coins: Math.floor(payout / offerSteps.length), order: offerSteps.indexOf(s) + 1 })),
    };
  });

  res.json({ offers, provider: name, fetched: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// KYC Verification System — Server-Side Enforcement
// ═══════════════════════════════════════════════════════════════════════════════

interface KycServerRecord {
  id: string;
  userId: string;
  username: string;
  email: string;
  country: string;
  registrationDate: string;
  docType: string;
  docFront: string;
  docBack: string | null;
  selfie: string;
  status: "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";
  adminName: string;
  adminNote: string;
  submittedAt: string;
  reviewedAt: string | null;
}

interface KycServerLog {
  id: string;
  userId: string;
  action: string;
  adminName: string;
  note: string;
  timestamp: string;
}

interface KycServerConfig {
  records: KycServerRecord[];
  logs: KycServerLog[];
}

const KYC_DATA_PATH = path.join(process.cwd(), "kyc_data.json");

let kycServerData: KycServerConfig = loadKycData();

function loadKycData(): KycServerConfig {
  try {
    if (fs.existsSync(KYC_DATA_PATH)) {
      return JSON.parse(fs.readFileSync(KYC_DATA_PATH, "utf-8"));
    }
  } catch { /* ignore */ }
  return { records: [], logs: [] };
}

function saveKycData() {
  try {
    fs.writeFileSync(KYC_DATA_PATH, JSON.stringify(kycServerData, null, 2));
  } catch { /* ignore */ }
}

// POST /api/kyc/submit — Submit KYC documents (including images)
app.post("/api/kyc/submit", (req, res) => {
  const { userId, username, email, country, registrationDate, docType, docFront, docBack, selfie } = req.body;
  if (!userId || !docType) {
    return res.status(400).json({ error: "Missing required fields: userId, docType" });
  }
  if (!docFront || !selfie) {
    return res.status(400).json({ error: "Missing required document images: docFront, selfie" });
  }

  const now = new Date().toISOString();
  const existing = kycServerData.records.findIndex(r => r.userId === userId);
  const record: KycServerRecord = {
    id: `kyc-rec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    userId, username: username || "Unknown", email: email || "",
    country: country || "", registrationDate: registrationDate || now,
    docType, docFront, docBack: docBack || null, selfie,
    status: "PENDING", adminName: "", adminNote: "",
    submittedAt: existing >= 0 ? kycServerData.records[existing].submittedAt : now,
    reviewedAt: null,
  };

  if (existing >= 0) {
    kycServerData.records[existing] = record;
  } else {
    kycServerData.records.push(record);
  }

  kycServerData.logs.unshift({
    id: `kyc-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId, action: "SUBMITTED", adminName: username || "User",
    note: "KYC documents submitted", timestamp: now,
  });

  saveKycData();
  res.json({ submitted: true, record });
});

// GET /api/kyc/records-admin — All KYC records with images (admin use)
app.get("/api/kyc/records-admin", (req, res) => {
  const status = req.query.status as string;
  let records = kycServerData.records;
  if (status && status !== "all") {
    records = records.filter(r => r.status === status);
  }
  records.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  res.json({ records, total: kycServerData.records.length });
});

// GET /api/kyc/requests — List all KYC requests (admin)
app.get("/api/kyc/requests", (req, res) => {
  const status = req.query.status as string;
  let records = kycServerData.records;
  if (status && status !== "all") {
    records = records.filter(r => r.status === status);
  }
  res.json({ records, total: kycServerData.records.length });
});

// GET /api/kyc/request/:userId — Get specific KYC request
app.get("/api/kyc/request/:userId", (req, res) => {
  const record = kycServerData.records.find(r => r.userId === req.params.userId);
  if (!record) return res.status(404).json({ error: "KYC record not found" });
  res.json({ record });
});

// POST /api/kyc/approve — Admin approve KYC
app.post("/api/kyc/approve", (req, res) => {
  const { userId, adminName } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const record = kycServerData.records.find(r => r.userId === userId);
  if (!record) return res.status(404).json({ error: "KYC record not found" });

  record.status = "APPROVED";
  record.adminName = adminName || "Admin";
  record.reviewedAt = new Date().toISOString();

  kycServerData.logs.unshift({
    id: `kyc-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId, action: "APPROVED", adminName: adminName || "Admin",
    note: "KYC approved", timestamp: new Date().toISOString(),
  });

  saveKycData();
  res.json({ approved: true, record });
});

// POST /api/kyc/reject — Admin reject KYC
app.post("/api/kyc/reject", (req, res) => {
  const { userId, adminName, reason, restrictAccount } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const record = kycServerData.records.find(r => r.userId === userId);
  if (!record) return res.status(404).json({ error: "KYC record not found" });

  record.status = "REJECTED";
  record.adminName = adminName || "Admin";
  record.adminNote = reason || "";
  record.reviewedAt = new Date().toISOString();

  const action = restrictAccount ? "REJECTED_AND_RESTRICTED" : "REJECTED";
  kycServerData.logs.unshift({
    id: `kyc-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId, action, adminName: adminName || "Admin",
    note: (reason || "KYC rejected") + (restrictAccount ? " — Account restricted" : ""),
    timestamp: new Date().toISOString(),
  });

  saveKycData();
  res.json({ rejected: true, restrictAccount: !!restrictAccount, record });
});

// POST /api/kyc/resubmission — Request KYC resubmission
app.post("/api/kyc/resubmission", (req, res) => {
  const { userId, adminName } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const record = kycServerData.records.find(r => r.userId === userId);
  if (!record) return res.status(404).json({ error: "KYC record not found" });

  record.status = "REJECTED";
  record.adminName = adminName || "Admin";
  record.adminNote = "Resubmission requested. Please upload new documents.";
  record.reviewedAt = new Date().toISOString();

  kycServerData.logs.unshift({
    id: `kyc-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId, action: "RESUBMISSION_REQUESTED", adminName: adminName || "Admin",
    note: "Resubmission requested", timestamp: new Date().toISOString(),
  });

  saveKycData();
  res.json({ resubmissionRequested: true, record });
});

// GET /api/kyc/check/:userId — Check KYC status (backend enforcement)
app.get("/api/kyc/check/:userId", (req, res) => {
  const record = kycServerData.records.find(r => r.userId === req.params.userId);
  res.json({
    hasRecord: !!record,
    status: record?.status || "NOT_STARTED",
    kycRequired: false, // Determined by admin per-user; this is a general check
  });
});

// GET /api/kyc/logs — Get KYC audit logs
app.get("/api/kyc/logs", (req, res) => {
  const userId = req.query.userId as string;
  let logs = kycServerData.logs;
  if (userId) logs = logs.filter(l => l.userId === userId);
  res.json({ logs: logs.slice(0, 200) });
});

// DELETE /api/kyc/record/:userId — Delete KYC record
app.delete("/api/kyc/record/:userId", (req, res) => {
  const userId = req.params.userId;
  kycServerData.records = kycServerData.records.filter(r => r.userId !== userId);
  saveKycData();
  res.json({ deleted: true });
});

// Activity Feed Settings
const ACTIVITY_FEED_SETTINGS_PATH = path.join(process.cwd(), "activity_feed_settings.json");

function loadActivityFeedSettings(): any {
  try {
    if (fs.existsSync(ACTIVITY_FEED_SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(ACTIVITY_FEED_SETTINGS_PATH, "utf-8"));
    }
  } catch {}
  return { showEarnings: true, showWithdrawals: true, showBonuses: true, showReferrals: true, speed: "normal" };
}

function saveActivityFeedSettings(settings: any) {
  try {
    fs.writeFileSync(ACTIVITY_FEED_SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch {}
}

app.get("/api/activity-feed/settings", (req, res) => {
  res.json(loadActivityFeedSettings());
});

app.post("/api/activity-feed/settings", (req, res) => {
  saveActivityFeedSettings(req.body);
  res.json({ saved: true });
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
