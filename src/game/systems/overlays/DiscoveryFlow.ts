import Phaser from 'phaser';

import {
  CONTINUE_BUTTON_LABEL,
  DISCOVERY_BEATS,
  HOME_BUTTON_LABEL,
  type DiscoveryBeatId,
  type DiscoveryBeatDefinition
} from '@/game/content/overlayText';
import { journeyConfig } from '@/game/content/journeyConfig';
import { createPanelButton } from '@/ui/panelButton';
import {
  forgetDiscoveryBeat,
  hasSeenDiscoveryBeat,
  rememberDiscoveryBeat
} from '@/game/systems/overlays/discoverySessionCache';

/**
 * Scene state/actions DiscoveryFlow must consult or drive but does not own —
 * same pattern as PauseFlowHost. Two beats ('shark_sighting', 'shark_catch')
 * also read back through `hasSeenBeat`, exactly like GuidanceDirector's
 * dual-role keys: the shark director needs "has this beat ever shown" as
 * game-state, not just as a trigger gate.
 */
export interface DiscoveryFlowHost {
  /** May a beat show right now? (!failResolved && !finishResolved) */
  canShow(): boolean;
  setRunFrozen(frozen: boolean): void;
  emitFocusMode(active: boolean): void;
  /** Guidance-mode beats route through the scene's shared HUD hint line. */
  emitGuidanceLine(text: string, durationMs: number, time: number): void;
  /** Panel beats touch the shared guidance cooldown clock without emitting a HUD line. */
  markGuidanceMoment(time: number): void;
  /**
   * Called when a panel beat closes and no next beat is queued. The scene
   * re-checks its own guards (fail/finish/victory-frozen) and, if the run
   * should actually resume, unfreezes + applies any pending shark grace.
   */
  resumeIfAllowed(): void;
  returnToStart(): void;
}

/**
 * One-time discovery beats: a transient HUD hint ("guidance" mode, routed
 * through the host) or a panel that freezes the run ("panel" mode, rendered
 * here). Extracted verbatim from JourneyScene. Trigger call sites (phrase
 * guidance, shark sighting/catch, hit/reserve reactions) stay in the scene —
 * they're tied to unrelated systems — but the id→beat resolution, session
 * dedup, panel render, and queue-while-active logic move here.
 *
 * Phaser-coupled end to end (containers/tweens/camera); intentionally not
 * unit-tested — verified with a browser smoke test instead. The session
 * dedup logic it depends on (discoverySessionCache.ts) IS Phaser-free and is
 * unit tested there.
 */
