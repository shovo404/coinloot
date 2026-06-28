export type ActivityType = "earning" | "withdrawal" | "bonus" | "referral";

export interface ActivityFeedItem {
  id: string;
  userId?: string;
  username: string;
  activityType: ActivityType;
  provider?: string;
  coins: number;
  message: string;
  createdAt: string;
}

export interface TickerSettings {
  showEarnings: boolean;
  showWithdrawals: boolean;
  showBonuses: boolean;
  showReferrals: boolean;
  speed: "slow" | "normal" | "fast";
}

const SETTINGS_KEY = "coinloot_ticker_settings";
const FEED_KEY = "coinloot_activity_feed";

export function maskUsername(username: string): string {
  if (!username || username.length <= 2) return username;
  return username[0] + "***" + username[username.length - 1];
}

export function getTickerSettings(): TickerSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return { showEarnings: true, showWithdrawals: true, showBonuses: true, showReferrals: true, speed: "normal" };
}

export function saveTickerSettings(settings: TickerSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  try { fetch("/api/activity-feed/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }).catch(() => {}); } catch {}
}

export function getSpeedMs(speed: TickerSettings["speed"]): number {
  switch (speed) {
    case "slow": return 5000;
    case "fast": return 3000;
    default: return 4000;
  }
}

const DEMO_ACTIVITIES: ActivityFeedItem[] = [
  { id: "demo-1", username: "Shovo", activityType: "earning", provider: "AdGate", coins: 650, message: "", createdAt: new Date(Date.now() - 5000).toISOString() },
  { id: "demo-2", username: "Milon", activityType: "earning", provider: "Torox", coins: 1250, message: "", createdAt: new Date(Date.now() - 15000).toISOString() },
  { id: "demo-3", username: "Rahman", activityType: "withdrawal", provider: "Binance Pay", coins: 5000, message: "", createdAt: new Date(Date.now() - 30000).toISOString() },
  { id: "demo-4", username: "Ahmed", activityType: "earning", provider: "CPX Research", coins: 850, message: "", createdAt: new Date(Date.now() - 45000).toISOString() },
  { id: "demo-5", username: "Fatima", activityType: "bonus", provider: "", coins: 300, message: "", createdAt: new Date(Date.now() - 60000).toISOString() },
  { id: "demo-6", username: "John", activityType: "earning", provider: "AdGem", coins: 720, message: "", createdAt: new Date(Date.now() - 90000).toISOString() },
  { id: "demo-7", username: "Emma", activityType: "withdrawal", provider: "PayPal", coins: 2000, message: "", createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: "demo-8", username: "David", activityType: "referral", provider: "", coins: 500, message: "", createdAt: new Date(Date.now() - 150000).toISOString() },
  { id: "demo-9", username: "Sarah", activityType: "earning", provider: "Revenue Universe", coins: 1100, message: "", createdAt: new Date(Date.now() - 180000).toISOString() },
  { id: "demo-10", username: "Alex", activityType: "earning", provider: "Lootably", coins: 950, message: "", createdAt: new Date(Date.now() - 210000).toISOString() },
  { id: "demo-11", username: "Maria", activityType: "earning", provider: "YourSurveys", coins: 600, message: "", createdAt: new Date(Date.now() - 240000).toISOString() },
  { id: "demo-12", username: "Hassan", activityType: "withdrawal", provider: "USDT", coins: 10000, message: "", createdAt: new Date(Date.now() - 270000).toISOString() },
  { id: "demo-13", username: "Nina", activityType: "bonus", provider: "", coins: 200, message: "", createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: "demo-14", username: "Omar", activityType: "earning", provider: "AdGate", coins: 1500, message: "", createdAt: new Date(Date.now() - 350000).toISOString() },
  { id: "demo-15", username: "Priya", activityType: "referral", provider: "", coins: 750, message: "", createdAt: new Date(Date.now() - 400000).toISOString() },
  { id: "demo-16", username: "Carlos", activityType: "earning", provider: "Torox", coins: 880, message: "", createdAt: new Date(Date.now() - 450000).toISOString() },
  { id: "demo-17", username: "Aisha", activityType: "withdrawal", provider: "Binance Pay", coins: 3500, message: "", createdAt: new Date(Date.now() - 500000).toISOString() },
  { id: "demo-18", username: "Wei", activityType: "earning", provider: "CPX Research", coins: 420, message: "", createdAt: new Date(Date.now() - 550000).toISOString() },
  { id: "demo-19", username: "Khalid", activityType: "bonus", provider: "", coins: 1000, message: "", createdAt: new Date(Date.now() - 600000).toISOString() },
  { id: "demo-20", username: "Sophie", activityType: "earning", provider: "AdGem", coins: 1350, message: "", createdAt: new Date(Date.now() - 700000).toISOString() },
  { id: "demo-21", username: "Raj", activityType: "earning", provider: "Revenue Universe", coins: 780, message: "", createdAt: new Date(Date.now() - 800000).toISOString() },
  { id: "demo-22", username: "Lena", activityType: "referral", provider: "", coins: 250, message: "", createdAt: new Date(Date.now() - 900000).toISOString() },
  { id: "demo-23", username: "Tom", activityType: "earning", provider: "Lootably", coins: 2000, message: "", createdAt: new Date(Date.now() - 1000000).toISOString() },
  { id: "demo-24", username: "Yuki", activityType: "withdrawal", provider: "PayPal", coins: 1500, message: "", createdAt: new Date(Date.now() - 1100000).toISOString() },
  { id: "demo-25", username: "Ivan", activityType: "earning", provider: "AdGate", coins: 560, message: "", createdAt: new Date(Date.now() - 1200000).toISOString() },
];

export function getDemoFeed(): ActivityFeedItem[] {
  return DEMO_ACTIVITIES;
}

export function getStoredFeed(): ActivityFeedItem[] {
  try {
    const data = localStorage.getItem(FEED_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

export function saveFeed(feed: ActivityFeedItem[]) {
  try {
    localStorage.setItem(FEED_KEY, JSON.stringify(feed.slice(0, 50)));
  } catch {}
}

export function buildActivityMessage(item: ActivityFeedItem): string {
  const masked = maskUsername(item.username);
  switch (item.activityType) {
    case "earning":
      return `${masked} earned ${item.coins.toLocaleString()} coins${item.provider ? ` from ${item.provider}` : ""}`;
    case "withdrawal":
      return `${masked} withdrew ${item.coins.toLocaleString()} coins${item.provider ? ` via ${item.provider}` : ""}`;
    case "bonus":
      return `${masked} received ${item.coins.toLocaleString()} bonus coins`;
    case "referral":
      return `${masked} earned ${item.coins.toLocaleString()} coins from referral`;
    default:
      return `${masked} earned ${item.coins.toLocaleString()} coins`;
  }
}

export function buildActivityMessageWithIcons(item: ActivityFeedItem): { icon: string; message: string; coinsClass: string } {
  const masked = maskUsername(item.username);
  switch (item.activityType) {
    case "earning":
      return {
        icon: "🟢",
        message: `${masked} earned from ${item.provider || "an offer"}`,
        coinsClass: "text-emerald-400",
      };
    case "withdrawal":
      return {
        icon: "💰",
        message: `${masked} withdrew via ${item.provider || "unknown method"}`,
        coinsClass: "text-amber-400",
      };
    case "bonus":
      return {
        icon: "🎁",
        message: `${masked} received bonus`,
        coinsClass: "text-purple-400",
      };
    case "referral":
      return {
        icon: "👥",
        message: `${masked} earned from referral`,
        coinsClass: "text-cyan-400",
      };
    default:
      return {
        icon: "🟢",
        message: `${masked} earned coins`,
        coinsClass: "text-emerald-400",
      };
  }
}

export function filterFeedBySettings(feed: ActivityFeedItem[], settings: TickerSettings): ActivityFeedItem[] {
  return feed.filter(item => {
    switch (item.activityType) {
      case "earning": return settings.showEarnings;
      case "withdrawal": return settings.showWithdrawals;
      case "bonus": return settings.showBonuses;
      case "referral": return settings.showReferrals;
      default: return true;
    }
  });
}

export function mergeFeeds(realFeed: ActivityFeedItem[], demos: ActivityFeedItem[]): ActivityFeedItem[] {
  if (realFeed.length >= 3) return realFeed;
  const realIds = new Set(realFeed.map(r => r.id));
  const needed = Math.max(0, 10 - realFeed.length);
  const available = demos.filter(d => !realIds.has(d.id));
  return [...realFeed, ...available.slice(0, needed)];
}
