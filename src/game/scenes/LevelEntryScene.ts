import Phaser from 'phaser';

import { journeyConfig } from '@/game/content/journeyConfig';
import { journeyStages, type JourneyStageKey } from '@/game/content/journeyStages';
import {
  listSelectableCharacters,
  type PlayableCharacter,
  type PlayableCharacterId
} from '@/game/content/playableCharacters';
import { localPreferenceStore } from '@/game/services/persistence/localPreferenceStore';
import { UI_FONT_STACK, uiTextResolution } from '@/ui/phaserTextStyle';

// --- 360x640 layout ----------------------------------------------------------
// The character carousel needs a real band of screen, so the entry art is
// capped smaller than its stage config asks for and the copy card is a little
// shorter. Title, copy and CTA all keep their own space; nothing overlaps.
const EYEBROW_Y = 56;
const TITLE_Y = 92;
const SEPARATOR_Y = 126;
const ART_CENTER_Y = 202;
const ART_MAX_WIDTH = 186;
const ART_MAX_HEIGHT = 124;
const CAROUSEL_CENTER_Y = 334;
const CAROUSEL_SLOT_OFFSET_X = 100;
const CAROUSEL_BAND_HEIGHT = 156;
const CAROUSEL_NAME_Y = 414;
const CAROUSEL_DOTS_Y = 432;
const CAROUSEL_HINT_Y = 448;
const COPY_CARD_Y = 464;
const COPY_CARD_HEIGHT = 88;
/** Offsets inside the copy card; keep framing clear of the decorative bar. */
const COPY_FRAMING_OFFSET_Y = 32;
const COPY_DETAIL_OFFSET_Y = 66;
const CTA_Y = 586;

// Portrait boxes: the active card sits in the 110-132px range, sized by the
// character's own mobileScale so Divu does not pretend to be Devi's size.
const ACTIVE_BOX_MIN = 110;
const ACTIVE_BOX_MAX = 132;
const SIDE_BOX_MIN = 52;
const SIDE_BOX_MAX = 64;
const SCALE_REFERENCE_MIN = 96;
const SCALE_REFERENCE_MAX = 128;
const SIDE_ALPHA = 0.4;
/** A horizontal move must clear this to count as a swipe. */
const SWIPE_THRESHOLD_PX = 26;
/** Below this, the gesture is a tap rather than a drag. */
const TAP_SLOP_PX = 12;
const ARROW_HIT_SIZE = 46;
const SWIPE_HINT_TEXT = 'Desliza para elegir';

/**
 * Per-level entry interstitial.
 * Dark screen with level eyebrow, title, framing line, and a CTA.
 * Provides emotional breathing room between levels.
 */
export class LevelEntryScene extends Phaser.Scene {
  private stageKey: JourneyStageKey = 'wounded-planet';
  private transitioning = false;

  constructor() {
    super('level-entry');
  }

  init(data?: { stage?: JourneyStageKey }) {
    this.stageKey = data?.stage ?? 'wounded-planet';
    this.transitioning = false;
  }

