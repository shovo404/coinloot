import { useState, useEffect, useCallback, useRef } from "react";
import { X, Heart, Clock, Globe, Smartphone, ShieldCheck, ChevronRight, ChevronDown, ExternalLink, MessageSquare, Zap, Coins, Sparkles, Trophy, Users, CheckCircle, AlertCircle, Flame, Star } from "lucide-react";
import { Offer, UserProfile } from "../types";
import { getProviderInfo, getProviderLogoUrl } from "../utils/providerLogos";
import { playCoinSound } from "../utils/coinSound";

interface Props {
  offer: Offer;
  user: UserProfile;
  onClose: () => void;
  onRewardEarned: (coins: number, sourceName: string, message?: string, xpGained?: number) => void;
}

const FALLBACK_STEPS: OfferStep[] = [
  { id: "s1", label: "Sign up & create account", reward: 50, order: 1 },
  { id: "s2", label: "Complete profile verification", reward: 100, order: 2 },
  { id: "s3", label: "Reach first milestone", reward: 200, order: 3 },
  { id: "s4", label: "Complete advanced tasks", reward: 500, order: 4 },
];

const FALLBACK_ACTIVITY: ActivityEntry[] = [
  { id: "a1", username: "CryptoKing", reward: 500, step: "Reach Level 10", createdAt: Date.now() - 120000 },
  { id: "a2", username: "RewardHunter", reward: 1000, step: "Reach Level 20", createdAt: Date.now() - 600000 },
  { id: "a3", username: "CoinMaster", reward: 250, step: "Profile verified", createdAt: Date.now() - 1800000 },
  { id: "a4", username: "TaskNinja", reward: 750, step: "Reach Level 15", createdAt: Date.now() - 3600000 },
  { id: "a5", username: "EarnPro", reward: 1500, step: "Reach Level 30", createdAt: Date.now() - 7200000 },
];

interface OfferStep {
  id: string;
  label: string;
  reward: number;
  order: number;
}

interface ActivityEntry {
  id: string;
  username: string;
  reward: number;
  step?: string;
  createdAt: number;
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem("coinloot_offer_favorites") || "[]");
  } catch { return []; }
}

function setFavorites(ids: string[]) {
  localStorage.setItem("coinloot_offer_favorites", JSON.stringify(ids));
}

