import Phaser from 'phaser';

import { journeyConfig } from '@/game/content/journeyConfig';
import {
  FAIL_BODY,
  FAIL_CLOSING,
  FAIL_TITLE,
  HOME_BUTTON_LABEL,
  MOONLIGHT_FAIL_BODY,
  MOONLIGHT_FAIL_CLOSING,
  MOONLIGHT_FAIL_TITLE,
  REPLAY_BUTTON_LABEL
} from '@/game/content/overlayText';
import { createPanelButton } from '@/ui/panelButton';

/**
 * Scene state/actions FailFlow must consult or drive but does not own — same
 * pattern as PauseFlowHost/DiscoveryFlowHost. `begin()` is the one place that
 * stops every other in-flight system (pause, discovery, the finish preview
 * objects, the shark, the hit-reaction text) before showing the retry panel,
 * so the host surface here is wider than pause/discovery's.
 */
export interface FailFlowHost {
  /** May the run fail right now? (!finishResolved) */
  canFail(): boolean;
  closePause(): void;
  hideDiscovery(): void;
  /** finishStage/continueStage/ingredient alpha -> 0, via FinishFlow.hidePreview(). */
  hideFinishPreview(): void;
  haltShark(): void;
  emitFocusMode(active: boolean): void;
  clearHitReaction(): void;
  /** emitFocusMode(false) + sessionState.restartRun() + scene.restart(...) — a scene-level decision. */
  restartRun(): void;
  returnToStart(): void;
}

/**
 * Fail (retry) overlay, extracted verbatim from JourneyScene. Owns the
 * input-blocking retry scrim, the fail panel, the resolved/restart-queued
 * state, and the pointer-debounced restart flow.
 *
 * `isResolved()` is a dual-role read like GuidanceDirector's keys and
 * PauseFlow.isOpen(): ~15 unrelated systems across the scene (finish,
 * discovery, the shark trigger gate, hit-reaction, guidance moments) gate on
 * "has the run failed", not just fail's own code.
 *
 * Phaser-coupled end to end (containers/tweens/input/pointer debounce);
 * intentionally not unit-tested — verified with a browser smoke test.
 */
