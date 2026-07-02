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
 * Phaser-coupled end to end (containers, tweens, input); intentionally not
 * unit-tested — its verification is the browser smoke test.
 */
export class PauseFlow {
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly pauseStage: Phaser.GameObjects.Container;
  private readonly helpStage: Phaser.GameObjects.Container;
  private pauseOpen = false;
  private helpOpen = false;

  private readonly handlePauseRequest = () => {
    this.toggle();
  };
  private readonly handlePauseKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' && event.key.toLowerCase() !== 'p') {
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
    if (!this.scene.sys.isActive()) {
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
    if (!this.pauseOpen && !this.helpOpen) {
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
        this.pauseStage.setVisible(false);
        this.helpStage.setVisible(false);
      }
    });

    if (restoreRun && this.host.canRestoreRun()) {
      this.host.setRunFrozen(false);
      this.host.emitFocusMode(false);
    }
  }

  /** Unbind window listeners and close without resuming — scene shutdown. */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mateo:pause-request', this.handlePauseRequest as EventListener);
      window.removeEventListener('keydown', this.handlePauseKeyDown);
    }

    this.close(false);
  }

  private open() {
    if (this.pauseOpen || !this.host.canPause()) {
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
      alpha: 0.98,
      scaleX: 0.98,
      scaleY: 0.98,
      duration: 180,
      ease: 'Back.easeOut'
    });
  }

  private openHelp() {
    if (!this.pauseOpen || this.helpOpen) {
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
        this.pauseStage.setVisible(false);
      }
    });
    this.scene.tweens.add({
      targets: this.helpStage,
      alpha: 0.98,
      scaleX: 0.98,
      scaleY: 0.98,
      duration: 170,
      ease: 'Back.easeOut'
    });
  }

  private closeHelp() {
    if (!this.pauseOpen || !this.helpOpen) {
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
        this.helpStage.setVisible(false);
      }
    });
    this.scene.tweens.add({
      targets: this.pauseStage,
      alpha: 0.98,
      scaleX: 0.98,
      scaleY: 0.98,
      duration: 170,
      ease: 'Back.easeOut'
    });
  }

  private createPauseStage(x: number, y: number) {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0b1117, 0.96);
    panel.lineStyle(2, 0xdce9d6, 0.1);
    panel.fillRoundedRect(-122, -92, 244, 206, 22);
    panel.strokeRoundedRect(-122, -92, 244, 206, 22);
    panel.lineStyle(1, 0xf7fff0, 0.024);
    panel.strokeRoundedRect(-114, -84, 228, 190, 18);
    panel.fillStyle(0xf1ffbe, 0.026);
    panel.fillEllipse(0, -48, 88, 24);

    const title = this.scene.add
      .text(0, -48, PAUSE_TITLE, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '20px',
        color: '#f2ffbe',
        stroke: '#081018',
        strokeThickness: 2,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#03060a', 3, false, true);
    const body = this.scene.add
      .text(0, -8, PAUSE_BODY, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '13px',
        color: '#fff7ec',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 188, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#04070b', 2, false, true);
    const closing = this.scene.add
      .text(0, 28, PAUSE_CLOSING, {
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
    const continueButton = createPanelButton(
      this.scene,
      CONTINUE_BUTTON_LABEL,
      104,
      () => this.close(true),
      '11px'
    );
    const helpButton = createPanelButton(this.scene, HELP_BUTTON_LABEL, 98, () => this.openHelp(), '11px');
    const replayButton = createPanelButton(
      this.scene,
      REPLAY_BUTTON_LABEL,
      98,
      () => {
        this.close(false);
        this.host.replayCurrentStage();
      },
      '11px'
    );
    const homeButton = createPanelButton(
      this.scene,
      HOME_BUTTON_LABEL,
      108,
      () => {
        this.close(false);
        this.host.returnToStart();
      },
      '11px'
    );

    continueButton.setPosition(-56, 76);
    helpButton.setPosition(56, 76);
    replayButton.setPosition(-56, 116);
    homeButton.setPosition(56, 116);

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
    panel.fillRoundedRect(-122, -106, 244, 226, 22);
    panel.strokeRoundedRect(-122, -106, 244, 226, 22);
    panel.lineStyle(1, 0xf7fff0, 0.024);
    panel.strokeRoundedRect(-114, -98, 228, 210, 18);
    panel.fillStyle(0xf1ffbe, 0.026);
    panel.fillEllipse(0, -62, 96, 24);

    const title = this.scene.add
      .text(0, -62, quickHelpContent.title, {
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
    const lead = this.scene.add
      .text(0, -24, quickHelpContent.lead, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '13px',
        color: '#fff8ef',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 188, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#04070b', 2, false, true);
    const lineA = this.scene.add
      .text(0, 16, quickHelpContent.lines[0], {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        color: '#d9e2e8',
        align: 'center',
        wordWrap: { width: 194, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2);
    const lineB = this.scene.add
      .text(0, 54, `${quickHelpContent.lines[1]} ${quickHelpContent.lines[2]}`, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        color: '#d9e2e8',
        align: 'center',
        wordWrap: { width: 194, useAdvancedWrap: true },
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

    backButton.setPosition(0, 104);

    return this.scene.add
      .container(x, y, [panel, title, lead, lineA, lineB, backButton])
      .setDepth(6.73)
      .setAlpha(0)
      .setScale(0.92)
      .setVisible(false);
  }
}
