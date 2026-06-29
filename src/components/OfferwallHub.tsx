import { useState, useEffect, useMemo } from "react";
import {
  Search, TrendingUp, DollarSign, Sparkles, PlusCircle, Bookmark, CheckCircle2,
  HelpCircle, Zap, ShieldCheck, Cpu, ArrowUpRight, Lock, AlertTriangle, Coins,
  Trophy, Star, Gift, Unlock, Info, Clock,
} from "lucide-react";
import Loader from "./Loader";
import { UserProfile, Offer } from "../types";
import { isUserRestricted } from "../utils/vpnDetector";
import { isDeveloperMode } from "./DeveloperModeBanner";
import { getProviderInfo, getProviderLogoUrl, getProviderDomain, getAllProviders } from "../utils/providerLogos";
import { useAppRealtimeState } from "../hooks/useAppRealtimeState";
import { calcLevel } from "../utils/levelSystem";
import { isOfferwallUnlockedByCode, isOfferwallLockEnabled } from "../utils/lockedOfferwallDB";

interface OfferwallHubProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  onRewardEarned: (coins: number, sourceName: string, message?: string, xpGained?: number) => void;
  simulationCountry?: string;
}


interface AdminOffer {
  id: string;
  title: string;
  provider: string;
  payout: number;
  status: string;
  difficulty: string;
}

interface LockRule {
  id: string;
  name: string;
  type: string;
  value: number;
}



function mapAdminOfferToUser(admin: AdminOffer): Offer {
  const providerInfo = getProviderInfo(admin.provider);
  const desc = admin.provider || `Complete this offer to earn coins.`;
  const img = getProviderLogoUrl(admin.provider);
  const domain = getProviderDomain(admin.provider);
  return {
    id: admin.id,
    title: admin.title,
    description: desc,
    payout_coins: admin.payout,
    category: admin.status === "locked" ? "new" : "trending",
    provider: admin.provider as Offer["provider"],
    imageUrl: img,
    difficulty: admin.difficulty as "Easy" | "Medium" | "Hard",
    link: domain ? `https://${domain}` : "#",
  };
}

function evaluateLockRules(user: UserProfile, rules: LockRule[]): { locked: boolean; reason: string } {
  for (const rule of rules) {
    if (rule.type === "coins_earned" && user.total_earned_coins < rule.value) {
      return { locked: true, reason: `Earn ${rule.value.toLocaleString()} total coins to unlock` };
    }
    if (rule.type === "level" && calcLevel(user.balance_coins) < rule.value) {
      return { locked: true, reason: `Reach Level ${rule.value} to unlock` };
    }
    if (rule.type === "tasks_completed" && (user.total_earned_coins / 100) < rule.value) {
      return { locked: true, reason: `Complete ${rule.value} tasks to unlock` };
    }
  }
  return { locked: false, reason: "" };
}