export class DiscoveryFlow {
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly stage: Phaser.GameObjects.Container;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly closingText: Phaser.GameObjects.Text;
  private activeBeatId: DiscoveryBeatId | null = null;
  private queuedBeatId: DiscoveryBeatId | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly host: DiscoveryFlowHost
  ) {
    const width = journeyConfig.logicalSize.width;

    this.overlay = scene.add
      .rectangle(width * 0.5, journeyConfig.logicalSize.height * 0.5, width, journeyConfig.logicalSize.height, 0x071018, 0.001)
      .setDepth(6.58)
      .setAlpha(0)
      .setVisible(false)
      .setInteractive();
    this.overlay.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();
      }
    );
    this.overlay.disableInteractive();

    const built = this.createStage(width * 0.5, 312);
    this.stage = built.container;
    this.titleText = built.title;
    this.bodyText = built.body;
    this.closingText = built.closing;
  }

  /** Read by PauseFlowHost.isDiscoveryBeatActive and JourneyScene.update()'s gameplay-systems gate. */
  isActive() {
    return this.activeBeatId !== null;
  }

  /** Dual-role read: the shark director asks this to decide first-rescue vs. later-rescue behavior. */
  hasSeenBeat(beatId: DiscoveryBeatId) {
    return hasSeenDiscoveryBeat(beatId);
  }

  /** Main entry point. Guidance-mode beats emit a HUD hint; panel-mode beats present (or queue). */
  trigger(beatId: DiscoveryBeatId, time: number) {
    if (hasSeenDiscoveryBeat(beatId)) {
      return;
    }

    const beat = DISCOVERY_BEATS[beatId];

    if (beat.mode === 'guidance') {
      if (!this.host.canShow() || this.activeBeatId) {
        return;
      }

      rememberDiscoveryBeat(beatId);
      this.host.emitGuidanceLine(beat.text, beat.durationMs ?? 1800, time);
      return;
    }

    this.present(beatId, beat, time);
  }

  /** Continue button on the panel — advances to a queued beat, or resumes the run. */
  dismiss(time: number) {
    if (!this.activeBeatId) {
      return;
    }

    const nextBeat = this.queuedBeatId;
    this.activeBeatId = null;
    this.queuedBeatId = null;
    this.host.markGuidanceMoment(time);
    this.scene.tweens.killTweensOf(this.overlay);
    this.scene.tweens.killTweensOf(this.stage);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 120,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.overlay.disableInteractive();
        this.overlay.setVisible(false);
      }
    });
    this.scene.tweens.add({
      targets: this.stage,
      alpha: 0,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 140,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.stage.setVisible(false);

        if (nextBeat) {
          this.trigger(nextBeat, this.scene.time.now);
        }
      }
    });

    if (!nextBeat) {
      this.host.resumeIfAllowed();
      this.scene.cameras.main.zoomTo(1, 170, 'Cubic.easeOut');
    }
  }

  /**
   * Force-hide without resuming — used when fail/finish begins, and on scene
   * shutdown. Also drops the active beat from the session cache so it can
   * show again on the next attempt (it never got a proper read/dismiss).
   */
  hide() {
    if (this.activeBeatId) {
      forgetDiscoveryBeat(this.activeBeatId);
    }

    this.activeBeatId = null;
    this.queuedBeatId = null;

    // During scene.restart(), Phaser tears down plugins and cameras before
    // firing SHUTDOWN. Guard every scene-owned access.
    if (this.scene.tweens) {
      this.scene.tweens.killTweensOf(this.overlay);
      this.scene.tweens.killTweensOf(this.stage);
    }

    if (this.overlay?.scene) {
      this.overlay.disableInteractive();
      this.overlay.setAlpha(0).setVisible(false);
    }

    if (this.stage?.scene) {
      this.stage.setAlpha(0).setScale(0.92).setVisible(false);
    }

    if (this.scene.cameras?.main) {
      this.scene.cameras.main.zoomTo(1, 120, 'Cubic.easeOut');
    }
  }

  private present(
    beatId: DiscoveryBeatId,
    beat: Extract<DiscoveryBeatDefinition, { mode: 'panel' }>,
    time: number
  ) {
    if (!this.host.canShow()) {
      return;
    }

    if (this.activeBeatId) {
      if (this.activeBeatId !== beatId) {
        this.queuedBeatId = beatId;
      }
      return;
    }

    rememberDiscoveryBeat(beatId);
    this.activeBeatId = beatId;
    this.queuedBeatId = null;
    this.host.markGuidanceMoment(time);
    this.titleText.setText(beat.title);
    this.bodyText.setText(beat.body);
    this.closingText.setText(beat.closing);
    this.host.setRunFrozen(true);
    this.host.emitFocusMode(true);
    this.overlay.setVisible(true).setAlpha(0.001).setInteractive();
    this.stage.setVisible(true).setAlpha(0).setScale(0.92);
    this.scene.children.bringToTop(this.overlay);
    this.scene.children.bringToTop(this.stage);
    this.scene.tweens.killTweensOf(this.overlay);
    this.scene.tweens.killTweensOf(this.stage);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0.24,
      duration: 160,
      ease: 'Quad.easeOut'
    });
    this.scene.tweens.add({
      targets: this.stage,
      alpha: 0.98,
      scaleX: 0.98,
      scaleY: 0.98,
      duration: 190,
      ease: 'Back.easeOut'
    });
    this.scene.cameras.main.zoomTo(1.02, 170, 'Cubic.easeOut');
  }

  private createStage(x: number, y: number) {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0b1117, 0.96);
    panel.lineStyle(2, 0xdce9d6, 0.11);
    panel.fillRoundedRect(-118, -80, 236, 176, 22);
    panel.strokeRoundedRect(-118, -80, 236, 176, 22);
    panel.lineStyle(1, 0xf7fff0, 0.025);
    panel.strokeRoundedRect(-110, -72, 220, 160, 18);
    panel.fillStyle(0xf1ffbe, 0.028);
    panel.fillEllipse(0, -40, 84, 24);
    panel.fillStyle(0xd8f4df, 0.026);
    panel.fillCircle(-78, -42, 2);
    panel.fillCircle(78, -42, 2);

    const title = this.scene.add
      .text(0, -42, 'Notas.', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '18px',
        color: '#f2ffbe',
        stroke: '#081018',
        strokeThickness: 2,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#03060a', 3, false, true);
    const body = this.scene.add
      .text(0, -2, 'Cada nota despierta el planeta.', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '14px',
        color: '#fff7ec',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 186, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#04070b', 2, false, true);
    const closing = this.scene.add
      .text(0, 32, 'Y llena la reserva.', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        color: '#cfe8d9',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 184, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#04070b', 2, false, true);
    const continueButton = createPanelButton(
      this.scene,
      CONTINUE_BUTTON_LABEL,
      98,
      () => this.dismiss(this.scene.time.now),
      '11px'
    );
    const homeButton = createPanelButton(
      this.scene,
      HOME_BUTTON_LABEL,
      112,
      () => this.host.returnToStart(),
      '11px'
    );

    continueButton.setPosition(-54, 78);
    homeButton.setPosition(58, 78);

    return {
      container: this.scene.add
        .container(x, y, [panel, title, body, closing, continueButton, homeButton])
        .setDepth(6.64)
        .setAlpha(0)
        .setScale(0.92)
        .setVisible(false),
      title,
      body,
      closing
    };
  }
}
