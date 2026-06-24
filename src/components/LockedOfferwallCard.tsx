import { useState, useMemo } from "react";
import { Lock, Coins, Gift, ChevronRight, Sparkles, Star, Zap } from "lucide-react";
import { UserProfile } from "../types";
import { LockedOfferwallConfig, isOfferwallUnlocked, addUserUnlock } from "../utils/lockedOfferwallDB";
import { getProviderInfo, getProviderLogoUrl } from "../utils/providerLogos";
import PromoUnlockModal from "./PromoUnlockModal";

interface Props {
  key?: string;
  config: LockedOfferwallConfig;
  user: UserProfile;
  onUnlocked: (providerName: string) => void;
}

export default function LockedOfferwallCard({ config, user, onUnlocked }: Props) {
  const [showPromo, setShowPromo] = useState(false);

  if (!config.isLocked) return null;

  const provider = getProviderInfo(config.providerName);
  const alreadyUnlocked = isOfferwallUnlocked(user.id, config.providerName);
  const earned = user.total_earned_coins;
  const required = config.requiredCoins;
  const progress = Math.min(100, Math.round((earned / required) * 100));
  const remaining = Math.max(0, required - earned);
  const autoUnlocked = earned >= required && !alreadyUnlocked;

  if (autoUnlocked) {
    addUserUnlock({
      id: `ul-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId: user.id,
      offerwallName: config.providerName,
      unlockedBy: "coins",
      promoCode: null,
      unlockedAt: new Date().toISOString(),
    });
    setTimeout(() => onUnlocked(config.providerName), 0);
  }

  if (alreadyUnlocked) return null;

  const handlePromoSuccess = () => {
    addUserUnlock({
      id: `ul-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId: user.id,
      offerwallName: config.providerName,
      unlockedBy: "promo",
      promoCode: null,
      unlockedAt: new Date().toISOString(),
    });
    onUnlocked(config.providerName);
  };

  const logoUrl = config.logo || getProviderLogoUrl(config.providerName);
  const color = provider.color || "from-cyan-500 to-purple-600";

  const lockPulseStyle = useMemo(() => ({
    animation: "lockPulse 2s ease-in-out infinite",
  }), []);

  return (
    <>
      <style>{`
        @keyframes lockPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3), 0 0 40px rgba(251, 191, 36, 0.1); }
          50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.5), 0 0 60px rgba(251, 191, 36, 0.2); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes progressFill {
          from { width: 0%; }
        }
      `}</style>
      <div className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 w-full border border-white/[0.06] hover:border-amber-500/20"
        style={{ aspectRatio: "3/4", minHeight: "320px", maxHeight: "400px" }}
      >
        {/* ── Background ── */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className="w-full h-full object-cover opacity-[0.2] scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27]/90 via-[#0d1235]/85 to-[#120a2e]/90" />
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/[0.06] via-transparent to-purple-600/[0.06]" />
        </div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 bg-amber-500/[0.04] rounded-full blur-[80px] z-0 pointer-events-none" />

        {/* ── Top Section ── */}
        <div className="relative z-10 flex flex-col items-center pt-6 pb-4 px-5">
          {/* Lock Badge - Top Right */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-md">
            <Lock className="w-3 h-3 text-amber-300" />
            <span className="text-[9px] font-bold text-white/80 tracking-widest uppercase">Locked</span>
          </div>

          {/* Glowing Gold Lock Icon */}
          <div className="mb-3" style={lockPulseStyle}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border border-amber-400/30 flex items-center justify-center backdrop-blur-md">
              <Lock className="w-5 h-5 text-amber-300" />
            </div>
          </div>

          {/* Provider Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md flex items-center justify-center p-2.5 mb-3 shadow-[0_0_30px_rgba(168,85,247,0.08)]">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={config.providerName}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                  const fb = img.parentElement?.querySelector(".locked-premium-fb");
                  if (fb) fb.classList.remove("hidden");
                }}
              />
            ) : null}
            <div className={`locked-premium-fb ${logoUrl ? "hidden" : ""} w-full h-full rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
              <span className="text-lg font-bold text-white">{config.providerName[0].toUpperCase()}</span>
            </div>
          </div>

          {/* Provider Name */}
          <h3 className="text-lg font-extrabold text-white text-center tracking-wide">
            {(config.title || config.providerName).toUpperCase()}
          </h3>

          {/* Subtitle with decorative separators */}
          <div className="flex items-center gap-3 mt-1.5 w-full max-w-[220px]">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-[9px] text-white/50 font-medium tracking-widest uppercase whitespace-nowrap">
              {config.subtitle || "Premium Offerwall"}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>

        {/* ── Bottom Section ── */}
        <div className="relative z-10 flex-1 flex flex-col gap-2.5 px-5 pb-5">
          {/* Unlock Requirement Card */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-md px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border border-amber-400/20 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <p className="text-[11px] text-white/70 font-medium">Unlock at</p>
              <p className="text-sm font-extrabold text-amber-300">{required.toLocaleString()} Coins</p>
            </div>
          </div>

          {/* Your Progress Section */}
          <div className="space-y-2">
            <p className="text-[8px] text-white/40 font-semibold tracking-[0.15em] uppercase">Your Progress</p>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-md px-4 py-3">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] text-white/60 font-mono">{earned.toLocaleString()} / {required.toLocaleString()} Coins</span>
                <span className="text-sm font-extrabold text-amber-300">{progress}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Remaining Coins */}
          {remaining > 0 ? (
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-md px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <p className="text-[11px] text-white font-bold">Earn {remaining.toLocaleString()} more coins</p>
                <p className="text-[8px] text-white/40 tracking-wide">to unlock this offerwall</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-300 font-bold">Coin requirement met!</p>
                <p className="text-[8px] text-emerald-400/60">Use promo code to unlock</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => setShowPromo(true)}
            className="relative group/btn w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-[10px] font-extrabold tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(168,85,247,0.15)] hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/0 via-white/10 to-pink-500/0 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <Gift className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Claim Offer With Code</span>
            <ChevronRight className="w-3 h-3 relative z-10" />
          </button>
        </div>
      </div>

      {showPromo && (
        <PromoUnlockModal
          offerwallName={config.providerName}
          userId={user.id}
          onSuccess={handlePromoSuccess}
          onClose={() => setShowPromo(false)}
        />
      )}
    </>
  );
}
