import Phaser from 'phaser';

import { importWithRecovery } from '@/app/importWithRecovery';
import sharkTextureUrl from '@/assets/creatures/tiburoncin-ok.png';
import { journeyStages, type JourneyStageKey } from '@/game/content/journeyStages';
import { getFirstLevel } from '@/game/content/levels/levelRegistry';
import { listAllCharacterPoses } from '@/game/content/playableCharacters';
import { UI_FONT_STACK, uiTextResolution } from '@/ui/phaserTextStyle';

const loadJourneyScene = () => import('@/game/scenes/JourneyScene');
const loadLevelEntryScene = () => import('@/game/scenes/LevelEntryScene');
// Resolve the initial playable content through the level registry.
const INITIAL_STAGE_KEY: JourneyStageKey = getFirstLevel().stageKey;

/**
 * Invisible technical handoff — NOT a screen.
 *
 * BootScene only preloads runtime textures and starts the first playable scene.
 * It renders nothing but the page-dark background, and the DOM cover stays up
 * until LevelEntryScene announces itself (`mateo:ui-screen`), so the player
 * never sees a loading flash: cover → level entry, with this scene hidden
 * behind the cover the whole time. No seed, no progress bar, no copy, no delay.
 */
export class BootScene extends Phaser.Scene {
  private errorText?: Phaser.GameObjects.Text;

  constructor() {
    super('boot');
  }

  preload() {
    // Match the page/canvas dark so any sliver that ever shows is just black,
    // never a readable "loading screen".
    this.cameras.main.setBackgroundColor('#0b1017');

    // Every playable character's poses, straight from the registry — adding a
    // character is a registry entry, not another load line here.
    listAllCharacterPoses().forEach((pose) => {
      this.load.image(pose.key, pose.url);
    });

    this.load.image('shark-friend', sharkTextureUrl);

    const initialEntry = journeyStages[INITIAL_STAGE_KEY].entry;
    this.load.image(initialEntry.art.textureKey, initialEntry.art.imageUrl);
  }

  create() {
    void this.startJourney();
  }

  private async startJourney() {
    try {
      const { JourneyScene } = await importWithRecovery(loadJourneyScene);
      let LevelEntryScene:
        | (typeof import('@/game/scenes/LevelEntryScene'))['LevelEntryScene']
        | null = null;

      try {
        ({ LevelEntryScene } = await importWithRecovery(loadLevelEntryScene));
      } catch {
        LevelEntryScene = null;
      }

      this.scene.add('journey', JourneyScene, false);

      if (LevelEntryScene) {
        this.scene.add('level-entry', LevelEntryScene, false);
      }

      this.scene.start(LevelEntryScene ? 'level-entry' : 'journey', { stage: INITIAL_STAGE_KEY });
    } catch {
      this.showError();
    }
  }

  private showError() {
    const centerX = Math.round(this.scale.width * 0.5);
    const centerY = Math.round(this.scale.height * 0.5);

    // Surface a tap-to-reload only on the (rare) load failure path. This is the
    // one case where the neutral handoff intentionally becomes a visible screen.
    this.emitUiScreen();
    this.errorText?.destroy();
    this.errorText = this.add
      .text(centerX, centerY, 'No se abrió.\nToca para recargar.', {
        fontFamily: UI_FONT_STACK,
        fontSize: '14px',
        color: '#fff5ea',
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution());

    this.input.once('pointerdown', () => {
      window.location.reload();
    });
  }

  private emitUiScreen() {
    if (typeof window === 'undefined') {
      return;
    }

    // Let the DOM cover dismiss so the error is actually visible behind it.
    window.dispatchEvent(new CustomEvent('mateo:ui-screen', { detail: { screen: 'chapter' } }));
  }
}
