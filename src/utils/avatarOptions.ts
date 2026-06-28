export interface AvatarOption {
  id: string;
  name: string;
  svg: string;
}

function c(g1: string, g2: string, content: string): string {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${g1}"/><stop offset="100%" stop-color="${g2}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#bg)"/>
    ${content}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(raw)}`;
}

function face(skin: string): string {
  return `<ellipse cx="50" cy="48" rx="24" ry="26" fill="${skin}"/>`;
}

function eyes(x1 = 40, y1 = 44, x2 = 60, y2 = 44): string {
  return `<circle cx="${x1}" cy="${y1}" r="2.8" fill="#1a1a2e"/><circle cx="${x2}" cy="${y2}" r="2.8" fill="#1a1a2e"/>`;
}

function smile(): string {
  return `<path d="M43,55 Q50,61 57,55" fill="none" stroke="#1a1a2e" stroke-width="1.8" stroke-linecap="round"/>`;
}

function shoulder(skin: string): string {
  return `<path d="M28,78 Q50,84 72,78 L76,96 L24,96 Z" fill="${skin}" opacity="0.5"/>`;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: "queen",
    name: "Queen",
    svg: c("#8B5CF6", "#EC4899",
      shoulder("#FFD6BA") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#FFD6BA"/>` +
      face("#FFD6BA") +
      // Hair
      `<path d="M26,48 Q26,18 50,16 Q74,18 74,48 Q76,28 70,20 Q60,10 50,12 Q40,10 30,20 Q24,28 26,48 Z" fill="#2D1B14"/>
       <path d="M26,48 Q24,60 28,70 Q22,62 22,48 Z" fill="#2D1B14"/>
       <path d="M74,48 Q76,60 72,70 Q78,62 78,48 Z" fill="#2D1B14"/>` +
      eyes() + smile() +
      // Crown
      `<path d="M28,22 L34,10 L40,18 L50,8 L60,18 L66,10 L72,22 L74,24 L26,24 Z" fill="#F59E0B" stroke="#fff" stroke-width="1.2"/>
       <circle cx="34" cy="18" r="2" fill="#EF4444"/>
       <circle cx="50" cy="15" r="2.5" fill="#3B82F6"/>
       <circle cx="66" cy="18" r="2" fill="#10B981"/>
       <circle cx="50" cy="22" r="1.5" fill="#fff"/>`
    ),
  },
  {
    id: "astro",
    name: "Astronaut",
    svg: c("#1E3A5F", "#0EA5E9",
      shoulder("#B8D4E8") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#B8D4E8"/>` +
      // Helmet
      `<circle cx="50" cy="44" r="30" fill="#E2E8F0" stroke="#94A3B8" stroke-width="3"/>` +
      // Visor
      `<circle cx="50" cy="44" r="21" fill="#1E3A5F"/>
       <ellipse cx="56" cy="40" rx="8" ry="12" fill="#0EA5E9" opacity="0.5"/>
       <path d="M42,32 Q50,28 58,32" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.4"/>` +
      // Eyes inside visor
      `<circle cx="44" cy="44" r="2.5" fill="#fff"/><circle cx="56" cy="44" r="2.5" fill="#fff"/>` +
      // Antenna
      `<line x1="50" y1="14" x2="50" y2="6" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>
       <circle cx="50" cy="5" r="3" fill="#EF4444"/>`
    ),
  },
  {
    id: "ninja",
    name: "Ninja",
    svg: c("#DC2626", "#7C3AED",
      shoulder("#2D1B14") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#2D1B14"/>` +
      // Head
      `<circle cx="50" cy="48" r="24" fill="#2D1B14"/>` +
      // Ninja mask (lower face)
      `<path d="M26,44 Q26,72 50,72 Q74,72 74,44 L74,52 Q74,70 50,72 Q26,70 26,52 Z" fill="#1a1a2e"/>` +
      // Eyes (visible through mask)
      `<circle cx="40" cy="44" r="3" fill="#fff"/><circle cx="60" cy="44" r="3" fill="#fff"/>` +
      `<circle cx="40" cy="44" r="1.5" fill="#111"/><circle cx="60" cy="44" r="1.5" fill="#111"/>` +
      // Headband
      `<path d="M22,36 Q50,32 78,36 L78,40 Q50,36 22,40 Z" fill="#DC2626"/>
       <path d="M22,36 Q10,30 8,26 Q6,22 12,24 Q16,28 22,36 Z" fill="#DC2626"/>
       <path d="M78,36 Q90,30 92,26 Q94,22 88,24 Q84,28 78,36 Z" fill="#DC2626"/>`
    ),
  },
  {
    id: "wizard",
    name: "Wizard",
    svg: c("#6D28D9", "#A855F7",
      shoulder("#FFD6BA") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#FFD6BA"/>` +
      face("#FFD6BA") +
      // Beard
      `<path d="M38,56 Q36,68 42,74 Q50,78 58,74 Q64,68 62,56 Z" fill="#E2E8F0"/>` +
      eyes() +
      // Wizard hat
      `<path d="M28,28 L50,6 L72,28 L76,30 L24,30 Z" fill="#4C1D95"/>
       <rect x="24" y="28" width="52" height="6" rx="3" fill="#4C1D95"/>
       <path d="M24,30 Q18,34 20,38 Q22,42 28,36 Q24,34 24,30 Z" fill="#4C1D95"/>
       <path d="M76,30 Q82,34 80,38 Q78,42 72,36 Q76,34 76,30 Z" fill="#4C1D95"/>` +
      // Stars on hat
      `<polygon points="50,14 52,20 58,20 53,24 55,30 50,26 45,30 47,24 42,20 48,20" fill="#FDE047" opacity="0.8"/>
       <polygon points="38,22 39,25 42,25 40,27 41,30 38,28 35,30 36,27 34,25 37,25" fill="#FDE047" opacity="0.6"/>
       <polygon points="62,22 63,25 66,25 64,27 65,30 62,28 59,30 60,27 58,25 61,25" fill="#FDE047" opacity="0.6"/>`
    ),
  },
  {
    id: "superhero",
    name: "Superhero",
    svg: c("#2563EB", "#DC2626",
      shoulder("#FFD6BA") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#FFD6BA"/>` +
      face("#FFD6BA") + eyes() + smile() +
      // Mask
      `<path d="M26,40 Q50,34 74,40 L74,46 Q50,42 26,46 Z" fill="#DC2626"/>
       <path d="M26,40 L20,36 Q18,34 22,34 L28,38 Z" fill="#DC2626"/>
       <path d="M74,40 L80,36 Q82,34 78,34 L72,38 Z" fill="#DC2626"/>` +
      // Cape hint
      `<path d="M30,78 Q20,88 18,96 L82,96 Q80,88 70,78 Z" fill="#2563EB" opacity="0.6"/>`
    ),
  },
  {
    id: "pirate",
    name: "Pirate",
    svg: c("#92400E", "#D97706",
      shoulder("#F5C5A3") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#F5C5A3"/>` +
      face("#F5C5A3") +
      // Hair
      `<path d="M26,46 Q28,22 50,18 Q72,22 74,46 Q76,30 70,22 Q60,14 50,16 Q40,14 30,22 Q24,30 26,46 Z" fill="#1a1a2e"/>` +
      // Eye patch
      `<circle cx="60" cy="44" r="6" fill="#1a1a2e"/>
       <line x1="54" y1="38" x2="64" y2="52" stroke="#1a1a2e" stroke-width="1.5"/>
       <circle cx="40" cy="44" r="2.5" fill="#1a1a2e"/>` +
      // Smile with tooth
      `<path d="M42,55 Q50,61 58,55" fill="none" stroke="#1a1a2e" stroke-width="1.8" stroke-linecap="round"/>` +
      // Pirate hat
      `<path d="M20,24 Q50,8 80,24 L82,28 L18,28 Z" fill="#1a1a2e"/>
       <path d="M22,26 Q50,14 78,26" fill="none" stroke="#D97706" stroke-width="1.5"/>
       <circle cx="50" cy="22" r="3" fill="#FDE047"/>` +
      // Beard
      `<path d="M38,56 Q36,66 42,70 Q50,72 58,70 Q64,66 62,56 Z" fill="#1a1a2e" opacity="0.7"/>`
    ),
  },
  {
    id: "samurai",
    name: "Samurai",
    svg: c("#991B1B", "#DC2626",
      shoulder("#F5C5A3") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#F5C5A3"/>` +
      face("#F5C5A3") +
      // Hair topknot
      `<path d="M30,40 Q32,18 50,14 Q68,18 70,40 Q72,24 66,16 Q58,8 50,10 Q42,8 34,16 Q28,24 30,40 Z" fill="#1a1a2e"/>
       <circle cx="50" cy="12" r="8" fill="#1a1a2e"/>
       <path d="M50,4 L54,10 L50,14 L46,10 Z" fill="#1a1a2e"/>` +
      eyes() +
      // Fierce mouth
      `<path d="M42,56 L58,56" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"/>` +
      // Helmet crest
      `<path d="M30,24 L35,8 L50,4 L65,8 L70,24 Z" fill="#B45309" stroke="#FDE047" stroke-width="1"/>
       <circle cx="50" cy="14" r="3" fill="#FDE047"/>`
    ),
  },
  {
    id: "detective",
    name: "Detective",
    svg: c("#1E293B", "#475569",
      shoulder("#F5C5A3") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#F5C5A3"/>` +
      face("#F5C5A3") +
      // Hair
      `<path d="M26,46 Q28,24 50,20 Q72,24 74,46 Q76,28 68,18 Q58,12 50,14 Q42,12 32,18 Q24,28 26,46 Z" fill="#4A3728"/>` +
      // Glasses
      `<circle cx="40" cy="44" r="7" fill="none" stroke="#1a1a2e" stroke-width="1.8"/>
       <circle cx="60" cy="44" r="7" fill="none" stroke="#1a1a2e" stroke-width="1.8"/>
       <line x1="47" y1="44" x2="53" y2="44" stroke="#1a1a2e" stroke-width="1.8"/>` +
      `<circle cx="40" cy="44" r="2" fill="#1a1a2e"/><circle cx="60" cy="44" r="2" fill="#1a1a2e"/>` +
      smile() +
      // Fedora hat
      `<ellipse cx="50" cy="26" rx="32" ry="6" fill="#4A3728"/>
       <path d="M26,26 Q30,12 50,10 Q70,12 74,26 Z" fill="#4A3728"/>
       <rect x="44" y="10" width="12" height="4" rx="2" fill="#2D1B14"/>` +
      // Mustache
      `<path d="M38,54 Q44,52 50,54 Q56,52 62,54" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round"/>`
    ),
  },
  {
    id: "chef",
    name: "Chef",
    svg: c("#EA580C", "#F97316",
      shoulder("#FFD6BA") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#FFD6BA"/>` +
      face("#FFD6BA") +
      // Hair
      `<path d="M26,46 Q28,24 50,20 Q72,24 74,46 Q76,28 68,18 Q58,12 50,14 Q42,12 32,18 Q24,28 26,46 Z" fill="#E2E8F0"/>` +
      eyes() + smile() +
      // Chef hat
      `<rect x="30" y="14" width="40" height="20" rx="10" fill="#fff" stroke="#CBD5E1" stroke-width="1.5"/>
       <rect x="35" y="12" width="30" height="6" rx="3" fill="#fff" stroke="#CBD5E1" stroke-width="1.5"/>
       <path d="M32,20 Q28,28 30,34 L70,34 Q72,28 68,20" fill="none" stroke="#CBD5E1" stroke-width="1.5"/>
       <line x1="50" y1="14" x2="50" y2="18" stroke="#CBD5E1" stroke-width="1"/>
       <line x1="40" y1="14" x2="40" y2="18" stroke="#CBD5E1" stroke-width="1"/>
       <line x1="60" y1="14" x2="60" y2="18" stroke="#CBD5E1" stroke-width="1"/>`
    ),
  },
  {
    id: "artist",
    name: "Artist",
    svg: c("#EC4899", "#F472B6",
      shoulder("#FFD6BA") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#FFD6BA"/>` +
      face("#FFD6BA") +
      // Hair
      `<path d="M26,46 Q26,20 50,16 Q74,20 74,46 Q76,22 66,12 Q56,8 50,10 Q44,8 34,12 Q24,22 26,46 Z" fill="#D4A017"/>` +
      // Glasses
      `<circle cx="40" cy="44" r="6" fill="none" stroke="#1a1a2e" stroke-width="1.5"/>
       <circle cx="60" cy="44" r="6" fill="none" stroke="#1a1a2e" stroke-width="1.5"/>
       <line x1="46" y1="44" x2="54" y2="44" stroke="#1a1a2e" stroke-width="1.5"/>` +
      `<circle cx="40" cy="44" r="2" fill="#1a1a2e"/><circle cx="60" cy="44" r="2" fill="#1a1a2e"/>` +
      smile() +
      // Beret
      `<ellipse cx="50" cy="18" rx="22" ry="8" fill="#EF4444"/>
       <circle cx="50" cy="14" r="4" fill="#EF4444"/>
       <path d="M34,22 Q30,20 32,16 Q36,18 34,22 Z" fill="#EF4444"/>` +
      // Paint palette
      `<ellipse cx="60" cy="72" rx="10" ry="6" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/>
       <circle cx="56" cy="70" r="2" fill="#3B82F6"/>
       <circle cx="64" cy="70" r="2" fill="#EF4444"/>
       <circle cx="60" cy="74" r="2" fill="#F59E0B"/>`
    ),
  },
  {
    id: "viking",
    name: "Viking",
    svg: c("#374151", "#6B7280",
      shoulder("#F5C5A3") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#F5C5A3"/>` +
      face("#F5C5A3") +
      // Hair
      `<path d="M28,44 Q30,18 50,14 Q70,18 72,44 Q74,22 66,14 Q56,8 50,10 Q44,8 34,14 Q26,22 28,44 Z" fill="#B8860B"/>` +
      // Beard
      `<path d="M36,56 Q34,72 42,76 Q50,80 58,76 Q66,72 64,56 Z" fill="#B8860B"/>` +
      eyes() +
      `<path d="M42,58 L58,58" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"/>` +
      // Horned helmet
      `<path d="M26,28 Q48,16 74,28 L76,32 L24,32 Z" fill="#4B5563"/>
       <rect x="24" y="28" width="52" height="6" rx="2" fill="#4B5563"/>
       <path d="M26,30 L12,14 L18,10 L30,24 Z" fill="#4B5563"/>
       <path d="M74,30 L88,14 L82,10 L70,24 Z" fill="#4B5563"/>
       <circle cx="50" cy="30" r="4" fill="#FDE047" opacity="0.8"/>`
    ),
  },
  {
    id: "robot",
    name: "Robot",
    svg: c("#0891B2", "#06B6D4",
      shoulder("#94A3B8") +
      `<rect x="44" y="66" width="12" height="10" rx="3" fill="#94A3B8"/>` +
      // Robot head
      `<rect x="26" y="22" width="48" height="44" rx="8" fill="#CBD5E1" stroke="#94A3B8" stroke-width="2"/>` +
      // Antenna
      `<line x1="50" y1="22" x2="50" y2="12" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
       <circle cx="50" cy="10" r="4" fill="#EF4444"/>` +
      // Eyes (LED style)
      `<rect x="34" y="36" width="10" height="8" rx="3" fill="#0EA5E9"/>
       <rect x="56" y="36" width="10" height="8" rx="3" fill="#0EA5E9"/>` +
      `<rect x="36" y="38" width="6" height="4" rx="1" fill="#fff" opacity="0.6"/>
       <rect x="58" y="38" width="6" height="4" rx="1" fill="#fff" opacity="0.6"/>` +
      // Mouth (speaker grill)
      `<rect x="38" y="52" width="24" height="4" rx="2" fill="#475569"/>
       <rect x="38" y="50" width="24" height="8" rx="2" fill="none" stroke="#475569" stroke-width="1"/>` +
      // Ears
      `<rect x="18" y="38" width="8" height="12" rx="2" fill="#94A3B8"/>
       <rect x="74" y="38" width="8" height="12" rx="2" fill="#94A3B8"/>` +
      // Body panel
      `<path d="M32,64 L32,80 L68,80 L68,64" fill="none" stroke="#94A3B8" stroke-width="2" opacity="0.5"/>`
    ),
  },
];

export function getAvatarById(id: string): AvatarOption | undefined {
  return AVATAR_OPTIONS.find((a) => a.id === id);
}
