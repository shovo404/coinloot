export interface AvatarOption {
  id: string;
  name: string;
  category: "male" | "female" | "gaming" | "anime" | "cyberpunk" | "business" | "premium";
  svg: string;
  colors: [string, string];
}

function a(id: string, name: string, category: AvatarOption["category"], colors: [string, string], svg: string): AvatarOption {
  return { id, name, category, svg, colors };
}

const glowFilter = `<filter id="g"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const neonFilter = `<filter id="n"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

function avatarFrame(content: string, style: string = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      ${glowFilter}
      ${neonFilter}
    </defs>
    <style>
      @keyframes r{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes rv{from{transform:rotate(360deg)}to{transform:rotate(0deg)}}
      @keyframes p{0%,100%{opacity:0.3;transform:translateY(0)}50%{opacity:0.8;transform:translateY(-6px)}}
      @keyframes p2{0%,100%{opacity:0.2;transform:translateY(0)}50%{opacity:0.6;transform:translateY(4px)}}
      @keyframes g{0%{stop-color:var(--c1)}50%{stop-color:var(--c2)}100%{stop-color:var(--c1)}}
      @keyframes s{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
      @keyframes f{0%{opacity:0.4;transform:translateX(0)}50%{opacity:0.9;transform:translateX(8px)}100%{opacity:0.4;transform:translateX(0)}}
      ${style}
      .ring{animation:r 6s linear infinite;transform-origin:100px 100px}
      .ring-r{animation:rv 8s linear infinite;transform-origin:100px 100px}
      .p1{animation:p 3s ease-in-out infinite;animation-delay:0s}
      .p2{animation:p2 3.5s ease-in-out infinite;animation-delay:0.5s}
      .p3{animation:p 4s ease-in-out infinite;animation-delay:1s}
      .pulse{animation:s 4s ease-in-out infinite;transform-origin:100px 100px}
      .float{animation:f 5s ease-in-out infinite}
      .glow{filter:url(#n)}
    </style>
    ${content}
  </svg>`;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  // ─── MALE ─────────────────────────────────────────────
  a("male-shadow", "Shadow", "male", ["#1E293B", "#334155"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="url(#mBg)"/>
      <radialGradient id="mBg"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#0F172A"/></radialGradient>
      <circle cx="100" cy="90" r="55" fill="#1E293B" stroke="#475569" stroke-width="2"/>
      <circle cx="100" cy="90" r="50" fill="#2D3A4A"/>
      <circle cx="82" cy="84" r="5" fill="#60A5FA" filter="url(#g)"/>
      <circle cx="118" cy="84" r="5" fill="#60A5FA" filter="url(#g)"/>
      <path d="M85 105 Q100 115 115 105" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M60 70 Q80 55 100 55 Q120 55 140 70" fill="none" stroke="#475569" stroke-width="8" stroke-linecap="round"/>
      <circle class="ring" cx="100" cy="90" r="60" fill="none" stroke="#3B82F6" stroke-width="0.5" opacity="0.3"/>
      <circle class="p1" cx="60" cy="140" r="2" fill="#60A5FA" opacity="0.6"/>
      <circle class="p2" cx="140" cy="135" r="1.5" fill="#3B82F6" opacity="0.5"/>
      <circle class="p3" cx="100" cy="150" r="1.8" fill="#60A5FA" opacity="0.4"/>
    `)
  ),
  a("male-nexus", "Nexus", "male", ["#0F172A", "#1E3A5F"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#0F172A"/>
      <circle cx="100" cy="88" r="50" fill="#1E293B" stroke="#1E3A5F" stroke-width="2"/>
      <circle cx="100" cy="88" r="45" fill="#0F172A"/>
      <path class="float" d="M70 68 Q85 58 100 60 Q115 58 130 68" fill="none" stroke="#3B82F6" stroke-width="6" stroke-linecap="round"/>
      <circle cx="82" cy="82" r="4.5" fill="#38BDF8" filter="url(#g)"/>
      <circle cx="118" cy="82" r="4.5" fill="#38BDF8" filter="url(#g)"/>
      <path d="M86 100 Q100 110 114 100" fill="none" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M75 50 L80 60 L120 60 L125 50 Z" fill="#3B82F6" opacity="0.3"/>
      <circle class="ring" cx="100" cy="88" r="55" fill="none" stroke="#3B82F6" stroke-width="0.5" opacity="0.2"/>
      <circle class="p1" cx="70" cy="130" r="2.5" fill="#38BDF8" opacity="0.5"/>
      <circle class="p2" cx="130" cy="125" r="2" fill="#3B82F6" opacity="0.4"/>
    `)
  ),
  a("male-titan", "Titan", "male", ["#1E1B4B", "#312E81"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#1E1B4B"/>
      <circle cx="100" cy="86" r="52" fill="#2D2A5A" stroke="#4338CA" stroke-width="1.5"/>
      <circle cx="100" cy="86" r="46" fill="#1E1B4B"/>
      <path d="M65 66 Q82 54 100 56 Q118 54 135 66" fill="none" stroke="#6366F1" stroke-width="7" stroke-linecap="round"/>
      <circle cx="80" cy="80" r="5" fill="#818CF8" filter="url(#n)"/>
      <circle cx="120" cy="80" r="5" fill="#818CF8" filter="url(#n)"/>
      <path class="float" d="M30 170 Q100 155 170 170" fill="none" stroke="#4338CA" stroke-width="1" opacity="0.3"/>
      <circle class="p1" cx="50" cy="50" r="2" fill="#818CF8" opacity="0.5"/>
      <circle class="p2" cx="150" cy="55" r="1.5" fill="#6366F1" opacity="0.4"/>
      <circle class="ring" cx="100" cy="86" r="58" fill="none" stroke="#818CF8" stroke-width="0.5" opacity="0.15"/>
    `)
  ),

  // ─── FEMALE ───────────────────────────────────────────
  a("female-luna", "Luna", "female", ["#2D1B4E", "#6D28D9"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#2D1B4E"/>
      <circle cx="100" cy="88" r="52" fill="#3D2B5E" stroke="#7C3AED" stroke-width="1.5"/>
      <circle cx="100" cy="88" r="46" fill="#2D1B4E"/>
      <path class="float" d="M65 64 Q82 54 100 56 Q118 54 135 64" fill="none" stroke="#A855F7" stroke-width="6" stroke-linecap="round"/>
      <path d="M60 64 L50 50 L55 46 L68 56" fill="#7C3AED" opacity="0.6"/>
      <path d="M140 64 L150 50 L145 46 L132 56" fill="#7C3AED" opacity="0.6"/>
      <circle cx="82" cy="82" r="4.5" fill="#C084FC" filter="url(#g)"/>
      <circle cx="118" cy="82" r="4.5" fill="#C084FC" filter="url(#g)"/>
      <path d="M88 102 Q100 112 112 102" fill="none" stroke="#A78BFA" stroke-width="2.5" stroke-linecap="round"/>
      <circle class="ring-r" cx="100" cy="88" r="60" fill="none" stroke="#A855F7" stroke-width="0.5" opacity="0.2"/>
      <circle class="p1" cx="65" cy="130" r="2" fill="#C084FC" opacity="0.6"/>
      <circle class="p2" cx="135" cy="128" r="1.5" fill="#A855F7" opacity="0.5"/>
    `)
  ),
  a("female-aurora", "Aurora", "female", ["#1E0A3C", "#4C1D95"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="url(#aurora)"/>
      <radialGradient id="aurora"><stop offset="0%" stop-color="#1E0A3C"/><stop offset="100%" stop-color="#0F0520"/></radialGradient>
      <circle cx="100" cy="86" r="50" fill="#2D1554" stroke="#6D28D9" stroke-width="1.5"/>
      <circle cx="100" cy="86" r="44" fill="#1E0A3C"/>
      <path class="float" d="M68 62 Q84 52 100 54 Q116 52 132 62" fill="none" stroke="#8B5CF6" stroke-width="5" stroke-linecap="round"/>
      <circle cx="83" cy="80" r="4" fill="#A78BFA" filter="url(#g)"/>
      <circle cx="117" cy="80" r="4" fill="#A78BFA" filter="url(#g)"/>
      <path d="M88 100 Q100 108 112 100" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"/>
      <path d="M55 60 Q60 48 75 50" fill="none" stroke="#7C3AED" stroke-width="4" stroke-linecap="round"/>
      <path d="M145 60 Q140 48 125 50" fill="none" stroke="#7C3AED" stroke-width="4" stroke-linecap="round"/>
      <circle class="p1" cx="55" cy="55" r="1.8" fill="#A78BFA" opacity="0.5"/>
      <circle class="p2" cx="145" cy="52" r="1.5" fill="#8B5CF6" opacity="0.4"/>
    `)
  ),
  a("female-iris", "Iris", "female", ["#2D1142", "#831843"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#2D1142"/>
      <circle cx="100" cy="88" r="52" fill="#3D1B52" stroke="#9D174D" stroke-width="1.5"/>
      <circle cx="100" cy="88" r="46" fill="#2D1142"/>
      <path d="M68 66 Q84 56 100 58 Q116 56 132 66" fill="none" stroke="#DB2777" stroke-width="6" stroke-linecap="round"/>
      <path d="M58 68 L48 52 L54 48 L68 60" fill="#BE185D" opacity="0.5"/>
      <path d="M142 68 L152 52 L146 48 L132 60" fill="#BE185D" opacity="0.5"/>
      <circle cx="82" cy="84" r="4.5" fill="#F472B6" filter="url(#g)"/>
      <circle cx="118" cy="84" r="4.5" fill="#F472B6" filter="url(#g)"/>
      <path d="M88 104 Q100 114 112 104" fill="none" stroke="#EC4899" stroke-width="2.5" stroke-linecap="round"/>
      <circle class="ring" cx="100" cy="88" r="58" fill="none" stroke="#DB2777" stroke-width="0.5" opacity="0.2"/>
      <circle class="p1" cx="75" cy="140" r="2" fill="#F472B6" opacity="0.5"/>
      <circle class="p2" cx="125" cy="142" r="1.5" fill="#EC4899" opacity="0.4"/>
    `)
  ),

  // ─── GAMING ───────────────────────────────────────────
  a("gaming-phantom", "Phantom", "gaming", ["#020617", "#1E3A5F"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="url(#gBg)"/>
      <radialGradient id="gBg"><stop offset="0%" stop-color="#0F172A"/><stop offset="100%" stop-color="#020617"/></radialGradient>
      <circle cx="100" cy="84" r="48" fill="#1E293B" stroke="#3B82F6" stroke-width="2"/>
      <circle cx="100" cy="84" r="42" fill="#0F172A"/>
      <path d="M72 66 Q86 56 100 58 Q114 56 128 66" fill="none" stroke="#3B82F6" stroke-width="5" stroke-linecap="round"/>
      <circle cx="82" cy="78" r="6" fill="#60A5FA" filter="url(#n)"/>
      <circle cx="118" cy="78" r="6" fill="#60A5FA" filter="url(#n)"/>
      <rect x="88" y="96" width="24" height="4" rx="2" fill="#3B82F6" opacity="0.8"/>
      <rect x="92" y="102" width="16" height="3" rx="1.5" fill="#2563EB" opacity="0.6"/>
      <path d="M30 170 Q100 145 170 170" fill="none" stroke="#3B82F6" stroke-width="1" opacity="0.4"/>
      <circle class="ring" cx="100" cy="84" r="55" fill="none" stroke="#60A5FA" stroke-width="0.8" opacity="0.3"/>
      <circle class="p1" cx="50" cy="50" r="2.5" fill="#60A5FA"/>
      <circle class="p2" cx="150" cy="45" r="2" fill="#3B82F6"/>
      <circle class="p3" cx="100" cy="35" r="1.8" fill="#93C5FD"/>
    `)
  ),
  a("gaming-cypher", "Cypher", "gaming", ["#0A0A0A", "#1A1A2E"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#0A0A0A"/>
      <circle cx="100" cy="84" r="50" fill="#1A1A2E" stroke="#E11D48" stroke-width="2"/>
      <circle cx="100" cy="84" r="44" fill="#0A0A0A"/>
      <path d="M70 64 Q85 54 100 56 Q115 54 130 64" fill="none" stroke="#E11D48" stroke-width="5" stroke-linecap="round"/>
      <circle cx="80" cy="78" r="5" fill="#FB7185" filter="url(#n)"/>
      <circle cx="120" cy="78" r="5" fill="#FB7185" filter="url(#n)"/>
      <path class="float" d="M40 170 Q100 155 160 170" fill="none" stroke="#E11D48" stroke-width="1" opacity="0.3"/>
      <rect x="86" y="96" width="28" height="3" rx="1.5" fill="#E11D48" opacity="0.8"/>
      <circle class="ring" cx="100" cy="84" r="58" fill="none" stroke="#FB7185" stroke-width="0.5" opacity="0.2"/>
      <circle class="p1" cx="45" cy="40" r="2" fill="#E11D48"/>
      <circle class="p2" cx="155" cy="50" r="1.5" fill="#FB7185"/>
      <polygon class="pulse" points="100,20 105,30 115,30 107,37 110,48 100,41 90,48 93,37 85,30 95,30" fill="#E11D48" opacity="0.15"/>
    `)
  ),
  a("gaming-vortex", "Vortex", "gaming", ["#0A0F1E", "#1E1B4B"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#0A0F1E"/>
      <circle cx="100" cy="84" r="50" fill="#1A1F3E" stroke="#6366F1" stroke-width="2"/>
      <circle cx="100" cy="84" r="44" fill="#0A0F1E"/>
      <path d="M68 64 Q84 54 100 56 Q116 54 132 64" fill="none" stroke="#818CF8" stroke-width="5" stroke-linecap="round"/>
      <circle cx="80" cy="78" r="5" fill="#A5B4FC" filter="url(#n)"/>
      <circle cx="120" cy="78" r="5" fill="#A5B4FC" filter="url(#n)"/>
      <path d="M88 96 Q100 102 112 96" fill="none" stroke="#818CF8" stroke-width="2" stroke-linecap="round"/>
      <path d="M92 100 L108 100" stroke="#6366F1" stroke-width="2" stroke-linecap="round"/>
      <circle class="ring" cx="100" cy="84" r="56" fill="none" stroke="#818CF8" stroke-width="0.5" opacity="0.3"/>
      <circle class="ring-r" cx="100" cy="84" r="46" fill="none" stroke="#6366F1" stroke-width="0.5" opacity="0.2"/>
      <circle class="p1" cx="55" cy="50" r="2" fill="#A5B4FC"/>
      <circle class="p2" cx="145" cy="55" r="1.5" fill="#818CF8"/>
    `)
  ),

  // ─── ANIME ────────────────────────────────────────────
  a("anime-kurai", "Kurai", "anime", ["#0F0A1E", "#2D1B4E"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#0F0A1E"/>
      <circle cx="100" cy="86" r="52" fill="#1F143E" stroke="#7C3AED" stroke-width="1.5"/>
      <circle cx="100" cy="86" r="46" fill="#0F0A1E"/>
      <path class="float" d="M62 60 Q80 48 100 50 Q120 48 138 60" fill="none" stroke="#8B5CF6" stroke-width="5" stroke-linecap="round"/>
      <circle cx="84" cy="80" r="7" fill="#A78BFA" filter="url(#g)"/>
      <circle cx="84" cy="80" r="3" fill="#fff"/>
      <circle cx="116" cy="80" r="7" fill="#A78BFA" filter="url(#g)"/>
      <circle cx="116" cy="80" r="3" fill="#fff"/>
      <path d="M90 100 Q100 108 110 100" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round"/>
      <circle class="p1" cx="65" cy="135" r="2.5" fill="#C084FC" opacity="0.6"/>
      <circle class="p2" cx="135" cy="130" r="2" fill="#A78BFA" opacity="0.5"/>
      <path d="M30 170 Q100 150 170 170" fill="none" stroke="#7C3AED" stroke-width="1" opacity="0.2"/>
      <circle class="ring" cx="100" cy="86" r="60" fill="none" stroke="#A78BFA" stroke-width="0.5" opacity="0.15"/>
    `)
  ),
  a("anime-hikari", "Hikari", "anime", ["#0F172A", "#1E3A5F"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#0F172A"/>
      <circle cx="100" cy="86" r="52" fill="#1E293B" stroke="#0EA5E9" stroke-width="1.5"/>
      <circle cx="100" cy="86" r="46" fill="#0F172A"/>
      <path class="float" d="M64 62 Q82 50 100 52 Q118 50 136 62" fill="none" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>
      <circle cx="84" cy="80" r="6.5" fill="#7DD3FC" filter="url(#g)"/>
      <circle cx="84" cy="80" r="3" fill="#fff"/>
      <circle cx="116" cy="80" r="6.5" fill="#7DD3FC" filter="url(#g)"/>
      <circle cx="116" cy="80" r="3" fill="#fff"/>
      <path d="M88 100 Q100 108 112 100" fill="none" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
      <circle class="p1" cx="70" cy="140" r="2" fill="#7DD3FC" opacity="0.5"/>
      <circle class="p2" cx="130" cy="142" r="1.5" fill="#38BDF8" opacity="0.4"/>
    `)
  ),

  // ─── CYBERPUNK ────────────────────────────────────────
  a("cyber-neon", "Neon", "cyberpunk", ["#020617", "#0F172A"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="url(#cyBg)"/>
      <radialGradient id="cyBg"><stop offset="0%" stop-color="#0F172A"/><stop offset="100%" stop-color="#020617"/></radialGradient>
      <circle cx="100" cy="84" r="48" fill="#1E293B" stroke="#06B6D4" stroke-width="2"/>
      <circle cx="100" cy="84" r="42" fill="#0F172A"/>
      <path d="M70 66 Q85 56 100 58 Q115 56 130 66" fill="none" stroke="#22D3EE" stroke-width="5" stroke-linecap="round"/>
      <circle cx="82" cy="78" r="8" fill="#22D3EE" filter="url(#n)"/>
      <circle cx="82" cy="78" r="3" fill="#fff"/>
      <circle cx="118" cy="78" r="8" fill="#F472B6" filter="url(#n)"/>
      <circle cx="118" cy="78" r="3" fill="#fff"/>
      <rect x="86" y="96" width="28" height="3" rx="1.5" fill="#22D3EE" opacity="0.8"/>
      <rect x="90" y="102" width="20" height="2" rx="1" fill="#F472B6" opacity="0.6"/>
      <path d="M30 170 Q100 150 170 170" fill="none" stroke="#22D3EE" stroke-width="1" opacity="0.4"/>
      <circle class="ring" cx="100" cy="84" r="55" fill="none" stroke="#22D3EE" stroke-width="0.5" opacity="0.3"/>
      <circle class="ring-r" cx="100" cy="84" r="45" fill="none" stroke="#F472B6" stroke-width="0.5" opacity="0.2"/>
      <circle class="p1" cx="50" cy="45" r="2" fill="#22D3EE"/>
      <circle class="p2" cx="150" cy="50" r="1.5" fill="#F472B6"/>
      <circle class="p3" cx="100" cy="30" r="1.8" fill="#22D3EE"/>
    `)
  ),
  a("cyber-glitch", "Glitch", "cyberpunk", ["#0A0A0A", "#1A0A0A"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#0A0A0A"/>
      <circle cx="100" cy="84" r="48" fill="#1A1A1A" stroke="#E11D48" stroke-width="2"/>
      <circle cx="100" cy="84" r="42" fill="#0A0A0A"/>
      <path d="M68 64 Q84 54 100 56 Q116 54 132 64" fill="none" stroke="#E11D48" stroke-width="5" stroke-linecap="round"/>
      <rect x="72" y="72" width="24" height="12" rx="2" fill="#E11D48" filter="url(#n)" opacity="0.9"/>
      <rect x="74" y="74" width="20" height="8" rx="1" fill="#0A0A0A"/>
      <rect x="104" y="72" width="24" height="12" rx="2" fill="#0891B2" filter="url(#n)" opacity="0.9"/>
      <rect x="106" y="74" width="20" height="8" rx="1" fill="#0A0A0A"/>
      <rect x="88" y="96" width="24" height="4" rx="1" fill="#E11D48" opacity="0.8"/>
      <path d="M30 170 Q100 150 170 170" fill="none" stroke="#E11D48" stroke-width="1" opacity="0.3"/>
      <circle class="ring" cx="100" cy="84" r="55" fill="none" stroke="#E11D48" stroke-width="0.5" opacity="0.3"/>
      <circle class="p1" cx="45" cy="40" r="2" fill="#E11D48"/>
      <circle class="p2" cx="155" cy="45" r="1.5" fill="#0891B2"/>
    `)
  ),
  a("cyber-synth", "Synth", "cyberpunk", ["#050510", "#100520"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#050510"/>
      <circle cx="100" cy="84" r="48" fill="#150530" stroke="#7C3AED" stroke-width="2"/>
      <circle cx="100" cy="84" r="42" fill="#050510"/>
      <path d="M68 64 Q84 54 100 56 Q116 54 132 64" fill="none" stroke="#A855F7" stroke-width="5" stroke-linecap="round"/>
      <circle cx="82" cy="78" r="7" fill="#C084FC" filter="url(#n)"/>
      <circle cx="82" cy="78" r="2.5" fill="#fff"/>
      <circle cx="118" cy="78" r="7" fill="#06B6D4" filter="url(#n)"/>
      <circle cx="118" cy="78" r="2.5" fill="#fff"/>
      <path d="M86 96 Q100 104 114 96" fill="none" stroke="#A855F7" stroke-width="2" stroke-linecap="round"/>
      <polygon class="pulse" points="100,110 104,118 112,118 106,124 108,132 100,126 92,132 94,124 88,118 96,118" fill="#7C3AED" opacity="0.15"/>
      <circle class="ring" cx="100" cy="84" r="56" fill="none" stroke="#A855F7" stroke-width="0.5" opacity="0.2"/>
      <circle class="p1" cx="55" cy="50" r="2" fill="#C084FC"/>
      <circle class="p2" cx="145" cy="55" r="1.5" fill="#06B6D4"/>
    `)
  ),

  // ─── BUSINESS ─────────────────────────────────────────
  a("biz-executive", "Executive", "business", ["#0F172A", "#1E293B"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#0F172A"/>
      <circle cx="100" cy="84" r="50" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
      <circle cx="100" cy="84" r="44" fill="#0F172A"/>
      <path d="M72 68 Q86 60 100 62 Q114 60 128 68" fill="none" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
      <circle cx="84" cy="80" r="4" fill="#94A3B8"/>
      <circle cx="116" cy="80" r="4" fill="#94A3B8"/>
      <path class="float" d="M50 30 Q100 22 150 30" fill="none" stroke="#334155" stroke-width="8" stroke-linecap="round"/>
      <path d="M88 100 Q100 106 112 100" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
      <rect x="40" y="140" width="120" height="2" rx="1" fill="#334155" opacity="0.3"/>
      <circle class="p1" cx="60" cy="150" r="1.5" fill="#475569" opacity="0.5"/>
      <circle class="p2" cx="140" cy="148" r="1" fill="#475569" opacity="0.4"/>
    `)
  ),
  a("biz-director", "Director", "business", ["#111827", "#1F2937"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#111827"/>
      <circle cx="100" cy="84" r="50" fill="#1F2937" stroke="#374151" stroke-width="1.5"/>
      <circle cx="100" cy="84" r="44" fill="#111827"/>
      <path d="M70 66 Q85 58 100 60 Q115 58 130 66" fill="none" stroke="#4B5563" stroke-width="5" stroke-linecap="round"/>
      <path class="float" d="M52 32 Q100 24 148 32" fill="none" stroke="#374151" stroke-width="7" stroke-linecap="round"/>
      <circle cx="84" cy="80" r="4" fill="#9CA3AF"/>
      <circle cx="116" cy="80" r="4" fill="#9CA3AF"/>
      <path d="M88 100 Q100 106 112 100" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
      <rect x="55" y="55" width="10" height="6" rx="1" fill="#374151" opacity="0.6"/>
      <rect x="135" y="55" width="10" height="6" rx="1" fill="#374151" opacity="0.6"/>
    `)
  ),

  // ─── PREMIUM ──────────────────────────────────────────
  a("premium-onyx", "Onyx", "premium", ["#020617", "#0F172A"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="url(#pBg)"/>
      <radialGradient id="pBg"><stop offset="0%" stop-color="#0F172A"/><stop offset="100%" stop-color="#020617"/></radialGradient>
      <circle cx="100" cy="84" r="48" fill="#1E293B" stroke="#475569" stroke-width="2"/>
      <circle cx="100" cy="84" r="42" fill="#0F172A"/>
      <path d="M72 66 Q86 56 100 58 Q114 56 128 66" fill="none" stroke="#64748B" stroke-width="5" stroke-linecap="round"/>
      <circle cx="82" cy="78" r="6" fill="#CBD5E1" filter="url(#n)"/>
      <circle cx="82" cy="78" r="2.5" fill="#fff"/>
      <circle cx="118" cy="78" r="6" fill="#CBD5E1" filter="url(#n)"/>
      <circle cx="118" cy="78" r="2.5" fill="#fff"/>
      <path d="M88 98 Q100 108 112 98" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>
      <circle class="ring" cx="100" cy="84" r="55" fill="none" stroke="#64748B" stroke-width="0.8" opacity="0.3"/>
      <circle class="ring-r" cx="100" cy="84" r="62" fill="none" stroke="#475569" stroke-width="0.5" opacity="0.15"/>
      <circle class="p1" cx="50" cy="45" r="2" fill="#CBD5E1"/>
      <circle class="p2" cx="150" cy="48" r="2" fill="#94A3B8"/>
    `)
  ),
  a("premium-royal", "Royal", "premium", ["#1A0A2E", "#2D1B4E"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="url(#rBg)"/>
      <radialGradient id="rBg"><stop offset="0%" stop-color="#2D1B4E"/><stop offset="100%" stop-color="#1A0A2E"/></radialGradient>
      <circle cx="100" cy="84" r="48" fill="#3D2B5E" stroke="#7C3AED" stroke-width="2"/>
      <circle cx="100" cy="84" r="42" fill="#2D1B4E"/>
      <path d="M72 64 Q86 54 100 56 Q114 54 128 64" fill="none" stroke="#A855F7" stroke-width="5" stroke-linecap="round"/>
      <circle cx="82" cy="78" r="6" fill="#C084FC" filter="url(#n)"/>
      <circle cx="82" cy="78" r="2.5" fill="#fff"/>
      <circle cx="118" cy="78" r="6" fill="#C084FC" filter="url(#n)"/>
      <circle cx="118" cy="78" r="2.5" fill="#fff"/>
      <path d="M88 98 Q100 108 112 98" fill="none" stroke="#A78BFA" stroke-width="2.5" stroke-linecap="round"/>
      <polygon class="pulse" points="100,12 104,22 114,22 106,28 108,38 100,32 92,38 94,28 86,22 96,22" fill="#A855F7" opacity="0.15"/>
      <circle class="ring" cx="100" cy="84" r="56" fill="none" stroke="#C084FC" stroke-width="0.5" opacity="0.25"/>
      <circle class="p1" cx="55" cy="45" r="2" fill="#C084FC"/>
      <circle class="p2" cx="145" cy="50" r="2" fill="#A78BFA"/>
    `)
  ),
  a("premium-aether", "Aether", "premium", ["#020617", "#0F172A"],
    avatarFrame(`
      <rect width="200" height="200" rx="40" fill="#020617"/>
      <circle cx="100" cy="84" r="48" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
      <circle cx="100" cy="84" r="42" fill="#020617"/>
      <path class="float" d="M72 64 Q86 54 100 56 Q114 54 128 64" fill="none" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>
      <circle cx="82" cy="78" r="8" fill="#7DD3FC" filter="url(#n)"/>
      <circle cx="82" cy="78" r="3" fill="#fff"/>
      <circle cx="118" cy="78" r="8" fill="#7DD3FC" filter="url(#n)"/>
      <circle cx="118" cy="78" r="3" fill="#fff"/>
      <path d="M88 98 Q100 108 112 98" fill="none" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
      <circle class="ring" cx="100" cy="84" r="54" fill="none" stroke="#38BDF8" stroke-width="0.5" opacity="0.3"/>
      <circle class="ring-r" cx="100" cy="84" r="62" fill="none" stroke="#7DD3FC" stroke-width="0.5" opacity="0.15"/>
      <circle class="p1" cx="50" cy="40" r="2" fill="#7DD3FC"/>
      <circle class="p2" cx="150" cy="45" r="2" fill="#38BDF8"/>
      <circle class="p3" cx="100" cy="140" r="1.5" fill="#7DD3FC"/>
    `)
  ),
];

export function getAvatarById(id: string): AvatarOption | undefined {
  return AVATAR_OPTIONS.find((a) => a.id === id);
}

export function getAvatarByCategory(cat: AvatarOption["category"]): AvatarOption[] {
  return AVATAR_OPTIONS.filter((a) => a.category === cat);
}

export const AVATAR_CATEGORIES: { id: AvatarOption["category"]; label: string; icon: string }[] = [
  { id: "male", label: "Male", icon: "👤" },
  { id: "female", label: "Female", icon: "👩" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "anime", label: "Anime", icon: "🌸" },
  { id: "cyberpunk", label: "Cyberpunk", icon: "⚡" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "premium", label: "Premium", icon: "👑" },
];
