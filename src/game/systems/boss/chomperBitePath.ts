export interface ChomperBitePoint { x: number; y: number }

export const CHOMPER_BITE_PATH = {
  stageProgress: 0.32,
  contactProgress: 0.58,
  retreatProgress: 0.78,
  hazardStartProgress: 0.32,
  hazardEndProgress: 0.62,
  start: { x: 96.76370386377911, y: 165.93640161687512 },
  stage: { x: 82, y: 520 },
  contact: { x: 278, y: 530 },
  retreat: { x: 72, y: 558 },
  end: { x: 116.5, y: 172.5 }
} as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => value * value * (3 - 2 * value);
const cubic = (start: number, controlA: number, controlB: number, end: number, t: number) =>
  (1 - t) ** 3 * start + 3 * (1 - t) ** 2 * t * controlA +
  3 * (1 - t) * t ** 2 * controlB + t ** 3 * end;

/**
 * The red head first descends down the far-left edge, then sweeps horizontally
 * through the hero's ground lane. It retreats below/left before rising again,
 * so a jump never sends the hero into a hazard falling vertically from above.
 */
export function resolveChomperBitePoint(progress: number): ChomperBitePoint {
  const p = Number.isFinite(progress) ? clamp01(progress) : 0;
  const path = CHOMPER_BITE_PATH;
  if (p <= path.stageProgress) {
    const t = smooth(p / path.stageProgress);
    return {
      x: cubic(path.start.x, 55, 52, path.stage.x, t),
      y: cubic(path.start.y, 250, 430, path.stage.y, t)
    };
  }
  if (p <= path.contactProgress) {
    const t = smooth((p - path.stageProgress) / (path.contactProgress - path.stageProgress));
    return {
      x: cubic(path.stage.x, 126, 226, path.contact.x, t),
      y: cubic(path.stage.y, 514, 526, path.contact.y, t)
    };
  }
  if (p <= path.retreatProgress) {
    const t = smooth((p - path.contactProgress) / (path.retreatProgress - path.contactProgress));
    return {
      x: cubic(path.contact.x, 242, 126, path.retreat.x, t),
      y: cubic(path.contact.y, 550, 562, path.retreat.y, t)
    };
  }
  const t = smooth((p - path.retreatProgress) / (1 - path.retreatProgress));
  return {
    x: cubic(path.retreat.x, 25, 60, path.end.x, t),
    y: cubic(path.retreat.y, 470, 250, path.end.y, t)
  };
}
