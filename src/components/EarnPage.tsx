import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, DollarSign, Sparkles, ShieldCheck, Zap, Coins,
  Star, Lock, ArrowUpRight, Info,
  ChevronRight, Play, BarChart3, Flame,
  Crown, ClipboardCheck, Megaphone, Gift, Clock,
} from "lucide-react";
import { UserProfile, Offer } from "../types";
import { isUserRestricted } from "../utils/vpnDetector";
import { getProviderInfo, getProviderLogoUrl, getAllProviders } from "../utils/providerLogos";
import { isDeveloperMode } from "./DeveloperModeBanner";
import { getConnectedProviders, fetchOffersFromProvider } from "../utils/fetchOfferwallOffers";
import HorizontalScroll from "./HorizontalScroll";
import SurveyHub from "./SurveyHub";

interface EarnPageProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  onRewardEarned: (coins: number, sourceName: string, message?: string) => void;
  simulationCountry?: string;
}

interface LockRule {
  id: string;
  name: string;
  type: string;
  value: number;
}

interface AdminOffer {
  id: string;
  title: string;
  provider: string;
  payout: number;
  status: string;
  difficulty: string;
}

const SURVEY_PROVIDERS = ["CPX Research", "BitLabs"];

const OFFERWALL_PROVIDERS = [
  "TOROX", "AdGate Media", "AdGem", "Lootably",
  "Revenue Universe", "TimeWall", "Ayet Studios", "Kiwi Wall",
  "Monlix", "Wannads",
];

const FALLBACK_FEATURED: Offer[] = [
  { id: "ft-1", title: "TOROX Stellar Offerwall", description: "Browse high-paying offers from premium brands across the globe.", payout_coins: 5000, category: "trending", provider: "TOROX", imageUrl: "https://logo.clearbit.com/torox.com", difficulty: "Medium", link: "https://torox.com" },
  { id: "ft-2", title: "Revenue Universe Crypto Offer", description: "Register and verify accounts on leading crypto platforms.", payout_coins: 7200, category: "high-paying", provider: "Revenue Universe", imageUrl: "https://logo.clearbit.com/revenueuniverse.com", difficulty: "Hard", link: "https://revenueuniverse.com" },
  { id: "ft-3", title: "AdGate Galactic Rewards", description: "Try new apps, games, and services. Get rewarded for every action.", payout_coins: 3500, category: "trending", provider: "AdGate Media", imageUrl: "https://logo.clearbit.com/adgatemedia.com", difficulty: "Medium", link: "https://adgatemedia.com" },
  { id: "ft-4", title: "AdGem Cosmic Install", description: "Install and try new mobile apps. Earn coins per install and session.", payout_coins: 2500, category: "new", provider: "AdGem", imageUrl: "https://logo.clearbit.com/adgem.com", difficulty: "Easy", link: "https://adgem.com" },
  { id: "ft-5", title: "CPX Quantum Survey Matrix", description: "Answer advanced market research surveys on emerging technologies.", payout_coins: 1800, category: "trending", provider: "CPX Research", imageUrl: "https://logo.clearbit.com/cpxresearch.com", difficulty: "Medium", link: "https://cpxresearch.com" },
  { id: "ft-6", title: "BitLabs Protocol Survey", description: "Complete tech-oriented surveys and earn premium rewards.", payout_coins: 1200, category: "trending", provider: "BitLabs", imageUrl: "https://logo.clearbit.com/bitlabs.ai", difficulty: "Easy", link: "https://bitlabs.ai" },
];

