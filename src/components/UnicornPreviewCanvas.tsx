import { useEffect, useRef } from 'react';
import {
  COMPANION_OPTIONS,
  CROWN_ITEMS,
  FUR_COLORS,
  HORN_STYLES,
  MANE_THEMES,
  PlayerCustomization,
  PowerUpgradeId,
  PowerUpgrades,
  WING_STYLES,
} from '../game/types';
import { drawCompanion, drawUnicorn } from '../game/unicornRenderer';

export interface PowerBurstTrigger {
  id: PowerUpgradeId;
  level: number;
  nonce: number;
}

interface PreviewParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  kind: 'star' | 'aura' | 'spark' | 'ring';
  rotation: number;
  spin: number;
}

interface UnicornPreviewCanvasProps {
  customization: PlayerCustomization;
  powerUpgrades?: PowerUpgrades;
  powerBurst?: PowerBurstTrigger | null;
  size?: number;
  className?: string;
}

const POWER_PALETTES: Record<PowerUpgradeId, string[]> = {
  shield: ['#E11D74', '#F472B6', '#FBCFE8', '#FFFDF9'],
  speed: ['#D97706', '#F59E0B', '#FDE047', '#FFFDF9'],
  magnet: ['#0284C7', '#38BDF8', '#BAE6FD', '#FFFDF9'],
};

