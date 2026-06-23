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

const LOCAL = (slug: string) => `/logos/${slug}.png`;

const DEFAULT_PROVIDERS: ProviderInfo[] = [
  { id: "prov-surveys-1", name: "CPX Research", slug: "cpxresearch", initials: "CP", color: "from-purple-500 to-pink-600", border: "border-purple-500/30", bgLight: "bg-purple-500/10", logoUrl: LOCAL("cpxresearch"), domain: "cpxresearch.com", category: "surveys", connected: true },
  { id: "prov-surveys-2", name: "BitLabs", slug: "bitlabs", initials: "BL", color: "from-indigo-500 to-violet-600", border: "border-indigo-500/30", bgLight: "bg-indigo-500/10", logoUrl: LOCAL("bitlabs"), domain: "bitlabs.ai", category: "surveys", connected: true },
  { id: "prov-main-1", name: "TOROX", slug: "torox", initials: "TX", color: "from-cyan-500 to-blue-600", border: "border-cyan-500/30", bgLight: "bg-cyan-500/10", logoUrl: "https://logo.clearbit.com/torox.com", domain: "torox.com", category: "main", connected: true },
  { id: "prov-main-2", name: "AdGate Media", slug: "adgatemedia", initials: "AG", color: "from-amber-500 to-orange-600", border: "border-amber-500/30", bgLight: "bg-amber-500/10", logoUrl: LOCAL("adgatemedia"), domain: "adgatemedia.com", category: "main", connected: true },
  { id: "prov-main-3", name: "AdGem", slug: "adgem", initials: "AG", color: "from-rose-500 to-red-600", border: "border-rose-500/30", bgLight: "bg-rose-500/10", logoUrl: LOCAL("adgem"), domain: "adgem.com", category: "main", connected: true },
  { id: "prov-main-4", name: "Lootably", slug: "lootably", initials: "LB", color: "from-emerald-500 to-teal-600", border: "border-emerald-500/30", bgLight: "bg-emerald-500/10", logoUrl: LOCAL("lootably"), domain: "lootably.com", category: "main", connected: true },
  { id: "prov-main-5", name: "TimeWall", slug: "timewall", initials: "TW", color: "from-fuchsia-500 to-pink-600", border: "border-fuchsia-500/30", bgLight: "bg-fuchsia-500/10", logoUrl: LOCAL("timewall"), domain: "timewall.io", category: "main", connected: true },
  { id: "prov-main-6", name: "Revenue Universe", slug: "revenueuniverse", initials: "RU", color: "from-sky-500 to-cyan-600", border: "border-sky-500/30", bgLight: "bg-sky-500/10", logoUrl: LOCAL("revenueuniverse"), domain: "revenueuniverse.com", category: "main", connected: true },
  { id: "prov-main-7", name: "GemiAd", slug: "gemiad", initials: "GA", color: "from-teal-500 to-cyan-600", border: "border-teal-500/30", bgLight: "bg-teal-500/10", logoUrl: LOCAL("gemiad"), domain: "gemiad.com", category: "main", connected: true },
  { id: "prov-main-8", name: "Offery", slug: "offery", initials: "OF", color: "from-violet-500 to-purple-600", border: "border-violet-500/30", bgLight: "bg-violet-500/10", logoUrl: "https://logo.clearbit.com/offery.io", domain: "offery.io", category: "main", connected: true },
  { id: "prov-main-9", name: "MyChips", slug: "mychips", initials: "MC", color: "from-yellow-500 to-amber-600", border: "border-yellow-500/30", bgLight: "bg-yellow-500/10", logoUrl: "https://logo.clearbit.com/mychips.com", domain: "mychips.com", category: "main", connected: true },
  { id: "prov-main-10", name: "Notik", slug: "notik", initials: "NT", color: "from-rose-500 to-pink-600", border: "border-rose-500/30", bgLight: "bg-rose-500/10", logoUrl: "https://logo.clearbit.com/notik.com", domain: "notik.com", category: "main", connected: true },
  { id: "prov-main-11", name: "Upwall", slug: "upwall", initials: "UP", color: "from-blue-500 to-indigo-600", border: "border-blue-500/30", bgLight: "bg-blue-500/10", logoUrl: "https://logo.clearbit.com/upwall.com", domain: "upwall.com", category: "main", connected: true },
  { id: "prov-main-12", name: "AdswedMedia", slug: "adswedmedia", initials: "AM", color: "from-green-500 to-emerald-600", border: "border-green-500/30", bgLight: "bg-green-500/10", logoUrl: LOCAL("adswedmedia"), domain: "adswedmedia.com", category: "main", connected: true },
  { id: "prov-main-13", name: "AdBreak Media", slug: "adbreakmedia", initials: "AB", color: "from-red-500 to-rose-600", border: "border-red-500/30", bgLight: "bg-red-500/10", logoUrl: "https://logo.clearbit.com/adbreakmedia.com", domain: "adbreakmedia.com", category: "main", connected: true },
  { id: "prov-main-14", name: "MobiVortex", slug: "mobivortex", initials: "MV", color: "from-cyan-500 to-sky-600", border: "border-cyan-500/30", bgLight: "bg-cyan-500/10", logoUrl: "https://logo.clearbit.com/mobivortex.com", domain: "mobivortex.com", category: "main", connected: true },
  { id: "prov-main-15", name: "PixyLabs", slug: "pixylabs", initials: "PL", color: "from-fuchsia-500 to-purple-600", border: "border-fuchsia-500/30", bgLight: "bg-fuchsia-500/10", logoUrl: LOCAL("pixylabs"), domain: "pixylabs.com", category: "main", connected: true },
  { id: "prov-main-16", name: "Klink Labs", slug: "klinklabs", initials: "KL", color: "from-lime-500 to-green-600", border: "border-lime-500/30", bgLight: "bg-lime-500/10", logoUrl: "https://logo.clearbit.com/klinklabs.com", domain: "klinklabs.com", category: "main", connected: true },
  { id: "prov-main-17", name: "PubScale", slug: "pubscale", initials: "PS", color: "from-orange-500 to-amber-600", border: "border-orange-500/30", bgLight: "bg-orange-500/10", logoUrl: LOCAL("pubscale"), domain: "pubscale.com", category: "main", connected: true },
  { id: "prov-main-18", name: "Reward Wall", slug: "rewardwall", initials: "RW", color: "from-pink-500 to-rose-600", border: "border-pink-500/30", bgLight: "bg-pink-500/10", logoUrl: "https://logo.clearbit.com/rewardwall.com", domain: "rewardwall.com", category: "main", connected: true },
  { id: "prov-main-19", name: "Tplayad", slug: "tplayad", initials: "TP", color: "from-indigo-500 to-blue-600", border: "border-indigo-500/30", bgLight: "bg-indigo-500/10", logoUrl: LOCAL("tplayad"), domain: "tplayad.com", category: "main", connected: true },
  { id: "prov-main-20", name: "RadientWall", slug: "radientwall", initials: "RW", color: "from-amber-500 to-yellow-600", border: "border-amber-500/30", bgLight: "bg-amber-500/10", logoUrl: LOCAL("radientwall"), domain: "radientwall.com", category: "main", connected: true },
  { id: "prov-mobile-1", name: "Ayet Studios", slug: "ayetstudios", initials: "AY", color: "from-teal-500 to-emerald-600", border: "border-teal-500/30", bgLight: "bg-teal-500/10", logoUrl: LOCAL("ayetstudios"), domain: "ayetstudios.com", category: "mobile", connected: false },
  { id: "prov-mobile-2", name: "Kiwi Wall", slug: "kiwiwall", initials: "KW", color: "from-lime-500 to-green-600", border: "border-lime-500/30", bgLight: "bg-lime-500/10", logoUrl: LOCAL("kiwiwall"), domain: "kiwiwall.com", category: "mobile", connected: false },
  { id: "prov-extra-1", name: "Monlix", slug: "monlix", initials: "MX", color: "from-orange-500 to-amber-600", border: "border-orange-500/30", bgLight: "bg-orange-500/10", logoUrl: LOCAL("monlix"), domain: "monlix.com", category: "extra", connected: false },
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

  const exact = all.find((p) => p.name === sourceName);
  if (exact) return exact;

  const lower = sourceName.toLowerCase();
  const partial = all.find((p) => lower.includes(p.name.toLowerCase()) || lower.includes(p.slug.toLowerCase()));
  if (partial) return partial;

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

const preloadedLogos = new Set<string>();

export function preloadLogo(url: string): void {
  if (!url || preloadedLogos.has(url)) return;
  preloadedLogos.add(url);
  const img = new Image();
  img.fetchPriority = "low";
  img.src = url;
}

export function preloadProviderLogos(): void {
  const providers = getAllProviders();
  providers.forEach((p) => {
    if (p.logoUrl) preloadLogo(p.logoUrl);
  });
}

export function isLogoPreloaded(url: string): boolean {
  return preloadedLogos.has(url);
}
