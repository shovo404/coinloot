import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck, Zap, Coins,
  Star, Lock, ArrowUpRight, Info,
  Play, BarChart3, Flame,
  Crown, Megaphone, Gift, Clock, Copy, CheckCircle, Flag, Upload, ExternalLink,
} from "lucide-react";
import Loader from "./Loader";
import { UserProfile, Offer } from "../types";
import { isUserRestricted, checkVpnStatus, getVpnSettings, logDetection } from "../utils/vpnDetector";
import { getActiveCampaigns, getCampaignWithTasks, getUserCampaignSubmissions, submitCampaign } from "../lib/supabaseService";
import { getProviderInfo, getProviderLogoUrl, getAllProviders } from "../utils/providerLogos";
import OfferwallCard from "./OfferwallCard";
import { isDeveloperMode } from "./DeveloperModeBanner";
import { getConnectedProviders, fetchOffersFromProvider } from "../utils/fetchOfferwallOffers";
import { playCoinSound } from "../utils/coinSound";
import HorizontalScroll from "./HorizontalScroll";
import SurveyHub from "./SurveyHub";
import VpnBlockPopup from "./VpnBlockPopup";
import { getLockedOfferwallConfigs, isOfferwallUnlocked } from "../utils/lockedOfferwallDB";
import LockedOfferwallCard from "./LockedOfferwallCard";
import OfferDetailsModal from "./OfferDetailsModal";
import { useAppRealtimeState } from "../hooks/useAppRealtimeState";
import { calcLevel } from "../utils/levelSystem";

interface EarnPageProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  onRewardEarned: (coins: number, sourceName: string, message?: string, xpGained?: number) => void;
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
  { id: "ft-1", title: "TOROX Stellar Offerwall", description: "Browse high-paying offers from premium brands across the globe.", payout_coins: 5000, category: "trending", provider: "TOROX", imageUrl: "/logos/torox.png", difficulty: "Medium", link: "https://torox.com" },
  { id: "ft-2", title: "Revenue Universe Crypto Offer", description: "Register and verify accounts on leading crypto platforms.", payout_coins: 7200, category: "high-paying", provider: "Revenue Universe", imageUrl: "/logos/revenueuniverse.png", difficulty: "Hard", link: "https://revenueuniverse.com" },
  { id: "ft-3", title: "AdGate Galactic Rewards", description: "Try new apps, games, and services. Get rewarded for every action.", payout_coins: 3500, category: "trending", provider: "AdGate Media", imageUrl: "/logos/adgatemedia.png", difficulty: "Medium", link: "https://adgatemedia.com" },
  { id: "ft-4", title: "AdGem Cosmic Install", description: "Install and try new mobile apps. Earn coins per install and session.", payout_coins: 2500, category: "new", provider: "AdGem", imageUrl: "/logos/adgem.png", difficulty: "Easy", link: "https://adgem.com" },
  { id: "ft-5", title: "CPX Quantum Survey Matrix", description: "Answer advanced market research surveys on emerging technologies.", payout_coins: 1800, category: "trending", provider: "CPX Research", imageUrl: "/logos/cpxresearch.png", difficulty: "Medium", link: "https://cpxresearch.com" },
  { id: "ft-6", title: "BitLabs Protocol Survey", description: "Complete tech-oriented surveys and earn premium rewards.", payout_coins: 1200, category: "trending", provider: "BitLabs", imageUrl: "/logos/bitlabs.png", difficulty: "Easy", link: "https://bitlabs.ai" },
];

