import moonlightMountainFinalUrl from '@/assets/entry/moonlight-mountain-ok.jpg';
import planetHomeCutoutUrl from '@/assets/planet/planet-home-cutout.webp';
import { runnerConfig } from '@/game/content/runnerConfig';
import {
  runnerPhrases,
  runnerPhraseRotation,
  type RunnerPhrase,
  type RunnerPhraseId,
  type RunnerPhraseMap
} from '@/game/content/runnerPhrases';

export type JourneyStageKey = 'wounded-planet' | 'moonlight-mountain';
export type JourneyBackdropKind = 'wounded-planet' | 'moonlight-mountain';

export interface JourneyLevelProfile {
  endDistance: number;
  surfaceStartDistance: number;
  finishRevealDistance: number;
  finishSlowdownDistance: number;
  exitCoastDistance: number;
}

export interface JourneyRunnerContent {
  speedMultiplier?: number;
  phrases: RunnerPhraseMap;
  initialPhraseId: RunnerPhraseId;
  onboardingSequence: RunnerPhraseId[];
  rotation: RunnerPhraseId[];
  recoverySequence: RunnerPhraseId[];
  level: JourneyLevelProfile;
}

export interface JourneyEntryScreen {
  eyebrow: string;
  title: string;
  framing: string;
  detail: string;
  cta: string;
  primaryColor: number;
  accentColor: number;
  art: {
    textureKey: string;
    imageUrl: string;
    maxWidth: number;
    maxHeight: number;
    y: number;
    rotation?: number;
  };
  loading: {
    eyebrow: string;
    title: string;
    copy: string;
  };
}

export interface JourneyStageDefinition {
  key: JourneyStageKey;
  label: string;
  backdropKind: JourneyBackdropKind;
  nextStage: JourneyStageKey | null;
  entry: JourneyEntryScreen;
  introGuidance?: string;
  beatGuidance?: string;
  surfaceGuidance?: string;
  runner: JourneyRunnerContent;
}

