/**
 * Shared Spanish copy for the in-game overlay panels. Button labels are used
 * across pause, fail, finish and continuation panels; pause/fail/discovery/
 * finish copy lives here too so those overlay modules own no hardcoded text.
 */

export const HOME_BUTTON_LABEL = 'Inicio';
export const CONTINUE_BUTTON_LABEL = 'Continuar';
export const REPLAY_BUTTON_LABEL = 'Repetir';
export const HELP_BUTTON_LABEL = 'Ayuda';
export const FINISH_CONTINUE_BUTTON_LABEL = 'Seguir';

export const PAUSE_TITLE = 'Pausa.';
export const PAUSE_BODY = 'Puedes seguir cuando quieras.';
export const PAUSE_CLOSING = 'La ruta espera.';

export const FAIL_TITLE = 'Aún hay luz.';
export const FAIL_BODY = 'El camino no se cierra.';
export const FAIL_CLOSING = 'Toca para volver.';
export const MOONLIGHT_FAIL_TITLE = 'Aún hay reflejo.';
export const MOONLIGHT_FAIL_BODY = 'La luna sigue ahí.';
export const MOONLIGHT_FAIL_CLOSING = 'Toca para volver.';

export const FINISH_TITLE = 'Nota despertada';
export const FINISH_LABEL = 'Algo cambió.';
export const FINISH_BODY = 'Algo ha despertado.';
export const FINISH_CLOSING = 'La luz abre camino.';
export const MOONLIGHT_FINISH_TITLE = 'Reflejo despierto';
export const MOONLIGHT_FINISH_LABEL = 'Hasta aquí, por ahora.';
export const MOONLIGHT_FINISH_BODY = 'No hay más niveles todavía.';
export const MOONLIGHT_FINISH_CLOSING = 'Puedes repetir o volver.';

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
