import Phaser from 'phaser';

import { getSupportCharacter } from '@/game/content/playableCharacters';
import { prefersReducedMotion } from '@/ui/reducedMotion';

/**
 * "El Latido de Carlitos" — the visual form of the reserve that ALREADY exists.
 *
 * This adds no button, no meter, no charge rule, no collision, no
 * invulnerability and no balance change. It only listens to the two cues the
 * runner already emits (`reserve_fill`, `reserve_spent`) and draws Carlitos:
 *  - while a reserve is held: a small, warm presence beside the aura;
 *  - when the reserve is spent: a brief protective light around the Devilz.
 *
 * Everything it creates sits BEHIND the player (depth < 5) so it can never
 * obstruct the read of the character or a hazard.
 */
const PRESENCE_HEIGHT_PX = 34;
const PRESENCE_DEPTH = 4.58;
const PRESENCE_OFFSET_X = -54;
const PRESENCE_OFFSET_Y = -60;
const PRESENCE_ALPHA = 0.32;
const FLASH_HEIGHT_PX = 132;
const FLASH_DEPTH = 4.72;
const FLASH_RISE_MS = 140;
const FLASH_FADE_MS = 340;

export class CarlitosHeartbeat {
  private readonly textureKey = getSupportCharacter().poses.main.key;
  private readonly available: boolean;
  private presence?: Phaser.GameObjects.Container;
  private presenceHalo?: Phaser.GameObjects.Ellipse;
  private flash?: Phaser.GameObjects.Container;
  private held = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.available = scene.textures.exists(this.textureKey);

    if (!this.available) {
      return;
    }

    this.presenceHalo = this.scene.add
      .ellipse(0, 0, PRESENCE_HEIGHT_PX * 2.1, PRESENCE_HEIGHT_PX * 1.5, 0xffd9a8, 0.1)
      .setBlendMode(Phaser.BlendModes.ADD);

    const figure = this.scene.add
      .image(0, 0, this.textureKey)
      .setScale(this.scaleFor(PRESENCE_HEIGHT_PX));

    this.presence = this.scene.add
      .container(0, 0, [this.presenceHalo, figure])
      .setDepth(PRESENCE_DEPTH)
      .setAlpha(0)
      .setVisible(false);
  }

  /** The reserve just became ready — fade the warm presence in. */
  onReserveFilled() {
    if (!this.presence || this.held) {
      return;
    }

    this.held = true;
    this.presence.setVisible(true);
    this.scene.tweens.killTweensOf(this.presence);

    if (prefersReducedMotion()) {
      this.presence.setAlpha(PRESENCE_ALPHA).setScale(1);
      return;
    }

    this.presence.setScale(0.82);
    this.scene.tweens.add({
      targets: this.presence,
      alpha: PRESENCE_ALPHA,
      scaleX: 1,
      scaleY: 1,
      duration: 420,
      ease: 'Cubic.easeOut'
    });
  }

  /**
   * The reserve just saved the player. Carlitos appears as a protective light
   * around the active Devilz for ~480 ms and fades. Purely visual.
   */
  onReserveSpent(x: number, y: number) {
    this.dismissPresence();

    if (!this.available) {
      return;
    }

    this.destroyFlash();

    const halo = this.scene.add
      .ellipse(0, 0, FLASH_HEIGHT_PX * 1.5, FLASH_HEIGHT_PX * 1.32, 0xffe6b8, 0.3)
      .setBlendMode(Phaser.BlendModes.ADD);
    const figure = this.scene.add
      .image(0, 0, this.textureKey)
      .setScale(this.scaleFor(FLASH_HEIGHT_PX))
      .setAlpha(0.75);

    const flash = this.scene.add
      .container(x, y, [halo, figure])
      .setDepth(FLASH_DEPTH)
      .setAlpha(0);

    this.flash = flash;

    const finish = () => {
      if (this.flash === flash) {
        this.flash = undefined;
      }

      flash.destroy();
    };

    if (prefersReducedMotion()) {
      flash.setAlpha(0.7);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: FLASH_RISE_MS + FLASH_FADE_MS,
        onComplete: finish
      });
      return;
    }

    flash.setScale(0.72);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0.92,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: FLASH_RISE_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: flash,
          alpha: 0,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: FLASH_FADE_MS,
          ease: 'Cubic.easeOut',
          onComplete: finish
        });
      }
    });
  }

  /**
   * Follows the player each frame. `reserveReady` comes straight from the
   * existing session state, so the presence disappears whenever the reserve is
   * gone for any reason (spent, restart, hydrate).
   */
  update(heroX: number, heroY: number, time: number, reserveReady: boolean) {
    if (!this.presence) {
      return;
    }

    if (!reserveReady) {
      this.dismissPresence();
      return;
    }

    if (!this.held) {
      this.onReserveFilled();
    }

    const float = prefersReducedMotion() ? 0 : Math.sin(time * 0.0026) * 3.2;

    this.presence.setPosition(heroX + PRESENCE_OFFSET_X, heroY + PRESENCE_OFFSET_Y + float);
    this.presenceHalo?.setFillStyle(
      0xffd9a8,
      prefersReducedMotion() ? 0.1 : 0.09 + Math.sin(time * 0.0034) * 0.025
    );
  }

  /** Hide the presence without destroying it (finish/fail/pause-out states). */
  hide() {
    this.dismissPresence();
  }

  destroy() {
    this.destroyFlash();

    if (this.presence) {
      this.scene.tweens.killTweensOf(this.presence);
      this.presence.destroy();
      this.presence = undefined;
      this.presenceHalo = undefined;
    }
  }

  private dismissPresence() {
    if (!this.presence || !this.held) {
      return;
    }

    this.held = false;
    const presence = this.presence;
    this.scene.tweens.killTweensOf(presence);

    this.scene.tweens.add({
      targets: presence,
      alpha: 0,
      duration: prefersReducedMotion() ? 120 : 220,
      ease: 'Quad.easeOut',
      onComplete: () => {
        presence.setVisible(false);
      }
    });
  }

  private destroyFlash() {
    if (!this.flash) {
      return;
    }

    this.scene.tweens.killTweensOf(this.flash);
    this.flash.destroy();
    this.flash = undefined;
  }

  private scaleFor(targetHeightPx: number) {
    const source = this.scene.textures.get(this.textureKey).getSourceImage() as { height: number };

    return source.height > 0 ? targetHeightPx / source.height : 1;
  }
}
