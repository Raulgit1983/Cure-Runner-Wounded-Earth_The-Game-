import { uiText } from '@/ui/nativeText';
import Phaser from 'phaser';

/**
 * Shared rounded panel button used by every in-game overlay (pause, help,
 * fail, finish, continuation). Moved verbatim out of JourneyScene so overlay
 * modules and the scene build identical buttons from one factory.
 */
export const createPanelButton = (
  scene: Phaser.Scene,
  label: string,
  width: number,
  onPress: () => void,
  fontSize = '15px'
) => {
  const panel = scene.add.graphics();
  panel.fillStyle(0x121a21, 0.94);
  panel.lineStyle(2, 0xdde8cf, 0.16);
  panel.fillRoundedRect(-width * 0.5, -23, width, 46, 14);
  panel.strokeRoundedRect(-width * 0.5, -23, width, 46, 14);
  panel.fillStyle(0xf4ffd8, 0.03);
  panel.fillRoundedRect(-width * 0.5 + 8, -10, width - 16, 8, 10);

  const text = uiText(scene, 0, 0, label, {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: `${Math.max(15, parseFloat(fontSize))}px`,
      fontStyle: 'bold',
      color: '#f7f6ec',
      stroke: '#0a1015',
      strokeThickness: 1,
      align: 'center'
    })
    .setOrigin(0.5)
    .setResolution(2);

  const hit = scene.add
    .rectangle(0, 0, width, 46, 0x000000, 0.001)
    .setInteractive({ useHandCursor: true });

  const button = scene.add.container(0, 0, [panel, text, hit]).setSize(width, 46);

  hit.on(
    'pointerdown',
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData
    ) => {
      event.stopPropagation();
      onPress();
    }
  );
  hit.on('pointerover', () => {
    button.setScale(1).setAlpha(1);
  });
  hit.on('pointerout', () => {
    button.setScale(1).setAlpha(0.98);
  });

  return button.setAlpha(0.98);
};
