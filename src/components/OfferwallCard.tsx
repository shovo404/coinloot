import { Lock, Star } from "lucide-react";
import { getProviderLogoUrl } from "../utils/providerLogos";

interface OfferwallCardProps {
  name: string;
  logoUrl?: string;
  category?: string;
  offerCount?: number;
  locked?: boolean;
  lockReason?: string;
  unlockProgress?: number;
  onLaunch?: () => void;
  className?: string;
}

const BADGES: Record<string, { label: string; gradient: string }> = {
  surveys: { label: "SURVEYS", gradient: "from-purple-600 to-pink-500" },
  main: { label: "POPULAR", gradient: "from-emerald-500 to-teal-500" },
  mobile: { label: "RISING", gradient: "from-amber-500 to-orange-500" },
  extra: { label: "NEW", gradient: "from-cyan-500 to-blue-500" },
};

const STAR_COLORS = ["text-amber-300", "text-amber-300", "text-amber-300", "text-amber-300", "text-amber-300"];

function getRating(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
  return 3.5 + (Math.abs(hash) % 15) / 10;
}

function getOffersText(count: number): string {
  if (count <= 0) return "";
  if (count < 3) return `+${count} Offer`;
  if (count < 10) return `+${count} Offers`;
  return `${count}+`;
}

export default function OfferwallCard({
  name,
  logoUrl,
  category,
  offerCount,
  locked,
  lockReason,
  unlockProgress,
  onLaunch,
  className = "",
}: OfferwallCardProps) {
  const logoSrc = logoUrl || getProviderLogoUrl(name);
  const badge = BADGES[category || "main"] || BADGES.main;
  const rating = getRating(name);
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const offerText = offerCount !== undefined ? getOffersText(offerCount) : "";

  return (
    <div
      className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 w-full bg-gradient-to-br from-slate-900 via-slate-950/90 to-indigo-950/30 border border-white/[0.06] hover:border-white/15 hover:shadow-[0_0_40px_rgba(168,85,247,0.08)] ${
        locked ? "opacity-70 grayscale-[0.25]" : ""
      } ${className}`}
      style={{ aspectRatio: "3/4", minHeight: "320px", maxHeight: "400px" }}
    >
      {/* Glow overlay */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px] group-hover:bg-purple-500/10 transition-all duration-500 pointer-events-none" />

      {/* Diagonal Ribbon */}
      <div className="absolute top-0 left-0 z-10">
        <div className="relative">
          <div className={`bg-gradient-to-r ${badge.gradient} px-3 py-1 rounded-br-xl shadow-lg`}>
            <span className="text-[8px] font-extrabold text-white tracking-[0.15em] uppercase">{badge.label}</span>
          </div>
          <div className="absolute -bottom-1 left-0 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-transparent opacity-60" style={{ borderRightColor: badge.gradient.includes("emerald") ? "#059669" : badge.gradient.includes("purple") ? "#7c3aed" : badge.gradient.includes("amber") ? "#d97706" : "#06b6d4" }} />
        </div>
      </div>

      {/* Lock Badge */}
      {locked ? (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/15 border border-rose-500/25 backdrop-blur-md">
          <Lock className="w-2.5 h-2.5 text-rose-400" />
          <span className="text-[7px] font-bold text-rose-300 tracking-wider uppercase">Locked</span>
        </div>
      ) : offerText ? (
        <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-md">
          <span className="text-[7px] font-bold text-white/70 font-mono">{offerText}</span>
        </div>
      ) : null}

      {/* Logo Section */}
      <div className="flex-1 flex items-center justify-center p-6 pt-10">
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={logoSrc}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="max-w-[80%] max-h-[80%] w-auto h-auto object-contain transition-all duration-300 group-hover:scale-110"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              const fallback = img.nextElementSibling;
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
          <div className="hidden w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-white">{name[0].toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-4 pb-4 pt-3 border-t border-white/[0.06] space-y-2">
        <h3 className="text-sm font-bold text-white/90 text-center truncate tracking-wide">{name}</h3>

        {/* Star Rating */}
        <div className="flex items-center justify-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => {
            const isFilled = i < fullStars;
            const isHalf2 = hasHalf && i === fullStars;
            return (
              <Star
                key={i}
                className={`w-3 h-3 ${isFilled || isHalf2 ? "text-amber-400 fill-amber-400" : "text-white/10"}`}
              />
            );
          })}
          <span className="text-[9px] text-white/40 font-mono ml-1">{rating.toFixed(1)}</span>
        </div>

        {locked && unlockProgress !== undefined && (
          <div className="space-y-1">
            <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-purple-500 transition-all"
                style={{ width: `${Math.min(100, unlockProgress)}%` }}
              />
            </div>
            {lockReason && (
              <p className="text-[7px] text-slate-500 font-mono text-center">{lockReason}</p>
            )}
          </div>
        )}

        <button
          onClick={onLaunch}
          disabled={!onLaunch}
          className="w-full py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/80 text-[9px] font-bold hover:bg-gradient-to-r hover:from-cyan-500 hover:to-purple-600 hover:text-white hover:border-transparent hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {locked ? "Unlock Now" : "Launch"}
        </button>
      </div>
    </div>
  );
}
