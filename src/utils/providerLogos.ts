export interface ProviderInfo {
  id: string;
  name: string;
  slug: string;
  initials: string;
  color: string;
  border: string;
  bgLight: string;
  logoUrl: string;
  domain: string;
  category: string;
  connected: boolean;
}

const DEFAULT_PROVIDERS: ProviderInfo[] = [
  // ── SURVEYS ──
  { id: "prov-surveys-1", name: "CPX Research", slug: "cpx-research", initials: "CP", color: "from-purple-500 to-pink-600", border: "border-purple-500/30", bgLight: "bg-purple-500/10", logoUrl: "https://logo.clearbit.com/cpxresearch.com", domain: "cpxresearch.com", category: "surveys", connected: true },
  { id: "prov-surveys-2", name: "BitLabs", slug: "bitlabs", initials: "BL", color: "from-indigo-500 to-violet-600", border: "border-indigo-500/30", bgLight: "bg-indigo-500/10", logoUrl: "https://logo.clearbit.com/bitlabs.ai", domain: "bitlabs.ai", category: "surveys", connected: true },
  // ── MAIN OFFERWALLS ──
  { id: "prov-main-1", name: "TOROX", slug: "torox", initials: "TX", color: "from-cyan-500 to-blue-600", border: "border-cyan-500/30", bgLight: "bg-cyan-500/10", logoUrl: "https://logo.clearbit.com/torox.com", domain: "torox.com", category: "main", connected: true },
  { id: "prov-main-2", name: "AdGate Media", slug: "adgate-media", initials: "AG", color: "from-amber-500 to-orange-600", border: "border-amber-500/30", bgLight: "bg-amber-500/10", logoUrl: "https://logo.clearbit.com/adgatemedia.com", domain: "adgatemedia.com", category: "main", connected: true },
  { id: "prov-main-3", name: "AdGem", slug: "adgem", initials: "AG", color: "from-rose-500 to-red-600", border: "border-rose-500/30", bgLight: "bg-rose-500/10", logoUrl: "https://logo.clearbit.com/adgem.com", domain: "adgem.com", category: "main", connected: true },
  { id: "prov-main-4", name: "Lootably", slug: "lootably", initials: "LB", color: "from-emerald-500 to-teal-600", border: "border-emerald-500/30", bgLight: "bg-emerald-500/10", logoUrl: "https://logo.clearbit.com/lootably.com", domain: "lootably.com", category: "main", connected: true },
  { id: "prov-main-5", name: "TimeWall", slug: "timewall", initials: "TW", color: "from-fuchsia-500 to-pink-600", border: "border-fuchsia-500/30", bgLight: "bg-fuchsia-500/10", logoUrl: "https://logo.clearbit.com/timewall.io", domain: "timewall.io", category: "main", connected: true },
  { id: "prov-main-6", name: "Revenue Universe", slug: "revenue-universe", initials: "RU", color: "from-sky-500 to-cyan-600", border: "border-sky-500/30", bgLight: "bg-sky-500/10", logoUrl: "https://logo.clearbit.com/revenueuniverse.com", domain: "revenueuniverse.com", category: "main", connected: true },
  // ── MOBILE / APP INSTALL ──
  { id: "prov-mobile-1", name: "Ayet Studios", slug: "ayet-studios", initials: "AY", color: "from-teal-500 to-emerald-600", border: "border-teal-500/30", bgLight: "bg-teal-500/10", logoUrl: "https://logo.clearbit.com/ayetstudios.com", domain: "ayetstudios.com", category: "mobile", connected: false },
  { id: "prov-mobile-2", name: "Kiwi Wall", slug: "kiwi-wall", initials: "KW", color: "from-lime-500 to-green-600", border: "border-lime-500/30", bgLight: "bg-lime-500/10", logoUrl: "https://logo.clearbit.com/kiwiwall.com", domain: "kiwiwall.com", category: "mobile", connected: false },
  // ── EXTRA ──
  { id: "prov-extra-1", name: "Monlix", slug: "monlix", initials: "MX", color: "from-orange-500 to-amber-600", border: "border-orange-500/30", bgLight: "bg-orange-500/10", logoUrl: "https://logo.clearbit.com/monlix.com", domain: "monlix.com", category: "extra", connected: false },
  { id: "prov-extra-2", name: "Wannads", slug: "wannads", initials: "WN", color: "from-pink-500 to-rose-600", border: "border-pink-500/30", bgLight: "bg-pink-500/10", logoUrl: "https://logo.clearbit.com/wannads.com", domain: "wannads.com", category: "extra", connected: false },
];