// Moonlight phrases use ONE readable visual vocabulary so a child reads each
// action at a glance — and crucially the two verbs never share a sprite:
//   - shard  (y:18)   => JUMP OVER. A crystal that sits ON the ground line
//                        (its shadow lands at groundLineY), like Level 1 spikes.
//   - mirror (y:172)  => RUN UNDER. A reflective panel clearly OVERHEAD
//                        (>=25px head clearance) — never a low/floating blocker.
//   - crown  (y:198)  => RUN UNDER. A jagged formation hanging overhead.
//   - ledge           => PLATFORM ROUTE (double-jump up, collect, drop).
// Jump = grounded crystal; Under = overhead mirror/crown. Rules baked in:
//   - consecutive hazards spaced >=130px (~0.75s) for a readable cadence
//   - every collectible within ~70px of a hazard sits grounded (y<=112) so a
//     note never baits a jump into an overhead hazard nor a clip on a jump
//   - no overhead hazard right after a ledge (the drop arc would clip it)
//   - a grounded "recovery" note sits between dense beats
// No low/mid-body mirrors: they read as floating and are ambiguous, so every
// jump-over hazard is a grounded shard.
const moonlightPhrases: RunnerPhraseMap = {
  moonlight_intro: {
    id: 'moonlight_intro',
    label: 'Moonlight Intro',
    family: 'onboarding',
    spacingAfter: 476,
    // Gentle collect line with a single grounded shard to jump.
    items: [
      { kind: 'collectible', variant: 'spark', x: 84, y: 58 },
      { kind: 'collectible', variant: 'note', x: 150, y: 96 },
      { kind: 'collectible', variant: 'brush', x: 214, y: 110 },
      { kind: 'hazard', variant: 'shard', x: 268, y: 18 },
      { kind: 'collectible', variant: 'spark', x: 336, y: 110 },
      { kind: 'collectible', variant: 'note', x: 400, y: 96 },
      { kind: 'collectible', variant: 'brush', x: 458, y: 80 }
    ]
  },
  moonlight_gate: {
    id: 'moonlight_gate',
    label: 'Moonlight Gate',
    family: 'onboarding',
    spacingAfter: 520,
    // Teaches JUMP: two grounded shards, each with a low reward note after it.
    items: [
      { kind: 'collectible', variant: 'note', x: 96, y: 86 },
      { kind: 'hazard', variant: 'shard', x: 168, y: 18 },
      { kind: 'collectible', variant: 'spark', x: 236, y: 112 },
      { kind: 'collectible', variant: 'note', x: 300, y: 96 },
      { kind: 'hazard', variant: 'shard', x: 372, y: 18 },
      { kind: 'collectible', variant: 'spark', x: 440, y: 112 },
      { kind: 'collectible', variant: 'note', x: 500, y: 92 }
    ]
  },
  moonlight_reflect: {
    id: 'moonlight_reflect',
    label: 'Moonlight Reflect',
    family: 'onboarding',
    spacingAfter: 540,
    // Teaches RUN-UNDER: an overhead mirror then a crown, both cleared by
    // staying grounded and collecting the low note line. No jump required.
    items: [
      { kind: 'collectible', variant: 'spark', x: 88, y: 60 },
      { kind: 'collectible', variant: 'note', x: 150, y: 100 },
      { kind: 'hazard', variant: 'mirror', x: 214, y: 172 },
      { kind: 'collectible', variant: 'brush', x: 280, y: 96 },
      { kind: 'collectible', variant: 'note', x: 340, y: 104 },
      { kind: 'hazard', variant: 'crown', x: 404, y: 198 },
      { kind: 'collectible', variant: 'spark', x: 464, y: 92 },
      { kind: 'collectible', variant: 'note', x: 520, y: 100 }
    ]
  },
  moonlight_launch: {
    id: 'moonlight_launch',
    label: 'Moonlight Launch',
    family: 'onboarding',
    spacingAfter: 600,
    // Teaches the PLATFORM ROUTE: jump the shard, double-jump onto the ledge to
    // collect the high line, then drop and collect. No overhead after the ledge.
    items: [
      { kind: 'collectible', variant: 'spark', x: 88, y: 54 },
      { kind: 'hazard', variant: 'shard', x: 150, y: 18 },
      { kind: 'collectible', variant: 'note', x: 220, y: 96 },
      { kind: 'collectible', variant: 'brush', x: 270, y: 110 },
      { kind: 'platform', variant: 'ledge', x: 396, y: 180, width: 188 },
      { kind: 'collectible', variant: 'spark', x: 352, y: 176 },
      { kind: 'collectible', variant: 'note', x: 404, y: 210 },
      { kind: 'collectible', variant: 'brush', x: 452, y: 188 },
      { kind: 'collectible', variant: 'note', x: 520, y: 120 },
      { kind: 'collectible', variant: 'spark', x: 566, y: 96 }
    ]
  },
  moonlight_shard_step: {
    id: 'moonlight_shard_step',
    label: 'Moonlight Shard Step',
    family: 'tension',
    spacingAfter: 552,
    // JUMP rhythm: two grounded shards, "jump, land, jump".
    items: [
      { kind: 'collectible', variant: 'spark', x: 82, y: 58 },
      { kind: 'hazard', variant: 'shard', x: 140, y: 18 },
      { kind: 'collectible', variant: 'note', x: 206, y: 112 },
      { kind: 'hazard', variant: 'shard', x: 286, y: 18 },
      { kind: 'collectible', variant: 'brush', x: 356, y: 110 },
      { kind: 'collectible', variant: 'spark', x: 426, y: 100 },
      { kind: 'collectible', variant: 'note', x: 492, y: 96 }
    ]
  },
  moonlight_mirror_arc: {
    id: 'moonlight_mirror_arc',
    label: 'Moonlight Mirror Arc',
    family: 'tension',
    spacingAfter: 600,
    // UNDER, JUMP, UNDER: run under an overhead mirror, jump a grounded shard,
    // run under another mirror. Collectibles by the mirrors stay grounded.
    items: [
      { kind: 'collectible', variant: 'note', x: 92, y: 96 },
      { kind: 'hazard', variant: 'mirror', x: 160, y: 172 },
      { kind: 'collectible', variant: 'spark', x: 226, y: 100 },
      { kind: 'hazard', variant: 'shard', x: 300, y: 18 },
      { kind: 'collectible', variant: 'brush', x: 366, y: 100 },
      { kind: 'hazard', variant: 'mirror', x: 436, y: 172 },
      { kind: 'collectible', variant: 'spark', x: 502, y: 100 },
      { kind: 'collectible', variant: 'note', x: 556, y: 96 }
    ]
  },
  moonlight_crown_cross: {
    id: 'moonlight_crown_cross',
    label: 'Moonlight Crown Cross',
    family: 'tension',
    spacingAfter: 600,
    // UNDER, JUMP, UNDER: duck a crown, jump a shard, duck a crown. Every
    // collectible near a crown is grounded so nothing baits a jump up.
    items: [
      { kind: 'collectible', variant: 'spark', x: 84, y: 96 },
      { kind: 'hazard', variant: 'crown', x: 150, y: 198 },
      { kind: 'collectible', variant: 'note', x: 214, y: 104 },
      { kind: 'hazard', variant: 'shard', x: 286, y: 18 },
      { kind: 'collectible', variant: 'brush', x: 356, y: 100 },
      { kind: 'hazard', variant: 'crown', x: 424, y: 198 },
      { kind: 'collectible', variant: 'spark', x: 486, y: 100 },
      { kind: 'collectible', variant: 'note', x: 544, y: 96 }
    ]
  },
  moonlight_reflect_gate: {
    id: 'moonlight_reflect_gate',
    label: 'Moonlight Reflect Gate',
    family: 'tension',
    spacingAfter: 616,
    // JUMP, UNDER, JUMP: jump a shard, run under an overhead mirror collecting
    // the low line, then jump a shard.
    items: [
      { kind: 'collectible', variant: 'spark', x: 88, y: 60 },
      { kind: 'hazard', variant: 'shard', x: 154, y: 18 },
      { kind: 'collectible', variant: 'note', x: 224, y: 112 },
      { kind: 'collectible', variant: 'note', x: 290, y: 100 },
      { kind: 'hazard', variant: 'mirror', x: 358, y: 172 },
      { kind: 'collectible', variant: 'brush', x: 424, y: 100 },
      { kind: 'hazard', variant: 'shard', x: 496, y: 18 },
      { kind: 'collectible', variant: 'spark', x: 558, y: 112 }
    ]
  },
  moonlight_glass_ladder: {
    id: 'moonlight_glass_ladder',
    label: 'Moonlight Glass Ladder',
    family: 'tension',
    spacingAfter: 640,
    // PLATFORM ROUTE: jump the shard, double-jump the ledge to collect the high
    // line, drop and collect. No overhead hazard after the ledge.
    items: [
      { kind: 'hazard', variant: 'shard', x: 130, y: 18 },
      { kind: 'collectible', variant: 'spark', x: 176, y: 96 },
      { kind: 'collectible', variant: 'note', x: 224, y: 104 },
      { kind: 'platform', variant: 'ledge', x: 392, y: 180, width: 190 },
      { kind: 'collectible', variant: 'spark', x: 348, y: 176 },
      { kind: 'collectible', variant: 'note', x: 400, y: 210 },
      { kind: 'collectible', variant: 'brush', x: 452, y: 188 },
      { kind: 'collectible', variant: 'note', x: 512, y: 130 },
      { kind: 'collectible', variant: 'spark', x: 560, y: 100 }
    ]
  },
  moonlight_fork: {
    id: 'moonlight_fork',
    label: 'Moonlight Fork',
    family: 'tension',
    spacingAfter: 616,
    // JUMP, UNDER, UNDER: jump a shard, then run under an overhead mirror and a
    // crown, collecting the low line between them.
    items: [
      { kind: 'collectible', variant: 'note', x: 94, y: 96 },
      { kind: 'hazard', variant: 'shard', x: 156, y: 18 },
      { kind: 'collectible', variant: 'spark', x: 226, y: 112 },
      { kind: 'collectible', variant: 'note', x: 296, y: 100 },
      { kind: 'hazard', variant: 'mirror', x: 366, y: 172 },
      { kind: 'collectible', variant: 'brush', x: 432, y: 100 },
      { kind: 'hazard', variant: 'crown', x: 502, y: 198 },
      { kind: 'collectible', variant: 'spark', x: 558, y: 96 }
    ]
  },
  moonlight_crescent: {
    id: 'moonlight_crescent',
    label: 'Moonlight Crescent',
    family: 'tension',
    spacingAfter: 648,
    // Hardest rotation phrase — JUMP, UNDER, JUMP: jump a shard, run under the
    // crown collecting the low line, then jump a shard.
    items: [
      { kind: 'collectible', variant: 'spark', x: 86, y: 60 },
      { kind: 'hazard', variant: 'shard', x: 150, y: 18 },
      { kind: 'collectible', variant: 'note', x: 220, y: 112 },
      { kind: 'collectible', variant: 'brush', x: 290, y: 100 },
      { kind: 'hazard', variant: 'crown', x: 360, y: 198 },
      { kind: 'collectible', variant: 'note', x: 424, y: 104 },
      { kind: 'hazard', variant: 'shard', x: 496, y: 18 },
      { kind: 'collectible', variant: 'spark', x: 560, y: 112 }
    ]
  },
  moonlight_recovery_glint: {
    id: 'moonlight_recovery_glint',
    label: 'Moonlight Recovery Glint',
    family: 'recovery',
    spacingAfter: 448,
    items: [
      { kind: 'collectible', variant: 'spark', x: 86, y: 62 },
      { kind: 'collectible', variant: 'note', x: 156, y: 96 },
      { kind: 'collectible', variant: 'brush', x: 230, y: 122 },
      { kind: 'collectible', variant: 'spark', x: 300, y: 146 },
      { kind: 'collectible', variant: 'note', x: 370, y: 126 },
      { kind: 'collectible', variant: 'brush', x: 438, y: 92 }
    ]
  },
  moonlight_recovery_mirror: {
    id: 'moonlight_recovery_mirror',
    label: 'Moonlight Recovery Mirror',
    family: 'recovery',
    spacingAfter: 462,
    items: [
      { kind: 'collectible', variant: 'spark', x: 88, y: 58 },
      { kind: 'collectible', variant: 'note', x: 162, y: 104 },
      { kind: 'collectible', variant: 'brush', x: 236, y: 148 },
      { kind: 'collectible', variant: 'note', x: 312, y: 168 },
      { kind: 'collectible', variant: 'spark', x: 386, y: 132 },
      { kind: 'collectible', variant: 'brush', x: 456, y: 88 }
    ]
  }
};

