import { confirmExit } from '@/ui/confirmExit';
import { uiText } from '@/ui/nativeText';
import Phaser from 'phaser';

import { quickHelpContent } from '@/game/content/helpContent';
import { journeyConfig } from '@/game/content/journeyConfig';
import {
  CONTINUE_BUTTON_LABEL,
  HELP_BUTTON_LABEL,
  HOME_BUTTON_LABEL,
  PAUSE_BODY,
  PAUSE_CLOSING,
  PAUSE_TITLE,
  REPLAY_BUTTON_LABEL
} from '@/game/content/overlayText';
import { createPanelButton } from '@/ui/panelButton';

/**
 * Scene state the pause flow must consult or drive but does not own. Mirrors
 * exactly the reads/calls the old inline JourneyScene code made — same
 * criterion as GuidanceDirector's dual-role keys: the module owns the overlay
 * state and animation, the scene keeps owning the decisions.
 */
export interface PauseFlowHost {
  /** May the pause open at all? (!failResolved && !finishResolved && !returnHomeQueued) */
  canPause(): boolean;
  /** A discovery beat owns the screen; toggling pause over it is ignored. */
  isDiscoveryBeatActive(): boolean;
  /** May the run resume when the pause closes? (!failResolved && !finishResolved && no active beat) */
  canRestoreRun(): boolean;
  setRunFrozen(frozen: boolean): void;
  /** Clear any in-flight shark so it doesn't sit frozen behind the overlay. */
  haltShark(): void;
  emitFocusMode(active: boolean): void;
  replayCurrentStage(): void;
  returnToStart(): void;
}

/**
 * Pause + nested quick-help overlay, extracted verbatim from JourneyScene.
 * Owns the input-blocking scrim, both panels, their open/close/swap tweens
 * and the window-level triggers (HUD `mateo:pause-request` event, Escape/P).
 *
 * The actual hard freeze lives in the scene: JourneyScene.update() returns
 * immediately while `isOpen()` — this module only freezes/unfreezes the
 * runner loop and reports its state.
 *
 * Lifecycle tests exercise the owned objects/tweens with a scene double;
 * browser smoke tests still verify Phaser's real shutdown and input ordering.
 */
export class PauseFlow {
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly pauseStage: Phaser.GameObjects.Container;
  private readonly helpStage: Phaser.GameObjects.Container;
  private pauseOpen = false;
  private helpOpen = false;
  private destroyed = false;

  private readonly handlePauseRequest = () => {
    this.toggle();
  };
  private readonly handlePauseKeyDown = (event: KeyboardEvent) => {
    if (event.repeat || (event.key !== 'Escape' && event.key.toLowerCase() !== 'p')) {
      return;
    }

    this.toggle();
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly host: PauseFlowHost
  ) {
    const width = journeyConfig.logicalSize.width;

    this.overlay = scene.add
      .rectangle(width * 0.5, journeyConfig.logicalSize.height * 0.5, width, journeyConfig.logicalSize.height, 0x071018, 0.001)
      .setDepth(6.7)
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
    this.pauseStage = this.createPauseStage(width * 0.5, 306);
    this.helpStage = this.createHelpStage(width * 0.5, 304);

    if (typeof window !== 'undefined') {
      window.addEventListener('mateo:pause-request', this.handlePauseRequest as EventListener);
      window.addEventListener('keydown', this.handlePauseKeyDown);
    }
  }

  /** JourneyScene.update() hard-freezes on this. */
  isOpen() {
    return this.pauseOpen;
  }

  toggle() {
    if (this.destroyed || !this.scene.sys.isActive()) {
      return;
    }

    if (this.pauseOpen) {
      this.close(true);
      return;
    }

    if (!this.host.canPause() || this.host.isDiscoveryBeatActive()) {
      return;
    }

    this.open();
  }

