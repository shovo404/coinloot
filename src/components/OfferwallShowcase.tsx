import { Star } from "lucide-react";

interface ShowcaseItem {
  slug: string;
  name: string;
  initials: string;
  ribbon: {
    label: string;
    gradient: string;
  };
  rating: number;
}

const RIBBON_TAGS = [
  { label: "CLASSIC", gradient: "from-emerald-500 to-teal-500" },
  { label: "RISING", gradient: "from-cyan-500 to-blue-500" },
  { label: "NEW", gradient: "from-violet-500 to-purple-500" },
  { label: "POPULAR", gradient: "from-amber-500 to-orange-500" },
  { label: "+80%", gradient: "from-rose-500 to-pink-500" },
];

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  { slug: "gemiad", name: "GemiAd", initials: "GA", ribbon: RIBBON_TAGS[0], rating: 0 },
  { slug: "pixylabs", name: "PixyLabs", initials: "PL", ribbon: RIBBON_TAGS[1], rating: 0 },
  { slug: "klinklabs", name: "Klink Labs", initials: "KL", ribbon: RIBBON_TAGS[2], rating: 0 },
  { slug: "pubscale", name: "PubScale", initials: "PS", ribbon: RIBBON_TAGS[3], rating: 0 },
  { slug: "rewardwall", name: "Reward Wall", initials: "RW", ribbon: RIBBON_TAGS[4], rating: 0 },
  { slug: "tplayad", name: "TPlayad", initials: "TP", ribbon: RIBBON_TAGS[0], rating: 0 },
  { slug: "lootably", name: "Lootably", initials: "LB", ribbon: RIBBON_TAGS[1], rating: 0 },
  { slug: "radientwall", name: "RadientWall", initials: "RW", ribbon: RIBBON_TAGS[2], rating: 0 },
  { slug: "notik", name: "Notik", initials: "NT", ribbon: RIBBON_TAGS[3], rating: 0 },
];

function hashRating(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
  return 3.5 + (Math.abs(hash) % 15) / 10;
}

SHOWCASE_ITEMS.forEach((item) => { item.rating = hashRating(item.name); });

function getExt(slug: string): string {
  const svgSlugs = ["rewardwall"];
  return svgSlugs.includes(slug) ? ".svg" : ".png";
}

export default function OfferwallShowcase() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24 bg-[#050B1A]">
      {/* Ambient glow backgrounds */}
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-cyan-500/4 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-purple-500/4 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/3 blur-[180px] rounded-full pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full backdrop-blur-md mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-cyan-300 font-semibold uppercase">Premium Offerwall Network</span>
          </div>
          <h2 className="font-sans font-extrabold text-3xl lg:text-5xl text-white tracking-tight leading-[1.15]">
            Top Earning{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Platforms
            </span>
          </h2>
          <p className="text-slate-400 text-sm lg:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
            Access 9 premium offerwall providers. Complete offers, surveys, and tasks to earn coins instantly.
          </p>
        </div>

        {/* Cards Row */}
        <div className="flex flex-wrap justify-center gap-3 lg:gap-4 xl:gap-5">
          {SHOWCASE_ITEMS.map((item) => {
            const fullStars = Math.floor(item.rating);
            const hasHalf = item.rating % 1 >= 0.5;
            return (
              <div
                key={item.slug}
                className="group relative flex flex-col items-center w-[calc(33.333%-12px)] sm:w-[calc(25%-12px)] md:w-[calc(20%-16px)] lg:w-[calc(11.111%-16px)] min-w-[100px] max-w-[160px]"
              >
                <div
                  className="relative w-full flex flex-col items-center rounded-[20px] border border-white/[0.07] bg-gradient-to-b from-white/[0.06] to-white/[0.01] backdrop-blur-xl p-4 pt-6 transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_40px_rgba(6,182,212,0.12),0_0_80px_rgba(168,85,247,0.06)] hover:-translate-y-1"
                  style={{ aspectRatio: "3/4" }}
                >
                  {/* Hover glow */}
                  <div className="absolute -inset-2 rounded-[26px] bg-gradient-to-br from-cyan-500/0 via-purple-500/0 to-blue-500/0 opacity-0 group-hover:opacity-100 group-hover:from-cyan-500/10 group-hover:via-purple-500/8 group-hover:to-blue-500/10 blur-xl transition-all duration-500 pointer-events-none" />

                  {/* Ribbon */}
                  <div className="absolute top-0 left-0 z-10">
                    <div className={`bg-gradient-to-r ${item.ribbon.gradient} px-2.5 py-1 rounded-br-[14px] shadow-lg`}>
                      <span className="text-[7px] font-extrabold text-white tracking-[0.12em] uppercase leading-none block">
                        {item.ribbon.label}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 left-0 w-0 h-0 border-l-[5px] border-l-transparent border-t-[5px] border-t-transparent opacity-50"
                      style={{
                        borderRight: item.ribbon.gradient.includes("emerald") ? "5px solid #059669"
                          : item.ribbon.gradient.includes("cyan") ? "5px solid #0891b2"
                          : item.ribbon.gradient.includes("violet") ? "5px solid #7c3aed"
                          : item.ribbon.gradient.includes("amber") ? "5px solid #d97706"
                          : "5px solid #e11d48"
                      }}
                    />
                  </div>

                  {/* Logo */}
                  <div className="flex-1 flex items-center justify-center w-full">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-cyan-400/20 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.08)]">
                      <img
                        src={`/logos/${item.slug}${getExt(item.slug)}`}
                        alt={item.name}
                        loading="lazy"
                        className="w-10 h-10 lg:w-12 lg:h-12 object-contain transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = "none";
                          const fallback = img.parentElement?.querySelector(".fallback-init");
                          if (fallback) fallback.classList.remove("hidden");
                        }}
                      />
                      <div className="fallback-init hidden w-full h-full rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">{item.initials}</span>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="font-sans font-bold text-xs lg:text-sm text-white text-center mt-3 leading-tight">
                    {item.name}
                  </h3>

                  {/* Star Rating */}
                  <div className="flex items-center justify-center gap-0.5 mt-2 mb-2">
                    {Array.from({ length: 5 }, (_, i) => {
                      const filled = i < fullStars;
                      const half = hasHalf && i === fullStars;
                      return (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 lg:w-3 lg:h-3 ${filled || half ? "text-amber-400 fill-amber-400" : "text-white/10"}`}
                        />
                      );
                    })}
                    <span className="text-[8px] lg:text-[9px] text-white/30 font-mono ml-1">
                      {item.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Bottom divider glow */}
                  <div className="absolute bottom-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent group-hover:via-cyan-400/20 transition-all duration-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom stat bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 lg:gap-10 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            9 Active Providers
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Verified & Trusted
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Instant Payouts
          </span>
        </div>
      </div>
    </section>
  );
}
