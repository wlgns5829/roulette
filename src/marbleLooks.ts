import { drawCuteLunchMonster, getCuteMonsterPalette } from './cuteMonster';
import type { MarbleStyle } from './types/MarbleStyle.type';

type MarbleLookOptions = {
  x: number;
  y: number;
  size: number;
  hue: number;
  seed: number;
  rotation?: number;
  bounce?: number;
  glow?: string;
  flipY?: boolean;
};

function drawClassicMarble(
  ctx: CanvasRenderingContext2D,
  { x, y, size, hue, rotation = 0, bounce = 0, glow, flipY = false }: MarbleLookOptions
) {
  const radius = size * 0.64;
  const stretch = 1 + Math.min(1, bounce) * 0.05;

  ctx.save();
  ctx.translate(x, y);
  if (flipY) {
    ctx.scale(1, -1);
  }
  ctx.rotate(rotation * 0.1);
  ctx.scale(stretch, 1 - Math.min(1, bounce) * 0.04);

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = radius * 0.34;
  }

  const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.45, radius * 0.16, 0, 0, radius * 1.15);
  gradient.addColorStop(0, 'rgba(255,255,255,0.96)');
  gradient.addColorStop(0.24, `hsl(${Math.round(hue)} 88% 80%)`);
  gradient.addColorStop(0.62, `hsl(${Math.round(hue + 6)} 82% 62%)`);
  gradient.addColorStop(1, `hsl(${Math.round(hue + 12)} 74% 40%)`);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = `hsla(${Math.round(hue + 14)}, 46%, 28%, 0.55)`;
  ctx.lineWidth = size * 0.05;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.28, -radius * 0.36, radius * 0.2, radius * 0.13, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRetroBuddy(
  ctx: CanvasRenderingContext2D,
  size: number,
  palette: ReturnType<typeof getCuteMonsterPalette>,
  seed: number
) {
  const variant = Math.abs(seed) % 3;
  const lineWidth = size * 0.045;
  const outline = palette.outline;

  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.42, size * 0.34, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  if (variant === 0) {
    ctx.fillStyle = palette.body;
    ctx.beginPath();
    ctx.roundRect(-size * 0.3, -size * 0.12, size * 0.6, size * 0.68, size * 0.22);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.roundRect(-size * 0.34, -size * 0.34, size * 0.68, size * 0.34, size * 0.18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.roundRect(-size * 0.21, -size * 0.21, size * 0.42, size * 0.12, size * 0.08);
    ctx.fill();
  } else if (variant === 1) {
    ctx.fillStyle = palette.cap;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(size * 0.18, -size * 0.1);
    ctx.lineTo(size * 0.5, -size * 0.08);
    ctx.lineTo(size * 0.24, size * 0.1);
    ctx.lineTo(size * 0.32, size * 0.42);
    ctx.lineTo(0, size * 0.24);
    ctx.lineTo(-size * 0.32, size * 0.42);
    ctx.lineTo(-size * 0.24, size * 0.1);
    ctx.lineTo(-size * 0.5, -size * 0.08);
    ctx.lineTo(-size * 0.18, -size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.fillStyle = palette.detail;
    ctx.beginPath();
    ctx.arc(0, -size * 0.08, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = palette.body;
    ctx.beginPath();
    ctx.roundRect(-size * 0.34, -size * 0.18, size * 0.68, size * 0.6, size * 0.26);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.fillStyle = palette.leaf;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 0.18);
    ctx.quadraticCurveTo(-size * 0.28, -size * 0.44, -size * 0.04, -size * 0.42);
    ctx.quadraticCurveTo(0, -size * 0.26, -size * 0.2, -size * 0.18);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(size * 0.06, -size * 0.18);
    ctx.quadraticCurveTo(size * 0.28, -size * 0.44, size * 0.2, -size * 0.16);
    ctx.quadraticCurveTo(size * 0.04, -size * 0.08, size * 0.06, -size * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = palette.eye;
  ctx.beginPath();
  ctx.ellipse(-size * 0.12, size * 0.04, size * 0.038, size * 0.054, 0, 0, Math.PI * 2);
  ctx.ellipse(size * 0.12, size * 0.04, size * 0.038, size * 0.054, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.026;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, size * 0.12, size * 0.08, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawRetroParody(
  ctx: CanvasRenderingContext2D,
  { x, y, size, hue, seed, rotation = 0, bounce = 0, glow, flipY = false }: MarbleLookOptions
) {
  const palette = getCuteMonsterPalette(seed + 7, hue + 24);

  ctx.save();
  ctx.translate(x, y);
  if (flipY) {
    ctx.scale(1, -1);
  }
  ctx.rotate(rotation * 0.08);
  ctx.scale(1 + Math.min(1, bounce) * 0.05, 1 - Math.min(1, bounce) * 0.04);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.24;
  }

  drawRetroBuddy(ctx, size * 1.02, palette, seed);
  ctx.restore();
}

function drawMushroomRunner(
  ctx: CanvasRenderingContext2D,
  { x, y, size, hue, seed, rotation = 0, bounce = 0, glow, flipY = false }: MarbleLookOptions
) {
  const capHue = Math.round(hue + (seed % 3) * 14);
  const capLight = `hsl(${capHue} 92% 66%)`;
  const capBase = `hsl(${capHue} 84% 54%)`;
  const capShadow = `hsl(${capHue} 72% 38%)`;
  const stem = 'rgba(255, 246, 228, 0.98)';
  const stemShade = 'rgba(237, 221, 196, 0.98)';
  const outline = 'rgba(60, 34, 18, 0.72)';
  const spot = `hsla(${capHue + 8}, 96%, 94%, 0.96)`;
  const shoe = `hsl(${capHue + 18} 42% 28%)`;
  const squash = Math.min(1, bounce);

  ctx.save();
  ctx.translate(x, y);
  if (flipY) {
    ctx.scale(1, -1);
  }
  ctx.rotate(rotation * 0.05);
  ctx.scale(1 + squash * 0.06, 1 - squash * 0.05);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.22;
  }

  ctx.fillStyle = 'rgba(24, 18, 12, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.45, size * 0.36, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = shoe;
  ctx.beginPath();
  ctx.ellipse(-size * 0.16, size * 0.35, size * 0.12, size * 0.08, -0.18, 0, Math.PI * 2);
  ctx.ellipse(size * 0.16, size * 0.35, size * 0.12, size * 0.08, 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = stem;
  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.045;
  ctx.beginPath();
  ctx.roundRect(-size * 0.18, -size * 0.02, size * 0.36, size * 0.42, size * 0.18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = stemShade;
  ctx.beginPath();
  ctx.roundRect(-size * 0.04, 0, size * 0.08, size * 0.36, size * 0.05);
  ctx.fill();

  const capGradient = ctx.createLinearGradient(0, -size * 0.54, 0, size * 0.02);
  capGradient.addColorStop(0, capLight);
  capGradient.addColorStop(0.52, capBase);
  capGradient.addColorStop(1, capShadow);
  ctx.fillStyle = capGradient;
  ctx.beginPath();
  ctx.moveTo(-size * 0.48, -size * 0.02);
  ctx.quadraticCurveTo(-size * 0.44, -size * 0.52, 0, -size * 0.56);
  ctx.quadraticCurveTo(size * 0.44, -size * 0.52, size * 0.48, -size * 0.02);
  ctx.quadraticCurveTo(size * 0.18, size * 0.08, 0, size * 0.06);
  ctx.quadraticCurveTo(-size * 0.18, size * 0.08, -size * 0.48, -size * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = spot;
  [
    [-0.22, -0.28, 0.1],
    [0, -0.36, 0.12],
    [0.22, -0.22, 0.09],
  ].forEach(([sx, sy, r]) => {
    ctx.beginPath();
    ctx.arc(size * sx, size * sy, size * r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(32, 20, 12, 0.92)';
  ctx.beginPath();
  ctx.ellipse(-size * 0.08, size * 0.12, size * 0.032, size * 0.05, 0, 0, Math.PI * 2);
  ctx.ellipse(size * 0.08, size * 0.12, size * 0.032, size * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(92, 58, 38, 0.82)';
  ctx.lineWidth = size * 0.022;
  ctx.beginPath();
  ctx.arc(0, size * 0.19, size * 0.07, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
}

export function drawMarbleLook(ctx: CanvasRenderingContext2D, options: MarbleLookOptions, style: MarbleStyle) {
  switch (style) {
    case 'classic':
      drawClassicMarble(ctx, options);
      break;
    case 'mushroom':
      drawMushroomRunner(ctx, options);
      break;
    case 'retro':
      drawRetroParody(ctx, options);
      break;
    case 'sprite':
      drawClassicMarble(ctx, options);
      break;
    default:
      drawCuteLunchMonster(ctx, options);
      break;
  }
}
