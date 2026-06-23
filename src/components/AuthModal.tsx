import React, { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff, Mail, Lock, User, Sparkles, LogIn, UserPlus } from "lucide-react";
import { UserProfile } from "../types";
import { notifyRegistration } from "../utils/adminNotifier";
import { sendTelegramNotification } from "../utils/telegramNotify";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (profile: UserProfile) => void;
}

interface StoredAccount {
  email: string;
  password: string;
  username: string;
  profile: UserProfile;
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Load accounts from localStorage (with default admin seeded)
  const getAccounts = (): StoredAccount[] => {
    try {
      const raw = localStorage.getItem("coinloot_accounts");
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure admin account exists and has correct role
        const adminIdx = parsed.findIndex((a: StoredAccount) => a.email === "coinlootadmin@gmail.com");
        if (adminIdx >= 0) {
          // Migrate any stale admin role (e.g. SUPER_ADMIN) to current ADMIN
          const stored = parsed[adminIdx];
          if (stored.profile.is_admin && stored.profile.admin_role && stored.profile.admin_role !== 'ADMIN') {
            stored.profile.admin_role = 'ADMIN';
            parsed[adminIdx] = stored;
            localStorage.setItem("coinloot_accounts", JSON.stringify(parsed));
          }
        } else {
          // Admin account missing — reseed it
          const adminProfile: UserProfile = {
            id: `u-admin-${Math.random().toString(36).substring(2, 10)}`,
            username: "SuperAdmin",
            email: "coinlootadmin@gmail.com",
            balance_coins: 0,
            balance_usd: 0.00,
            xp: 0,
            level: 1,
            streak_days: 0,
            referred_by: null,
            referrals_count: 0,
            total_earned_coins: 0,
            total_withdrawn_usd: 0,
            kyc_status: "APPROVED",
            is_admin: true,
            admin_role: "ADMIN",
            vpn_detected: false,
            device_fingerprint: `ADMIN-GPU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          };
          parsed.push({
            email: "coinlootadmin@gmail.com",
            password: "Coinloot@#admin@#",
            username: "SuperAdmin",
            profile: adminProfile,
          });
          localStorage.setItem("coinloot_accounts", JSON.stringify(parsed));
        }
        return parsed;
      }
      // First run — create admin account
      const adminProfile: UserProfile = {
        id: `u-admin-${Math.random().toString(36).substring(2, 10)}`,
        username: "SuperAdmin",
        email: "coinlootadmin@gmail.com",
        balance_coins: 0,
        balance_usd: 0.00,
        xp: 0,
        level: 1,
        streak_days: 0,
        referred_by: null,
        referrals_count: 0,
        total_earned_coins: 0,
        total_withdrawn_usd: 0,
        kyc_status: "APPROVED",
        is_admin: true,
        admin_role: "ADMIN",
        vpn_detected: false,
        device_fingerprint: `ADMIN-GPU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      };
      const initialAccounts = [{
        email: "coinlootadmin@gmail.com",
        password: "Coinloot@#admin@#",
        username: "SuperAdmin",
        profile: adminProfile,
      }];
      localStorage.setItem("coinloot_accounts", JSON.stringify(initialAccounts));
      return initialAccounts;
    } catch {
      return [];
    }
  };

  // Save accounts to localStorage
  const saveAccounts = (accounts: StoredAccount[]) => {
    localStorage.setItem("coinloot_accounts", JSON.stringify(accounts));
  };

  // Reset form on close/tab switch
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setUsername("");
      setError("");
      setSuccessMsg("");
      setShowPassword(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    const accounts = getAccounts();
    const account = accounts.find(
      (a) => a.email === email.trim().toLowerCase() && a.password === password
    );

    if (account) {
      onLogin(account.profile);
      onClose();
    } else {
      setError("Invalid email or password. Please try again.");
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    if (!trimmedEmail || !password || !trimmedUsername) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    const accounts = getAccounts();

    // Check if email already exists
    if (accounts.some((a) => a.email === trimmedEmail)) {
      setError("An account with this email already exists.");
      setLoading(false);
      return;
    }

    // Check if username already exists
    if (accounts.some((a) => a.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      setError("This username is already taken.");
      setLoading(false);
      return;
    }

    // Create new profile
    const newProfile: UserProfile = {
      id: `u-${Math.random().toString(36).substring(2, 10)}`,
      username: trimmedUsername,
      email: trimmedEmail,
      balance_coins: 0,
      balance_usd: 0.00,
      xp: 0,
      level: 1,
      streak_days: 0,
      referred_by: null,
      referrals_count: 0,
      total_earned_coins: 0,
      total_withdrawn_usd: 0,
      kyc_status: "NOT_STARTED",
      is_admin: false,
      vpn_detected: false,
      device_fingerprint: `GPU-WEBGL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    };

    const newAccount: StoredAccount = {
      email: trimmedEmail,
      password,
      username: trimmedUsername,
      profile: newProfile,
    };

    saveAccounts([...accounts, newAccount]);

    notifyRegistration(newProfile.id, trimmedUsername, trimmedEmail, "");

    setSuccessMsg("Account created successfully! Signing you in...");
    setTimeout(() => {
      onLogin(newProfile);
      onClose();
    }, 800);

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full sm:max-w-md bg-slate-950 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-zoom-in max-h-[90vh] sm:max-h-auto flex flex-col"
      >
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-sans font-bold text-sm text-white block">Coin Loot</span>
              <span className="text-[8px] font-mono tracking-[3px] text-purple-400 uppercase font-semibold leading-none">
                {activeTab === "signin" ? "WELCOME BACK" : "JOIN THE NETWORK"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mx-6 mt-5 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          {[
            { id: "signin" as const, label: "Sign In", icon: LogIn },
            { id: "signup" as const, label: "Sign Up", icon: UserPlus },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setError("");
                  setSuccessMsg("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={activeTab === "signin" ? handleSignIn : handleSignUp} className="p-6 pt-4 space-y-4">
          {/* Username field (Sign Up only) */}
          {activeTab === "signup" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3" /> Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full bg-slate-900 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all pl-9 pr-20"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <button
                  type="button"
                  onClick={() => {
                    const adj = ["Neon","Crypto","Cyber","Pixel","Nitro","Aero","Flux","Void","Zen","Blaze","Arctic","Omega","Nova","Echo","Phantom","Solar","Lunar","Storm","Ghost","Frost"];
                    const noun = ["Wolf","Hawk","Phoenix","Dragon","Ninja","Titan","Raven","Cipher","Spectre","Viper","Jedi","Nomad","Pulse","Drift","Vertex","Fury","Apex","Blade","Crest","Rogue"];
                    setUsername(`${adj[Math.floor(Math.random()*adj.length)]}${noun[Math.floor(Math.random()*noun.length)]}${Math.floor(Math.random()*999)}`);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/25 text-[9px] font-bold text-cyan-300 hover:from-cyan-500/30 hover:to-purple-600/30 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 inline mr-0.5" />
                  Random
                </button>
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-900 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all pl-9"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={activeTab === "signin" ? "Enter your password" : "Create a password (min. 6 chars)"}
                className="w-full bg-slate-900 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all pl-9 pr-9"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 leading-relaxed text-center">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 leading-relaxed text-center">
              {successMsg}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/10 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {activeTab === "signin" ? "Authenticating..." : "Creating account..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {activeTab === "signin" ? (
                  <><LogIn className="w-3.5 h-3.5" /> Sign In</>
                ) : (
                  <><UserPlus className="w-3.5 h-3.5" /> Create Account</>
                )}
              </span>
            )}
          </button>

          {/* Footer text */}
          <p className="text-[10px] font-mono text-slate-500 text-center leading-relaxed pt-2">
            {activeTab === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("signup");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("signin");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
