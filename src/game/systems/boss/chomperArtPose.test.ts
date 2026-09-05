import { describe, expect, it } from 'vitest';
import { ChomperEncounter, type ChomperAttack, type ChomperPhase } from './ChomperEncounter';
import { resolveChomperArtPose } from './chomperArtPose';

const duration = (phase: ChomperPhase) => phase === 'warning' ? 1.3
  : phase === 'attack' ? 1.1 : phase === 'recovery' ? 2.5 : 0;
const pose = (
  phase: ChomperPhase,
  phaseProgress: number,
  attack: ChomperAttack = 'low-wave',
  reduced = false,
  cycle = 0
) => resolveChomperArtPose({
  phase, phaseProgress, attack, cycle,
  phaseElapsed: duration(phase) * phaseProgress
}, reduced);

const neutral = {
  redAngle: 0, goldAngle: 0,
  redUpperJawAngle: 0, redLeftJawAngle: 0, redRightJawAngle: 0,
  bodyAngle: 0, bodyX: 0, bodyY: 0,
  bodyScaleX: 1, bodyScaleY: 1
};

describe('Chomper candidate puppet', () => {
  it('joins warning, release, recovery and the next head without snapping', () => {
    for (const attack of ['low-wave', 'high-burst', 'bite-lunge'] as const) {
      expect(pose('warning', 1, attack)).toEqual(pose('attack', 0, attack));
      expect(pose('attack', 1, attack)).toEqual(pose('recovery', 0, attack));
      expect(pose('recovery', 1, attack)).toEqual(pose('warning', 0, attack, false, 1));
    }
  });

  it('gives each attack to its own unequal head with a quieter answering head', () => {
    const low = pose('warning', 0.8);
    const high = pose('warning', 0.8, 'high-burst');
    const bite = pose('warning', 0.8, 'bite-lunge');
    expect(Math.abs(low.goldAngle)).toBeGreaterThan(Math.abs(low.redAngle) * 4);
    expect(Math.abs(high.redAngle)).toBeGreaterThan(Math.abs(high.goldAngle) * 4);
    expect(Math.abs(bite.redAngle)).toBeGreaterThan(Math.abs(bite.goldAngle) * 4);
  });

  it('coils back and then throws the whole body into the bite', () => {
    const warning = pose('warning', 1, 'bite-lunge');
    const launch = pose('attack', 0.58, 'bite-lunge');
    expect(warning.bodyX).toBeLessThan(-5);
    expect(launch.bodyX).toBeGreaterThan(85);
    expect(launch.bodyY).toBeGreaterThan(350);
    expect(Math.abs(launch.redAngle)).toBeGreaterThan(Math.abs(launch.goldAngle));
    expect(Math.abs(launch.bodyScaleX - warning.bodyScaleX)).toBeGreaterThan(0.03);
  });

  it('opens the three red jaws during warning and snaps them shut at contact', () => {
    const open = pose('warning', 1, 'bite-lunge');
    const contact = pose('attack', 0.58, 'bite-lunge');
    expect(open.redUpperJawAngle).toBeLessThanOrEqual(-10);
    expect(open.redLeftJawAngle).toBeGreaterThanOrEqual(13);
    expect(open.redRightJawAngle).toBeLessThanOrEqual(-13);
    expect(contact.redUpperJawAngle).toBe(0);
    expect(contact.redLeftJawAngle).toBe(0);
    expect(contact.redRightJawAngle).toBe(0);
  });

  it('makes the upper red head visibly refuse before committing to the bite', () => {
    const firstRefusal = pose('warning', 0.125, 'bite-lunge');
    const secondRefusal = pose('warning', 0.375, 'bite-lunge');
    expect(firstRefusal.redAngle).toBeGreaterThan(2);
    expect(secondRefusal.redAngle).toBeLessThan(-10);
    expect(firstRefusal.redAngle - secondRefusal.redAngle).toBeGreaterThan(12);
  });

  it('makes the mobile-scale gesture materially visible and moves the body', () => {
    const warning = pose('warning', 1);
    const release = pose('attack', 0.22);
    expect(Math.abs(warning.goldAngle)).toBeGreaterThanOrEqual(16);
    expect(Math.abs(release.goldAngle)).toBeGreaterThanOrEqual(22);
    expect(Math.abs(warning.bodyAngle)).toBeGreaterThan(2);
    expect(Math.hypot(release.bodyX, release.bodyY)).toBeGreaterThan(3);
    expect(release.bodyScaleX).not.toBe(1);
  });

  it('freezes from the encounter clock during pause and resumes that pose', () => {
    const encounter = new ChomperEncounter();
    encounter.start();
    for (let i = 0; i < 60; i++) encounter.advance(1 / 120);
    const before = resolveChomperArtPose(encounter.snapshot(), false);
    encounter.setPaused(true);
    for (let i = 0; i < 120; i++) encounter.advance(1 / 60);
    expect(resolveChomperArtPose(encounter.snapshot(), false)).toEqual(before);
    encounter.setPaused(false);
    expect(resolveChomperArtPose(encounter.snapshot(), false)).toEqual(before);
    encounter.advance(1 / 60);
    expect(resolveChomperArtPose(encounter.snapshot(), false)).not.toEqual(before);
  });

  it('keeps art neutral under reduced motion and at entry or terminal screens', () => {
    for (const phase of ['ready', 'warning', 'attack', 'recovery', 'won', 'lost'] as const) {
      expect(pose(phase, 0.6, 'high-burst', true)).toEqual(neutral);
    }
    for (const phase of ['ready', 'won', 'lost'] as const) {
      expect(pose(phase, 0.6)).toEqual(neutral);
    }
  });
});
