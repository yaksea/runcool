/**
 * Lightweight Web Audio SFX — cute chiptune-ish blips, no asset files needed.
 * Must unlock() after a user gesture (browser autoplay policy).
 */

type Tone = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  delay?: number;
  slideTo?: number;
};

class SoundSystemImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private unlocked = false;
  enabled = true;

  unlock(): void {
    if (this.unlocked) {
      void this.ctx?.resume();
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.28;
    this.master.connect(this.ctx.destination);
    this.unlocked = true;
    void this.ctx.resume();
  }

  private playTones(tones: Tone[]): void {
    if (!this.enabled) return;
    this.unlock();
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || ctx.state === 'closed') return;
    void ctx.resume();

    const t0 = ctx.currentTime;
    for (const tone of tones) {
      const start = t0 + (tone.delay ?? 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone.type ?? 'triangle';
      osc.frequency.setValueAtTime(tone.freq, start);
      if (tone.slideTo != null) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(40, tone.slideTo),
          start + tone.dur,
        );
      }
      const vol = tone.vol ?? 0.35;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(vol, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + tone.dur + 0.02);
    }
  }

  /** Soft hop — ground jump */
  jump(doubleJump = false): void {
    if (doubleJump) {
      this.playTones([
        { freq: 520, dur: 0.07, type: 'sine', vol: 0.28 },
        { freq: 780, dur: 0.09, type: 'triangle', vol: 0.22, delay: 0.04 },
      ]);
    } else {
      this.playTones([
        { freq: 420, dur: 0.08, type: 'sine', vol: 0.3, slideTo: 620 },
      ]);
    }
  }

  /** Weapon fire — short playful peep / pop by type */
  shoot(kind: 'melee' | 'pea' | 'fire' | 'shot' = 'pea'): void {
    switch (kind) {
      case 'melee':
        this.playTones([
          { freq: 240, dur: 0.05, type: 'square', vol: 0.18 },
          { freq: 180, dur: 0.06, type: 'triangle', vol: 0.16, delay: 0.02 },
        ]);
        break;
      case 'fire':
        this.playTones([
          { freq: 300, dur: 0.1, type: 'sawtooth', vol: 0.14, slideTo: 160 },
          { freq: 520, dur: 0.06, type: 'triangle', vol: 0.12, delay: 0.03 },
        ]);
        break;
      case 'shot':
        this.playTones([
          { freq: 700, dur: 0.04, type: 'square', vol: 0.14 },
          { freq: 560, dur: 0.04, type: 'square', vol: 0.12, delay: 0.03 },
          { freq: 840, dur: 0.05, type: 'triangle', vol: 0.12, delay: 0.06 },
        ]);
        break;
      default:
        this.playTones([
          { freq: 880, dur: 0.05, type: 'sine', vol: 0.26, slideTo: 1200 },
          { freq: 1320, dur: 0.04, type: 'triangle', vol: 0.14, delay: 0.035 },
        ]);
    }
  }

  /** Skill activate — sparkly arpeggio */
  skill(kind: 'blink' | 'haste' | 'flight' | 'none' = 'none'): void {
    if (kind === 'blink') {
      this.playTones([
        { freq: 660, dur: 0.05, type: 'sine', vol: 0.24 },
        { freq: 990, dur: 0.06, type: 'sine', vol: 0.22, delay: 0.04 },
        { freq: 1320, dur: 0.08, type: 'triangle', vol: 0.18, delay: 0.08 },
      ]);
      return;
    }
    if (kind === 'haste') {
      this.playTones([
        { freq: 500, dur: 0.05, type: 'triangle', vol: 0.22 },
        { freq: 640, dur: 0.05, type: 'triangle', vol: 0.2, delay: 0.04 },
        { freq: 800, dur: 0.05, type: 'triangle', vol: 0.18, delay: 0.08 },
        { freq: 1000, dur: 0.08, type: 'sine', vol: 0.16, delay: 0.12 },
      ]);
      return;
    }
    if (kind === 'flight') {
      this.playTones([
        { freq: 400, dur: 0.12, type: 'sine', vol: 0.22, slideTo: 720 },
        { freq: 900, dur: 0.1, type: 'triangle', vol: 0.14, delay: 0.08 },
      ]);
      return;
    }
    this.playTones([{ freq: 300, dur: 0.08, type: 'sine', vol: 0.15 }]);
  }

  /** Lever / breakable — soft click + chime */
  interact(kind: 'break' | 'control' = 'control'): void {
    if (kind === 'break') {
      this.playTones([
        { freq: 200, dur: 0.06, type: 'square', vol: 0.16 },
        { freq: 140, dur: 0.08, type: 'triangle', vol: 0.14, delay: 0.03 },
        { freq: 520, dur: 0.07, type: 'sine', vol: 0.18, delay: 0.07 },
      ]);
    } else {
      this.playTones([
        { freq: 620, dur: 0.05, type: 'sine', vol: 0.22 },
        { freq: 820, dur: 0.07, type: 'triangle', vol: 0.2, delay: 0.05 },
      ]);
    }
  }
}

export const SoundSystem = new SoundSystemImpl();
