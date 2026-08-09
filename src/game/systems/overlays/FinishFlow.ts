import Phaser from 'phaser';

import { journeyConfig } from '@/game/content/journeyConfig';
import type { JourneyStageDefinition, JourneyStageKey } from '@/game/content/journeyStages';
import {
  CONTINUE_BODY,
  CONTINUE_CLOSING,
  CONTINUE_TITLE,
  FINISH_CONTINUE_BUTTON_LABEL,
  FINISH_CONTINUING_BODY,
  FINISH_CONTINUING_CLOSING,
  FINISH_FINAL_BODY,
  FINISH_FINAL_CLOSING,
  HOME_BUTTON_LABEL,
  REPLAY_BUTTON_LABEL,
  STAGE_OVERLAY_COPY
} from '@/game/content/overlayText';
import { audioCueBus } from '@/game/services/audio/audioCueBus';
import type { RunnerLoopSnapshot } from '@/game/systems/runner/RunnerLoopSystem';
import { createPanelButton } from '@/ui/panelButton';

const FINISH_REWARD_ZONE_X = 236;
const FINISH_REWARD_ZONE_Y = 332;
const FINISH_INGREDIENT_ZONE_X = FINISH_REWARD_ZONE_X + 36;
const FINISH_INGREDIENT_ZONE_Y = FINISH_REWARD_ZONE_Y + 16;
const FINISH_PANEL_REVEAL_AT = 0.94;
const FINISH_SEQUENCE_SPEED = 1.85;

/**
 * Hero-drive constants. Exported because `JourneyScene.update()` reads the
 * finish sequence every frame to place the hero (see `getSequence()` below) —
 * that per-frame read stays in the scene's hero block by design, so the two
 * reach targets and the contact-beat threshold have to be visible there too.
 */
export const FINISH_HERO_REACH_X = FINISH_INGREDIENT_ZONE_X - 40;
export const FINISH_HERO_REACH_Y = FINISH_REWARD_ZONE_Y + 120;
export const FINISH_CONTACT_BEAT_AT = 0.58;
export const FINISH_POST_CONTACT_FLOAT_RISE = 10;

interface LightMoteOptions {
  count: number;
  spread: number;
  color: number;
  accentColor: number;
  durationMs: number;
  depth: number;
}

/**
 * Scene state/actions FinishFlow must consult or drive but does not own — same
 * pattern as PauseFlowHost/FailFlowHost/DiscoveryFlowHost.
 *
 * The scene keeps: the runner-loop freeze (`victoryFrozen`), the return-home
 * latch, the shark, the hit reaction, the light-mote emitter and every scene
 * transition (continue / replay / home). FinishFlow keeps: the finish objects,
 * the 0→1 sequence clock, the contact beat and the two panels.
 */
export interface FinishFlowHost {
  closePause(): void;
  hideDiscovery(): void;
  haltShark(): void;
  clearHitReaction(): void;
  emitFocusMode(active: boolean): void;
  emitVictoryState(active: boolean): void;
  /** runnerLoop.setFrozen(true) behind the scene's `victoryFrozen` latch. Idempotent. */
  freezeRun(): void;
  /** Scene-owned particle emitter, shared with collect/shark beats. */
  emitLightMotes(x: number, y: number, options: LightMoteOptions): void;
  /** Live hero position — the contact beat sprays motes around the hero. */
  getHeroPosition(): { x: number; y: number };
  /** Blocks replay while a return-home is already queued (scene-owned latch). */
  isReturnHomeQueued(): boolean;
  /** fadeOut + sessionState.restartRun() + scene.start(next) — a scene-level decision. */
  advanceToStage(nextStageKey: JourneyStageKey): void;
  /** fadeOut + sessionState.restartRun() + scene.restart(current) — a scene-level decision. */
  replayCurrentStage(): void;
  returnToStart(): void;
}

