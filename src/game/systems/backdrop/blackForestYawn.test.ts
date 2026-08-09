import { describe, expect, it } from 'vitest';

import {
  createYawnRandom,
  YawnClock,
  YAWN_CLOSING_SECONDS,
  YAWN_IDLE_MAX_SECONDS,
  YAWN_IDLE_MIN_SECONDS,
  YAWN_OPENING_SECONDS,
  YAWN_OPEN_HOLD_SECONDS,
  type YawnPhase
} from './blackForestYawn';

/**
 * The Black Forest mouth is drawn art swapped between three phases, so the only
 * thing that can be wrong is the timing. That is exactly what lives here — the
 * clock is Phaser-free specifically so this file can exist.
 */

/** Feeds the clock a fixed unit value, so every idle gap is predictable. */
const fixedRandom = (unit: number) => () => unit;

/** Steps until the clock reports `wanted`, with a runaway guard. */
const advanceUntilPhase = (clock: YawnClock, wanted: YawnPhase, step: number) => {
  for (let guard = 0; guard < 20_000; guard += 1) {
    if (clock.phase === wanted) {
      return true;
    }

    clock.advance(step);
  }

  return false;
};

/** Steps the clock in small ticks and reports the phases it passed through. */
const collectPhases = (clock: YawnClock, seconds: number, step = 1 / 60) => {
  const seen: YawnPhase[] = [clock.phase];

  for (let elapsed = 0; elapsed < seconds; elapsed += step) {
    clock.advance(step);

    if (clock.phase !== seen[seen.length - 1]) {
      seen.push(clock.phase);
    }
  }

  return seen;
};

