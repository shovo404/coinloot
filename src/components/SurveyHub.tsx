import { useState, useEffect } from "react";
import {
  Clock, Coins, ShieldCheck, Filter, Zap, UserCheck, AlertTriangle, Sparkles,
} from "lucide-react";
import { UserProfile } from "../types";
import { isDeveloperMode } from "./DeveloperModeBanner";
import { getProviderInfo, getProviderLogoUrl } from "../utils/providerLogos";
import HorizontalScroll from "./HorizontalScroll";

interface Survey {
  id: string;
  title: string;
  provider: "CPX Research" | "Prime Surveys" | "BitLabs" | "TheoremReach" | "Cherries";
  estimatedMinutes: number;
  rewardCoins: number;
  qualificationRate: number;
  allowedCountries: string[];
  category: "gaming" | "technology" | "finance" | "lifestyle";
}

interface SurveyHubProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  onRewardEarned: (coins: number, sourceName: string, message?: string, xpGained?: number) => void;
  simulationCountry: string;
}

const SURVEY_LOGO_MAP: Record<string, string> = {
  "CPX Research": "/logos/cpxresearch.png",
  "Prime Surveys": "/logos/primesurveys.png",
  "BitLabs": "/logos/bitlabs.png",
  "TheoremReach": "/logos/theoremreach.png",
  "Cherries": "/logos/cherries.png",
};