// Hardcoded fallback offers when no admin offers exist
const FALLBACK_OFFERS: Offer[] = [
  { id: "fb-1", title: "CPX Quantum Survey Matrix", description: "Answer advanced market research surveys on emerging technologies.", payout_coins: 1800, category: "trending", provider: "CPX Research", imageUrl: "/logos/cpxresearch.png", difficulty: "Medium", link: "https://cpxresearch.com" },
  { id: "fb-2", title: "BitLabs Protocol Survey", description: "Complete tech-oriented surveys and earn premium rewards.", payout_coins: 1200, category: "trending", provider: "BitLabs", imageUrl: "/logos/bitlabs.png", difficulty: "Easy", link: "https://bitlabs.ai" },
  { id: "fb-3", title: "TOROX Stellar Offerwall", description: "Browse high-paying offers from premium brands across the globe.", payout_coins: 5000, category: "high-paying", provider: "TOROX", imageUrl: "/logos/torox.png", difficulty: "Medium", link: "https://torox.com" },
  { id: "fb-4", title: "AdGate Galactic Rewards", description: "Try new apps, games, and services. Get rewarded for every action.", payout_coins: 3500, category: "trending", provider: "AdGate Media", imageUrl: "/logos/adgatemedia.png", difficulty: "Medium", link: "https://adgatemedia.com" },
  { id: "fb-5", title: "AdGem Cosmic Install", description: "Install and try new mobile apps. Earn coins per install and session.", payout_coins: 2500, category: "new", provider: "AdGem", imageUrl: "/logos/adgem.png", difficulty: "Easy", link: "https://adgem.com" },
  { id: "fb-6", title: "Lootably Nebula Tasks", description: "Complete micro-tasks and quick offers for instant coin rewards.", payout_coins: 800, category: "new", provider: "Lootably", imageUrl: "/logos/lootably.png", difficulty: "Easy", link: "https://lootably.com" },
  { id: "fb-7", title: "TimeWall Daily Videos", description: "Watch short videos and complete daily check-ins for coins.", payout_coins: 350, category: "new", provider: "TimeWall", imageUrl: "/logos/timewall.png", difficulty: "Easy", link: "https://timewall.io" },
  { id: "fb-8", title: "Revenue Universe Crypto Offer", description: "Register and verify accounts on leading crypto platforms.", payout_coins: 7200, category: "high-paying", provider: "Revenue Universe", imageUrl: "/logos/revenueuniverse.png", difficulty: "Hard", link: "https://revenueuniverse.com" },
  { id: "fb-9", title: "Ayet Studios App Install", description: "Download and play featured mobile games. Reach level milestones.", payout_coins: 1500, category: "recommended", provider: "Ayet Studios", imageUrl: "/logos/ayetstudios.png", difficulty: "Medium", link: "https://ayetstudios.com" },
  { id: "fb-10", title: "Kiwi Wall Offer Grid", description: "Browse the kiwi wall and complete simple offers for coins.", payout_coins: 1000, category: "recommended", provider: "Kiwi Wall", imageUrl: "/logos/kiwiwall.png", difficulty: "Easy", link: "https://kiwiwall.com" },
  { id: "fb-11", title: "Monlix Survey Panel", description: "Join Monlix's survey panel and earn coins for your opinions.", payout_coins: 2000, category: "recommended", provider: "Monlix", imageUrl: "/logos/monlix.png", difficulty: "Medium", link: "https://monlix.com" },
  { id: "fb-12", title: "Wannads Offer Exchange", description: "Complete Wannads offers from global advertisers. Instant credit.", payout_coins: 1600, category: "trending", provider: "Wannads", imageUrl: "/logos/wannads.png", difficulty: "Easy", link: "https://wannads.com" },
];