const FALLBACK_HOT: Offer[] = [
  { id: "hot-1", title: "Lootably Nebula Tasks", description: "Complete micro-tasks and quick offers for instant coin rewards.", payout_coins: 800, category: "recommended", provider: "Lootably", imageUrl: "/logos/lootably.png", difficulty: "Easy", link: "https://lootably.com" },
  { id: "hot-2", title: "TimeWall Daily Videos", description: "Watch short videos and complete daily check-ins for coins.", payout_coins: 350, category: "new", provider: "TimeWall", imageUrl: "/logos/timewall.png", difficulty: "Easy", link: "https://timewall.io" },
  { id: "hot-3", title: "Ayet Studios App Install", description: "Download and play featured mobile games. Reach level milestones.", payout_coins: 1500, category: "recommended", provider: "Ayet Studios", imageUrl: "/logos/ayetstudios.png", difficulty: "Medium", link: "https://ayetstudios.com" },
  { id: "hot-4", title: "Kiwi Wall Offer Grid", description: "Browse the kiwi wall and complete simple offers for coins.", payout_coins: 1000, category: "recommended", provider: "Kiwi Wall", imageUrl: "/logos/kiwiwall.png", difficulty: "Easy", link: "https://kiwiwall.com" },
  { id: "hot-5", title: "Monlix Survey Panel", description: "Join Monlix's survey panel and earn coins for your opinions.", payout_coins: 2000, category: "recommended", provider: "Monlix", imageUrl: "/logos/monlix.png", difficulty: "Medium", link: "https://monlix.com" },
  { id: "hot-6", title: "Wannads Offer Exchange", description: "Complete Wannads offers from global advertisers. Instant credit.", payout_coins: 1600, category: "trending", provider: "Wannads", imageUrl: "/logos/wannads.png", difficulty: "Easy", link: "https://wannads.com" },
];

function evaluateLockRules(user: UserProfile, rules: LockRule[]): { locked: boolean; reason: string } {
  for (const rule of rules) {
    if (rule.type === "coins_earned" && user.total_earned_coins < rule.value)
      return { locked: true, reason: `Earn ${rule.value.toLocaleString()} total coins to unlock` };
    if (rule.type === "level" && calcLevel(user.balance_coins) < rule.value)
      return { locked: true, reason: `Reach Level ${rule.value} to unlock` };
    if (rule.type === "tasks_completed" && (user.total_earned_coins / 100) < rule.value)
      return { locked: true, reason: `Complete ${rule.value} tasks to unlock` };
  }
  return { locked: false, reason: "" };
}

