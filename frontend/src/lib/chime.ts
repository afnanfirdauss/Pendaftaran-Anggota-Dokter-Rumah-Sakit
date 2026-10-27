// Web Audio API Ding-Dong Chime & Indonesian Speech Synthesis

class SoundNotifier {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
      return null;
    }
  }

  /**
   * Play professional airport/hospital 2-tone chime bell (Ding-Dong)
   */
  public playChime(): Promise<void> {
    return new Promise((resolve) => {
      const ctx = this.getAudioContext();
      if (!ctx) {
        resolve();
        return;
      }

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.8);

      // Note 2: C5 (523.25 Hz) - 0.35s delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.35);
      gain2.gain.setValueAtTime(0.35, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.35);
      osc2.stop(now + 1.4);

      setTimeout(() => {
        resolve();
      }, 1400);
    });
  }

  /**
   * Call patient queue with chime followed by voice announcement
   */
  public async announceQueue(queueNumber: string, clinicName: string): Promise<void> {
    await this.playChime();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel any active speech

      // Space out letters and digits so it pronounces e.g. "A kosong kosong satu" or "A nol nol satu"
      const queueSpaced = queueNumber.split('').join(' ');
      const text = `Nomor antrean, ${queueSpaced}, silakan menuju ${clinicName}.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9; // clear, steady hospital pace
      utterance.pitch = 1.0;

      // Try to find Indonesian voice if available in browser
      const voices = window.speechSynthesis.getVoices();
      const indonesianVoice = voices.find(v => v.lang.startsWith('id'));
      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }
}

export const soundNotifier = new SoundNotifier();
