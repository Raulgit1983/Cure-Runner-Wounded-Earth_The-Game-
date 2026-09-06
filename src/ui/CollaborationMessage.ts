import { submitCollaboration } from '@/game/services/backend/collaborationGateway';
import type Phaser from 'phaser';
import { COLLABORATION_EMAIL, COLLABORATION_INVITATIONS, type CollaborationMoment } from '@/game/content/collaborationContent';

const drafts = new Map<CollaborationMoment, string>();
const key = (moment: CollaborationMoment) => `mateo.idea-draft.${moment}`;
const readDraft = (moment: CollaborationMoment) => {
  try { return sessionStorage.getItem(key(moment)) ?? drafts.get(moment); }
  catch { return drafts.get(moment); }
};

interface MessageContinuation { label: string; action: () => void }

/** Native top-layer editor; the calling chapter remains paused or completed. */
export function openCollaborationMessage(moment: CollaborationMoment, scene?: Phaser.Scene, continuation?: MessageContinuation) {
  if (document.querySelector('.collaboration-message')) return;
  let disposed = false;
  const inputWasEnabled = scene?.input.enabled;
  if (scene) scene.input.enabled = false;
  const previous = document.activeElement as HTMLElement | null;
  const copy = COLLABORATION_INVITATIONS[moment];
  const dialog = document.createElement('dialog');
  dialog.className = 'collaboration-message';
  dialog.setAttribute('aria-labelledby', 'idea-title');
  const title = document.createElement('h1'); title.id = 'idea-title'; title.textContent = copy.title;
  const purpose = document.createElement('p'); purpose.textContent = copy.purpose;
  const label = document.createElement('label'); label.textContent = 'Tu idea, a tu manera';
  const hint = document.createElement('p'); hint.id = 'idea-hint';
  hint.textContent = 'Elige una pregunta o escribe a tu manera. Una frase, un ritmo escrito o una idea a medias también sirven.';
  const message = document.createElement('textarea');
  message.value = readDraft(moment) ?? copy.template; message.rows = 7; message.maxLength = 2000;
  message.setAttribute('aria-describedby', hint.id); label.append(message);
  const save = () => {
    drafts.set(moment, message.value);
    try { sessionStorage.setItem(key(moment), message.value); } catch { /* In-memory draft remains available. */ }
  };
  const send = document.createElement('button'); send.type = 'button'; send.className = 'editorial-button'; send.textContent = 'Enviar mi idea';
  const honey = document.createElement('input'); honey.name = 'website'; honey.tabIndex = -1; honey.autocomplete = 'off'; honey.className = 'collaboration-message__honey'; honey.setAttribute('aria-hidden', 'true');
  let sending = false, sent = false;
  let controller = new AbortController();
  message.addEventListener('input', save);
  const destination = document.createElement('p'); destination.className = 'collaboration-message__destination';
  destination.textContent = `Tu idea llegará a Raúl en ${COLLABORATION_EMAIL}. No necesitas dar tu nombre, correo ni teléfono.`;
  const privacy = document.createElement('details');
  const privacyTitle = document.createElement('summary'); privacyTitle.textContent = 'Cómo llega tu mensaje';
  const privacyBody = document.createElement('p');
  privacyBody.textContent = 'FormSubmit lleva el texto al correo de Raúl y conserva una copia durante 30 días. El borrador se guarda en esta pestaña hasta enviarlo o cerrar la sesión. Comparte ideas para el juego, sin datos personales.';
  privacy.append(privacyTitle, privacyBody);
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  send.addEventListener('click', async () => {
    if (sending || sent) return;
    controller = new AbortController();
    sending = true; send.disabled = true; message.readOnly = true; discard.disabled = true;
    send.textContent = 'Enviando…'; status.textContent = ''; save();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      await submitCollaboration(moment, message.value, honey.value, controller.signal);
      if (disposed) return;
      sent = true; drafts.delete(moment);
      try { sessionStorage.removeItem(key(moment)); } catch { /* Nothing persisted. */ }
      send.textContent = 'Idea enviada'; status.textContent = '¡Gracias! Tu idea va camino de Raúl. Puedes volver al juego.';
      close.textContent = continuation?.label ?? 'Volver al juego';
      message.blur();
      close.focus();
      status.scrollIntoView({ block: 'center' });
    } catch (error) {
      if (disposed) return;
      send.disabled = false; message.readOnly = false; send.textContent = 'Volver a enviar';
      status.textContent = error instanceof Error && /^(Escribe|Tu idea|El buzón|Ahora no)/.test(error.message) ? error.message : 'Se ha cortado la conexión. Tu idea sigue aquí. Puedes volver a enviarla.';
    } finally { window.clearTimeout(timeout); sending = false; discard.disabled = false; }
  });
  const close = document.createElement('button'); close.type = 'button'; close.className = 'editorial-button editorial-button--secondary'; close.textContent = 'Volver al juego';
  close.addEventListener('click', () => {
    const advance = sent ? continuation?.action : undefined;
    dialog.close(); dispose();
    if (!scene || scene.sys.isActive()) advance?.();
  });
  const discard = document.createElement('button'); discard.type = 'button'; discard.className = 'collaboration-message__alternative'; discard.textContent = 'Empezar otra idea';
  discard.addEventListener('click', () => { message.value = copy.template; sent = false; send.disabled = false; message.readOnly = false; send.textContent = 'Enviar mi idea'; status.textContent = ''; close.textContent = 'Volver al juego'; save(); message.focus(); });
  dialog.append(title, purpose, hint, label, honey, send, destination, privacy, status, close, discard);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (!sent) save();
    controller.abort(); dialog.remove(); scene?.events.off('shutdown', dispose);
    if (scene?.sys.isActive()) scene.input.enabled = inputWasEnabled ?? true;
    if (previous?.isConnected) previous.focus({ preventScroll: true });
  };
  dialog.addEventListener('close', dispose, { once: true });
  for (const type of ['keydown', 'pointerdown', 'pointerup']) dialog.addEventListener(type, event => event.stopPropagation());
  document.body.append(dialog); scene?.events.once('shutdown', dispose); dialog.showModal();
  // Start on the heading, leaving the mobile keyboard closed until the player chooses to write.
  title.tabIndex = -1; title.focus({ preventScroll: true });
}
