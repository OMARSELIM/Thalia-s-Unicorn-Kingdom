import {
  COMPANION_OPTIONS,
  CROWN_ITEMS,
  FUR_COLORS,
  HORN_STYLES,
  MANE_THEMES,
  PlayerCustomization,
  REALM_DEFINITIONS,
  RealmId,
  WING_STYLES,
} from './types';
import { drawCompanion, drawUnicorn } from './unicornRenderer';

const SNAPSHOT_WIDTH = 480;
const SNAPSHOT_HEIGHT = 270;

export function downscaleCanvasSnapshot(sourceCanvas: HTMLCanvasElement): string {
  try {
    const offscreen = document.createElement('canvas');
    offscreen.width = SNAPSHOT_WIDTH;
    offscreen.height = SNAPSHOT_HEIGHT;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';

    const srcW = sourceCanvas.width || SNAPSHOT_WIDTH;
    const srcH = sourceCanvas.height || SNAPSHOT_HEIGHT;
    const srcRatio = srcW / srcH;
    const dstRatio = SNAPSHOT_WIDTH / SNAPSHOT_HEIGHT;

    let drawX = 0;
    let drawY = 0;
    let drawW = srcW;
    let drawH = srcH;

    if (srcRatio > dstRatio) {
      drawW = srcH * dstRatio;
      drawX = (srcW - drawW) / 2;
    } else if (srcRatio < dstRatio) {
      drawH = srcW / dstRatio;
      drawY = (srcH - drawH) / 2;
    }

    ctx.drawImage(
      sourceCanvas,
      drawX,
      drawY,
      drawW,
      drawH,
      0,
      0,
      SNAPSHOT_WIDTH,
      SNAPSHOT_HEIGHT
    );
    return offscreen.toDataURL('image/jpeg', 0.74);
  } catch {
    return '';
  }
}

export function captureHeroDiscoverySnapshot(
  customization: PlayerCustomization,
  realmId: RealmId,
  heroName: string
): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = SNAPSHOT_WIDTH;
    canvas.height = SNAPSHOT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const realm = REALM_DEFINITIONS.find((r) => r.id === realmId) || REALM_DEFINITIONS[0];
    const fur = FUR_COLORS.find((f) => f.id === customization.furId) || FUR_COLORS[0];
    const mane = MANE_THEMES.find((m) => m.id === customization.maneId) || MANE_THEMES[0];
    const horn = HORN_STYLES.find((h) => h.id === customization.hornId) || HORN_STYLES[0];
    const wings = WING_STYLES.find((w) => w.id === customization.wingId) || WING_STYLES[0];
    const crown = (CROWN_ITEMS.find((c) => c.id === customization.crownId) || CROWN_ITEMS[0]).id;
    const companion =
      COMPANION_OPTIONS.find((c) => c.id === customization.companionId) || COMPANION_OPTIONS[0];

    // Sky backdrop matching realm palette
    const sky = ctx.createLinearGradient(0, 0, 0, SNAPSHOT_HEIGHT);
    sky.addColorStop(0, realm.skyTop);
    sky.addColorStop(0.55, realm.skyMid);
    sky.addColorStop(1, realm.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);

    // Distant rolling hills
    ctx.fillStyle = realm.farLayerColor;
    ctx.beginPath();
    ctx.moveTo(0, SNAPSHOT_HEIGHT);
    for (let x = 0; x <= SNAPSHOT_WIDTH; x += 24) {
      const y = 175 + Math.sin(x * 0.015) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = realm.nearLayerColor;
    ctx.beginPath();
    ctx.moveTo(0, SNAPSHOT_HEIGHT);
    for (let x = 0; x <= SNAPSHOT_WIDTH; x += 24) {
      const y = 205 + Math.cos(x * 0.02 + 1) * 14;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Twinkling stars
    ctx.fillStyle = '#FFFBEB';
    for (let i = 0; i < 24; i++) {
      const sx = ((i * 73) % (SNAPSHOT_WIDTH - 40)) + 20;
      const sy = ((i * 41) % 130) + 16;
      const sr = i % 3 === 0 ? 2.4 : 1.5;
      ctx.globalAlpha = 0.55 + (i % 4) * 0.1;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Platform podium under the hero
    ctx.fillStyle = realm.platformShadow;
    ctx.beginPath();
    ctx.roundRect(115, 200, 250, 26, 13);
    ctx.fill();
    ctx.fillStyle = realm.platformMain;
    ctx.beginPath();
    ctx.roundRect(115, 194, 250, 22, 11);
    ctx.fill();

    // Soft radial golden discovery aura behind hero
    const aura = ctx.createRadialGradient(246, 146, 10, 246, 146, 98);
    aura.addColorStop(0, 'rgba(254, 240, 138, 0.78)');
    aura.addColorStop(0.5, 'rgba(244, 114, 182, 0.28)');
    aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(246, 146, 98, 0, Math.PI * 2);
    ctx.fill();

    // Companion flying beside the unicorn
    drawCompanion(ctx, 162, 104, companion, 1.4, {
      vx: 30,
      vy: -12,
      swooping: true,
    });

    // Newly discovered unicorn hero
    drawUnicorn(ctx, 252, 148, 88, {
      fur,
      mane,
      horn,
      wings,
      crown,
      accessory: customization.accessoryId || 'none',
      time: 1.4,
      scaleX: 1,
      scaleY: 1,
      tilt: -0.06,
      wingFlap: 0.72,
      isGrounded: true,
      isStarRush: true,
    });

    // Subtle celebration label banner at top-right
    ctx.fillStyle = 'rgba(255, 253, 249, 0.88)';
    ctx.strokeStyle = '#F3D5E3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(SNAPSHOT_WIDTH - 208, 14, 194, 34, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9D174D';
    ctx.font = '700 13px "Tajawal", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`اكتشاف: ${heroName}`, SNAPSHOT_WIDTH - 24, 31);

    return canvas.toDataURL('image/jpeg', 0.78);
  } catch {
    return '';
  }
}
