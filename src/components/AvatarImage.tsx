import { getAvatarById, AVATAR_OPTIONS } from "../utils/avatarOptions";

interface Props {
  avatarId?: string | null;
  avatarUrl?: string | null;
  username?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 min-w-[32px] min-h-[32px]",
  md: "w-10 h-10 min-w-[40px] min-h-[40px]",
  lg: "w-14 h-14 min-w-[56px] min-h-[56px]",
  xl: "w-20 h-20 min-w-[80px] min-h-[80px]",
};

const svgSizeMap = {
  sm: 40,
  md: 50,
  lg: 70,
  xl: 100,
};

export default function AvatarImage({ avatarId, avatarUrl, username, size = "md", className = "" }: Props) {
  // 1. Preset avatar by ID
  if (avatarId) {
    const preset = getAvatarById(avatarId);
    if (preset) {
      const s = svgSizeMap[size];
      const svg = preset.svg
        .replace('width="200"', `width="${s}"`)
        .replace('height="200"', `height="${s}"`);
      return (
        <div
          className={`rounded-xl overflow-hidden shrink-0 ${sizeMap[size]} ${className}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      );
    }
  }

  // 2. Custom image URL (uploaded avatar)
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username || "Avatar"}
        className={`rounded-xl object-cover shrink-0 ${sizeMap[size]} ${className}`}
      />
    );
  }

  // 3. Fallback — gradient initial
  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shrink-0 ${sizeMap[size]} ${className}`}
      title={username || "User"}
    >
      <span className={size === "sm" ? "text-sm" : size === "md" ? "text-base" : size === "lg" ? "text-xl" : "text-3xl"}>
        {(username || "U")[0].toUpperCase()}
      </span>
    </div>
  );
}
