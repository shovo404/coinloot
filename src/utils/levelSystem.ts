export function calcLevel(totalCoins: number): number {
  return Math.floor(totalCoins / 1000) + 1;
}

export function coinsForLevel(level: number): { min: number; max: number } {
  return { min: Math.max(0, (level - 1) * 1000), max: level * 1000 };
}

export function levelProgress(totalCoins: number): { current: number; next: number; progress: number } {
  const level = calcLevel(totalCoins);
  const { min, max } = coinsForLevel(level);
  const progress = Math.min(1, (totalCoins - min) / (max - min));
  return { current: level, next: level + 1, progress };
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
  if (level <= titles.length) return titles[level - 1];
  return `Galactic Titan Lv.${level}`;
}
