import React, { useState, useRef, useEffect } from "react";
import { Save, User, Mail, Lock, Bell, Palette, Globe, Camera, Trash2, Upload, CheckCircle, AlertCircle, Eye, EyeOff, MapPin } from "lucide-react";
import { UserProfile } from "../types";
import { applyTheme, applyLanguage, loadPreferences, savePreferences, listenForSystemTheme } from "../utils/themeUtils";

interface AccountSettingsPageProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  simulationCountry: string;
  setSimulationCountry: (country: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────

export default function AccountSettingsPage({ user, setUser, simulationCountry, setSimulationCountry }: AccountSettingsPageProps) {
  const [fullName, setFullName] = useState(user.username);
  const [username, setUsername] = useState(user.username);
  const [country, setCountry] = useState(simulationCountry);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState(user.email);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Load saved preferences from profile or localStorage
  const savedPrefs = loadPreferences();
  const [theme, setTheme] = useState(user.preference_theme || savedPrefs.theme);
  const [language, setLanguage] = useState(user.preference_language || savedPrefs.language);

  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);
  const [langSaved, setLangSaved] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
    applyLanguage(language);
  }, [theme, language]);

  // Listen for system theme changes when set to "system"
  useEffect(() => {
    if (theme !== "system") return;
    return listenForSystemTheme();
  }, [theme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setThemeSaved(false);
    // Apply theme immediately
    applyTheme(newTheme);
    // Save immediately to localStorage for instant persistence
    savePreferences(newTheme, language);
    // Update user profile
    const updatedProfile = { ...user, preference_theme: newTheme, preference_language: language };
    setUser(updatedProfile);
    // Show success briefly
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setLangSaved(false);
    // Apply language attribute immediately
    applyLanguage(newLang);
    // Save immediately
    savePreferences(theme, newLang);
    const updatedProfile = { ...user, preference_theme: theme, preference_language: newLang };
    setUser(updatedProfile);
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload JPG, PNG, or WEBP format images only.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = () => {
    setError("");
    setSaved(false);
    setSaving(true);

    // Validate
    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters.");
      setSaving(false);
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      setSaving(false);
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setSaving(false);
      return;
    }

    setTimeout(() => {
      const updatedProfile = {
        ...user,
        username: username.trim(),
        email: newEmail || user.email,
        balance_usd: user.balance_coins / 1000,
        // Include theme and language in the profile update
        preference_theme: theme,
        preference_language: language,
      };

      // Save preferences to localStorage
      savePreferences(theme, language);

      // Apply theme
      applyTheme(theme);

      // Update profile in state (triggers localStorage save via App's useEffect)
      setUser(updatedProfile);

      // Update accounts in localStorage for auth
      const accounts = JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
      const updatedAccounts = accounts.map((a: any) => {
        if (a.email === user.email || a.email === newEmail) {
          return {
            ...a,
            email: newEmail || a.email,
            username: username.trim(),
            password: newPassword || a.password,
            profile: {
              ...a.profile,
              username: username.trim(),
              email: newEmail || a.email,
              preference_theme: theme,
              preference_language: language,
            },
          };
        }
        return a;
      });
      localStorage.setItem("coinloot_accounts", JSON.stringify(updatedAccounts));

      setSimulationCountry(country);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-3">
          <User className="w-6 h-6 text-purple-400" />
          Account Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account details, security, and preferences.</p>
      </div>

      {/* Profile Picture */}
      <div className="glass rounded-3xl p-6 space-y-5">
        <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400" /> Profile Picture
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-5xl shadow-lg overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white">{user.username[0].toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-lg"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all text-xs font-semibold flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Image
            </button>
            {avatarPreview && (
              <button
                onClick={handleRemoveAvatar}
                className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-semibold flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <p className="w-full text-[10px] text-slate-500 font-mono mt-1">Supports JPG, PNG, WEBP. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="glass rounded-3xl p-6 space-y-5">
        <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              placeholder="Your username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
            >
              <option value="BD">🇧🇩 Bangladesh (BD)</option>
              <option value="US">🇺🇸 United States (US)</option>
              <option value="UK">🇬🇧 United Kingdom (UK)</option>
              <option value="IS">🇮🇸 Iceland (IS)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="glass rounded-3xl p-6 space-y-5">
        <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" /> Security
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Current Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              placeholder="Leave blank to keep current"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">New Password</label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all pr-9"
                placeholder="Min. 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Confirm New Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              placeholder="Confirm new password"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass rounded-3xl p-6 space-y-5">
        <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" /> Notification Preferences
        </h3>
        <div className="space-y-4">
          {[
            { label: "Email Notifications", desc: "Receive earnings updates and offers via email", val: emailNotifications, set: setEmailNotifications },
            { label: "Push Notifications", desc: "Receive browser push notifications for earnings", val: pushNotifications, set: setPushNotifications },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-white block">{item.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">{item.desc}</span>
              </div>
              <button
                onClick={() => item.set(!item.val)}
                className={`w-12 h-7 rounded-full p-1 transition-all ${item.val ? "bg-cyan-500 flex justify-end" : "bg-slate-800 flex justify-start"}`}
              >
                <span className="w-5 h-5 rounded-full bg-white block" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences - Theme & Language */}
      <div className="glass rounded-3xl p-6 space-y-5">
        <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-400" /> Preferences
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Theme</label>
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="dark">🌙 Dark Mode</option>
              <option value="light">☀️ Light Mode</option>
              <option value="system">💻 System Default</option>
            </select>
            {themeSaved && (
              <p className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Theme updated instantly
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Language</label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="en">🇺🇸 English</option>
              <option value="bn">🇧🇩 বাংলা (Bengali)</option>
            </select>
            {langSaved && (
              <p className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Language updated instantly
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Save & Status */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          ✅ Preferences Updated Successfully — Settings saved and applied.
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/10 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
      >
        {saving ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
        ) : (
          <><Save className="w-4 h-4" /> Save All Changes</>
        )}
      </button>
    </div>
  );
}
