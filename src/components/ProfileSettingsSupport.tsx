import React, { useState } from "react";
import { 
  User, ShieldCheck, HelpCircle, Mail, MapPin, Sparkles, Send, 
  History, Settings2, Trash2, Clock, Globe, Shield, Terminal, ArrowRight,
  PlusCircle, MessageSquare
} from "lucide-react";
import { UserProfile, WithdrawalRequest } from "../types";
import { isDeveloperMode } from "./DeveloperModeBanner";
import { calcLevel } from "../utils/levelSystem";

interface Ticket {
  id: string;
  subject: string;
  category: "billing" | "survey-credit" | "account" | "bug-report";
  message: string;
  status: "OPEN" | "ANSWERED" | "RESOLVED";
  created_at: string;
}

interface ProfileSettingsSupportProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  withdrawals: WithdrawalRequest[];
  simulationCountry: string;
  setSimulationCountry: (country: string) => void;
}

export default function ProfileSettingsSupport({
  user,
  setUser,
  withdrawals,
  simulationCountry,
  setSimulationCountry
}: ProfileSettingsSupportProps) {
  const [activeSegment, setActiveSegment] = useState<"profile" | "settings" | "support">("profile");

  // Avatar choices
  const avatarChoices = ["🛸", "🪐", "🌌", "🚀", "🛰️", "👑", "⭐", "👩‍🚀", "👾", "☄️"];
  const [selectedAvatar, setSelectedAvatar] = useState("🛸");

  // Support state
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "tkt-12049",
      subject: "CPX survey credited coins issue",
      category: "survey-credit",
      message: "I completed the Consumer Gadget opinion survey, but telemetry shows validation logs pending.",
      status: "ANSWERED",
      created_at: "2 days ago"
    },
    {
      id: "tkt-90238",
      subject: "Stellar Withdrawals approval times",
      category: "billing",
      message: "How long does PayPal clearance audit take? My transaction shows status PENDING.",
      status: "OPEN",
      created_at: "Just now"
    }
  ]);

  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState<Ticket["category"]>("survey-credit");
  const [newMessage, setNewMessage] = useState("");

  const handleCreateTicketInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    if (isDeveloperMode()) { alert("Support is temporarily disabled — site under development."); return; }

    const newTicket: Ticket = {
      id: `tkt-${Math.floor(Math.random() * 90000) + 10000}`,
      subject: newSubject,
      category: newCategory,
      message: newMessage,
      status: "OPEN",
      created_at: "Just now"
    };

    setTickets([newTicket, ...tickets]);
    setNewSubject("");
    setNewMessage("");
    alert("Support ticket initiated! Check compliance log replies on terminal desk.");
  };

  const handleUpdateUsernameAndAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      ...user,
      device_fingerprint: `GPU-WEBGL-VECTOR-${Math.floor(Math.random() * 9000) + 1000}-X`
    });
    alert("Profile parameters updated successfully!");
  };

  const myWithdrawalsSum = withdrawals.filter((w) => w.user_id === user.id);

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Upper overview card */}
      <div className="glass rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/10">
            {selectedAvatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-2xl text-white tracking-tight">{user.username}</h1>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-cyan-400/15 text-cyan-300 font-mono tracking-wide">
                RANK #942
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">{user.email}</p>
          </div>
        </div>

        {/* Mini stats widgets */}
        <div className="flex flex-wrap gap-4 text-center font-mono">
          <div className="bg-slate-900/60 p-3.5 border border-white/5 rounded-2xl min-w-[100px]">
            <span className="block text-[8px] text-slate-500 uppercase leading-none">Net Earned</span>
            <span className="block font-bold text-white text-sm mt-1">{user.total_earned_coins.toLocaleString()}c</span>
          </div>
          <div className="bg-slate-900/60 p-3.5 border border-white/5 rounded-2xl min-w-[100px]">
            <span className="block text-[8px] text-slate-500 uppercase leading-none">withdrawn</span>
            <span className="block font-bold text-cyan-400 text-sm mt-1">${user.total_withdrawn_usd.toFixed(2)}</span>
          </div>
          <div className="bg-slate-900/60 p-3.5 border border-white/5 rounded-2xl min-w-[100px]">
            <span className="block text-[8px] text-slate-500 uppercase leading-none">Recruits</span>
            <span className="block font-bold text-purple-400 text-sm mt-1">{user.referrals_count} referrers</span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Sub-toggles */}
      <div className="flex items-center gap-1.5 bg-slate-900/40 p-1 rounded-2xl border border-white/5 max-w-md">
        {[
          { id: "profile", label: "My Profile File", icon: User },
          { id: "settings", label: "Terminal Settings", icon: Settings2 },
          { id: "support", label: "Moderator Support", icon: HelpCircle }
        ].map((seg) => {
          const Icon = seg.icon;
          return (
            <button
              key={seg.id}
              onClick={() => setActiveSegment(seg.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSegment === seg.id
                  ? "bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border border-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{seg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Screens */}
      {activeSegment === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar choice & Identity settings (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-3xl p-6 space-y-6">
              <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                Cosmic Avatar Choice
              </h3>

              {/* Avatar choices list */}
              <div className="flex flex-wrap gap-3">
                {avatarChoices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => setSelectedAvatar(choice)}
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl transition-all ${
                      selectedAvatar === choice
                        ? "bg-slate-950 border-cyan-400 shadow-[0_0_8px_cyan]"
                        : "bg-slate-900/60 border-white/5 hover:border-white/10"
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              {/* Account variables modification form */}
              <form onSubmit={handleUpdateUsernameAndAvatar} className="space-y-4 pt-4 border-t border-white/5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Change Account Name</label>
                    <input
                      type="text"
                      value={user.username}
                      onChange={(e) => setUser({ ...user, username: e.target.value })}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Verified Account Email</label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Detected Country Code</label>
                    <div className="bg-slate-900 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 flex items-center justify-between">
                      <span className="capitalize">{simulationCountry === "BD" ? "Bangladesh (BD)" : simulationCountry === "US" ? "United States (US)" : simulationCountry === "UK" ? "United Kingdom (UK)" : "Iceland (IS)"}</span>
                      <span className="text-cyan-400">⚡ LOCKED</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Clearance Level status</label>
                    <div className="bg-slate-900 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-300">
                      Level {calcLevel(user.balance_coins)} (multiplier +{(calcLevel(user.balance_coins) * 1.5).toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-cyan-300 border border-white/5 hover:border-cyan-400/20 hover:bg-cyan-500/5 hover:text-cyan-400 rounded-xl transition-all font-semibold font-sans tracking-wide text-xs"
                >
                  Save Profile Configuration
                </button>
              </form>
            </div>

            {/* Profile Activity ledger summary counts */}
            <div className="glass rounded-3xl p-6">
              <h3 className="font-sans font-bold text-base text-white mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                Ledger Log statistics
              </h3>

              <div className="grid grid-cols-3 gap-4 text-center font-mono">
                <div className="bg-slate-900/60 p-4 border border-white/5 rounded-2xl">
                  <span className="text-[18px] text-white font-bold block">{myWithdrawalsSum.length}</span>
                  <span className="text-[9px] text-slate-500 uppercase mt-1 block">Cashout Orders</span>
                </div>
                <div className="bg-slate-900/60 p-4 border border-white/5 rounded-2xl">
                  <span className="text-[18px] text-white font-bold block">12</span>
                  <span className="text-[9px] text-slate-500 uppercase mt-1 block">Completed Offers</span>
                </div>
                <div className="bg-slate-900/60 p-4 border border-white/5 rounded-2xl">
                  <span className="text-[18px] text-white font-bold block">BD</span>
                  <span className="text-[9px] text-slate-500 uppercase mt-1 block">System GEO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Sentinel diagnostic checklist sidebar (1 column) */}
          <div className="glass border-rose-500/15 rounded-3xl p-6 space-y-6 self-start relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 blur-2xl pointer-events-none" />
            <div className="pb-3 border-b border-white/5 space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-rose-400 block font-bold">Sentinel Engine</span>
              <h3 className="font-sans font-bold text-base text-white">Browser Security Core</h3>
              <p className="text-xs text-slate-400">
                Diagnostics regarding browser VPN and device risk index fingerprints.
              </p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400">VPN Proxy scan</span>
                <span className={user.vpn_detected ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {user.vpn_detected ? "WARNING" : "CLEAN"}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400">IP Reputation score</span>
                <span className={user.vpn_detected ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {user.vpn_detected ? "High Risk (92)" : "Excellent (100)"}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400">WebGl Fingerprint</span>
                <span className="text-cyan-400 select-all truncate max-w-[120px]">{user.device_fingerprint}</span>
              </div>

              {user.vpn_detected && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 leading-normal flex gap-2">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>Your profile device has triggered automatic security audits! Disable VPN, Proxy or TOR vectors immediately.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSegment === "settings" && (
        <div className="glass rounded-3xl p-6 lg:p-8 space-y-6">
          <div className="pb-3 border-b border-white/5 space-y-1">
            <h2 className="font-sans font-bold text-lg text-white">Geo Targeting and Device Simulator</h2>
            <p className="text-slate-400 text-xs">
              Test your simulated location parameters to see how surveys and offerwalls respond dynamically based on country parameters!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-sans">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  Change active Simulated Country
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "BD", name: "Bangladesh (BD)", flag: "🇧🇩" },
                    { id: "US", name: "United States (US)", flag: "🇺🇸" },
                    { id: "UK", name: "United Kingdom (UK)", flag: "🇬🇧" },
                    { id: "IS", name: "Iceland (IS) - [Trigger Empty]", flag: "🇮🇸" }
                  ].map((cty) => (
                    <button
                      key={cty.id}
                      onClick={() => setSimulationCountry(cty.id)}
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        simulationCountry === cty.id
                          ? "bg-slate-950 border-cyan-400/80 shadow-[0_0_10px_rgba(6,182,212,0.1)] text-cyan-300 font-semibold"
                          : "bg-slate-900/60 border-white/5 hover:border-white/10 text-slate-400"
                      }`}
                    >
                      <span className="truncate">{cty.flag} {cty.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2 font-mono text-[11px] text-slate-400">
                <div className="text-white font-bold font-sans text-xs mb-1 uppercase tracking-wide">Dynamic Geo-Targeting Rules:</div>
                <p>• BD user: Shows only Bangladesh (BD) eligible surveys/offers.</p>
                <p>• US user: Shows only United States (US) eligible surveys/offers.</p>
                <p>• UK user: Shows only United Kingdom (UK) eligible surveys/offers.</p>
                <p>• IS user: Triggers "No Offers Available In Your Region" (ideal for testing!).</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  Security simulation overrides
                </label>
                <div className="p-5 bg-slate-950/60 border border-white/5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-sans font-semibold text-slate-200 block">VPN Detection Status</span>
                      <span className="text-[10px] text-slate-500 block">{user.vpn_detected ? "VPN detected — managed by admin" : "No VPN detected"}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold ${user.vpn_detected ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                      {user.vpn_detected ? "DETECTED" : "CLEAN"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-sans font-semibold text-slate-200 block">Simulate Admin credentials status</span>
                      <span className="text-[10px] text-slate-500 block">Gives administrator routing panel access</span>
                    </div>

                    <button
                      onClick={() => setUser({ ...user, is_admin: !user.is_admin, role: !user.is_admin ? 'admin' : 'user' })}
                      className={`w-14 h-8 rounded-full p-1 transition-all ${user.is_admin ? "bg-purple-600 text-white flex justify-end" : "bg-slate-800 text-slate-500 flex justify-start"}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-white block" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSegment === "support" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create ticket subform (1 Column) */}
          <div className="glass rounded-3xl p-6 space-y-6">
            <div className="pb-2 border-b border-white/5">
              <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-purple-400" />
                Initiate support ticket
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Having troubles with offers, withdrawals, or browser credentials? Create an audited ticket below.
              </p>
              {isDeveloperMode() && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center gap-2">
                  <span>🔧</span> Support is temporarily disabled — site under development
                </div>
              )}
            </div>

            <form onSubmit={handleCreateTicketInput} className="space-y-4 text-xs font-sans">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Subject theme / Title
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. PayPal withdrawal reviewed delay"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Audits Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400/20 font-sans"
                >
                  <option value="survey-credit">Survey credit issue</option>
                  <option value="billing">Withdrawal / Billing</option>
                  <option value="account">Account credentials</option>
                  <option value="bug-report">Bug report / Feedback</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Core details message
                </label>
                <textarea
                  required
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Provide precise telemetry or offer names so modular review agents can audit correctly."
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 font-bold tracking-wide text-white text-xs hover:scale-[1.01] transition-transform shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Submit Ticket</span>
              </button>
            </form>
          </div>

          {/* Active tickets listings state (1 Column) */}
          <div className="glass rounded-3xl p-6 space-y-4">
            <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Terminal support tickets
            </h3>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 font-mono text-xs"
                >
                  <div className="flex justify-between font-sans font-semibold text-slate-200">
                    <span className="truncate max-w-[180px]">{t.subject}</span>
                    <span className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded-lg ${
                      t.status === "OPEN"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse"
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 uppercase space-y-1">
                    <div>Category: {t.category}</div>
                    <div>Created: {t.created_at}</div>
                  </div>

                  <p className="text-[11px] text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-white/5 font-sans leading-relaxed">
                    {t.message}
                  </p>

                  {t.status === "ANSWERED" && (
                    <div className="bg-cyan-500/5 border border-cyan-500/10 p-3 rounded-xl space-y-1">
                      <span className="text-[9px] text-cyan-400 font-bold uppercase block flex items-center gap-1">
                        🛰️ System response moderator:
                      </span>
                      <p className="text-[11px] text-cyan-200 font-sans leading-relaxed">
                        We scanned CPX logs and applied retroactive balance adjustments to your wallet reserve! Complete secondary checks.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
