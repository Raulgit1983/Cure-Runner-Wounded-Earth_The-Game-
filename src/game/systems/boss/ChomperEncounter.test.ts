import { describe, expect, it } from 'vitest';
import { CHOMPER_RULES as R, ChomperEncounter } from './ChomperEncounter';

const step = (game: ChomperEncounter, seconds: number, hz = 120) => {
  for (let i = 0; i < Math.round(seconds * hz); i++) game.advance(1 / hz);
};
const started = () => { const game = new ChomperEncounter(); game.start(); return game; };

describe('Chomper encounter', () => {
  it('waits for an explicit start, then warns without creating a hazard', () => {
    const game = new ChomperEncounter();
    game.advance(20);
    expect(game.jump()).toBe(false);
    expect(game.snapshot().phase).toBe('ready');
    game.start(); game.start();
    step(game, R.warningSeconds - R.step);
    expect(game.snapshot()).toMatchObject({ phase: 'warning', lives: 3, projectile: null });
    step(game, R.step);
    expect(game.snapshot().phase).toBe('attack');
  });

  it('a grounded low-wave hit happens once, never every overlapping frame', () => {
    const game = started();
    step(game, R.warningSeconds + R.attackSeconds);
    expect(game.snapshot()).toMatchObject({ lives: 2, phase: 'recovery', projectile: null });
  });

  it.each([0, 0.1, 0.25, 0.35])('a single jump %s s after the Now cue clears the low wave', (reactionSeconds) => {
    const game = started();
    step(game, R.warningSeconds + reactionSeconds);
    game.jump();
    step(game, R.attackSeconds - reactionSeconds);
    expect(game.snapshot()).toMatchObject({ lives: 3, phase: 'recovery' });
  });

  it('staying grounded clears the high discharge after the first recovery', () => {
    const game = started();
    step(game, R.warningSeconds + R.attackSeconds + R.recoverySeconds);
    expect(game.snapshot().attack).toBe('high-burst');
    const lives = game.snapshot().lives;
    step(game, R.warningSeconds + R.attackSeconds);
    expect(game.snapshot().lives).toBe(lives);
  });

  it('jumping into the high discharge can hit the hero', () => {
    const game = started();
    step(game, R.warningSeconds + R.attackSeconds + R.recoverySeconds + R.warningSeconds + 0.25);
    game.jump();
    step(game, 1);
    expect(game.snapshot().lives).toBe(1);
  });

  it('recovery notes require a jump and can only be collected once per cycle', () => {
    const game = started();
    step(game, R.warningSeconds + R.attackSeconds + 0.2);
    expect(game.snapshot()).toMatchObject({ noteAvailable: true, notes: 0 });
    game.jump();
    step(game, 0.3);
    expect(game.snapshot()).toMatchObject({ noteAvailable: false, notes: 1 });
    step(game, 1.8);
    expect(game.snapshot().notes).toBe(1);
  });

  it('allows two distinct jumps and resets them on landing', () => {
    const game = started();
    expect(game.jump()).toBe(true);
    expect(game.jump()).toBe(true);
    expect(game.jump()).toBe(false);
    step(game, 1);
    expect(game.snapshot()).toMatchObject({ grounded: true, jumpsUsed: 0, heroY: R.groundY });
  });

  it.each(['warning', 'attack', 'recovery'] as const)('pause freezes %s, including the hero and damage clock', (phase) => {
    const game = started();
    while (game.snapshot().phase !== phase) game.advance(R.step);
    game.jump(); step(game, 0.1);
    game.setPaused(true);
    const before = game.snapshot();
    expect(game.jump()).toBe(false);
    step(game, 10);
    expect(game.snapshot()).toEqual(before);
    game.setPaused(false);
    step(game, 0.1);
    expect(game.snapshot().phaseElapsed).toBeGreaterThan(before.phaseElapsed);
  });

  it('invalid deltas do not poison state, and tab suspension cannot skip a warning', () => {
    const game = started();
    const before = game.snapshot();
    [NaN, Infinity, -1, 0].forEach((dt) => game.advance(dt));
    expect(game.snapshot()).toEqual(before);
    game.advance(999);
    expect(game.snapshot().phase).toBe('warning');
    expect(game.snapshot().phaseElapsed).toBeCloseTo(0.1);
  });

  it('30/60/120 fps produce the same encounter state', () => {
    const games = [30, 60, 120].map((hz) => {
      const game = started(); step(game, 4, hz); return game.snapshot();
    });
    expect(games[0]).toEqual(games[1]);
    expect(games[1]).toEqual(games[2]);
  });

  it('can be won with six recovery notes and no unavoidable hits', () => {
    const game = started();
    const jumped = new Set<string>();
    for (let i = 0; i < 60 * 120 && game.snapshot().phase !== 'won'; i++) {
      const s = game.snapshot();
      if (s.phase === 'attack' && s.attack === 'low-wave' && s.phaseElapsed >= 0.25 && !jumped.has(`attack-${s.cycle}`)) {
        game.jump(); jumped.add(`attack-${s.cycle}`);
      }
      if (s.phase === 'recovery' && s.noteAvailable && s.grounded) game.jump();
      game.advance(R.step);
    }
    expect(game.snapshot()).toMatchObject({ phase: 'won', notes: 6, lives: 3, projectile: null, noteAvailable: false });
    const won = game.snapshot(); step(game, 10);
    expect(game.jump()).toBe(false);
    expect(game.snapshot()).toEqual(won);
  });

  it('loses after three low-wave hits and cannot keep dealing damage afterward', () => {
    const game = started(); step(game, 40);
    expect(game.snapshot()).toMatchObject({ phase: 'lost', lives: 0, projectile: null });
    const lost = game.snapshot(); step(game, 10);
    expect(game.snapshot()).toEqual(lost);
  });
});
