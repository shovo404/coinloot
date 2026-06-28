export function getDeviceFingerprint(): string {
  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      navigator.hardwareConcurrency,
      navigator.plugins?.length ?? 0,
      !!navigator.cookieEnabled,
    ];
    const raw = components.join("|||");
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  } catch {
    return "unknown";
  }
}

export interface RegistrationGeoInfo {
  ip: string;
  country: string;
  isp: string;
}

export async function fetchRegistrationInfo(): Promise<RegistrationGeoInfo> {
  try {
    const resp = await fetch("/api/vpn/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(10000),
    });
    const data = await resp.json();
    return {
      ip: data.ip || "",
      country: data.country || "",
      isp: data.isp || "",
    };
  } catch {
    // Fallback: try ipify for IP only
    try {
      const resp = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(5000) });
      const data = await resp.json();
      return { ip: data.ip || "", country: "", isp: "" };
    } catch {
      return { ip: "", country: "", isp: "" };
    }
  }
}