  preload() {
    const stage = journeyStages[this.stageKey] ?? journeyStages['wounded-planet'];
    const entry = stage.entry;
    const artIsReady = this.textures.exists(entry.art.textureKey);

    this.emitUiScreen(artIsReady ? 'chapter' : 'loading');

    if (artIsReady) {
      return;
    }

    const width = journeyConfig.logicalSize.width;
    const height = journeyConfig.logicalSize.height;
    const centerX = width * 0.5;
    const barWidth = 150;
    const barY = height * 0.5 + 76;
    const track = this.add.graphics();
    const fill = this.add.graphics();

    this.cameras.main.setBackgroundColor('#091018');

    const backdrop = this.add.graphics();
    backdrop.fillGradientStyle(0x071018, 0x071018, 0x121822, 0x151d28, 1, 1, 1, 1);
    backdrop.fillRect(0, 0, width, height);

    this.add
      .ellipse(centerX, Math.round(height * 0.42), 200, 200, entry.primaryColor, 0.035)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.add
      .text(centerX, Math.round(height * 0.5 - 64), entry.loading.eyebrow, {
        fontFamily: UI_FONT_STACK,
        fontSize: '12px',
        color: '#b8c4cc'
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution())
      .setAlpha(0.82);

    this.add
      .text(centerX, height * 0.5 - 10, entry.loading.title, {
        fontFamily: UI_FONT_STACK,
        fontSize: '20px',
        color: '#fff5ea'
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution());

    this.add
      .text(centerX, height * 0.5 + 22, entry.loading.copy, {
        fontFamily: UI_FONT_STACK,
        fontSize: '11px',
        color: '#d5d8df',
        align: 'center',
        wordWrap: { width: 220, useAdvancedWrap: true }
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution());

    const renderProgress = (progress: number) => {
      const clamped = Phaser.Math.Clamp(progress, 0, 1);

      // Plain fillRect, NOT fillRoundedRect: a radius larger than half the bar
      // height makes Phaser's WebGL triangulator emit stray canvas-spanning
      // lines (the "debug grid" artifact).
      track.clear();
      track.fillStyle(0xffffff, 0.08);
      track.fillRect(centerX - barWidth * 0.5, barY, barWidth, 8);

      fill.clear();
      fill.fillStyle(entry.accentColor, 0.94);
      fill.fillRect(centerX - barWidth * 0.5, barY, Math.max(0, barWidth * clamped), 8);
    };

    renderProgress(0.08);
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      renderProgress(0.08 + value * 0.84);
    });
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      renderProgress(1);
    });

