import Phaser from 'phaser';

import { journeyConfig } from '@/game/content/journeyConfig';
import { BootScene } from '@/game/scenes/BootScene';

const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

export const createGameConfig = (parent: string): Phaser.Types.Core.GameConfig => {
  const preferPerformance = isCoarsePointer();

  return {
    banner: false,
    type: Phaser.AUTO,
    parent,
    width: journeyConfig.logicalSize.width,
    height: journeyConfig.logicalSize.height,
    backgroundColor: '#10141d',
    scene: [BootScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: journeyConfig.logicalSize.width,
      height: journeyConfig.logicalSize.height
    },
    input: {
      activePointers: 2,
      touch: {
        capture: true
      }
    },
    render: {
      antialias: !preferPerformance,
      pixelArt: false,
      powerPreference: 'high-performance'
    }
  };
};