export function UnicornPreviewCanvas({
  customization,
  powerUpgrades,
  powerBurst = null,
  size = 150,
  className = '',
}: UnicornPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const customRef = useRef(customization);
  customRef.current = customization;
  const upgradesRef = useRef(powerUpgrades);
  upgradesRef.current = powerUpgrades;

  const particlesRef = useRef<PreviewParticle[]>([]);
  const burstGlowTimerRef = useRef(0);
  const burstColorRef = useRef('#F59E0B');
  const lastNonceRef = useRef<number>(0);

  // Spawn an ascending burst of magical particles whenever a store power is upgraded/activated
  useEffect(() => {
    if (!powerBurst || powerBurst.nonce === lastNonceRef.current) return;
    lastNonceRef.current = powerBurst.nonce;

    const palette = POWER_PALETTES[powerBurst.id];
    const cx = size * 0.56;
    const cy = size * 0.62;
    const count = 24 + powerBurst.level * 4;

    burstGlowTimerRef.current = 1.25;
    burstColorRef.current = palette[0];

    // Expanding horizontal magic ring beneath the unicorn
    particlesRef.current.push({
      x: cx,
      y: cy + size * 0.14,
      vx: 0,
      vy: -18,
      size: size * 0.34,
      life: 0.65,
      maxLife: 0.65,
      color: palette[1],
      kind: 'ring',
      rotation: 0,
      spin: 0,
    });

    for (let i = 0; i < count; i++) {
      const spreadX = (Math.random() - 0.5) * size * 0.56;
      const startY = cy + (Math.random() - 0.25) * size * 0.24;
      const riseSpeed = -(55 + Math.random() * 95);
      const driftX = (Math.random() - 0.5) * 32;
      const life = 0.75 + Math.random() * 0.55;
      particlesRef.current.push({
        x: cx + spreadX,
        y: startY,
        vx: driftX,
        vy: riseSpeed,
        size: 3.5 + Math.random() * 4.5,
        life,
        maxLife: life,
        color: palette[i % palette.length],
        kind: i % 3 === 0 ? 'aura' : i % 3 === 1 ? 'star' : 'spark',
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 6,
      });
    }
  }, [powerBurst, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    let rafId = 0;
    const start = performance.now();
    let prev = start;

    const drawMiniStar = (x: number, y: number, r: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r : r * 0.42;
        const ang = (Math.PI * i) / 4;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const t = (now - start) / 1000;
      const cur = customRef.current;
      const ups = upgradesRef.current;

      const fur = FUR_COLORS.find((f) => f.id === cur.furId) || FUR_COLORS[0];
      const mane = MANE_THEMES.find((m) => m.id === cur.maneId) || MANE_THEMES[0];
      const horn = HORN_STYLES.find((h) => h.id === cur.hornId) || HORN_STYLES[0];
      const wings = WING_STYLES.find((w) => w.id === cur.wingId) || WING_STYLES[0];
      const crown = (CROWN_ITEMS.find((c) => c.id === cur.crownId) || CROWN_ITEMS[0]).id;
      const companion =
        COMPANION_OPTIONS.find((c) => c.id === cur.companionId) || COMPANION_OPTIONS[0];

      if (burstGlowTimerRef.current > 0) {
        burstGlowTimerRef.current = Math.max(0, burstGlowTimerRef.current - dt);
      }

      // Gentle ambient rising particles reflecting active store upgrades
      if (ups) {
        const upgradeBonus =
          Math.max(0, ups.shield - 1) +
          Math.max(0, ups.speed - 1) +
          Math.max(0, ups.magnet - 1);
        if (upgradeBonus > 0 && Math.random() < Math.min(0.45, 0.08 + upgradeBonus * 0.03)) {
          const activeIds: PowerUpgradeId[] = [];
          if (ups.shield > 1) activeIds.push('shield');
          if (ups.speed > 1) activeIds.push('speed');
          if (ups.magnet > 1) activeIds.push('magnet');
          const picked = activeIds[Math.floor(Math.random() * activeIds.length)];
          const pal = POWER_PALETTES[picked];
          const life = 0.8 + Math.random() * 0.45;
          particlesRef.current.push({
            x: size * 0.56 + (Math.random() - 0.5) * size * 0.48,
            y: size * 0.72 + (Math.random() - 0.5) * size * 0.14,
            vx: (Math.random() - 0.5) * 16,
            vy: -(32 + Math.random() * 38),
            size: 2.6 + Math.random() * 2.4,
            life,
            maxLife: life,
            color: pal[Math.floor(Math.random() * 3)],
            kind: Math.random() < 0.5 ? 'star' : 'aura',
            rotation: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 4,
          });
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Radiant aura behind unicorn during upgrade burst
      if (burstGlowTimerRef.current > 0) {
        const glowAlpha = Math.sin((burstGlowTimerRef.current / 1.25) * Math.PI) * 0.38;
        const grad = ctx.createRadialGradient(
          size * 0.56,
          size * 0.58,
          4,
          size * 0.56,
          size * 0.58,
          size * 0.44
        );
        grad.addColorStop(0, burstColorRef.current);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.save();
        ctx.globalAlpha = glowAlpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(size * 0.56, size * 0.58, size * 0.44, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      drawCompanion(ctx, size * 0.2, size * 0.28, companion, t);

      drawUnicorn(ctx, size * 0.56, size * 0.58, size * 0.6, {
        fur,
        mane,
        horn,
        wings,
        crown,
        accessory: cur.accessoryId || 'none',
        time: t,
        isGrounded: false,
        wingFlap: 0.25 + Math.sin(t * 2.5) * 0.2,
        tilt: Math.sin(t * 1.8) * 0.04,
        shieldActive: Boolean(ups && ups.shield >= 4),
        isStarRush: burstGlowTimerRef.current > 0,
      });

      // Update & draw rising magical particles above the unicorn
      const list = particlesRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life -= dt;
        if (p.life <= 0) {
          list.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.spin * dt;

        const prog = Math.max(0, p.life / p.maxLife);
        const alpha = p.kind === 'aura' ? Math.sin(prog * Math.PI) * 0.85 : prog;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.kind === 'ring') {
          const expand = 0.35 + (1 - prog) * 0.95;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1.2, 3 * prog);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * expand, p.size * expand * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.kind === 'star') {
          drawMiniStar(p.x, p.y, p.size * (0.65 + prog * 0.35), p.rotation);
        } else if (p.kind === 'aura') {
          const r = p.size * (0.9 + (1 - prog) * 0.5);
          const g = ctx.createRadialGradient(p.x, p.y, 0.5, p.x, p.y, r);
          g.addColorStop(0, '#FFFFFF');
          g.addColorStop(0.45, p.color);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={className}
      aria-label="معاينة اليونيكورن"
    />
  );
}
