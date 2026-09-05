import { audioCueBus, type AudioCueEvent } from '@/game/services/audio/audioCueBus';

type AudioContextCtor = typeof AudioContext;
type OscillatorKind = OscillatorType;

const getAudioContextCtor = (): AudioContextCtor | null => {
  const scopedWindow = window as Window & typeof globalThis & { webkitAudioContext?: AudioContextCtor };

  return scopedWindow.AudioContext ?? scopedWindow.webkitAudioContext ?? null;
};

// Collect cue uses a major-pentatonic run so each chained pickup steps up the
// scale (C D E G A across ~two octaves). Pentatonic notes stay consonant at any
// chain length, so the melody is always gentle/hopeful and never shrill. The
// chain resets to the root when the combo breaks — collecting becomes a small,
// readable musical phrase that rewards timing and attention.
const COLLECT_ROOT_HZ = 523.25; // C5
const COLLECT_SCALE_SEMITONES = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

const collectNoteFrequency = (chain: number) => {
  const step = Math.max(0, Math.floor(chain) - 1);
  const semitone = COLLECT_SCALE_SEMITONES[Math.min(step, COLLECT_SCALE_SEMITONES.length - 1)];

  return COLLECT_ROOT_HZ * 2 ** (semitone / 12);
};

class ReactiveAudioLayer {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly offCue = audioCueBus.subscribe((event) => {
    this.handleCue(event);
  });
  private readonly offUnlock = audioCueBus.subscribeUnlock(() => {
    void this.resume();
  });

