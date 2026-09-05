import { CHOMPER_RULES, type ChomperSnapshot } from './ChomperEncounter';
import { CHOMPER_BITE_PATH, resolveChomperBitePoint } from './chomperBitePath';

export interface ChomperArtPose {
  redAngle: number;
  goldAngle: number;
  redUpperJawAngle: number;
  redLeftJawAngle: number;
  redRightJawAngle: number;
  bodyAngle: number;
  bodyX: number;
  bodyY: number;
  bodyScaleX: number;
  bodyScaleY: number;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clean = (value: number) => Math.abs(value) < 1e-10 ? 0 : value;
const neutral = (): ChomperArtPose => ({
  redAngle: 0, goldAngle: 0,
  redUpperJawAngle: 0, redLeftJawAngle: 0, redRightJawAngle: 0,
  bodyAngle: 0, bodyX: 0, bodyY: 0,
  bodyScaleX: 1, bodyScaleY: 1
});

const release = (progress: number, start: number, peak: number, end: number) =>
  progress < 0.22
    ? start + (peak - start) * smooth(progress / 0.22)
    : peak + (end - peak) * smooth((progress - 0.22) / 0.78);

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
const biteBodyFrame = (progress: number) => {
  const path = CHOMPER_BITE_PATH;
  let t: number;
  let from: { angle: number; scaleX: number; scaleY: number };
  let to: { angle: number; scaleX: number; scaleY: number };
  if (progress <= path.stageProgress) {
    t = smooth(progress / path.stageProgress);
    from = { angle: -3, scaleX: 0.98, scaleY: 1.015 };
    to = { angle: 6, scaleX: 1.02, scaleY: 0.98 };
  } else if (progress <= path.contactProgress) {
    t = smooth((progress - path.stageProgress) / (path.contactProgress - path.stageProgress));
    from = { angle: 6, scaleX: 1.02, scaleY: 0.98 };
    to = { angle: 15, scaleX: 1.03, scaleY: 0.97 };
  } else if (progress <= path.retreatProgress) {
    t = smooth((progress - path.contactProgress) / (path.retreatProgress - path.contactProgress));
    from = { angle: 15, scaleX: 1.03, scaleY: 0.97 };
    to = { angle: -12, scaleX: 1.015, scaleY: 0.985 };
  } else {
    t = smooth((progress - path.retreatProgress) / (1 - path.retreatProgress));
    from = { angle: -12, scaleX: 1.015, scaleY: 0.985 };
    to = { angle: 0, scaleX: 1, scaleY: 1 };
  }
  const angle = lerp(from.angle, to.angle, t);
  const scaleX = lerp(from.scaleX, to.scaleX, t);
  const scaleY = lerp(from.scaleY, to.scaleY, t);
  const target = resolveChomperBitePoint(progress);
  // Scene-space red pivot relative to the puppet's lower-coil origin.
  const localX = -64.5 * scaleX;
  const localY = -284.5 * scaleY;
  const radians = angle * Math.PI / 180;
  const rotatedX = localX * Math.cos(radians) - localY * Math.sin(radians);
  const rotatedY = localX * Math.sin(radians) + localY * Math.cos(radians);
  return {
    x: target.x - 181 - rotatedX,
    y: target.y - 457 - rotatedY,
    angle,
    scaleX: scaleX - 1,
    scaleY: scaleY - 1
  };
};

const biteJawOpen = (progress: number) => {
  if (progress <= 0.46) return 1;
  if (progress <= 0.58) return 1 - smooth((progress - 0.46) / 0.12);
  if (progress <= 0.72) return 0.36 * smooth((progress - 0.58) / 0.14);
  return 0.36 * (1 - smooth((progress - 0.72) / 0.28));
};

/**
 * Candidate puppet direction, not encounter tuning. The whole silhouette
 * breathes and leans around its lowest coil while each head adds a stronger
 * anticipation/release. The simulation snapshot is the only clock, so pause
 * freezes the exact pose without tweens or animation-manager work.
 */
export function resolveChomperArtPose(
  state: Pick<ChomperSnapshot, 'phase' | 'phaseProgress' | 'phaseElapsed' | 'attack' | 'cycle'>,
  reducedMotion: boolean
): ChomperArtPose {
  if (reducedMotion || !['warning', 'attack', 'recovery'].includes(state.phase)) return neutral();
  const progress = Number.isFinite(state.phaseProgress)
    ? Math.max(0, Math.min(1, state.phaseProgress)) : 0;
  const elapsed = Number.isFinite(state.phaseElapsed) ? Math.max(0, state.phaseElapsed) : 0;
  const cycleDuration = CHOMPER_RULES.warningSeconds + CHOMPER_RULES.attackSeconds + CHOMPER_RULES.recoverySeconds;
  const phaseOffset = state.phase === 'attack' ? CHOMPER_RULES.warningSeconds
    : state.phase === 'recovery' ? CHOMPER_RULES.warningSeconds + CHOMPER_RULES.attackSeconds : 0;
  const clock = Math.max(0, state.cycle) * cycleDuration + phaseOffset + elapsed;
  const activity = state.phase === 'warning' ? smooth(Math.min(1, progress / 0.22))
    : state.phase === 'recovery' ? 1 - smooth(progress) : 1;
  const direction = state.attack === 'low-wave' ? 1 : -1;
  const breath = Math.sin(clock * Math.PI * 2 / 2.2) * activity;
  const sway = Math.sin(clock * Math.PI * 2 / 3.1) * activity;

  let activeAngle = 0;
  let actionAngle = 0;
  let actionX = 0;
  let actionY = 0;
  let actionScaleX = 0;
  let actionScaleY = 0;
  let jawOpen = 0;
  if (state.attack === 'bite-lunge') {
    if (state.phase === 'warning') {
      const wind = smooth(progress);
      const refusal = Math.sin(progress * Math.PI * 4) * Math.sin(progress * Math.PI) * 9;
      activeAngle = -12 * wind + refusal;
      actionAngle = -3 * wind;
      actionX = -6 * wind;
      actionY = -6 * wind;
      actionScaleX = -0.02 * wind;
      actionScaleY = 0.015 * wind;
      jawOpen = wind;
    } else if (state.phase === 'attack') {
      const settle = smooth(progress);
      const path = biteBodyFrame(progress);
      activeAngle = -12 * (1 - settle) + 8 * Math.sin(Math.PI * progress);
      actionAngle = path.angle;
      actionX = path.x;
      actionY = path.y;
      actionScaleX = path.scaleX;
      actionScaleY = path.scaleY;
      jawOpen = biteJawOpen(progress);
    } else {
      const settle = 1 - smooth(progress);
      activeAngle = 4 * Math.sin(Math.PI * progress) * settle;
    }
  } else if (state.phase === 'warning') {
    const wind = smooth(progress);
    activeAngle = -16 * wind;
    actionAngle = direction * 3.5 * wind;
    actionX = direction * 2.5 * wind;
    actionY = -1.5 * wind;
  } else if (state.phase === 'attack') {
    activeAngle = release(progress, -16, 22, 6);
    actionAngle = direction * release(progress, 3.5, -5.5, 1.5);
    actionX = direction * release(progress, 2.5, -4, 1);
    actionY = release(progress, -1.5, 3.5, -0.5);
  } else {
    const settle = 1 - smooth(progress);
    activeAngle = 6 * settle;
    actionAngle = direction * 1.5 * settle;
    actionX = direction * settle;
    actionY = -0.5 * settle;
  }

  // The inactive head is not frozen decoration: it answers the body motion,
  // but stays quieter than the head that owns the current attack.
  const answeringHead = 2.6 * Math.sin(clock * Math.PI * 2 / 2.7 + 0.7) * activity;
  return {
    redAngle: clean(state.attack === 'low-wave' ? answeringHead : activeAngle),
    goldAngle: clean(state.attack === 'low-wave' ? activeAngle : answeringHead),
    redUpperJawAngle: clean(-10 * jawOpen),
    redLeftJawAngle: clean(13 * jawOpen),
    redRightJawAngle: clean(-13 * jawOpen),
    bodyAngle: clean((state.attack === 'bite-lunge' ? 0 : 1.6 * sway) + actionAngle),
    bodyX: clean((state.attack === 'bite-lunge' ? 0 : 1.25 * sway) + actionX),
    bodyY: clean((state.attack === 'bite-lunge' ? 0 : -2.2 * breath) + actionY),
    bodyScaleX: clean(1 + (state.attack === 'bite-lunge' ? 0 : 0.012 * breath) + actionScaleX),
    bodyScaleY: clean(1 + (state.attack === 'bite-lunge' ? 0 : -0.008 * breath) + actionScaleY)
  };
}