    this.load.image(entry.art.textureKey, entry.art.imageUrl);
  }

  create() {
    const stage = journeyStages[this.stageKey] ?? journeyStages['wounded-planet'];
    const entry = stage.entry;
    const width = journeyConfig.logicalSize.width;
    const height = journeyConfig.logicalSize.height;
    const centerX = width * 0.5;
    const copyCardY = COPY_CARD_Y;
    const copyCardHeight = COPY_CARD_HEIGHT;
    const ctaY = CTA_Y;

    this.emitUiScreen('chapter');
    this.children.removeAll();
    this.cameras.main.resetFX();
    this.cameras.main.setBackgroundColor('#091018');
    this.cameras.main.fadeIn(260, 8, 12, 18);

    const backdrop = this.add.graphics();
    backdrop.fillGradientStyle(0x071018, 0x071018, 0x121822, 0x151d28, 1, 1, 1, 1);
    backdrop.fillRect(0, 0, width, height);

    // Soft ambient glows only — top and bottom — kept very low so they read as
    // gentle light, never as a dominant vertical green column on mobile.
    this.add
      .ellipse(centerX, Math.round(height * 0.32), 220, 190, entry.primaryColor, 0.03)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.add
      .ellipse(centerX, Math.round(height * 0.76), 250, 78, entry.primaryColor, 0.035)
      .setBlendMode(Phaser.BlendModes.ADD);

    const eyebrow = this.add
      .text(centerX, EYEBROW_Y, entry.eyebrow, {
        fontFamily: UI_FONT_STACK,
        fontSize: '12px',
        color: '#b8c4cc'
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution())
      .setAlpha(0);

    const title = this.add
      .text(centerX, TITLE_Y, entry.title, {
        fontFamily: UI_FONT_STACK,
        fontSize: '24px',
        color: '#fff8ef',
        stroke: '#0a0e14',
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: 240, useAdvancedWrap: true }
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution())
      .setShadow(0, 1, '#04070b', 3, false, true)
      .setAlpha(0)
      .setScale(0.92);

    // The stage config's art box is capped here so the carousel below has room.
    // Aspect ratio and rotation are untouched — only the maximum size changes.
    const artBoxWidth = Math.min(entry.art.maxWidth, ART_MAX_WIDTH);
    const artBoxHeight = Math.min(entry.art.maxHeight, ART_MAX_HEIGHT);

    const artShadow = this.add
      .ellipse(
        centerX,
        ART_CENTER_Y + artBoxHeight * 0.46,
        Math.max(120, artBoxWidth * 0.72),
        26,
        0x030507,
        0.34
      )
      .setAlpha(0);

    const artHalo = this.add
      .ellipse(centerX, ART_CENTER_Y - 6, artBoxWidth * 1.04, artBoxHeight * 0.94, entry.accentColor, 0.11)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);

    let artImage: Phaser.GameObjects.Image | null = null;

    if (this.textures.exists(entry.art.textureKey)) {
      const textureImage = this.textures.get(entry.art.textureKey).getSourceImage() as {
        width: number;
        height: number;
      };
      const fitScale = Math.min(
        artBoxWidth / textureImage.width,
        artBoxHeight / textureImage.height
      );

      artImage = this.add
        .image(centerX, ART_CENTER_Y + 12, entry.art.textureKey)
        .setScale(fitScale)
        .setRotation(entry.art.rotation ?? 0)
        .setAlpha(0);
    }

    const copyCard = this.add.graphics().setAlpha(0);
    copyCard.fillStyle(0x101720, 0.92);
    copyCard.lineStyle(2, entry.accentColor, 0.18);
    copyCard.fillRoundedRect(centerX - 132, copyCardY, 264, copyCardHeight, 24);
    copyCard.strokeRoundedRect(centerX - 132, copyCardY, 264, copyCardHeight, 24);
    copyCard.fillStyle(entry.primaryColor, 0.07);
    copyCard.fillRoundedRect(centerX - 116, copyCardY + 12, 232, 14, 7);

    const framing = this.add
      .text(centerX, copyCardY + COPY_FRAMING_OFFSET_Y, entry.framing, {
        fontFamily: UI_FONT_STACK,
        fontSize: '17px',
        color: '#fff7ed',
        stroke: '#0a0e14',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 210, useAdvancedWrap: true }
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution())
      .setShadow(0, 1, '#04070b', 2, false, true)
      .setAlpha(0);

    const detail = this.add
      .text(centerX, copyCardY + COPY_DETAIL_OFFSET_Y, entry.detail, {
        fontFamily: UI_FONT_STACK,
        fontSize: '12px',
        color: '#d4dde4',
        align: 'center',
        wordWrap: { width: 220, useAdvancedWrap: true }
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution())
      .setAlpha(0);

    // Soft "light seed" separator: a gentle glowing core flanked by a fading
    // path of light, replacing the raw divider line for a calmer, more premium
    // transition that echoes the planet's returning light.
    const separator = this.add.container(centerX, SEPARATOR_Y).setAlpha(0);
    const separatorHalo = this.add
      .ellipse(0, 0, 84, 14, entry.accentColor, 0.1)
      .setBlendMode(Phaser.BlendModes.ADD);
    const separatorCore = this.add
      .ellipse(0, 0, 7, 7, entry.accentColor, 0.85)
      .setBlendMode(Phaser.BlendModes.ADD);
    const separatorCoreInner = this.add.ellipse(0, 0, 3, 3, 0xfff8ec, 0.95);
    const separatorLeft = this.add.ellipse(-30, 0, 3, 3, entry.primaryColor, 0.42);
    const separatorRight = this.add.ellipse(30, 0, 3, 3, entry.primaryColor, 0.42);
    const separatorLeftFaint = this.add.ellipse(-52, 0, 2, 2, entry.primaryColor, 0.22);
    const separatorRightFaint = this.add.ellipse(52, 0, 2, 2, entry.primaryColor, 0.22);
    separator.add([
      separatorHalo,
      separatorCore,
      separatorCoreInner,
      separatorLeft,
      separatorRight,
      separatorLeftFaint,
      separatorRightFaint
    ]);

    const ctaPanel = this.add.graphics();
    const ctaWidth = 118;
    const ctaHeight = 36;
    const ctaX = centerX;

    ctaPanel.fillStyle(0x121a21, 0.94);
    ctaPanel.lineStyle(2, entry.accentColor, 0.24);
    ctaPanel.fillRoundedRect(-ctaWidth * 0.5, -ctaHeight * 0.5, ctaWidth, ctaHeight, 14);
    ctaPanel.strokeRoundedRect(-ctaWidth * 0.5, -ctaHeight * 0.5, ctaWidth, ctaHeight, 14);
    ctaPanel.fillStyle(entry.accentColor, 0.05);
    ctaPanel.fillRoundedRect(-ctaWidth * 0.5 + 8, -ctaHeight * 0.5 + 6, ctaWidth - 16, 8, 4);

    const ctaText = this.add
      .text(0, 0, entry.cta, {
        fontFamily: UI_FONT_STACK,
        fontSize: '13px',
        color: '#f7f6ec',
        stroke: '#0a1015',
        strokeThickness: 1,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution())
      .setShadow(0, 1, '#04070b', 2, false, true);

    const ctaHit = this.add
      .rectangle(0, 0, ctaWidth + 16, ctaHeight + 12, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });

    const ctaContainer = this.add
      .container(ctaX, ctaY, [ctaPanel, ctaText, ctaHit])
      .setSize(ctaWidth, ctaHeight)
      .setAlpha(0)
      .setScale(0.94);

    ctaHit.on('pointerover', () => {
      ctaContainer.setScale(1.02);
    });
    ctaHit.on('pointerout', () => {
      ctaContainer.setScale(1);
    });
    ctaHit.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();
        this.startJourney();
      }
    );

    this.tweens.add({
      targets: eyebrow,
      alpha: 0.72,
      duration: 340,
      delay: 120,
      ease: 'Quad.easeOut'
    });

    this.tweens.add({
      targets: title,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 420,
      delay: 220,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: separator,
      alpha: 1,
      duration: 360,
      delay: 320,
      ease: 'Quad.easeOut'
    });

    this.tweens.add({
      targets: [artShadow, artHalo],
      alpha: 1,
      duration: 420,
      delay: 260,
      ease: 'Quad.easeOut'
    });

    if (artImage) {
      this.tweens.add({
        targets: artImage,
        alpha: 1,
        y: ART_CENTER_Y,
        duration: 520,
        delay: 300,
        ease: 'Cubic.easeOut'
      });

      this.tweens.add({
        targets: artImage,
        y: ART_CENTER_Y - 6,
        duration: 2400,
        delay: 860,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.tweens.add({
      targets: copyCard,
      alpha: 1,
      duration: 280,
      delay: 460,
      ease: 'Quad.easeOut'
    });

    this.tweens.add({
      targets: framing,
      alpha: 0.96,
      duration: 360,
      delay: 520,
      ease: 'Quad.easeOut'
    });

    this.tweens.add({
      targets: detail,
      alpha: 0.82,
      duration: 320,
      delay: 580,
      ease: 'Quad.easeOut'
    });

    this.tweens.add({
      targets: ctaContainer,
      alpha: 0.98,
      scaleX: 1,
      scaleY: 1,
      duration: 320,
      delay: 660,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Gentle breathing pulse so a young player notices the button invites a
        // tap. Kept subtle so it reads as calm, not as a flashing prompt.
        this.tweens.add({
          targets: ctaContainer,
          scaleX: 1.045,
          scaleY: 1.045,
          duration: 920,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }
    });

    this.buildCharacterCarousel(centerX, entry.accentColor);

    // Only the explicit CTA starts the level (see ctaHit above). Tapping the
    // backdrop does nothing — intentional, so a stray tap never skips the
    // chapter, mirroring the DOM cover's CTA-only behaviour.
  }

  /**
   * Big swipeable character carousel: the active Devilz sits centred and large,
   * the other two sit smaller and dimmer at the sides. Choosing writes the
   * preference immediately; `JourneyScene.create()` re-reads it on start.
   *
   * It never starts the level. The explicit CTA remains the only way in, so a
   * swipe or a stray tap in this band can only change the selection.
   */
  private buildCharacterCarousel(centerX: number, accentColor: number) {
    const characters = listSelectableCharacters();

    if (characters.length < 2) {
      return;
    }

    let activeIndex = Math.max(
      0,
      characters.findIndex((character) => character.id === localPreferenceStore.loadCharacterId())
    );

    const layer = this.add.container(0, 0).setAlpha(0);
    const slots = characters.map((character) => this.createCarouselSlot(character, centerX));

    slots.forEach((slot) => {
      if (slot.portrait) {
        layer.add(slot.portrait);
      }
    });

    const nameText = this.add
      .text(centerX, CAROUSEL_NAME_Y, characters[activeIndex]!.displayName, {
        fontFamily: UI_FONT_STACK,
        fontSize: '16px',
        color: '#fff7ed',
        stroke: '#0a0e14',
        strokeThickness: 1,
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution())
      .setShadow(0, 1, '#04070b', 2, false, true);

    const dots = characters.map((_character, index) =>
      this.add.ellipse(
        centerX + (index - (characters.length - 1) / 2) * 14,
        CAROUSEL_DOTS_Y,
        6,
        6,
        accentColor,
        0.25
      )
    );

    const hint = this.add
      .text(centerX, CAROUSEL_HINT_Y, SWIPE_HINT_TEXT, {
        fontFamily: UI_FONT_STACK,
        fontSize: '10px',
        color: '#b8c4cc',
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(uiTextResolution())
      .setAlpha(0.62);

    layer.add([nameText, ...dots, hint]);

    const applyLayout = (animate: boolean) => {
      const count = characters.length;

      slots.forEach((slot, index) => {
        // Normalised to -1 / 0 / +1 around the active card.
        let offset = index - activeIndex;

        if (offset > count / 2) {
          offset -= count;
        } else if (offset < -count / 2) {
          offset += count;
        }

        const targetScale = offset === 0 ? slot.activeScale : slot.sideScale;
        // The drawing is off-centre inside its canvas, so the re-centring shift
        // has to be re-applied at whatever scale this slot is showing.
        const targetX =
          centerX + offset * CAROUSEL_SLOT_OFFSET_X + slot.anchorOffsetX * targetScale;
        const targetY = CAROUSEL_CENTER_Y + slot.anchorOffsetY * targetScale;
        const targetAlpha = offset === 0 ? 1 : SIDE_ALPHA;
        // A card that wraps from one edge to the other would slide straight
        // through the centre, so it is teleported behind a fade instead.
        const wrapped = Math.abs(offset - slot.offset) > 1;

        slot.offset = offset;

        if (!slot.portrait) {
          return;
        }

        this.tweens.killTweensOf(slot.portrait);

        if (!animate || wrapped) {
          slot.portrait.setPosition(targetX, targetY).setScale(targetScale);

          if (!animate) {
            slot.portrait.setAlpha(targetAlpha);
            return;
          }

          // Teleported: fade back in at the new slot instead of sliding.
          slot.portrait.setAlpha(0);
          this.tweens.add({
            targets: slot.portrait,
            alpha: targetAlpha,
            duration: 200,
            ease: 'Quad.easeOut'
          });

          return;
        }

        this.tweens.add({
          targets: slot.portrait,
          x: targetX,
          y: targetY,
          alpha: targetAlpha,
          scaleX: targetScale,
          scaleY: targetScale,
          duration: 220,
          ease: 'Cubic.easeOut'
        });
      });

      nameText.setText(characters[activeIndex]!.displayName);
      dots.forEach((dot, index) => {
        dot.setFillStyle(accentColor, index === activeIndex ? 0.92 : 0.25);
      });
    };

    const select = (nextIndex: number) => {
      const count = characters.length;
      const normalised = ((nextIndex % count) + count) % count;

      if (this.transitioning || normalised === activeIndex) {
        return;
      }

      activeIndex = normalised;
      localPreferenceStore.saveCharacterId(characters[activeIndex]!.id as PlayableCharacterId);
      applyLayout(true);
    };

    this.bindCarouselInput(centerX, layer, accentColor, (step) => select(activeIndex + step));

    applyLayout(false);
    // Persist on open too, so the shown character is the one that will play
    // even if the stored value was a retired id (Carlitos) or was never set.
    localPreferenceStore.saveCharacterId(characters[activeIndex]!.id as PlayableCharacterId);

    this.tweens.add({
      targets: layer,
      alpha: 1,
      duration: 320,
      delay: 560,
      ease: 'Quad.easeOut'
    });
  }

  private createCarouselSlot(character: PlayableCharacter, centerX: number) {
    // Size the card from the character's own mobileScale so the trio keeps its
    // relative sizes instead of all three being stretched to one box.
    const weight = Phaser.Math.Clamp(
      (character.mobileScale.preferredPx - SCALE_REFERENCE_MIN) /
        (SCALE_REFERENCE_MAX - SCALE_REFERENCE_MIN),
      0,
      1
    );
    const activeBox = ACTIVE_BOX_MIN + (ACTIVE_BOX_MAX - ACTIVE_BOX_MIN) * weight;
    const sideBox = SIDE_BOX_MIN + (SIDE_BOX_MAX - SIDE_BOX_MIN) * weight;

    let portrait: Phaser.GameObjects.Image | null = null;
    let activeScale = 1;
    let sideScale = 1;
    let anchorOffsetX = 0;
    let anchorOffsetY = 0;

    if (this.textures.exists(character.poses.main.key)) {
      // Fit the DRAWING to the box, not the canvas. Pack v2 pads a 512x512
      // canvas around a ~375px character, so fitting the canvas shrank the
      // visible silhouette to ~81-95px instead of the intended 110-132px.
      const { portrait: box, sourceWidth, sourceHeight } = character.artMetrics;
      const visibleWidth = box.right - box.left + 1;
      const visibleHeight = box.bottom - box.top + 1;
      const fit = Math.min(activeBox / visibleWidth, activeBox / visibleHeight);

      activeScale = fit;
      sideScale = fit * (sideBox / activeBox);
      // Re-centre on the drawing's own centre, so a character sitting off-centre
      // inside its canvas still lines up with its neighbours and its label.
      anchorOffsetX = (sourceWidth / 2 - (box.left + visibleWidth / 2));
      anchorOffsetY = (sourceHeight / 2 - (box.top + visibleHeight / 2));
      portrait = this.add.image(centerX, CAROUSEL_CENTER_Y, character.poses.main.key).setScale(fit);
    }

    return { character, portrait, activeScale, sideScale, anchorOffsetX, anchorOffsetY, offset: 0 };
  }

  /**
   * Swipe + arrows + side-portrait taps, all confined to the carousel band.
   * A gesture is a swipe only when the horizontal move clears the threshold AND
   * dominates the vertical move, so a vertical drag never changes the choice.
   */
  private bindCarouselInput(
    centerX: number,
    layer: Phaser.GameObjects.Container,
    accentColor: number,
    step: (direction: number) => void
  ) {
    const width = journeyConfig.logicalSize.width;
    const band = this.add
      .rectangle(centerX, CAROUSEL_CENTER_Y, width, CAROUSEL_BAND_HEIGHT, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });

    layer.add(band);

    let startX = 0;
    let startY = 0;
    let tracking = false;

    band.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      startX = pointer.x;
      startY = pointer.y;
      tracking = true;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!tracking) {
        return;
      }

      tracking = false;

      const deltaX = pointer.x - startX;
      const deltaY = pointer.y - startY;

      if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swiping left brings the next character in from the right.
        step(deltaX < 0 ? 1 : -1);
        return;
      }

      if (Math.abs(deltaX) <= TAP_SLOP_PX && Math.abs(deltaY) <= TAP_SLOP_PX) {
        // A tap on a side portrait selects it; a tap on the active one does nothing.
        if (pointer.x < centerX - CAROUSEL_SLOT_OFFSET_X * 0.5) {
          step(-1);
        } else if (pointer.x > centerX + CAROUSEL_SLOT_OFFSET_X * 0.5) {
          step(1);
        }
      }
    });

    const arrow = (x: number, direction: number) => {
      const chevron = this.add.graphics();
      const reach = direction < 0 ? -6 : 6;

      chevron.lineStyle(2, accentColor, 0.62);
      chevron.beginPath();
      chevron.moveTo(x - reach, CAROUSEL_CENTER_Y - 9);
      chevron.lineTo(x + reach, CAROUSEL_CENTER_Y);
      chevron.lineTo(x - reach, CAROUSEL_CENTER_Y + 9);
      chevron.strokePath();

      const hit = this.add
        .rectangle(x, CAROUSEL_CENTER_Y, ARROW_HIT_SIZE, ARROW_HIT_SIZE, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true });

      hit.on(
        'pointerdown',
        (
          _pointer: Phaser.Input.Pointer,
          _localX: number,
          _localY: number,
          event: Phaser.Types.Input.EventData
        ) => {
          event.stopPropagation();
          tracking = false;
          step(direction);
        }
      );

      layer.add([chevron, hit]);
    };

    arrow(26, -1);
    arrow(width - 26, 1);
  }

  private startJourney() {
    if (this.transitioning) {
      return;
    }

    this.transitioning = true;
    this.cameras.main.fadeOut(200, 9, 14, 20);
    this.time.delayedCall(200, () => {
      this.scene.start('journey', { stage: this.stageKey });
    });
  }

  private emitUiScreen(screen: 'loading' | 'chapter') {
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
}
