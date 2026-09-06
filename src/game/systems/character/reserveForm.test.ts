import { beforeEach, describe, expect, it } from 'vitest';
import { getCharacter } from '@/game/content/playableCharacters';
import { sessionState } from '@/game/state/sessionState';
import { reserveForm } from './reserveForm';

beforeEach(() => sessionState.hydrate({}));
describe('reserve appearance follows the existing reserve lifecycle', () => {
  it.each(['devi', 'lovu', 'divu'])('returns to %s after the last reserve is consumed', id => {
    const selected = getCharacter(id);
    const form = () => reserveForm(selected, sessionState.snapshot().recoveryChances);
    expect(form()).toBe(selected);
    for (let i = 0; i < 200; i++) sessionState.registerSparkCollection({ awakeningGain: 0, chain: 1 });
    expect(form().id).toBe('hero');
    sessionState.registerPulseDrop({ pulseLoss: 1 });
    expect(form().id).toBe('hero'); // A second held reserve still powers the form.
    sessionState.registerPulseDrop({ pulseLoss: 1 });
    expect(form()).toBe(selected);
    expect(sessionState.snapshot().currentPulse).toBe(0.36); // Existing rescue is unchanged.
  });
  it('clears the transformation on restart while retaining the chosen character', () => {
    const selected = getCharacter('lovu');
    for (let i = 0; i < 100; i++) sessionState.registerSparkCollection({ awakeningGain: 0, chain: 1 });
    sessionState.restartRun();
    expect(reserveForm(selected, sessionState.snapshot().recoveryChances)).toBe(selected);
  });
});
