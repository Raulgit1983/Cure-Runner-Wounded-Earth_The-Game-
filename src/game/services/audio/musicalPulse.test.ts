import { describe, expect, it } from 'vitest';
import { MusicalPulse } from './musicalPulse';
describe('moon reads the scheduled audio clock', () => {
  it('waits for actual sound onset and fades after it', () => {
    const clock = {currentTime:1,state:'running'}, pulse=new MusicalPulse();
    pulse.schedule(clock,1.2,.3);
    expect(pulse.sample()).toBe(0);
    clock.currentTime=1.235;expect(pulse.sample()).toBeCloseTo(1);
    clock.currentTime=1.4;expect(pulse.sample()).toBeLessThan(.3);
    clock.currentTime=1.6;expect(pulse.sample()).toBe(0);
  });
  it('follows delayed notes and stays quiet while audio is suspended', () => {
    const clock = {currentTime:0,state:'running'}, pulse=new MusicalPulse();
    pulse.schedule(clock,0,.2);pulse.schedule(clock,.4,.2);
    clock.currentTime=.25;expect(pulse.sample()).toBe(0);
    clock.currentTime=.435;expect(pulse.sample()).toBeCloseTo(1);
    clock.state='suspended';expect(pulse.sample()).toBe(0);
  });
});
