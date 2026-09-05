import Phaser from 'phaser';

import { getCharacter } from '@/game/content/playableCharacters';
import { wantsChomperRigPreview } from '@/game/content/chomperArt';
import { localPreferenceStore } from '@/game/services/persistence/localPreferenceStore';
import { audioCueBus } from '@/game/services/audio/audioCueBus';
import { sessionState } from '@/game/state/sessionState';
import { ChomperEncounter, CHOMPER_RULES as R, type ChomperSnapshot } from '@/game/systems/boss/ChomperEncounter';
import { ChomperArtRenderer } from '@/game/systems/boss/ChomperArtRenderer';
import { CHOMPER_BITE_PATH } from '@/game/systems/boss/chomperBitePath';
import { prefersReducedMotion } from '@/ui/reducedMotion';
import { UI_FONT_STACK } from '@/ui/phaserTextStyle';

/** Local encounter preview: art/balance require review before release. */
export class ChomperScene extends Phaser.Scene {
  private encounter!: ChomperEncounter;
  private bossArt?: ChomperArtRenderer;
  private hero!: Phaser.GameObjects.Image;
  private ink!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private instruction!: Phaser.GameObjects.Text;
  private modal!: Phaser.GameObjects.Container;
  private modalTitle!: Phaser.GameObjects.Text;
  private modalBody!: Phaser.GameObjects.Text;
  private modalAction!: Phaser.GameObjects.Text;
  private lastMode = '';
  private lastWarningCycle = -1;
  private leaving = false;
  private heroScale = 1;
  private heroFootOffset = 0;
  private poses!: ReturnType<typeof getCharacter>['poses'];
  // Visual-only emission paths join each authored mouth to the two ranged
  // attack lanes. The bite is carried by the moving puppet itself.
  private readonly emissionPaths = {
    'low-wave': [{ x: 216, y: 286 }, { x: 183, y: 310 }, { x: 145, y: 350 },
      { x: 116, y: 407 }, { x: 110, y: 467 }, { x: 123, y: 518 }, { x: 152, y: R.lowY }],
    'high-burst': [{ x: 126, y: 181 }, { x: 100, y: 212 }, { x: 77, y: 256 },
      { x: 70, y: 316 }, { x: 85, y: 374 }, { x: 113, y: 421 }, { x: 152, y: R.highY }]
  };

