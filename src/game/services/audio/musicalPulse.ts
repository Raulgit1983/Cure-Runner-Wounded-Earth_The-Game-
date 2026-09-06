interface SoundClock { readonly currentTime: number; readonly state: string }
interface Pulse { clock: SoundClock; start: number; duration: number; strength: number }
/** Visual envelope sampled from the very same audio clock used by oscillator.start. */
export class MusicalPulse {
  private pulses: Pulse[] = [];
  schedule(clock: SoundClock, start: number, duration: number, strength = 1) {
    this.pulses = this.pulses.filter(p => p.clock.state !== 'closed' && p.clock.currentTime - p.start < p.duration + .35);
    this.pulses.push({ clock, start, duration: Math.max(.18, Math.min(.4, duration)), strength });
    if (this.pulses.length > 32) this.pulses.shift();
  }
  sample() {
    let level = 0;
    for (const p of this.pulses) {
      if (p.clock.state !== 'running') continue;
      const age = p.clock.currentTime - p.start;
      if (age < 0 || age > p.duration) continue;
      const attack = .035;
      const envelope = age < attack ? age / attack : (1 - (age - attack) / (p.duration - attack)) ** 2;
      level = Math.max(level, envelope * p.strength);
    }
    return Math.min(1, level);
  }
}
export const musicalPulse = new MusicalPulse();
