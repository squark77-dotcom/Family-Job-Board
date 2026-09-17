function playNotes(notes: Array<{ frequency: number; start: number; duration: number }>) {
  if (typeof window === "undefined") return;

  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const masterGain = context.createGain();
  masterGain.gain.setValueAtTime(0.0001, context.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.015);
  masterGain.connect(context.destination);

  for (const note of notes) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startsAt = context.currentTime + note.start;
    const endsAt = startsAt + note.duration;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(note.frequency, startsAt);
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.8, startsAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(startsAt);
    oscillator.stop(endsAt);
  }

  const finalTime = Math.max(...notes.map((note) => note.start + note.duration));
  window.setTimeout(() => void context.close(), (finalTime + 0.1) * 1000);
}

export function playClaimSound() {
  playNotes([
    { frequency: 523.25, start: 0, duration: 0.12 },
    { frequency: 659.25, start: 0.1, duration: 0.16 },
  ]);
}

export function playCompletionSound() {
  playNotes([
    { frequency: 523.25, start: 0, duration: 0.14 },
    { frequency: 659.25, start: 0.1, duration: 0.14 },
    { frequency: 783.99, start: 0.2, duration: 0.2 },
    { frequency: 1046.5, start: 0.34, duration: 0.3 },
  ]);
}

export function playNotCompleteSound() {
  playNotes([
    { frequency: 392, start: 0, duration: 0.28 },
    { frequency: 349.23, start: 0.24, duration: 0.3 },
    { frequency: 293.66, start: 0.5, duration: 0.34 },
    { frequency: 246.94, start: 0.8, duration: 0.5 },
  ]);
}