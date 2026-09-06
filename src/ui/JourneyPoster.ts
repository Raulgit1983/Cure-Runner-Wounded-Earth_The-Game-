import type Phaser from 'phaser';
import { openCollaborationMessage } from './CollaborationMessage';
import { listSelectableCharacters } from '@/game/content/playableCharacters';

/** Shared local ending. The story stays open; composing is optional and private. */
export class JourneyPoster {
  private readonly root: HTMLElement;
  private used = false;

  constructor(private readonly scene: Phaser.Scene, achievement: string, replay: () => void, home: () => void) {
    this.root = document.createElement('section');
    this.root.className = 'journey-poster';
    this.root.hidden = true;
    this.root.setAttribute('aria-label', 'El viaje sigue contigo');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'editorial-eyebrow';
    eyebrow.textContent = 'Cure Runner · Un mundo de Mateo';
    const title = document.createElement('h1');
    title.textContent = 'El viaje sigue contigo';
    const art = document.createElement('div');
    art.className = 'journey-poster__cast';
    for (const character of listSelectableCharacters()) {
      const image = document.createElement('img');
      image.src = character.poses.finishAwakened?.url ?? character.poses.main.url;
      image.alt = character.displayName;
      art.append(image);
    }
    const complete = document.createElement('p');
    complete.className = 'journey-poster__achievement';
    complete.textContent = achievement;
    const open = document.createElement('p');
    open.textContent = 'Has llegado al final de esta versión. Lo que viene después aún no está dibujado.';
    const invitation = document.createElement('p');
    invitation.className = 'journey-poster__invitation';
    invitation.textContent = 'Si el próximo mundo fuera tuyo, ¿qué pasaría en él?';
    const mediums = document.createElement('p');
    mediums.textContent = 'Un saxo que abre un camino. Un dibujo que se mueve. Una criatura con una voz imposible. ¿Por dónde empezarías tú?';
    const together = document.createElement('p');
    together.className = 'journey-poster__together';
    together.textContent = 'También nos sirve saber qué te enganchó y qué se hizo largo o confuso. Así podemos cambiar el juego contigo.';
    const actions = document.createElement('div');
    actions.className = 'editorial-actions';
    const button = (label: string, action: () => void, secondary = false) => {
      const node = document.createElement('button');
      node.type = 'button'; node.textContent = label;
      node.className = secondary ? 'editorial-button editorial-button--secondary' : 'editorial-button';
      node.addEventListener('click', action);
      return node;
    };
    const follow = (action: () => void) => {
      if (this.used) return;
      this.used = true;
      this.root.hidden = true;
      action();
    };
    actions.append(button('Contar mi idea', () => openCollaborationMessage('final', this.scene, { label: 'Jugar otra vez', action: () => follow(replay) })),
      button('Jugar otra vez', () => follow(replay), true),
      button('Inicio', () => follow(home), true));
    const gallery = button('Ver los dibujos originales', async () => {
      const { openOriginalGallery } = await import('./OriginalGallery');
      openOriginalGallery();
    }, true);
    gallery.className = 'journey-poster__gallery';
    this.root.append(eyebrow, title, art, complete, open, invitation, mediums, together, gallery, actions);
    document.querySelector('.game-frame')?.append(this.root);
    // Native controls must never trigger a jump or an underlying scene action.
    for (const type of ['pointerdown', 'pointerup', 'keydown']) {
      this.root.addEventListener(type, event => event.stopPropagation());
    }
    scene.events.once('shutdown', () => this.root.remove());
  }

  show() {
    this.root.hidden = false;
    this.root.querySelector('h1')?.setAttribute('tabindex', '-1');
    this.root.querySelector('h1')?.focus({ preventScroll: true });
  }

}
