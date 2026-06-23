export function isDeveloperMode(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem("coinloot_site_settings") || "{}");
    return s.developerMode === true;
  } catch {
    return false;
  }
}

export default function DeveloperModeBanner() {
  const enabled = isDeveloperMode();
  if (!enabled) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-600/90 via-yellow-500/90 to-amber-600/90 backdrop-blur-md border-b border-amber-400/30 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
      <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-center">
        <span className="text-lg animate-pulse">🔧</span>
        <div>
          <span className="text-xs font-bold text-white tracking-wide">Website Under Development</span>
          <span className="text-[10px] text-amber-100 block sm:inline sm:ml-2">Offers, withdrawals &amp; support are temporarily disabled</span>
        </div>
        <span className="text-lg animate-pulse">🔧</span>
      </div>
    </div>
  );
}
