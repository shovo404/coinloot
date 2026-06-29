import { useState, useEffect, useRef } from "react";
import { X, Coins, Zap, ExternalLink, CheckCircle, Award, Smartphone, Monitor } from "lucide-react";
import { Offer, UserProfile } from "../types";
import { playCoinSound } from "../utils/coinSound";
import Loader from "./Loader";

interface Props {
  offer: Offer;
  user: UserProfile;
  onClose: () => void;
  onRewardEarned: (coins: number, sourceName: string, message?: string, xpGained?: number) => void;
}

interface OfferStep {
  id: string;
  label: string;
  reward: number;
  order: number;
}

const FALLBACK_STEPS: OfferStep[] = [
  { id: "s1", label: "Complete Level 10", reward: 100, order: 1 },
  { id: "s2", label: "Complete Level 25", reward: 250, order: 2 },
  { id: "s3", label: "Complete Level 50", reward: 500, order: 3 },
];

export default function OfferDetailsModal({ offer, user, onClose, onRewardEarned }: Props) {
  const [mounted, setMounted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [claimedRewards, setClaimedRewards] = useState(0);
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
      if (Array.isArray(saved)) {
        setCompletedSteps(new Set(saved));
        // Calculate claimed rewards
        const steps = (offer.steps && offer.steps.length > 0 ? offer.steps : FALLBACK_STEPS)
          .sort((a, b) => a.order - b.order);
        const claimed = steps
          .filter(s => saved.includes(s.id))
          .reduce((sum, s) => sum + s.reward, 0);
        setClaimedRewards(claimed);
      }
    } catch {}
  }, [offer.id, offer.steps]);

  const stepsData = (offer.steps && offer.steps.length > 0 ? offer.steps : FALLBACK_STEPS)
    .sort((a, b) => a.order - b.order);
  const totalStepReward = stepsData.reduce((s, st) => s + st.reward, 0);
  const totalReward = offer.max_reward || offer.payout_coins + totalStepReward;

  const handleStartOffer = () => {
    if (starting || started) return;
    setStarting(true);

    setTimeout(() => {
      setStarting(false);
      setStarted(true);

      try {
        const key = `coinloot_offer_started_${offer.id}`;
        localStorage.setItem(key, Date.now().toString());
      } catch {}

      const url = offer.tracking_link || offer.link || "#";
      if (url && url !== "#") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }, 1200);
  };

  const handleClaimStep = (step: OfferStep) => {
    if (completedSteps.has(step.id)) return;

    const next = new Set(completedSteps);
    next.add(step.id);
    setCompletedSteps(next);
    setClaimedRewards(prev => prev + step.reward);

    try {
      const key = `coinloot_offer_steps_${offer.id}`;
      localStorage.setItem(key, JSON.stringify([...next]));
    } catch {}

    playCoinSound();
    onRewardEarned(step.reward, offer.provider, `Completed "${step.label}" on ${offer.provider}`);
  };

  const isAllCompleted = stepsData.length > 0 && completedSteps.size === stepsData.length;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          background: mounted ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0)",
          backdropFilter: mounted ? "blur(16px)" : "blur(0)",
          transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          ref={modalRef}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl flex flex-col"
          style={{
            background: "linear-gradient(160deg, #0B0E1A 0%, #111827 40%, #18192D 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 0 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
            transform: mounted ? "scale(1) translateY(0)" : "scale(0.95) translateY(10px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease",
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-black/50 text-gray-400 hover:text-white hover:bg-black/70 transition-all cursor-pointer backdrop-blur-md border border-white/5"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Cover Image */}
          <div className="relative w-full aspect-[16/9] bg-slate-900 overflow-hidden rounded-t-3xl">
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E1A] via-transparent to-transparent" />

            {/* Provider badge on image */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/5">
                <span className="text-[9px] font-bold text-white/90 uppercase tracking-wider">{offer.provider}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/5 flex items-center gap-1">
                {offer.is_mobile_only ? (
                  <><Smartphone className="w-3 h-3 text-cyan-400" /><span className="text-[9px] font-bold text-white/90">Mobile</span></>
                ) : (
                  <><Monitor className="w-3 h-3 text-cyan-400" /><span className="text-[9px] font-bold text-white/90">Cross-Platform</span></>
                )}
              </div>
            </div>

            {/* Reward badge */}
            <div className="absolute top-4 right-16 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/90 to-orange-600/90 backdrop-blur-md shadow-lg">
              <span className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" /> {totalReward.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Title */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">{offer.title}</h2>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{offer.description}</p>
            </div>

            {/* How to Earn */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/20 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">How to Earn</h3>
              </div>

              <div className="space-y-2">
                {stepsData.map((step, idx) => {
                  const done = completedSteps.has(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        done
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : started && !done
                            ? "border-cyan-500/15 bg-cyan-500/5"
                            : "border-white/5 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-bold ${
                          done
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/5 text-slate-500 border border-white/10"
                        }`}>
                          {done ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span className={`text-[11px] ${done ? "text-emerald-300 line-through opacity-60" : "text-slate-300"}`}>
                          {step.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-amber-400">+{step.reward.toLocaleString()}</span>
                        {started && !done && (
                          <button
                            onClick={() => handleClaimStep(step)}
                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-[8px] font-bold text-white hover:scale-105 transition-all cursor-pointer"
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Reward Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono font-semibold">Total Reward</p>
                  <p className="text-xl font-extrabold text-amber-300 mt-0.5">{totalReward.toLocaleString()} Coins</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              {/* Progress */}
              {started && stepsData.length > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-500/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8px] text-slate-500 font-mono">Progress</span>
                    <span className="text-[9px] font-bold text-amber-300">{completedSteps.size}/{stepsData.length}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${(completedSteps.size / stepsData.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={isAllCompleted ? undefined : handleStartOffer}
              disabled={starting || isAllCompleted}
              className="w-full py-3.5 rounded-2xl text-white text-[11px] font-extrabold tracking-wider uppercase transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 relative overflow-hidden group"
              style={{
                background: isAllCompleted
                  ? "linear-gradient(135deg, #059669, #10B981)"
                  : started
                    ? "linear-gradient(135deg, #06B6D4, #7C3AED)"
                    : "linear-gradient(135deg, #06B6D4, #7C3AED)",
                boxShadow: isAllCompleted
                  ? "0 4px 24px rgba(16,185,129,0.3)"
                  : started
                    ? "0 4px 24px rgba(6,182,212,0.25)"
                    : "0 4px 24px rgba(6,182,212,0.25)",
              }}
            >
              {starting ? (
                <span className="flex items-center gap-2"><Loader size="xs" /> Starting...</span>
              ) : isAllCompleted ? (
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> All Rewards Claimed</span>
              ) : started ? (
                <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Complete Steps to Earn</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Start Offer
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </span>
              )}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-[60%] h-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", animation: "shimmer 1.5s ease-in-out infinite" }} />
              </div>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </>
  );
}
