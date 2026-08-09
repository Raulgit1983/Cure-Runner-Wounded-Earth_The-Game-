/**
 * The clock behind Mateo's "Yawns Randomly" note on the Black Forest sheet.
 *
 * Phaser-free on purpose, so the whole behaviour is unit-testable and the
 * renderer is left with one job: map `phase` to one of the three drawn mouths.
 * There is no `setInterval`, no global timer and no buried `Math.random()` —
 * time arrives as a delta and randomness arrives through the constructor.
 *
 * ALL DURATIONS BELOW ARE TECHNICAL TUNING, NOT CANONICAL TEXT FROM MATEO.
 * What he wrote on the drawing is that the mouth yawns at random; the seconds
 * are this integration's conservative reading of that and can be retuned
 * without touching a single line of behaviour.
 */

export type YawnPhase = 'closed' | 'mid' | 'open';

/**
 * `opening` and `closing` are separate states with different durations but both
 * draw the same middle frame — the mouth is only drawn in three phases, while
 * the cycle passes through the middle twice.
 */
type YawnStage = 'idle' | 'opening' | 'open' | 'closing';

/** Conservative random gap between two yawns. */
export const YAWN_IDLE_MIN_SECONDS = 5;
export const YAWN_IDLE_MAX_SECONDS = 9;
/** closed -> mid. */
export const YAWN_OPENING_SECONDS = 0.26;
/** mid -> open, held. */
export const YAWN_OPEN_HOLD_SECONDS = 0.72;
/** open -> mid -> closed. Slower than opening, the way a yawn actually settles. */
export const YAWN_CLOSING_SECONDS = 0.34;

/**
 * A backgrounded tab hands back one enormous delta. Replaying the hundreds of
 * yawns it "contains" would be pointless work for a mouth nobody was looking
 * at, so past this many transitions the catch-up is abandoned: the mouth
 * settles closed and waits one fresh gap. The alternative — an unbounded loop
 * driven by an injected RNG — has no upper bound at all.
 */
const MAX_CATCH_UP_TRANSITIONS = 16;

/**
 * Time is handed to us in whatever chunks the frame rate produces, so landing
 * exactly on a phase boundary must not depend on how the delta was split.
 * Without this, `advance(5.26)` and `advance(5) + advance(0.26)` disagree:
 * the first leaves ~2e-16 seconds of the opening phase unconsumed and holds the
 * previous frame for one extra render.
 */
const BOUNDARY_EPSILON = 1e-9;

/**
 * A small self-contained PRNG (mulberry32) so the default yawn timing never
 * draws from the global `Math.random()` stream. That stream already drives
 * Tiburoncín's cooldowns and durations through Phaser's helpers, and a
 * decorative mouth must not shift the numbers gameplay pulls. Seeded from the
 * clock, so runs started at different times generally yawn on different timing.
 * Two exceptions, both harmless for a decorative mouth: clocks built inside the
 * same millisecond share a sequence (a stage only ever builds one), and the
 * 32-bit seed repeats on a ~49.7-day cycle.
 */
export const createYawnRandom = (seed: number = Date.now()): (() => number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export class YawnClock {
  private stage: YawnStage = 'idle';
  private remaining: number;
  private held = false;
  private readonly random: () => number;

  constructor(options: { random?: () => number } = {}) {
    this.random = options.random ?? createYawnRandom();
    this.remaining = this.nextIdleGap();
  }

  get phase(): YawnPhase {
    switch (this.stage) {
      case 'idle':
        return 'closed';
      case 'open':
        return 'open';
      default:
        return 'mid';
    }
  }

  /** Seconds left in the current stage. Exposed so tests can assert the gap. */
  get remainingSeconds() {
    return this.remaining;
  }

  advance(deltaSeconds: number) {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return;
    }

    this.held = false;

    let carry = deltaSeconds;
    let transitions = 0;

    while (carry + BOUNDARY_EPSILON >= this.remaining) {
      carry = Math.max(0, carry - this.remaining);
      this.enterNextStage();
      transitions += 1;

      if (transitions >= MAX_CATCH_UP_TRANSITIONS) {
        this.settleClosed();
        return;
      }
    }

    this.remaining -= carry;
  }

  /**
   * Reduced motion. Deliberately NOT the same as a pause: a pause simply stops
   * calling `advance()`, so the mouth freezes mid-yawn and resumes exactly
   * where it was, while this cancels any yawn in flight, holds the drawn mouth
   * closed and arms one fresh gap for whenever motion is allowed again.
   *
   * Idempotent: the renderer calls it every frame while the preference is on,
   * and only the first call after motion draws a new gap.
   */
  holdClosed() {
    if (this.held) {
      return;
    }

    this.settleClosed();
    // Only latched once the settle actually succeeded, so a throwing RNG cannot
    // leave the clock permanently held on a gap it never managed to draw.
    this.held = true;
  }

  /** Back to a closed mouth waiting on a fresh gap. */
  reset() {
    this.settleClosed();
    this.held = false;
  }

  /**
   * Draw first, commit second. The RNG is someone else's function: if it throws,
   * every field must still hold the values it had before the call, rather than
   * leaving the mouth idle with a 0.34 s phase duration standing in for a gap.
   */
  private settleClosed() {
    const gap = this.nextIdleGap();

    this.stage = 'idle';
    this.remaining = gap;
  }

  private enterNextStage() {
    switch (this.stage) {
      case 'idle':
        this.stage = 'opening';
        this.remaining = YAWN_OPENING_SECONDS;
        break;
      case 'opening':
        this.stage = 'open';
        this.remaining = YAWN_OPEN_HOLD_SECONDS;
        break;
      case 'open':
        this.stage = 'closing';
        this.remaining = YAWN_CLOSING_SECONDS;
        break;
      case 'closing':
        this.settleClosed();
        break;
    }
  }

  /**
   * The RNG's output is untrusted: a finite value outside [0,1] is clamped to
   * the nearer end of the range, and a non-finite one falls back to the middle,
   * so no draw can produce a zero-length, negative or infinite gap.
   */
  private nextIdleGap() {
    const raw = this.random();
    const unit = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 1) : 0.5;

    return YAWN_IDLE_MIN_SECONDS + unit * (YAWN_IDLE_MAX_SECONDS - YAWN_IDLE_MIN_SECONDS);
  }
}