export const journeyStages: Record<JourneyStageKey, JourneyStageDefinition> = {
  'wounded-planet': {
    key: 'wounded-planet',
    label: 'Wounded Planet',
    backdropKind: 'wounded-planet',
    nextStage: 'moonlight-mountain',
    entry: {
      eyebrow: 'Nivel 1',
      title: 'Wounded Planet',
      framing: 'Entra en el planeta herido.',
      detail: 'Recoge las notas de luz y cúralo.',
      cta: 'Entrar',
      primaryColor: 0x90e6b7,
      accentColor: 0xe9ffaf,
      art: {
        textureKey: 'entry-art-wounded-planet',
        imageUrl: planetHomeCutoutUrl,
        maxWidth: 252,
        maxHeight: 276,
        y: 274,
        rotation: -0.05
      },
      loading: {
        eyebrow: 'Wounded Planet',
        title: 'Abriendo el primer mundo...',
        copy: 'El primer mundo ya está listo.'
      }
    },
    surfaceGuidance: 'La luz vuelve poco a poco.',
    runner: {
      phrases: runnerPhrases,
      initialPhraseId: 'onboarding_intro',
      onboardingSequence: [
        'onboarding_jump',
        'onboarding_notes',
        'onboarding_double',
        'onboarding_upper',
        'tension_step',
        'onboarding_reserve',
        'onboarding_shark'
      ],
      rotation: runnerPhraseRotation,
      recoverySequence: ['recovery_breath', 'recovery_lift'],
      level: runnerConfig.level
    }
  },
  'moonlight-mountain': {
    key: 'moonlight-mountain',
    label: 'Moonlight Mountain',
    backdropKind: 'moonlight-mountain',
    nextStage: null,
    entry: {
      eyebrow: 'Nivel 2',
      title: 'Moonlight Mountain',
      framing: 'La montaña devuelve reflejos.',
      detail: 'Salta los reflejos y sigue la luz.',
      cta: 'Seguir',
      primaryColor: 0x95c5d8,
      accentColor: 0xcef2ff,
      art: {
        textureKey: 'entry-art-moonlight-mountain',
        imageUrl: moonlightMountainFinalUrl,
        maxWidth: 286,
        maxHeight: 236,
        y: 282
      },
      loading: {
        eyebrow: 'Moonlight Mountain',
        title: 'Preparando la segunda entrada...',
        copy: 'La luz ya marca la ruta.'
      }
    },
    introGuidance: 'Todo refleja aquí.',
    beatGuidance: 'Brillan con cada nota.',
    surfaceGuidance: 'La luna abre camino.',
    runner: {
      // Slightly slower than the first world for fair reaction time: the
      // moonlight phrases are denser, so 8% more travel time keeps every
      // obstacle readable without making the stage feel sluggish.
      speedMultiplier: 0.92,
      phrases: moonlightPhrases,
      initialPhraseId: 'moonlight_intro',
      onboardingSequence: [
        'moonlight_gate',
        'moonlight_reflect',
        'moonlight_launch'
      ],
      rotation: [
        'moonlight_shard_step',
        'moonlight_glass_ladder',
        'moonlight_mirror_arc',
        'moonlight_crown_cross',
        'moonlight_reflect_gate',
        'moonlight_fork',
        'moonlight_crescent'
      ],
      recoverySequence: ['moonlight_recovery_glint', 'moonlight_recovery_mirror'],
      level: {
        endDistance: 10160,
        surfaceStartDistance: 1560,
        finishRevealDistance: 8780,
        finishSlowdownDistance: 300,
        exitCoastDistance: 120
      }
    }
  }
};
