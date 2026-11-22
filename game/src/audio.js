// EMBERFALL — tiny synthesised sounds, WebAudio only, no audio files.
// Every sound is a few oscillators; the game plays exactly the same with
// the sound off, and nothing here is ever required for play.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;
        context = new AudioContext();
      } catch {
        return null;
      }
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function tone(freq, at, dur, type, vol) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    try {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      const start = audio.currentTime + at;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(vol || 0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    } catch {
      // Sound is decoration: a failure here never stops the game.
    }
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    playFlip() {
      tone(660, 0, 0.08, 'triangle', 0.1);
    },
    playRoundWin() {
      tone(523, 0, 0.12, 'sine', 0.12);
      tone(784, 0.09, 0.16, 'sine', 0.12);
    },
    playRoundLose() {
      tone(392, 0, 0.12, 'sine', 0.1);
      tone(262, 0.09, 0.18, 'sine', 0.1);
    },
    playGameWin() {
      [523, 659, 784, 1047].forEach((freq, i) => tone(freq, i * 0.12, 0.22, 'sine', 0.13));
    },
    playGameLose() {
      [392, 330, 262, 196].forEach((freq, i) => tone(freq, i * 0.14, 0.24, 'sine', 0.1));
    },
    playDeal() {
      tone(880, 0, 0.05, 'triangle', 0.06);
    },
  };
}
