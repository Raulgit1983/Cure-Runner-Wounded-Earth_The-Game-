import type Phaser from 'phaser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HELP_BUTTON_LABEL, HOME_BUTTON_LABEL, REPLAY_BUTTON_LABEL } from '@/game/content/overlayText';
import { quickHelpContent } from '@/game/content/helpContent';

import { PauseFlow, type PauseFlowHost } from './PauseFlow';

const buttons = vi.hoisted(() => new Map<string, () => void>());
vi.mock('@/ui/panelButton', () => ({
  createPanelButton: (_scene: unknown, label: string, _width: number, action: () => void) => {
    buttons.set(label, action);
    return { setPosition() {} };
  }
}));

/** Fail on any write after disposal, including retained tween callbacks. */
function objectDouble() {
  const state = { visible: false, destroyed: false, destroyCount: 0 };
  const object: any = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key as keyof typeof state];
      return (...args: unknown[]) => {
        if (key === 'destroy') {
          target.destroyed = true;
          target.destroyCount++;
        } else {
          if (target.destroyed) throw new Error(`Write after destroy: ${String(key)}`);
          if (key === 'setVisible') target.visible = args[0] as boolean;
        }
        return object;
      };
    }
  });
  return object;
}

function fixture() {
  const owned: ReturnType<typeof objectDouble>[] = [];
  const tweens: Array<{ targets: unknown; onComplete?: () => void }> = [];
  const addObject = () => {
    const object = objectDouble();
    owned.push(object);
    return object;
  };
  const scene = {
    add: { rectangle: addObject, container: addObject, graphics: objectDouble, text: objectDouble },
    sys: { isActive: vi.fn(() => true) },
    children: { bringToTop: vi.fn() },
    tweens: {
      add: vi.fn((config) => { tweens.push(config); }),
      killTweensOf: vi.fn()
    }
  };
  const host: PauseFlowHost = {
    canPause: vi.fn(() => true), isDiscoveryBeatActive: vi.fn(() => false),
    canRestoreRun: vi.fn(() => true), setRunFrozen: vi.fn(), haltShark: vi.fn(),
    emitFocusMode: vi.fn(), replayCurrentStage: vi.fn(), returnToStart: vi.fn()
  };
  const flow = new PauseFlow(scene as unknown as Phaser.Scene, host);
  return { flow, scene, host, owned, tweens };
}

beforeEach(() => { buttons.clear(); vi.stubGlobal('window', new EventTarget()); });
afterEach(() => vi.unstubAllGlobals());

describe('PauseFlow lifecycle', () => {
  it.each(['closed', 'open', 'help', 'closing', 'help-closing'] as const)(
    'disposes synchronously from %s without resuming or starting a tween', (state) => {
      const { flow, scene, host, owned, tweens } = fixture();
      if (state !== 'closed') flow.toggle();
      if (state === 'help' || state === 'help-closing') buttons.get(HELP_BUTTON_LABEL)!();
      if (state === 'help-closing') buttons.get(quickHelpContent.back)!();
      if (state === 'closing') flow.close(false);
      const count = tweens.length;
      vi.mocked(host.setRunFrozen).mockClear();
      vi.mocked(host.emitFocusMode).mockClear();
      scene.tweens.killTweensOf.mockClear();

      flow.destroy();
      flow.destroy();
      expect(flow.isOpen()).toBe(false);
      expect(tweens).toHaveLength(count);
      expect(host.setRunFrozen).not.toHaveBeenCalled();
      expect(host.emitFocusMode).not.toHaveBeenCalled();
      for (const object of owned) {
        expect(scene.tweens.killTweensOf.mock.calls.some(([target]) => target === object)).toBe(true);
        expect(object.destroyCount).toBe(1);
      }
      // Even a completion retained outside the tween manager is harmless.
      expect(() => tweens.forEach((tween) => tween.onComplete?.())).not.toThrow();
      window.dispatchEvent(new Event('mateo:pause-request'));
      flow.toggle();
      flow.close(true);
      buttons.get(REPLAY_BUTTON_LABEL)!();
      buttons.get(HOME_BUTTON_LABEL)!();
      expect(host.setRunFrozen).not.toHaveBeenCalled();
      expect(host.replayCurrentStage).not.toHaveBeenCalled();
      expect(host.returnToStart).not.toHaveBeenCalled();
    }
  );

  it('removes both window listeners on shutdown', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { flow } = fixture();
    flow.destroy();
    expect(remove).toHaveBeenCalledWith('mateo:pause-request', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('ignores key repeat but permits the next deliberate P press', () => {
    const { flow } = fixture();
    const key = (repeat: boolean) => window.dispatchEvent(
      Object.assign(new Event('keydown'), { key: 'p', repeat })
    );
    key(false);
    expect(flow.isOpen()).toBe(true);
    key(true);
    expect(flow.isOpen()).toBe(true);
    key(false);
    expect(flow.isOpen()).toBe(false);
    flow.destroy();
  });

  it('normal close resumes once, and completed tweens hide all panels', () => {
    const { flow, host, owned, tweens } = fixture();
    flow.toggle();
    flow.close(true);
    flow.close(true);
    expect(host.setRunFrozen).toHaveBeenCalledTimes(2);
    expect(host.setRunFrozen).toHaveBeenLastCalledWith(false);
    tweens.forEach((tween) => tween.onComplete?.());
    expect(owned.every((object) => !object.visible)).toBe(true);
    flow.destroy();
  });

  it('does not open during discovery or resume a resolved run', () => {
    const { flow, host } = fixture();
    vi.mocked(host.isDiscoveryBeatActive).mockReturnValue(true);
    flow.toggle();
    expect(flow.isOpen()).toBe(false);
    vi.mocked(host.isDiscoveryBeatActive).mockReturnValue(false);
    flow.toggle();
    vi.mocked(host.canRestoreRun).mockReturnValue(false);
    flow.close(true);
    expect(host.setRunFrozen).not.toHaveBeenCalledWith(false);
    flow.destroy();
  });
});
