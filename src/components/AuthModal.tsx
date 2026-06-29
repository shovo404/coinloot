import React, { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff, Mail, Lock, User, Sparkles, LogIn, UserPlus, CheckCircle } from "lucide-react";
import Loader from "./Loader";
import { UserProfile } from "../types";
import { getSupabaseClient } from "../lib/supabase";
import { signUp, signIn, getProfile, updateProfile } from "../lib/supabaseService";
import { AVATAR_OPTIONS } from "../utils/avatarOptions";
import { getDeviceFingerprint, fetchRegistrationInfo } from "../utils/registrationInfo";

interface StoredAccount { email: string; password: string; username: string; profile: UserProfile; }

function saveToAccounts(email: string, password: string, username: string, profile: UserProfile) {
  const existing = JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
  const idx = existing.findIndex((a: StoredAccount) => a.profile.id === profile.id);
  const entry: StoredAccount = { email, password, username, profile };
  if (idx >= 0) existing[idx] = entry;
  else existing.push(entry);
  localStorage.setItem("coinloot_accounts", JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent("user-registered"));
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (profile: UserProfile) => void;
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
  const [showAvatarSelect, setShowAvatarSelect] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);

  // Attempt to restore session on mount
  useEffect(() => {
    if (!isOpen || !initialLoadRef.current) return;
    initialLoadRef.current = false;

    const restoreSession = async () => {
      const sb = getSupabaseClient();
      if (!sb) return;
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        if (profile) {
          onLogin(profile);
          onClose();
        }
      }
    };
    restoreSession();
  }, [isOpen, onLogin, onClose]);

  // Reset form on close/tab switch
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setUsername("");
      setError("");
      setSuccessMsg("");
      setShowPassword(false);
      setShowAvatarSelect(false);
      setPendingProfile(null);
      setPendingEmail("");
      setPendingPassword("");
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

    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !password) {
        setError("Email and password are required.");
        setLoading(false);
        return;
      }

      if (!getSupabaseClient()) {
        setError("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
        setLoading(false);
        return;
      }
      const data = await signIn(trimmedEmail, password);
      if (data?.user) {
        const profile = await getProfile(data.user.id);
        if (profile) {
          saveToAccounts(trimmedEmail, password, profile.username, profile);
          onLogin(profile);
          onClose();
        } else {
          setError("Account not found. Please contact support.");
        }
      } else {
        setError("Sign in failed. Please check your credentials or try again.");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Please verify your email address before signing in.");
      } else if (msg.toLowerCase().includes("rate limit")) {
        setError("Too many sign-in attempts. Please wait a moment.");
      } else {
        setError(msg || "Sign in failed. Please try again.");
      }
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

    try {
      const signUpResult = await signUp(trimmedEmail, password, trimmedUsername);
      if (!signUpResult) {
        setError("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
        setLoading(false);
        return;
      }

      // Try auto sign-in after registration
      try {
        const data = await signIn(trimmedEmail, password);
        if (data?.user) {
          const profile = await getProfile(data.user.id);
          if (profile) {
            saveToAccounts(trimmedEmail, password, trimmedUsername, profile);
            setSuccessMsg("Account created successfully! Choose your avatar...");
            setPendingProfile(profile);
            setPendingEmail(trimmedEmail);
            setPendingPassword(password);

            // Store registration info (IP, country, ISP, device fingerprint)
            fetchRegistrationInfo().then((geo) => {
              const fingerprint = getDeviceFingerprint();
              updateProfile(profile.id, {
                registration_ip: geo.ip || undefined,
                registration_country: geo.country || undefined,
                registration_isp: geo.isp || undefined,
                device_fingerprint: fingerprint,
              }).catch(() => {});
            });

            setTimeout(() => {
              setShowAvatarSelect(true);
              setLoading(false);
            }, 600);
            return;
          }
        }
      } catch {
        // Auto sign-in may fail if email confirmation is required
        setSuccessMsg("Account created! Please check your email to verify your account before signing in.");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("already registered") || msg.includes("already exists")) {
        setError("An account with this email already exists.");
      } else if (msg.includes("duplicate key") && msg.includes("username")) {
        setError("This username is already taken.");
      } else if (msg.includes("duplicate key") && msg.includes("email")) {
        setError("An account with this email already exists.");
      } else if (msg.toLowerCase().includes("rate limit")) {
        setError("Too many signup attempts. Please wait a minute before trying again.");
      } else {
        setError(msg || "Registration failed. Please try again.");
      }
    }

    setLoading(false);
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    if (!pendingProfile) return;
    setLoading(true);

    try {
      await updateProfile(pendingProfile.id, { avatar_url: avatarUrl });
    } catch {
      // Silently continue even if Supabase update fails
    }

    const updatedProfile: UserProfile = { ...pendingProfile, avatar_url: avatarUrl };

    const accounts: StoredAccount[] = JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
    const updatedAccounts = accounts.map((a) => {
      if (a.profile.id === pendingProfile.id) {
        return { ...a, profile: { ...a.profile, avatar_url: avatarUrl } };
      }
      return a;
    });
    localStorage.setItem("coinloot_accounts", JSON.stringify(updatedAccounts));

    setLoading(false);
    onLogin(updatedProfile);
    onClose();
  };

  const handleSkipAvatar = () => {
    if (!pendingProfile) return;
    onLogin(pendingProfile);
    onClose();
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
        <div className="relative flex items-center justify-between p-4 sm:p-6 pb-4 border-b border-white/5">
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
        {!showAvatarSelect && (
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
        )}

        {/* Avatar Selection */}
        {showAvatarSelect && pendingProfile && (
          <div className="p-6 space-y-5 animate-fade-in overflow-y-auto">
            <div className="text-center">
              <h2 className="font-sans font-bold text-lg text-white">Choose Your Avatar</h2>
              <p className="text-xs text-slate-400 mt-1">Pick an avatar or skip to use your initial</p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-h-[320px] overflow-y-auto pr-1">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => handleSelectAvatar(avatar.svg)}
                  className="group relative rounded-2xl overflow-hidden border-2 border-transparent hover:border-cyan-400 hover:scale-105 transition-all duration-200 bg-white/5 hover:bg-white/10"
                  title={avatar.name}
                >
                  <img src={avatar.svg} alt={avatar.name} className="w-full h-auto" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl">
                    <CheckCircle className="w-8 h-8 text-cyan-400 drop-shadow-lg" />
                  </div>
                  <span className="block text-[9px] text-center text-slate-500 font-mono mt-0.5 pb-1">{avatar.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkipAvatar}
                className="flex-1 py-3 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-xs font-semibold"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => handleSelectAvatar(pendingProfile.avatar_url || AVATAR_OPTIONS[0].svg)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/10 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Continue
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!showAvatarSelect && (
        <form onSubmit={activeTab === "signin" ? handleSignIn : handleSignUp} className="p-4 sm:p-6 pt-4 space-y-4 overflow-y-auto">
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
              {activeTab === "signup" && email.includes("@") && !email.includes(".") && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-white/5 rounded-xl overflow-hidden shadow-xl shadow-black/40">
                  {["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "protonmail.com"].map((domain) => {
                    const full = email.split("@")[0] + "@" + domain;
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => setEmail(full)}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:bg-cyan-500/10 hover:text-white transition-all font-mono flex items-center gap-2"
                      >
                        <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                        {full}
                      </button>
                    );
                  })}
                </div>
              )}
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
                <Loader size="xs" />
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
        )}
      </div>
    </div>
  );
}
