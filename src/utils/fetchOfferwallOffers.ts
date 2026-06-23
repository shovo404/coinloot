import { Offer } from "../types";

interface OfferwallProvider {
  id: string;
  name: string;
  slug: string;
  initials: string;
  color: string;
  category: string;
  logoUrl: string;
  domain: string;
  apiKey: string;
  publisherId: string;
  secretKey: string;
  postbackUrl: string;
  connected: boolean;
  apiConnected: boolean;
  priority: number;
}

export function getConnectedProviders(): OfferwallProvider[] {
  try {
    const saved = localStorage.getItem("coinloot_offerwall_providers");
    if (saved) {
      const providers: OfferwallProvider[] = JSON.parse(saved);
      return providers.filter((p) => p.connected && p.apiConnected);
    }
  } catch { }
  return [];
}

export function getAllOfferwallProviders(): OfferwallProvider[] {
  try {
    const saved = localStorage.getItem("coinloot_offerwall_providers");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch { }
  return [];
}

export async function fetchOffersFromProvider(
  provider: OfferwallProvider,
  userId: string
): Promise<Offer[]> {
  try {
    const res = await fetch("/api/offerwall/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, userId }),
    });
    const data = await res.json();
    if (data.offers && Array.isArray(data.offers)) {
      return data.offers;
    }
    return [];
  } catch (err) {
    console.warn(`Failed to fetch offers from ${provider.name}:`, err);
    return [];
  }
}
