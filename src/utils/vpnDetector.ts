export interface VpnCheckResult {
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isHosting: boolean;
  isAnonymousProxy: boolean;
  ip: string;
  country: string;
  city: string;
  region: string;
  isp: string;
  org: string;
  vpnProvider: string;
  fraudScore: number;
  detectionType: string;
  rawResponse?: any;
}

export interface VpnDetectionLog {
  id: string;
  userId: string;
  username: string;
  ip: string;
  country: string;
  city: string;
  isp: string;
  org: string;
  detectionType: string;
  vpnProvider: string;
  fraudScore: number;
  rawResponse?: any;
  detectedAt: string;
}

export interface RestrictionHistoryEntry {
  id: string;
  userId: string;
  username: string;
  action: "restricted" | "unrestricted" | "extended" | "banned";
  duration: number;
  reason: string;
  adminNote?: string;
  adminAction: string;
  timestamp: string;
}

// ── User IP Log (per-user IP tracking) ──

export interface UserIpLog {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  country: string;
  city: string;
  isp: string;
  proxyDetected: boolean;
  proxyType: string;
  riskScore: number;
  lastSeen: string;
  createdAt: string;
}

export function logUserIp(userId: string, username: string, result: VpnCheckResult): UserIpLog {
  const entry: UserIpLog = {
    id: `ipl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    username,
    ipAddress: result.ip,
    country: result.country,
    city: result.city,
    isp: result.isp,
    proxyDetected: result.isVpn || result.isProxy || result.isTor || result.isHosting,
    proxyType: result.detectionType,
    riskScore: result.fraudScore,
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  try {
    const logs: UserIpLog[] = JSON.parse(localStorage.getItem("coinloot_user_ip_logs") || "[]");
    logs.unshift(entry);
    localStorage.setItem("coinloot_user_ip_logs", JSON.stringify(logs.slice(0, 1000)));
  } catch { /* */ }
  return entry;
}

export function getUserIpLogs(limit = 200): UserIpLog[] {
  try {
    return JSON.parse(localStorage.getItem("coinloot_user_ip_logs") || "[]").slice(0, limit);
  } catch { return []; }
}

// ── VPN Protection Settings ──

export interface VpnProtectionSettings {
  vpnWarning: boolean;
  offerwallBlock: boolean;
  withdrawalBlock: boolean;
}

export function getVpnSettings(): VpnProtectionSettings {
  try {
    const saved = localStorage.getItem("coinloot_vpn_settings");
    if (saved) return JSON.parse(saved);
  } catch { /* */ }
  return { vpnWarning: true, offerwallBlock: true, withdrawalBlock: true };
}

export function saveVpnSettings(settings: VpnProtectionSettings) {
  localStorage.setItem("coinloot_vpn_settings", JSON.stringify(settings));
}

// ── Server-side VPN check ──

export async function checkVpnStatus(): Promise<VpnCheckResult> {
  try {
    const resp = await fetch("/api/vpn/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(15000),
    });
    const data = await resp.json();

    // Check for API key / config error
    if (data.error) {
      if (data.error === "Invalid IP address") {
        // Try with a public IP fetch as fallback
        const publicIp = await getPublicIpFallback();
        if (publicIp) {
          const retry = await fetch("/api/vpn/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip: publicIp }),
            signal: AbortSignal.timeout(10000),
          });
          const retryData = await retry.json();
          return mapServerResponse(retryData);
        }
      }
      return emptyResult();
    }

    return mapServerResponse(data);
  } catch {
    // Server unreachable — allow access (fail open)
    return emptyResult();
  }
}

function mapServerResponse(data: any): VpnCheckResult {
  const isDetected = data.detected === true;
  return {
    isVpn: data.isVpn === true || isDetected,
    isProxy: data.isProxy === true,
    isTor: data.isTor === true,
    isHosting: data.isHosting === true,
    isAnonymousProxy: data.isAnonymousProxy === true,
    ip: data.ip || "",
    country: data.country || "",
    city: data.city || "",
    region: data.region || "",
    isp: data.isp || "",
    org: data.org || "",
    vpnProvider: data.vpnProvider || "",
    fraudScore: data.fraudScore || 0,
    detectionType: data.detectionType || data.detection_type || "unknown",
    rawResponse: data.rawResponse || null,
  };
}

async function getPublicIpFallback(): Promise<string> {
  try {
    const resp = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await resp.json();
    return data.ip || "";
  } catch {
    return "";
  }
}

function emptyResult(): VpnCheckResult {
  return {
    isVpn: false, isProxy: false, isTor: false, isHosting: false,
    isAnonymousProxy: false, ip: "", country: "", city: "", region: "",
    isp: "", org: "", vpnProvider: "", fraudScore: 0,
    detectionType: "none",
  };
}

// ── Detection Logging ──

export function logDetection(userId: string, username: string, result: VpnCheckResult) {
  try {
    const logs: VpnDetectionLog[] = JSON.parse(localStorage.getItem("coinloot_vpn_logs") || "[]");
    logs.unshift({
      id: `vpn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      username,
      ip: result.ip,
      country: result.country,
      city: result.city,
      isp: result.isp,
      org: result.org,
      detectionType: result.detectionType,
      vpnProvider: result.vpnProvider,
      fraudScore: result.fraudScore,
      rawResponse: result.rawResponse,
      detectedAt: new Date().toISOString(),
    });
    localStorage.setItem("coinloot_vpn_logs", JSON.stringify(logs.slice(0, 500)));

    // Also log to user_ip_logs
    logUserIp(userId, username, result);

    // Also log server-side
    fetch("/api/vpn/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, username, result }),
    }).catch(() => {});
  } catch { /* */ }
}

