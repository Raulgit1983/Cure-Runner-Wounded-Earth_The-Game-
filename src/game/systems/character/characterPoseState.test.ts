import { describe, expect, it } from 'vitest';

import {
  AIR_APEX_DEADZONE,
  AIR_FALL_THRESHOLD,
  AIR_RISE_THRESHOLD,
  resolveCharacterPoseState,
  type CharacterPoseInput
} from './characterPoseState';

const baseInput = (overrides: Partial<CharacterPoseInput> = {}): CharacterPoseInput => ({
  finishResolved: false,
  hitLockSeconds: 0,
  landingLockSeconds: 0,
  grounded: true,
  velocityY: 0,
  previousAirState: null,
  ...overrides
});

describe('resolveCharacterPoseState', () => {
  it('runs on the ground by default', () => {
    expect(resolveCharacterPoseState(baseInput())).toBe('run');
  });

  it('shows the landing compress while its lock holds, but only on the ground', () => {
    expect(resolveCharacterPoseState(baseInput({ landingLockSeconds: 0.05 }))).toBe('landing');
    // A jump taken straight out of a landing must not keep the compressed pose.
    expect(
      resolveCharacterPoseState(
        baseInput({ landingLockSeconds: 0.05, grounded: false, velocityY: -400 })
      )
    ).toBe('jump-rise');
  });

  it('keeps a strict priority: finish over hit over landing over jump over run', () => {
    const everything = baseInput({
      finishResolved: true,
      hitLockSeconds: 0.1,
      landingLockSeconds: 0.05,
      grounded: false,
      velocityY: -400
    });

    expect(resolveCharacterPoseState(everything)).toBe('finish');
    expect(resolveCharacterPoseState({ ...everything, finishResolved: false })).toBe('hit');
    expect(
      resolveCharacterPoseState({ ...everything, finishResolved: false, hitLockSeconds: 0 })
    ).toBe('jump-rise');
    expect(
      resolveCharacterPoseState({
        ...everything,
        finishResolved: false,
        hitLockSeconds: 0,
        grounded: true
      })
    ).toBe('landing');
  });

  it('picks the air frame from vertical velocity', () => {
    expect(
      resolveCharacterPoseState(
        baseInput({ grounded: false, velocityY: AIR_RISE_THRESHOLD - 1 })
      )
    ).toBe('jump-rise');
    expect(
      resolveCharacterPoseState(
        baseInput({ grounded: false, velocityY: AIR_FALL_THRESHOLD + 1 })
      )
    ).toBe('jump-fall');
    expect(
      resolveCharacterPoseState(baseInput({ grounded: false, velocityY: AIR_APEX_DEADZONE - 1 }))
    ).toBe('jump-apex');
  });

  it('holds the previous air frame between the deadzone and a threshold', () => {
    const between = (AIR_APEX_DEADZONE + AIR_FALL_THRESHOLD) / 2;

    expect(
      resolveCharacterPoseState(
        baseInput({ grounded: false, velocityY: between, previousAirState: 'jump-rise' })
      )
    ).toBe('jump-rise');
    expect(
      resolveCharacterPoseState(
        baseInput({ grounded: false, velocityY: -between, previousAirState: 'jump-fall' })
      )
    ).toBe('jump-fall');
  });

  it('falls back to the velocity sign when there is no previous air frame', () => {
    const between = (AIR_APEX_DEADZONE + AIR_FALL_THRESHOLD) / 2;

    expect(
      resolveCharacterPoseState(baseInput({ grounded: false, velocityY: between }))
    ).toBe('jump-fall');
    expect(
      resolveCharacterPoseState(baseInput({ grounded: false, velocityY: -between }))
    ).toBe('jump-rise');
  });

  it('shows the finish frame even while grounded and idle', () => {
    expect(resolveCharacterPoseState(baseInput({ finishResolved: true }))).toBe('finish');
  });
});
