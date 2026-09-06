import { COLLABORATION_EMAIL, COLLABORATION_INVITATIONS, type CollaborationMoment } from '@/game/content/collaborationContent';

export const COLLABORATION_ENDPOINT = `https://formsubmit.co/ajax/${COLLABORATION_EMAIL}`;
export const GAME_PUBLIC_URL = 'https://raulgit1983.github.io/Cure-Runner-Wounded-Planet/';
export const collaborationPayload = (moment: CollaborationMoment, message: string, honey = '') => ({
  _subject: `Cure Runner · ${COLLABORATION_INVITATIONS[moment].subject}`,
  _template: 'table',
  _captcha: 'false',
  _url: GAME_PUBLIC_URL,
  _honey: honey,
  Lugar: COLLABORATION_INVITATIONS[moment].subject,
  Idea: message.trim()
});

/** No account or sender address is requested. Network lives outside the game scenes. */
export async function submitCollaboration(moment: CollaborationMoment, message: string, honey = '', signal?: AbortSignal) {
  if (!message.trim() || message.trim() === COLLABORATION_INVITATIONS[moment].template.trim()) {
    throw new Error('Escribe algo de tu idea antes de enviarla. Una frase basta.');
  }
  if (message.length > 2000) throw new Error('Tu idea es muy larga. Puedes contarla en dos mensajes.');
  const response = await fetch(COLLABORATION_ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'omit', referrerPolicy: 'origin', signal,
    body: JSON.stringify(collaborationPayload(moment, message, honey))
  });
  const result: { success?: boolean | string; message?: string } = await response.json();
  if (/activat|confirm.*email|check.*inbox/i.test(result.message ?? '')) {
    throw new Error('El buzón aún se está preparando. Tu idea queda guardada aquí; puedes probar más tarde.');
  }
  if (!response.ok || !(result.success === true || result.success === 'true')) {
    throw new Error('Ahora no ha podido enviarse. Tu idea sigue aquí: comprueba la conexión y vuelve a intentarlo.');
  }
}
