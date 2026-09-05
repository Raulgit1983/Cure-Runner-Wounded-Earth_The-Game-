/** Approved arena pixels, conventionally masked; puppet motion is a DEV candidate. */
const root = '/art-lab/2026-09-05-chomper-rig/';
export const CHOMPER_ART = {
  plate: { key: 'chomper-rig-plate-v1', url: `${root}empty-plate-v1.webp` },
  body: { key: 'chomper-rig-body-v1', url: `${root}body-v1.webp`, x: 121, y: 185 },
  redUpper: {
    key: 'chomper-rig-red-upper-v1', url: `${root}red-upper-jaw-v1.webp`,
    x: 224, y: 119, width: 88, height: 98, pivot: { x: 233, y: 217 }
  },
  redLeft: {
    key: 'chomper-rig-red-left-v1', url: `${root}red-left-jaw-v1.webp`,
    x: 184, y: 215, width: 50, height: 77, pivot: { x: 233, y: 217 }
  },
  redRight: {
    key: 'chomper-rig-red-right-v1', url: `${root}red-right-jaw-v1.webp`,
    x: 233, y: 200, width: 78, height: 94, pivot: { x: 233, y: 217 }
  },
  redHub: {
    key: 'chomper-rig-red-hub-v1', url: `${root}red-hub-v1.webp`,
    x: 219, y: 202, width: 30, height: 31, pivot: { x: 233, y: 217 }
  },
  gold: {
    key: 'chomper-rig-gold-v1', url: `${root}gold-head-v1.webp`,
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

export const wantsChomperRigPreview = () => import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('chomperArt') === 'rig';