export function getDetectionHistory(): VpnDetectionLog[] {
  try {
    return JSON.parse(localStorage.getItem("coinloot_vpn_logs") || "[]").slice(0, 100);
  } catch { return []; }
}

export function getIpLogs(userId: string): VpnDetectionLog[] {
  try {
    return JSON.parse(localStorage.getItem("coinloot_vpn_logs") || "[]")
      .filter((l: VpnDetectionLog) => l.userId === userId).slice(0, 50);
  } catch { return []; }
}

export function clearDetectionLogs() {
  localStorage.setItem("coinloot_vpn_logs", "[]");
}

// ── Restriction Management ──

export function isUserRestricted(userId: string): {
  restricted: boolean;
  until: string | null;
  remaining: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  reason: string;
} {
  try {
    const restricted: { userId: string; restrictedUntil: string; reason: string }[] = JSON.parse(
      localStorage.getItem("coinloot_restricted_users") || "[]"
    );
    const entry = restricted.find((r) => r.userId === userId);
    if (!entry) {
      return { restricted: false, until: null, remaining: "", days: 0, hours: 0, minutes: 0, seconds: 0, reason: "" };
    }
    const now = Date.now();
    const until = new Date(entry.restrictedUntil).getTime();
    if (now >= until) {
      const updated = restricted.filter((r) => r.userId !== userId);
      localStorage.setItem("coinloot_restricted_users", JSON.stringify(updated));
      return { restricted: false, until: null, remaining: "", days: 0, hours: 0, minutes: 0, seconds: 0, reason: "" };
    }
    const diffMs = until - now;
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const remaining = `${days > 0 ? days + "d " : ""}${hours}h ${minutes}m ${seconds}s`;
    return { restricted: true, until: entry.restrictedUntil, remaining, days, hours, minutes, seconds, reason: entry.reason };
  } catch {
    return { restricted: false, until: null, remaining: "", days: 0, hours: 0, minutes: 0, seconds: 0, reason: "" };
  }
}

export function restrictUser(userId: string, durationMinutes: number, reason: string) {
  try {
    const restricted: { userId: string; restrictedUntil: string; reason: string }[] = JSON.parse(
      localStorage.getItem("coinloot_restricted_users") || "[]"
    );
    const existing = restricted.findIndex((r) => r.userId === userId);
    const entry = {
      userId,
      restrictedUntil: new Date(Date.now() + durationMinutes * 60000).toISOString(),
      reason,
    };
    if (existing >= 0) {
      restricted[existing] = entry;
    } else {
      restricted.push(entry);
    }
    localStorage.setItem("coinloot_restricted_users", JSON.stringify(restricted));
  } catch { /* */ }
}

export function unRestrictUser(userId: string) {
  try {
    const restricted = JSON.parse(localStorage.getItem("coinloot_restricted_users") || "[]");
    localStorage.setItem("coinloot_restricted_users", JSON.stringify(restricted.filter((r: any) => r.userId !== userId)));
  } catch { /* */ }
}

export function getRestrictedUsers(): { userId: string; restrictedUntil: string; reason: string }[] {
  try {
    const restricted = JSON.parse(localStorage.getItem("coinloot_restricted_users") || "[]");
    const now = Date.now();
    const active = restricted.filter((r: any) => new Date(r.restrictedUntil).getTime() > now);
    if (active.length !== restricted.length) {
      localStorage.setItem("coinloot_restricted_users", JSON.stringify(active));
    }
    return active;
  } catch { return []; }
}

export function extendRestriction(userId: string, additionalMinutes: number) {
  try {
    const restricted = JSON.parse(localStorage.getItem("coinloot_restricted_users") || "[]");
    const idx = restricted.findIndex((r: any) => r.userId === userId);
    if (idx === -1) return;
    const current = new Date(restricted[idx].restrictedUntil).getTime();
    const base = current > Date.now() ? current : Date.now();
    restricted[idx].restrictedUntil = new Date(base + additionalMinutes * 60000).toISOString();
    localStorage.setItem("coinloot_restricted_users", JSON.stringify(restricted));
  } catch { /* */ }
}

// ── Restriction History ──

export function logRestrictionHistory(entry: RestrictionHistoryEntry) {
  try {
    const history: RestrictionHistoryEntry[] = JSON.parse(localStorage.getItem("coinloot_restriction_history") || "[]");
    history.unshift(entry);
    localStorage.setItem("coinloot_restriction_history", JSON.stringify(history.slice(0, 200)));
  } catch { /* */ }
}

export function getRestrictionHistory(): RestrictionHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("coinloot_restriction_history") || "[]");
  } catch { return []; }
}