export default function OfferDetailsModal({ offer, user, onClose, onRewardEarned }: Props) {
  const [activeTab, setActiveTab] = useState<"about" | "steps" | "activity">("about");
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportMsg, setSupportMsg] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [supportDone, setSupportDone] = useState(false);
  const [favorites, setFavoritesState] = useState<string[]>(getFavorites);
  const [mounted, setMounted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(FALLBACK_ACTIVITY);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Load completed steps from localStorage
  useEffect(() => {
    try {
      const key = `coinloot_offer_steps_${offer.id}`;
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(saved)) setCompletedSteps(new Set(saved));
    } catch {}
  }, [offer.id]);

  const isFav = favorites.includes(offer.id);

  const toggleFav = () => {
    const next = isFav
      ? favorites.filter((id) => id !== offer.id)
      : [...favorites, offer.id];
    setFavoritesState(next);
    setFavorites(next);
  };

  const provider = getProviderInfo(offer.provider);
  const logo = offer.imageUrl || getProviderLogoUrl(offer.provider);
  const stepsData = (offer.steps && offer.steps.length > 0 ? offer.steps : FALLBACK_STEPS)
    .sort((a, b) => a.order - b.order);
  const totalStepReward = stepsData.reduce((s, st) => s + st.reward, 0);
  const maxReward = offer.max_reward || offer.payout_coins + totalStepReward;

  const handleStartOffer = useCallback(() => {
    if (starting || started) return;
    setStarting(true);

    // Simulate click tracking delay
    setTimeout(() => {
      setStarting(false);
      setStarted(true);

      // Track that user started this offer
      try {
        const key = `coinloot_offer_started_${offer.id}`;
        localStorage.setItem(key, Date.now().toString());
      } catch {}

      // Open tracking link
      const url = offer.tracking_link || offer.link || "#";
      if (url && url !== "#") {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      // Add activity entry
      const entry: ActivityEntry = {
        id: `ac-${Date.now()}`,
        username: user.username,
        reward: 0,
        step: "Started offer",
        createdAt: Date.now(),
      };
      setActivityLog((prev) => [entry, ...prev.slice(0, 19)]);

      // Simulate first step completion after a few seconds
      if (stepsData.length > 0) {
        setTimeout(() => {
          const firstStep = stepsData[0];
          completeStep(firstStep.id, firstStep.reward, firstStep.label);
        }, 4000 + Math.random() * 3000);
      }
    }, 1200);
  }, [starting, started, offer, user.username, stepsData]);

  const completeStep = (stepId: string, reward: number, label: string) => {
    if (completedSteps.has(stepId)) return;

    const next = new Set(completedSteps);
    next.add(stepId);
    setCompletedSteps(next);

    // Persist
    try {
      const key = `coinloot_offer_steps_${offer.id}`;
      localStorage.setItem(key, JSON.stringify([...next]));
    } catch {}

    // Reward
    playCoinSound();
    onRewardEarned(reward, offer.provider, `Completed "${label}" on ${offer.provider}`);

    // Activity
    const entry: ActivityEntry = {
      id: `ac-${Date.now()}`,
      username: user.username,
      reward,
      step: label,
      createdAt: Date.now(),
    };
    setActivityLog((prev) => [entry, ...prev.slice(0, 19)]);
  };

  const handleSupportSubmit = () => {
    if (!supportMsg.trim()) return;
    setSupportSending(true);
    setTimeout(() => {
      setSupportSending(false);
      setSupportDone(true);
      try {
        const tickets = JSON.parse(localStorage.getItem("coinloot_support_tickets") || "[]");
        tickets.push({
          id: `st-${Date.now()}`,
          userId: user.id,
          username: user.username,
          offerId: offer.id,
          offerTitle: offer.title,
          message: supportMsg,
          createdAt: new Date().toISOString(),
          status: "OPEN",
        });
        localStorage.setItem("coinloot_support_tickets", JSON.stringify(tickets));
      } catch {}
    }, 1000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          background: mounted ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0)",
          backdropFilter: mounted ? "blur(12px)" : "blur(0)",
          transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Modal */}
        <div
          ref={modalRef}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl flex flex-col"
          style={{
            background: "linear-gradient(160deg, #0B0E1A 0%, #111827 40%, #18192D 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 0 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
            transform: mounted ? "scale(1) translateY(0)" : "scale(0.95) translateY(10px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease",
          }}
        >
          {/* ── Close Button ── */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ── Header Section ── */}
          <div className="relative p-5 sm:p-7 pb-5 border-b border-white/[0.06]">
            {/* Background glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-[0.12] pointer-events-none"
              style={{ background: `radial-gradient(circle, ${provider.color?.includes("cyan") ? "#06b6d4" : "#7C3AED"}, transparent 70%)` }}
            />

            <div className="relative z-10 flex items-start gap-4">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-white/[0.08] flex items-center justify-center p-2.5 overflow-hidden shrink-0 backdrop-blur-sm">
                <img src={logo} alt={offer.provider} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className={`w-full h-full rounded-xl bg-gradient-to-br ${provider.color || "from-cyan-500 to-purple-600"} flex items-center justify-center hidden`}>
                  <span className="text-base font-bold text-white">{provider.initials}</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded-md text-[8px] font-bold font-mono uppercase tracking-wider bg-gradient-to-r from-cyan-500/20 to-purple-600/15 text-cyan-300 border border-cyan-500/20">
                    {offer.provider}
                  </span>
                  {offer.difficulty && (
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold font-mono ${
                      offer.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      offer.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {offer.difficulty}
                    </span>
                  )}
                  {offer.is_mobile_only && (
                    <span className="px-2 py-0.5 rounded-md text-[8px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      <Smartphone className="w-2.5 h-2.5" /> Mobile
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">{offer.title}</h2>
              </div>

              {/* Favorite */}
              <button
                onClick={toggleFav}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer shrink-0"
              >
                <Heart className={`w-4 h-4 transition-colors ${isFav ? "text-rose-400 fill-rose-400" : "text-gray-500"}`} />
              </button>
            </div>

            {/* Stats row */}
            <div className="relative z-10 flex items-center gap-4 sm:gap-6 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Reward</p>
                  <p className="text-sm font-extrabold text-amber-300">{offer.payout_coins.toLocaleString()}</p>
                </div>
              </div>
              {maxReward > offer.payout_coins && (
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/10 border border-purple-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Max Reward</p>
                    <p className="text-sm font-extrabold text-purple-300">{maxReward.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {offer.countries && (
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Countries</p>
                    <p className="text-sm font-bold text-cyan-300">{offer.countries}+</p>
                  </div>
                </div>
              )}
              {offer.estimated_time && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Est. Time</p>
                    <p className="text-sm font-bold text-emerald-300">{offer.estimated_time}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-white/[0.06] px-5 sm:px-7">
            {(["about", "steps", "activity"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                  activeTab === tab
                    ? "text-cyan-300 border-cyan-400"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                {tab === "about" && "About"}
                {tab === "steps" && `Steps (${stepsData.length})`}
                {tab === "activity" && "Activity"}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 pt-4 space-y-4">
            {/* About Tab */}
            {activeTab === "about" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Description
                  </h4>
                  <p className="text-[12px] text-gray-300 leading-relaxed">
                    {offer.description_full || offer.description}
                  </p>
                </div>

                {offer.requirements && offer.requirements.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Requirements
                    </h4>
                    <ul className="space-y-1.5">
                      {offer.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-gray-400">
                          <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Eligibility</p>
                    <p className="text-[11px] text-gray-300 mt-1">New & existing users welcome</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Platform</p>
                    <p className="text-[11px] text-gray-300 mt-1">{offer.is_mobile_only ? "Mobile only" : "Desktop & Mobile"}</p>
                  </div>
                </div>

                {/* Milestone Preview */}
                {stepsData.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" /> Milestone Rewards
                    </h4>
                    <div className="space-y-2">
                      {stepsData.slice(0, 3).map((step) => (
                        <div key={step.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-[11px] text-gray-400">{step.label}</span>
                          <span className="text-[11px] font-bold text-amber-400">+{step.reward}</span>
                        </div>
                      ))}
                      {stepsData.length > 3 && (
                        <button onClick={() => setActiveTab("steps")} className="text-[10px] text-cyan-400 font-mono hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer">
                          View all {stepsData.length} steps <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Steps Tab */}
            {activeTab === "steps" && (
              <div className="space-y-3">
                {stepsData.map((step, idx) => {
                  const done = completedSteps.has(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`relative p-4 rounded-2xl border transition-all ${
                        done
                          ? "border-emerald-500/20 bg-emerald-500/05"
                          : started
                            ? "border-white/[0.08] bg-white/[0.02]"
                            : "border-white/[0.04] bg-white/[0.01]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Step number / check */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          done
                            ? "bg-emerald-500/20 border border-emerald-500/30"
                            : started && idx === 0
                              ? "bg-cyan-500/20 border border-cyan-500/30 animate-pulse"
                              : "bg-white/5 border border-white/10"
                        }`}>
                          {done ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12px] font-semibold ${done ? "text-emerald-300" : "text-white"}`}>
                            {step.label}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <Coins className="w-3 h-3" /> {step.reward.toLocaleString()} coins
                          </p>
                        </div>
                        {done ? (
                          <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Done
                          </span>
                        ) : started && !done && (
                          <button
                            onClick={() => completeStep(step.id, step.reward, step.label)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-[9px] font-bold text-white hover:scale-105 transition-all cursor-pointer"
                          >
                            Claim
                          </button>
                        )}
                      </div>
                      {/* Progress bar for completed */}
                      {done && (
                        <div className="mt-2.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: "100%" }} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Overall progress */}
                {started && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-600/5 border border-cyan-500/15">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Overall Progress</span>
                      <span className="text-sm font-extrabold text-amber-300">
                        {completedSteps.size}/{stepsData.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden p-[1px]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(completedSteps.size / stepsData.length) * 100}%`,
                          background: "linear-gradient(90deg, #06b6d4, #7C3AED)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="space-y-2">
                {activityLog.length === 0 ? (
                  <div className="text-center py-8">
                    <Flame className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-[11px] text-gray-500">No recent activity yet</p>
                  </div>
                ) : (
                  activityLog.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-rose-600/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                        <Flame className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white font-medium">
                          <span className="font-bold text-orange-300">{entry.username}</span>
                          {entry.step ? ` completed ${entry.step}` : ` started offer`}
                        </p>
                        <p className="text-[9px] text-gray-500 mt-0.5">{timeAgo(entry.createdAt)}</p>
                      </div>
                      {entry.reward > 0 && (
                        <span className="text-[11px] font-bold text-amber-400 shrink-0">+{entry.reward.toLocaleString()}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── Footer / CTA ── */}
          <div className="sticky bottom-0 p-5 sm:p-7 pt-4 border-t border-white/[0.06] backdrop-blur-xl"
            style={{ background: "linear-gradient(to top, rgba(11,14,26,0.95) 0%, rgba(11,14,26,0.8) 100%)" }}
          >
            <div className="flex items-center gap-3">
              {/* Support */}
              <button
                onClick={() => setShowSupport(!showSupport)}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Report an issue"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Start Button */}
              <button
                onClick={handleStartOffer}
                disabled={starting || started}
                className="flex-1 py-3.5 rounded-2xl text-white text-[11px] font-extrabold tracking-wider uppercase transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 overflow-hidden relative group"
                style={{
                  background: started
                    ? "linear-gradient(135deg, #059669, #10B981)"
                    : "linear-gradient(135deg, #06B6D4, #7C3AED)",
                  boxShadow: started
                    ? "0 4px 24px rgba(16,185,129,0.3)"
                    : "0 4px 24px rgba(6,182,212,0.25)",
                }}
                onMouseEnter={(e) => {
                  if (!started) e.currentTarget.style.boxShadow = "0 6px 32px rgba(6,182,212,0.4)";
                }}
                onMouseLeave={(e) => {
                  if (!started) e.currentTarget.style.boxShadow = "0 4px 24px rgba(6,182,212,0.25)";
                }}
              >
                {starting ? (
                  <span className="flex items-center gap-2">
                    <Loader size="xs" />
                    Starting...
                  </span>
                ) : started ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Started
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Start Offer
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </span>
                )}
                {/* Shimmer */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-0 w-[60%] h-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", animation: "shimmer 1.5s ease-in-out infinite" }} />
                </div>
              </button>
            </div>

            {/* Support Form */}
            {showSupport && (
              <div className="mt-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Report Issue</h4>
                <p className="text-[10px] text-gray-500 mb-2">Auto-filled for: <span className="text-cyan-300">{offer.title}</span> (ID: {offer.id})</p>
                {supportDone ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                    <CheckCircle className="w-4 h-4" /> Ticket submitted. We'll respond within 24h.
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <textarea
                      value={supportMsg}
                      onChange={(e) => setSupportMsg(e.target.value)}
                      placeholder="Describe your issue..."
                      className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-[11px] text-white placeholder-gray-600 focus:outline-none resize-none"
                      rows={2}
                    />
                    <button
                      onClick={handleSupportSubmit}
                      disabled={supportSending || !supportMsg.trim()}
                      className="px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-[9px] font-bold text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      {supportSending ? "..." : "Send"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe for shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </>
  );
}
