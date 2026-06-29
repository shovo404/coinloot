/**
 * Coin earning sound using Web Audio API.
 * No external audio files needed — synthesized in real-time.
 * Built-in duplicate prevention (ignores calls within 100ms).
 */

let audioContext: AudioContext | null = null;
let lastPlayTime = 0;
const MIN_INTERVAL = 100; // ms — prevent duplicate/overlapping sounds

export function playCoinSound() {
  const now = Date.now();
  if (now - lastPlayTime < MIN_INTERVAL) return;
  lastPlayTime = now;

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContext;

    // Resume if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // ── Main "ding" oscillator ──
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.04);
    osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
    gain1.gain.setValueAtTime(0.35, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // ── Harmonic overtone for richness ──
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1760, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(2640, ctx.currentTime + 0.06);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.18);

    // ── Short noise burst for "clink" texture ──
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = ctx.createBufferSource();
    const gain3 = ctx.createGain();
    noise.buffer = buffer;
    gain3.gain.setValueAtTime(0.06, ctx.currentTime);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    noise.connect(gain3);
    gain3.connect(ctx.destination);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.04);
  } catch {
    // Audio is non-critical — fail silently
  }
}

/**
 * Plays the notification.mp3 sound from the public directory.
 */
export function playNotificationSound() {
  try {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // Non-critical
  }
}

/**
 * Level-up fanfare sound synthesized via Web Audio API.
 * Distinct from the coin sound — richer, longer, ascending arpeggio.
 */
let lastLevelUpPlayTime = 0;
const LEVEL_UP_MIN_INTERVAL = 2000;

export function playLevelUpSound() {
  const now = Date.now();
  if (now - lastLevelUpPlayTime < LEVEL_UP_MIN_INTERVAL) return;
  lastLevelUpPlayTime = now;

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContext;
    if (ctx.state === "suspended") ctx.resume();

    // Ascending arpeggio: C5 → E5 → G5 → C6 (3 notes)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const startTime = ctx.currentTime + i * 0.12;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.01, startTime + 0.3);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });

    // Sparkle overlay — short high-frequency noise
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime + 0.35);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(ctx.currentTime + 0.35);
    noise.stop(ctx.currentTime + 0.5);
  } catch {
    // Non-critical
  }
}
