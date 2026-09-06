import plateUrl from '@/assets/chomper/runtime/empty-plate-v1.webp';
import bodyUrl from '@/assets/chomper/runtime/body-v1.webp';
import redUpperUrl from '@/assets/chomper/runtime/red-upper-jaw-v1.webp';
import redLeftUrl from '@/assets/chomper/runtime/red-left-jaw-v1.webp';
import redRightUrl from '@/assets/chomper/runtime/red-right-jaw-v1.webp';
import redHubUrl from '@/assets/chomper/runtime/red-hub-v1.webp';
import goldUrl from '@/assets/chomper/runtime/gold-head-v1.webp';
/** Approved v4 puppet; pixels copied unchanged for the requested release. */
export const CHOMPER_ART = {
  plate: { key: 'chomper-rig-plate-v1', url: plateUrl },
  body: { key: 'chomper-rig-body-v1', url: bodyUrl, x: 121, y: 185 },
  redUpper: {
    key: 'chomper-rig-red-upper-v1', url: redUpperUrl,
    x: 224, y: 119, width: 88, height: 98, pivot: { x: 233, y: 217 }
  },
  redLeft: {
    key: 'chomper-rig-red-left-v1', url: redLeftUrl,
    x: 184, y: 215, width: 50, height: 77, pivot: { x: 233, y: 217 }
  },
  redRight: {
    key: 'chomper-rig-red-right-v1', url: redRightUrl,
    x: 233, y: 200, width: 78, height: 94, pivot: { x: 233, y: 217 }
  },
  redHub: {
    key: 'chomper-rig-red-hub-v1', url: redHubUrl,
    x: 219, y: 202, width: 30, height: 31, pivot: { x: 233, y: 217 }
  },
  gold: {
    key: 'chomper-rig-gold-v1', url: goldUrl,
    x: 370, y: 344, width: 128, height: 168,
    pivot: { x: 402, y: 450 }, mouth: { x: 432, y: 444 }
  }
} as const;

export const CHOMPER_RED = {
  pivot: { x: 233, y: 217 },
  highMouth: { x: 252, y: 234 },
  biteMouth: { x: 233, y: 217 }
} as const;

/** Lowest visible coil: movement pivots here so Chomper never floats. */
export const CHOMPER_PUPPET_PIVOT = { x: 362, y: 786 } as const;