describe('YawnClock', () => {
  it('rests closed', () => {
    const clock = new YawnClock({ random: fixedRandom(0.5) });

    expect(clock.phase).toBe('closed');
  });

  it('stays closed for the whole idle gap before the first yawn', () => {
    const clock = new YawnClock({ random: fixedRandom(0) });

    clock.advance(YAWN_IDLE_MIN_SECONDS - 0.05);

    expect(clock.phase).toBe('closed');
  });

  it('runs closed -> mid -> open -> mid -> closed in that order', () => {
    const clock = new YawnClock({ random: fixedRandom(0) });
    const wholeCycle =
      YAWN_IDLE_MIN_SECONDS +
      YAWN_OPENING_SECONDS +
      YAWN_OPEN_HOLD_SECONDS +
      YAWN_CLOSING_SECONDS +
      0.1;

    expect(collectPhases(clock, wholeCycle)).toEqual([
      'closed',
      'mid',
      'open',
      'mid',
      'closed'
    ]);
  });

  it('holds each phase for its declared duration', () => {
    const clock = new YawnClock({ random: fixedRandom(0) });

    clock.advance(YAWN_IDLE_MIN_SECONDS);
    expect(clock.phase).toBe('mid');

    clock.advance(YAWN_OPENING_SECONDS);
    expect(clock.phase).toBe('open');

    clock.advance(YAWN_OPEN_HOLD_SECONDS);
    expect(clock.phase).toBe('mid');

    clock.advance(YAWN_CLOSING_SECONDS);
    expect(clock.phase).toBe('closed');
  });

  it('keeps every idle gap inside 5-9 seconds', () => {
    const random = createYawnRandom(20260809);

    for (let attempt = 0; attempt < 200; attempt += 1) {
      const clock = new YawnClock({ random });

      expect(clock.remainingSeconds).toBeGreaterThanOrEqual(YAWN_IDLE_MIN_SECONDS);
      expect(clock.remainingSeconds).toBeLessThanOrEqual(YAWN_IDLE_MAX_SECONDS);
    }
  });

  it('spends the low and high ends of the gap range on the matching rng value', () => {
    expect(new YawnClock({ random: fixedRandom(0) }).remainingSeconds).toBe(
      YAWN_IDLE_MIN_SECONDS
    );
    expect(new YawnClock({ random: fixedRandom(1) }).remainingSeconds).toBe(
      YAWN_IDLE_MAX_SECONDS
    );
  });

  it('is deterministic for a given rng, and actually uses the one injected', () => {
    const run = (seed: number) =>
      collectPhases(new YawnClock({ random: createYawnRandom(seed) }), 40);

    expect(run(7)).toEqual(run(7));
    // A clock that ignored the injected rng would produce identical timing for
    // every seed, so this is what stops the determinism check being vacuous.
    const early = new YawnClock({ random: fixedRandom(0) });
    const late = new YawnClock({ random: fixedRandom(1) });

    early.advance(YAWN_IDLE_MIN_SECONDS + 0.01);
    late.advance(YAWN_IDLE_MIN_SECONDS + 0.01);

    expect(early.phase).toBe('mid');
    expect(late.phase).toBe('closed');
  });

  it('clamps a misbehaving rng instead of producing an impossible gap', () => {
    const outOfRange = [-5, 4, Number.NaN, Number.POSITIVE_INFINITY];

    outOfRange.forEach((value) => {
      const clock = new YawnClock({ random: fixedRandom(value) });

      expect(Number.isFinite(clock.remainingSeconds)).toBe(true);
      expect(clock.remainingSeconds).toBeGreaterThanOrEqual(YAWN_IDLE_MIN_SECONDS);
      expect(clock.remainingSeconds).toBeLessThanOrEqual(YAWN_IDLE_MAX_SECONDS);
    });
  });

  it('never yawns partway through a single huge delta — it settles closed', () => {
    const clock = new YawnClock({ random: fixedRandom(0.5) });

    clock.advance(60 * 60);

    expect(clock.phase).toBe('closed');
    expect(clock.remainingSeconds).toBeGreaterThanOrEqual(YAWN_IDLE_MIN_SECONDS);
    expect(clock.remainingSeconds).toBeLessThanOrEqual(YAWN_IDLE_MAX_SECONDS);
  });

  it('always leaves a positive, finite countdown whatever the delta', () => {
    const deltas = [1 / 120, 1 / 60, 0.25, 1, 5, 12, 90, 6000];

    deltas.forEach((delta) => {
      const clock = new YawnClock({ random: fixedRandom(0.5) });

      clock.advance(delta);

      expect(clock.remainingSeconds).toBeGreaterThan(0);
      expect(Number.isFinite(clock.remainingSeconds)).toBe(true);
    });
  });

  it('reaches the same phase whether a delta arrives whole or in pieces', () => {
    // Frame deltas are whatever the frame rate hands over, so landing on a
    // phase boundary must not depend on how the time was chopped up.
    const splits = [
      [YAWN_IDLE_MIN_SECONDS, YAWN_OPENING_SECONDS],
      [YAWN_IDLE_MIN_SECONDS, YAWN_OPENING_SECONDS, YAWN_OPEN_HOLD_SECONDS],
      [YAWN_IDLE_MIN_SECONDS, YAWN_OPENING_SECONDS, YAWN_OPEN_HOLD_SECONDS, YAWN_CLOSING_SECONDS]
    ];

    splits.forEach((parts) => {
      const piecemeal = new YawnClock({ random: fixedRandom(0) });
      const whole = new YawnClock({ random: fixedRandom(0) });

      parts.forEach((part) => piecemeal.advance(part));
      whole.advance(parts.reduce((total, part) => total + part, 0));

      expect(whole.phase).toBe(piecemeal.phase);
    });
  });

  it('keeps gaps in range and varying across many completed yawns', () => {
    const clock = new YawnClock({ random: createYawnRandom(4242) });
    const gaps: number[] = [];

    // Walk whole cycles and record the gap armed after each one, rather than
    // only the gap the constructor drew.
    for (let cycle = 0; cycle < 40; cycle += 1) {
      expect(advanceUntilPhase(clock, 'mid', 0.25)).toBe(true);
      expect(advanceUntilPhase(clock, 'closed', 0.05)).toBe(true);

      gaps.push(clock.remainingSeconds);
    }

    gaps.forEach((gap) => {
      expect(gap).toBeGreaterThanOrEqual(YAWN_IDLE_MIN_SECONDS - 0.3);
      expect(gap).toBeLessThanOrEqual(YAWN_IDLE_MAX_SECONDS);
    });
    expect(new Set(gaps.map((gap) => gap.toFixed(3))).size).toBeGreaterThan(20);
  });

  it('survives an injected rng that throws, and recovers when it works again', () => {
    let live = true;
    const clock = new YawnClock({
      random: () => {
        if (!live) {
          throw new Error('rng exploded');
        }
        return 0;
      }
    });

    live = false;
    clock.advance(YAWN_IDLE_MIN_SECONDS + 0.01);
    expect(clock.phase).toBe('mid');

    // Finishing a yawn needs a fresh gap, so the rng blows up on the closing
    // edge — with the clock partway through consuming this delta.
    expect(() =>
      clock.advance(YAWN_OPENING_SECONDS + YAWN_OPEN_HOLD_SECONDS + YAWN_CLOSING_SECONDS + 1)
    ).toThrow();

    // It must be left exactly where the failed draw found it: still closing,
    // still counting down that phase. Committing the stage before drawing the
    // gap would instead leave it "closed" holding a 0.34 s phase duration as if
    // it were a 5-9 s interval, and this is the assertion that catches that.
    expect(clock.phase).toBe('mid');
    expect(clock.remainingSeconds).toBe(YAWN_CLOSING_SECONDS);

    // holdClosed() must not latch onto a gap it never managed to draw.
    expect(() => clock.holdClosed()).toThrow();
    expect(clock.phase).toBe('mid');
    expect(clock.remainingSeconds).toBe(YAWN_CLOSING_SECONDS);

    // Once the rng works again the mouth closes on a real interval...
    live = true;
    clock.holdClosed();
    expect(clock.phase).toBe('closed');
    expect(clock.remainingSeconds).toBe(YAWN_IDLE_MIN_SECONDS);

    // ...and the cycle carries on normally from there, arming a valid gap.
    clock.advance(YAWN_IDLE_MIN_SECONDS + 0.01);
    expect(clock.phase).toBe('mid');
    expect(advanceUntilPhase(clock, 'open', 0.05)).toBe(true);
    expect(advanceUntilPhase(clock, 'closed', 0.05)).toBe(true);
    // Tight on purpose: a loose `> 0` here would also accept the 0.34 s phase
    // duration that the broken version left standing in for an interval. This
    // rng returns 0, so the fresh gap is the 5 s floor, less the step's
    // overshoot of at most 0.05 s.
    expect(clock.remainingSeconds).toBeGreaterThan(YAWN_IDLE_MIN_SECONDS - 0.05);
    expect(clock.remainingSeconds).toBeLessThanOrEqual(YAWN_IDLE_MIN_SECONDS);
  });

  it('ignores a zero, negative or non-finite delta', () => {
    const clock = new YawnClock({ random: fixedRandom(0) });
    const before = clock.remainingSeconds;

    [0, -1, Number.NaN, Number.POSITIVE_INFINITY].forEach((delta) => clock.advance(delta));

    expect(clock.remainingSeconds).toBe(before);
    expect(clock.phase).toBe('closed');
  });

  it('freezes and resumes across a pause, which is simply not advancing it', () => {
    const paused = new YawnClock({ random: fixedRandom(0) });
    const unpaused = new YawnClock({ random: fixedRandom(0) });

    // A pause is a hard freeze: JourneyScene.update() returns before the
    // backdrop, so advance() is simply never called. Resuming must therefore
    // land in the same place as never having paused at all.
    paused.advance(YAWN_IDLE_MIN_SECONDS + YAWN_OPENING_SECONDS);
    paused.advance(YAWN_OPEN_HOLD_SECONDS);
    unpaused.advance(YAWN_IDLE_MIN_SECONDS + YAWN_OPENING_SECONDS + YAWN_OPEN_HOLD_SECONDS);

    expect(paused.phase).toBe(unpaused.phase);
    expect(paused.remainingSeconds).toBeCloseTo(unpaused.remainingSeconds, 10);
  });

  it('holds the mouth closed under reduced motion, cancelling a yawn in flight', () => {
    const clock = new YawnClock({ random: fixedRandom(0) });

    // Nudged past the boundary on purpose: summing the two durations and
    // landing exactly on the transition is a float coin-flip, not a behaviour.
    clock.advance(YAWN_IDLE_MIN_SECONDS + YAWN_OPENING_SECONDS + 0.01);
    expect(clock.phase).toBe('open');

    clock.holdClosed();
    expect(clock.phase).toBe('closed');

    // The renderer calls holdClosed() every frame while the preference is on.
    for (let frame = 0; frame < 600; frame += 1) {
      clock.holdClosed();
    }

    expect(clock.phase).toBe('closed');
  });

  it('does not redraw a gap on every reduced-motion frame', () => {
    let draws = 0;
    const clock = new YawnClock({
      random: () => {
        draws += 1;
        return 0.5;
      }
    });

    expect(draws).toBe(1);

    for (let frame = 0; frame < 100; frame += 1) {
      clock.holdClosed();
    }

    expect(draws).toBe(2);
  });

  it('waits a fresh full gap when reduced motion is turned back off', () => {
    const clock = new YawnClock({ random: fixedRandom(0) });

    clock.advance(YAWN_IDLE_MIN_SECONDS - 0.1);
    clock.holdClosed();
    clock.advance(YAWN_IDLE_MIN_SECONDS - 0.1);

    expect(clock.phase).toBe('closed');

    clock.advance(0.2);
    expect(clock.phase).toBe('mid');
  });

  it('resets to a closed mouth on a fresh gap', () => {
    const clock = new YawnClock({ random: fixedRandom(0) });

    // Nudged past the boundary on purpose: summing the two durations and
    // landing exactly on the transition is a float coin-flip, not a behaviour.
    clock.advance(YAWN_IDLE_MIN_SECONDS + YAWN_OPENING_SECONDS + 0.01);
    expect(clock.phase).toBe('open');

    clock.reset();

    expect(clock.phase).toBe('closed');
    expect(clock.remainingSeconds).toBe(YAWN_IDLE_MIN_SECONDS);
  });
});

describe('createYawnRandom', () => {
  it('stays inside [0,1)', () => {
    const random = createYawnRandom(1);

    for (let draw = 0; draw < 1000; draw += 1) {
      const value = random();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('repeats for the same seed and differs for another', () => {
    const first = createYawnRandom(42);
    const second = createYawnRandom(42);
    const third = createYawnRandom(43);

    const draw = (source: () => number) => Array.from({ length: 8 }, source);

    expect(draw(first)).toEqual(draw(second));
    expect(draw(createYawnRandom(42))).not.toEqual(draw(third));
  });
});