  private readonly onKey = (event: KeyboardEvent) => {
    if (event.repeat) return;
    if (event.key === 'Enter') {
      event.preventDefault(); this.primaryAction();
    } else if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) {
      event.preventDefault();
      this.jump();
    } else if (['p', 'P', 'Escape'].includes(event.key)) this.togglePause();
  };
  private readonly onBlur = () => {
    if (this.isRunning()) this.encounter.setPaused(true);
  };
  private readonly onVisibility = () => { if (document.hidden) this.onBlur(); };

  constructor() { super('chomper'); }

  preload() {
    if (wantsChomperRigPreview()) ChomperArtRenderer.preload(this);
    // Art-lab candidates cannot enter a production build by accident.
    if (import.meta.env.DEV && !this.textures.exists('chomper-arena-preview')) {
      this.load.image('chomper-arena-preview', '/art-lab/2026-09-05-forest-polish/chomper-arena-v1.webp');
    }
  }

  create() {
    this.bossArt = undefined;
    this.encounter = new ChomperEncounter();
    this.leaving = false;
    this.lastMode = '';
    this.lastWarningCycle = -1;
    this.cameras.main.resetFX();
    this.cameras.main.setBackgroundColor('#070c18');
    window.dispatchEvent(new CustomEvent('mateo:ui-screen', { detail: { screen: 'chapter' } }));
    window.dispatchEvent(new CustomEvent('mateo:focus-mode', { detail: { active: false } }));
    window.dispatchEvent(new CustomEvent('mateo:victory-state', { detail: { active: false } }));

    if (wantsChomperRigPreview() && ChomperArtRenderer.available(this)) {
      this.bossArt = new ChomperArtRenderer(this);
    } else if (this.textures.exists('chomper-arena-preview')) {
      this.add.image(0, 64, 'chomper-arena-preview').setOrigin(0).setDisplaySize(360, 540);
    }
    const floor = this.add.graphics();
    floor.fillStyle(0x192c32, 1).fillRoundedRect(222, R.groundY, 116, 18, 5);
    floor.lineStyle(2, 0xb9d6b9, 0.9).lineBetween(223, R.groundY, 337, R.groundY);
    floor.lineStyle(1, 0x486b64, 0.8).lineBetween(230, R.groundY + 8, 315, R.groundY + 10);

    const character = getCharacter(localPreferenceStore.loadCharacterId());
    this.poses = character.poses;
    // Pack-v2 occupied alpha bounds: feet, not transparent canvas padding,
    // must sit on the arena's explicit support line.
    const metrics = character.artMetrics;
    this.heroScale = 88 / (metrics.groundedBaselineRow - metrics.portrait.top);
    this.heroFootOffset = (metrics.sourceHeight - metrics.groundedBaselineRow) * this.heroScale;
    this.hero = this.add.image(R.heroX, R.groundY + this.heroFootOffset, character.poses.main.key)
      .setOrigin(0.5, 1).setScale(this.heroScale).setDepth(3);
    this.ink = this.add.graphics().setDepth(2);
    this.add.rectangle(180, 45, 360, 90, 0x070c18, 0.94).setDepth(4);
    this.text(20, 17, 'CHOMPER', 22, '#f3d779').setDepth(4);
    this.status = this.text(20, 48, '', 12, '#d5e5db').setDepth(4);
    this.instruction = this.text(180, 94, '', 13, '#ffffff').setOrigin(0.5, 0).setDepth(4);
    this.button(302, 38, 78, 'Pausa', () => this.togglePause()).setDepth(5);
    this.text(180, 609, 'Toca para saltar · dos saltos', 12, '#bfcfc8').setOrigin(0.5).setDepth(4);

    const scrim = this.add.rectangle(0, 0, 360, 640, 0x030711, 0.74).setOrigin(0).setInteractive();
    scrim.on('pointerdown', (_p: unknown, _x: number, _y: number, event: Phaser.Types.Input.EventData) => event.stopPropagation());
    const panel = this.add.rectangle(180, 310, 308, 298, 0x10212a, 1).setStrokeStyle(2, 0x6b9b92, 0.6);
    this.modalTitle = this.text(180, 204, '', 23, '#f3d779').setOrigin(0.5);
    this.modalBody = this.text(180, 260, '', 14, '#e1e9de').setOrigin(0.5, 0);
    this.modalBody.setWordWrapWidth(252).setAlign('center').setLineSpacing(7);
    const action = this.button(180, 363, 248, '', () => this.primaryAction());
    this.modalAction = action.list[1] as Phaser.GameObjects.Text;
    const home = this.button(180, 424, 248, 'Volver al inicio', () => this.goHome());
    this.modal = this.add.container(0, 0, [scrim, panel, this.modalTitle, this.modalBody, action, home]).setDepth(10);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 120) this.jump();
    });
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.onKey);
      window.removeEventListener('blur', this.onBlur);
      document.removeEventListener('visibilitychange', this.onVisibility);
    });
    this.render(this.encounter.snapshot());
  }

  update(_time: number, delta: number) {
    if (this.leaving) return;
    const before = this.encounter.snapshot();
    this.encounter.advance(delta / 1000);
    const after = this.encounter.snapshot();
    if (after.notes > before.notes) audioCueBus.emit({ type: 'spark_collect', intensity: 1, chain: after.notes });
    if (after.lives < before.lives) audioCueBus.emit({ type: 'pulse_drop', intensity: 1 });
    if (after.phase === 'won' && before.phase !== 'won') audioCueBus.emit({ type: 'victory_win', intensity: 1 });
    this.render(after);
  }

  private jump() {
    if (this.encounter.jump()) audioCueBus.emit({ type: 'jump_player', intensity: 1 });
  }

  private isRunning() {
    return ['warning', 'attack', 'recovery'].includes(this.encounter.snapshot().phase);
  }

  private togglePause() {
    if (!this.leaving && this.isRunning()) this.encounter.setPaused(!this.encounter.snapshot().paused);
  }

  private primaryAction() {
    if (this.leaving) return;
    const state = this.encounter.snapshot();
    if (state.phase === 'ready') this.encounter.start();
    else if (state.paused) this.encounter.setPaused(false);
    else if (state.phase === 'won' || state.phase === 'lost') {
      this.leaving = true;
      this.scene.restart();
    }
  }

  private goHome() {
    if (this.leaving) return;
    this.leaving = true;
    sessionState.restartRun();
    this.scene.start('level-entry', { stage: 'wounded-planet' });
  }

  private render(s: ChomperSnapshot) {
    const reducedMotion = prefersReducedMotion();
    this.bossArt?.update(s, reducedMotion);
    this.hero.setY(s.heroY + this.heroFootOffset);
    const pose = s.phase === 'won' ? this.poses.finishAwakened
      : s.invulnerability > 1 ? this.poses.hit
        : !s.grounded ? (s.velocityY < 0 ? this.poses.jumpRise : this.poses.jumpFall)
          : this.poses.main;
    if (pose && this.textures.exists(pose.key) && this.hero.texture.key !== pose.key) this.hero.setTexture(pose.key);
    this.hero.setAlpha(s.invulnerability > 0 ? 0.7 : 1);
    this.status.setText(`Energía ${s.lives}/${R.lives}     Notas ${s.notes}/${R.notesToWin}`);
    const low = s.attack === 'low-wave';
    const high = s.attack === 'high-burst';
    const bite = s.attack === 'bite-lunge';
    const color = low ? 0xffad79 : high ? 0xd6a3ff : 0xff716b;
    const y = low ? R.lowY : high ? R.highY : CHOMPER_BITE_PATH.contact.y;
    const path = s.attack === 'bite-lunge' ? undefined : this.emissionPaths[s.attack];
    const mouth = this.bossArt?.mouth(s.attack) ?? path?.[0] ??
      (bite ? { x: 126, y: 181 } : { x: 216, y: 286 });
    this.ink.setDepth(bite && (s.phase === 'warning' || s.phase === 'attack') ? 3.5 : 2);
    this.instruction.setText(s.phase === 'recovery' ? 'Ahora: alcanza la nota'
      : s.phase === 'warning' ? low ? 'Prepárate · onda baja'
        : high ? 'Prepárate · descarga alta' : 'Prepárate · mordisco'
        : s.phase === 'attack' ? low ? '¡Ahora! · salta'
          : high ? 'Descarga alta · quédate abajo' : '¡Ahora! · salta el mordisco' : '');
    this.ink.clear();
    if (path && (s.phase === 'warning' || (s.phase === 'attack' && s.phaseElapsed < 0.3))) {
      const alpha = s.phase === 'warning' ? 0.16 : 0.65 * (1 - s.phaseElapsed / 0.3);
      this.ink.lineStyle(2, color, alpha).strokePoints([mouth, ...path.slice(1)], false);
    }
    if (s.phase === 'warning') {
      if (!s.paused && this.lastWarningCycle !== s.cycle) {
        this.lastWarningCycle = s.cycle;
        const cue = low ? 'chomper_warning_low' : high ? 'chomper_warning_high' : 'chomper_warning_bite';
        audioCueBus.emit({ type: cue, intensity: 1 });
      }
      // Shape + text + position carry the instruction; colour is not the only cue.
      this.ink.lineStyle(2, color, 0.4);
      if (bite) {
        const spread = 24 - s.phaseProgress * 8;
        this.ink.lineStyle(3, color, 0.72);
        this.ink.lineBetween(R.heroX - 26, y - spread, R.heroX, y - 8);
        this.ink.lineBetween(R.heroX, y - 8, R.heroX + 25, y - spread);
        this.ink.lineBetween(R.heroX - 26, y + 6, R.heroX, y - 3);
        this.ink.lineBetween(R.heroX, y - 3, R.heroX + 25, y + 6);
      } else {
        for (let x = 224; x < 337; x += 14) this.ink.lineBetween(x, y, x + 7, y);
      }
      this.ink.lineStyle(3, color, 0.8).strokeCircle(mouth.x, mouth.y, 12 + s.phaseProgress * 6);
    }
    if (s.projectile) {
      const p = s.projectile;
      if (bite) {
        this.ink.lineStyle(reducedMotion ? 4 : 3, color, 0.95);
        if (reducedMotion) {
          this.ink.lineBetween(p.x - 15, p.y - 17, p.x + 11, p.y - 7);
          this.ink.lineBetween(p.x - 15, p.y + 13, p.x + 11, p.y + 5);
        } else {
          this.ink.strokeCircle(p.x, p.y, 18);
          this.ink.lineBetween(p.x - 29, p.y - 23, p.x - 20, p.y - 16);
          this.ink.lineBetween(p.x + 20, p.y - 16, p.x + 29, p.y - 23);
          this.ink.lineBetween(p.x - 27, p.y + 20, p.x - 18, p.y + 14);
          this.ink.lineBetween(p.x + 18, p.y + 14, p.x + 27, p.y + 20);
        }
      } else {
        this.ink.lineStyle(3, color, 0.45).lineBetween(p.x - 28, p.y, p.x - 10, p.y);
        this.ink.fillStyle(0x18132a, 1).fillCircle(p.x, p.y, p.radius + 2);
        this.ink.lineStyle(3, color, 1).strokeCircle(p.x, p.y, p.radius);
      }
      if (low) {
        this.ink.lineStyle(2, color, 1).lineBetween(p.x - 6, p.y + 3, p.x - 2, p.y - 3);
        this.ink.lineBetween(p.x - 2, p.y - 3, p.x + 2, p.y + 3);
        this.ink.lineBetween(p.x + 2, p.y + 3, p.x + 6, p.y - 3);
      }
      else if (high) this.ink.fillStyle(color, 1).fillTriangle(p.x - 6, p.y - 3, p.x + 7, p.y, p.x - 6, p.y + 4);
    }
    if (s.noteAvailable) {
      const bob = reducedMotion ? 0 : Math.sin(s.phaseElapsed * 3) * 2;
      const x = R.noteX, noteY = R.noteY + bob;
      this.ink.lineStyle(2, 0xf5dc88, 0.3).strokeCircle(x, noteY, 23);
      this.ink.fillStyle(0x101c22, 1).fillCircle(x, noteY, 16);
      this.ink.fillStyle(0xffeab4, 1).fillEllipse(x - 4, noteY + 7, 13, 9);
      this.ink.fillRect(x + 1, noteY - 12, 4, 21);
      this.ink.fillTriangle(x + 5, noteY - 12, x + 15, noteY - 7, x + 5, noteY - 3);
    }
    const mode = s.paused ? 'paused' : s.phase;
    if (mode === this.lastMode) return;
    this.lastMode = mode;
    const copy: Record<string, [string, string, string]> = {
      ready: ['Chomper', 'Salta la onda baja y el mordisco al ver «¡Ahora!».\nEn la descarga alta, quédate abajo.\nDespués, busca la nota.', 'Comenzar'],
      paused: ['En pausa', 'El encuentro te espera.\nLos ataques también están detenidos.', 'Continuar'],
      won: ['Encuentro superado', 'Has reunido las seis notas.\nEl cierre de la historia sigue en creación.', 'Jugar de nuevo'],
      lost: ['Una vez más', 'Mira qué ataque prepara Chomper antes de saltar.\nPuedes volver a intentarlo.', 'Reintentar']
    };
    const panel = copy[mode];
    this.modal.setVisible(!!panel);
    if (panel) {
      this.modalTitle.setText(panel[0]);
      this.modalBody.setText(panel[1]);
      this.modalAction.setText(panel[2]);
    }
  }

  private text(x: number, y: number, label: string, size: number, color: string) {
    return this.add.text(x, y, label, { fontFamily: UI_FONT_STACK, fontSize: `${size}px`, color }).setResolution(2);
  }

  private button(x: number, y: number, width: number, label: string, action: () => void) {
    const plate = this.add.rectangle(0, 0, width, 48, 0x243c42, 1).setStrokeStyle(1, 0x9ac9b5, 0.75).setInteractive({ useHandCursor: true });
    const text = this.text(0, 0, label, 14, '#f2edda').setOrigin(0.5);
    plate.on('pointerdown', (_p: unknown, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation(); action();
    });
    return this.add.container(x, y, [plate, text]);
  }
}