  close(restoreRun: boolean) {
    if (this.destroyed || (!this.pauseOpen && !this.helpOpen)) {
      return;
    }

    this.pauseOpen = false;
    this.helpOpen = false;
    this.scene.tweens.killTweensOf(this.overlay);
    this.scene.tweens.killTweensOf(this.pauseStage);
    this.scene.tweens.killTweensOf(this.helpStage);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 110,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.destroyed) return;
        this.overlay.disableInteractive();
        this.overlay.setVisible(false);
      }
    });
    this.scene.tweens.add({
      targets: [this.pauseStage, this.helpStage],
      alpha: 0,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 130,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.destroyed) return;
        this.pauseStage.setVisible(false);
        this.helpStage.setVisible(false);
      }
    });

    if (restoreRun && this.host.canRestoreRun()) {
      this.host.setRunFrozen(false);
      this.host.emitFocusMode(false);
    }
  }

  /** Synchronous disposal: shutdown must never start another closing tween. */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (typeof window !== 'undefined') {
      window.removeEventListener('mateo:pause-request', this.handlePauseRequest as EventListener);
      window.removeEventListener('keydown', this.handlePauseKeyDown);
    }

    this.pauseOpen = false;
    this.helpOpen = false;
    [this.overlay, this.pauseStage, this.helpStage].forEach((object) => {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    });
  }

  private open() {
    if (this.destroyed || this.pauseOpen || !this.host.canPause()) {
      return;
    }

    this.pauseOpen = true;
    this.helpOpen = false;
    this.host.setRunFrozen(true);
    // Clear any in-flight shark so it does not sit frozen (or "ghost") behind
    // the pause overlay. It is a periodic helper; the next fly-by re-triggers.
    this.host.haltShark();
    this.host.emitFocusMode(true);
    this.overlay.setVisible(true).setAlpha(0.001).setInteractive();
    this.pauseStage.setVisible(true).setAlpha(0).setScale(0.92);
    this.helpStage.setVisible(false).setAlpha(0).setScale(0.92);
    this.scene.children.bringToTop(this.overlay);
    this.scene.children.bringToTop(this.pauseStage);
    this.scene.tweens.killTweensOf(this.overlay);
    this.scene.tweens.killTweensOf(this.pauseStage);
    this.scene.tweens.killTweensOf(this.helpStage);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0.28,
      duration: 150,
      ease: 'Quad.easeOut'
    });
    this.scene.tweens.add({
      targets: this.pauseStage,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: 'Back.easeOut'
    });
  }

  private openHelp() {
    if (this.destroyed || !this.pauseOpen || this.helpOpen) {
      return;
    }

    this.helpOpen = true;
    this.helpStage.setVisible(true).setAlpha(0).setScale(0.92);
    this.scene.children.bringToTop(this.helpStage);
    this.scene.tweens.killTweensOf(this.pauseStage);
    this.scene.tweens.killTweensOf(this.helpStage);
    this.scene.tweens.add({
      targets: this.pauseStage,
      alpha: 0,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 110,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.destroyed) return;
        this.pauseStage.setVisible(false);
      }
    });
    this.scene.tweens.add({
      targets: this.helpStage,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 170,
      ease: 'Back.easeOut'
    });
  }

  private closeHelp() {
    if (this.destroyed || !this.pauseOpen || !this.helpOpen) {
      return;
    }

    this.helpOpen = false;
    this.pauseStage.setVisible(true).setAlpha(0).setScale(0.92);
    this.scene.children.bringToTop(this.pauseStage);
    this.scene.tweens.killTweensOf(this.pauseStage);
    this.scene.tweens.killTweensOf(this.helpStage);
    this.scene.tweens.add({
      targets: this.helpStage,
      alpha: 0,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 110,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.destroyed) return;
        this.helpStage.setVisible(false);
      }
    });
    this.scene.tweens.add({
      targets: this.pauseStage,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 170,
      ease: 'Back.easeOut'
    });
  }

  private createPauseStage(x: number, y: number) {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0b1117, 0.96);
    panel.lineStyle(2, 0xdce9d6, 0.1);
    // The second button row ends at y=134; keep it inside the panel with padding.
    panel.fillRoundedRect(-154, -108, 308, 286, 22);
    panel.strokeRoundedRect(-154, -108, 308, 286, 22);
    panel.lineStyle(1, 0xf7fff0, 0.024);
    panel.strokeRoundedRect(-146, -100, 292, 270, 18);
    panel.fillStyle(0xf1ffbe, 0.026);
    panel.fillEllipse(0, -48, 88, 24);

    const title = uiText(this.scene, 0, -48, PAUSE_TITLE, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '26px',
        color: '#f2ffbe',
        stroke: '#081018',
        strokeThickness: 2,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(2);
    const body = uiText(this.scene, 0, -8, PAUSE_BODY, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '17px',
        color: '#fff7ec',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 256, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2);
    const closing = uiText(this.scene, 0, 28, PAUSE_CLOSING, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
        color: '#cfe8d9',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(2);
    const continueButton = createPanelButton(
      this.scene,
      CONTINUE_BUTTON_LABEL,
      128,
      () => this.close(true),
      '11px'
    );
    const helpButton = createPanelButton(this.scene, HELP_BUTTON_LABEL, 128, () => this.openHelp(), '11px');
    const replayButton = createPanelButton(
      this.scene,
      REPLAY_BUTTON_LABEL,
      128,
      () => {
        if (this.destroyed) return;
        this.close(false);
        this.host.replayCurrentStage();
      },
      '11px'
    );
    const homeButton = createPanelButton(
      this.scene,
      HOME_BUTTON_LABEL,
      128,
      () => {
        if (this.destroyed) return;
        confirmExit(this.scene, () => {
          if (this.destroyed) return;
          this.close(false);
          this.host.returnToStart();
        });
      },
      '11px'
    );

    continueButton.setPosition(-70, 78);
    helpButton.setPosition(70, 78);
    replayButton.setPosition(-70, 134);
    homeButton.setPosition(70, 134);

    return this.scene.add
      .container(x, y, [panel, title, body, closing, continueButton, helpButton, replayButton, homeButton])
      .setDepth(6.72)
      .setAlpha(0)
      .setScale(0.92)
      .setVisible(false);
  }

  private createHelpStage(x: number, y: number) {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0b1117, 0.96);
    panel.lineStyle(2, 0xdce9d6, 0.1);
    panel.fillRoundedRect(-154, -182, 308, 384, 22);
    panel.strokeRoundedRect(-154, -182, 308, 384, 22);
    panel.lineStyle(1, 0xf7fff0, 0.024);
    panel.strokeRoundedRect(-146, -174, 292, 368, 18);
    panel.fillStyle(0xf1ffbe, 0.026);
    panel.fillEllipse(0, -62, 96, 24);

    const title = uiText(this.scene, 0, -142, quickHelpContent.title, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '26px',
        color: '#f2ffbe',
        stroke: '#081018',
        strokeThickness: 2,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(2);
    const lead = uiText(this.scene, 0, -96, quickHelpContent.lead, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '17px',
        color: '#fff8ef',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 256, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2);
    const lineA = uiText(this.scene, 0, -42, quickHelpContent.lines[0], {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
        color: '#d9e2e8',
        align: 'center',
        wordWrap: { width: 256, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2);
    const lineB = uiText(this.scene, 0, 54, `${quickHelpContent.lines[1]} ${quickHelpContent.lines[2]}`, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
        color: '#d9e2e8',
        align: 'center',
        wordWrap: { width: 256, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2);
    const backButton = createPanelButton(
      this.scene,
      quickHelpContent.back,
      118,
      () => this.closeHelp(),
      '11px'
    );

    backButton.setPosition(0, 154);

    return this.scene.add
      .container(x, y, [panel, title, lead, lineA, lineB, backButton])
      .setDepth(6.73)
      .setAlpha(0)
      .setScale(0.92)
      .setVisible(false);
  }
}
