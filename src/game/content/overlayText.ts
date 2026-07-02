/**
 * Shared Spanish copy for the in-game overlay panels. Button labels are used
 * across pause, fail, finish and continuation panels; the pause-specific text
 * lives here too so the PauseFlow overlay module owns no hardcoded copy.
 * (Finish/fail/discovery copy still lives in JourneyScene and moves here when
 * those overlays are extracted.)
 */

export const HOME_BUTTON_LABEL = 'Inicio';
export const CONTINUE_BUTTON_LABEL = 'Continuar';
export const REPLAY_BUTTON_LABEL = 'Repetir';
export const HELP_BUTTON_LABEL = 'Ayuda';

export const PAUSE_TITLE = 'Pausa.';
export const PAUSE_BODY = 'Puedes seguir cuando quieras.';
export const PAUSE_CLOSING = 'La ruta espera.';
