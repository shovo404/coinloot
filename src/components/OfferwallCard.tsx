import { Star } from "lucide-react";
import { getProviderLogoUrl } from "../utils/providerLogos";

interface OfferwallCardProps {
  name: string;
  logoUrl?: string;
  locked?: boolean;
  onLaunch?: () => void;
  className?: string;
}

interface CardTheme {
  gradient: string;
  glow: string;
  ribbon: string;
}

const CARD_THEMES: Record<string, CardTheme> = {
  torox: {
    gradient: "linear-gradient(145deg, #0B2A3B 0%, #0A1F2E 30%, #061520 60%, #02080C 100%)",
    glow: "rgba(6,182,212,0.15)",
    ribbon: "CLASSIC",
  },
  adgatemedia: {
    gradient: "linear-gradient(145deg, #3A1F0A 0%, #2A1508 30%, #1A0D04 60%, #080400 100%)",
    glow: "rgba(251,146,60,0.15)",
    ribbon: "POPULAR",
  },
  adgem: {
    gradient: "linear-gradient(145deg, #3B0F1F 0%, #2B0A18 30%, #1B0510 60%, #0A0208 100%)",
    glow: "rgba(244,63,94,0.15)",
    ribbon: "NEW",
  },
  lootably: {
    gradient: "linear-gradient(145deg, #0A2E1F 0%, #072216 30%, #04150D 60%, #020A06 100%)",
    glow: "rgba(52,211,153,0.15)",
    ribbon: "+40%",
  },
  revenueuniverse: {
    gradient: "linear-gradient(145deg, #0B2B3E 0%, #091F2E 30%, #051420 60%, #02080C 100%)",
    glow: "rgba(56,189,248,0.15)",
    ribbon: "+80%",
  },
  timewall: {
    gradient: "linear-gradient(145deg, #2E0B30 0%, #200822 30%, #140416 60%, #08020A 100%)",
    glow: "rgba(192,38,211,0.15)",
    ribbon: "HOT",
  },
  ayetstudios: {
    gradient: "linear-gradient(145deg, #0A2825 0%, #071E1B 30%, #041412 60%, #020A08 100%)",
    glow: "rgba(20,184,166,0.15)",
    ribbon: "RISING",
  },
  kiwiwall: {
    gradient: "linear-gradient(145deg, #1A2E0A 0%, #122207 30%, #0B1604 60%, #050A02 100%)",
    glow: "rgba(132,204,22,0.15)",
    ribbon: "NEW",
  },
  monlix: {
    gradient: "linear-gradient(145deg, #3B1A0A 0%, #2B1208 30%, #1B0B04 60%, #0A0402 100%)",
    glow: "rgba(251,146,60,0.15)",
    ribbon: "+60%",
  },
  wannads: {
    gradient: "linear-gradient(145deg, #350D1F 0%, #250A17 30%, #180610 60%, #0A0208 100%)",
    glow: "rgba(236,72,153,0.15)",
    ribbon: "POPULAR",
  },
  gemiad: {
    gradient: "linear-gradient(145deg, #0A2825 0%, #071E1B 30%, #041412 60%, #020A08 100%)",
    glow: "rgba(20,184,166,0.15)",
    ribbon: "CLASSIC",
  },
  pixylabs: {
    gradient: "linear-gradient(145deg, #1F0B30 0%, #160822 30%, #0E0416 60%, #06020A 100%)",
    glow: "rgba(168,85,247,0.15)",
    ribbon: "RISING",
  },
  pubscale: {
    gradient: "linear-gradient(145deg, #2E1F0A 0%, #221608 30%, #160E04 60%, #0A0602 100%)",
    glow: "rgba(251,146,60,0.15)",
    ribbon: "NEW",
  },
  rewardwall: {
    gradient: "linear-gradient(145deg, #0E1B3A 0%, #0A142A 30%, #060D1A 60%, #02050A 100%)",
    glow: "rgba(96,165,250,0.15)",
    ribbon: "+80%",
  },
  radientwall: {
    gradient: "linear-gradient(145deg, #2B0B30 0%, #1F0822 30%, #140416 60%, #08020A 100%)",
    glow: "rgba(192,38,211,0.15)",
    ribbon: "HOT",
  },
  upwall: {
    gradient: "linear-gradient(145deg, #121E35 0%, #0D1628 30%, #080E1A 60%, #04060A 100%)",
    glow: "rgba(99,102,241,0.15)",
    ribbon: "TRENDING",
  },
};

function getSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

