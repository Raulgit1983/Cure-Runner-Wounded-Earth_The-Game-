/**
 * Standalone encounter after the three runner stages (Raúl, 2026-09-05).
 * No Phaser, timers, storage or changes to the existing runner's rules.
 * All attack clocks and collision decisions share one fixed simulation step.
 */
export type ChomperAttack = 'low-wave' | 'high-burst';
export type ChomperPhase = 'ready' | 'warning' | 'attack' | 'recovery' | 'won' | 'lost';

export const CHOMPER_RULES = {
  step: 1 / 120,
  groundY: 552,
  heroX: 278,
  heroHalfWidth: 17,
  heroHeight: 66,
  gravity: 1280,
  jumpVelocity: -510,
  secondJumpVelocity: -440,
  lives: 3,
  notesToWin: 6,
  warningSeconds: 1.3,
  // The wave clears the player's lane before an immediate cue-timed jump
  // lands. Tested at 0 / 100 / 250 / 350 ms reaction delays, not just one bot.
  attackSeconds: 1.1,
  recoverySeconds: 2.5,
  invulnerabilitySeconds: 1.2,
  lowY: 537,
  highY: 437,
  projectileRadius: 11,
  projectileStartX: 152,
  projectileEndX: 405,
  noteX: 278,
  noteY: 446,
  noteRadius: 22
} as const;

export interface ChomperSnapshot {
  phase: ChomperPhase;
  attack: ChomperAttack;
  phaseElapsed: number;
  phaseProgress: number;
  paused: boolean;
  lives: number;
  notes: number;
  cycle: number;
  heroY: number;
  velocityY: number;
  grounded: boolean;
  jumpsUsed: number;
  invulnerability: number;
  projectile: { x: number; y: number; radius: number } | null;
  noteAvailable: boolean;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export class ChomperEncounter {
  private phase: ChomperPhase = 'ready';
  private phaseElapsed = 0;
  private paused = false;
  private lives: number = CHOMPER_RULES.lives;
  private notes = 0;
  private cycle = 0;
  private heroY: number = CHOMPER_RULES.groundY;
  private velocityY = 0;
  private jumpsUsed = 0;
  private invulnerability = 0;
  private attackHit = false;
  private noteAvailable = false;
  private accumulator = 0;

  start() {
    if (this.phase !== 'ready') return;
    this.enter('warning');
  }

  setPaused(paused: boolean) { this.paused = paused; }

  jump() {
    if (this.paused || !this.isPlaying() || this.jumpsUsed >= 2) return false;
    this.velocityY = this.jumpsUsed === 0
      ? CHOMPER_RULES.jumpVelocity : CHOMPER_RULES.secondJumpVelocity;
    this.jumpsUsed++;
    return true;
  }

  advance(seconds: number) {
    if (this.paused || !this.isPlaying() || !Number.isFinite(seconds) || seconds <= 0) return;
    // A suspended tab must not consume a whole attack before it can be seen.
    this.accumulator += Math.min(seconds, 0.1);
    while (this.accumulator + 1e-10 >= CHOMPER_RULES.step && this.isPlaying()) {
      this.accumulator -= CHOMPER_RULES.step;
      this.tick(CHOMPER_RULES.step);
    }
  }

  snapshot(): ChomperSnapshot {
    const duration = this.duration();
    return {
      phase: this.phase, attack: this.cycle % 2 === 0 ? 'low-wave' : 'high-burst',
      phaseElapsed: this.phaseElapsed,
      phaseProgress: duration ? clamp(this.phaseElapsed / duration, 0, 1) : 0,
      paused: this.paused, lives: this.lives, notes: this.notes, cycle: this.cycle,
      heroY: this.heroY, velocityY: this.velocityY,
      grounded: this.jumpsUsed === 0, jumpsUsed: this.jumpsUsed,
      invulnerability: this.invulnerability,
      projectile: this.projectile(), noteAvailable: this.noteAvailable
    };
  }

  private isPlaying() {
    return this.phase === 'warning' || this.phase === 'attack' || this.phase === 'recovery';
  }

  private duration() {
    if (this.phase === 'warning') return CHOMPER_RULES.warningSeconds;
    if (this.phase === 'attack') return CHOMPER_RULES.attackSeconds;
    if (this.phase === 'recovery') return CHOMPER_RULES.recoverySeconds;
    return 0;
  }

  private projectile() {
    if (this.phase !== 'attack') return null;
    const r = CHOMPER_RULES;
    const progress = clamp(this.phaseElapsed / r.attackSeconds, 0, 1);
    return {
      x: r.projectileStartX + (r.projectileEndX - r.projectileStartX) * progress,
      y: this.cycle % 2 === 0 ? r.lowY : r.highY,
      radius: r.projectileRadius
    };
  }

  private overlaps(x: number, y: number, radius: number) {
    const r = CHOMPER_RULES;
    const closestX = clamp(x, r.heroX - r.heroHalfWidth, r.heroX + r.heroHalfWidth);
    const closestY = clamp(y, this.heroY - r.heroHeight, this.heroY);
    return (x - closestX) ** 2 + (y - closestY) ** 2 < radius ** 2;
  }

  private tick(dt: number) {
    const r = CHOMPER_RULES;
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    if (this.jumpsUsed > 0) {
      this.velocityY += r.gravity * dt;
      this.heroY += this.velocityY * dt;
      if (this.heroY >= r.groundY) {
        this.heroY = r.groundY;
        this.velocityY = 0;
        this.jumpsUsed = 0;
      }
    }
    this.phaseElapsed += dt;
    const projectile = this.projectile();
    if (projectile && !this.attackHit && this.invulnerability <= 0 &&
        this.overlaps(projectile.x, projectile.y, projectile.radius)) {
      this.attackHit = true;
      this.lives--;
      this.invulnerability = r.invulnerabilitySeconds;
      if (this.lives === 0) { this.enter('lost'); return; }
    }
    if (this.phase === 'recovery' && this.noteAvailable &&
        this.overlaps(r.noteX, r.noteY, r.noteRadius)) {
      this.noteAvailable = false;
      this.notes++;
      if (this.notes >= r.notesToWin) { this.enter('won'); return; }
    }
    if (this.phaseElapsed + 1e-10 < this.duration()) return;
    if (this.phase === 'warning') this.enter('attack');
    else if (this.phase === 'attack') this.enter('recovery');
    else { this.cycle++; this.enter('warning'); }
  }

  private enter(phase: ChomperPhase) {
    this.phase = phase;
    this.phaseElapsed = 0;
    this.attackHit = false;
    this.noteAvailable = phase === 'recovery';
    if (phase === 'won' || phase === 'lost') this.accumulator = 0;
  }
}