export default function EarnPage({ user, setUser, onRewardEarned, simulationCountry }: EarnPageProps) {
  const { state } = useAppRealtimeState();
  const lockRules = state.lockRules;
  const visibleSections = state.homepageSections;
  const globalPromo = state.globalPromo;
  const adminOffers = state.offers;
  const announcements = state.announcements;
  const promoCodes = state.promoCodes;

  const [viewingOffer, setViewingOffer] = useState<Offer | null>(null);
  const [viewingOfferDetails, setViewingOfferDetails] = useState<Offer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiOffers, setApiOffers] = useState<Offer[]>([]);
  const [vpnBlockedOfferwall, setVpnBlockedOfferwall] = useState(false);
  const [vpnCheckingOffer, setVpnCheckingOffer] = useState(false);
  const restriction = isUserRestricted(user.id);
  const isRestricted = restriction.restricted;

  const lockEval = useMemo(() => evaluateLockRules(user, lockRules), [user, lockRules]);

  const allProviders = useMemo(() => getAllProviders(), []);

  const [lockedUnlockTick, setLockedUnlockTick] = useState(0);
  const lockedConfigs = useMemo(() => {
    return getLockedOfferwallConfigs().filter(
      (c) => c.isLocked && !isOfferwallUnlocked(user.id, c.providerName)
    );
  }, [user.id, user.total_earned_coins, lockedUnlockTick]);

  const [socialCampaigns, setSocialCampaigns] = useState<any[]>([]);
  const [campaignSubmissions, setCampaignSubmissions] = useState<Record<string, any[]>>({});
  const [campaignModal, setCampaignModal] = useState<any>(null);
  const [campaignModalTasks, setCampaignModalTasks] = useState<any[]>([]);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  useEffect(() => {
    getActiveCampaigns().then(setSocialCampaigns);
  }, []);

  const handleLockedUnlocked = (providerName: string) => {
    setLockedUnlockTick((t) => t + 1);
  };

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

  const handleLaunchOffer = async (offer: Offer) => {
    if (isDeveloperMode()) { alert("Offers are temporarily disabled — site under development."); return; }

    // ── KYC Check ──
    if (user.kyc_required && user.kyc_status !== "APPROVED") {
      alert("KYC verification is required before completing offers. Please complete KYC verification first.");
      return;
    }

    // ── Offerwall VPN Protection (skip for admins) ──
    if (user.role !== 'admin') {
      const settings = getVpnSettings();
      if (settings.offerwallBlock) {
        setVpnCheckingOffer(true);
        try {
          const vpnResult = await checkVpnStatus();
          logDetection(user.id, user.username, vpnResult);
          if (vpnResult.isVpn || vpnResult.isProxy || vpnResult.isTor || vpnResult.isHosting) {
            setVpnBlockedOfferwall(true);
            setVpnCheckingOffer(false);
            return;
          }
        } catch { /* allow through */ }
        setVpnCheckingOffer(false);
      }
    }

    setViewingOffer(offer);
  };

  const completeOfferSimulator = (offer: Offer) => {
    // ── KYC Check ──
    if (user.kyc_required && user.kyc_status !== "APPROVED") {
      alert("KYC verification is required before completing offers. Please complete KYC verification first.");
      setSubmitting(false);
      return;
    }
    setTimeout(() => {
      const pay = offer.payout_coins;
      const progressXp = offer.difficulty === "Easy" ? 50 : offer.difficulty === "Medium" ? 150 : 350;
      playCoinSound();
      onRewardEarned(pay, offer.provider, `Completed ${offer.title} from ${offer.provider}.`, progressXp);
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
          const img = ao.imageUrl || getProviderLogoUrl(ao.provider);
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
          const img = ao.imageUrl || getProviderLogoUrl(ao.provider);
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

  // ── Social Bounty Campaigns ──
  const openCampaignModal = async (campaign: any) => {
    const data = await getCampaignWithTasks(campaign.id);
    if (!data) return;
    setCampaignModal(data);
    setCampaignModalTasks(data.tasks || []);
    const subs = await getUserCampaignSubmissions(user.id, campaign.id);
    setCampaignSubmissions(prev => ({ ...prev, [campaign.id]: subs }));
  };

  const handleCampaignSubmit = async (screenshotUrls: string[]) => {
    if (!campaignModal) return;
    setSubmittingCampaign(true);
    try {
      await submitCampaign(campaignModal.id, user.id, screenshotUrls);
      const subs = await getUserCampaignSubmissions(user.id, campaignModal.id);
      setCampaignSubmissions(prev => ({ ...prev, [campaignModal.id]: subs }));
      setCampaignModal(null);
      setCampaignModalTasks([]);
      alert("Campaign submitted for review!");
    } catch (e: any) {
      alert(e.message || "Failed to submit campaign");
    }
    setSubmittingCampaign(false);
  };

  return (
    <section className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-8">
      {/* ═══════════════════ NOTIFICATIONS ═══════════════════ */}
      <NotificationCards user={user} setUser={setUser} onRewardEarned={onRewardEarned} globalPromo={globalPromo} />

      {/* ═══════════════════ ANNOUNCEMENTS & PROMO CODES ═══════════════════ */}
      <AnnouncementPromoSection announcements={announcements} promoCodes={promoCodes} user={user} setUser={setUser} onRewardEarned={onRewardEarned} visibleSections={visibleSections} />

      {/* ═══════════════════ FEATURED OFFERS ═══════════════════ */}
      {visibleSections.featured && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            Featured Offers
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          {featuredOffers.map((offer) => {
            const providerInfo = getProviderInfo(offer.provider);
            const color = providerInfo.color || "from-cyan-500 to-blue-600";
            return (
              <div key={offer.id} className="group relative rounded-xl bg-slate-950/60 border border-white/5 hover:border-cyan-400/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all duration-300 overflow-hidden">
                {/* Image */}
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                      const fallback = img.nextElementSibling;
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} flex items-center justify-center hidden`}>
                    <span className="text-lg font-bold text-white/80">{providerInfo.initials}</span>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/5">
                    <span className="text-[8px] font-bold text-cyan-300 flex items-center gap-0.5">
                      <Coins className="w-2 h-2" /> {offer.payout_coins.toLocaleString()}
                    </span>
                  </div>
                </div>
                {/* Content */}
                <div className="p-2.5 space-y-1.5">
                  <h3 className="text-[11px] font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight line-clamp-2">{offer.title}</h3>
                  <p className="text-[8px] text-slate-500 leading-snug line-clamp-1">{offer.description}</p>
                  {isRestricted ? (
                    <div className="w-full py-1 rounded-lg bg-slate-800/60 text-slate-500 text-[8px] font-semibold text-center border border-white/5 cursor-not-allowed flex items-center justify-center gap-1">
                      <Lock className="w-2 h-2" /> Restricted
                    </div>
                  ) : (
                    <button onClick={() => setViewingOfferDetails(offer)} className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[8px] font-bold tracking-wide hover:scale-[1.02] transition-all cursor-pointer">
                      View Offer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* ═══════════════════ HOT OFFERS ═══════════════════ */}
      {visibleSections.hot && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Hot Offers
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          {hotOffers.map((offer) => {
            const providerInfo = getProviderInfo(offer.provider);
            const color = providerInfo.color || "from-cyan-500 to-blue-600";
            return (
              <div key={offer.id} className="group relative rounded-xl bg-slate-950/60 border border-white/5 hover:border-orange-400/30 hover:shadow-[0_0_20px_rgba(251,146,60,0.08)] transition-all duration-300 overflow-hidden">
                {/* Image */}
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                      const fallback = img.nextElementSibling;
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} flex items-center justify-center hidden`}>
                    <span className="text-lg font-bold text-white/80">{providerInfo.initials}</span>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/5">
                    <span className="text-[8px] font-bold text-orange-300 flex items-center gap-0.5">
                      <Coins className="w-2 h-2" /> {offer.payout_coins.toLocaleString()}
                    </span>
                  </div>
                </div>
                {/* Content */}
                <div className="p-2.5 space-y-1.5">
                  <h3 className="text-[11px] font-bold text-white group-hover:text-orange-300 transition-colors leading-tight line-clamp-2">{offer.title}</h3>
                  <p className="text-[8px] text-slate-500 leading-snug line-clamp-1">{offer.description}</p>
                  {isRestricted ? (
                    <div className="w-full py-1 rounded-lg bg-slate-800/60 text-slate-500 text-[8px] font-semibold text-center border border-white/5 cursor-not-allowed flex items-center justify-center gap-1">
                      <Lock className="w-2 h-2" /> Restricted
                    </div>
                  ) : (
                    <button onClick={() => handleLaunchOffer(offer)} className="w-full py-1.5 rounded-lg bg-slate-900 border border-white/5 text-slate-200 hover:bg-gradient-to-r hover:from-orange-500 hover:to-pink-600 hover:text-white hover:border-transparent text-[8px] font-bold tracking-wide transition-all cursor-pointer">
                      Launch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
        <HorizontalScroll snap>
          {OFFERWALL_PROVIDERS.map((name) => {
            const locked = isProviderLocked(name);

            return (
              <div key={name} className="snap-start shrink-0 w-[170px] sm:w-[190px] group">
                <OfferwallCard
                  name={name}
                  locked={locked || isRestricted}
                  onLaunch={locked || isRestricted ? undefined : () => handleLaunchProvider(name)}
                />
              </div>
            );
          })}
        </HorizontalScroll>
      </div>
      )}

      {/* ═══════════════════ PREMIUM LOCKED OFFERWALL CARDS ═══════════════════ */}
      {visibleSections.offerwalls && lockedConfigs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/25 flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight">
                  Premium Locked Offerwalls
                </h2>
                <p className="text-[10px] text-slate-500 font-mono">Unlock premium offerwalls to earn more</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-600/10 border border-amber-500/25 text-[8px] font-extrabold text-amber-400 font-mono tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              LOCKED
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lockedConfigs.map((cfg) => (
              <LockedOfferwallCard
                key={cfg.providerName}
                config={cfg}
                user={user}
                onUnlocked={handleLockedUnlocked}
              />
            ))}
          </div>
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

      {/* ═══════════════════ SOCIAL BOUNTY CAMPAIGNS ═══════════════════ */}
      {socialCampaigns.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-emerald-400" />
              Social Bounty Campaigns
            </h2>
          </div>
          <HorizontalScroll>
            {socialCampaigns.map((campaign) => {
              const userSubs = campaignSubmissions[campaign.id] || [];
              const approved = userSubs.some(s => s.status === "approved");
              const pending = userSubs.some(s => s.status === "pending");
              return (
                <div key={campaign.id} className="min-w-[280px] max-w-[280px] bg-slate-950/40 p-4 rounded-3xl border border-white/5 hover:border-emerald-500/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{campaign.icon || "🎯"}</span>
                    <h3 className="font-bold text-sm text-white truncate">{campaign.title}</h3>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono mb-3 line-clamp-2">{campaign.description}</p>
                  <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono mb-3">
                    <span className="text-emerald-400 font-bold">+{campaign.reward_coins.toLocaleString()} coins</span>
                    <span>|</span>
                    <span>Mode: {campaign.completion_mode === "all" ? "Complete All" : "Any Task"}</span>
                  </div>
                  {approved ? (
                    <div className="w-full py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[9px] font-bold text-center border border-emerald-500/20 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Already Claimed
                    </div>
                  ) : pending ? (
                    <div className="w-full py-2 rounded-xl bg-amber-500/10 text-amber-400 text-[9px] font-bold text-center border border-amber-500/20">
                      Pending Review
                    </div>
                  ) : (
                    <button onClick={() => openCampaignModal(campaign)} className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[9px] font-bold hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-1">
                      <Flag className="w-3 h-3" /> Claim Promo
                    </button>
                  )}
                </div>
              );
            })}
          </HorizontalScroll>
        </section>
      )}

      {/* ═══════════════════ CAMPAIGN SUBMISSION MODAL ═══════════════════ */}
      {campaignModal && (
        <CampaignSubmitModal
          campaign={campaignModal}
          tasks={campaignModalTasks}
          user={user}
          onClose={() => { setCampaignModal(null); setCampaignModalTasks([]); }}
          onSubmit={handleCampaignSubmit}
          submitting={submittingCampaign}
        />
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
                  {submitting ? <><Loader size="xs" /> Verifying...</> : <><Play className="w-3.5 h-4" /> Complete Offer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VPN Checking Overlay ── */}
      {vpnCheckingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 p-6 bg-slate-950 border border-cyan-500/20 rounded-2xl">
            <Loader size="sm" text="Verifying network security" />
          </div>
        </div>
      )}

      {/* ═══════════════════ OFFER DETAILS MODAL (Premium) ═══════════════════ */}
      {viewingOfferDetails && (
        <OfferDetailsModal
          offer={viewingOfferDetails}
          user={user}
          onClose={() => setViewingOfferDetails(null)}
          onRewardEarned={onRewardEarned}
        />
      )}

      {/* ── VPN Block Fullscreen ── */}
      {vpnBlockedOfferwall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl">
          <div className="max-w-md mx-4 text-center">
            <div className="mb-6 w-20 h-20 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Blocked</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              VPN, proxy, or TOR detected. Please disable it and try again to access offers.
            </p>
            <button onClick={async () => {
              setVpnBlockedOfferwall(false);
              if (user.role === 'admin') return;
              const settings = getVpnSettings();
              if (settings.offerwallBlock) {
                setVpnCheckingOffer(true);
                try {
                  const vpnResult = await checkVpnStatus();
                  logDetection(user.id, user.username, vpnResult);
                  if (vpnResult.isVpn || vpnResult.isProxy || vpnResult.isTor || vpnResult.isHosting) {
                    setVpnBlockedOfferwall(true);
                    setVpnCheckingOffer(false);
                    return;
                  }
                } catch { /* */ }
                setVpnCheckingOffer(false);
              }
            }} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold hover:scale-[1.02] transition-all cursor-pointer">
              Try Again
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ═══ ANNOUNCEMENT & PROMO CODE SECTION ═══
function AnnouncementPromoSection({ announcements, promoCodes, user, setUser, onRewardEarned, visibleSections }: {
  announcements: any[]; promoCodes: any[]; user: UserProfile; setUser: (u: UserProfile) => void;
  onRewardEarned?: (coins: number, sourceName: string, message?: string, xpGained?: number) => void;
  visibleSections: any;
}) {
  const [copiedCode, setCopiedCode] = useState("");

  const activeAnnouncement = announcements.length > 0 ? announcements[0] : null;

  const now = Date.now();
  const activePromo = Array.isArray(promoCodes)
    ? promoCodes
        .filter((p: any) => p.active && p.expiresAt && new Date(p.expiresAt).getTime() > now)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2500);
    });
  };

  const showAnnouncement = visibleSections.announcements !== false && activeAnnouncement;
  const showPromo = visibleSections.promo_cards !== false && activePromo;

  if (!showAnnouncement && !showPromo) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {/* ── Announcement Box ── */}
      {showAnnouncement && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-white/5 p-4 sm:p-5 group hover:border-cyan-400/30 transition-all">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Megaphone className="w-4 h-4 text-cyan-400 shrink-0" />
              <h3 className="text-sm font-bold text-white">{activeAnnouncement.title || "Announcement"}</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed flex-1">{activeAnnouncement.message}</p>
            <span className="text-[8px] text-slate-600 font-mono mt-2">
              {new Date(activeAnnouncement.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* ── Promo Code Box ── */}
      {showPromo && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-amber-950/30 border border-white/5 p-4 sm:p-5 group hover:border-amber-400/30 transition-all">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Gift className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-sm font-bold text-white">Promo Code Active</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3 flex-1">
              Use code <code className="px-2 py-0.5 rounded bg-black/40 border border-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">{activePromo.code}</code> to get <span className="text-amber-300 font-bold">{activePromo.coins.toLocaleString()} coins</span>!
            </p>
            <div className="flex items-center justify-between gap-3 mt-auto flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <CountdownTimer expiresAt={activePromo.expiresAt} />
              </div>
              <button onClick={() => handleCopyCode(activePromo.code)} className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold font-mono shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-2">
                {copiedCode === activePromo.code ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy Code</>
                )}
              </button>
            </div>
            {copiedCode === activePromo.code && (
              <p className="text-[9px] text-emerald-400 font-mono mt-2 text-center">Promo code copied successfully. Redeem it in the Rewards page.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ GLOBAL NOTIFICATION — Admin-Controlled Notification + Optional Promo ═══
function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(Date.now());
  const expired = now >= new Date(expiresAt).getTime();
  const totalSec = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return (
    <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
      {days > 0 && <span className="mr-1">{days}d</span>}
      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

function NotificationCards({ user, setUser, onRewardEarned, globalPromo }: { user: UserProfile; setUser: (u: UserProfile) => void;   onRewardEarned?: (coins: number, sourceName: string, message?: string, xpGained?: number) => void; globalPromo: any }) {
  const notifText = globalPromo?.text || "";
  const promoEnabled = globalPromo?.promoEnabled || false;
  const promoCode = globalPromo?.promoCode || "";
  const promoCoins = globalPromo?.promoCoins || 0;
  const promoDurationSec = globalPromo?.promoDuration || 0;
  const [claimed, setClaimed] = useState(() => {
    const list: string[] = JSON.parse(localStorage.getItem("coinloot_claimed_promos") || "[]");
    return list.includes(promoCode);
  });

  const promoMs = promoDurationSec * 1000;
  const promoExpiresAt = promoEnabled && promoCode && promoMs > 0
    ? (() => {
        const stored = localStorage.getItem("coinloot_global_notif_promo_start");
        const start = stored ? parseInt(stored) : Date.now();
        if (!stored) localStorage.setItem("coinloot_global_notif_promo_start", String(start));
        return new Date(start + promoMs).toISOString();
      })()
    : null;

  const promoExpired = promoExpiresAt ? Date.now() >= new Date(promoExpiresAt).getTime() : false;
  const cards: { key: string; element: React.ReactNode }[] = [];

  // Global notification text
  if (notifText.trim()) {
    cards.push({
      key: "global",
      element: (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-white/5 p-4 sm:p-5 h-full group hover:border-cyan-400/30 transition-all">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Megaphone className="w-4 h-4 text-cyan-400 shrink-0" />
              <h3 className="text-sm font-bold text-white">Announcement</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed flex-1">{notifText}</p>
          </div>
        </div>
      ),
    });
  }

  // Promo notification
  if (promoEnabled && promoCode && promoCoins > 0 && !promoExpired) {
    cards.push({
      key: "promo",
      element: (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-amber-950/30 border border-white/5 p-4 sm:p-5 h-full group hover:border-amber-400/30 transition-all">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Gift className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-sm font-bold text-white">Promo Code Available</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3 flex-1">
              Use code <code className="px-2 py-0.5 rounded bg-black/40 border border-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">{promoCode}</code> to get <span className="text-amber-300 font-bold">{promoCoins.toLocaleString()} coins</span>!
            </p>
            <div className="flex items-center justify-between gap-3 mt-auto flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {promoExpiresAt && <CountdownTimer expiresAt={promoExpiresAt} />}
              </div>
              {claimed ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">Claimed ✓</span>
              ) : (
                <button
                    onClick={() => {
                      const list: string[] = JSON.parse(localStorage.getItem("coinloot_claimed_promos") || "[]");
                      if (list.includes(promoCode)) { setClaimed(true); return; }
                      list.push(promoCode);
                      localStorage.setItem("coinloot_claimed_promos", JSON.stringify(list));
                      playCoinSound();
                      onRewardEarned?.(promoCoins, "Promo Code", `Promo code "${promoCode}" redeemed! +${promoCoins.toLocaleString()} coins credited.`);
                      setClaimed(true);
                    }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold font-mono shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  Claim {promoCoins.toLocaleString()} Coins
                </button>
              )}
            </div>
          </div>
        </div>
      ),
    });
  }

  if (cards.length === 0) return null;

  const gridCols = cards.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
      {cards.map((c) => (
        <div key={c.key}>{c.element}</div>
      ))}
    </div>
  );
}

// ── Campaign Submit Modal ──
function CampaignSubmitModal({ campaign, tasks, user, onClose, onSubmit, submitting }: {
  campaign: any; tasks: any[]; user: UserProfile; onClose: () => void;
  onSubmit: (urls: string[]) => void; submitting: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const maxScreenshots = campaign.max_screenshots || 5;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const remaining = maxScreenshots - files.length;
    const toAdd = selected.slice(0, remaining);
    setFiles(prev => [...prev, ...toAdd]);
    toAdd.forEach((f: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setPreviews(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (files.length === 0) { alert("Please upload at least 1 screenshot."); return; }
    const urls = previews;
    onSubmit(urls);
  };

  const totalReward = campaign.reward_coins || tasks.reduce((s: number, t: any) => s + (t.reward_coins || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-lg w-full bg-slate-950 border border-white/10 rounded-3xl p-6 relative animate-zoom-in shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">✕</button>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{campaign.icon || "🎯"}</span>
          <div>
            <h2 className="text-lg font-bold text-white">{campaign.title}</h2>
            <p className="text-[10px] text-slate-400 font-mono">Submit proof to earn {totalReward.toLocaleString()} coins</p>
          </div>
        </div>

        {campaign.description && (
          <p className="text-[10px] text-slate-400 font-mono mb-4 p-3 bg-slate-900/50 rounded-2xl border border-white/5">{campaign.description}</p>
        )}

        {tasks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[9px] text-slate-500 uppercase font-bold mb-2">Tasks to Complete</h3>
            <div className="space-y-1.5">
              {tasks.map((t, i) => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/50 border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 text-[8px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">{t.task_title}</p>
                    {t.task_description && <p className="text-[8px] text-slate-400 truncate">{t.task_description}</p>}
                  </div>
                  <span className="text-[9px] text-emerald-400 font-bold shrink-0">+{t.reward_coins}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-[9px] text-slate-500 uppercase font-bold mb-2">Upload Screenshots ({files.length}/{maxScreenshots})</h3>
          <label className="flex flex-col items-center justify-center w-full h-24 rounded-2xl border-2 border-dashed border-white/10 bg-slate-900/30 hover:border-cyan-500/30 transition-all cursor-pointer">
            <Upload className="w-5 h-5 text-slate-500 mb-1" />
            <span className="text-[9px] text-slate-400 font-mono">Click to upload screenshots</span>
            <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={files.length >= maxScreenshots} />
          </label>
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {previews.map((p, i) => (
              <div key={i} className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-white/5 group">
                <img src={p} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                <button onClick={() => removeFile(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={handleSubmit} disabled={submitting || files.length === 0} className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-bold hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
