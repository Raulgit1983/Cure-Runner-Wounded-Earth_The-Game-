import Phaser from 'phaser';
import { getSupportCharacter } from '@/game/content/playableCharacters';
import { prefersReducedMotion } from '@/ui/reducedMotion';

/** Silhouette light for the full-size reserve form. No miniature companion. */
export class AlfreditoPower {
  private readonly rim?: Phaser.GameObjects.Image;
  private readonly sparks: Phaser.GameObjects.Graphics;
  private pulse = 0;
  constructor(private readonly scene: Phaser.Scene) {
    const key = getSupportCharacter().poses.main.key;
    if (scene.textures.exists(key)) {
      this.rim = scene.add.image(0, 0, key).setTintFill(0xffdb8f)
        .setDepth(4.95).setVisible(false);
    }
    this.sparks = scene.add.graphics().setDepth(4.96).setVisible(false);
  }
  onReserveFilled() { this.pulse = 1; }
  onReserveSpent() { this.hide(); }
  update(hero: Phaser.GameObjects.Sprite, time: number, reserveReady: boolean) {
    if (!this.rim || !reserveReady) { this.hide(); return; }
    const reduced = prefersReducedMotion();
    const light = reduced ? 0.55 : 0.55 + Math.sin(time * 0.003) * 0.12;
    this.rim.setVisible(true).setTexture(hero.texture.key).setOrigin(hero.originX, hero.originY)
      .setPosition(hero.x, hero.y).setRotation(hero.rotation)
      .setScale(hero.scaleX * 1.065, hero.scaleY * 1.065).setAlpha(light * hero.alpha);
    this.sparks.clear().setVisible(true);
    this.sparks.lineStyle(2, 0xffeab4, 0.75 * hero.alpha);
    // Four steady pencil glints read as a power even with motion disabled.
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2 + 0.3;
      const x = hero.x + Math.cos(angle) * 71;
      const y = hero.y - 10 + Math.sin(angle) * 66;
      const size = 3 + (reduced ? 0 : this.pulse * 3);
      this.sparks.lineBetween(x - size, y, x + size, y);
      this.sparks.lineBetween(x, y - size, x, y + size);
    }
    this.pulse *= 0.95;
  }
  hide() { this.rim?.setVisible(false); this.sparks.setVisible(false); }
  destroy() { this.rim?.destroy(); this.sparks.destroy(); }
}