const FALLBACK_HOT: Offer[] = [
  { id: "hot-1", title: "Lootably Nebula Tasks", description: "Complete micro-tasks and quick offers for instant coin rewards.", payout_coins: 800, category: "recommended", provider: "Lootably", imageUrl: "https://logo.clearbit.com/lootably.com", difficulty: "Easy", link: "https://lootably.com" },
  { id: "hot-2", title: "TimeWall Daily Videos", description: "Watch short videos and complete daily check-ins for coins.", payout_coins: 350, category: "new", provider: "TimeWall", imageUrl: "https://logo.clearbit.com/timewall.io", difficulty: "Easy", link: "https://timewall.io" },
  { id: "hot-3", title: "Ayet Studios App Install", description: "Download and play featured mobile games. Reach level milestones.", payout_coins: 1500, category: "recommended", provider: "Ayet Studios", imageUrl: "https://logo.clearbit.com/ayetstudios.com", difficulty: "Medium", link: "https://ayetstudios.com" },
  { id: "hot-4", title: "Kiwi Wall Offer Grid", description: "Browse the kiwi wall and complete simple offers for coins.", payout_coins: 1000, category: "recommended", provider: "Kiwi Wall", imageUrl: "https://logo.clearbit.com/kiwiwall.com", difficulty: "Easy", link: "https://kiwiwall.com" },
  { id: "hot-5", title: "Monlix Survey Panel", description: "Join Monlix's survey panel and earn coins for your opinions.", payout_coins: 2000, category: "recommended", provider: "Monlix", imageUrl: "https://logo.clearbit.com/monlix.com", difficulty: "Medium", link: "https://monlix.com" },
  { id: "hot-6", title: "Wannads Offer Exchange", description: "Complete Wannads offers from global advertisers. Instant credit.", payout_coins: 1600, category: "trending", provider: "Wannads", imageUrl: "https://logo.clearbit.com/wannads.com", difficulty: "Easy", link: "https://wannads.com" },
];