const FALLBACK_LOGO_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%231e293b'/%3E%3Ccircle cx='32' cy='28' r='10' fill='%2306b6d4'/%3E%3Cpath d='M22 48c0-5.523 4.477-10 10-10s10 4.477 10 10' stroke='%2306b6d4' stroke-width='3' fill='none'/%3E%3Crect x='26' y='38' width='12' height='4' rx='2' fill='%236366f1'/%3E%3Cpath d='M28 44h8l-4 6z' fill='%23a78bfa'/%3E%3C/svg%3E";

const FALLBACK: ProviderInfo = {
  id: "fallback", name: "System", slug: "system", initials: "SY", color: "from-slate-500 to-slate-600", border: "border-slate-500/30", bgLight: "bg-slate-500/10", logoUrl: FALLBACK_LOGO_SVG, domain: "", category: "main", connected: false,
};

export function getDefaultProviders(): ProviderInfo[] {
  return DEFAULT_PROVIDERS;
}

function loadStoredProviders(): ProviderInfo[] {
  try {
    const raw = localStorage.getItem("coinloot_offerwall_providers");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => ({
          id: p.id || `prov-${p.name?.toLowerCase().replace(/\s+/g, "-")}`,
          name: p.name || p.slug || "Unknown",
          slug: p.slug || p.name?.toLowerCase().replace(/\s+/g, "-") || "unknown",
          initials: p.initials || p.name?.substring(0, 2).toUpperCase() || "UN",
          color: p.color || "from-slate-500 to-slate-600",
          border: p.border || "border-slate-500/30",
          bgLight: p.bgLight || "bg-slate-500/10",
          logoUrl: p.logoUrl || "",
          domain: p.domain || "",
          category: p.category || "main",
          connected: p.connected !== undefined ? p.connected : p.status === "active",
        }));
      }
    }
  } catch { /* */ }
  return [];
}

export function getAllProviders(): ProviderInfo[] {
  const stored = loadStoredProviders();
  if (stored.length > 0) return stored;
  return DEFAULT_PROVIDERS;
}

export function getProviderInfo(sourceName: string): ProviderInfo {
  const all = getAllProviders();

  // Exact match
  const exact = all.find((p) => p.name === sourceName);
  if (exact) return exact;

  // Partial match
  const lower = sourceName.toLowerCase();
  const partial = all.find((p) => lower.includes(p.name.toLowerCase()) || lower.includes(p.slug.toLowerCase()));
  if (partial) return partial;

  // First word match
  const firstWord = sourceName.split(/\s+/)[0].toLowerCase();
  const byWord = all.find((p) => p.name.toLowerCase().startsWith(firstWord) || p.slug.toLowerCase().startsWith(firstWord));
  if (byWord) return byWord;

  return FALLBACK;
}

export function getProviderLogoUrl(providerName: string): string {
  const info = getProviderInfo(providerName);
  if (info.logoUrl) return info.logoUrl;
  if (info.domain) return `https://logo.clearbit.com/${info.domain}`;
  return FALLBACK_LOGO_SVG;
}

export function getProviderDomain(providerName: string): string {
  const info = getProviderInfo(providerName);
  return info.domain || "";
}

// ─── Logo Preload & Cache System ────────────────────────────────────────────

const preloadedLogos = new Set<string>();

/**
 * Preload a single logo URL using the browser's Image API.
 * Already-preloaded URLs are skipped to avoid duplicate requests.
 */
export function preloadLogo(url: string): void {
  if (!url || preloadedLogos.has(url)) return;
  preloadedLogos.add(url);
  const img = new Image();
  img.fetchPriority = "low";
  img.src = url;
}

/**
 * Preload all provider logos in the background.
 * Call once on app startup to warm the browser cache.
 */
export function preloadProviderLogos(): void {
  const providers = getAllProviders();
  providers.forEach((p) => {
    if (p.logoUrl) preloadLogo(p.logoUrl);
  });
}

/**
 * Returns true if a logo URL has been preloaded (or is being preloaded).
 */
export function isLogoPreloaded(url: string): boolean {
  return preloadedLogos.has(url);
}