/**
 * Finish overlay, extracted verbatim from JourneyScene — the last of the five
 * overlays to leave the scene. Groups the four pieces that always moved
 * together: the note-contact sequence, the finish reward, the finish message
 * panel, and the continuation panel.
 *
 * **Per-frame read contract (load-bearing, preserved exactly).** The finish
 * sequence is a scene-clock-driven 0→1 ramp, not a tween and not derived from
 * the runner loop. `JourneyScene.update()` still drives and samples it in the
 * same order it always did, three calls per frame:
 *
 *   1. `advance(deltaSeconds)` — at the old `finishSequence` advance site,
 *      before any rendering, and only while resolved.
 *   2. `decayPulse(deltaSeconds)` — inside the scene's feedback-decay block,
 *      unconditionally (the pulse also feeds the hero aura, so it decays even
 *      when finish never resolves).
 *   3. `update(time, loopSnapshot)` — at the old `updateFinishObjects()` site,
 *      which is *before* the scene's hero block. That ordering matters: this
 *      call is where `beginVictoryBeat()` fires, so on the frame the level
 *      completes `isResolved()` flips to true between this call and the hero
 *      block, with the sequence still at 0 (reach 0 → no positional jump).
 *
 * The hero block then reads `isResolved()` + `getSequence()` and does its own
 * easing exactly as before. Converting that pull into a push/event is
 * explicitly future work, not part of this extraction.
 *
 * Phaser-coupled end to end (containers/tweens/camera/audio); intentionally
 * not unit-tested — verified with a browser smoke test.
 *
 * ---
 *
 * Pending redesign, carried here verbatim from
 * docs/memory/gameplay-fairness-rules.md § "6. Final-note contact" (that file
 * stays the authoritative copy; `updateFinishObjects` named below is this
 * class's `update()` after the slice-4c extraction):
 *
 * > **Remaining (future animation polish, not done — do not risk the finish
 * > state machine):** the hero still *slides* horizontally to
 * > `FINISH_HERO_REACH_X` to meet the note. A more natural feel would be to
 * > move/absorb the **note into the hero** at the hero's running position
 * > instead of sliding the hero to a fixed point. This is a finish-flow rework
 * > (`updateFinishObjects` + the reach constants) and should be a dedicated
 * > slice with its own validation.
 */
export class FinishFlow {
  private readonly scrim: Phaser.GameObjects.Rectangle;
  private readonly glow: Phaser.GameObjects.Ellipse;
  private readonly ingredient: Phaser.GameObjects.Container;
  private readonly reward: Phaser.GameObjects.Container;
  private readonly message: Phaser.GameObjects.Container;
  private readonly stageContainer: Phaser.GameObjects.Container;
  private readonly continueStage: Phaser.GameObjects.Container;
  private readonly isMoonlight: boolean;

