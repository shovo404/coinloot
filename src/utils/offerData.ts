import { Offer, OfferStep } from "../types";

// ─── Offer Source Type ──────────────────────────────────────────────────────
export interface OfferSource {
  id: string;
  name: string;
  apiUrl?: string;
  apiKey?: string;
  connected: boolean;
}

// ─── Demo Offers (shown when no API offers are configured) ───────────────────
const DEMO_FEATURED: Offer[] = [
  {
    id: "demo-ft-1",
    title: "Rise of Kingdoms — City Builder",
    description: "Reach City Hall Level 10 and earn massive rewards.",
    payout_coins: 5000,
    max_reward: 8500,
    category: "trending",
    provider: "TOROX",
    imageUrl: "https://picsum.photos/seed/kingdoms/400/300",
    difficulty: "Medium",
    link: "https://torox.com",
    tracking_link: "https://torox.com/offer/rok",
    is_mobile_only: true,
    steps: [
      { id: "rok-1", label: "Complete Level 10", reward: 100, order: 1 },
      { id: "rok-2", label: "Complete Level 25", reward: 250, order: 2 },
      { id: "rok-3", label: "Complete Level 50", reward: 500, order: 3 },
    ],
  },
  {
    id: "demo-ft-2",
    title: "Star Trek Fleet Command — Space Strategy",
    description: "Build your fleet and conquer the galaxy.",
    payout_coins: 7200,
    max_reward: 12000,
    category: "high-paying",
    provider: "Revenue Universe",
    imageUrl: "https://picsum.photos/seed/startrek/400/300",
    difficulty: "Hard",
    link: "https://revenueuniverse.com",
    is_mobile_only: true,
    steps: [
      { id: "st-1", label: "Complete Level 10", reward: 100, order: 1 },
      { id: "st-2", label: "Complete Level 25", reward: 250, order: 2 },
      { id: "st-3", label: "Complete Level 50", reward: 500, order: 3 },
    ],
  },
  {
    id: "demo-ft-3",
    title: "Merge Dragons! — Puzzle Adventure",
    description: "Merge items, solve puzzles, and heal the land.",
    payout_coins: 3500,
    max_reward: 6000,
    category: "trending",
    provider: "AdGate Media",
    imageUrl: "https://picsum.photos/seed/mergedragons/400/300",
    difficulty: "Medium",
    link: "https://adgatemedia.com",
    is_mobile_only: true,
    steps: [
      { id: "md-1", label: "Complete Level 10", reward: 100, order: 1 },
      { id: "md-2", label: "Complete Level 25", reward: 250, order: 2 },
      { id: "md-3", label: "Complete Level 50", reward: 500, order: 3 },
    ],
  },
  {
    id: "demo-ft-4",
    title: "Coin Master — Spin & Build",
    description: "Spin, attack, and build your village. Earn coins per level.",
    payout_coins: 2500,
    max_reward: 4500,
    category: "new",
    provider: "AdGem",
    imageUrl: "https://picsum.photos/seed/coinmaster/400/300",
    difficulty: "Easy",
    link: "https://adgem.com",
    is_mobile_only: true,
    steps: [
      { id: "cm-1", label: "Complete Level 10", reward: 100, order: 1 },
      { id: "cm-2", label: "Complete Level 25", reward: 250, order: 2 },
    ],
  },
  {
    id: "demo-ft-5",
    title: "Genshin Impact — Open World RPG",
    description: "Explore Teyvat, complete quests, and earn primogems.",
    payout_coins: 8000,
    max_reward: 15000,
    category: "high-paying",
    provider: "TOROX",
    imageUrl: "https://picsum.photos/seed/genshin/400/300",
    difficulty: "Hard",
    link: "https://torox.com",
    is_mobile_only: true,
    steps: [
      { id: "gi-1", label: "Complete Level 10", reward: 100, order: 1 },
      { id: "gi-2", label: "Complete Level 25", reward: 250, order: 2 },
      { id: "gi-3", label: "Complete Level 50", reward: 500, order: 3 },
    ],
  },
  {
    id: "demo-ft-6",
    title: "AFK Arena — Idle RPG",
    description: "Build your hero roster and push campaign stages.",
    payout_coins: 1800,
    max_reward: 3200,
    category: "trending",
    provider: "CPX Research",
    imageUrl: "https://picsum.photos/seed/afkarena/400/300",
    difficulty: "Easy",
    link: "https://cpxresearch.com",
    is_mobile_only: true,
    steps: [
      { id: "aa-1", label: "Complete Level 10", reward: 50, order: 1 },
      { id: "aa-2", label: "Complete Level 25", reward: 150, order: 2 },
    ],
  },
];