export default function SurveyHub({ user, setUser, onRewardEarned, simulationCountry }: SurveyHubProps) {
  const initialSurveys: Survey[] = [
    {
      id: "srv-1",
      title: "CPX Consumer Gadget Assessment",
      provider: "CPX Research",
      estimatedMinutes: 8,
      rewardCoins: 1200,
      qualificationRate: 85,
      allowedCountries: ["US", "BD", "UK"],
      category: "technology"
    },
    {
      id: "srv-2",
      title: "Stellar Cloud Server Survey",
      provider: "CPX Research",
      estimatedMinutes: 15,
      rewardCoins: 2800,
      qualificationRate: 60,
      allowedCountries: ["US", "UK"],
      category: "technology"
    },
    {
      id: "srv-3",
      title: "TheoremReach Gamer Persona Analytics",
      provider: "TheoremReach",
      estimatedMinutes: 12,
      rewardCoins: 1500,
      qualificationRate: 90,
      allowedCountries: ["US", "BD", "UK"],
      category: "gaming"
    },
    {
      id: "srv-4",
      title: "Prime Surveys Global Finance Matrix",
      provider: "Prime Surveys",
      estimatedMinutes: 20,
      rewardCoins: 4200,
      qualificationRate: 40,
      allowedCountries: ["US"],
      category: "finance"
    },
    {
      id: "srv-5",
      title: "BitLabs Local Media Usage Audit",
      provider: "BitLabs",
      estimatedMinutes: 10,
      rewardCoins: 950,
      qualificationRate: 75,
      allowedCountries: ["BD"],
      category: "lifestyle"
    },
    {
      id: "srv-6",
      title: "Cherries Dynamic FMCG Preference Study",
      provider: "Cherries",
      estimatedMinutes: 6,
      rewardCoins: 800,
      qualificationRate: 95,
      allowedCountries: ["US", "BD", "UK"],
      category: "lifestyle"
    },
    {
      id: "srv-7",
      title: "CPX Telecommunications Feedback Loop",
      provider: "CPX Research",
      estimatedMinutes: 14,
      rewardCoins: 2200,
      qualificationRate: 70,
      allowedCountries: ["UK"],
      category: "technology"
    },
    {
      id: "srv-8",
      title: "TheoremReach Asset Allocation Study Tracker",
      provider: "TheoremReach",
      estimatedMinutes: 18,
      rewardCoins: 3100,
      qualificationRate: 50,
      allowedCountries: ["US", "UK"],
      category: "finance"
    }
  ];

  const [surveys] = useState<Survey[]>(initialSurveys);
  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [takingSurvey, setTakingSurvey] = useState<Survey | null>(null);
  const [completingState, setCompletingState] = useState(false);

  const geoFilteredSurveys = surveys.filter((s) => {
    return s.allowedCountries.includes(simulationCountry);
  });

  const finalFilteredSurveys = geoFilteredSurveys.filter((s) => {
    const matchProvider = selectedProvider === "All" || s.provider === selectedProvider;
    const matchCategory = selectedCategory === "All" || s.category === selectedCategory;
    return matchProvider && matchCategory;
  });

  const handleSimulateSurveySubmit = (survey: Survey) => {
    if (isDeveloperMode()) { alert("Surveys are temporarily disabled — site under development."); return; }
    setCompletingState(true);
    setTimeout(() => {
      const payout = survey.rewardCoins;
      const xpReward = Math.round(survey.estimatedMinutes * 15);
      onRewardEarned(payout, `${survey.provider}`, `Completed ${survey.title} and earned ${payout.toLocaleString()} coins.`, xpReward);
      setCompletingState(false);
      setTakingSurvey(null);
      alert(`Consensus Verified! You earned +${payout.toLocaleString()} coins for completed ${survey.provider} survey!`);
    }, 2000);
  };

  const providerList = ["All", ...new Set(surveys.map((s) => s.provider))];

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-2xl border border-white/5">
          <Filter className="w-3.5 h-3.5 text-cyan-400 ml-2" />
          {providerList.map((prov) => (
            <button
              key={prov}
              onClick={() => setSelectedProvider(prov)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                selectedProvider === prov
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 text-cyan-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {prov}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-2xl border border-white/5">
          {["All", "technology", "gaming", "finance", "lifestyle"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/30 text-purple-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Survey Cards */}
      {finalFilteredSurveys.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Available Surveys
            </h2>
            <span className="text-[10px] font-mono text-slate-500">{finalFilteredSurveys.length} surveys</span>
          </div>
          <HorizontalScroll snap>
            {finalFilteredSurveys.map((srv) => {
              const providerInfo = getProviderInfo(srv.provider);
              const logoUrl = SURVEY_LOGO_MAP[srv.provider] || getProviderLogoUrl(srv.provider);
              const color = providerInfo.color || "from-cyan-500 to-blue-600";
              return (
                <div
                  key={srv.id}
                  className="snap-start shrink-0 w-[280px] sm:w-[300px] lg:w-[340px] group"
                >
                  <div className="relative rounded-2xl bg-slate-950/60 border border-white/5 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all duration-300 p-5 h-full flex flex-col backdrop-blur-xl">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/[0.03] to-purple-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                          <img
                            src={logoUrl}
                            alt={srv.provider}
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
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-mono rounded bg-cyan-400/10 text-cyan-300 font-bold border border-cyan-400/20">
                              {srv.provider}
                            </span>
                            <span className="px-1.5 py-0.5 text-[8px] rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 capitalize font-mono">
                              {srv.category}
                            </span>
                          </div>
                          <h3 className="font-sans font-bold text-sm text-white group-hover:text-cyan-400 mt-1 tracking-wide transition-colors leading-snug">
                            {srv.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                        Sector target campaign focusing on <span className="text-purple-300 font-mono text-[10px]">{srv.category}</span> consensus models.
                      </p>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-slate-900/60 rounded-xl p-2.5 text-center border border-white/5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                          <span className="block text-[10px] font-mono font-bold text-white">{srv.estimatedMinutes}m</span>
                          <span className="block text-[7px] text-slate-500 uppercase font-mono tracking-wider mt-0.5">Duration</span>
                        </div>
                        <div className="bg-slate-900/60 rounded-xl p-2.5 text-center border border-white/5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                          <span className="block text-[10px] font-mono font-bold text-emerald-400">{srv.qualificationRate}%</span>
                          <span className="block text-[7px] text-slate-500 uppercase font-mono tracking-wider mt-0.5">Qualified</span>
                        </div>
                        <div className="bg-slate-900/60 rounded-xl p-2.5 text-center border border-white/5">
                          <Coins className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                          <span className="block text-[10px] font-mono font-bold text-amber-400">{srv.rewardCoins.toLocaleString()}</span>
                          <span className="block text-[7px] text-slate-500 uppercase font-mono tracking-wider mt-0.5">Reward</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-4">
                      <button
                        onClick={() => setTakingSurvey(srv)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-bold tracking-wide hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Start Survey
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </HorizontalScroll>
        </div>
      ) : (
        <div className="py-24 text-center glass rounded-3xl border border-dashed border-cyan-500/10 space-y-4">
          <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No active Opinion Campaigns available</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto leading-relaxed">
              No Offers or Surveys Available In Your Region ({simulationCountry}). Try toggling simulated geo parameters on the State Manager settings block!
            </p>
          </div>
        </div>
      )}

      {/* Taking Survey Modal */}
      {takingSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-950 border border-white/10 rounded-3xl p-6 relative animate-zoom-in shadow-2xl">
            <button
              onClick={() => setTakingSurvey(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm font-bold font-mono"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 pb-4 border-b border-white/5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden">
                <img src={SURVEY_LOGO_MAP[takingSurvey.provider] || getProviderLogoUrl(takingSurvey.provider)} alt={takingSurvey.provider} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div>
                <span className="px-2 py-0.5 text-[8px] uppercase tracking-wider font-mono rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20 block w-max">
                  {takingSurvey.provider}
                </span>
                <h2 className="font-sans font-bold text-base text-white tracking-tight mt-1">
                  {takingSurvey.title}
                </h2>
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <p className="text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                Before initiating landing vectors, our brand audit needs validation on {takingSurvey.category} variables. Answers must represent actual consensus signals.
              </p>

              <div className="space-y-3 p-4 bg-purple-950/15 border border-purple-500/10 rounded-2xl">
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">ESTIMATED CYCLE TIME</span>
                  <span className="font-bold text-white">{takingSurvey.estimatedMinutes} Earth Minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">ESTIMATED XP GAINED</span>
                  <span className="font-bold text-cyan-400">+{takingSurvey.estimatedMinutes * 15} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">DISBURSEMENT COINS</span>
                  <span className="font-bold text-purple-400">{takingSurvey.rewardCoins.toLocaleString()} Coins (~${(takingSurvey.rewardCoins/1000).toFixed(2)})</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setTakingSurvey(null)}
                  className="flex-1 py-3 text-center rounded-2xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-200 transition-all font-semibold tracking-wide text-xs"
                >
                  Cancel campaign
                </button>

                <button
                  onClick={() => handleSimulateSurveySubmit(takingSurvey)}
                  disabled={completingState}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:scale-[1.01] text-white transition-all font-bold tracking-wide text-xs shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5"
                >
                  {completingState ? (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Launch Survey</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
