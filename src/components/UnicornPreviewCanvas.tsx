import { useEffect, useRef } from 'react';
import {
  COMPANION_OPTIONS,
  CROWN_ITEMS,
  FUR_COLORS,
  HORN_STYLES,
  MANE_THEMES,
  PlayerCustomization,
  WING_STYLES,
} from '../game/types';
import { drawCompanion, drawUnicorn } from '../game/unicornRenderer';

interface UnicornPreviewCanvasProps {
  customization: PlayerCustomization;
  size?: number;
  className?: string;
}

export function UnicornPreviewCanvas({
  customization,
  size = 150,
  className = '',
}: UnicornPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const customRef = useRef(customization);
  customRef.current = customization;

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

    const renderFrame = (now: number) => {
      const t = (now - start) / 1000;
      const cur = customRef.current;
      const fur = FUR_COLORS.find((f) => f.id === cur.furId) || FUR_COLORS[0];
      const mane = MANE_THEMES.find((m) => m.id === cur.maneId) || MANE_THEMES[0];
      const horn = HORN_STYLES.find((h) => h.id === cur.hornId) || HORN_STYLES[0];
      const wings = WING_STYLES.find((w) => w.id === cur.wingId) || WING_STYLES[0];
      const crown = (CROWN_ITEMS.find((c) => c.id === cur.crownId) || CROWN_ITEMS[0]).id;
      const companion =
        COMPANION_OPTIONS.find((c) => c.id === cur.companionId) || COMPANION_OPTIONS[0];

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

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
      });

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