export class FailFlow {
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly stage: Phaser.GameObjects.Container;
  private resolved = false;
  private restartQueued = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly isMoonlight: boolean,
    private readonly showDebug: boolean,
    private readonly host: FailFlowHost
  ) {
    const width = journeyConfig.logicalSize.width;

    this.overlay = scene.add
      .rectangle(width * 0.5, journeyConfig.logicalSize.height * 0.5, width, journeyConfig.logicalSize.height, 0x000000, 0.001)
      .setDepth(6.76)
      .setAlpha(0)
      .setVisible(false);
    this.stage = this.createStage(width * 0.5, 316);
  }

  /** Dual-role read: consulted by finish/discovery/shark/hit-reaction/guidance gates across the scene. */
  isResolved() {
    return this.resolved;
  }

  /** JourneyScene.update() lerps failStage toward the resolved pose every frame regardless of state. */
  update() {
    const targetAlpha = this.resolved ? 1 : 0;
    const targetScale = this.resolved ? 1 : 0.92;
    const targetY = this.resolved ? 308 : 316;

    this.stage
      .setAlpha(Phaser.Math.Linear(this.stage.alpha, targetAlpha, 0.16))
      .setScale(Phaser.Math.Linear(this.stage.scaleX, targetScale, 0.16))
      .setPosition(this.stage.x, Phaser.Math.Linear(this.stage.y, targetY, 0.16));
  }

  /** Called once from the run-failed check in JourneyScene.update(). */
  begin() {
    if (this.resolved || !this.host.canFail()) {
      return;
    }

    this.host.closePause();
    this.resolved = true;
    this.restartQueued = false;
    this.host.clearHitReaction();
    this.host.hideDiscovery();
    this.host.hideFinishPreview();
    this.scene.input.enabled = true;
    this.scene.children.bringToTop(this.overlay);
    this.scene.children.bringToTop(this.stage);
    this.overlay
      .setVisible(true)
      .setAlpha(0.001)
      .setInteractive()
      .off('pointerdown', this.handleRestartPointer, this)
      .on('pointerdown', this.handleRestartPointer, this);
    this.host.haltShark();
    this.host.emitFocusMode(true);
  }

  /** Debug HUD retry status, read by JourneyScene.renderDebugOverlay(). */
  getDebugState(): 'idle' | 'queued' | 'ready' {
    if (!this.resolved) {
      return 'idle';
    }

    return this.restartQueued ? 'queued' : 'ready';
  }

  private handleRestartPointer(pointer: Phaser.Input.Pointer) {
    this.logRetryDebug('retry target hit', {
      button: pointer.button,
      resolved: this.resolved,
      inputEnabled: this.scene.input.enabled,
      restartQueued: this.restartQueued,
      x: Math.round(pointer.x),
      y: Math.round(pointer.y)
    });

    if (!pointer.wasTouch && pointer.button !== 0) {
      this.logRetryDebug('restart ignored', {
        button: pointer.button,
        reason: 'non-primary pointer'
      });
      return;
    }

    if (!this.resolved) {
      this.logRetryDebug('restart ignored', {
        reason: 'fail-state not active'
      });
      return;
    }

    if (!this.scene.input.enabled) {
      this.logRetryDebug('restart ignored', {
        reason: 'scene input disabled'
      });
      return;
    }

    if (this.restartQueued) {
      this.logRetryDebug('retry guard active', {
        reason: 'restart already queued'
      });
      return;
    }

    this.restartQueued = true;
    this.scene.time.delayedCall(0, this.triggerRestart, undefined, this);
  }

  private triggerRestart() {
    if (!this.resolved) {
      this.restartQueued = false;
      this.logRetryDebug('restart ignored', {
        reason: 'fail-state cleared before restart'
      });
      return;
    }

    this.logRetryDebug('restart actually triggered');
    this.host.restartRun();
  }

  private logRetryDebug(message: string, details?: Record<string, unknown>) {
    if (!this.showDebug) {
      return;
    }

    console.info('[retry-flow]', message, details ?? {});
  }

  private createStage(x: number, y: number) {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x10151d, 0.96);
    panel.lineStyle(2, 0xdce9d6, 0.1);
    panel.fillRoundedRect(-118, -80, 236, 176, 20);
    panel.strokeRoundedRect(-118, -80, 236, 176, 20);
    panel.lineStyle(1, 0xf7fff0, 0.018);
    panel.strokeRoundedRect(-110, -72, 220, 160, 16);
    panel.fillStyle(0xf1ffbe, 0.024);
    panel.fillEllipse(0, -28, 72, 20);
    panel.fillStyle(0xd8f4df, 0.03);
    panel.fillCircle(-80, -30, 2);
    panel.fillCircle(80, -30, 2);

    const title = this.scene.add
      .text(0, -34, this.isMoonlight ? MOONLIGHT_FAIL_TITLE : FAIL_TITLE, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '17px',
        color: '#fff8ef',
        stroke: '#091018',
        strokeThickness: 2,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#04070b', 3, false, true);
    const body = this.scene.add
      .text(0, 2, this.isMoonlight ? MOONLIGHT_FAIL_BODY : FAIL_BODY, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '14px',
        color: '#f3f0e8',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 182, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#04070b', 2, false, true);
    const closing = this.scene.add
      .text(0, 34, this.isMoonlight ? MOONLIGHT_FAIL_CLOSING : FAIL_CLOSING, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        color: '#cfe8d9',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#04070b', 2, false, true);
    const replayButton = createPanelButton(
      this.scene,
      REPLAY_BUTTON_LABEL,
      98,
      () => this.triggerRestart(),
      '11px'
    );
    const homeButton = createPanelButton(
      this.scene,
      HOME_BUTTON_LABEL,
      108,
      () => this.host.returnToStart(),
      '11px'
    );

    replayButton.setPosition(-56, 82);
    homeButton.setPosition(56, 82);

    return this.scene.add
      .container(x, y, [panel, title, body, closing, replayButton, homeButton])
      .setDepth(6.62)
      .setAlpha(0)
      .setScale(0.92)
      .setSize(236, 176);
  }
}
