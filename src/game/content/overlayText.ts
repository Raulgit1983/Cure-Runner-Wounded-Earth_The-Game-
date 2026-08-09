/**
 * Shared Spanish copy for the in-game overlay panels. Button labels are used
 * across pause, fail, finish and continuation panels; pause/fail/discovery/
 * finish copy lives here too so those overlay modules own no hardcoded text.
 */

import type { JourneyStageKey } from '@/game/content/journeyStages';

export const HOME_BUTTON_LABEL = 'Inicio';
export const CONTINUE_BUTTON_LABEL = 'Continuar';
export const REPLAY_BUTTON_LABEL = 'Repetir';
export const HELP_BUTTON_LABEL = 'Ayuda';
export const FINISH_CONTINUE_BUTTON_LABEL = 'Seguir';

export const PAUSE_TITLE = 'Pausa.';
export const PAUSE_BODY = 'Puedes seguir cuando quieras.';
export const PAUSE_CLOSING = 'La ruta espera.';

/**
 * Per-stage overlay copy, keyed by stage instead of the old
 * `isMoonlight ? ... : ...` pair. A new stage has to supply its own lines; it
 * cannot silently inherit Wounded Planet's through an implicit `else`.
 */
export interface StageOverlayCopy {
  failTitle: string;
  failBody: string;
  failClosing: string;
  finishTitle: string;
  finishLabel: string;
}

export const STAGE_OVERLAY_COPY: Record<JourneyStageKey, StageOverlayCopy> = {
  'wounded-planet': {
    failTitle: 'Aún hay luz.',
    failBody: 'El camino no se cierra.',
    failClosing: 'Toca para volver.',
    finishTitle: 'Nota despertada',
    finishLabel: 'Algo cambió.'
  },
  'moonlight-mountain': {
    failTitle: 'Aún hay reflejo.',
    failBody: 'La luna sigue ahí.',
    failClosing: 'Toca para volver.',
    finishTitle: 'Reflejo despierto',
    // Was 'Hasta aquí, por ahora.' — that was end-of-game copy riding on the
    // moonlight flag. Moonlight now continues into Black Forest, so the
    // end-of-game lines moved to FINISH_FINAL_* below, keyed on `nextStage`.
    finishLabel: 'El reflejo respondió.'
  },
  'black-forest': {
    failTitle: 'El bosque sigue ahí.',
    failBody: 'Puedes volver a entrar.',
    failClosing: 'Toca para volver.',
    // [PENDIENTE DE RAÚL] Neutral, factual placeholder. The ingredient, the
    // Chomper boss and the real closing message for this world are not
    // designed yet, and none of them are invented here.
    finishTitle: 'Bosque cruzado',
    finishLabel: 'Llegaste al final.'
  }
};

/** Shown when another stage follows. */
export const FINISH_CONTINUING_BODY = 'Algo ha despertado.';
export const FINISH_CONTINUING_CLOSING = 'La luz abre camino.';
/** Shown on the last stage — driven by `stage.nextStage`, not by which stage it is. */
export const FINISH_FINAL_BODY = 'No hay más niveles todavía.';
export const FINISH_FINAL_CLOSING = 'Puedes repetir o volver.';

export const CONTINUE_TITLE = 'Respira.';
export const CONTINUE_BODY = 'Cada paso despierta algo.';
export const CONTINUE_CLOSING = 'Sigamos.';

export type DiscoveryBeatId =
  | 'jump_intro'
  | 'double_jump_intro'
  | 'upper_route_intro'
  | 'notes_intro'
  | 'hazard_intro'
  | 'reserve_hint'
  | 'reserve_gain'
  | 'reserve_spent'
  | 'shark_sighting'
  | 'shark_catch';

export type DiscoveryBeatDefinition =
  | {
      mode: 'guidance';
      text: string;
      durationMs?: number;
    }
  | {
      mode: 'panel';
      title: string;
      body: string;
      closing: string;
    };

/** One-time discovery moments: a transient HUD hint ("guidance") or a panel that freezes the run. */
export const DISCOVERY_BEATS: Record<DiscoveryBeatId, DiscoveryBeatDefinition> = {
  jump_intro: {
    mode: 'guidance',
    text: 'Salta el barro.',
    durationMs: 2200
  },
  double_jump_intro: {
    mode: 'guidance',
    text: 'Toca otra vez.',
    durationMs: 2200
  },
  upper_route_intro: {
    mode: 'guidance',
    text: 'Una más para subir.',
    durationMs: 2300
  },
  notes_intro: {
    mode: 'panel',
    title: 'Notas.',
    body: 'Cada nota despierta el planeta.',
    closing: 'Y llena la reserva.'
  },
  hazard_intro: {
    mode: 'panel',
    title: 'Golpe.',
    body: 'Te quita aire.',
    closing: 'Mide el salto.'
  },
  reserve_hint: {
    mode: 'guidance',
    text: 'Cien notas dan reserva.',
    durationMs: 2400
  },
  reserve_gain: {
    mode: 'panel',
    title: 'Reserva.',
    body: 'Ganaste una reserva.',
    closing: 'Te salva una vez.'
  },
  reserve_spent: {
    mode: 'panel',
    title: 'Reserva.',
    body: 'Se usó la reserva.',
    closing: 'Ya no queda.'
  },
  shark_sighting: {
    mode: 'guidance',
    text: 'Hay aire arriba.',
    durationMs: 2000
  },
  shark_catch: {
    mode: 'panel',
    title: 'Tiburoncín.',
    body: 'Devuelve aire si falta.',
    closing: 'Alcánzalo arriba.'
  }
};
