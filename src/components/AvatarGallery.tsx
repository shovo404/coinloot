import { useState, useMemo } from "react";
import { Search, X, Sparkles, Check } from "lucide-react";
import { AVATAR_OPTIONS, AVATAR_CATEGORIES, type AvatarOption } from "../utils/avatarOptions";

interface Props {
  currentAvatarId?: string;
  onSelect: (avatar: AvatarOption) => void;
  onClose: () => void;
}

export default function AvatarGallery({ currentAvatarId, onSelect, onClose }: Props) {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = AVATAR_OPTIONS;
    if (category !== "all") result = result.filter(a => a.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
    }
    return result;
  }, [category, search]);

  const categories = [
    { id: "all", label: "All", icon: "✨" },
    ...AVATAR_CATEGORIES,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-950 border border-white/5 rounded-3xl overflow-hidden animate-zoom-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Choose Avatar</h2>
              <p className="text-[9px] text-slate-500 font-mono">Pick a premium avatar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 sm:px-5 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search avatars..."
              className="w-full bg-slate-900 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/20 font-mono"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 sm:px-5 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 min-w-max">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  category === c.id
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-400 hover:text-white bg-slate-900/40 border border-transparent hover:border-white/5"
                }`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-5">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs text-slate-500 font-mono">No avatars found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {filtered.map(avatar => {
                const isSelected = avatar.id === currentAvatarId;
                const isHovered = hoveredId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => onSelect(avatar)}
                    onMouseEnter={() => setHoveredId(avatar.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`relative rounded-2xl p-2 transition-all duration-300 cursor-pointer group ${
                      isSelected
                        ? "bg-cyan-500/10 border-2 border-cyan-400/40"
                        : "bg-slate-900/40 border border-white/5 hover:border-cyan-400/30 hover:bg-slate-900/60"
                    }`}
                  >
                    <div
                      className={`w-full aspect-square rounded-xl overflow-hidden transition-transform duration-300 ${isHovered ? "scale-105" : ""}`}
                      dangerouslySetInnerHTML={{
                        __html: avatar.svg
                          .replace('width="200"', 'width="100"')
                          .replace('height="200"', 'height="100"'),
                      }}
                    />
                    <p className="text-[8px] text-slate-400 font-mono text-center mt-1.5 truncate">{avatar.name}</p>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
