import Phaser from 'phaser';

import { journeyStages, type JourneyStageDefinition, type JourneyStageKey } from '@/game/content/journeyStages';
import { journeyConfig } from '@/game/content/journeyConfig';
import {
  CHARACTER_RENDER_ORIGIN,
  getCharacter,
  getFootOffsetPx,
  getGameplayScale,
  type PlayableCharacter
} from '@/game/content/playableCharacters';
import { runnerConfig } from '@/game/content/runnerConfig';
import { audioCueBus } from '@/game/services/audio/audioCueBus';
import { localPreferenceStore } from '@/game/services/persistence/localPreferenceStore';
import { localProgressStore } from '@/game/services/persistence/localProgressStore';
import { runTelemetryStore } from '@/game/services/telemetry/runTelemetryStore';
import { sessionState } from '@/game/state/sessionState';
import { BackdropRenderer } from '@/game/systems/backdrop/BackdropRenderer';
import { CarlitosHeartbeat } from '@/game/systems/character/CarlitosHeartbeat';
import { CharacterAnimator } from '@/game/systems/character/CharacterAnimator';
import { EmotionController } from '@/game/systems/emotion/EmotionController';
import { GuidanceDirector } from '@/game/systems/guidance/GuidanceDirector';
import { DiscoveryFlow } from '@/game/systems/overlays/DiscoveryFlow';
import { FailFlow } from '@/game/systems/overlays/FailFlow';
import {
  FINISH_CONTACT_BEAT_AT,
  FINISH_HERO_REACH_X,
  FINISH_HERO_REACH_Y,
  FINISH_POST_CONTACT_FLOAT_RISE,
  FinishFlow
} from '@/game/systems/overlays/FinishFlow';
import { PauseFlow } from '@/game/systems/overlays/PauseFlow';
import { RunnerLoopSystem, type RunnerLoopSnapshot } from '@/game/systems/runner/RunnerLoopSystem';
import { prefersReducedMotion } from '@/ui/reducedMotion';

const SHARK_TEXTURE_KEY = 'shark-friend';
/**
 * Where the shark waits between fly-bys. Parking it off-screen on every hide
 * means that even if something ever shows it out of turn, it cannot appear on
 * top of the play area.
 */
const SHARK_PARK_X = -180;
const SHARK_PARK_Y = 210;
/** Readable fade-out after it has given its air, instead of vanishing. */
const SHARK_EXIT_MS = 260;
const SHARK_EXIT_REDUCED_MS = 120;
const DEBUG_DECORATIVE_FAMILIES = ['backdrop', 'ground-markers', 'shark-friend'] as const;
const MOONLIGHT_OPPORTUNITY_LINE = 'Queda una oportunidad.';
const MOONLIGHT_OPPORTUNITY_PULSE = 0.46;
const FIRST_HIT_REACTION = 'Ay!!';
const SECOND_HIT_REACTION = 'Ñó!!!';
const SHARK_PULSE_RESTORE = 0.32;
const SUPPORTIVE_LINES = [
  'Sigue subiendo.',
  'Lo va despertando.',
  'Hay camino.'
] as const;
const SHARK_LINES = ['Respira.', 'Arriba.', 'Toma aire.'] as const;
const HERO_FOOTING_VISUAL_OFFSET_Y = 4;
/**
 * The runner's contract for "where the floor is": a grounded hero's support
 * point sits this far below `heroY`. `RunnerLoopSystem` uses the same value for
 * platform support, so matching it lands the drawing on ground AND on ledges.
 */
const HERO_SUPPORT_OFFSET_PX = runnerConfig.visual.groundLineY - runnerConfig.hero.runY;
/** How far a grounded character's visible feet may drift from its support. */
const GROUNDED_FOOT_TOLERANCE_PX = 3;
/**
 * The run cycle is now authored art (contact/pass/push), so the procedural
 * bob is scaled down while it plays to avoid stacking two bounces. It is a
 * VISUAL amplitude only — the runner's physics, hitbox and timing are
 * untouched. Set back to 1 to restore the pre-animation feel exactly.
 */
const RUN_CYCLE_BOB_SCALE = 0.55;

export class JourneyScene extends Phaser.Scene {
  private readonly showDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1';
  private readonly emotionController = new EmotionController();
  private readonly feedback = {
    collect: 0,
    chain: 0,
    impact: 0,
    awakening: 0
  };
  private stageKey: JourneyStageKey = 'wounded-planet';
  private stage: JourneyStageDefinition = journeyStages['wounded-planet'];
  /** Resolved once per `create()` from the saved preference; drives poses + scale only. */
  private character: PlayableCharacter = getCharacter(undefined);

  private backdropRenderer!: BackdropRenderer;
  private heroShadow!: Phaser.GameObjects.Ellipse;
  private heroAura!: Phaser.GameObjects.Ellipse;
  /**
   * A Sprite (not an Image) purely so `Phaser.Animations` can drive the run
   * cycle. Position, origin, depth, alpha, scale and rotation are still owned
   * and written by this scene exactly as before.
   */
  private hero!: Phaser.GameObjects.Sprite;
  private heroAnimator!: CharacterAnimator;
  private carlitosHeartbeat!: CarlitosHeartbeat;
  private hitReaction!: Phaser.GameObjects.Container;
  private hitReactionText!: Phaser.GameObjects.Text;
  private pauseFlow!: PauseFlow;
  private discoveryFlow!: DiscoveryFlow;
  private failFlow!: FailFlow;
  private finishFlow!: FinishFlow;
  private runnerLoop!: RunnerLoopSystem;
  private shark!: Phaser.GameObjects.Container;
  private sharkShadow!: Phaser.GameObjects.Ellipse;
  private debugGraphics?: Phaser.GameObjects.Graphics;

  private baseHeroScale = 1;
  /**
   * Per-character VISUAL correction only, derived from measured art metrics —
   * never a hand-tuned constant, and never applied to physics. It aligns the
   * drawing's visible feet with the support point the runner already uses.
   */
  private heroFootingOffsetY = 0;
  private heroRenderScaleX = 1;
  private heroRenderScaleY = 1;
  private lastDebugEmit = 0;
  private victoryFrozen = false;
  private returnHomeQueued = false;
  private hitReactionTimer = 0;
  private hitReactionDuration = 0.56;
  private hitReactionStrength = 0;
  private sharkBurst = 0;
  private sharkCooldown = 3.8;
  private sharkDuration = 1.9;
  private sharkProgress = 0;
  private sharkBaseY = 210;
  /**
   * Explicit, tiny lifecycle for Tiburoncín:
   *   hidden -> flying -> (contact) exiting -> hidden
   *
   * It exists because the old boolean pair let the container be made visible
   * before it had been positioned, so the first visible frame rendered at
   * whatever transform its previous fly-by left behind — a one-frame flash,
   * usually right where the player was standing.
   */
  private sharkPhase: 'hidden' | 'flying' | 'exiting' = 'hidden';
  private sharkTagged = false;
  private sharkExitTween?: Phaser.Tweens.Tween;
  // Grace to apply when the first shark-rescue discovery beat resolves, so it
  // starts after the run resumes rather than being spent while time is frozen.
  private pendingSharkGrace = 0;
  private lastGuidanceAt = -9999;
  private guidanceIndex = 0;
  private sharkGuidanceIndex = 0;
  private lastSeenPhraseId = '';
  private readonly guidance = new GuidanceDirector();
  private offAudioCue?: () => void;
  private moonlightOpportunityAvailable = false;

