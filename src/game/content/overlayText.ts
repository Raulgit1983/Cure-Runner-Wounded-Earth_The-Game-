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

export const PAUSE_TITLE = 'En pausa';
export const PAUSE_BODY = 'Puedes seguir cuando quieras.';
export const PAUSE_CLOSING = 'El recorrido espera aquí.';

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
  finishBody: string;
  invitation: string;
}

export const STAGE_OVERLAY_COPY: Record<JourneyStageKey, StageOverlayCopy> = {
  'wounded-planet': {
    failTitle: 'Prueba otra ruta',
    failBody: '¿Y si saltas un poco antes?',
    failClosing: 'Cada intento puede ser distinto.',
    finishTitle: 'Encontraste la Nota Sol',
    finishLabel: 'El planeta aún respira.',
    finishBody: 'Encontraste la Nota Sol. Su sonido te acompaña hacia la montaña.',
    invitation: '¿Un bajo, un soplo, una voz? Inventa un sonido para este planeta.'
  },
  'moonlight-mountain': {
    failTitle: 'Una vuelta más',
    failBody: 'Prueba a pasar bajo los altos.',
    failClosing: 'Cada intento puede ser distinto.',
    finishTitle: 'Reflejo despierto',
    // Was 'Hasta aquí, por ahora.' — that was end-of-game copy riding on the
    // moonlight flag. Moonlight now continues into Black Forest, so the
    // end-of-game lines moved to FINISH_FINAL_* below, keyed on `nextStage`.
    finishLabel: 'La música sigue contigo.',
    finishBody: 'Llevas un fragmento de la montaña. Entre los pinos espera otro camino.',
    invitation: '¿Qué cambiarías con el ritmo: la luz, los cristales, el camino?'
  },
  'black-forest': {
    failTitle: 'El bosque te espera',
    failBody: 'Busca un hueco entre las ramas.',
    failClosing: 'Cada intento puede ser distinto.',
    // Observed crossing only. No ingredient or narrative resolution is invented.
    finishTitle: 'Bosque cruzado',
    finishLabel: 'Cruzaste entre los pinos.',
    finishBody: 'Entre los pinos hay alguien más. Chomper te espera al otro lado.',
    invitation: 'Si este bosque hablara, ¿qué voz tendría? ¿Qué te diría?'
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
    title: 'Sigue las notas',
    body: 'Recoge notas para llenar tu reserva.',
    closing: 'Cien notas: una transformación.'
  },
  hazard_intro: {
    mode: 'panel',
    title: 'Puedes seguir',
    body: 'Saltarlos a tiempo conserva tu aire.',
    closing: 'Si están altos, pasa por debajo.'
  },
  reserve_hint: {
    mode: 'guidance',
    text: 'Cien notas dan reserva.',
    durationMs: 2400
  },
  reserve_gain: {
    mode: 'panel',
    title: 'El Latido de Alfredito',
    body: '¡Tu personaje se ha transformado!',
    closing: 'Esta forma te protege una vez.'
  },
  reserve_spent: {
    mode: 'panel',
    title: 'El Latido te ha protegido',
    body: 'Una reserva te ha devuelto aire.',
    closing: 'Al agotarlas, vuelves a tu personaje.'
  },
  shark_sighting: {
    mode: 'guidance',
    text: 'Tiburoncín lleva aire.',
    durationMs: 2000
  },
  shark_catch: {
    mode: 'panel',
    title: 'Tiburoncín.',
    body: 'Devuelve aire si falta.',
    closing: 'Alcánzalo arriba.'
  }
};
