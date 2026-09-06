import Phaser from 'phaser';
import { UI_FONT_STACK } from './phaserTextStyle';

/**
 * Keep Phaser's text/layout/input lifecycle, but let the browser rasterize the
 * letters at device resolution. A 3x text texture drawn into a 360px framebuffer
 * still becomes 360px; increasing Text.resolution alone cannot fix that.
 *
 * Use the actual render matrix (including nested containers and camera zoom).
 * DOM nodes never intercept game gestures. No global factory/prototype patch.
 */
export function uiText(
  scene: Phaser.Scene, x: number, y: number, label: string,
  style: Phaser.Types.GameObjects.Text.TextStyle = {}
): Phaser.GameObjects.Text {
  const text = scene.add.text(x, y, label, {
    ...style, fontFamily: UI_FONT_STACK, strokeThickness: 0,
    fontStyle: style.fontStyle ?? (parseFloat(String(style.fontSize ?? 16)) >= 20 ? 'bold' : ''),
    padding: { top: 2, bottom: 2 }
  });
  // Headless unit doubles have no DOM; the normal Phaser object remains usable.
  if (typeof document === 'undefined') return text;
  const root = document.getElementById('game-root');
  if (!root) return text;
  const node = document.createElement('span');
  node.className = 'game-type';
  node.style.visibility = 'hidden';
  root.append(node);
  let rendered = false;
  let lastContent = '', lastStyle = '';
  let scale = 1, offsetX = 0, offsetY = 0;
  const measure = () => {
    const canvas = scene.game.canvas.getBoundingClientRect();
    const parent = root.getBoundingClientRect();
    scale = canvas.width / scene.scale.gameSize.width;
    offsetX = canvas.left - parent.left;
    offsetY = canvas.top - parent.top;
  };
  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(root);
  scene.scale.on('resize', measure);
  const before = () => { rendered = false; };
  const after = () => { if (!rendered) node.style.visibility = 'hidden'; };
  scene.game.events.on('prerender', before);
  scene.game.events.on('postrender', after);
  const render = (
    _renderer: unknown, source: Phaser.GameObjects.Text,
    camera: Phaser.Cameras.Scene2D.Camera,
    parentMatrix?: Phaser.GameObjects.Components.TransformMatrix
  ) => {
    rendered = true;
    const matrix = Phaser.GameObjects.GetCalcMatrix(source, camera, parentMatrix).calc;
    const px = matrix.getX(-source.displayOriginX, -source.displayOriginY);
    const py = matrix.getY(-source.displayOriginX, -source.displayOriginY);
    let alpha = source.alpha * camera.alpha;
    let depth = source.depth;
    let parent = source.parentContainer;
    while (parent) { alpha *= parent.alpha; depth += parent.depth; parent = parent.parentContainer; }
    node.dataset.layer = depth < 6.5 ? 'scene' : 'panel';
    const content = source.getWrappedText().join('\n');
    if (content !== lastContent) { node.textContent = content; lastContent = content; }
    const font = source.style;
    const css = `position:absolute;pointer-events:none;white-space:pre;transform-origin:0 0;` +
      `left:${offsetX}px;top:${offsetY}px;width:${source.width}px;` +
      `font-family:${UI_FONT_STACK};font-size:${font.fontSize};font-weight:${font.fontStyle.includes('bold') ? 700 : 400};` +
      `line-height:${source.height / Math.max(1, content.split('\n').length)}px;` +
      `color:${font.color};text-align:${font.align};opacity:${alpha};z-index:${Math.round(depth * 100) + 1};` +
      `transform:matrix(${matrix.a * scale},${matrix.b * scale},${matrix.c * scale},${matrix.d * scale},${px * scale},${py * scale});`;
    if (css !== lastStyle) { node.style.cssText = css; lastStyle = css; }
    node.style.visibility = alpha < 0.01 ? 'hidden' : 'visible';
  };
  // Both renderers share the same text surface and hide/destroy contract.
  Object.assign(text, { renderWebGL: render, renderCanvas: render });
  text.once('destroy', () => {
    observer.disconnect();
    scene.scale.off('resize', measure);
    scene.game.events.off('prerender', before);
    scene.game.events.off('postrender', after);
    node.remove();
  });
  return text;
}