  destroy() {
    this.offCue();
    this.offUnlock();

    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch(() => undefined);
    }
  }

  private ensureContext() {
    if (this.context && this.master) {
      return {
        context: this.context,
        master: this.master
      };
    }

    const ContextCtor = getAudioContextCtor();

    if (!ContextCtor) {
      return null;
    }

    const context = new ContextCtor();
    const master = context.createGain();

    master.gain.value = 0.11;
    master.connect(context.destination);

    this.context = context;
    this.master = master;

    return {
      context,
      master
    };
  }

  private async resume() {
    const audio = this.ensureContext();

    if (!audio) {
      return;
    }

    if (audio.context.state === 'suspended') {
      await audio.context.resume().catch(() => undefined);
    }
  }

  private handleCue(event: AudioCueEvent) {
    if (!event.unlocked) {
      return;
    }

    const audio = this.ensureContext();

    if (!audio) {
      return;
    }

    if (audio.context.state !== 'running') {
      void audio.context
        .resume()
        .then(() => {
          this.renderCue(audio.context, audio.master, event);
        })
        .catch(() => undefined);
      return;
    }

    this.renderCue(audio.context, audio.master, event);
  }

  private renderCue(context: AudioContext, master: GainNode, event: AudioCueEvent) {
    if (event.type === 'chomper_warning_low' || event.type === 'chomper_warning_high') {
      const low = event.type === 'chomper_warning_low';
      this.playTone(context, master, {
        from: low ? 220 : 660, to: low ? 174 : 880,
        duration: 0.18, volume: 0.026, type: 'triangle', attack: 0.02
      });
      this.playTone(context, master, {
        from: low ? 174 : 880, to: low ? 146 : 990,
        duration: 0.16, delay: 0.2, volume: 0.022, type: 'sine', attack: 0.02
      });
      return;
    }

    if (event.type === 'spark_collect') {
      const note = collectNoteFrequency(event.chain ?? 1);
      this.playTone(context, master, {
        // Gentle upward ping into the scale note keeps the pluck-like attack
        // while the landing pitch carries the climbing melody.
        from: note * 0.94,
        to: note,
        duration: 0.1,
        volume: 0.04 + Math.min(0.018, event.intensity * 0.006),
        type: 'triangle'
      });
      return;
    }

    if (event.type === 'chain_success') {
      this.playTone(context, master, {
        from: 700,
        to: 1040,
        duration: 0.12,
        volume: 0.038,
        type: 'triangle'
      });
      this.playTone(context, master, {
        from: 960,
        to: 1240,
        duration: 0.11,
        delay: 0.07,
        volume: 0.03,
        type: 'sine'
      });
      return;
    }

    if (event.type === 'pulse_drop') {
      this.playTone(context, master, {
        from: 190,
        to: 108,
        duration: 0.18,
        volume: 0.05 + Math.min(0.02, event.intensity * 0.004),
        type: 'square',
        filterFrequency: 520
      });
      return;
    }

    if (event.type === 'awakening_gain') {
      this.playTone(context, master, {
        from: 480,
        to: 620,
        duration: 0.18,
        volume: 0.026,
        type: 'sine'
      });
      this.playTone(context, master, {
        from: 760,
        to: 980,
        duration: 0.15,
        delay: 0.05,
        volume: 0.022,
        type: 'triangle'
      });
      return;
    }

    if (event.type === 'reserve_fill') {
      this.playTone(context, master, {
        from: 880,
        to: 1320,
        duration: 0.22,
        volume: 0.06,
        type: 'triangle'
      });
      this.playTone(context, master, {
        from: 1320,
        to: 1760,
        duration: 0.36,
        volume: 0.04,
        delay: 0.08,
        type: 'sine'
      });
      return;
    }

    if (event.type === 'shark_touch') {
      this.playTone(context, master, {
        from: 620,
        to: 920,
        duration: 0.1,
        volume: 0.028,
        type: 'sine',
        attack: 0.006
      });
      this.playTone(context, master, {
        from: 940,
        to: 1320,
        duration: 0.16,
        delay: 0.03,
        volume: 0.03,
        type: 'triangle',
        attack: 0.007
      });
      this.playTone(context, master, {
        from: 1480,
        to: 1880,
        duration: 0.2,
        delay: 0.07,
        volume: 0.02,
        type: 'sine',
        attack: 0.01
      });
      this.playTone(context, master, {
        from: 1760,
        to: 2280,
        duration: 0.22,
        delay: 0.12,
        volume: 0.012,
        type: 'triangle',
        attack: 0.014
      });
      return;
    }

    if (event.type === 'awakening_touch') {
      this.playTone(context, master, {
        from: 460,
        to: 620,
        duration: 0.13,
        volume: 0.026,
        type: 'sine',
        attack: 0.008
      });
      this.playTone(context, master, {
        from: 740,
        to: 1180,
        duration: 0.24,
        delay: 0.03,
        volume: 0.03,
        type: 'triangle',
        attack: 0.009
      });
      this.playTone(context, master, {
        from: 1180,
        to: 1580,
        duration: 0.32,
        delay: 0.09,
        volume: 0.026,
        type: 'sine',
        attack: 0.012
      });
      this.playTone(context, master, {
        from: 1580,
        to: 2120,
        duration: 0.42,
        delay: 0.16,
        volume: 0.016,
        type: 'triangle',
        attack: 0.016
      });
      return;
    }

    if (event.type === 'victory_win') {
      this.playTone(context, master, {
        from: 392,
        to: 523,
        duration: 0.18,
        volume: 0.032,
        type: 'sine'
      });
      this.playTone(context, master, {
        from: 523,
        to: 659,
        duration: 0.22,
        delay: 0.08,
        volume: 0.03,
        type: 'triangle'
      });
      this.playTone(context, master, {
        from: 659,
        to: 784,
        duration: 0.28,
        delay: 0.16,
        volume: 0.026,
        type: 'sine'
      });
      this.playTone(context, master, {
        from: 784,
        to: 1174,
        duration: 0.36,
        delay: 0.22,
        volume: 0.02,
        type: 'triangle',
        attack: 0.014
      });
      return;
    }

    if (event.type === 'jump_player') {
      const jumpIntensity = Math.max(0.92, Math.min(1.3, event.intensity || 1));

      this.playTone(context, master, {
        from: 240,
        to: 180,
        duration: 0.024,
        volume: 0.0066 * jumpIntensity,
        type: 'triangle',
        attack: 0.003,
        filterFrequency: 420
      });
      this.playTone(context, master, {
        from: 300,
        to: 560,
        duration: 0.082,
        delay: 0.004,
        volume: 0.024 * jumpIntensity,
        type: 'triangle',
        attack: 0.006,
        filterFrequency: 1200
      });
      this.playTone(context, master, {
        from: 460,
        to: 620,
        duration: 0.042,
        delay: 0.014,
        volume: 0.009 * jumpIntensity,
        type: 'sine',
        attack: 0.004
      });
      return;
    }
  }

  private playTone(
    context: AudioContext,
    master: GainNode,
    options: {
      from: number;
      to: number;
      duration: number;
      volume: number;
      type: OscillatorKind;
      delay?: number;
      filterFrequency?: number;
      attack?: number;
    }
  ) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const filter = options.filterFrequency ? context.createBiquadFilter() : null;
    const startTime = context.currentTime + (options.delay ?? 0);
    const attack = options.attack ?? 0.012;
    const releaseTime = startTime + options.duration;
    const stopTime = releaseTime + 0.05;

    oscillator.type = options.type;
    oscillator.frequency.setValueAtTime(options.from, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, options.to), releaseTime);

    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(options.volume, startTime + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, releaseTime);

    if (filter) {
      filter.type = 'lowpass';
      filter.frequency.value = options.filterFrequency ?? 520;
      oscillator.connect(filter);
      filter.connect(envelope);
    } else {
      oscillator.connect(envelope);
    }

    envelope.connect(master);
    oscillator.start(startTime);
    oscillator.stop(stopTime);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      filter?.disconnect();
    };
  }
}

export const createReactiveAudioLayer = () => new ReactiveAudioLayer();
