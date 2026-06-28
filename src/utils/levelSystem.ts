const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, max: 999 },
  { level: 2, min: 1000, max: 2999 },
  { level: 3, min: 3000, max: 5999 },
  { level: 4, min: 6000, max: 9999 },
  { level: 5, min: 10000, max: 14999 },
  { level: 6, min: 15000, max: 24999 },
  { level: 7, min: 25000, max: 39999 },
  { level: 8, min: 40000, max: 59999 },
  { level: 9, min: 60000, max: 99999 },
  { level: 10, min: 100000, max: Infinity },
];

export function calcLevel(balance: number): number {
  for (const l of LEVEL_THRESHOLDS) {
    if (balance >= l.min && balance <= l.max) return l.level;
  }
  return 10;
}

export function calcLevelFromBalance(balanceCoins: number): number {
  return calcLevel(balanceCoins);
}

export function coinsForLevel(level: number): { min: number; max: number } {
  for (const l of LEVEL_THRESHOLDS) {
    if (l.level === level) return { min: l.min, max: l.max === Infinity ? l.min : l.max };
  }
  return { min: 0, max: 999 };
}

export function levelProgress(totalCoins: number): { current: number; next: number; progress: number } {
  const level = calcLevel(totalCoins);
  const { min, max } = coinsForLevel(level);
  if (max === min) {
    return { current: level, next: level, progress: 1 };
  }
  const nextLevelMin = LEVEL_THRESHOLDS.find(l => l.level === level + 1)?.min ?? max;
  const range = nextLevelMin - min;
  const progress = range > 0 ? Math.min(1, (totalCoins - min) / range) : 1;
  return { current: level, next: Math.min(level + 1, 10), progress };
}

let previousLevel = 0;

export function checkLevelUp(totalCoins: number): { levelUp: boolean; newLevel: number } {
  const newLevel = calcLevel(totalCoins);
  if (previousLevel > 0 && newLevel > previousLevel) {
    previousLevel = newLevel;
    return { levelUp: true, newLevel };
  }
  if (previousLevel === 0) previousLevel = newLevel;
  return { levelUp: false, newLevel };
}

export function resetLevelTracker(): void {
  previousLevel = 0;
}

export function getLevelTitle(level: number): string {
  const titles = [
    "Newcomer", "Bronze Explorer", "Silver Adventurer", "Gold Seeker",
    "Platinum Pioneer", "Diamond Hunter", "Elite Trader", "Master Investor",
    "Legendary Tycoon", "Cosmic Mogul",
  ];
  if (level <= 0) return titles[0];
  if (level <= titles.length) return titles[level - 1];
  return `Galactic Titan Lv.${level}`;
}
