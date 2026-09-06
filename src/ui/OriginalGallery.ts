import { openCollaborationMessage } from './CollaborationMessage';
import devilz from '@/assets/gallery/devilz-original-v1.webp';
import planet from '@/assets/gallery/planet-original-v1.webp';
import mountain from '@/assets/gallery/mountain-original-v1.webp';
import forest from '@/assets/gallery/forest-original-v1.webp';
import chomper from '@/assets/gallery/chomper-original-v1.webp';

/** Loaded only when invited: the full-frame source drawings, without retouching. */
export function openOriginalGallery() {
  if (document.querySelector('.original-gallery')) return;
  const previous = document.activeElement as HTMLElement | null;
  const dialog = document.createElement('dialog');
  dialog.className = 'original-gallery';
  dialog.setAttribute('aria-labelledby', 'original-gallery-title');
  const content = document.createElement('div');
  content.className = 'original-gallery__content';
  const close = document.createElement('button');
  close.className = 'editorial-button editorial-button--secondary original-gallery__close';
  close.textContent = 'Volver al juego';
  close.addEventListener('click', () => dialog.close());
  const title = document.createElement('h1');
  title.id = 'original-gallery-title'; title.textContent = 'Así empezó este mundo';
  const intro = document.createElement('p');
  intro.textContent = 'Estos son los dibujos de Mateo: sus líneas, sus anotaciones y las ideas que dieron lugar al juego.';
  const invitation = document.createElement('p');
  invitation.className = 'original-gallery__invitation';
  invitation.textContent = 'Puedes compartir tu creación tal como está, se vea como se vea. No necesita estar terminada ni parecerse a estos dibujos para empezar una conversación.';
  content.append(close, title, intro, invitation);
  const images: Array<[string, string, string]> = [
    [devilz, 'Los Devilz', 'Tres personajes, tres maneras de mirar.'],
    [planet, 'El primer planeta', 'Un lugar imaginado con lápiz y papel.'],
    [mountain, 'Moonlight Mountain', 'Una montaña, reflejos y una nota sobre el ritmo.'],
    [forest, 'The Black Forest', 'Un bosque con un ojo que sigue y una boca que bosteza.'],
    [chomper, 'Chomper', 'Dos cabezas distintas y muchas líneas en movimiento.']
  ];
  for (const [url, name, caption] of images) {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.src = url; image.alt = `Dibujo original de Mateo: ${name}`;
    image.loading = 'lazy'; image.decoding = 'async';
    const description = document.createElement('figcaption');
    const label = document.createElement('strong'); label.textContent = name;
    const body = document.createElement('span'); body.textContent = caption;
    description.append(label, body); figure.append(image, description); content.append(figure);
  }
  const ending = document.createElement('p');
  ending.textContent = '¿Qué te gustaría inventar? Un personaje, una historia, una canción, algo que puedas construir o representar… Puedes contarle a Raúl qué imaginas para este mundo y describir tu creación sin salir del juego.';
  content.append(ending);
  const contribute = document.createElement('button');
  contribute.className = 'editorial-button'; contribute.textContent = 'Compartir mi creación';
  contribute.addEventListener('click', () => openCollaborationMessage('gallery'));
  content.append(contribute);
  const back = close.cloneNode(true) as HTMLButtonElement;
  back.classList.remove('original-gallery__close');
  back.addEventListener('click', () => dialog.close()); content.append(back);
  dialog.append(content); document.body.append(dialog);
  dialog.addEventListener('close', () => { dialog.remove(); previous?.focus({ preventScroll: true }); });
  // The browser's modal top layer contains focus; keyboard input stays out of Phaser.
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.showModal(); close.focus({ preventScroll: true });
}