  private pulse = 0;
  private resolved = false;
  private continueResolved = false;
  private sequence = 0;
  private awakeningBeatShown = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stage: JourneyStageDefinition,
    private readonly host: FinishFlowHost
  ) {
    const width = journeyConfig.logicalSize.width;

    // Cool/warm finish tint follows the stage's declared palette family.
    this.isMoonlight = stage.traits.paletteVariant === 'cool';
    this.scrim = scene.add
      .rectangle(width * 0.5, journeyConfig.logicalSize.height * 0.5, width, journeyConfig.logicalSize.height, 0x0a0d12, 0)
      .setDepth(5.8);
    this.glow = scene.add
      .ellipse(width - 20, 192, 128, 248, this.isMoonlight ? 0xcef2ff : 0xf2ffce, 0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(0.6);
    this.ingredient = this.createIngredient(width - 52, 188);
    this.reward = this.createIngredient(width * 0.5, 0).setAlpha(0).setScale(0.9).setDepth(5.5);
    this.message = this.createFinishMessage(0, 0);
    this.stageContainer = scene.add
      .container(width * 0.5, 148, [this.message])
      .setDepth(6.65)
      .setAlpha(0)
      .setScale(0.88);
    this.continueStage = this.createContinueStage(width * 0.5, 148);
  }

  /**
   * Dual-role read: consulted every frame by the hero block, and by ~20
   * unrelated gates across the scene (fail, discovery, pause, shark, guidance,
   * hit reaction, hero texture) — exactly like `FailFlow.isResolved()`.
   */
  isResolved() {
    return this.resolved;
  }

  /** Per-frame read by the scene's hero block to drive reach + celebration float. */
  getSequence() {
    return this.sequence;
  }

  /** Per-frame read by the scene's hero aura, which shares this decaying pulse. */
  getPulse() {
    return this.pulse;
  }

  /** Step 1 of the per-frame contract: advance the sequence clock while resolved. */
  advance(deltaSeconds: number) {
    if (!this.resolved) {
      return;
    }

    this.sequence = Math.min(1, this.sequence + deltaSeconds * FINISH_SEQUENCE_SPEED);
    this.host.freezeRun();
  }

  /** Step 2: decays unconditionally — the hero aura reads it even before finish. */
  decayPulse(deltaSeconds: number) {
    this.pulse = Math.max(0, this.pulse - deltaSeconds * 1.8);
  }

  /** FailFlow.begin() hides the finish preview objects when a run fails first. */
  hidePreview() {
    this.stageContainer.setAlpha(0);
    this.continueStage.setAlpha(0);
    this.ingredient.setAlpha(0);
  }

  /** Step 3: the old `updateFinishObjects()`, unchanged, including its trailing victory trigger. */
  update(time: number, loopSnapshot: RunnerLoopSnapshot, failResolved: boolean) {
    if (failResolved && !this.resolved) {
      this.ingredient.setAlpha(0);
      this.reward.setAlpha(0);
      this.stageContainer.setAlpha(0);
      this.continueStage.setAlpha(0);
      return;
    }

    const hover = Math.sin(time * 0.0042) * 3.6;
    const sequenceEase = Phaser.Math.Easing.Cubic.Out(this.sequence);
    const sequenceBack = Phaser.Math.Easing.Back.Out(this.sequence);
    const previewTravel = Phaser.Math.Easing.Sine.Out(loopSnapshot.finishRevealProgress);
    const ingredientFade = this.resolved
      ? Phaser.Math.Easing.Cubic.In(
          Phaser.Math.Clamp((this.sequence - (FINISH_CONTACT_BEAT_AT + 0.02)) / 0.18, 0, 1)
        )
      : 0;
    const rewardReveal = this.resolved
      ? Phaser.Math.Easing.Cubic.Out(
          Phaser.Math.Clamp((this.sequence - FINISH_CONTACT_BEAT_AT) / 0.24, 0, 1)
        )
      : 0;
    const ingredientAlphaTarget = this.resolved
      ? 0.98 * (1 - ingredientFade)
      : Math.max(loopSnapshot.finishRevealProgress, 0);
    const nextIngredientAlpha = Phaser.Math.Linear(
      this.ingredient.alpha,
      ingredientAlphaTarget,
      this.resolved ? 0.16 : 0.2
    );
    const stageAlphaTarget =
      this.resolved && !this.continueResolved && this.sequence >= FINISH_PANEL_REVEAL_AT
        ? 0.98
        : 0;
    const nextStageAlpha = Phaser.Math.Linear(this.stageContainer.alpha, stageAlphaTarget, 0.12);
    const nextStageScale = Phaser.Math.Linear(
      this.stageContainer.scaleX,
      this.resolved && !this.continueResolved && this.sequence >= FINISH_PANEL_REVEAL_AT
        ? 0.98
        : 0.88,
      0.12
    );
    const continueAlphaTarget = this.resolved && this.continueResolved ? 0.98 : 0;
    const nextContinueAlpha = Phaser.Math.Linear(this.continueStage.alpha, continueAlphaTarget, 0.12);
    const nextContinueScale = Phaser.Math.Linear(
      this.continueStage.scaleX,
      this.resolved && this.continueResolved ? 0.98 : 0.9,
      0.12
    );
    const rewardAlphaTarget = this.resolved ? 0.98 * rewardReveal : 0;
    const nextRewardAlpha = Phaser.Math.Linear(this.reward.alpha, rewardAlphaTarget, 0.14);
    const scrimTarget = this.resolved ? 0.08 : 0;
    const rewardSourceX = Phaser.Math.Linear(FINISH_HERO_REACH_X + 28, FINISH_INGREDIENT_ZONE_X - 8, 0.58);
    const rewardSourceY = Phaser.Math.Linear(FINISH_HERO_REACH_Y - 68, FINISH_INGREDIENT_ZONE_Y + 4, 0.56);
    const ingredientX = this.resolved
      ? Phaser.Math.Linear(this.ingredient.x, FINISH_INGREDIENT_ZONE_X, 0.18)
      : Phaser.Math.Linear(journeyConfig.logicalSize.width + 34, FINISH_INGREDIENT_ZONE_X, previewTravel);
    const ingredientY = this.resolved
      ? Phaser.Math.Linear(this.ingredient.y, FINISH_INGREDIENT_ZONE_Y + hover * 0.34, 0.18)
      : Phaser.Math.Linear(FINISH_INGREDIENT_ZONE_Y + 22, FINISH_INGREDIENT_ZONE_Y, previewTravel) + hover * 0.34;
    const rewardColor = this.isMoonlight ? 0xf4fcff : 0xf7ffec;
    const rewardAccentColor = this.isMoonlight ? 0xc5efff : 0x9fffba;

    this.glow
      .setPosition(
        FINISH_REWARD_ZONE_X + 12,
        Phaser.Math.Linear(FINISH_REWARD_ZONE_Y + 8, FINISH_REWARD_ZONE_Y - 8, rewardReveal)
      )
      .setScale(
        1 + loopSnapshot.finishRevealProgress * 0.14 + rewardReveal * 0.32,
        1 + loopSnapshot.surfaceProgress * 0.1 + rewardReveal * 0.28
      )
      .setFillStyle(
        0xf2ffce,
        0.008 +
          loopSnapshot.surfaceProgress * 0.05 +
          loopSnapshot.finishRevealProgress * 0.07 +
          this.pulse * 0.03 +
          rewardReveal * 0.09
      );

    this.scrim.setAlpha(Phaser.Math.Linear(this.scrim.alpha, scrimTarget, 0.08));

    this.ingredient
      .setPosition(ingredientX, ingredientY)
      .setAlpha(nextIngredientAlpha)
      .setScale(0.84 + loopSnapshot.finishRevealProgress * 0.14 + this.pulse * 0.06 + sequenceBack * 0.08)
      .setRotation(Math.sin(time * 0.0032) * 0.08 - loopSnapshot.finishRevealProgress * 0.04 + sequenceEase * 0.03);

    this.reward
      .setPosition(
        Phaser.Math.Linear(rewardSourceX, FINISH_REWARD_ZONE_X, rewardReveal),
        Phaser.Math.Linear(rewardSourceY, FINISH_REWARD_ZONE_Y, rewardReveal) +
          Math.sin(time * 0.0036) * (0.9 + rewardReveal * 1.1)
      )
      .setAlpha(nextRewardAlpha)
      .setScale(0.72 + rewardReveal * 0.16 + this.pulse * 0.06 + sequenceBack * 0.08)
      .setRotation(Math.sin(time * 0.0031) * 0.02 - rewardReveal * 0.018);

    if (this.resolved && !this.awakeningBeatShown && this.sequence >= FINISH_CONTACT_BEAT_AT) {
      const contactX = rewardSourceX;
      const contactY = rewardSourceY;
      const hero = this.host.getHeroPosition();
      this.awakeningBeatShown = true;
      this.pulse = Math.max(this.pulse, 1.28);
      audioCueBus.emit({
        type: 'awakening_touch',
        intensity: 1.14
      });
      audioCueBus.emit({
        type: 'victory_win',
        intensity: 1.08
      });
      this.scene.cameras.main.flash(
        110,
        this.isMoonlight ? 206 : 220,
        this.isMoonlight ? 242 : 255,
        this.isMoonlight ? 255 : 186,
        false
      );
      this.scene.cameras.main.zoomTo(1.06, 460, 'Cubic.easeOut');
      this.host.emitLightMotes(this.ingredient.x, this.ingredient.y, {
        count: 10,
        spread: 48,
        color: rewardColor,
        accentColor: rewardAccentColor,
        durationMs: 700,
        depth: 5.58
      });
      this.host.emitLightMotes(contactX, contactY, {
        count: 6,
        spread: 24,
        color: 0xfffdf1,
        accentColor: rewardAccentColor,
        durationMs: 520,
        depth: 5.54
      });
      this.host.emitLightMotes(hero.x + 6, hero.y - 42, {
        count: 8,
        spread: 32,
        color: rewardColor,
        accentColor: rewardAccentColor,
        durationMs: 640,
        depth: 5.56
      });
      this.scene.time.delayedCall(180, () => {
        if (!this.scene.scene.isActive() || !this.resolved) {
          return;
        }

        const laterHero = this.host.getHeroPosition();
        this.host.emitLightMotes(laterHero.x + 4, laterHero.y - 38, {
          count: 5,
          spread: 24,
          color: 0xfffdf1,
          accentColor: rewardAccentColor,
          durationMs: 520,
          depth: 5.55
        });
      });
    }

    this.stageContainer
      .setAlpha(nextStageAlpha)
      .setScale(nextStageScale)
      .setPosition(journeyConfig.logicalSize.width * 0.5, 146 - sequenceEase * 4);
    this.continueStage
      .setAlpha(nextContinueAlpha)
      .setScale(nextContinueScale)
      .setPosition(journeyConfig.logicalSize.width * 0.5, 148 - sequenceEase * 4);

    if (loopSnapshot.levelComplete && !this.resolved) {
      this.beginVictoryBeat();
    }
  }

  private beginVictoryBeat() {
    if (this.resolved) {
      return;
    }

    this.host.closePause();
    this.resolved = true;
    this.continueResolved = false;
    this.pulse = 1;
    this.host.clearHitReaction();
    this.host.hideDiscovery();
    this.host.haltShark();
    this.host.emitFocusMode(true);
    this.host.emitVictoryState(true);
    this.host.freezeRun();

    this.scene.children.bringToTop(this.ingredient);
    this.scene.children.bringToTop(this.reward);
    this.scene.children.bringToTop(this.stageContainer);
  }

  private openContinuation() {
    if (!this.resolved || this.continueResolved) {
      return;
    }

    if (this.stage.nextStage) {
      const nextStageKey = this.stage.nextStage;
      this.continueResolved = true;
      this.host.advanceToStage(nextStageKey);
      return;
    }

    this.continueResolved = true;
    this.scene.children.bringToTop(this.continueStage);
  }

  /**
   * Public because the pause panel's Repetir routes here too. Both callers
   * shared one scene method before this extraction, so they keep sharing one
   * guard: `continueResolved` doubles as the double-tap debounce that stops a
   * second restart being queued behind the first.
   */
  requestReplay() {
    if (this.continueResolved || this.host.isReturnHomeQueued()) {
      return;
    }

    this.continueResolved = true;
    this.host.replayCurrentStage();
  }

  private createFinishMessage(x: number, y: number) {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0b1117, 0.95);
    panel.lineStyle(2, 0xdce9d6, 0.1);
    panel.fillRoundedRect(-118, -78, 236, 184, 22);
    panel.strokeRoundedRect(-118, -78, 236, 184, 22);
    panel.lineStyle(1, 0xf7fff0, 0.02);
    panel.strokeRoundedRect(-110, -70, 220, 168, 18);
    panel.fillStyle(0xf1ffbe, 0.03);
    panel.fillEllipse(0, -48, 90, 28);
    panel.fillStyle(0xd8f4df, 0.03);
    panel.fillCircle(-82, -46, 2);
    panel.fillCircle(82, -46, 2);
    panel.lineStyle(2, 0x9ee9b6, 0.06);
    panel.lineBetween(-68, -6, 68, -6);

    const copy = STAGE_OVERLAY_COPY[this.stage.key];
    // Body and closing depend on whether ANOTHER stage follows, not on which
    // stage this is. They used to ride on the moonlight flag, which silently
    // told the player "no hay más niveles" the moment moonlight gained a
    // successor.
    const isFinalStage = !this.stage.nextStage;
    const title = this.scene.add
      .text(0, -48, copy.finishTitle, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '14px',
        color: '#fff8ef',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 192, useAdvancedWrap: true },
        lineSpacing: 2
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#04070b', 2, false, true);
    const label = this.scene.add
      .text(0, -20, copy.finishLabel, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '20px',
        color: '#e9ffaf',
        stroke: '#081018',
        strokeThickness: 2,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#03060a', 3, false, true);
    const body = this.scene.add
      .text(0, 16, isFinalStage ? FINISH_FINAL_BODY : FINISH_CONTINUING_BODY, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '13px',
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
      .text(0, 44, isFinalStage ? FINISH_FINAL_CLOSING : FINISH_CONTINUING_CLOSING, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        color: '#cfe8d9',
        stroke: '#091018',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 188, useAdvancedWrap: true },
        lineSpacing: 3
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#04070b', 2, false, true);
    const continueButton = createPanelButton(
      this.scene,
      FINISH_CONTINUE_BUTTON_LABEL,
      88,
      () => this.openContinuation(),
      '11px'
    );
    const homeButton = createPanelButton(
      this.scene,
      HOME_BUTTON_LABEL,
      118,
      () => this.host.returnToStart(),
      '11px'
    );
    const replayButton = createPanelButton(
      this.scene,
      REPLAY_BUTTON_LABEL,
      94,
      () => this.requestReplay(),
      '11px'
    );

    // Final level: replay + home instead of a misleading continuation CTA.
    if (!this.stage.nextStage) {
      // The unused button must be destroyed: createPanelButton() adds it to the
      // scene at (0,0), so leaving it unparented strands a stray button in the
      // top-left corner for the whole run.
      continueButton.destroy();
      replayButton.setPosition(-54, 86);
      homeButton.setPosition(54, 86);
      return this.scene.add.container(x, y, [
        panel,
        title,
        label,
        body,
        closing,
        replayButton,
        homeButton
      ]);
    }

    // Mid-journey: continue + home. Destroy the unused replay button so it does
    // not linger at the scene origin (see note above).
    replayButton.destroy();
    continueButton.setPosition(-56, 86);
    homeButton.setPosition(54, 86);

    return this.scene.add.container(x, y, [
      panel,
      title,
      label,
      body,
      closing,
      continueButton,
      homeButton
    ]);
  }

  private createContinueStage(x: number, y: number) {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0b1117, 0.95);
    panel.lineStyle(2, 0xdce9d6, 0.1);
    panel.fillRoundedRect(-116, -68, 232, 162, 22);
    panel.strokeRoundedRect(-116, -68, 232, 162, 22);
    panel.lineStyle(1, 0xf7fff0, 0.02);
    panel.strokeRoundedRect(-108, -60, 216, 146, 18);
    panel.fillStyle(0xf1ffbe, 0.026);
    panel.fillEllipse(0, -30, 76, 22);
    panel.fillStyle(0xd8f4df, 0.028);
    panel.fillCircle(-76, -30, 2);
    panel.fillCircle(76, -30, 2);

    const title = this.scene.add
      .text(0, -30, CONTINUE_TITLE, {
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
      .text(0, 6, CONTINUE_BODY, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '13px',
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
      .text(0, 46, CONTINUE_CLOSING, {
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
    const button = createPanelButton(this.scene, HOME_BUTTON_LABEL, 136, () => this.host.returnToStart());

    button.setPosition(0, 86);

    return this.scene.add
      .container(x, y, [panel, title, body, closing, button])
      .setDepth(6.66)
      .setAlpha(0)
      .setScale(0.9);
  }

  /**
   * Which ingredient this stage hands over is declared by the stage, so a new
   * world cannot silently inherit Wounded Planet's Nota Sol.
   */
  private createIngredient(x: number, y: number) {
    switch (this.stage.traits.ingredient) {
      case 'moonlight-shard':
        return this.createMoonlightIngredient(x, y);
      case 'pending-neutral':
        return this.createPendingIngredient(x, y);
      default:
        return this.createWoundedIngredient(x, y);
    }
  }

  /**
   * [PENDIENTE DE RAÚL] Deliberately NOT a designed ingredient.
   *
   * Black Forest's real ingredient (and its Chomper boss, and its closing
   * message) have not been decided. Rather than reuse the Nota Sol and imply
   * the design is finished, this is a neutral warm light: functional, readable,
   * and obviously a placeholder to replace once that decision is made.
   */
  private createPendingIngredient(x: number, y: number) {
    const halo = this.scene.add
      .ellipse(0, 0, 104, 104, 0xdcecd2, 0.16)
      .setBlendMode(Phaser.BlendModes.ADD);
    const haloCore = this.scene.add
      .ellipse(0, 2, 70, 70, 0xf4fbec, 0.2)
      .setBlendMode(Phaser.BlendModes.ADD);
    const shell = this.scene.add
      .ellipse(0, 2, 54, 54, 0x111a15, 0.82)
      .setStrokeStyle(2, 0xd7e8c9, 0.34);
    const core = this.scene.add
      .ellipse(0, 2, 22, 22, 0xf4fbec, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    const spark = this.scene.add
      .ellipse(0, 2, 9, 9, 0xffffff, 0.95);

    return this.scene.add.container(x, y, [halo, haloCore, shell, core, spark]);
  }

  private createWoundedIngredient(x: number, y: number) {
    const trebleGlyph = '\uD834\uDD1E';
    const halo = this.scene.add
      .ellipse(0, 0, 104, 104, 0xeaffc9, 0.18)
      .setBlendMode(Phaser.BlendModes.ADD);
    const haloCore = this.scene.add
      .ellipse(0, 2, 72, 72, 0xfaffef, 0.22)
      .setBlendMode(Phaser.BlendModes.ADD);
    const shellGlow = this.scene.add
      .ellipse(0, 4, 76, 88, 0xdff7d8, 0.14)
      .setBlendMode(Phaser.BlendModes.ADD);
    const paperCore = this.scene.add
      .ellipse(0, 4, 58, 74, 0xf8fff1, 0.98)
      .setStrokeStyle(3, 0x6b8273, 0.18);
    const frame = this.scene.add.graphics();
    frame.lineStyle(2, 0x6a7d72, 0.18);
    frame.strokeEllipse(0, 2, 64, 82);
    frame.lineStyle(2, 0xf6fff3, 0.14);
    frame.strokeEllipse(0, 2, 40, 56);
    const clefAura = this.scene.add
      .text(2, -2, trebleGlyph, {
        fontFamily: '"Noto Sans Symbols 2", "Apple Symbols", "Segoe UI Symbol", Georgia, serif',
        fontSize: '96px',
        color: '#c8ffc9'
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setAlpha(0.22);
    const clefShadow = this.scene.add
      .text(4, 3, trebleGlyph, {
        fontFamily: '"Noto Sans Symbols 2", "Apple Symbols", "Segoe UI Symbol", Georgia, serif',
        fontSize: '88px',
        color: '#0f1517'
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setAlpha(0.34);
    const clef = this.scene.add
      .text(0, -2, trebleGlyph, {
        fontFamily: '"Noto Sans Symbols 2", "Apple Symbols", "Segoe UI Symbol", Georgia, serif',
        fontSize: '90px',
        color: '#ffffff',
        stroke: '#5d7464',
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 2, '#0a1015', 5, false, true);

    const orbitTop = this.scene.add.ellipse(6, -50, 9, 9, 0xf8ffec, 0.94).setStrokeStyle(2, 0x66796c, 0.18);
    const heartCore = this.scene.add.ellipse(-1, 2, 16, 16, 0x97ffae, 0.94).setStrokeStyle(2, 0x466145, 0.26);
    const heartSpark = this.scene.add.ellipse(-1, 2, 7, 7, 0xfffcf0, 0.96);
    const lowerSeed = this.scene.add.ellipse(-2, 21, 8, 8, 0xc8e7ab, 0.86).setStrokeStyle(2, 0x4d6242, 0.18);
    const sideLeafLeft = this.scene.add
      .triangle(-15, -10, -7, 7, 0, -10, 8, 8, 0xe4f2cf, 0.8)
      .setRotation(-0.58)
      .setStrokeStyle(2, 0x586b5e, 0.14);
    const sideLeafRight = this.scene.add
      .triangle(16, 12, -8, 7, 0, -10, 7, 8, 0xe4f2cf, 0.74)
      .setRotation(0.48)
      .setStrokeStyle(2, 0x586b5e, 0.14);
    const sparkleA = this.scene.add.ellipse(24, -16, 4, 4, 0xfff9e8, 0.5);
    const sparkleB = this.scene.add.ellipse(-22, -24, 3, 3, 0xfff9e8, 0.36);
    const sparkleC = this.scene.add.ellipse(-20, 30, 3, 3, 0xf4ffcc, 0.32);

    return this.scene.add
      .container(x, y, [
        halo,
        haloCore,
        shellGlow,
        paperCore,
        frame,
        clefAura,
        clefShadow,
        clef,
        orbitTop,
        heartCore,
        heartSpark,
        lowerSeed,
        sideLeafLeft,
        sideLeafRight,
        sparkleA,
        sparkleB,
        sparkleC
      ])
      .setDepth(6.35)
      .setAlpha(0);
  }

  private createMoonlightIngredient(x: number, y: number) {
    const halo = this.scene.add
      .ellipse(0, 0, 112, 112, 0xd7f5ff, 0.18)
      .setBlendMode(Phaser.BlendModes.ADD);
    const haloCore = this.scene.add
      .ellipse(0, 0, 74, 74, 0xf7fdff, 0.18)
      .setBlendMode(Phaser.BlendModes.ADD);
    const glassAura = this.scene.add
      .ellipse(0, 4, 78, 94, 0xbbe9ff, 0.16)
      .setBlendMode(Phaser.BlendModes.ADD);
    const outerRing = this.scene.add
      .ellipse(0, 4, 62, 78, 0xf6fdff, 0.12)
      .setStrokeStyle(3, 0x69859a, 0.2);

    const prismFrame = this.scene.add.graphics();
    const prismPoints = [
      new Phaser.Geom.Point(0, -36),
      new Phaser.Geom.Point(28, -4),
      new Phaser.Geom.Point(0, 38),
      new Phaser.Geom.Point(-28, -4)
    ];
    prismFrame.fillStyle(0xf7fdff, 0.94);
    prismFrame.fillPoints(prismPoints, true);
    prismFrame.lineStyle(3, 0x69859a, 0.22);
    prismFrame.strokePoints(prismPoints, true, true);
    prismFrame.lineStyle(2, 0xffffff, 0.16);
    prismFrame.strokeLineShape(new Phaser.Geom.Line(0, -34, 0, 30));
    prismFrame.strokeLineShape(new Phaser.Geom.Line(-20, 0, 0, -34));
    prismFrame.strokeLineShape(new Phaser.Geom.Line(20, 0, 0, -34));
    prismFrame.strokeLineShape(new Phaser.Geom.Line(-20, 0, 0, 30));
    prismFrame.strokeLineShape(new Phaser.Geom.Line(20, 0, 0, 30));

    const facetLeft = this.scene.add
      .triangle(-8, 1, -15, -7, 0, -30, -2, 22, 0xd7f4ff, 0.72)
      .setStrokeStyle(2, 0x6f8ca0, 0.18);
    const facetRight = this.scene.add
      .triangle(8, -1, 2, -30, 15, -7, 2, 22, 0xe6fbff, 0.68)
      .setStrokeStyle(2, 0x6f8ca0, 0.18);
    const facetBase = this.scene.add
      .triangle(0, 18, -14, -3, 0, 18, 14, -3, 0xb8dbff, 0.74)
      .setStrokeStyle(2, 0x6f8ca0, 0.14);

    const crescentGlow = this.scene.add
      .ellipse(-14, -18, 30, 30, 0xf7fdff, 0.92)
      .setStrokeStyle(2, 0xa2c8d8, 0.2);
    const crescentCut = this.scene.add.ellipse(-8, -18, 25, 25, 0x0c1320, 0.82);
    const prismStarGlow = this.scene.add
      .ellipse(20, -22, 22, 22, 0xf7fdff, 0.12)
      .setBlendMode(Phaser.BlendModes.ADD);
    const prismStar = this.scene.add.star(20, -22, 4, 3, 10, 0xffffff, 0.92).setAngle(45);
    const lowerSeed = this.scene.add
      .ellipse(1, 22, 10, 16, 0xbfe9ff, 0.88)
      .setStrokeStyle(2, 0x53718a, 0.18);
    const shimmerA = this.scene.add.ellipse(26, 18, 4, 4, 0xf8ffff, 0.46);
    const shimmerB = this.scene.add.ellipse(-24, 28, 3, 3, 0xe8fbff, 0.34);
    const shimmerC = this.scene.add.ellipse(-20, -28, 3, 3, 0xf8ffff, 0.36);

    return this.scene.add
      .container(x, y, [
        halo,
        haloCore,
        glassAura,
        outerRing,
        prismFrame,
        facetLeft,
        facetRight,
        facetBase,
        crescentGlow,
        crescentCut,
        prismStarGlow,
        prismStar,
        lowerSeed,
        shimmerA,
        shimmerB,
        shimmerC
      ])
      .setDepth(6.35)
      .setAlpha(0);
  }
}
