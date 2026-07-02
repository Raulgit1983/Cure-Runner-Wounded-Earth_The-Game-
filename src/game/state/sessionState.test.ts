import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sessionState } from '@/game/state/sessionState';

/**
 * Unit tests for the run-state store — the pub/sub heart of pulse, chain and
 * reserve ("recovery chance") rules. These guard the mercy mechanics the
 * fairness docs depend on before any scene refactor.
 */

describe('sessionState', () => {
  beforeEach(() => {
    sessionState.hydrate({ awakeningLevel: 0, collectedSparks: 0 });
  });

  it('hydrates with clamped, floored persisted values', () => {
    sessionState.hydrate({ awakeningLevel: 1.7, collectedSparks: 42.9 });

    const snapshot = sessionState.snapshot();

    expect(snapshot.awakeningLevel).toBe(1);
    expect(snapshot.collectedSparks).toBe(42);
    expect(snapshot.noteProgress).toBe(42);
    expect(snapshot.currentPulse).toBe(1);
    expect(snapshot.currentChain).toBe(0);
    expect(snapshot.recoveryChances).toBe(0);

    sessionState.hydrate({ awakeningLevel: -3, collectedSparks: -8 });

    expect(sessionState.snapshot().awakeningLevel).toBe(0);
    expect(sessionState.snapshot().collectedSparks).toBe(0);
  });

  it('derives the emotional tier from awakening + pulse', () => {
    // displayLevel = awakening * 0.94 + pulse * 0.06 (pulse resets to 1 on hydrate)
    sessionState.hydrate({ awakeningLevel: 0 });
    expect(sessionState.snapshot().tier).toBe('dim');

    sessionState.hydrate({ awakeningLevel: 0.4 });
    expect(sessionState.snapshot().tier).toBe('warming');

    sessionState.hydrate({ awakeningLevel: 0.9 });
    expect(sessionState.snapshot().tier).toBe('awake');
  });

  it('registers spark collections: sparks, chain, best chain and awakening', () => {
    const transition = sessionState.registerSparkCollection({
      awakeningGain: 0.026,
      chain: 3
    });

    expect(transition.before.collectedSparks).toBe(0);
    expect(transition.after.collectedSparks).toBe(1);
    expect(transition.after.currentChain).toBe(3);
    expect(transition.after.bestChain).toBe(3);
    expect(transition.after.awakeningLevel).toBeCloseTo(0.026, 6);

    sessionState.registerSparkCollection({ awakeningGain: 0.026, chain: 1 });

    // A lower new chain never lowers the best chain.
    expect(sessionState.snapshot().currentChain).toBe(1);
    expect(sessionState.snapshot().bestChain).toBe(3);
  });

  it('clamps awakening at 1 no matter how much is gained', () => {
    sessionState.hydrate({ awakeningLevel: 0.99 });
    sessionState.registerSparkCollection({ awakeningGain: 0.5, chain: 1 });

    expect(sessionState.snapshot().awakeningLevel).toBe(1);
  });

  it('grants a reserve (recovery chance) exactly every 100th spark', () => {
    sessionState.hydrate({ awakeningLevel: 0, collectedSparks: 99 });

    const transition = sessionState.registerSparkCollection({
      awakeningGain: 0,
      chain: 1
    });

    expect(transition.after.collectedSparks).toBe(100);
    expect(transition.after.noteProgress).toBe(0);
    expect(transition.after.recoveryChances).toBe(1);

    sessionState.registerSparkCollection({ awakeningGain: 0, chain: 2 });

    expect(sessionState.snapshot().recoveryChances).toBe(1);
  });

  it('drops pulse and breaks the chain on a hazard hit', () => {
    sessionState.registerSparkCollection({ awakeningGain: 0, chain: 4 });

    const transition = sessionState.registerPulseDrop({ pulseLoss: 0.34 });

    expect(transition.after.currentPulse).toBeCloseTo(0.66, 6);
    expect(transition.after.currentChain).toBe(0);
  });

  it('spends a reserve to survive a lethal pulse drop (mercy rule)', () => {
    sessionState.hydrate({ awakeningLevel: 0, collectedSparks: 99 });
    sessionState.registerSparkCollection({ awakeningGain: 0, chain: 1 });
    expect(sessionState.snapshot().recoveryChances).toBe(1);

    const transition = sessionState.registerPulseDrop({ pulseLoss: 1 });

    // The reserve converts a fail into a low-pulse second chance.
    expect(transition.after.currentPulse).toBeCloseTo(0.36, 6);
    expect(transition.after.recoveryChances).toBe(0);
  });

  it('lets pulse reach zero when no reserve is available', () => {
    const transition = sessionState.registerPulseDrop({ pulseLoss: 1 });

    expect(transition.after.currentPulse).toBe(0);
    expect(transition.after.recoveryChances).toBe(0);
  });

  it('restartRun keeps persistent progress but resets the run', () => {
    sessionState.hydrate({ awakeningLevel: 0.5, collectedSparks: 120 });
    sessionState.registerSparkCollection({ awakeningGain: 0.1, chain: 5 });
    sessionState.registerPulseDrop({ pulseLoss: 0.3 });

    sessionState.restartRun();

    const snapshot = sessionState.snapshot();

    expect(snapshot.awakeningLevel).toBeCloseTo(0.6, 6);
    expect(snapshot.collectedSparks).toBe(121);
    expect(snapshot.currentPulse).toBe(1);
    expect(snapshot.currentChain).toBe(0);
    expect(snapshot.bestChain).toBe(0);
    expect(snapshot.recoveryChances).toBe(0);
  });

  it('notifies subscribers immediately and only on real changes', () => {
    const listener = vi.fn();
    const unsubscribe = sessionState.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);

    // No-op transition: chain is already 0, nothing changes, no emit.
    sessionState.breakChain(0);
    expect(listener).toHaveBeenCalledTimes(1);

    sessionState.registerSparkCollection({ awakeningGain: 0.02, chain: 1 });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.lastCall?.[0].collectedSparks).toBe(1);

    unsubscribe();
    sessionState.registerSparkCollection({ awakeningGain: 0.02, chain: 2 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('clamps pulse gains at full pulse', () => {
    sessionState.pulse(0.5);

    expect(sessionState.snapshot().currentPulse).toBe(1);

    sessionState.registerPulseDrop({ pulseLoss: 0.4 });
    sessionState.pulse(0.2);

    expect(sessionState.snapshot().currentPulse).toBeCloseTo(0.8, 6);
  });
});
