import {
  AccessoryId,
  CompanionOption,
  CrownId,
  FurColorOption,
  HornStyleOption,
  ManeTheme,
  WingStyleOption,
} from './types';

export interface UnicornRenderOptions {
  fur: FurColorOption;
  mane: ManeTheme;
  horn: HornStyleOption;
  wings: WingStyleOption;
  crown: CrownId;
  accessory?: AccessoryId;
  time: number;
  scaleX?: number;
  scaleY?: number;
  tilt?: number;
  flipRotation?: number;
  gallopPhase?: number;
  wingFlap?: number; // 0..1
  isGrounded?: boolean;
  isDashing?: boolean;
  isStarRush?: boolean;
  shieldActive?: boolean;
  hurtBlink?: boolean;
  hasMagnet?: boolean;
}

export interface CompanionRenderOptions {
  vx?: number;
  vy?: number;
  swooping?: boolean;
}

export function drawCompanion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  companion: CompanionOption,
  time: number,
  opts: CompanionRenderOptions = {}
) {
  if (companion.id === 'none') return;

  const { vx = 0, vy = 0, swooping = false } = opts;
  const flapFreq = swooping ? 34 : 21;
  const bob = Math.sin(time * 5.8) * (swooping ? 2 : 4.5);
  const flightTilt = Math.max(-0.42, Math.min(0.42, vy * 0.0014 + (vx > 80 ? 0.14 : vx < -80 ? -0.1 : 0)));

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(flightTilt);

  // Soft magical aura behind companion (brightens while swooping to collect stars)
  const auraRadius = swooping ? 24 : 18 + Math.sin(time * 6) * 1.5;
  const auraGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, auraRadius);
  auraGrad.addColorStop(0, swooping ? `${companion.primaryColor}88` : `${companion.primaryColor}48`);
  auraGrad.addColorStop(1, `${companion.primaryColor}00`);
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
  ctx.fill();

  if (companion.id === 'butterfly') {
    const flap = 0.52 + Math.sin(time * flapFreq) * 0.44;
    ctx.save();
    ctx.scale(1, flap);
    ctx.fillStyle = companion.primaryColor;
    ctx.strokeStyle = '#9D174D';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(-6, -6, 10, 6.5, -0.45, 0, Math.PI * 2);
    ctx.ellipse(-5, 6, 7.5, 5, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = companion.accentColor;
    ctx.beginPath();
    ctx.ellipse(-6, -6, 4.2, 2.6, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#4A1D6E';
    ctx.beginPath();
    ctx.ellipse(2, 0, 6.2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#4A1D6E';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(6, -1);
    ctx.quadraticCurveTo(10, -6, 12, -5);
    ctx.moveTo(6, 1);
    ctx.quadraticCurveTo(10, -2, 12, -1);
    ctx.stroke();
  } else {
    // Magical Small Bird (العصفور توت) with multi-part flying animation
    const wingFlap = Math.sin(time * flapFreq);
    const tailWag = Math.sin(time * 9) * 2.5;

    // Back Wing (behind body)
    ctx.save();
    ctx.translate(-1, -4);
    ctx.rotate(-0.4 + wingFlap * 0.72);
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-8, -14, -15, -6);
    ctx.quadraticCurveTo(-8, -1, 0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Animated Tail Feathers
    ctx.fillStyle = companion.accentColor;
    ctx.beginPath();
    ctx.moveTo(-8, 1);
    ctx.lineTo(-19, -5 + tailWag);
    ctx.lineTo(-16, 1 + tailWag * 0.5);
    ctx.lineTo(-18, 6 + tailWag);
    ctx.closePath();
    ctx.fill();

    // Plump Bird Body
    ctx.fillStyle = companion.primaryColor;
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.ellipse(0, 1, 10.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Soft Cream Belly
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.ellipse(2, 4, 6.5, 4.2, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Magical Feather Crest + Tiny Star Spark
    ctx.strokeStyle = companion.accentColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.quadraticCurveTo(-1, -13, -5, -12);
    ctx.stroke();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(-5, -12, swooping ? 2.4 : 1.7, 0, Math.PI * 2);
    ctx.fill();

    // Front Flapping Wing
    ctx.save();
    ctx.translate(-2, 0);
    ctx.rotate(wingFlap * 0.85);
    ctx.fillStyle = '#FFFBEB';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.quadraticCurveTo(-5, -13, -13, -4);
    ctx.quadraticCurveTo(-6, 4, 3, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Rosy Cheek
    ctx.fillStyle = 'rgba(244, 114, 182, 0.55)';
    ctx.beginPath();
    ctx.arc(4.5, 1.5, 2.1, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(9.5, -1.5);
    ctx.lineTo(16, 0.5);
    ctx.lineTo(9.5, 2.5);
    ctx.closePath();
    ctx.fill();

    // Expressive Eye with white sparkle
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.arc(5.5, -2.2, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(6.1, -2.8, 0.75, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawUnicorn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opts: UnicornRenderOptions
) {
  const {
    fur,
    mane,
    horn,
    wings,
    crown,
    accessory = 'none',
    time,
    scaleX = 1,
    scaleY = 1,
    tilt = 0,
    flipRotation = 0,
    gallopPhase = time * 10,
    wingFlap = 0,
    isGrounded = true,
    isDashing = false,
    isStarRush = false,
    shieldActive = false,
    hurtBlink = false,
    hasMagnet = false,
  } = opts;

  ctx.save();
  if (hurtBlink && Math.floor(time * 20) % 2 === 0) {
    ctx.globalAlpha = 0.42;
  }

  const s = size / 64;
  ctx.translate(x, y);

  // Soft continuous magical luminescence around the unicorn
  const ambientPulse = 1 + Math.sin(time * 3.6) * 0.08;
  const ambientRadius = 44 * s * ambientPulse;
  const ambientGrad = ctx.createRadialGradient(0, -2 * s, 4 * s, 0, -2 * s, ambientRadius);
  ambientGrad.addColorStop(0, `${mane.colors[2]}40`);
  ambientGrad.addColorStop(0.55, `${mane.colors[0]}1E`);
  ambientGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = ambientGrad;
  ctx.beginPath();
  ctx.arc(0, -2 * s, ambientRadius, 0, Math.PI * 2);
  ctx.fill();

  // Magnet aura ring
  if (hasMagnet) {
    const pulse = 1 + Math.sin(time * 8) * 0.07;
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.arc(0, -4 * s, 46 * s * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Pearl Shield bubble
  if (shieldActive) {
    const sPulse = 1 + Math.sin(time * 6) * 0.04;
    ctx.save();
    ctx.fillStyle = 'rgba(244, 114, 182, 0.16)';
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.72)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, -2 * s, 40 * s * sPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(-14 * s, -18 * s, 6 * s, 2.8 * s, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Light Dash / Star Rush aura
  if (isDashing || isStarRush) {
    const grad = ctx.createRadialGradient(0, 0, 8 * s, 0, 0, 50 * s);
    grad.addColorStop(0, 'rgba(255, 253, 240, 0.78)');
    grad.addColorStop(0.55, isStarRush ? 'rgba(251, 191, 36, 0.45)' : `${mane.colors[1]}66`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 50 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.rotate(tilt + flipRotation);
  ctx.scale(scaleX * s, scaleY * s);

  const bob = isGrounded ? Math.sin(gallopPhase * 2) * 1.8 : Math.sin(time * 5) * 1.4;
  ctx.translate(0, bob);

  // Flowing Tail
  mane.colors.forEach((col, i) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 6 - i * 0.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const tailY = -2 + i * 2.2;
    const wave1 = Math.sin(time * 9 + i * 0.7) * 5;
    const wave2 = Math.cos(time * 7 + i * 0.9) * 7;
    ctx.moveTo(-20, tailY);
    ctx.bezierCurveTo(-34, tailY - 4 + wave1, -42, tailY + 6 + wave2, -52 - i * 2, tailY + 2 + wave1);
    ctx.stroke();
  });

  // Back Legs
  const backLegAngle = isGrounded ? Math.sin(gallopPhase + Math.PI) * 0.48 : 0.35;
  const frontBackLegAngle = isGrounded ? Math.sin(gallopPhase) * 0.45 : -0.32;
  drawLeg(ctx, -14, 11, backLegAngle, fur.bellyColor, fur.hoofColor);
  drawLeg(ctx, 11, 11, frontBackLegAngle, fur.bellyColor, fur.hoofColor);

  // Body
  ctx.fillStyle = fur.bodyColor;
  ctx.strokeStyle = 'rgba(88, 42, 102, 0.22)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(-2, 2, 22, 13.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = fur.bellyColor;
  ctx.beginPath();
  ctx.ellipse(-1, 8, 15, 6.5, 0, 0, Math.PI);
  ctx.fill();

  // Front Legs
  const frontLegAngle = isGrounded ? Math.sin(gallopPhase + 0.6) * 0.52 : -0.45;
  const rearFrontLegAngle = isGrounded ? Math.sin(gallopPhase + Math.PI + 0.5) * 0.46 : 0.42;
  drawLeg(ctx, -11, 12, rearFrontLegAngle, fur.bodyColor, fur.hoofColor);
  drawLeg(ctx, 13, 12, frontLegAngle, fur.bodyColor, fur.hoofColor);

  if (accessory !== 'none') {
    drawBodyAccessory(ctx, accessory, time);
  }

  if (wings.id !== 'none') {
    drawWings(ctx, wings, time, wingFlap);
  }

  // Neck & Head
  ctx.save();
  ctx.translate(15, -8);
  ctx.rotate(isDashing ? 0.12 : 0);

  ctx.fillStyle = fur.bodyColor;
  ctx.strokeStyle = 'rgba(88, 42, 102, 0.22)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-7, 10);
  ctx.quadraticCurveTo(-5, -8, 2, -14);
  ctx.lineTo(13, -10);
  ctx.quadraticCurveTo(9, 4, 5, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  mane.colors.forEach((col, i) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 4.6 - i * 0.4;
    ctx.lineCap = 'round';
    const mWave = Math.sin(time * 10 + i * 0.8) * 2.5;
    ctx.beginPath();
    ctx.moveTo(-2, -12 + i * 3.5);
    ctx.quadraticCurveTo(-11 + mWave, -9 + i * 3.5, -14 + mWave, -2 + i * 3.5);
    ctx.stroke();
  });

  ctx.fillStyle = fur.bodyColor;
  ctx.beginPath();
  ctx.moveTo(1, -18);
  ctx.lineTo(4, -27);
  ctx.lineTo(9, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = fur.bellyColor;
  ctx.beginPath();
  ctx.moveTo(3, -19);
  ctx.lineTo(4.5, -24);
  ctx.lineTo(7, -19);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = fur.bodyColor;
  ctx.beginPath();
  ctx.ellipse(9, -12, 12.5, 10, 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = fur.bellyColor;
  ctx.beginPath();
  ctx.ellipse(18, -10, 6.2, 5.2, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(244, 114, 182, 0.42)';
  ctx.beginPath();
  ctx.ellipse(12, -7.5, 3.2, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#9D4E7B';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(18, -9.5, 2.6, 0.15, 1.3);
  ctx.stroke();

  const isBlinking = time % 3.8 > 3.66;
  if (isBlinking) {
    ctx.strokeStyle = fur.eyeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(10, -13, 3, 0.1, Math.PI - 0.1);
    ctx.stroke();
  } else {
    ctx.fillStyle = fur.eyeColor;
    ctx.beginPath();
    ctx.ellipse(10.5, -13, 3.1, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(11.6, -14.3, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9.6, -11.8, 0.65, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = mane.colors[0];
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(7, -21);
  ctx.quadraticCurveTo(14, -22, 16, -17);
  ctx.stroke();

  drawHorn(ctx, horn, time);

  if (crown !== 'none') {
    drawCrown(ctx, 4, -22, crown);
  }

  if (accessory !== 'none') {
    drawCollarAccessory(ctx, accessory, time);
  }

  ctx.restore();
  ctx.restore();
}

function drawWings(
  ctx: CanvasRenderingContext2D,
  wings: WingStyleOption,
  time: number,
  wingFlap: number
) {
  ctx.save();
  const flapAngle = -0.35 + Math.sin(time * 12) * 0.14 - wingFlap * 0.85;
  ctx.translate(-3, -4);
  ctx.rotate(flapAngle);

  if (wings.id === 'butterfly') {
    ctx.fillStyle = wings.primaryColor;
    ctx.strokeStyle = 'rgba(131, 24, 67, 0.28)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-12, -24, -30, -18, -22, -3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = wings.secondaryColor;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.bezierCurveTo(-20, -2, -24, 12, -8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-14, -10, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (wings.id === 'crystal') {
    ctx.fillStyle = wings.primaryColor;
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -20);
    ctx.lineTo(-27, -11);
    ctx.lineTo(-20, 2);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = wings.secondaryColor;
    ctx.beginPath();
    ctx.moveTo(-2, -1);
    ctx.lineTo(-10, -14);
    ctx.lineTo(-19, -8);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = wings.primaryColor;
    ctx.strokeStyle = 'rgba(88, 42, 102, 0.24)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-10, -18, -26, -15, -24, -4);
    ctx.bezierCurveTo(-18, 2, -10, 4, 0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = wings.secondaryColor;
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.ellipse(-11, -5, 7, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHorn(ctx: CanvasRenderingContext2D, horn: HornStyleOption, time: number) {
  ctx.save();
  ctx.translate(12, -20);
  ctx.rotate(0.45);

  const hornGrad = ctx.createLinearGradient(0, 0, 0, -18);
  hornGrad.addColorStop(0, horn.baseColor);
  hornGrad.addColorStop(1, horn.tipColor);

  ctx.fillStyle = hornGrad;
  ctx.strokeStyle = horn.baseColor;
  ctx.lineWidth = 1.1;

  if (horn.id === 'crystal-aqua') {
    ctx.beginPath();
    ctx.moveTo(-3.6, 0);
    ctx.lineTo(-2.2, -10);
    ctx.lineTo(0, -19);
    ctx.lineTo(2.2, -10);
    ctx.lineTo(3.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = horn.accentColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -18);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-3.2, 0);
    ctx.lineTo(0, -18);
    ctx.lineTo(3.2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (horn.id === 'pearl-rose') {
      ctx.fillStyle = horn.accentColor;
      for (const py of [-4, -9, -14]) {
        ctx.beginPath();
        ctx.arc(0, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (horn.id === 'star-glow') {
      const glowPulse = 1 + Math.sin(time * 8) * 0.2;
      ctx.fillStyle = horn.accentColor;
      ctx.beginPath();
      ctx.arc(0, -18, 2.5 * glowPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(-2, -5);
      ctx.lineTo(2, -7);
      ctx.moveTo(-1.3, -10);
      ctx.lineTo(1.3, -12);
      ctx.stroke();
    } else {
      ctx.strokeStyle = horn.accentColor;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-2, -4);
      ctx.lineTo(2, -6);
      ctx.moveTo(-1.3, -9);
      ctx.lineTo(1.3, -11);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawLeg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  legColor: string,
  hoofColor: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = legColor;
  ctx.strokeStyle = 'rgba(88, 42, 102, 0.2)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-3.2, 0, 6.4, 14, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = hoofColor;
  ctx.beginPath();
  ctx.roundRect(-3.4, 10.5, 6.8, 4.2, 2);
  ctx.fill();
  ctx.restore();
}

function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, crown: CrownId) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);

  if (crown === 'flower') {
    const petals = ['#E11D74', '#FBBF24', '#F472B6'];
    petals.forEach((col, i) => {
      const fx = (i - 1) * 5;
      const fy = Math.abs(i - 1) * 1.5;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(fx, fy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (crown === 'star') {
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, 2);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-3, -2);
    ctx.lineTo(0, -9);
    ctx.lineTo(3, -2);
    ctx.lineTo(8, -5);
    ctx.lineTo(7, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E11D74';
    ctx.beginPath();
    ctx.arc(0, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (crown === 'crystal') {
    ctx.fillStyle = '#E0F2FE';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, 2);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-2, -1);
    ctx.lineTo(0, -11);
    ctx.lineTo(2, -1);
    ctx.lineTo(5, -6);
    ctx.lineTo(7, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#EC4899';
    ctx.beginPath();
    ctx.arc(0, -3.5, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBodyAccessory(ctx: CanvasRenderingContext2D, accessory: AccessoryId, time: number) {
  ctx.save();
  if (accessory === 'star-anklet') {
    // Sparkly golden saddle sash with twinkling star
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(-2, -1, 13.5, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();

    const pulse = 1 + Math.sin(time * 7) * 0.14;
    ctx.translate(-2, -3);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#FEF08A';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 4.4 : 2;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (accessory === 'rose-ribbon') {
    // Silky satin saddle ribbon trailing gently
    const flutter = Math.sin(time * 10) * 2.4;
    ctx.strokeStyle = '#E11D74';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.quadraticCurveTo(-16, -8 + flutter, -26, -3 + flutter);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCollarAccessory(ctx: CanvasRenderingContext2D, accessory: AccessoryId, time: number) {
  ctx.save();
  ctx.translate(2, 6);

  if (accessory === 'pearl-necklace') {
    const pearls = [-5, -2.5, 0, 2.5, 5];
    pearls.forEach((px, idx) => {
      const py = Math.abs(idx - 2) * -0.9 + 2;
      ctx.fillStyle = '#FFFDF9';
      ctx.strokeStyle = '#F3D5E3';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    // Gold charm pendant
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(0, 5.2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (accessory === 'rose-ribbon') {
    const wave = Math.sin(time * 11) * 1.5;
    ctx.strokeStyle = '#E11D74';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.quadraticCurveTo(0, 3, 6, -1);
    ctx.stroke();

    // Ribbon bow & trailing tails
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.ellipse(-2.5, 2.5, 3.2, 1.8, -0.3, 0, Math.PI * 2);
    ctx.ellipse(2.5, 2.5, 3.2, 1.8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#BE185D';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-1, 3);
    ctx.lineTo(-5, 8 + wave * 0.4);
    ctx.moveTo(1, 3);
    ctx.lineTo(4, 8 - wave * 0.4);
    ctx.stroke();
  } else if (accessory === 'nile-collar') {
    // Broad Egyptian turquoise-and-gold collar
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.arc(0, -4, 7.5, 0.35, Math.PI - 0.35);
    ctx.stroke();
    ctx.strokeStyle = '#0D9488';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -4, 6.2, 0.45, Math.PI - 0.45);
    ctx.stroke();
    // Tiny Ankh charm
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 5.5, 1.8, 0, Math.PI * 2);
    ctx.moveTo(0, 7.3);
    ctx.lineTo(0, 11);
    ctx.moveTo(-2.2, 8.8);
    ctx.lineTo(2.2, 8.8);
    ctx.stroke();
  } else if (accessory === 'star-anklet') {
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.quadraticCurveTo(0, 3.5, 6, -1);
    ctx.stroke();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(0, 4.2, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (accessory === 'lotus-brooch') {
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.quadraticCurveTo(0, 3.2, 6, -1);
    ctx.stroke();
    // Lotus petal jewel
    ctx.fillStyle = '#E11D74';
    ctx.beginPath();
    ctx.ellipse(-2.6, 3.5, 2.4, 1.5, -0.5, 0, Math.PI * 2);
    ctx.ellipse(2.6, 3.5, 2.4, 1.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.ellipse(0, 2.8, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(0, 3.8, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