  constructor() {
    super('journey');
  }

  init(data?: { stage?: JourneyStageKey }) {
    this.stageKey = data?.stage ?? 'wounded-planet';
    this.stage = journeyStages[this.stageKey] ?? journeyStages['wounded-planet'];
  }

  create() {
    // Ensure camera starts clean after scene.restart() —
    // previous fadeOut may leave residual alpha on the new camera.
    this.cameras.main.resetFX();

    const heroY = runnerConfig.hero.runY;
    const heroX = runnerConfig.hero.screenX;
    const width = journeyConfig.logicalSize.width;

    // Re-read the preference on every create() so a pick made on the entry
    // screen applies to this run (and survives scene.restart()).
    this.character = getCharacter(localPreferenceStore.loadCharacterId());

    this.victoryFrozen = false;
    this.returnHomeQueued = false;
    this.hitReactionTimer = 0;
    this.hitReactionStrength = 0;
    this.sharkBurst = 0;
    this.sharkCooldown = 3.8;
    this.sharkPhase = 'hidden';
    this.sharkTagged = false;
    this.sharkExitTween = undefined;
    this.sharkProgress = 0;
    this.pendingSharkGrace = 0;
    this.lastGuidanceAt = -9999;
    this.guidanceIndex = 0;
    this.sharkGuidanceIndex = 0;
    this.lastSeenPhraseId = '';
    this.guidance.reset();
    this.moonlightOpportunityAvailable = this.stage.backdropKind === 'moonlight-mountain';

    this.emitVictoryState(false);
    this.emitFocusMode(false);
    this.emitUiScreen('playing');
    this.backdropRenderer = new BackdropRenderer(
      this,
      this.stage.backdropKind,
      sessionState.snapshot().displayLevel
    );
    this.heroShadow = this.add
      .ellipse(heroX, runnerConfig.visual.groundLineY + 8, 112, 22, 0x120b14, 0.18)
      .setDepth(1);
    this.heroAura = this.add
      .ellipse(heroX - 8, heroY + 10, 110, 66, 0xa4ff68, 0.035)
      .setDepth(2)
      .setVisible(false);

    this.hero = this.add
      .sprite(heroX, heroY, this.character.poses.main.key)
      .setOrigin(CHARACTER_RENDER_ORIGIN.x, CHARACTER_RENDER_ORIGIN.y)
      .setDepth(5);
    this.heroAnimator = new CharacterAnimator(this, this.hero, this.character);
    this.carlitosHeartbeat = new CarlitosHeartbeat(this);
    const hitReaction = this.createHitReaction();
    this.hitReaction = hitReaction.container;
    this.hitReactionText = hitReaction.text;

    this.baseHeroScale = getGameplayScale(this.character);
    // Pack-v2 canvases carry ~85px of transparent padding under the character,
    // so the drawing's feet stop well short of the support point while Carlitos'
    // full-bleed canvas reached it. This closes exactly that gap.
    this.heroFootingOffsetY =
      HERO_SUPPORT_OFFSET_PX -
      HERO_FOOTING_VISUAL_OFFSET_Y -
      getFootOffsetPx(this.character, CHARACTER_RENDER_ORIGIN.y);
    this.heroRenderScaleX = this.baseHeroScale;
    this.heroRenderScaleY = this.baseHeroScale;
    this.hero.setScale(this.baseHeroScale);
    this.finishFlow = new FinishFlow(this, this.stage, {
      closePause: () => this.pauseFlow.close(false),
      hideDiscovery: () => this.discoveryFlow.hide(),
      haltShark: () => this.haltSharkEvent(),
      clearHitReaction: () => {
        this.hitReactionTimer = 0;
        this.heroAnimator.clearTransient();
      },
      emitFocusMode: (active) => this.emitFocusMode(active),
      emitVictoryState: (active) => this.emitVictoryState(active),
      freezeRun: () => {
        if (this.victoryFrozen) {
          return;
        }

        this.runnerLoop.setFrozen(true);
        this.victoryFrozen = true;
      },
      emitLightMotes: (x, y, options) => this.emitLightMotes(x, y, options),
      getHeroPosition: () => ({ x: this.hero.x, y: this.hero.y }),
      isReturnHomeQueued: () => this.returnHomeQueued,
      advanceToStage: (nextStageKey) => {
        this.emitFocusMode(false);
        this.emitVictoryState(false);
        this.emitUiScreen('chapter');
        this.cameras.main.fadeOut(220, 9, 16, 26);
        this.time.delayedCall(220, () => {
          sessionState.restartRun();
          this.scene.start(this.scene.manager.keys['level-entry'] ? 'level-entry' : 'journey', {
            stage: nextStageKey
          });
        });
      },
      replayCurrentStage: () => {
        this.emitFocusMode(false);
        this.emitVictoryState(false);
        this.cameras.main.fadeOut(220, 9, 16, 26);
        this.time.delayedCall(220, () => {
          sessionState.restartRun();
          this.scene.restart({ stage: this.stageKey });
        });
      },
      returnToStart: () => this.returnToStart()
    });
    this.discoveryFlow = new DiscoveryFlow(this, {
      canShow: () => !this.failFlow.isResolved() && !this.finishFlow.isResolved(),
      setRunFrozen: (frozen) => this.runnerLoop.setFrozen(frozen),
      emitFocusMode: (active) => this.emitFocusMode(active),
      emitGuidanceLine: (text, durationMs, time) => this.emitGuidanceLine(text, durationMs, time),
      markGuidanceMoment: (time) => {
        this.lastGuidanceAt = time;
      },
      resumeIfAllowed: () => {
        if (this.failFlow.isResolved() || this.finishFlow.isResolved() || this.victoryFrozen) {
          return;
        }

        this.runnerLoop.setFrozen(false);
        this.emitFocusMode(false);

        // Start any deferred shark-rescue grace now that the run has resumed,
        // so the grace window is felt in play rather than ticking down while frozen.
        if (this.pendingSharkGrace > 0) {
          this.runnerLoop.grantGrace(this.pendingSharkGrace);
          this.pendingSharkGrace = 0;
        }
      },
      returnToStart: () => this.returnToStart()
    });
    this.pauseFlow = new PauseFlow(this, {
      canPause: () => !this.failFlow.isResolved() && !this.finishFlow.isResolved() && !this.returnHomeQueued,
      isDiscoveryBeatActive: () => this.discoveryFlow.isActive(),
      canRestoreRun: () =>
        !this.failFlow.isResolved() && !this.finishFlow.isResolved() && !this.discoveryFlow.isActive(),
      setRunFrozen: (frozen) => this.runnerLoop.setFrozen(frozen),
      haltShark: () => this.haltSharkEvent(),
      emitFocusMode: (active) => this.emitFocusMode(active),
      replayCurrentStage: () => this.finishFlow.requestReplay(),
      returnToStart: () => this.returnToStart()
    });
    this.failFlow = new FailFlow(this, this.stage.backdropKind === 'moonlight-mountain', this.showDebug, {
      canFail: () => !this.finishFlow.isResolved(),
      closePause: () => this.pauseFlow.close(false),
      hideDiscovery: () => this.discoveryFlow.hide(),
      hideFinishPreview: () => this.finishFlow.hidePreview(),
      haltShark: () => this.haltSharkEvent(),
      emitFocusMode: (active) => this.emitFocusMode(active),
      clearHitReaction: () => {
        this.hitReactionTimer = 0;
        this.heroAnimator.clearTransient();
      },
      restartRun: () => {
        this.emitFocusMode(false);
        sessionState.restartRun();
        this.scene.restart({ stage: this.stageKey });
      },
      returnToStart: () => this.returnToStart()
    });
    this.sharkShadow = this.add
      .ellipse(SHARK_PARK_X, runnerConfig.visual.groundLineY - 44, 58, 12, 0x09080d, 0.1)
      .setDepth(4.45)
      .setAlpha(0)
      .setVisible(false);
    this.shark = this.createShark();
    this.debugGraphics = this.showDebug ? this.add.graphics().setDepth(6.8) : undefined;

    runTelemetryStore.beginRun();
    this.runnerLoop = new RunnerLoopSystem(this, this.showDebug, this.stage);
    this.bindAudioFeedback();
    this.backdropRenderer.renderInitial(this.time.now);

    if (this.stage.introGuidance && this.guidance.showOnce('stage_intro')) {
      this.time.delayedCall(420, () => {
        if (!this.failFlow.isResolved() && !this.finishFlow.isResolved()) {
          this.emitGuidanceLine(this.stage.introGuidance!, 2100, this.time.now);
        }
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  update(time: number, delta: number) {
    const deltaSeconds = delta / 1000;

    // Pause is a hard freeze: skip ALL gameplay and animated systems so the
    // runner, backdrop, shark, and finish sequence stop together behind the
    // overlay. Overlay tweens run on the tween manager, so the panel still
    // animates; resuming simply continues from the frozen frame.
    if (this.pauseFlow.isOpen()) {
      // Animations run on the animation manager, not on this update, so the
      // run cycle has to be told to hold still behind the pause panel.
      this.heroAnimator.setPaused(true);
      return;
    }

    sessionState.coolDown(deltaSeconds);

    const snapshot = sessionState.snapshot();
    const mood = this.emotionController.getMood(snapshot.displayLevel);
    runTelemetryStore.samplePulse(snapshot.currentPulse, deltaSeconds);

    this.runnerLoop.update(deltaSeconds, time, mood, snapshot.displayLevel);
    const loopSnapshot = this.runnerLoop.snapshot();

    if (loopSnapshot.runFailed && !this.failFlow.isResolved() && !this.finishFlow.isResolved()) {
      if (!this.tryMoonlightOpportunity()) {
        this.failFlow.begin();
      }
    }

    // Step 1 of the finish per-frame contract: advance the sequence clock (and
    // latch the victory freeze) before anything reads it this frame.
    this.finishFlow.advance(deltaSeconds);

    this.feedback.collect = Math.max(0, this.feedback.collect - deltaSeconds * 3);
    this.feedback.chain = Math.max(0, this.feedback.chain - deltaSeconds * 1.6);
    this.feedback.impact = Math.max(0, this.feedback.impact - deltaSeconds * 2.4);
    this.feedback.awakening = Math.max(0, this.feedback.awakening - deltaSeconds * 1.5);
    this.finishFlow.decayPulse(deltaSeconds);
    this.hitReactionTimer = Math.max(0, this.hitReactionTimer - deltaSeconds);
    this.sharkBurst = Math.max(0, this.sharkBurst - deltaSeconds * 2.8);

    const emotionalLevel = Phaser.Math.Clamp(
      snapshot.displayLevel + this.feedback.chain * 0.08 + this.feedback.awakening * 0.06,
      0,
      1
    );
    const environmentLevel = Phaser.Math.Clamp(
      emotionalLevel * 0.66 + loopSnapshot.surfaceProgress * 0.42 + loopSnapshot.finishRevealProgress * 0.08,
      0,
      1
    );
    const renderMood = this.emotionController.getMood(environmentLevel);

    this.backdropRenderer.update(deltaSeconds, time, {
      distanceTravelled: loopSnapshot.distanceTravelled,
      surfaceProgress: loopSnapshot.surfaceProgress,
      finishRevealProgress: loopSnapshot.finishRevealProgress,
      environmentLevel,
      collectFeedback: this.feedback.collect,
      chainFeedback: this.feedback.chain,
      awakeningFeedback: this.feedback.awakening
    });

    if (!this.failFlow.isResolved() && !this.finishFlow.isResolved() && !this.discoveryFlow.isActive()) {
      this.updateSharkEvent(time, deltaSeconds, loopSnapshot);
      this.updateGuidanceMoments(time, loopSnapshot);
      this.updateDoubleJumpHint(time, loopSnapshot);
    }

    // Step 3 of the finish per-frame contract: this call renders the finish
    // objects AND is where beginVictoryBeat() fires, so it must stay ahead of
    // the hero block below, which reads the resulting state in the same frame.
    this.finishFlow.update(time, loopSnapshot, this.failFlow.isResolved());
    this.failFlow.update();

    // Pose/animation selection sits exactly where the old texture switcher did
    // — after finish resolves this frame, before the hero block reads it.
    this.heroAnimator.update(deltaSeconds, loopSnapshot, this.finishFlow.isResolved());

    // Damped while the authored run cycle plays so the drawn bounce and the
    // procedural bob do not stack into a double bounce. Visual only.
    const runBob = loopSnapshot.grounded
      ? Math.sin(loopSnapshot.distanceTravelled * 0.095) *
        (2 + snapshot.displayLevel * 3.6) *
        (this.heroAnimator.isRunCycleActive() ? RUN_CYCLE_BOB_SCALE : 1)
      : 0;
    const breath = Math.sin(time * 0.0022 + snapshot.displayLevel * 2.8) * 0.012;
    const driftLift = loopSnapshot.grounded ? 0 : Math.sin(time * 0.0021) * 1.4;
    const squeeze =
      (loopSnapshot.grounded ? 1 : 0.18) * Math.sin(time * 0.0031) * 0.018 +
      loopSnapshot.collectBurst * 0.02;
    const liftTilt = Phaser.Math.Clamp(loopSnapshot.velocityY / 620, -0.18, 0.14);
    const impactDrop = loopSnapshot.staggerAmount * 16 + this.feedback.impact * 10;
    const rise = loopSnapshot.collectBurst * 8 + this.feedback.chain * 6;
    const landingSquash = loopSnapshot.landingBurst * 0.10;
    // Per-frame pull of the finish sequence, unchanged: the hero block owns
    // this easing and samples FinishFlow's clock directly, same as when both
    // lived on the scene. Turning it into an event is deliberate future work.
    const finishResolved = this.finishFlow.isResolved();
    const finishSequence = this.finishFlow.getSequence();
    const finishReach = finishResolved
      ? Phaser.Math.Easing.Cubic.Out(
          Phaser.Math.Clamp((finishSequence - 0.16) / 0.4, 0, 1)
        )
      : 0;
    const finishFloatProgress = finishResolved
      ? Phaser.Math.Easing.Sine.Out(
          Phaser.Math.Clamp((finishSequence - FINISH_CONTACT_BEAT_AT) / 0.18, 0, 1)
        )
      : 0;
    // The hero now glides cleanly to the note and touches it before any
    // celebration. The previous pre-contact hop (a sine bounce peaking near
    // mid-sequence, just before the contact beat) read as an awkward jump; the
    // gentle post-contact float below carries the "awakening" rise instead.
    const victoryBounce = 0;
    const heroScale =
      this.baseHeroScale *
      renderMood.heroScale *
      (1 + loopSnapshot.collectBurst * 0.02 + this.feedback.awakening * 0.02 - this.feedback.impact * 0.018);
    const unclampedScaleX =
      heroScale *
      (1 + breath * 0.45 + squeeze * 0.24 + landingSquash * 0.1 - this.sharkBurst * 0.02);
    const unclampedScaleY =
      heroScale *
      (1 - breath * 0.3 - squeeze * 0.16 - landingSquash * 0.26 + this.sharkBurst * 0.04);
    const targetScaleX = Phaser.Math.Clamp(unclampedScaleX, heroScale * 0.97, heroScale * 1.05);
    const targetScaleY = Phaser.Math.Clamp(unclampedScaleY, heroScale * 0.94, heroScale * 1.03);

    this.heroRenderScaleX = Phaser.Math.Linear(this.heroRenderScaleX, targetScaleX, 0.16);
    this.heroRenderScaleY = Phaser.Math.Linear(this.heroRenderScaleY, targetScaleY, 0.16);

    const heroBaseX = loopSnapshot.heroX - this.feedback.impact * 6 - this.sharkBurst * 3;
    const heroRawY =
      loopSnapshot.heroY +
      runBob +
      impactDrop -
      rise +
      landingSquash * 6 +
      driftLift -
      loopSnapshot.surfaceProgress * 6 -
      victoryBounce +
      HERO_FOOTING_VISUAL_OFFSET_Y +
      this.heroFootingOffsetY;
    // Keep the drawing's feet on whatever it is standing on. The collect lift
    // and hit drop still move the body, but while grounded they may not carry
    // it off the floor (or sink it into one) by more than the tolerance —
    // together with `heroFootingOffsetY` this is what stops the "floating
    // Devilz" read. Airborne frames and the finish lift are untouched.
    const heroBaseY = heroRawY + this.groundedFootCorrection(heroRawY, loopSnapshot, finishResolved);
    // Scale the whole celebration float by finishFloatProgress so the gentle
    // post-contact drift eases in from zero. Previously the sin/cos terms were
    // already at full amplitude the instant the contact beat began, which read
    // as a small snap/hop; now the hero touches the note and rises smoothly.
    const celebrationFloatX = finishFloatProgress * Math.sin(time * 0.0032) * 2.2;
    const celebrationFloatY =
      finishFloatProgress *
      (Math.sin(time * 0.0041) * 2.8 + Math.cos(time * 0.0026) * 1.6 - FINISH_POST_CONTACT_FLOAT_RISE);
    const heroDisplayX = finishResolved
      ? Phaser.Math.Linear(heroBaseX, FINISH_HERO_REACH_X, finishReach) + celebrationFloatX
      : heroBaseX;
    const heroDisplayY = finishResolved
      ? Phaser.Math.Linear(heroBaseY, FINISH_HERO_REACH_Y - victoryBounce * 0.35, finishReach) + celebrationFloatY
      : heroBaseY;

    this.hero.setPosition(heroDisplayX, heroDisplayY).setScale(this.heroRenderScaleX, this.heroRenderScaleY);

    // Subtle i-frame blink during the grace window so the player can read that
    // they are briefly safe after a hit/recovery. Never during finish/fail.
    const inGraceWindow =
      !finishResolved && !this.failFlow.isResolved() && loopSnapshot.invulnerabilitySeconds > 0;
    this.hero.setAlpha(inGraceWindow ? 0.6 + 0.4 * Math.abs(Math.sin(time * 0.022)) : 1);

    this.hero.rotation = Phaser.Math.Linear(
      this.hero.rotation,
      renderMood.baseRotation +
        0.04 +
        liftTilt +
        this.feedback.chain * 0.02 +
        this.feedback.impact * 0.08 +
        this.sharkBurst * 0.05 +
        finishFloatProgress * 0.04 +
        Math.sin(time * 0.0031) * 0.018 * finishFloatProgress,
      0.18
    );

    // Purely transient now. The two steady terms that used to sit in here
    // (`auraAlpha * 0.22` and `surfaceProgress * 0.05`) never reached zero, so
    // the character carried a permanent ellipse around it for the whole run.
    // Collect / chain / awakening / finish still flash exactly as before, and
    // the aura is hidden outright once they decay so no static ellipse is left.
    const auraAlpha =
      this.feedback.collect * 0.04 +
      this.feedback.chain * 0.05 +
      this.feedback.awakening * 0.05 +
      this.finishFlow.getPulse() * 0.08;

    this.heroAura.setVisible(auraAlpha > 0.004);

    if (this.heroAura.visible) {
      this.heroAura
        .setPosition(this.hero.x - 8, this.hero.y + 8)
        .setScale(
          (renderMood.auraSize / 122) *
            (1 + this.feedback.chain * 0.12 + loopSnapshot.collectBurst * 0.05 + loopSnapshot.finishRevealProgress * 0.14),
          0.7 + environmentLevel * 0.18 + this.feedback.awakening * 0.06
        )
        .setRotation(this.hero.rotation * 0.35)
        .setFillStyle(renderMood.auraColor, auraAlpha);
    }

    this.heroShadow
      .setPosition(this.hero.x - 6, runnerConfig.visual.groundLineY + 7)
      .setFillStyle(
        renderMood.shadowColor,
        renderMood.shadowAlpha + this.feedback.impact * 0.06 - finishFloatProgress * 0.08
      )
      .setScale(
        renderMood.shadowScaleX +
          this.feedback.impact * 0.18 -
          Phaser.Math.Clamp((runnerConfig.hero.runY - loopSnapshot.heroY) / 180, 0, 0.22) +
          landingSquash * 0.2 -
          finishFloatProgress * 0.12,
        1
      );

    this.updateHitReaction();

    // "El Latido de Carlitos": a read-only mirror of the reserve the runner
    // already tracks. It never grants or consumes anything.
    this.carlitosHeartbeat.update(
      this.hero.x,
      this.hero.y,
      time,
      snapshot.recoveryChances > 0 && !finishResolved && !this.failFlow.isResolved()
    );

    if (this.showDebug) {
      this.renderDebugOverlay(loopSnapshot, time);
    }
  }

  private bindAudioFeedback() {
    this.offAudioCue = audioCueBus.subscribe((event) => {
      if (event.type === 'spark_collect') {
        this.feedback.collect = Math.max(this.feedback.collect, Math.min(1, event.intensity * 0.5));

        if (this.guidance.showOnce('notes_intro')) {
          this.discoveryFlow.trigger('notes_intro', this.time.now);
        }
      }

      if (event.type === 'chain_success') {
        this.feedback.chain = Math.max(this.feedback.chain, Math.min(1, event.intensity * 0.22));

        if (
          this.stage.beatGuidance &&
          !this.failFlow.isResolved() &&
          !this.finishFlow.isResolved() &&
          this.guidance.showOnce('stage_beat')
        ) {
          this.emitGuidanceLine(this.stage.beatGuidance, 1800, this.time.now);
        }
      }

      if (event.type === 'pulse_drop') {
        this.feedback.impact = Math.max(this.feedback.impact, Math.min(1, event.intensity * 0.32));
        this.cameras.main.shake(90, 0.0032, true);

        const state = sessionState.snapshot();
        const runFailed = this.runnerLoop.snapshot().runFailed;

        if (!runFailed && !this.failFlow.isResolved() && !this.finishFlow.isResolved()) {
          if (state.currentPulse <= runnerConfig.obstacle.pulseLoss + 0.03) {
            this.showHitReaction(SECOND_HIT_REACTION, 1);
          } else {
            this.showHitReaction(FIRST_HIT_REACTION, 0);
          }
        }

        if (!runFailed && this.guidance.showOnce('hazard_intro')) {
          this.discoveryFlow.trigger('hazard_intro', this.time.now);
        }
      }

      if (event.type === 'awakening_gain') {
        this.feedback.awakening = Math.max(
          this.feedback.awakening,
          Math.min(1, event.intensity * 0.18)
        );
      }

      if (event.type === 'reserve_fill') {
        this.feedback.collect = Math.max(this.feedback.collect, 0.34);
        this.feedback.awakening = Math.max(this.feedback.awakening, 0.24);
        this.carlitosHeartbeat.onReserveFilled();

        if (!this.failFlow.isResolved() && !this.finishFlow.isResolved()) {
          if (this.guidance.showOnce('reserve_gain')) {
            this.discoveryFlow.trigger('reserve_gain', this.time.now);
          } else {
            this.emitGuidanceLine('Reserva lista.', 2000, this.time.now);
          }
        }
      }

      if (event.type === 'reserve_spent') {
        this.feedback.collect = Math.max(this.feedback.collect, 0.26);
        this.feedback.awakening = Math.max(this.feedback.awakening, 0.14);
        this.carlitosHeartbeat.onReserveSpent(this.hero.x, this.hero.y);

        if (!this.failFlow.isResolved() && !this.finishFlow.isResolved() && this.guidance.showOnce('reserve_spent')) {
          this.discoveryFlow.trigger('reserve_spent', this.time.now);
        }
      }
    });
  }

  private handleShutdown() {
    this.pauseFlow.destroy();
    this.discoveryFlow.hide();
    this.carlitosHeartbeat?.destroy();
    // Kill the exit fade and park the shark so a restarted scene can never
    // inherit an in-flight tween or an on-screen transform.
    this.hideShark();
    this.emitVictoryState(false);
    this.emitFocusMode(false);
    this.offAudioCue?.();
    this.runnerLoop?.destroy();
  }

  private createHitReaction() {
    const bubble = this.add.graphics();
    bubble.fillStyle(0x121920, 0.96);
    bubble.lineStyle(2, 0xf1eadb, 0.18);
    bubble.fillRoundedRect(-34, -20, 68, 30, 14);
    bubble.strokeRoundedRect(-34, -20, 68, 30, 14);
    bubble.fillStyle(0x121920, 0.96);
    bubble.fillTriangle(-2, 10, 8, 10, 4, 21);
    bubble.lineStyle(2, 0xf1eadb, 0.12);
    bubble.strokePoints(
      [
        new Phaser.Geom.Point(-2, 10),
        new Phaser.Geom.Point(4, 21),
        new Phaser.Geom.Point(8, 10)
      ],
      true,
      true
    );
    bubble.fillStyle(0xf4ffd8, 0.035);
    bubble.fillRoundedRect(-22, -13, 30, 7, 6);

    const text = this.add
      .text(0, -5, FIRST_HIT_REACTION, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
        color: '#fff8ee',
        stroke: '#091018',
        strokeThickness: 2,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setShadow(0, 1, '#05080b', 2, false, true);

    return {
      container: this.add.container(0, 0, [bubble, text]).setDepth(6.2).setAlpha(0).setVisible(false),
      text
    };
  }

  private createShark() {
    const glow = this.add
      .ellipse(0, 2, 92, 66, 0xd9f1dc, 0.032)
      .setBlendMode(Phaser.BlendModes.ADD);
    const shark = this.add
      .image(0, 0, SHARK_TEXTURE_KEY)
      .setScale(-0.084, 0.084)
      .setAlpha(0.94)
      .setTint(0xe5ece7);

    return this.add
      .container(SHARK_PARK_X, SHARK_PARK_Y, [glow, shark])
      .setDepth(4.9)
      .setAlpha(0.94)
      .setVisible(false);
  }

  private emitLightMotes(
    x: number,
    y: number,
    options: {
      count: number;
      spread: number;
      color: number;
      accentColor: number;
      durationMs: number;
      depth: number;
    }
  ) {
    const flash = this.add
      .ellipse(x, y, 22, 22, 0xfaffef, 0.22)
      .setDepth(options.depth)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: flash,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: Math.max(180, Math.round(options.durationMs * 0.72)),
      ease: 'Cubic.easeOut',
      onComplete: () => {
        flash.destroy();
      }
    });

    for (let index = 0; index < options.count; index += 1) {
      const angle = Phaser.Math.FloatBetween(-Math.PI * 0.95, Math.PI * 0.95);
      const distance = Phaser.Math.FloatBetween(10, options.spread);
      const width = Phaser.Math.FloatBetween(4, 8);
      const height = width * Phaser.Math.FloatBetween(0.74, 1.24);
      const color = index % 3 === 0 ? options.accentColor : options.color;
      const mote = this.add
        .ellipse(x, y, width, height, color, Phaser.Math.FloatBetween(0.72, 0.96))
        .setDepth(options.depth + 0.01)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setRotation(Phaser.Math.FloatBetween(-0.8, 0.8));

      this.tweens.add({
        targets: mote,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - Phaser.Math.FloatBetween(8, 18),
        scaleX: Phaser.Math.FloatBetween(0.8, 1.3),
        scaleY: Phaser.Math.FloatBetween(0.8, 1.35),
        alpha: 0,
        duration: options.durationMs + Phaser.Math.Between(-80, 90),
        ease: 'Cubic.easeOut',
        onComplete: () => {
          mote.destroy();
        }
      });
    }
  }

  private tryMoonlightOpportunity() {
    if (!this.moonlightOpportunityAvailable || this.stage.backdropKind !== 'moonlight-mountain') {
      return false;
    }

    const recovered = this.runnerLoop.recoverFromFailure(MOONLIGHT_OPPORTUNITY_PULSE);

    if (!recovered) {
      return false;
    }

    this.moonlightOpportunityAvailable = false;
    this.feedback.collect = Math.max(this.feedback.collect, 0.28);
    this.feedback.awakening = Math.max(this.feedback.awakening, 0.2);
    this.hitReactionTimer = 0;
    this.heroAnimator.clearTransient();
    this.emitGuidanceLine(MOONLIGHT_OPPORTUNITY_LINE, 2100, this.time.now);
    this.cameras.main.flash(110, 206, 242, 255, false);
    audioCueBus.emit({
      type: 'awakening_touch',
      intensity: 0.88
    });
    return true;
  }

  private showHitReaction(text: string, strength: number) {
    this.hitReactionText.setText(text).setFontSize(strength > 0 ? 17 : 16);
    this.hitReactionTimer = this.hitReactionDuration;
    this.hitReactionStrength = strength;
    this.heroAnimator.noteHit();
    this.hitReaction.setVisible(true).setAlpha(1).setScale(0.94 + strength * 0.05);
  }

  /**
   * How far to nudge the sprite so its visible feet stay on the support point
   * the runner is already using (ground line or platform top — `heroY +
   * HERO_SUPPORT_OFFSET_PX` is both). Returns 0 while airborne or during the
   * finish lift, and 0 whenever the feet are already inside the tolerance band,
   * so ordinary bob and squash are preserved.
   *
   * Visual only: nothing here feeds back into physics or collision.
   */
  private groundedFootCorrection(
    heroRawY: number,
    loopSnapshot: RunnerLoopSnapshot,
    finishResolved: boolean
  ) {
    if (!loopSnapshot.grounded || finishResolved) {
      return 0;
    }

    const metrics = this.character.artMetrics;
    const footBelowAnchorPx =
      (metrics.groundedBaselineRow - CHARACTER_RENDER_ORIGIN.y * metrics.sourceHeight) *
      this.heroRenderScaleY;
    const supportY = loopSnapshot.heroY + HERO_SUPPORT_OFFSET_PX;
    const drift = supportY - (heroRawY + footBelowAnchorPx);

    return (
      drift -
      Phaser.Math.Clamp(drift, -GROUNDED_FOOT_TOLERANCE_PX, GROUNDED_FOOT_TOLERANCE_PX)
    );
  }

  private updateHitReaction() {
    if (this.hitReactionTimer <= 0 || this.failFlow.isResolved() || this.finishFlow.isResolved()) {
      this.hitReaction.setAlpha(0).setVisible(false);
      return;
    }

    const progress = 1 - this.hitReactionTimer / this.hitReactionDuration;
    const appear = Phaser.Math.Clamp(progress / 0.16, 0, 1);
    const fade = Phaser.Math.Clamp((progress - 0.6) / 0.4, 0, 1);
    const alpha = appear * (1 - fade);
    const rise = Phaser.Math.Easing.Cubic.Out(progress) * (18 + this.hitReactionStrength * 4);
    const scale = 0.92 + appear * 0.12 + this.hitReactionStrength * 0.04 - fade * 0.05;

    this.hitReaction
      .setVisible(alpha > 0.02)
      .setAlpha(alpha)
      .setScale(scale)
      .setPosition(
        Math.round(this.hero.x + 52 + this.hitReactionStrength * 4),
        Math.round(this.hero.y - 92 - rise)
      );
  }

  private returnToStart() {
    if (this.returnHomeQueued) {
      return;
    }

    this.returnHomeQueued = true;
    this.pauseFlow.close(false);
    this.emitFocusMode(false);
    this.emitVictoryState(false);
    sessionState.hydrate({
      awakeningLevel: 0,
      collectedSparks: 0
    });
    localProgressStore.clear();

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }


  private haltSharkEvent() {
    // Pause, fail, victory and restart all land here. It now clears the tween
    // and the stale transform as well as visibility — leaving the transform
    // behind is what made the NEXT fly-by flash on screen for one frame.
    this.hideShark();
    this.sharkBurst = Math.min(this.sharkBurst, 0.16);
  }

  private emitVictoryState(active: boolean) {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(
      new CustomEvent('mateo:victory-state', {
        detail: {
          active
        }
      })
    );
  }

  private emitUiScreen(screen: 'playing' | 'chapter') {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(
      new CustomEvent('mateo:ui-screen', {
        detail: {
          screen
        }
      })
    );
  }

  private emitFocusMode(active: boolean) {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(
      new CustomEvent('mateo:focus-mode', {
        detail: {
          active
        }
      })
    );
  }

  private emitGuidanceLine(text: string, durationMs = 1800, time = 0) {
    if (typeof window === 'undefined') {
      return;
    }

    this.lastGuidanceAt = time;
    window.dispatchEvent(
      new CustomEvent('mateo:guidance-line', {
        detail: {
          text,
          durationMs
        }
      })
    );
  }

  private updateGuidanceMoments(time: number, loopSnapshot: RunnerLoopSnapshot) {
    const phraseChanged = loopSnapshot.currentPhraseId !== this.lastSeenPhraseId;

    if (
      phraseChanged &&
      loopSnapshot.currentPhraseId === 'onboarding_jump' &&
      time - this.lastGuidanceAt > 1400 &&
      this.guidance.showOnce('jump_intro')
    ) {
      this.discoveryFlow.trigger('jump_intro', time);
    }

    if (
      phraseChanged &&
      loopSnapshot.currentPhraseId === 'onboarding_reserve' &&
      time - this.lastGuidanceAt > 1800 &&
      this.guidance.showOnce('reserve_hint')
    ) {
      this.discoveryFlow.trigger('reserve_hint', time);
    }

    if (
      phraseChanged &&
      loopSnapshot.currentPhraseId === 'onboarding_upper' &&
      time - this.lastGuidanceAt > 2200 &&
      this.guidance.showOnce('upper_route_intro')
    ) {
      this.discoveryFlow.trigger('upper_route_intro', time);
    }

    if (
      phraseChanged &&
      loopSnapshot.currentPhraseFamily === 'recovery' &&
      time - this.lastGuidanceAt > 6200
    ) {
      const line = SUPPORTIVE_LINES[this.guidanceIndex % SUPPORTIVE_LINES.length]!;
      this.guidanceIndex += 1;
      this.emitGuidanceLine(line, 1800, time);
    }

    if (
      this.stage.surfaceGuidance &&
      loopSnapshot.surfaceProgress >= 0.56 &&
      time - this.lastGuidanceAt > 4200 &&
      this.guidance.showOnce('stage_surface')
    ) {
      this.emitGuidanceLine(this.stage.surfaceGuidance, 1800, time);
    }

    this.lastSeenPhraseId = loopSnapshot.currentPhraseId;
  }

  private updateDoubleJumpHint(time: number, loopSnapshot: RunnerLoopSnapshot) {
    if (this.guidance.hasShown('double_jump_intro')) {
      return;
    }

    if (
      loopSnapshot.currentPhraseId === 'onboarding_double' &&
      loopSnapshot.distanceTravelled > 240 &&
      time - this.lastGuidanceAt > 2200
    ) {
      this.guidance.markShown('double_jump_intro');
      this.discoveryFlow.trigger('double_jump_intro', time);
    }
  }

  /**
   * The one place the shark's transform is written, so the spawn frame and every
   * later frame go through identical maths. Called BEFORE the container is ever
   * made visible.
   */
  private placeShark(time: number) {
    const arc = Math.sin(this.sharkProgress * Math.PI);
    const x = Phaser.Math.Linear(journeyConfig.logicalSize.width + 74, -90, this.sharkProgress);
    const y =
      this.sharkBaseY +
      Math.sin(this.sharkProgress * Math.PI * 2) * 12 +
      Math.sin(time * 0.007 + this.sharkProgress * 8) * 4;

    this.shark
      .setPosition(x, y)
      .setScale(0.93 + arc * 0.055, 0.985 - arc * 0.032)
      .setRotation(Math.sin(time * 0.011 + this.sharkProgress * 3.2) * 0.085 - 0.1);
    this.sharkShadow
      .setPosition(x + 6, runnerConfig.visual.groundLineY - 44 + arc * 4)
      // Follows the shark's own alpha so the exit fade carries the shadow too.
      .setAlpha((0.05 + arc * 0.05) * this.shark.alpha);

    return x;
  }

  /**
   * Full reset: no tween left running, no stale transform, nothing visible.
   * Every exit path routes through here (natural end, contact, pause, fail,
   * victory, restart) so the next fly-by always starts from a known state.
   */
  private hideShark() {
    this.sharkExitTween?.remove();
    this.sharkExitTween = undefined;
    this.tweens.killTweensOf(this.shark);
    this.sharkPhase = 'hidden';
    this.sharkTagged = false;
    this.shark.setVisible(false).setAlpha(0.94).setPosition(SHARK_PARK_X, SHARK_PARK_Y);
    this.sharkShadow.setVisible(false).setAlpha(0);
  }

  /**
   * After it hands over its air, the shark flies on and fades rather than
   * blinking out mid-screen. It keeps advancing along its arc during the fade.
   */
  private beginSharkExit() {
    if (this.sharkPhase !== 'flying') {
      return;
    }

    this.sharkPhase = 'exiting';
    this.sharkExitTween?.remove();
    this.sharkExitTween = this.tweens.add({
      targets: this.shark,
      alpha: 0,
      duration: prefersReducedMotion() ? SHARK_EXIT_REDUCED_MS : SHARK_EXIT_MS,
      ease: 'Quad.easeOut',
      onComplete: () => this.hideShark()
    });
  }

  private updateSharkEvent(time: number, deltaSeconds: number, loopSnapshot: RunnerLoopSnapshot) {
    if (this.sharkPhase === 'hidden') {
      const pulse = sessionState.snapshot().currentPulse;
      // The guidance registry doubles as game-state here, same as the old
      // booleans: 'shark_sighting' = first shark window consumed,
      // 'hazard_intro' = the player has been hit at least once.
      const sightingShown = this.guidance.hasShown('shark_sighting');
      const playerWasHit = this.guidance.hasShown('hazard_intro');
      const firstSharkWindow =
        !sightingShown &&
        (
          loopSnapshot.currentPhraseId === 'onboarding_shark' ||
          (
            this.stage.backdropKind === 'moonlight-mountain' &&
            loopSnapshot.currentPhraseFamily === 'onboarding' &&
            loopSnapshot.levelProgress >= 0.18
          )
        );
      const sharkNeeded =
        (firstSharkWindow && (playerWasHit || loopSnapshot.levelProgress > 0.26)) ||
        (sightingShown && (pulse < 0.88 || playerWasHit));
      this.sharkCooldown -= deltaSeconds;

      if (
        this.sharkCooldown <= 0 &&
        sharkNeeded &&
        loopSnapshot.levelProgress > 0.12 &&
        loopSnapshot.levelProgress < 0.84 &&
        !loopSnapshot.levelComplete
      ) {
        this.sharkProgress = 0;
        this.sharkDuration = firstSharkWindow
          ? Phaser.Math.FloatBetween(3.05, 3.35)
          : Phaser.Math.FloatBetween(2.55, 2.95);
        this.sharkBaseY = firstSharkWindow
          ? Phaser.Math.Between(334, 352)
          : Phaser.Math.Between(340, 370);
        this.sharkTagged = false;
        this.sharkPhase = 'flying';
        // Position first, THEN show. Showing first rendered one frame at the
        // transform the previous fly-by was hidden at — the reported flash.
        this.shark.setAlpha(0.94);
        this.placeShark(time);
        this.shark.setVisible(true);
        this.sharkShadow.setVisible(true);

        // Only marked when the beat actually shows: a spawn suppressed by the
        // guidance cooldown leaves the first-window semantics intact.
        if (time - this.lastGuidanceAt > 1800 && this.guidance.showOnce('shark_sighting')) {
          this.discoveryFlow.trigger('shark_sighting', time);
        }
      }

      return;
    }

    this.sharkProgress = Math.min(1, this.sharkProgress + deltaSeconds / this.sharkDuration);

    const x = this.placeShark(time);
    const y = this.shark.y;

    // Still flying out after a rescue: keep the arc going under the fade, but
    // no second contact and no new decisions.
    if (this.sharkPhase === 'exiting') {
      if (this.sharkProgress >= 1) {
        this.hideShark();
      }

      return;
    }

    if (!this.sharkTagged && Math.abs(x - this.hero.x) < 48 && Math.abs(y - this.hero.y) < 76) {
      this.sharkTagged = true;
      const firstRescue = !this.guidance.hasShown('shark_catch');
      // The shark's gift is the air/recovery itself — grace and celebration are
      // not defaults. Keep later rescues subdued (no big star burst).
      this.sharkBurst = firstRescue ? 1 : 0.5;
      this.feedback.collect = Math.max(this.feedback.collect, firstRescue ? 0.42 : 0.16);
      this.feedback.awakening = Math.max(this.feedback.awakening, firstRescue ? 0.2 : 0.08);
      audioCueBus.emit({
        type: 'shark_touch',
        intensity: firstRescue ? 1.02 : 0.84
      });
      this.emitLightMotes(x, y, {
        count: firstRescue ? 7 : 3,
        spread: firstRescue ? 30 : 18,
        color: 0xf4fff0,
        accentColor: 0x9effcf,
        durationMs: firstRescue ? 460 : 300,
        depth: 5.06
      });
      const pulseBefore = sessionState.snapshot().currentPulse;
      const pulseRestore = Math.min(SHARK_PULSE_RESTORE, Math.max(0, 1 - pulseBefore));

      if (pulseRestore > 0.01) {
        sessionState.pulse(pulseRestore);
      }

      if (firstRescue && !this.discoveryFlow.hasSeenBeat('shark_catch')) {
        this.guidance.markShown('shark_catch');
        // First rescue: the shark_catch panel beat freezes the run as a readable
        // "rescue moment". Defer grace until that beat resolves (post-resume) so
        // it is not spent while time is frozen — applied in DiscoveryFlow's
        // resumeIfAllowed host callback.
        this.pendingSharkGrace = 0.8;
        this.discoveryFlow.trigger('shark_catch', time);
      } else {
        // Either a later rescue, or the rescue beat was already seen this session
        // (no freeze). The gift is the restored air; grant grace only if the hero
        // is genuinely at risk — already inside a post-hit i-frame window.
        this.guidance.markShown('shark_catch');
        if (loopSnapshot.invulnerabilitySeconds > 0) {
          this.runnerLoop.grantGrace(loopSnapshot.invulnerabilitySeconds + 0.4);
        }

        if (pulseRestore > 0.01) {
          const line = SHARK_LINES[this.sharkGuidanceIndex % SHARK_LINES.length]!;
          this.sharkGuidanceIndex += 1;
          this.emitGuidanceLine(line, 1200, time);
        }
      }

      this.sharkCooldown = Phaser.Math.FloatBetween(6.4, 8.8);
      this.beginSharkExit();
      return;
    }

    if (this.sharkProgress >= 1) {
      this.sharkCooldown = Phaser.Math.FloatBetween(5.4, 8.2);
      this.hideShark();
    }
  }

  private renderDebugOverlay(loopSnapshot: RunnerLoopSnapshot, time: number) {
    if (!this.debugGraphics) {
      return;
    }

    const debugGraphics = this.debugGraphics;
    const debugEntities = this.runnerLoop.debugSnapshot();
    const heroBoundsX = loopSnapshot.heroX - runnerConfig.hero.hitbox.width / 2;
    const heroBoundsY = loopSnapshot.heroY - runnerConfig.hero.hitbox.topOffset;
    const heroCenterY = loopSnapshot.heroY - 26;
    const pulse = 0.2 + Math.sin(time * 0.0045) * 0.04;

    debugGraphics.clear();
    debugGraphics.fillStyle(0xa8ff6f, 0.07);
    debugGraphics.fillRect(loopSnapshot.heroX + 92, 64, 74, 500);
    debugGraphics.lineStyle(1, 0xffffff, 0.34);
    debugGraphics.strokeRect(
      heroBoundsX,
      heroBoundsY,
      runnerConfig.hero.hitbox.width,
      runnerConfig.hero.hitbox.topOffset + runnerConfig.hero.hitbox.bottomOffset
    );
    debugGraphics.strokeCircle(loopSnapshot.heroX + 4, heroCenterY, runnerConfig.rewards.collectRadius);

    debugEntities.forEach((entity) => {
      const color =
        entity.role === 'hazard'
          ? 0xff7a63
          : entity.role === 'collectible'
            ? 0x7cf4df
            : 0xb8c2d4;
      const fillAlpha =
        entity.role === 'hazard'
          ? entity.active
            ? 0.14
            : 0.06
          : entity.role === 'collectible'
            ? 0.08
            : 0.04;
      const strokeAlpha = entity.active ? 0.84 : 0.38;

      debugGraphics.fillStyle(color, fillAlpha);
      debugGraphics.fillRect(
        entity.hitbox.x,
        entity.hitbox.y,
        entity.hitbox.width,
        entity.hitbox.height
      );
      debugGraphics.lineStyle(entity.role === 'hazard' ? 2 : 1, color, strokeAlpha);
      debugGraphics.strokeRect(
        entity.hitbox.x,
        entity.hitbox.y,
        entity.hitbox.width,
        entity.hitbox.height
      );
    });

    if (this.shark.visible) {
      debugGraphics.lineStyle(1, 0xb8c2d4, 0.6);
      debugGraphics.strokeEllipse(this.shark.x, this.shark.y, 74, 34);
    }

    if (loopSnapshot.projectedLandingX) {
      debugGraphics.lineStyle(2, 0xe6ff81, 0.5 + pulse);
      debugGraphics.beginPath();
      debugGraphics.moveTo(loopSnapshot.projectedLandingX, runnerConfig.visual.groundLineY - 18);
      debugGraphics.lineTo(loopSnapshot.projectedLandingX, runnerConfig.visual.groundLineY + 22);
      debugGraphics.strokePath();
      debugGraphics.fillStyle(0xe6ff81, 0.22);
      debugGraphics.fillCircle(loopSnapshot.projectedLandingX, runnerConfig.visual.groundLineY + 10, 6);
    }

    if (time - this.lastDebugEmit > 90) {
      const activeHazards =
        debugEntities
          .filter((entity) => entity.role === 'hazard' && entity.active)
          .map((entity) => `${entity.label}@${Math.round(entity.screenX)}`)
          .join(', ') || 'none';

      window.dispatchEvent(
        new CustomEvent('mateo:runner-debug', {
          detail: {
            phrase: loopSnapshot.currentPhraseLabel,
            coyoteMs: Math.round(loopSnapshot.coyoteSeconds * 1000),
            bufferMs: Math.round(loopSnapshot.jumpBufferSeconds * 1000),
            landingX:
              loopSnapshot.projectedLandingX === null
                ? null
                : Math.round(loopSnapshot.projectedLandingX),
            grounded: loopSnapshot.grounded,
            hazards: activeHazards,
            decor: this.getDecorativeDebugLabels().join(', '),
            retry: this.failFlow.getDebugState()
          }
        })
      );
      this.lastDebugEmit = time;
    }
  }

  private getDecorativeDebugLabels() {
    return DEBUG_DECORATIVE_FAMILIES.filter((label) => label !== 'shark-friend' || this.shark.visible);
  }
}