function getCardTheme(name: string): CardTheme {
  const slug = getSlug(name);
  const theme = CARD_THEMES[slug];
  if (theme) return theme;
  return {
    gradient: "linear-gradient(145deg, #1E293B 0%, #0F172A 30%, #0B0F1A 60%, #04060A 100%)",
    glow: "rgba(148,163,184,0.12)",
    ribbon: "NEW",
  };
}

function getRating(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
  return 3 + (Math.abs(hash) % 20) / 10;
}

export default function OfferwallCard({
  name,
  logoUrl,
  locked,
  onLaunch,
  className = "",
}: OfferwallCardProps) {
  const logoSrc = logoUrl || getProviderLogoUrl(name);
  const theme = getCardTheme(name);
  const rating = getRating(name);
  const fullStars = Math.min(5, Math.max(0, Math.round(rating)));
  const isDisabled = locked || !onLaunch;

  return (
    <div
      className={`group relative flex flex-col rounded-[22px] overflow-hidden w-full select-none ${
        isDisabled ? "cursor-default" : "cursor-pointer"
      } ${className}`}
      style={{
        aspectRatio: "2/3",
        minHeight: "260px",
        maxHeight: "350px",
        transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        boxShadow: isDisabled
          ? "0 4px 16px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)"
          : "0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.03)",
        transform: isDisabled ? "none" : undefined,
      }}
      onClick={isDisabled ? undefined : onLaunch}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        const el = e.currentTarget;
        el.style.transform = "translateY(-6px) scale(1.03)";
        el.style.boxShadow = "0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return;
        const el = e.currentTarget;
        el.style.transform = "translateY(0) scale(1)";
        el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.03)";
      }}
    >
      {/* ── Background ── */}
      <div className="absolute inset-0" style={{ background: theme.gradient }} />

      {/* Radial glow from top-center */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-[200px] h-[140px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(ellipse, ${theme.glow} 0%, transparent 70%)`,
        }}
      />

      {/* Inner shadow overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* Premium top-edge reflection */}
      <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* ── Colored Hover Glow ── */}
      {!isDisabled && (
        <div
          className="absolute inset-0 rounded-[22px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
          style={{
            boxShadow: `inset 0 0 60px ${theme.glow.replace("0.15", "0.08")}`,
          }}
        />
      )}

      {/* ── Diagonal Ribbon ── */}
      <div
        className="absolute top-0 left-0 z-10 pointer-events-none"
        style={{ width: "150px", height: "150px", overflow: "hidden" }}
      >
        <div
          className="absolute font-extrabold tracking-[0.18em] text-white uppercase text-center"
          style={{
            background: "linear-gradient(135deg, #34D399, #10B981)",
            width: "200px",
            padding: "5px 0",
            transform: "rotate(-45deg) translateX(-18%) translateY(-8%)",
            transformOrigin: "0 0",
            fontSize: "8px",
            lineHeight: "1.3",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          {theme.ribbon}
        </div>
        {/* Fold shadow triangle */}
        <div
          className="absolute bottom-0 left-0 w-0 h-0 pointer-events-none"
          style={{
            borderLeft: "8px solid transparent",
            borderTop: "8px solid #047857",
            opacity: 0.6,
          }}
        />
      </div>

      {/* ── Logo Section ── */}
      <div className="flex-1 flex items-center justify-center p-5 pt-10 relative z-[2]">
        <div className="flex items-center justify-center w-full" style={{ maxWidth: "58%" }}>
          <img
            src={logoSrc}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-[85px] object-contain transition-all duration-500 ease-out group-hover:scale-110"
            style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              const fallback = img.nextElementSibling;
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
          <div className="hidden w-14 h-14 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
            <span className="text-2xl font-bold text-white">{name[0].toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Section ── */}
      <div className="relative z-[2] px-5 pb-5 pt-1 flex flex-col items-center gap-2">
        <h3
          className="font-bold text-white text-center leading-tight tracking-tight"
          style={{
            fontSize: "clamp(17px, 3vw, 24px)",
            textShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          {name}
        </h3>

        {/* Divider line */}
        <div className="w-8 h-[2px] rounded-full bg-white/10" />

        {/* 5-Star Rating */}
        <div className="flex items-center justify-center gap-[3px]">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`transition-all duration-300 ${
                i < fullStars
                  ? "text-[#FFD700] fill-[#FFD700]"
                  : "text-white/[0.1]"
              }`}
              style={{
                width: "14px",
                height: "14px",
                filter: i < fullStars ? "drop-shadow(0 0 4px rgba(255,215,0,0.4))" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Locked overlay ── */}
      {locked && (
        <div className="absolute inset-0 bg-black/35 rounded-[22px] pointer-events-none z-[3]" />
      )}
    </div>
  );
}
