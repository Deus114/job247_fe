let audioContext: AudioContext | null = null;

function sharedAudioContext(): AudioContext | null {
  const Ctx = window.AudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

/** Short two-note chime. Browsers may block this until the user has interacted with the page. */
export function playNotificationSound(): void {
  const ctx = sharedAudioContext();
  if (!ctx) return;
  void ctx
    .resume()
    .then(() => {
      const now = ctx.currentTime;
      [880, 1175].forEach((frequency, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + index * 0.11;
        osc.type = "sine";
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.06, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    })
    .catch(() => undefined);
}
