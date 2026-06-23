export async function sendTelegramNotification(message: string) {
  try {
    const cfg = JSON.parse(localStorage.getItem("coinloot_telegram_config") || "{}");
    const botToken = cfg.token || undefined;
    const chatId = cfg.chatId || undefined;
    if (!botToken || !chatId) return false;
    const resp = await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, botToken, chatId }),
    });
    const data = await resp.json();
    if (!data.sent) console.warn("Telegram notify failed:", data.error);
    return data.sent;
  } catch {
    console.warn("Telegram notify unavailable");
    return false;
  }
}