const DEMO_HOT: Offer[] = [
  {
    id: "demo-hot-1",
    title: "Last Shelter: Survival — Zombie Strategy",
    description: "Build your shelter and survive the apocalypse.",
    payout_coins: 800,
    max_reward: 2000,
    category: "recommended",
    provider: "Lootably",
    imageUrl: "https://picsum.photos/seed/shelter/400/300",
    difficulty: "Easy",
    link: "https://lootably.com",
    is_mobile_only: true,
    steps: [
      { id: "ls-1", label: "Complete Level 10", reward: 50, order: 1 },
      { id: "ls-2", label: "Complete Level 25", reward: 150, order: 2 },
    ],
  },
  {
    id: "demo-hot-2",
    title: "Evony: The King's Return — City Building",
    description: "Build your empire and lead your army to victory.",
    payout_coins: 350,
    max_reward: 2800,
    category: "new",
    provider: "TimeWall",
    imageUrl: "https://picsum.photos/seed/evony/400/300",
    difficulty: "Medium",
    link: "https://timewall.io",
    is_mobile_only: true,
    steps: [
      { id: "ev-1", label: "Complete Level 10", reward: 100, order: 1 },
      { id: "ev-2", label: "Complete Level 25", reward: 250, order: 2 },
    ],
  },
  {
    id: "demo-hot-3",
    title: "Bingo Blitz — Bingo Adventure",
    description: "Travel the world playing bingo in exotic cities.",
    payout_coins: 1500,
    max_reward: 3500,
    category: "recommended",
    provider: "Ayet Studios",
    imageUrl: "https://picsum.photos/seed/bingo/400/300",
    difficulty: "Easy",
    link: "https://ayetstudios.com",
    is_mobile_only: true,
    steps: [
      { id: "bb-1", label: "Complete Level 10", reward: 100, order: 1 },
      { id: "bb-2", label: "Complete Level 25", reward: 250, order: 2 },
    ],
  },
  {
    id: "demo-hot-4",
    title: "Solitaire Grand Harvest — Card Classic",
    description: "Play solitaire and harvest rewards on your farm.",
    payout_coins: 1000,
    max_reward: 2200,
    category: "recommended",
    provider: "Kiwi Wall",
    imageUrl: "https://picsum.photos/seed/solitaire/400/300",
    difficulty: "Easy",
    link: "https://kiwiwall.com",
    is_mobile_only: true,
    steps: [
      { id: "sg-1", label: "Complete Level 10", reward: 100, order: 1 },
      { id: "sg-2", label: "Complete Level 25", reward: 150, order: 2 },
    ],
  },
  {
    id: "demo-hot-5",
    title: "Wordscapes — Word Puzzle",
    description: "Connect letters and solve crossword puzzles.",
    payout_coins: 2000,
    max_reward: 4000,
    category: "recommended",
    provider: "Monlix",
    imageUrl: "https://picsum.photos/seed/wordscapes/400/300",
    difficulty: "Easy",
    link: "https://monlix.com",
    is_mobile_only: true,
    steps: [
      { id: "ws-1", label: "Complete Level 10", reward: 100, order: 1 },
      { id: "ws-2", label: "Complete Level 25", reward: 250, order: 2 },
    ],
  },
  {
    id: "demo-hot-6",
    title: "Idle Miner Tycoon — Management Sim",
    description: "Manage your mine, hire managers, and maximize profits.",
    payout_coins: 1600,
    max_reward: 3000,
    category: "trending",
    provider: "Wannads",
    imageUrl: "https://picsum.photos/seed/idleminer/400/300",
    difficulty: "Easy",
    link: "https://wannads.com",
    is_mobile_only: true,
    steps: [
      { id: "im-1", label: "Complete Level 10", reward: 100, order: 1 },
      { id: "im-2", label: "Complete Level 25", reward: 250, order: 2 },
    ],
  },
];

// ─── Offer Source Registry ──────────────────────────────────────────────────
// Future: Admin-configured API sources will be registered here.
// When an API is added, its offers will take priority over demo data.
export const OFFER_SOURCES: OfferSource[] = [
  { id: "torox", name: "TOROX", connected: false },
  { id: "adgem", name: "AdGem", connected: false },
  { id: "adgate", name: "AdGate Media", connected: false },
  { id: "lootably", name: "Lootably", connected: false },
  { id: "revenueuniverse", name: "Revenue Universe", connected: false },
  { id: "cpx", name: "CPX Research", connected: false },
  { id: "timewall", name: "TimeWall", connected: false },
];

// ─── Get Featured Offers ────────────────────────────────────────────────────
// Priority: API offers (from connected sources) → Demo offers
export function getFeaturedOffers(): Offer[] {
  return DEMO_FEATURED;
}

// ─── Get Hot Offers ────────────────────────────────────────────────────────
export function getHotOffers(): Offer[] {
  return DEMO_HOT;
}

// ─── Get All Offers ─────────────────────────────────────────────────────────
export function getAllDemoOffers(): Offer[] {
  return [...DEMO_FEATURED, ...DEMO_HOT];
}

// ─── Future: API Offer Fetcher ─────────────────────────────────────────────
// When an offerwall API is configured (e.g. via Admin Panel → Offerwalls),
// the system will call these functions instead of returning demo data.
//
// Example integration:
//
// export async function fetchApiOffers(source: OfferSource): Promise<Offer[]> {
//   const response = await fetch(source.apiUrl!, {
//     headers: { "Authorization": `Bearer ${source.apiKey}` },
//   });
//   const data = await response.json();
//   return data.offers.map(mapApiOfferToOffer);
// }
//
// function mapApiOfferToOffer(apiOffer: any): Offer {
//   return {
//     id: apiOffer.offer_id,
//     title: apiOffer.name,
//     description: apiOffer.short_description,
//     payout_coins: apiOffer.payout,
//     max_reward: apiOffer.max_payout,
//     category: apiOffer.category || "trending",
//     provider: apiOffer.provider_name,
//     imageUrl: apiOffer.thumbnail_url,
//     difficulty: apiOffer.difficulty || "Medium",
//     link: apiOffer.offer_url,
//     tracking_link: apiOffer.tracking_url,
//     is_mobile_only: apiOffer.platform === "mobile",
//     steps: (apiOffer.steps || []).map((s: any, i: number) => ({
//       id: `${apiOffer.offer_id}-step-${i}`,
//       label: s.description,
//       reward: s.reward,
//       order: i + 1,
//     })),
//   };
// }