export default function OfferwallHub({ user, setUser, onRewardEarned, simulationCountry }: OfferwallHubProps) {
  const { state } = useAppRealtimeState();
  const lockRules = state.lockRules;
  const adminOffers = state.offers;

  const [offers, setOffers] = useState<Offer[]>(() => {
    if (adminOffers.length > 0) {
      return adminOffers.map(mapAdminOfferToUser);
    }
    return FALLBACK_OFFERS;
  });

  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewingOffer, setViewingOffer] = useState<Offer | null>(null);
  const [submittingTestEarn, setSubmittingTestEarn] = useState(false);
  const restriction = isUserRestricted(user.id);
  const isRestricted = restriction.restricted;

  // Re-sync offers when context or user balance changes
  useEffect(() => {
    if (adminOffers.length > 0) {
      setOffers(adminOffers.map(mapAdminOfferToUser));
    }
  }, [adminOffers, user.balance_coins]);

  // AI recommendations state
  const [aiReasons, setAiReasons] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    async function loadAiAdvice() {
      setLoadingAi(true);
      try {
        const response = await fetch("/api/ai/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userProfile: user,
            availableOffers: offers.map(o => ({ id: o.id, title: o.title, category: o.category }))
          })
        });
        const data = await response.json();
        const mapping: Record<string, string> = {};
        if (data?.recommended) {
          data.recommended.forEach((item: any) => {
            mapping[item.id] = item.reason;
          });
        }
        setAiReasons(mapping);
      } catch (err) {
        console.warn("AI recommended endpoint fallback:", err);
      } finally {
        setLoadingAi(false);
      }
    }
    loadAiAdvice();
  }, [user.level]);

  // Compute lock status for each offer
  const lockStatusMap = useMemo(() => {
    const map = new Map<string, { locked: boolean; reason: string }>();
    if (adminOffers.length > 0) {
      adminOffers.forEach((ao: any) => {
        // Check per-offerwall lock enabled status
        if (!isOfferwallLockEnabled(ao.provider)) {
          map.set(ao.id, { locked: false, reason: "" });
          return;
        }
        // Check if user unlocked this provider via special unlock code
        if (isOfferwallUnlockedByCode(user.id, ao.provider)) {
          map.set(ao.id, { locked: false, reason: "" });
          return;
        }
        if (ao.status === "locked") {
          const evalResult = evaluateLockRules(user, lockRules);
          map.set(ao.id, evalResult.locked ? evalResult : { locked: true, reason: "Locked by admin" });
        } else if (ao.status === "inactive") {
          map.set(ao.id, { locked: true, reason: "Offer is currently inactive" });
        }
      });
    }
    return map;
  }, [adminOffers, lockRules, user]);

  // Handle simulate completion of offer
  const completeOfferSimulator = (offer: Offer) => {
    if (isDeveloperMode()) { alert("Offers are temporarily disabled — site under development."); return; }
    setSubmittingTestEarn(true);

    setTimeout(() => {
      const pay = offer.payout_coins;
      const progressXp = offer.difficulty === "Easy" ? 50 : offer.difficulty === "Medium" ? 150 : 350;
      const newXp = user.xp + progressXp;

      onRewardEarned(pay, offer.provider, `Completed ${offer.title} from ${offer.provider}.`, progressXp);
      setSubmittingTestEarn(false);
      setViewingOffer(null);
    }, 1800);
  };

  // Filters
  const filteredOffers = offers.filter((o) => {
    const matchSearch = o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProvider = selectedProvider === "All" || o.provider === selectedProvider;

    if (activeCategoryTab === "all") return matchSearch && matchProvider;
    if (activeCategoryTab === "ai") {
      return matchSearch && matchProvider && (aiReasons[o.id] !== undefined || o.category === "recommended");
    }
    return matchSearch && matchProvider && o.category === activeCategoryTab;
  });

  const providerNames = ["All", ...new Set(offers.map((o) => o.provider))];

  // Check if offer is admin-locked
  const isOfferLocked = (offer: Offer): { locked: boolean; reason: string } => {
    return lockStatusMap.get(offer.id) || { locked: false, reason: "" };
  };

  return (
    <section className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Smart Hub Banner */}
      <div className="glass rounded-3xl p-6 lg:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[90px] rounded-full pointer-events-none" />
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-[10px] uppercase font-mono bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 font-semibold rounded-full">
              Smart Offer Matrix
            </span>
            {loadingAi && <Loader size="xs" text="Syncing recommendations" />}
          </div>
          <h1 className="font-sans font-bold text-2.5xl lg:text-3.5xl text-white tracking-tight">
            The Galactic <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">Offerwall Hub</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            All 12 offerwall providers integrated dynamically. Search, filter, and complete any offer to earn instant coins!
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-white/5 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> VPN Guard: Active</span>
          <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-cyan-400" /> GemiAds API: Synchronized</span>
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-orange-400" /> Multiplier Pool: 1.5x Event Live</span>
        </div>
      </div>

      {/* Provider Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 select-none scrollbar-hide">
        {providerNames.map((prov) => (
          <button
            key={prov}
            onClick={() => setSelectedProvider(prov)}
            className={`px-4 py-2 rounded-xl text-xs font-medium tracking-wide whitespace-nowrap transition-all border ${
              selectedProvider === prov
                ? "bg-slate-900 border-cyan-400/20 text-cyan-400 shadow-[0_0_8px_rgba(62,184,255,0.06)]"
                : "border-white/5 bg-slate-950/20 text-slate-400 hover:text-white"
            }`}
          >
            {prov}
          </button>
        ))}
      </div>

      {/* Search & Category */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-2xl border border-white/5">
          {[
            { id: "all", label: "All Items", icon: TrendingUp },
            { id: "trending", label: "Trending", icon: TrendingUp },
            { id: "high-paying", label: "High Paying", icon: DollarSign },
            { id: "new", label: "New Offers", icon: PlusCircle },
            { id: "ai", label: "AI Picks", icon: Sparkles },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryTab(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeCategoryTab === cat.id
                    ? "bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 text-cyan-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search offers or category tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 hover:border-white/10 focus:border-cyan-500/20 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredOffers.map((offer) => {
          const aiAdvice = aiReasons[offer.id];
          const locked = isOfferLocked(offer);
          const providerInfo = getProviderInfo(offer.provider);
          const color = providerInfo.color || "from-cyan-500 to-blue-600";
          return (
            <div
              key={offer.id}
              className={`glass rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 group/card ${
                locked.locked ? "opacity-70 grayscale-[0.3]" : "hover:neon-border-cyan"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  {offer.imageUrl ? (
                    <img
                      src={offer.imageUrl}
                      alt={offer.provider}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-contain bg-slate-900 border border-white/5 p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center ${offer.imageUrl ? "hidden" : ""}`}>
                    <span className="text-lg font-bold text-white">{providerInfo.initials}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 text-[8px] font-mono font-bold uppercase rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                      {offer.provider}
                    </span>
                    <span className={`text-[8px] font-mono font-medium uppercase ${
                      offer.difficulty === "Easy" ? "text-emerald-400" : offer.difficulty === "Medium" ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {offer.difficulty}
                    </span>
                    {locked.locked && (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                        <Lock className="w-2 h-2" /> Locked
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-sans font-semibold text-sm text-white tracking-wide group-hover/card:text-cyan-400 transition-colors">
                  {offer.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-2.5 line-clamp-2">
                  {offer.description}
                </p>

                {locked.locked && locked.reason && (
                  <div className="mt-3 p-2 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-1.5">
                    <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[9px] font-mono text-amber-300 leading-snug">
                      {locked.reason}
                    </span>
                  </div>
                )}

                {aiAdvice && !locked.locked && (
                  <div className="mt-3 p-2 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-[9px] font-mono text-cyan-300 leading-snug">
                      AI tip: {aiAdvice}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="block text-[9px] font-mono text-slate-500 uppercase leading-none">payout</span>
                  <span className="text-sm font-sans font-bold text-white tracking-tight flex items-center gap-1 mt-1">
                    {offer.payout_coins.toLocaleString()}
                    <span className="text-[10px] text-cyan-400 font-mono font-normal">coins</span>
                  </span>
                </div>

                {locked.locked || isRestricted ? (
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/60 text-slate-500 text-xs font-semibold flex items-center gap-1.5 border border-white/5 cursor-not-allowed">
                    {isRestricted ? <Clock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{isRestricted ? "Restricted" : "Locked"}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setViewingOffer(offer)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-300 group-hover/card:bg-gradient-to-r group-hover/card:from-cyan-500 group-hover/card:to-purple-600 group-hover/card:text-white transition-all text-xs font-semibold tracking-wide flex items-center gap-1 border border-white/5 cursor-pointer"
                  >
                    <span>Launch</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredOffers.length === 0 && (
          <div className="col-span-1 md:col-span-4 py-16 text-center">
            <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No offers matched</h3>
            <p className="text-slate-500 text-xs mt-1">Try resetting filters or search terms.</p>
          </div>
        )}
      </div>

      {/* Offer Detail Modal */}
      {viewingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-950 border border-white/10 rounded-3xl p-6 relative animate-zoom-in shadow-2xl">
            <button
              onClick={() => setViewingOffer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold font-mono cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 pb-4 border-b border-white/5 mb-4">
              {viewingOffer.imageUrl ? (
                <img
                  src={viewingOffer.imageUrl}
                  alt={viewingOffer.provider}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-contain bg-slate-900 border border-white/5 p-1"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : null}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getProviderInfo(viewingOffer.provider).color || "from-cyan-500 to-blue-600"} flex items-center justify-center ${viewingOffer.imageUrl ? "hidden" : ""}`}>
                <span className="text-xl font-bold text-white">{getProviderInfo(viewingOffer.provider).initials}</span>
              </div>
              <div>
                <span className="px-2 py-0.5 text-[8px] uppercase tracking-wider font-mono rounded bg-cyan-400/10 text-cyan-300 font-bold border border-cyan-400/20">
                  {viewingOffer.provider}
                </span>
                <h2 className="font-sans font-bold text-lg text-white tracking-tight mt-1">
                  {viewingOffer.title}
                </h2>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="block text-slate-500 uppercase font-mono text-[9px] mb-1">Details</span>
                <p className="text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                  {viewingOffer.description}
                </p>
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
                  <span className="text-base font-bold text-white block mt-0.5">
                    {viewingOffer.payout_coins.toLocaleString()} Coins (~${(viewingOffer.payout_coins / 1000).toFixed(2)} USD)
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={viewingOffer.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 text-center rounded-2xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-200 transition-all font-semibold font-sans tracking-wide text-xs"
                >
                  Visit Offer
                </a>

                <button
                  onClick={() => completeOfferSimulator(viewingOffer)}
                  disabled={submittingTestEarn}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:scale-[1.02] text-white transition-all font-sans font-bold tracking-wide text-xs shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingTestEarn ? (
                    <>
                      <Loader size="xs" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-4 text-emerald-400" />
                      <span>Complete Offer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
