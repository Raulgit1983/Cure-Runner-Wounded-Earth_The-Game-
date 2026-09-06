import rise from '@/assets/hero/hero-jump-rise.webp';
import fall from '@/assets/hero/hero-jump-fall.webp';
import hit from '@/assets/hero/hero-hit-stagger.webp';
import finish from '@/assets/hero/hero-finish-awakened.webp';
import type { CharacterPoseSet } from './playableCharacters';

export const reservePoses: Partial<CharacterPoseSet> = {
  jumpRise: { key: 'hero-jump-rise', url: rise },
  jumpFall: { key: 'hero-jump-fall', url: fall },
  hit: { key: 'hero-hit-stagger', url: hit },
  finishAwakened: { key: 'hero-finish-awakened', url: finish }
};
