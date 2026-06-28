import { useState, useEffect } from "react";
import { Coins, Lock, Key } from "lucide-react";
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

const PROVIDER_GRADIENT_SPLIT = ["TOROX", "BITLABS", "ADGEM", "MONLIX"];
const PROVIDER_FULL_GRADIENT = ["CPX RESEARCH", "TIME WALL", "THEOREMREACH", "LOOTABLY", "ADGATE MEDIA"];

function formatName(name: string): { first: string; rest: string; isGradient: boolean } {
  const upper = name.toUpperCase();
  if (PROVIDER_GRADIENT_SPLIT.some((p) => upper.includes(p) || upper === p)) {
    const mid = Math.ceil(upper.length / 2);
    return { first: upper.slice(0, mid), rest: upper.slice(mid), isGradient: true };
  }
  if (PROVIDER_FULL_GRADIENT.some((p) => upper.includes(p) || upper === p)) {
    return { first: "", rest: upper, isGradient: true };
  }
  return { first: upper, rest: "", isGradient: false };
}

export default function LockedOfferwallCard({ config, user, onUnlocked }: Props) {
  const [visible, setVisible] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!config.isLocked) return null;

  const provider = getProviderInfo(config.providerName);
  const alreadyUnlocked = isOfferwallUnlocked(user.id, config.providerName);
  const earned = user.total_earned_coins;
  const required = config.requiredCoins;
  const progress = Math.min(100, Math.round((earned / required) * 100));
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

  const logoUrl = config.logo || getProviderLogoUrl(config.providerName);
  const titleFormatted = formatName(config.providerName);

  return (
    <>
      <style>{`
        @keyframes floatLock {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(250,204,21,0.2), 0 0 40px rgba(250,204,21,0.1); }
          50% { box-shadow: 0 0 35px rgba(250,204,21,0.4), 0 0 60px rgba(250,204,21,0.15); }
        }
        @keyframes borderNeon {
          0%, 100% { border-color: rgba(124,58,237,0.25); }
          50% { border-color: rgba(124,58,237,0.5); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressFill {
          from { width: 0%; }
        }
        .card-premium-enter { animation: fadeSlideUp 0.5s ease-out both; }
      `}</style>

      <div
        className={`card-premium-enter relative flex flex-col rounded-3xl overflow-hidden transition-all duration-500 w-full border hover:scale-[1.015]`}
        style={{
          aspectRatio: "3/4",
          minHeight: "380px",
          maxHeight: "460px",
          borderColor: "rgba(124,58,237,0.25)",
          animation: "borderNeon 3s ease-in-out infinite, fadeSlideUp 0.5s ease-out",
          background: "linear-gradient(160deg, #0B0E1A 0%, #111827 40%, #18192D 100%)",
          boxShadow: "0 0 40px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* ── Background Effects ── */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] object-contain opacity-[0.04] scale-110"
            />
          )}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }}
          />
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-purple-500/5 blur-[60px]" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-pink-500/5 blur-[60px]" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        {/* ── LOCKED Badge ── */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(147,51,234,0.15))",
            border: "1px solid rgba(124,58,237,0.3)",
          }}
        >
          <Lock className="w-3 h-3 text-white" />
          <span className="text-[8px] font-extrabold tracking-[0.15em] uppercase text-white">Locked</span>
        </div>

        {/* ── Hero Section ── */}
        <div className="relative z-10 flex flex-col items-center pt-8 pb-3 px-5">
          <div className="mb-4" style={{ animation: "floatLock 3s ease-in-out infinite" }}>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(circle, rgba(250,204,21,0.2), rgba(245,158,11,0.05))",
                animation: "glowPulse 2.5s ease-in-out infinite",
              }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/15 to-yellow-600/10 border border-amber-400/25 flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-6 h-6 text-amber-300" />
              </div>
            </div>
          </div>

          <div
            className="w-[72px] h-[72px] rounded-2xl backdrop-blur-xl flex items-center justify-center p-3.5 mb-3.5 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
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
            <div className={`locked-premium-fb ${logoUrl ? "hidden" : ""} w-full h-full rounded-xl bg-gradient-to-br ${provider.color || "from-purple-500 to-pink-600"} flex items-center justify-center`}>
              <span className="text-xl font-bold text-white">{provider.initials || config.providerName[0].toUpperCase()}</span>
            </div>
          </div>

          <h3 className="text-xl font-extrabold text-center tracking-wide leading-tight">
            {titleFormatted.isGradient ? (
              <>
                <span className="text-white">{titleFormatted.first}</span>
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {titleFormatted.rest}
                </span>
              </>
            ) : (
              <span className="text-white">{titleFormatted.first}</span>
            )}
          </h3>

          <span className="text-[10px] text-gray-400 font-medium tracking-[0.15em] uppercase mt-1.5">
            Premium Surveys & Offers
          </span>

          <div className="flex items-center gap-3 w-full max-w-[180px] mt-3">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)" }} />
          </div>
        </div>

        {/* ── Bottom Section ── */}
        <div className="relative z-10 flex-1 flex flex-col gap-2.5 px-5 pb-5 justify-end">
          <div
            className="rounded-2xl backdrop-blur-md px-4 py-3.5 flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(250,204,21,0.2), rgba(245,158,11,0.1))",
                border: "1px solid rgba(250,204,21,0.2)",
              }}
            >
              <Coins className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 font-medium tracking-wide uppercase">Unlock at</p>
              <p className="text-base font-extrabold tracking-tight text-amber-300">
                {required.toLocaleString()} Coins
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl backdrop-blur-md px-4 py-3.5"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] text-gray-500 font-semibold tracking-[0.15em] uppercase">Your Progress</span>
              <span className="text-sm font-extrabold text-amber-300">{progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden p-[2px] mb-2.5">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #FACC15, #F59E0B)",
                  boxShadow: "0 0 12px rgba(250,204,21,0.3)",
                  animation: progress > 0 ? "progressFill 1s ease-out" : undefined,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold text-sm">{earned.toLocaleString()}</span>
              <span className="text-gray-500 text-xs font-mono">/ {required.toLocaleString()} Coins</span>
            </div>
          </div>

          <button
            onClick={() => setPromoOpen(true)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 font-bold text-[10px] border border-purple-500/20 hover:from-purple-600/30 hover:border-purple-500/40 transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wider uppercase"
          >
            <Key className="w-3.5 h-3.5" />
            Enter Promo Code
          </button>
        </div>

        {promoOpen && (
          <PromoUnlockModal
            offerwallName={config.providerName}
            userId={user.id}
            onSuccess={() => {
              setPromoOpen(false);
              onUnlocked(config.providerName);
            }}
            onClose={() => setPromoOpen(false)}
          />
        )}

        {/* ── Bottom Pagination ── */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-600/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-600/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-600/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-600/50" />
        </div>
      </div>
    </>
  );
}
