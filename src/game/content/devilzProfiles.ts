// PROPOSAL — not wired in. Sibling of src/game/content/heroProfile.ts
//
// Shape intentionally mirrors heroProfile so the two can converge on a shared
// type later without touching call sites. Jump physics are NOT represented here
// and must not be: they are identical across all playable characters.

export const devilzProfiles = {
  devi: {
    displayName: 'Devi',
    textureKey: 'devi-main',
    poseTextureKeys: {
      hit: 'devi-hit-stagger',
      airRise: 'devi-jump-rise',
      airFall: 'devi-jump-fall',
      finish: 'devi-finish-awakened' // absent on disk; guarded by textures.exists()
    },
    renderOrigin: { x: 0.5, y: 0.58 },
    mobileScale: { minPx: 100, preferredPx: 128, maxPx: 176 },
    collision: { catchRadiusPx: 56 },
    silhouetteRules: [
      'Long swept horns are the primary read at small sizes.',
      'Open mouth with fangs stays legible against dark backdrops.',
      'X eye and open eye must remain visible together.',
      'Tiny limbs remain secondary accents, not anatomy anchors.'
    ]
  },

  lovu: {
    displayName: 'Lovu',
    textureKey: 'lovu-main',
    poseTextureKeys: {
      hit: 'lovu-hit-stagger',
      airRise: 'lovu-jump-rise',
      airFall: 'lovu-jump-fall',
      finish: 'lovu-finish-awakened'
    },
    renderOrigin: { x: 0.5, y: 0.58 },
    mobileScale: { minPx: 88, preferredPx: 114, maxPx: 160 },
    collision: { catchRadiusPx: 48 },
    silhouetteRules: [
      'Squared-off head is what separates Lovu from the other two.',
      'Short horns must still clear the background edge.',
      'Flat mouth line carries the whole expression — never thicken it.',
      'X eye and rectangular eye must remain visible together.'
    ]
  },

  divu: {
    displayName: 'Divu',
    textureKey: 'divu-main',
    poseTextureKeys: {
      hit: 'divu-hit-stagger',
      airRise: 'divu-jump-rise',
      airFall: 'divu-jump-fall',
      finish: 'divu-finish-awakened'
    },
    renderOrigin: { x: 0.5, y: 0.58 },
    mobileScale: { minPx: 76, preferredPx: 96, maxPx: 136 },
    collision: { catchRadiusPx: 40 },
    silhouetteRules: [
      'Fully round body — no flat edges anywhere on the outline.',
      'Three small horns read as texture, not as separate shapes.',
      'Closed smiling eyes are the only smile in the set. Keep it.',
      'Smallest of the three: verify legibility at minPx before shipping.'
    ]
  }
} as const;

export type DevilzKey = keyof typeof devilzProfiles;

export const playableOrder: readonly DevilzKey[] = ['devi', 'lovu', 'divu'] as const;
