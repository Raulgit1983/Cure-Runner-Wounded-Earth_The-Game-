import type Phaser from 'phaser';

/** The caller keeps the run paused; cancellation never resumes or resets it. */
export function confirmExit(scene: Phaser.Scene, onConfirm: () => void) {
  if (document.querySelector('.exit-confirmation')) return;
  const previous = document.activeElement as HTMLElement | null;
  const inputWasEnabled = scene.input.enabled;
  scene.input.enabled = false;
  const dialog = document.createElement('dialog');
  dialog.className = 'exit-confirmation';
  dialog.setAttribute('aria-labelledby', 'exit-title');
  const title = document.createElement('h1');
  title.id = 'exit-title'; title.textContent = '¿Volver al inicio?';
  const body = document.createElement('p');
  body.textContent = 'Saldrás de este recorrido y volverás al principio del juego.';
  const cancel = document.createElement('button');
  cancel.type = 'button'; cancel.className = 'editorial-button'; cancel.textContent = 'Quedarme aquí';
  const confirm = document.createElement('button');
  confirm.type = 'button'; confirm.className = 'editorial-button editorial-button--secondary'; confirm.textContent = 'Sí, volver al inicio';
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    dialog.remove(); scene.events.off('shutdown', dispose);
    if (scene.sys.isActive()) scene.input.enabled = inputWasEnabled;
    if (previous?.isConnected) previous.focus({ preventScroll: true });
  };
  cancel.addEventListener('click', () => { dialog.close(); dispose(); });
  confirm.addEventListener('click', () => {
    if (disposed) return;
    dialog.close(); dispose();
    if (scene.sys.isActive()) onConfirm();
  });
  dialog.addEventListener('close', dispose, { once: true });
  for (const type of ['keydown', 'pointerdown', 'pointerup']) dialog.addEventListener(type, event => event.stopPropagation());
  dialog.append(title, body, cancel, confirm);
  document.body.append(dialog); scene.events.once('shutdown', dispose);
  dialog.showModal(); cancel.focus({ preventScroll: true });
}