function loadAdminOffers(): AdminOffer[] {
  try {
    const saved = localStorage.getItem("coinloot_offers");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { }
  return [];
}

function loadLockRules(): LockRule[] {
  try {
    const saved = localStorage.getItem("coinloot_lock_rules");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { }
  return [];
}

function evaluateLockRules(user: UserProfile, rules: LockRule[]): { locked: boolean; reason: string } {
  for (const rule of rules) {
    if (rule.type === "coins_earned" && user.total_earned_coins < rule.value)
      return { locked: true, reason: `Earn ${rule.value.toLocaleString()} total coins to unlock` };
    if (rule.type === "level" && user.level < rule.value)
      return { locked: true, reason: `Reach Level ${rule.value} to unlock` };
    if (rule.type === "tasks_completed" && (user.total_earned_coins / 100) < rule.value)
      return { locked: true, reason: `Complete ${rule.value} tasks to unlock` };
  }
  return { locked: false, reason: "" };
}

export default function EarnPage({ user, setUser, onRewardEarned, simulationCountry }: EarnPageProps) {
  const [viewingOffer, setViewingOffer] = useState<Offer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiOffers, setApiOffers] = useState<Offer[]>([]);
  const restriction = isUserRestricted(user.id);
  const isRestricted = restriction.restricted;

  const [lockRules, setLockRules] = useState<LockRule[]>(() => loadLockRules());
  useEffect(() => { setLockRules(loadLockRules()); }, [user.balance_coins]);

  const lockEval = useMemo(() => evaluateLockRules(user, lockRules), [user, lockRules]);

  const allProviders = useMemo(() => getAllProviders(), []);

  const [adminOffers, setAdminOffers] = useState<AdminOffer[]>(() => loadAdminOffers());
  useEffect(() => { setAdminOffers(loadAdminOffers()); }, [user.balance_coins]);

  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("coinloot_homepage_sections");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { featured: true, hot: true, surveys: true, offerwalls: true };
  });
  useEffect(() => {
    const handler = () => {
      try {
        const saved = localStorage.getItem("coinloot_homepage_sections");
        if (saved) setVisibleSections(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Auto-fetch offers from connected offerwall providers
  useEffect(() => {
    const connectedProviders = getConnectedProviders();
    if (connectedProviders.length === 0) return;

    let cancelled = false;
    async function fetchAll() {
      const results = await Promise.allSettled(
        connectedProviders.map((p) => fetchOffersFromProvider(p, user.id))
      );
      if (cancelled) return;
      const all: Offer[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") all.push(...r.value);
      }
      setApiOffers(all);
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [user.id]);

  const adminLockStatusMap = useMemo(() => {
    const map = new Map<string, { locked: boolean; reason: string }>();
    adminOffers.forEach((ao) => {
      if (ao.status === "locked") {
        const evalResult = evaluateLockRules(user, lockRules);
        map.set(ao.id, evalResult.locked ? evalResult : { locked: true, reason: "Locked by admin" });
      } else if (ao.status === "inactive") {
        map.set(ao.id, { locked: true, reason: "Offer is currently inactive" });
      }
    });
    return map;
  }, [adminOffers, lockRules, user]);

  const lockedProviderMap = useMemo(() => {
    const map = new Map<string, { locked: boolean; reason: string }>();
    adminOffers.forEach((ao) => {
      if (ao.status === "locked" || ao.status === "inactive") {
        const existing = map.get(ao.provider);
        if (!existing || existing.locked) {
          const evalResult = ao.status === "locked" ? evaluateLockRules(user, lockRules) : { locked: true, reason: "Offer is currently inactive" };
          map.set(ao.provider, evalResult);
        }
      }
    });
    return map;
  }, [adminOffers, lockRules, user]);

  const getProviderOfferCount = (providerName: string) => {
    return adminOffers.filter((o) => o.provider === providerName && o.status === "active").length;
  };

  const getProviderAvgPayout = (providerName: string) => {
    const active = adminOffers.filter((o) => o.provider === providerName && o.status === "active");
    if (active.length === 0) return 0;
    return Math.round(active.reduce((sum, o) => sum + o.payout, 0) / active.length);
  };

  const handleLaunchProvider = (providerName: string) => {
    if (isDeveloperMode()) return;
    const provider = getProviderInfo(providerName);
    const domain = provider.domain || `${providerName.toLowerCase().replace(/\s+/g, "")}.com`;
    const url = `https://${domain}?userId=${user.id}&username=${user.username}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onRewardEarned(0, providerName, `Launched ${providerName} offerwall`);
  };

  const handleLaunchOffer = (offer: Offer) => {
    if (isDeveloperMode()) { alert("Offers are temporarily disabled — site under development."); return; }
    setViewingOffer(offer);
  };

  const completeOfferSimulator = (offer: Offer) => {
    setSubmitting(true);
    setTimeout(() => {
      const pay = offer.payout_coins;
      const progressXp = offer.difficulty === "Easy" ? 50 : offer.difficulty === "Medium" ? 150 : 350;
      const newXp = user.xp + progressXp;
      setUser({ ...user, xp: newXp, level: Math.floor(newXp / 1000) + 1 });
      onRewardEarned(pay, offer.provider, `Completed ${offer.title} from ${offer.provider}.`);
      setSubmitting(false);
      setViewingOffer(null);
    }, 1800);
  };

  const isProviderLocked = (providerName: string) => {
    const entry = lockedProviderMap.get(providerName);
    return entry?.locked || false;
  };

  const getLockReason = (providerName: string) => {
    const entry = lockedProviderMap.get(providerName);
    return entry?.reason || "";
  };

  const featuredOffers = useMemo(() => {
    const adminActive = adminOffers.filter((o) => o.status === "active");
    const fromAdmin = adminActive.length > 0
      ? adminActive.slice(0, 6).map((ao) => {
          const providerInfo = getProviderInfo(ao.provider);
          const img = getProviderLogoUrl(ao.provider);
          return {
            id: ao.id,
            title: ao.title,
            description: `Complete this offer on ${ao.provider} and earn coins.`,
            payout_coins: ao.payout,
            category: "trending" as const,
            provider: ao.provider,
            imageUrl: img,
            difficulty: ao.difficulty as "Easy" | "Medium" | "Hard",
            link: "#",
          };
        })
      : [];

    const fromApi = apiOffers.filter((o) => o.payout_coins >= 2000).slice(0, 4);

    const combined = [...fromApi, ...fromAdmin, ...FALLBACK_FEATURED];
    return combined.slice(0, 8);
  }, [adminOffers, apiOffers]);

  const hotOffers = useMemo(() => {
    const adminActive = adminOffers.filter((o) => o.status === "active" && o.payout >= 1500);
    const fromAdmin = adminActive.length > 0
      ? adminActive.slice(0, 6).map((ao) => {
          const providerInfo = getProviderInfo(ao.provider);
          const img = getProviderLogoUrl(ao.provider);
          return {
            id: ao.id + "-hot",
            title: ao.title,
            description: `Complete this offer on ${ao.provider} and earn coins.`,
            payout_coins: ao.payout,
            category: "recommended" as const,
            provider: ao.provider,
            imageUrl: img,
            difficulty: ao.difficulty as "Easy" | "Medium" | "Hard",
            link: "#",
          };
        })
      : [];

    const fromApi = apiOffers.filter((o) => o.payout_coins < 2000).slice(0, 4);

    const combined = [...fromApi, ...fromAdmin, ...FALLBACK_HOT];
    return combined.slice(0, 8);
  }, [adminOffers, apiOffers]);

  return (
    <section className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-8">
      {/* ═══════════════════ HOME BANNERS ═══════════════════ */}
      <HomeBanners user={user} />

      {/* ═══════════════════ FEATURED OFFERS ═══════════════════ */}
      {visibleSections.featured && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            Featured Offers
          </h2>
          <button className="text-[10px] text-cyan-400 font-mono hover:text-cyan-300 transition-all flex items-center gap-1 cursor-pointer">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <HorizontalScroll snap>
          {featuredOffers.map((offer) => {
            const providerInfo = getProviderInfo(offer.provider);
            const color = providerInfo.color || "from-cyan-500 to-blue-600";
            return (
              <div
                key={offer.id}
                className="snap-start shrink-0 w-[260px] sm:w-[280px] lg:w-[300px] group"
              >
                <div className="relative rounded-2xl bg-slate-950/60 border border-white/5 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)] transition-all duration-300 p-4 h-full flex flex-col backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/[0.03] to-purple-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/[0.15] transition-all" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                          <img
                            src={offer.imageUrl}
                            alt={offer.provider}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                          <div className={`w-full h-full rounded-lg bg-gradient-to-br ${color} flex items-center justify-center hidden`}>
                            <span className="text-xs font-bold text-white">{providerInfo.initials}</span>
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] font-mono text-slate-400">{offer.provider}</span>
                          <span className={`text-[10px] font-mono font-bold ${
                            offer.difficulty === "Easy" ? "text-emerald-400" : offer.difficulty === "Medium" ? "text-amber-400" : "text-rose-400"
                          }`}>{offer.difficulty}</span>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <span className="text-[8px] font-bold text-amber-400 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5" /> Featured
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">{offer.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed line-clamp-2">{offer.description}</p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-400">
                        <Coins className="w-3.5 h-3.5" />
                        {offer.payout_coins.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-auto pt-3">
                    {isRestricted ? (
                      <div className="w-full py-2 rounded-xl bg-slate-800/60 text-slate-500 text-[10px] font-semibold text-center border border-white/5 cursor-not-allowed flex items-center justify-center gap-1 min-h-[40px]">
                        <Lock className="w-3 h-3" /> Restricted
                      </div>
                    ) : (
                      <button
                        onClick={() => handleLaunchOffer(offer)}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-bold tracking-wide hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                      >
                        <Zap className="w-3 h-3" /> Launch Offer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </HorizontalScroll>
      </div>
      )}

      {/* ═══════════════════ HOT OFFERS ═══════════════════ */}
      {visibleSections.hot && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Hot Offers
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" /> Trending</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-amber-400" /> High Paying</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-purple-400" /> Recommended</span>
          </div>
        </div>
        <HorizontalScroll>
          {hotOffers.map((offer) => {
            const providerInfo = getProviderInfo(offer.provider);
            const color = providerInfo.color || "from-cyan-500 to-blue-600";
            return (
              <div
                key={offer.id}
                className="snap-start shrink-0 w-[240px] sm:w-[260px] lg:w-[280px] group"
              >
                <div className="relative rounded-2xl bg-slate-950/60 border border-white/5 hover:border-orange-400/30 hover:shadow-[0_0_30px_rgba(251,146,60,0.1)] transition-all duration-300 p-4 h-full flex flex-col backdrop-blur-xl">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/[0.03] to-pink-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />

                  <div className="relative z-10 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                      <img
                        src={offer.imageUrl}
                        alt={offer.provider}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                      <div className={`w-full h-full rounded-lg bg-gradient-to-br ${color} flex items-center justify-center hidden`}>
                        <span className="text-xs font-bold text-white">{providerInfo.initials}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors truncate">{offer.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{offer.provider}</p>
                    </div>
                  </div>

                  <div className="relative z-10 mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-sm font-bold font-mono text-white">{offer.payout_coins.toLocaleString()}</span>
                    </div>
                    <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      offer.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400" : offer.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                    }`}>{offer.difficulty}</span>
                  </div>

                  <div className="relative z-10 mt-auto pt-3">
                    {isRestricted ? (
                      <div className="w-full py-1.5 rounded-xl bg-slate-800/60 text-slate-500 text-[10px] font-semibold text-center border border-white/5 cursor-not-allowed flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Restricted
                      </div>
                    ) : (
                      <button
                        onClick={() => handleLaunchOffer(offer)}
                        className="w-full py-1.5 rounded-xl bg-slate-900 border border-white/5 text-slate-200 hover:bg-gradient-to-r hover:from-orange-500 hover:to-pink-600 hover:text-white hover:border-transparent text-[10px] font-bold tracking-wide transition-all cursor-pointer min-h-[36px]"
                      >
                        <Zap className="w-3 h-3 inline mr-1" /> Launch
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </HorizontalScroll>
      </div>
      )}

      {/* ═══════════════════ SURVEYS ═══════════════════ */}
      {visibleSections.surveys && (
        <div id="surveys-section">
          <SurveyHub user={user} setUser={setUser} onRewardEarned={onRewardEarned} simulationCountry={simulationCountry} />
        </div>
      )}

      {/* ═══════════════════ OFFERWALL PROVIDERS ═══════════════════ */}
      {visibleSections.offerwalls && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            Offerwall Providers
          </h2>
          <span className="text-[10px] font-mono text-slate-500">{OFFERWALL_PROVIDERS.length} providers</span>
        </div>
        <HorizontalScroll>
          {OFFERWALL_PROVIDERS.map((name) => {
            const provider = getProviderInfo(name);
            const logo = getProviderLogoUrl(name);
            const offerCount = getProviderOfferCount(name);
            const avgPayout = getProviderAvgPayout(name);
            const locked = isProviderLocked(name);
            const lockReason = getLockReason(name);

            return (
              <div
                key={name}
                className="snap-start shrink-0 w-[200px] sm:w-[220px] lg:w-[240px] group"
              >
                <div className={`relative rounded-2xl border transition-all duration-300 p-5 h-full flex flex-col items-center text-center ${
                  locked
                    ? "bg-slate-950/40 border-slate-700/30 opacity-60"
                    : "bg-slate-950/60 border-white/5 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.08)] backdrop-blur-xl"
                }`}>
                  {!locked && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/[0.03] to-purple-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}

                  {locked && (
                    <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-400 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col items-center flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center p-2 mb-3 overflow-hidden group-hover:scale-110 transition-transform duration-300">
                      <img
                        src={logo}
                        alt={name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                      <div className={`w-full h-full rounded-xl bg-gradient-to-br ${provider.color || "from-cyan-500 to-blue-600"} flex items-center justify-center ${logo ? "hidden" : ""}`}>
                        <span className="text-lg font-bold text-white">{provider.initials}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white">{name}</h3>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3 text-cyan-400" /> {offerCount || 3} Offers</span>
                    </div>

                    <span className={`mt-2 px-2 py-0.5 rounded-full text-[7px] font-mono font-bold ${
                      provider.category === "Main" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      provider.category === "Surveys" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                      provider.category === "Mobile" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                      "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                    }`}>{provider.category || "General"}</span>

                    {locked && lockReason && (
                      <div className="mt-2 px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10 w-full">
                        <p className="text-[7px] text-amber-300 font-mono">{lockReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 mt-3 w-full">
                    {locked || isRestricted ? (
                      <div className="w-full py-2 rounded-xl bg-slate-800/60 text-slate-500 text-[9px] font-semibold text-center border border-white/5 cursor-not-allowed flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> {isRestricted ? "Restricted" : "Locked"}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleLaunchProvider(name)}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[9px] font-bold tracking-wide hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 cursor-pointer group/btn"
                      >
                        Launch Now
                        <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </HorizontalScroll>
      </div>
      )}

      {/* ═══════════════════ LOCKED OFFERWALLS ═══════════════════ */}
      {visibleSections.offerwalls && adminOffers.filter((o) => o.status === "locked" || o.status === "inactive").length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              Locked Offerwalls
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-400 font-mono flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Premium
            </span>
          </div>
          <HorizontalScroll>
            {OFFERWALL_PROVIDERS.filter((name) => isProviderLocked(name)).map((name) => {
              const provider = getProviderInfo(name);
              const logo = getProviderLogoUrl(name);
              const lockReason = getLockReason(name);
              return (
                <div
                  key={name}
                  className="snap-start shrink-0 w-[220px] sm:w-[240px] lg:w-[260px] group"
                >
                  <div className="relative rounded-2xl border border-amber-500/10 bg-slate-950/30 backdrop-blur-sm p-5 h-full flex flex-col items-center text-center overflow-hidden">
                    <div className="absolute inset-0 bg-amber-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-400 flex items-center gap-1 z-10">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center p-2 mb-3 relative z-10">
                      <img
                        src={logo}
                        alt={name}
                        className="w-full h-full object-contain opacity-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                      <div className={`w-full h-full rounded-xl bg-gradient-to-br ${provider.color || "from-slate-500 to-slate-700"} flex items-center justify-center ${logo ? "hidden" : ""}`}>
                        <span className="text-sm font-bold text-slate-400">{provider.initials}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-400 relative z-10">{name}</h3>

                    <div className="mt-3 relative z-10 w-full">
                      {lockReason && (
                        <div className="px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Info className="w-3 h-3 text-amber-400" />
                            <span className="text-[7px] font-bold text-amber-400 font-mono uppercase tracking-wider">Unlock Requirement</span>
                          </div>
                          <p className="text-[8px] text-amber-300 font-mono">{lockReason}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 w-full py-2 rounded-xl bg-slate-800/60 text-slate-500 text-[9px] font-semibold text-center border border-white/5 cursor-not-allowed relative z-10">
                      <Lock className="w-3 h-3 inline mr-1" /> Unavailable
                    </div>
                  </div>
                </div>
              );
            })}
          </HorizontalScroll>
        </div>
      )}

      {/* ═══════════════════ OFFER DETAIL MODAL ═══════════════════ */}
      {viewingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-950 border border-white/10 rounded-3xl p-6 relative animate-zoom-in shadow-2xl">
            <button onClick={() => setViewingOffer(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold font-mono cursor-pointer">✕</button>

            <div className="flex items-center gap-4 pb-4 border-b border-white/5 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center p-1 overflow-hidden">
                <img src={viewingOffer.imageUrl || ""} alt={viewingOffer.provider} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div>
                <span className="px-2 py-0.5 text-[8px] uppercase tracking-wider font-mono rounded bg-cyan-400/10 text-cyan-300 font-bold border border-cyan-400/20">
                  {viewingOffer.provider}
                </span>
                <h2 className="font-sans font-bold text-lg text-white tracking-tight mt-1">{viewingOffer.title}</h2>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="block text-slate-500 uppercase font-mono text-[9px] mb-1">Details</span>
                <p className="text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-2xl border border-white/5">{viewingOffer.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5 text-center">
                  <span className="block text-slate-500 uppercase font-mono text-[9px]">Duration</span>
                  <span className="block text-xs font-semibold text-white mt-1">~10 min</span>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5 text-center">
                  <span className="block text-slate-500 uppercase font-mono text-[9px]">Difficulty</span>
                  <span className="block text-xs font-semibold text-cyan-400 mt-1">{viewingOffer.difficulty}</span>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/15 border border-cyan-500/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wide text-cyan-300 block">Reward</span>
                  <span className="text-base font-bold text-white block mt-0.5">{viewingOffer.payout_coins.toLocaleString()} Coins</span>
                </div>
              </div>

              <div className="flex gap-3">
                <a href={viewingOffer.link} target="_blank" rel="noreferrer" className="flex-1 py-3 text-center rounded-2xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-200 transition-all font-semibold text-xs cursor-pointer">Visit Offer</a>
                <button onClick={() => completeOfferSimulator(viewingOffer)} disabled={submitting} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:scale-[1.02] text-white transition-all font-bold text-xs shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                  {submitting ? <><Zap className="w-3.5 h-3.5 text-orange-400 animate-bounce" /> Verifying...</> : <><Play className="w-3.5 h-4" /> Complete Offer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ═══ HOME BANNERS — Admin-Controlled Announcements & Promo ═══
interface AnnouncementData {
  enabled: boolean;
  title: string;
  description: string;
  icon: string;
}

interface PromoData {
  enabled: boolean;
  code: string;
  description: string;
  expiresAt: string;
}

interface HomeBannerData {
  announcement1: AnnouncementData;
  announcement2: AnnouncementData;
  promo: PromoData;
}

const DEFAULT_ANNOUNCEMENTS: HomeBannerData = {
  announcement1: { enabled: true, title: "Welcome to CoinLoot", description: "Complete offers and earn real rewards. Start your earning journey today!", icon: "🚀" },
  announcement2: { enabled: false, title: "Double Coins Weekend", description: "Earn 2x coins on all surveys and offers this weekend only!", icon: "⚡" },
  promo: { enabled: true, code: "WELCOME50", description: "Use code WELCOME50 for 50 bonus coins on your first withdrawal!", expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() },
};

function loadAnnouncements(): HomeBannerData {
  try {
    const saved = localStorage.getItem("coinloot_homepage_announcements");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        announcement1: { ...DEFAULT_ANNOUNCEMENTS.announcement1, ...parsed.announcement1 },
        announcement2: { ...DEFAULT_ANNOUNCEMENTS.announcement2, ...parsed.announcement2 },
        promo: { ...DEFAULT_ANNOUNCEMENTS.promo, ...parsed.promo },
      };
    }
  } catch {}
  return DEFAULT_ANNOUNCEMENTS;
}

function PromoCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(Date.now());
  const expired = now >= new Date(expiresAt).getTime();
  const diff = Math.max(0, new Date(expiresAt).getTime() - now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex items-center gap-3">
      {expired ? (
        <span className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold font-mono">Expired</span>
      ) : (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
            {days > 0 && <span className="mr-1">{days}d</span>}
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}

function HomeBanners({ user }: { user: UserProfile }) {
  const [data, setData] = useState<HomeBannerData>(loadAnnouncements);

  useEffect(() => {
    const handler = () => setData(loadAnnouncements());
    window.addEventListener("storage", handler);
    const poll = setInterval(handler, 2000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(poll);
    };
  }, []);

  const { announcement1, announcement2, promo } = data;
  const cards: { key: string; element: React.ReactNode }[] = [];

  if (announcement1.enabled) {
    cards.push({
      key: "ann1",
      element: (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-white/5 p-5 h-full group hover:border-cyan-400/30 transition-all">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{announcement1.icon || "📢"}</span>
              <h3 className="text-sm font-bold text-white">{announcement1.title}</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed flex-1">{announcement1.description}</p>
          </div>
        </div>
      ),
    });
  }

  if (announcement2.enabled) {
    cards.push({
      key: "ann2",
      element: (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-purple-950/40 border border-white/5 p-5 h-full group hover:border-purple-400/30 transition-all">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{announcement2.icon || "📢"}</span>
              <h3 className="text-sm font-bold text-white">{announcement2.title}</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed flex-1">{announcement2.description}</p>
          </div>
        </div>
      ),
    });
  }

  if (promo.enabled) {
    const expired = Date.now() >= new Date(promo.expiresAt).getTime();
    cards.push({
      key: "promo",
      element: (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-amber-950/30 border border-white/5 p-5 h-full group hover:border-amber-400/30 transition-all">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <Gift className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Promo Code</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3 flex-1">{promo.description}</p>
            <div className="flex items-center gap-2 mb-3">
              <code className="px-3 py-1.5 rounded-lg bg-black/40 border border-amber-500/20 text-amber-300 text-xs font-mono font-bold tracking-wider select-all">
                {promo.code}
              </code>
            </div>
            <div className="flex items-center justify-between mt-auto">
              <PromoCountdown expiresAt={promo.expiresAt} />
              <button
                disabled={expired}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold font-mono tracking-wide transition-all cursor-pointer ${
                  expired
                    ? "bg-slate-800/60 text-slate-600 border border-slate-700/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-95"
                }`}
              >
                {expired ? "Expired" : "Redeem"}
              </button>
            </div>
          </div>
        </div>
      ),
    });
  }

  if (cards.length === 0) return null;

  const gridCols =
    cards.length === 1
      ? "grid-cols-1"
      : cards.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {cards.map((c) => (
        <div key={c.key}>{c.element}</div>
      ))}
    </div>
  );
}
